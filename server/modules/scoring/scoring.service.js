import { prisma } from "../../config/prisma.js";
import StatsService from "../../services/stats.service.js";
import { liveStateService } from "../../services/liveState.service.js";
import { getIO } from "../../config/socket.js";
import jwt from "jsonwebtoken";
import logger from "../../utils/logger.js";
import { SOCKET } from "@kridaz/shared-constants/socketEvents";
import { computeScoreSnapshot } from "./scoring.utils.js";

/**
 * Mapper helper to structure team A/B and ground details in HostedGame.
 */
const mapHostedGame = (hostedGame) => {
  if (!hostedGame) return null;
  const teamA = hostedGame.teams?.find(t => t.teamKey === "teamA") || { name: "Team A", slots: [] };
  const teamB = hostedGame.teams?.find(t => t.teamKey === "teamB") || { name: "Team B", slots: [] };
  const mapped = {
    ...hostedGame,
    teamA,
    teamB
  };
  if (hostedGame.turf) {
    mapped.ground = hostedGame.turf;
  }
  return mapped;
};

/**
 * Aggregates and updates player statistics after a match is completed.
 * @param {Object} matchScoring - The completed CricketMatch (Prisma) object.
 * @param {Object} hostedGame - The corresponding HostedGame (Prisma) object.
 */
export const aggregatePlayerStats = async (matchScoring, hostedGame) => {
  try {
    const userUpdates = new Map();

    // 0. Extract all relevant user IDs for batch processing
    const playerIds = new Set();
    
    matchScoring.playerStats.forEach(s => playerIds.add(s.userId));
    matchScoring.timeline.filter(t => t.fielderId).forEach(t => playerIds.add(t.fielderId));
    
    if (hostedGame.umpireId) playerIds.add(hostedGame.umpireId);
    if (hostedGame.hostId) playerIds.add(hostedGame.hostId);

    const idsArray = Array.from(playerIds);
    const statsMap = await StatsService.getBatchStats(idsArray);
    
    const usersForNames = await prisma.user.findMany({
      where: { id: { in: idsArray } },
      select: { id: true, name: true }
    });
    const userNameMap = new Map(usersForNames.map(u => [u.id, u.name]));

    const getStatsData = (userId) => {
      const idStr = userId?.toString();
      if (!idStr) return null;
      if (userUpdates.has(idStr)) return userUpdates.get(idStr);
      
      const stats = statsMap.get(idStr) || { cricket: {}, badges: [] };
      if (!stats.cricket) stats.cricket = {};
      
      userUpdates.set(idStr, stats);
      return stats;
    };

    // 1. Process Batting & Bowling Stats from playerStats
    for (const stat of matchScoring.playerStats) {
      const stats = getStatsData(stat.userId);
      if (!stats) continue;

      const cricket = stats.cricket;
      
      // Batting
      if (stat.battingBalls > 0 || stat.battingRuns > 0) {
        cricket.matches = (cricket.matches || 0) + 1;
        cricket.runs = (cricket.runs || 0) + (stat.battingRuns || 0);
        cricket.ballsFaced = (cricket.ballsFaced || 0) + (stat.battingBalls || 0);
        
        if ((stat.battingRuns || 0) > (cricket.highestScore || 0)) {
          cricket.highestScore = stat.battingRuns;
        }

        if (stat.battingRuns >= 100) cricket.hundreds = (cricket.hundreds || 0) + 1;
        else if (stat.battingRuns >= 50) cricket.fifties = (cricket.fifties || 0) + 1;

        cricket.battingAverage = cricket.matches > 0 ? Number((cricket.runs / cricket.matches).toFixed(2)) : 0;
        cricket.battingStrikeRate = cricket.ballsFaced > 0 ? Number(((cricket.runs / cricket.ballsFaced) * 100).toFixed(2)) : 0;
      }

      // Bowling
      if (stat.bowlingBalls > 0) {
        cricket.wickets = (cricket.wickets || 0) + (stat.bowlingWickets || 0);
        cricket.runsConceded = (cricket.runsConceded || 0) + (stat.bowlingRuns || 0);
        cricket.ballsBowled = (cricket.ballsBowled || 0) + (stat.bowlingBalls || 0);

        const currentBest = cricket.bestBowling || { wickets: 0, runs: 999 };
        if (stat.bowlingWickets > currentBest.wickets || (stat.bowlingWickets === currentBest.wickets && stat.bowlingRuns < currentBest.runs)) {
          cricket.bestBowling = { wickets: stat.bowlingWickets, runs: stat.bowlingRuns };
        }

        cricket.bowlingEconomy = cricket.ballsBowled > 0 ? Number(((cricket.runsConceded / cricket.ballsBowled) * 6).toFixed(2)) : 0;
        cricket.bowlingAverage = cricket.wickets > 0 ? Number((cricket.runsConceded / cricket.wickets).toFixed(2)) : 0;
      }
    }

    // 2. Process Fielding Stats from Timeline
    for (const ball of matchScoring.timeline) {
      if (ball.isWicket && ball.fielderId) {
        const stats = getStatsData(ball.fielderId);
        if (!stats) continue;

        const cricket = stats.cricket;
        const wType = ball.wicketType?.toUpperCase();
        if (wType === "CAUGHT") cricket.catches = (cricket.catches || 0) + 1;
        else if (wType === "STUMPED") cricket.stumpings = (cricket.stumpings || 0) + 1;
      }
    }

    // 3. Update Official Stats
    if (hostedGame.umpireId) {
      const stats = getStatsData(hostedGame.umpireId);
      if (stats) stats.matchesOfficiated = (stats.matchesOfficiated || 0) + 1;
    }

    // 4. Batch update all stats
    await StatsService.updateBatchStats(userUpdates);

    // 5. Check for Badges
    const earnedBadges = [];
    const badgeBatchUpdates = [];
    
    for (const [userId, stats] of userUpdates.entries()) {
      const newBadges = checkAndAwardBadges(stats);
      if (newBadges.length > 0) {
        earnedBadges.push({
          userId: userId,
          userName: userNameMap.get(userId) || "Unknown",
          badges: newBadges
        });
        badgeBatchUpdates.push({ userId, badges: newBadges });
      }
    }

    if (badgeBatchUpdates.length > 0) {
      await StatsService.addBatchBadges(badgeBatchUpdates);
    }

    logger.info(`Successfully aggregated normalized stats for match ${matchScoring.id}`);
    return earnedBadges;
  } catch (error) {
    logger.error("Error in aggregatePlayerStats:", error);
    return [];
  }
};

