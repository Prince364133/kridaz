import { prisma } from "../../config/prisma.js";
import { generateShortId, computeScoreSnapshot } from "./scoring.utils.js";
import { aggregatePlayerStats } from "./scoring.service.js";
import { liveStateService } from "../../services/liveState.service.js";
import { commentaryService } from "../../services/commentary.service.js";
import { getIO } from "../../config/socket.js";
import jwt from "jsonwebtoken";
import logger from "../../utils/logger.js";
import { SOCKET } from "@kridaz/shared-constants/socketEvents";


/**
 * Initialize a Live Stream overlay session
 */
export const goLive = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const hostedGame = await prisma.hostedGame.findUnique({ where: { id: matchId } });
    if (!hostedGame) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    // Generate secure token for OBS overlay
    if (!process.env.OVERLAY_TOKEN_SECRET) {
      logger.error('[FATAL] OVERLAY_TOKEN_SECRET env var is not set.');
      return res.status(500).json({ success: false, message: 'Server configuration error: overlay token secret not set.' });
    }
    const overlayToken = jwt.sign(
      { matchId: hostedGame.id, type: 'OBS_OVERLAY' }, 
      process.env.OVERLAY_TOKEN_SECRET, 
      { expiresIn: '12h' }
    );

    await prisma.hostedGame.update({
      where: { id: matchId },
      data: {
        isLive: true,
        overlayToken: overlayToken,
        streamStatus: 'starting',
        liveStartedAt: new Date()
      }
    });

    // Initialize Redis state — errors here are non-fatal; log and continue
    const overlayConfig = hostedGame.overlayConfig || { showScoreboard: true, showCommentary: true };
    try {
      await liveStateService.setStreamStatus(matchId, 'starting');
      await liveStateService.setOverlayConfig(matchId, overlayConfig);
    } catch (redisErr) {
      logger.warn("[Scoring] Redis state init failed (non-fatal):", redisErr.message);
    }

    const appBase = process.env.USER_URL || process.env.CLIENT_URLS?.split(",")[0] || "https://kridaz.com";
    res.status(200).json({ 
      success: true, 
      overlayToken,
      streamStatus: 'starting',
      youtubeVideoId: hostedGame.youtubeVideoId,
      urls: {
        obsOverlay: `${appBase}/live-overlay/${matchId}?token=${overlayToken}`,
        publicScoreboard: `${appBase}/live-score/${matchId}`
      }
    });
  } catch (error) {
    logger.error("[Scoring] Go Live Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * End Live Broadcast
 */
export const endLive = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const hostedGame = await prisma.hostedGame.findUnique({ where: { id: matchId } });
    if (!hostedGame) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    await prisma.hostedGame.update({
      where: { id: matchId },
      data: {
        isLive: false,
        overlayToken: null,
        streamStatus: 'ended'
      }
    });

    // Redis cleanup — non-fatal
    try {
      await liveStateService.setStreamStatus(matchId, 'ended');
    } catch (redisErr) {
      logger.warn("[Scoring] Redis cleanup failed (non-fatal):", redisErr.message);
    }

    res.status(200).json({ success: true, message: "Live stream ended." });
  } catch (error) {
    logger.error("[Scoring] End Live Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update YouTube Stream Configuration
 * Body: { youtubeVideoId, youtubeLiveChatId }
 */
export const updateStreamConfig = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { youtubeVideoId, youtubeLiveChatId } = req.body;

    const hostedGame = await prisma.hostedGame.findUnique({ where: { id: matchId } });
    if (!hostedGame) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    const streamStatus = youtubeVideoId ? 'online' : 'offline';

    await prisma.hostedGame.update({
      where: { id: matchId },
      data: {
        streamConfig: {
          upsert: {
            create: { youtubeVideoId, youtubeLiveChatId },
            update: { youtubeVideoId, youtubeLiveChatId }
          }
        },
        streamStatus: streamStatus
      }
    });

    await liveStateService.setStreamStatus(matchId, streamStatus);

    res.status(200).json({ success: true, message: "Stream configuration updated", streamStatus: streamStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const completeMatch = async (req, res) => {
  try {
    const { scoringId } = req.body;
    const scoring = await prisma.cricketMatch.findUnique({
      where: { id: scoringId },
      include: { innings: true, playerStats: true }
    });
    
    if (!scoring) {
      return res.status(404).json({ success: false, message: "Scoring session not found" });
    }

    await prisma.$transaction([
      prisma.cricketMatch.update({
        where: { id: scoringId },
        data: { status: "COMPLETED" }
      }),
      prisma.hostedGame.update({
        where: { id: scoring.gameId },
        data: {
          scoringStatus: "COMPLETED",
          status: "COMPLETED"
        }
      })
    ]);

    const match = await prisma.hostedGame.findUnique({ where: { id: scoring.gameId } });
    
    // Trigger aggregation
    const earnedBadges = await aggregatePlayerStats(scoring, match);

    res.status(200).json({ 
      success: true, 
      message: "Match completed and stats aggregated",
      earnedBadges
    });
  } catch (error) {
    logger.error("[Scoring] Complete Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchMatch = async (req, res) => {
  try {
    const { shortId } = req.params;
    const match = await prisma.hostedGame.findFirst({
      where: { shortId: shortId.toUpperCase() },
      include: {
        host: { select: { id: true, name: true, profilePicture: true } },
        ground: true
      }
    });

    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    res.status(200).json({ success: true, match });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Initialize a scoring session
 */
export const startScoring = async (req, res) => {
  try {
    const { matchId, battingTeamId, battingTeam } = req.body;
    const finalBattingTeam = battingTeamId || battingTeam || "teamA";
    
    const umpireId = req.user?.id;

    if (!umpireId) {
      return res.status(401).json({ success: false, message: "Umpire identity not found. Please log in again." });
    }

    const hostedGame = await prisma.hostedGame.findUnique({
      where: { id: matchId },
      include: {
        host: true,
        umpire: true
      }
    });
    
    if (!hostedGame) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    const userRole = req.user?.role;
    const isAdmin = userRole?.toUpperCase() === 'ADMIN';
    
    const isAuthorized = 
      isAdmin ||
      hostedGame.umpireId === umpireId || 
      hostedGame.hostId === umpireId;

    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false, 
        message: "Authorization failed. Only the assigned umpire, host, or admin can score this match."
      });
    }

    let scoring = await prisma.cricketMatch.findUnique({
      where: { gameId: matchId },
      include: {
        innings: true,
        playerStats: true,
        timeline: { take: 5, orderBy: { timestamp: 'desc' } }
      }
    });

    if (!scoring) {
      scoring = await prisma.cricketMatch.create({
        data: {
          gameId: matchId,
          status: "LIVE",
          oversPerInnings: hostedGame.oversPerInnings,
          innings: {
            create: {
              inningsIndex: 0,
              battingTeam: finalBattingTeam,
              extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 }
            }
          }
        },
        include: {
          innings: true,
          playerStats: true,
          timeline: true
        }
      });

      await prisma.hostedGame.update({
        where: { id: matchId },
        data: { scoringStatus: "IN_PROGRESS" }
      });
    }

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    logger.error("[Scoring] Start Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const startNextInnings = async (req, res) => {
  try {
    const { scoringId, battingTeamId } = req.body;
    
    const scoring = await prisma.cricketMatch.findUnique({
      where: { id: scoringId },
      include: { innings: true }
    });
    if (!scoring) return res.status(404).json({ success: false, message: "Scoring session not found" });

    await prisma.$transaction([
      // 1. Mark previous innings as complete
      prisma.innings.updateMany({
        where: { matchId: scoringId, inningsIndex: 0 },
        data: { isCompleted: true }
      }),
      // 2. Create new innings
      prisma.innings.create({
        data: {
          matchId: scoringId,
          inningsIndex: 1,
          battingTeam: battingTeamId,
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 }
        }
      }),
      // 3. Update match state
      prisma.cricketMatch.update({
        where: { id: scoringId },
        data: {
          currentInningsIndex: 1,
          strikerId: null,
          nonStrikerId: null,
          bowlerId: null
        }
      })
    ]);

    const updatedScoring = await prisma.cricketMatch.findUnique({
      where: { id: scoringId },
      include: { innings: true, playerStats: true }
    });

    const match = await prisma.hostedGame.findUnique({ where: { id: scoring.gameId } });
    const liveData = computeScoreSnapshot(updatedScoring, match);
    await liveStateService.setLiveScore(scoring.gameId, liveData);
    
    const io = getIO();
    if (io) io.to(scoring.gameId).emit(SOCKET.SCORE_UPDATED, liveData);

    res.status(200).json({ success: true, scoring: updatedScoring });
  } catch (error) {
    logger.error("[Scoring] StartNextInnings Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const setToss = async (req, res) => {
  try {
    const { scoringId, winnerTeam, decision } = req.body;
    
    const scoring = await prisma.cricketMatch.update({
      where: { id: scoringId },
      data: {
        tossWinner: winnerTeam,
        tossDecision: decision === "BAT" ? "BAT" : "BOWL"
      }
    });

    res.status(200).json({ success: true, toss: { winnerTeam: scoring.tossWinner, decision: scoring.tossDecision } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Set active players (P1.2) — opening batsmen + bowler, or swap after wicket/over
 * Body: { scoringId, strikerId, nonStrikerId, bowlerId }
 */
export const setPlayers = async (req, res) => {
  try {
    const { scoringId, strikerId, nonStrikerId, bowlerId } = req.body;
    
    const scoring = await prisma.cricketMatch.findUnique({ where: { id: scoringId } });
    if (!scoring) return res.status(404).json({ success: false, message: "Scoring session not found" });

    if (bowlerId && scoring.bowlerId === bowlerId) {
      return res.status(400).json({ success: false, message: "Same bowler cannot bowl consecutive overs" });
    }

    const updateData = {};
    if (bowlerId) {
      updateData.bowlerId = bowlerId;
      // We don't store previousBowler explicitly in schema, but we can if needed. 
      // For now, just update bowlerId.
    }
    if (strikerId) updateData.strikerId = strikerId;
    if (nonStrikerId) updateData.nonStrikerId = nonStrikerId;

    const updated = await prisma.cricketMatch.update({
      where: { id: scoringId },
      data: updateData,
      include: {
        innings: true,
        playerStats: true
      }
    });

    res.status(200).json({ success: true, scoring: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Undo the last ball in the timeline (P1.6)
 */
export const undoLastBall = async (req, res) => {
  try {
    const { scoringId } = req.body;
    
    const scoring = await prisma.cricketMatch.findUnique({
      where: { id: scoringId },
      include: {
        timeline: { orderBy: { timestamp: 'desc' }, take: 1 },
        innings: true
      }
    });

    if (!scoring) return res.status(404).json({ success: false, message: "Scoring session not found" });
    if (!scoring.timeline.length) return res.status(400).json({ success: false, message: "No balls to undo" });

    const lastBall = scoring.timeline[0];
    const currentInnings = scoring.innings.find(i => i.inningsIndex === lastBall.inningsIndex);
    if (!currentInnings) return res.status(400).json({ success: false, message: "Innings not found for undo" });

    const isLegalBall = !lastBall.isExtra || lastBall.extraType === "BYE" || lastBall.extraType === "LEG_BYE";
    const runs = lastBall.runs ?? 0;

    const newExtras = { ...currentInnings.extras };
    if (lastBall.extraType === "WIDE") newExtras.wides = Math.max(0, newExtras.wides - runs);
    else if (lastBall.extraType === "NO_BALL") newExtras.noBalls = Math.max(0, newExtras.noBalls - 1);
    else if (lastBall.extraType === "BYE") newExtras.byes = Math.max(0, newExtras.byes - runs);
    else if (lastBall.extraType === "LEG_BYE") newExtras.legByes = Math.max(0, newExtras.legByes - runs);

    await prisma.$transaction([
      // 1. Delete ball
      prisma.matchBall.delete({ where: { id: lastBall.id } }),
      // 2. Revert innings totals
      prisma.innings.update({
        where: { id: currentInnings.id },
        data: {
          totalRuns: { decrement: runs },
          totalBalls: isLegalBall ? { decrement: 1 } : undefined,
          totalWickets: lastBall.isWicket ? { decrement: 1 } : undefined,
          extras: newExtras
        }
      }),
      // 3. Revert player stats (Note: For simplicity, we just decrement the values. 
      // In a perfect system, we'd recalculate or store pre-ball state, but this matches legacy logic.)
      prisma.matchPlayerStat.updateMany({
        where: { matchId: scoring.id, userId: lastBall.batterId },
        data: {
          runs: { decrement: !["WIDE", "BYE", "LEG_BYE"].includes(lastBall.extraType) ? runs : 0 },
          balls: { decrement: lastBall.extraType !== "WIDE" ? 1 : 0 },
          fours: { decrement: (lastBall.isBoundary && runs === 4) ? 1 : 0 },
          sixes: { decrement: (lastBall.isBoundary && runs === 6) ? 1 : 0 }
        }
      }),
      prisma.matchPlayerStat.updateMany({
        where: { matchId: scoring.id, userId: lastBall.bowlerId },
        data: {
          runsConceded: { decrement: !["BYE", "LEG_BYE"].includes(lastBall.extraType) ? runs : 0 },
          ballsBowled: { decrement: isLegalBall ? 1 : 0 },
          wickets: { decrement: (lastBall.isWicket && !["RUN_OUT", "RETIRED_HURT", "RETIRED_OUT", "OBSTRUCTING", "TIMED_OUT"].includes(lastBall.wicketType)) ? 1 : 0 }
        }
      })
    ]);

    const updatedScoring = await prisma.cricketMatch.findUnique({
      where: { id: scoringId },
      include: { innings: true, playerStats: true }
    });

    res.status(200).json({ success: true, scoring: updatedScoring });
  } catch (error) {
    logger.error("[Scoring] Undo Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update score (Ball-by-ball) — Phase 1 full implementation
 */
export const updateScore = async (req, res) => {
  try {
    const { scoringId, ballData } = req.body;
    
    const scoring = await prisma.cricketMatch.findUnique({
      where: { id: scoringId },
      include: { innings: true }
    });
    if (!scoring) return res.status(404).json({ success: false, message: "Scoring session not found" });

    const currentInnings = scoring.innings.find(i => i.inningsIndex === scoring.currentInningsIndex);
    if (!currentInnings) return res.status(400).json({ success: false, message: "No active innings" });

    const isWide = ballData.extraType === "WIDE";
    const isNoBall = ballData.extraType === "NO_BALL";
    const isBye = ballData.extraType === "BYE";
    const isLegBye = ballData.extraType === "LEG_BYE";
    const runs = ballData.runs ?? 0;

    const strikerId = ballData.batterId || scoring.strikerId;
    const bowlerId = ballData.bowlerId || scoring.bowlerId;
    const nonStrikerId = scoring.nonStrikerId;

    const overNumber = Math.floor(currentInnings.totalBalls / 6);
    const ballInOver = currentInnings.totalBalls % 6;

    const isLegalBall = !isWide && !isNoBall;
    const newExtras = { ...currentInnings.extras };
    if (isWide) newExtras.wides += runs;
    else if (isNoBall) newExtras.noBalls += 1;
    else if (isBye) newExtras.byes += runs;
    else if (isLegBye) newExtras.legByes += runs;

    // Strike Rotation Logic
    let newStrikerId = strikerId;
    let newNonStrikerId = nonStrikerId;
    const isOverComplete = isLegalBall && (ballInOver === 5);

    if (!ballData.isWicket && !isWide) {
      if (runs % 2 !== 0) {
        [newStrikerId, newNonStrikerId] = [newNonStrikerId, newStrikerId];
      }
    }
    if (isOverComplete && !ballData.isWicket) {
      [newStrikerId, newNonStrikerId] = [newNonStrikerId, newStrikerId];
    }
    if (ballData.isWicket && ballData.nextBatterId) {
      newStrikerId = ballData.nextBatterId;
    }

    await prisma.$transaction([
      // 1. Create ball record
      prisma.matchBall.create({
        data: {
          matchId: scoring.id,
          inningsIndex: scoring.currentInningsIndex,
          over: overNumber,
          ballInOver: ballInOver,
          batterId: strikerId,
          bowlerId: bowlerId,
          runs: runs,
          isExtra: ballData.isExtra || false,
          extraType: ballData.extraType || "NONE",
          isBoundary: ballData.isBoundary || false,
          isWicket: ballData.isWicket || false,
          wicketType: ballData.wicketType,
          fielderId: ballData.fielderId
        }
      }),
      // 2. Update Innings
      prisma.innings.update({
        where: { id: currentInnings.id },
        data: {
          totalRuns: { increment: runs },
          totalBalls: isLegalBall ? { increment: 1 } : undefined,
          totalWickets: ballData.isWicket ? { increment: 1 } : undefined,
          extras: newExtras
        }
      }),
      // 3. Update Batter Stats
      ...(strikerId ? [
        prisma.matchPlayerStat.upsert({
          where: { matchId_userId: { matchId: scoring.id, userId: strikerId } },
          update: {
            runs: { increment: (!isWide && !isBye && !isLegBye) ? runs : 0 },
            balls: { increment: !isWide ? 1 : 0 },
            fours: { increment: (ballData.isBoundary && runs === 4) ? 1 : 0 },
            sixes: { increment: (ballData.isBoundary && runs === 6) ? 1 : 0 }
          },
          create: {
            matchId: scoring.id,
            userId: strikerId,
            runs: (!isWide && !isBye && !isLegBye) ? runs : 0,
            balls: !isWide ? 1 : 0,
            fours: (ballData.isBoundary && runs === 4) ? 1 : 0,
            sixes: (ballData.isBoundary && runs === 6) ? 1 : 0
          }
        })
      ] : []),
      // 4. Update Bowler Stats
      ...(bowlerId ? [
        prisma.matchPlayerStat.upsert({
          where: { matchId_userId: { matchId: scoring.id, userId: bowlerId } },
          update: {
            runsConceded: { increment: (!isBye && !isLegBye) ? runs : 0 },
            ballsBowled: { increment: isLegalBall ? 1 : 0 },
            wickets: { increment: (ballData.isWicket && !["RUN_OUT", "RETIRED_HURT", "RETIRED_OUT", "OBSTRUCTING", "TIMED_OUT"].includes(ballData.wicketType)) ? 1 : 0 }
          },
          create: {
            matchId: scoring.id,
            userId: bowlerId,
            runsConceded: (!isBye && !isLegBye) ? runs : 0,
            ballsBowled: isLegalBall ? 1 : 0,
            wickets: (ballData.isWicket && !["RUN_OUT", "RETIRED_HURT", "RETIRED_OUT", "OBSTRUCTING", "TIMED_OUT"].includes(ballData.wicketType)) ? 1 : 0
          }
        })
      ] : []),
      // 5. Update Match State
      prisma.cricketMatch.update({
        where: { id: scoring.id },
        data: {
          strikerId: newStrikerId,
          nonStrikerId: newNonStrikerId
        }
      })
    ]);

    // Fetch updated state for broadcast
    const updatedScoring = await prisma.cricketMatch.findUnique({
      where: { id: scoring.id },
      include: { innings: true, playerStats: true }
    });

    const hostedGame = await prisma.hostedGame.findUnique({ 
      where: { id: scoring.gameId },
      include: { teamA: { include: { slots: true } }, teamB: { include: { slots: true } } }
    });

    // Broadcast logic remains similar but uses Prisma objects
    const liveData = computeScoreSnapshot(updatedScoring, hostedGame);
    await liveStateService.setLiveScore(scoring.gameId, liveData);
    
    const io = getIO();
    if (io) {
      io.to(scoring.gameId).emit(SOCKET.SCORE_UPDATED, liveData);
    }

    res.status(200).json({ success: true, scoring: updatedScoring, liveData });
  } catch (error) {
    logger.error("[Scoring] Update Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * Get current match status
 */
export const getMatchStatus = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const scoring = await prisma.cricketMatch.findUnique({
      where: { gameId: matchId },
      include: {
        innings: true,
        playerStats: { include: { user: { select: { name: true, profilePicture: true } } } },
        timeline: { take: 10, orderBy: { timestamp: 'desc' } }
      }
    });

    if (scoring) {
      return res.status(200).json({ success: true, scoring });
    }

    const hostedGame = await prisma.hostedGame.findUnique({
      where: { id: matchId },
      include: {
        host: { select: { name: true, profilePicture: true } },
        ground: true,
        teamA: { include: { slots: { include: { user: { select: { name: true, profilePicture: true } } } } } },
        teamB: { include: { slots: { include: { user: { select: { name: true, profilePicture: true } } } } } }
      }
    });

    if (!hostedGame) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    return res.status(200).json({ success: true, hostedGame });
  } catch (error) {
    logger.error("[Scoring] Status Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMatchAnalytics = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const scoring = await prisma.cricketMatch.findUnique({
      where: { gameId: matchId },
      include: {
        innings: true,
        playerStats: { include: { user: { select: { name: true, profilePicture: true } } } },
        timeline: { include: { batter: true, bowler: true, fielder: true } }
      }
    });

    if (!scoring) return res.status(404).json({ success: false, message: "Match data not found" });

    // Calculate MVP
    const playerPoints = new Map();
    scoring.playerStats.forEach(s => {
      const pts = (s.runs || 0) + (s.sixes * 2) + (s.fours * 1) + (s.wickets * 25);
      playerPoints.set(s.userId, { name: s.user.name, points: pts, profilePicture: s.user.profilePicture });
    });

    // Fielder points from timeline
    scoring.timeline.forEach(ball => {
      if (ball.isWicket && ball.fielderId) {
        const current = playerPoints.get(ball.fielderId) || { name: ball.fielder?.name || "Fielder", points: 0, profilePicture: ball.fielder?.profilePicture };
        current.points += 10;
        playerPoints.set(ball.fielderId, current);
      }
    });

    const sortedPlayers = Array.from(playerPoints.values()).sort((a, b) => b.points - a.points);
    const mvp = sortedPlayers[0];

    res.status(200).json({ 
      success: true, 
      scoring,
      analytics: {
        mvp,
        topPerformers: sortedPlayers.slice(0, 3),
        totalFours: scoring.playerStats.reduce((acc, curr) => acc + (curr.fours || 0), 0),
        totalSixes: scoring.playerStats.reduce((acc, curr) => acc + (curr.sixes || 0), 0)
      }
    });
  } catch (error) {
    logger.error("[Scoring] Analytics Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLiveScore = async (req, res) => {
  try {
    const { matchId } = req.params;

    // 1. Try Redis cache first (fastest path)
    const cached = await liveStateService.getLiveScore(matchId);
    if (cached) {
      return res.status(200).json({ success: true, data: cached, source: 'redis' });
    }

    // 2. Compute from Prisma as fallback
    const scoring = await prisma.cricketMatch.findUnique({
      where: { gameId: matchId },
      include: { innings: true, playerStats: true }
    });

    if (!scoring) {
      return res.status(404).json({ success: false, message: 'No live score found for this match' });
    }

    const match = await prisma.hostedGame.findUnique({
      where: { id: matchId },
      include: {
        teamA: { include: { slots: { include: { user: { select: { name: true } } } } } },
        teamB: { include: { slots: { include: { user: { select: { name: true } } } } } }
      }
    });

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    const snapshot = computeScoreSnapshot(scoring, match);
    if (!snapshot) {
      return res.status(404).json({ success: false, message: 'Match has not started yet' });
    }

    // Populate Redis for next caller
    await liveStateService.setLiveScore(matchId, snapshot);

    return res.status(200).json({ success: true, data: snapshot, source: 'prisma' });
  } catch (error) {
    logger.error('[Scoring] getLiveScore Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