const checkAndAwardBadges = (user) => {
  if (!user.cricket) return [];
  const cricket = user.cricket;
  const currentBadges = user.badges || [];
  const newBadges = [];

  const hasBadge = (name) => currentBadges.some(b => b.name === name);

  if (cricket.runs >= 100 && !hasBadge('Century Maker')) {
    newBadges.push({
      name: 'Century Maker',
      category: 'batting',
      icon: 'Trophy',
      description: 'Reached a monumental 100 career runs milestone.'
    });
  }

  if (cricket.wickets >= 10 && !hasBadge('Wicket Machine')) {
    newBadges.push({
      name: 'Wicket Machine',
      category: 'bowling',
      icon: 'Target',
      description: 'Became a threat to batters with 10 career wickets.'
    });
  }

  if (cricket.catches >= 5 && !hasBadge('Safe Hands')) {
    newBadges.push({
      name: 'Safe Hands',
      category: 'fielding',
      icon: 'Activity',
      description: 'Proven defensive reliability with 5 career catches.'
    });
  }

  if (cricket.matches >= 1 && !hasBadge('Rising Star')) {
    newBadges.push({
      name: 'Rising Star',
      category: 'ranking',
      icon: 'Star',
      description: 'Successfully completed the first official match on Kridaz.'
    });
  }
  
  return newBadges;
};

/**
 * Initializes live overlay broadcasting details for OBS/External scoreboards.
 */
export const goLiveSession = async (matchId) => {
  let hostedGame = await prisma.hostedGame.findUnique({ where: { id: matchId } });
  if (!hostedGame) {
    const scoring = await prisma.cricketMatch.findUnique({ where: { id: matchId } });
    if (scoring) hostedGame = await prisma.hostedGame.findUnique({ where: { id: scoring.gameId } });
  }

  if (!hostedGame) {
    const error = new Error("Match not found");
    error.statusCode = 404;
    throw error;
  }

  if (!process.env.OVERLAY_TOKEN_SECRET) {
    logger.error('[FATAL] OVERLAY_TOKEN_SECRET env var is not set.');
    const error = new Error("Server configuration error: overlay token secret not set.");
    error.statusCode = 500;
    throw error;
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

  const overlayConfig = hostedGame.overlayConfig || { showScoreboard: true, showCommentary: true };
  try {
    await liveStateService.setStreamStatus(matchId, 'starting');
    await liveStateService.setOverlayConfig(matchId, overlayConfig);
  } catch (redisErr) {
    logger.warn("[Scoring] Redis state init failed (non-fatal):", redisErr.message);
  }

  const appBase = process.env.USER_URL || process.env.CLIENT_URLS?.split(",")[0] || "https://kridaz.com";
  return {
    overlayToken,
    streamStatus: 'starting',
    youtubeVideoId: hostedGame.youtubeVideoId,
    urls: {
      obsOverlay: `${appBase}/live-overlay/${hostedGame.id}?token=${overlayToken}`,
      publicScoreboard: `${appBase}/live-score/${hostedGame.id}`
    }
  };
};

/**
 * Ends live broadcasting for the match.
 */
export const endLiveSession = async (matchId) => {
  let hostedGame = await prisma.hostedGame.findUnique({ where: { id: matchId } });
  if (!hostedGame) {
    const scoring = await prisma.cricketMatch.findUnique({ where: { id: matchId } });
    if (scoring) hostedGame = await prisma.hostedGame.findUnique({ where: { id: scoring.gameId } });
  }

  if (!hostedGame) {
    const error = new Error("Match not found");
    error.statusCode = 404;
    throw error;
  }

  const finalMatchId = hostedGame.id;

  await prisma.hostedGame.update({
    where: { id: finalMatchId },
    data: {
      isLive: false,
      overlayToken: null,
      streamStatus: 'ended'
    }
  });

  try {
    await liveStateService.setStreamStatus(finalMatchId, 'ended');
  } catch (redisErr) {
    logger.warn("[Scoring] Redis cleanup failed (non-fatal):", redisErr.message);
  }
};

/**
 * Updates YouTube streaming config keys.
 */
export const configureStream = async (matchId, { youtubeVideoId, youtubeLiveChatId }) => {
  let hostedGame = await prisma.hostedGame.findUnique({ where: { id: matchId } });
  if (!hostedGame) {
    const scoring = await prisma.cricketMatch.findUnique({ where: { id: matchId } });
    if (scoring) hostedGame = await prisma.hostedGame.findUnique({ where: { id: scoring.gameId } });
  }

  if (!hostedGame) {
    const error = new Error("Match not found");
    error.statusCode = 404;
    throw error;
  }

  const finalMatchId = hostedGame.id;
  const streamStatus = youtubeVideoId ? 'online' : 'offline';

  await prisma.hostedGame.update({
    where: { id: finalMatchId },
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

  await liveStateService.setStreamStatus(finalMatchId, streamStatus);
  return { streamStatus };
};

/**
 * Finalizes the scoring session, normalizes game/match states and runs aggregation.
 */
export const finalizeMatch = async (scoringId) => {
  const scoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true, playerStats: true }
  });
  
  if (!scoring) {
    const error = new Error("Scoring session not found");
    error.statusCode = 404;
    throw error;
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
  const earnedBadges = await aggregatePlayerStats(scoring, match);

  return { earnedBadges };
};

/**
 * Performs a search match lookup using the unique short ID.
 */
export const lookupMatchByShortId = async (shortId) => {
  let match = await prisma.hostedGame.findFirst({
    where: { shortId: shortId.toUpperCase() },
    include: {
      host: { select: { id: true, name: true, profilePicture: true } },
      turf: true
    }
  });

  if (!match) {
    const error = new Error("Match not found");
    error.statusCode = 404;
    throw error;
  }

  if (match.turf) {
    match.ground = match.turf;
  }

  return match;
};

/**
 * Initializes a live scoring session if one doesn't exist, validating permissions.
 */
export const initializeScoringSession = async (finalMatchId, finalBattingTeam, umpireId, userRole) => {
  const hostedGame = await prisma.hostedGame.findUnique({
    where: { id: finalMatchId },
    include: {
      host: true,
      umpire: true
    }
  });
  
  if (!hostedGame) {
    const error = new Error("Match not found");
    error.statusCode = 404;
    throw error;
  }

  const isAdmin = userRole?.toUpperCase() === 'ADMIN';
  const isAuthorized = 
    isAdmin ||
    hostedGame.umpireId === umpireId || 
    hostedGame.hostId === umpireId;

  if (!isAuthorized) {
    const error = new Error("Authorization failed. Only the assigned umpire, host, or admin can score this match.");
    error.statusCode = 403;
    throw error;
  }

  let scoring = await prisma.cricketMatch.findUnique({
    where: { gameId: finalMatchId },
    include: {
      innings: true,
      playerStats: true,
      timeline: { take: 5, orderBy: { timestamp: 'desc' } }
    }
  });

  if (!scoring) {
    scoring = await prisma.cricketMatch.create({
      data: {
        gameId: finalMatchId,
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
      where: { id: finalMatchId },
      data: { scoringStatus: "IN_PROGRESS" }
    });
  }

  return scoring;
};

/**
 * Transitions the live scoring session to the second innings.
 */
export const advanceToNextInnings = async (scoringId, battingTeamId) => {
  const scoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true }
  });
  
  if (!scoring) {
    const error = new Error("Scoring session not found");
    error.statusCode = 404;
    throw error;
  }

  await prisma.$transaction([
    prisma.innings.updateMany({
      where: { matchId: scoringId, inningsIndex: 0 },
      data: { isCompleted: true }
    }),
    prisma.innings.create({
      data: {
        matchId: scoringId,
        inningsIndex: 1,
        battingTeam: battingTeamId,
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 }
      }
    }),
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
    include: { innings: true, playerStats: true, timeline: { orderBy: { timestamp: 'desc' } } }
  });

  const match = await prisma.hostedGame.findUnique({ where: { id: scoring.gameId } });
  const liveData = computeScoreSnapshot(updatedScoring, match);
  await liveStateService.setLiveScore(scoring.gameId, liveData);
  
  const io = getIO();
  if (io) io.to(scoring.gameId).emit(SOCKET.SCORE_UPDATED, liveData);

  return updatedScoring;
};

/**
 * Updates toss winner and decision state details.
 */
export const updateTossResult = async (scoringId, winnerTeam, decision) => {
  const scoring = await prisma.cricketMatch.update({
    where: { id: scoringId },
    data: {
      tossWinner: winnerTeam,
      tossDecision: decision === "BAT" ? "BAT" : "BOWL"
    }
  });

  return scoring;
};

/**
 * Assigns or swaps active players on the scoring sheet.
 */
export const updateActivePlayers = async (scoringId, { strikerId, nonStrikerId, bowlerId }) => {
  const scoring = await prisma.cricketMatch.findUnique({ where: { id: scoringId } });
  if (!scoring) {
    const error = new Error("Scoring session not found");
    error.statusCode = 404;
    throw error;
  }

  if (bowlerId && scoring.bowlerId === bowlerId) {
    const error = new Error("Same bowler cannot bowl consecutive overs");
    error.statusCode = 400;
    throw error;
  }

  const updateData = {};
  if (bowlerId) updateData.bowlerId = bowlerId;
  if (strikerId) updateData.strikerId = strikerId;
  if (nonStrikerId) updateData.nonStrikerId = nonStrikerId;

  return await prisma.cricketMatch.update({
    where: { id: scoringId },
    data: updateData,
    include: {
      innings: true,
      playerStats: true
    }
  });
};

/**
 * Reverts/undos the last ball logged in the database timeline.
 */
export const revertLastBall = async (scoringId) => {
  const scoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: {
      timeline: { orderBy: { timestamp: 'desc' }, take: 1 },
      innings: true
    }
  });

  if (!scoring) {
    const error = new Error("Scoring session not found");
    error.statusCode = 404;
    throw error;
  }
  
  if (!scoring.timeline.length) {
    const error = new Error("No balls to undo");
    error.statusCode = 400;
    throw error;
  }

  const lastBall = scoring.timeline[0];
  const currentInnings = scoring.innings.find(i => i.inningsIndex === lastBall.inningsIndex);
  if (!currentInnings) {
    const error = new Error("Innings not found for undo");
    error.statusCode = 400;
    throw error;
  }

  const isLegalBall = !lastBall.isExtra || lastBall.extraType === "BYE" || lastBall.extraType === "LEG_BYE";
  const runs = lastBall.runs ?? 0;

  const newExtras = { ...currentInnings.extras };
  if (lastBall.extraType === "WIDE") newExtras.wides = Math.max(0, newExtras.wides - runs);
  else if (lastBall.extraType === "NO_BALL") newExtras.noBalls = Math.max(0, newExtras.noBalls - 1);
  else if (lastBall.extraType === "BYE") newExtras.byes = Math.max(0, newExtras.byes - runs);
  else if (lastBall.extraType === "LEG_BYE") newExtras.legByes = Math.max(0, newExtras.legByes - runs);

  await prisma.$transaction([
    prisma.matchBall.delete({ where: { id: lastBall.id } }),
    prisma.innings.update({
      where: { id: currentInnings.id },
      data: {
        totalRuns: { decrement: runs },
        totalBalls: isLegalBall ? { decrement: 1 } : undefined,
        totalWickets: lastBall.isWicket ? { decrement: 1 } : undefined,
        extras: newExtras
      }
    }),
    prisma.matchPlayerStat.updateMany({
      where: { matchId: scoring.id, userId: lastBall.batterId, inningsIndex: lastBall.inningsIndex },
      data: {
        battingRuns: { decrement: !["WIDE", "BYE", "LEG_BYE"].includes(lastBall.extraType) ? runs : 0 },
        battingBalls: { decrement: lastBall.extraType !== "WIDE" ? 1 : 0 },
        battingFours: { decrement: (lastBall.isBoundary && runs === 4) ? 1 : 0 },
        battingSixes: { decrement: (lastBall.isBoundary && runs === 6) ? 1 : 0 }
      }
    }),
    prisma.matchPlayerStat.updateMany({
      where: { matchId: scoring.id, userId: lastBall.bowlerId, inningsIndex: lastBall.inningsIndex },
      data: {
        bowlingRuns: { decrement: !["BYE", "LEG_BYE"].includes(lastBall.extraType) ? runs : 0 },
        bowlingBalls: { decrement: isLegalBall ? 1 : 0 },
        bowlingWickets: { decrement: (lastBall.isWicket && !["RUN_OUT", "RETIRED_HURT", "RETIRED_OUT", "OBSTRUCTING", "TIMED_OUT"].includes(lastBall.wicketType)) ? 1 : 0 }
      }
    })
  ]);

  return await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true, playerStats: true, timeline: { orderBy: { timestamp: 'desc' } } }
  });
};

/**
 * Computes, validates, and processes standard score state changes on ball updates.
 */
export const processScoreUpdate = async (scoringId, ballData) => {
  const scoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true }
  });
  if (!scoring) {
    const error = new Error("Scoring session not found");
    error.statusCode = 404;
    throw error;
  }

  const currentInnings = scoring.innings.find(i => i.inningsIndex === scoring.currentInningsIndex);
  if (!currentInnings) {
    const error = new Error("No active innings");
    error.statusCode = 400;
    throw error;
  }

  const isWide = ballData.extraType === "WIDE";
  const isNoBall = ballData.extraType === "NO_BALL";
  const isBye = ballData.extraType === "BYE";
  const isLegBye = ballData.extraType === "LEG_BYE";
  const runs = ballData.runs ?? 0;

  const strikerId = ballData.batterId || ballData.batsmanId || scoring.strikerId;
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
    prisma.innings.update({
      where: { id: currentInnings.id },
      data: {
        totalRuns: { increment: runs },
        totalBalls: isLegalBall ? { increment: 1 } : undefined,
        totalWickets: ballData.isWicket ? { increment: 1 } : undefined,
        extras: newExtras
      }
    }),
    ...(strikerId ? [
      prisma.matchPlayerStat.upsert({
        where: {
          matchId_userId_inningsIndex: {
            matchId: scoring.id,
            userId: strikerId,
            inningsIndex: scoring.currentInningsIndex
          }
        },
        update: {
          battingRuns: { increment: (!isWide && !isBye && !isLegBye) ? runs : 0 },
          battingBalls: { increment: !isWide ? 1 : 0 },
          battingFours: { increment: (ballData.isBoundary && runs === 4) ? 1 : 0 },
          battingSixes: { increment: (ballData.isBoundary && runs === 6) ? 1 : 0 }
        },
        create: {
          matchId: scoring.id,
          userId: strikerId,
          inningsIndex: scoring.currentInningsIndex,
          battingRuns: (!isWide && !isBye && !isLegBye) ? runs : 0,
          battingBalls: !isWide ? 1 : 0,
          battingFours: (ballData.isBoundary && runs === 4) ? 1 : 0,
          battingSixes: (ballData.isBoundary && runs === 6) ? 1 : 0
        }
      })
    ] : []),
    ...(bowlerId ? [
      prisma.matchPlayerStat.upsert({
        where: {
          matchId_userId_inningsIndex: {
            matchId: scoring.id,
            userId: bowlerId,
            inningsIndex: scoring.currentInningsIndex
          }
        },
        update: {
          bowlingRuns: { increment: (!isBye && !isLegBye) ? runs : 0 },
          bowlingBalls: { increment: isLegalBall ? 1 : 0 },
          bowlingWickets: { increment: (ballData.isWicket && !["RUN_OUT", "RETIRED_HURT", "RETIRED_OUT", "OBSTRUCTING", "TIMED_OUT"].includes(ballData.wicketType)) ? 1 : 0 }
        },
        create: {
          matchId: scoring.id,
          userId: bowlerId,
          inningsIndex: scoring.currentInningsIndex,
          bowlingRuns: (!isBye && !isLegBye) ? runs : 0,
          bowlingBalls: isLegalBall ? 1 : 0,
          bowlingWickets: (ballData.isWicket && !["RUN_OUT", "RETIRED_HURT", "RETIRED_OUT", "OBSTRUCTING", "TIMED_OUT"].includes(ballData.wicketType)) ? 1 : 0
        }
      })
    ] : []),
    prisma.cricketMatch.update({
      where: { id: scoring.id },
      data: {
        strikerId: newStrikerId,
        nonStrikerId: newNonStrikerId
      }
    })
  ]);

  const updatedScoring = await prisma.cricketMatch.findUnique({
    where: { id: scoring.id },
    include: { innings: true, playerStats: true, timeline: { orderBy: { timestamp: 'desc' } } }
  });

  const hostedGame = await prisma.hostedGame.findUnique({ 
    where: { id: scoring.gameId },
    include: {
      teams: {
        include: {
          slots: true
        }
      }
    }
  });

  const mappedHostedGame = mapHostedGame(hostedGame);
  const liveData = computeScoreSnapshot(updatedScoring, mappedHostedGame);
  await liveStateService.setLiveScore(scoring.gameId, liveData);
  
  const io = getIO();
  if (io) {
    io.to(scoring.gameId).emit(SOCKET.SCORE_UPDATED, liveData);
  }

  return { scoring: updatedScoring, liveData };
};

/**
 * Returns formatted match scores, active overs, and user scoreboard snapshot profiles.
 */
export const fetchMatchStatus = async (matchId) => {
  const scoring = await prisma.cricketMatch.findFirst({
    where: {
      OR: [
        { id: matchId },
        { gameId: matchId }
      ]
    },
    include: {
      innings: true,
      playerStats: true,
      timeline: { take: 10, orderBy: { timestamp: 'desc' } }
    }
  });

  if (scoring) {
    const userIds = scoring.playerStats.map(s => s.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, profilePicture: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));
    
    const formattedPlayerStats = scoring.playerStats.map(s => ({
      ...s,
      user: userMap.get(s.userId) || { name: "Player", profilePicture: null }
    }));

    const scoringWithUsers = {
      ...scoring,
      playerStats: formattedPlayerStats
    };

    const hostedGame = await prisma.hostedGame.findUnique({
      where: { id: scoring.gameId },
      include: {
        teams: {
          include: {
            slots: {
              include: {
                user: { select: { name: true, profilePicture: true } },
                customPlayer: true
              }
            }
          }
        }
      }
    });

    const mappedHostedGame = mapHostedGame(hostedGame);
    const scoringSnapshot = computeScoreSnapshot(scoringWithUsers, mappedHostedGame);
    
    return { type: "SCORING_EXISTS", scoring: scoringWithUsers, scoringSnapshot, hostedGame: mappedHostedGame };
  }

  const hostedGame = await prisma.hostedGame.findUnique({
    where: { id: matchId },
    include: {
      host: { select: { name: true, profilePicture: true } },
      turf: true,
      teams: {
        include: {
          slots: {
            include: {
              user: { select: { name: true, profilePicture: true } },
              customPlayer: true
            }
          }
        }
      }
    }
  });

  if (!hostedGame) {
    const error = new Error("Match not found");
    error.statusCode = 404;
    throw error;
  }

  const mappedHostedGame = mapHostedGame(hostedGame);
  return { type: "HOSTED_GAME_ONLY", hostedGame: mappedHostedGame };
};

/**
 * Generates rich analytics graphs, wickets, boundary hits, and highlights the match MVP.
 */
export const fetchMatchAnalytics = async (matchId) => {
  const scoring = await prisma.cricketMatch.findFirst({
    where: {
      OR: [
        { id: matchId },
        { gameId: matchId }
      ]
    },
    include: {
      innings: true,
      playerStats: true,
      timeline: true
    }
  });

  if (!scoring) {
    const error = new Error("Match data not found");
    error.statusCode = 404;
    throw error;
  }

  const userIds = new Set();
  scoring.playerStats.forEach(s => userIds.add(s.userId));
  scoring.timeline.forEach(ball => {
    userIds.add(ball.batterId);
    userIds.add(ball.bowlerId);
    if (ball.fielderId) userIds.add(ball.fielderId);
  });

  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(userIds) } },
    select: { id: true, name: true, profilePicture: true }
  });
  const userMap = new Map(users.map(u => [u.id, u]));

  const formattedPlayerStats = scoring.playerStats.map(s => ({
    ...s,
    user: userMap.get(s.userId) || { name: "Player", profilePicture: null }
  }));

  const formattedTimeline = scoring.timeline.map(ball => ({
    ...ball,
    batter: userMap.get(ball.batterId) || { name: "Batter", profilePicture: null },
    bowler: userMap.get(ball.bowlerId) || { name: "Bowler", profilePicture: null },
    fielder: ball.fielderId ? (userMap.get(ball.fielderId) || { name: "Fielder", profilePicture: null }) : null
  }));

  const scoringWithUsers = {
    ...scoring,
    playerStats: formattedPlayerStats,
    timeline: formattedTimeline
  };

  const playerPoints = new Map();
  scoringWithUsers.playerStats.forEach(s => {
    const pts = (s.battingRuns || s.runs || 0) + (s.battingSixes || s.sixes || 0) * 2 + (s.battingFours || s.fours || 0) * 1 + (s.bowlingWickets || s.wickets || 0) * 25;
    playerPoints.set(s.userId, { name: s.user.name, points: pts, profilePicture: s.user.profilePicture });
  });

  scoringWithUsers.timeline.forEach(ball => {
    if (ball.isWicket && ball.fielderId) {
      const current = playerPoints.get(ball.fielderId) || { name: ball.fielder?.name || "Fielder", points: 0, profilePicture: ball.fielder?.profilePicture };
      current.points += 10;
      playerPoints.set(ball.fielderId, current);
    }
  });

  const sortedPlayers = Array.from(playerPoints.values()).sort((a, b) => b.points - a.points);
  const mvp = sortedPlayers[0];

  return {
    scoring: scoringWithUsers,
    analytics: {
      mvp,
      topPerformers: sortedPlayers.slice(0, 3),
      totalFours: scoringWithUsers.playerStats.reduce((acc, curr) => acc + (curr.battingFours || curr.fours || 0), 0),
      totalSixes: scoringWithUsers.playerStats.reduce((acc, curr) => acc + (curr.battingSixes || curr.sixes || 0), 0)
    }
  };
};

/**
 * Returns a live scoreboard snapshot with fast Redis caching gates.
 */
export const fetchLiveScoreSnapshot = async (matchId) => {
  const cached = await liveStateService.getLiveScore(matchId);
  if (cached) {
    return { data: cached, source: 'redis' };
  }

  const match = await prisma.hostedGame.findUnique({
    where: { id: matchId },
    include: {
      teams: {
        include: {
          slots: {
            include: {
              user: { select: { name: true } }
            }
          }
        }
      }
    }
  });

  if (!match) {
    const error = new Error("Match not found");
    error.statusCode = 404;
    throw error;
  }

  const mappedMatch = mapHostedGame(match);

  const scoring = await prisma.cricketMatch.findUnique({
    where: { gameId: matchId },
    include: { 
      innings: true, 
      playerStats: true,
      timeline: { take: 6, orderBy: { timestamp: 'desc' } }
    }
  });

  let snapshot = null;
  if (scoring) {
    snapshot = computeScoreSnapshot(scoring, mappedMatch);
  }

  if (!snapshot) {
    // Return a minimal placeholder snapshot if scoring hasn't started yet
    snapshot = {
      matchId: match.id,
      status: 'NOT_STARTED',
      matchName: match.name,
      teamA: mappedMatch.teamA,
      teamB: mappedMatch.teamB,
      tossWinner: null,
      tossDecision: null,
      message: 'Match starts soon',
    };
  }

  await liveStateService.setLiveScore(matchId, snapshot);
  return { data: snapshot, source: 'prisma' };
};

/**
 * Generates a collision-safe 8-character alphanumeric short ID.
 * Retries up to 10 times using DB uniqueness check, then falls back to
 * a timestamp-prefixed ID to guarantee uniqueness under high concurrency.
 */
const generateUniqueShortId = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    const existing = await prisma.hostedGame.findUnique({ where: { shortId: candidate } });
    if (!existing) return candidate;
  }
  // Fallback: timestamp base36 prefix ensures uniqueness even at massive concurrency
  const tsFragment = Date.now().toString(36).toUpperCase().slice(-4);
  const randFragment = Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return tsFragment + randFragment;
};

/**
 * Creates a new ScoringMatch (using the HostedGame model acting as the parent record).
 *
 * Field mapping (HostedGame schema → service):
 *   name            ← matchName
 *   gameType        ← "SCORING_MATCH"
 *   format          ← format
 *   ballType        ← ballType
 *   groundType      ← groundType
 *   youtubeLiveUrl  ← youtubeLiveUrl
 *   scoringPassword ← hashed password (argon2)
 *   maxMembers      ← maxMembers (default 11)
 *   shortId         ← collision-safe alphanumeric ID
 */
export const createScoringMatch = async (userId, matchData) => {
  const {
    matchName,
    format,
    ballType,
    groundType,
    maxMembers,
    teamAId,
    teamBId,
    teamAData,
    teamBData,
    teamAPlayers,
    teamBPlayers,
    venueId,
    tossWinner,
    tossDecision,
    scoringPassword,
    youtubeLiveUrl
  } = matchData;

  // Hash the scoring password for security (argon2)
  let hashedPassword = null;
  if (scoringPassword && scoringPassword.trim() !== '') {
    const argon2 = await import('argon2');
    hashedPassword = await argon2.hash(scoringPassword);
  }

  // Look up team names/images from Team model if IDs are provided
  let teamAName = teamAData?.name || 'Team A';
  let teamAImage = teamAData?.image || null;
  let teamBName = teamBData?.name || 'Team B';
  let teamBImage = teamBData?.image || null;

  if (teamAId) {
    const teamA = await prisma.team.findUnique({
      where: { id: teamAId },
      select: { name: true, logo: true, image: true }
    });
    if (teamA) {
      teamAName = teamA.name;
      teamAImage = teamA.logo || teamA.image || null;
    }
  }
  if (teamBId) {
    const teamB = await prisma.team.findUnique({
      where: { id: teamBId },
      select: { name: true, logo: true, image: true }
    });
    if (teamB) {
      teamBName = teamB.name;
      teamBImage = teamB.logo || teamB.image || null;
    }
  }

  const shortId = await generateUniqueShortId();

  // Create the HostedGame with nested GameTeam records
  const game = await prisma.hostedGame.create({
    data: {
      gameType: 'SCORING_MATCH',
      name: matchName || 'Custom Scoring Match',
      format: format || 'T20',
      ballType: ballType || 'TENNIS',
      groundType: groundType || 'OUTDOOR',
      shortId,
      hostId: userId,
      status: 'ACTIVE',
      scoringStatus: 'NOT_STARTED',
      scoringPassword: hashedPassword,
      youtubeLiveUrl: youtubeLiveUrl || null,
      maxMembers: maxMembers || 11,
      date: new Date(),
      time: new Date().toTimeString().split(' ')[0],
      oversPerInnings: format === 'T20' ? 20 : format === 'ODI' ? 50 : format === 'T10' ? 10 : 20,
      teams: {
        create: [
          {
            teamKey: 'teamA',
            name: teamAName,
            image: teamAImage,
          },
          {
            teamKey: 'teamB',
            name: teamBName,
            image: teamBImage,
          }
        ]
      }
    },
    include: {
      teams: true
    }
  });

  // Assign players to GameSlots for each team
  const slotCreates = [];

  const processPlayerSlot = async (p, teamRecord) => {
    if (p.isCustom) {
      // Create CustomPlayerInvite
      const customInvite = await prisma.customPlayerInvite.create({
        data: {
          gameId: game.id,
          name: p.name,
          email: `${p.id}@kridaz.custom`, // Dummy email
          inviteStatus: 'ACCEPTED',
        }
      });
      return {
        gameId: game.id,
        teamId: teamRecord.id,
        userId: null,
        customPlayerId: customInvite.id,
        status: 'CONFIRMED',
        role: p.role || 'PLAYER'
      };
    } else {
      return {
        gameId: game.id,
        teamId: teamRecord.id,
        userId: p.id || p.userId,
        status: 'CONFIRMED',
        role: p.role || 'PLAYER'
      };
    }
  };

  const teamARecord = game.teams.find(t => t.teamKey === 'teamA');
  if (teamARecord && teamAPlayers && teamAPlayers.length > 0) {
    const aSlots = await Promise.all(teamAPlayers.map(p => processPlayerSlot(p, teamARecord)));
    slotCreates.push(...aSlots);
  }

  const teamBRecord = game.teams.find(t => t.teamKey === 'teamB');
  if (teamBRecord && teamBPlayers && teamBPlayers.length > 0) {
    const bSlots = await Promise.all(teamBPlayers.map(p => processPlayerSlot(p, teamBRecord)));
    slotCreates.push(...bSlots);
  }

  if (slotCreates.length > 0) {
    await prisma.gameSlot.createMany({ data: slotCreates });
  }

  if (tossWinner && tossDecision) {
    let battingTeamKey = 'teamA';
    if (tossWinner === teamAId) {
      battingTeamKey = tossDecision === 'BAT' ? 'teamA' : 'teamB';
    } else if (tossWinner === teamBId) {
      battingTeamKey = tossDecision === 'BAT' ? 'teamB' : 'teamA';
    }
    
    try {
      await initializeScoringSession(game.id, battingTeamKey, userId, 'ADMIN');
      
      await prisma.cricketMatch.update({
        where: { gameId: game.id },
        data: {
          tossWinner: tossWinner === teamAId ? teamAName : teamBName,
          tossDecision: tossDecision
        }
      });
    } catch (err) {
      console.error("Error auto-initializing scoring session:", err);
    }
  }

  // Return full game with teams + player slots
  return await prisma.hostedGame.findUnique({
    where: { id: game.id },
    include: {
      teams: {
        include: {
          slots: {
            include: {
              user: { select: { id: true, name: true, profilePicture: true } }
            }
          }
        }
      }
    }
  });
};


/**
 * Get all scoring games associated with the user
 */
export const getUserScoringGames = async (userId) => {
  return await prisma.hostedGame.findMany({
    where: {
      OR: [
        { hostId: userId },
        { umpireId: userId }
      ],
      gameType: "SCORING_MATCH",
    },
    include: {
      teams: {
        include: {
          slots: { include: { user: { select: { id: true, name: true, profilePicture: true } } } }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};

/**
 * Get a single scoring game by ID with full team/player/match details.
 */
export const getScoringGameById = async (gameId) => {
  return await prisma.hostedGame.findUnique({
    where: { id: gameId },
    include: {
      teams: {
        include: {
          slots: {
            include: {
              user: { select: { id: true, name: true, profilePicture: true, username: true } }
            }
          }
        }
      },
      cricketMatch: {
        select: {
          id: true,
          status: true,
          tossWinner: true,
          tossDecision: true,
          currentInningsIndex: true,
          oversPerInnings: true,
          strikerId: true,
          nonStrikerId: true,
          bowlerId: true,
        }
      },
      turf: {
        select: { id: true, name: true, location: true, city: true, image: true }
      }
    }
  });
};

/**
 * Verify the scoring app password for a game.
 * Returns a short-lived JWT scoped to this specific game with SCORER role.
 * Throws named errors for controller-level HTTP status mapping.
 */
export const verifyScoringPassword = async (gameId, password) => {
  const game = await prisma.hostedGame.findUnique({
    where: { id: gameId },
    select: { id: true, scoringPassword: true, hostId: true, shortId: true }
  });

  if (!game) {
    const err = new Error("GAME_NOT_FOUND");
    err.statusCode = 404;
    throw err;
  }

  if (!game.scoringPassword) {
    // No password set — allow open access
    const token = jwt.sign(
      { gameId: game.id, role: 'SCORER', shortId: game.shortId },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    return { token };
  }

  // Verify with argon2 (same lib used across the codebase)
  const argon2 = await import('argon2');
  const isValid = await argon2.verify(game.scoringPassword, password);
  if (!isValid) {
    const err = new Error("INVALID_PASSWORD");
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign(
    { gameId: game.id, role: 'SCORER', shortId: game.shortId },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  return { token };
};

/**
 * Delete a match permanently after verifying scoring password
 */
export const deleteMatch = async (matchId, password, userId) => {
  const game = await prisma.hostedGame.findUnique({
    where: { id: matchId },
    select: { id: true, hostId: true, scoringPassword: true }
  });

  if (!game) {
    const err = new Error("GAME_NOT_FOUND");
    err.statusCode = 404;
    throw err;
  }

  if (game.hostId !== userId) {
    const err = new Error("UNAUTHORIZED");
    err.statusCode = 403;
    throw err;
  }

  if (game.scoringPassword) {
    const argon2 = await import('argon2');
    const isValid = await argon2.verify(game.scoringPassword, password);
    if (!isValid) {
      const err = new Error("INVALID_PASSWORD");
      err.statusCode = 401;
      throw err;
    }
  }

  // Find the cricket match to delete related records if any
  const cricketMatch = await prisma.cricketMatch.findUnique({
    where: { gameId: matchId },
    select: { id: true }
  });

  if (cricketMatch) {
    await prisma.$transaction([
      prisma.matchBall.deleteMany({ where: { matchId: cricketMatch.id } }),
      prisma.innings.deleteMany({ where: { matchId: cricketMatch.id } }),
      prisma.matchPlayerStat.deleteMany({ where: { matchId: cricketMatch.id } }),
      prisma.cricketMatch.delete({ where: { id: cricketMatch.id } })
    ]);
  }

  await prisma.$transaction([
    prisma.gameSlot.deleteMany({ where: { gameId: matchId } }),
    prisma.customPlayerInvite.deleteMany({ where: { gameId: matchId } }),
    prisma.hostedGame.delete({ where: { id: matchId } })
  ]);

  return true;
};
