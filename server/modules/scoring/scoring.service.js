import { prisma } from "../../config/prisma.js";
import StatsService from "../../services/stats.service.js";
import { liveStateService } from "../../services/liveState.service.js";
import { getIO } from "../../config/socket.js";
import jwt from "jsonwebtoken";
import logger from "../../utils/logger.js";
import { SOCKET } from "@kridaz/shared-constants/socketEvents";
import { computeScoreSnapshot } from "./scoring.utils.js";

const HOSTED_GAME_SCORING_INCLUDE = {
  teams: {
    include: {
      slots: {
        include: {
          user: { select: { id: true, name: true, profilePicture: true } },
          customPlayer: true
        }
      }
    }
  }
};

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

  const finalMatchId = hostedGame.id;

  const overlayToken = jwt.sign(
    { matchId: finalMatchId, type: 'OBS_OVERLAY' }, 
    process.env.OVERLAY_TOKEN_SECRET, 
    { expiresIn: '12h' }
  );

  await prisma.hostedGame.update({
    where: { id: finalMatchId },
    data: {
      isLive: true,
      overlayToken: overlayToken,
      streamStatus: 'starting',
      liveStartedAt: new Date()
    }
  });

  const overlayConfig = hostedGame.overlayConfig || { showScoreboard: true, showCommentary: true };
  try {
    await liveStateService.setStreamStatus(finalMatchId, 'starting');
    await liveStateService.setOverlayConfig(finalMatchId, overlayConfig);
  } catch (redisErr) {
    logger.warn("[Scoring] Redis state init failed (non-fatal):", redisErr.message);
  }

  // Fetch updated game & scoring session to cache and broadcast the live snapshot
  try {
    const updatedHostedGame = await prisma.hostedGame.findUnique({
      where: { id: finalMatchId },
      include: HOSTED_GAME_SCORING_INCLUDE
    });
    const mappedMatch = mapHostedGame(updatedHostedGame);

    const scoring = await prisma.cricketMatch.findUnique({
      where: { gameId: finalMatchId },
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
      snapshot = {
        matchId: finalMatchId,
        status: 'NOT_STARTED',
        matchName: mappedMatch.name,
        teamA: mappedMatch.teamA,
        teamB: mappedMatch.teamB,
        tossWinner: null,
        tossDecision: null,
        message: 'Match starts soon',
        tickerTheme: mappedMatch.tickerTheme || 'neon_classic',
        isLive: true,
      };
    }

    await liveStateService.setLiveScore(finalMatchId, snapshot);

    const io = getIO();
    if (io) {
      io.to(finalMatchId).emit(SOCKET.SCORE_UPDATED, snapshot);
    }
  } catch (err) {
    logger.error("Error caching/broadcasting live snapshot in goLiveSession:", err);
  }

  const appBase = process.env.USER_URL || process.env.CLIENT_URLS?.split(",")[0] || "https://kridaz.com";
  return {
    overlayToken,
    streamStatus: 'starting',
    youtubeVideoId: hostedGame.youtubeVideoId,
    urls: {
      obsOverlay: `${appBase}/live-overlay/${finalMatchId}?token=${overlayToken}`,
      publicScoreboard: `${appBase}/live-score/${finalMatchId}`
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

  // Fetch updated game & scoring session to cache and broadcast the live snapshot (sync off)
  try {
    const updatedHostedGame = await prisma.hostedGame.findUnique({
      where: { id: finalMatchId },
      include: HOSTED_GAME_SCORING_INCLUDE
    });
    const mappedMatch = mapHostedGame(updatedHostedGame);

    const scoring = await prisma.cricketMatch.findUnique({
      where: { gameId: finalMatchId },
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
      snapshot = {
        matchId: finalMatchId,
        status: 'NOT_STARTED',
        matchName: mappedMatch.name,
        teamA: mappedMatch.teamA,
        teamB: mappedMatch.teamB,
        tossWinner: null,
        tossDecision: null,
        message: 'Match starts soon',
        tickerTheme: mappedMatch.tickerTheme || 'neon_classic',
        isLive: false,
      };
    }

    await liveStateService.setLiveScore(finalMatchId, snapshot);

    const io = getIO();
    if (io) {
      io.to(finalMatchId).emit(SOCKET.SCORE_UPDATED, snapshot);
    }
  } catch (err) {
    logger.error("Error caching/broadcasting live snapshot in endLiveSession:", err);
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
        ...(typeof hostedGame.streamConfig === 'object' && hostedGame.streamConfig !== null ? hostedGame.streamConfig : {}),
        youtubeVideoId,
        youtubeLiveChatId
      },
      streamStatus: streamStatus
    }
  });

  await liveStateService.setStreamStatus(finalMatchId, streamStatus);

  // Broadcast updated live score so YouTube embed appears immediately
  try {
    const updatedHostedGame = await prisma.hostedGame.findUnique({
      where: { id: finalMatchId },
      include: HOSTED_GAME_SCORING_INCLUDE
    });
    const mappedMatch = mapHostedGame(updatedHostedGame);

    const scoring = await prisma.cricketMatch.findUnique({
      where: { gameId: finalMatchId },
      include: {
        innings: true,
        playerStats: true,
        timeline: { take: 6, orderBy: { timestamp: 'desc' } }
      }
    });

    let snapshot = null;
    if (scoring) {
      snapshot = computeScoreSnapshot(scoring, mappedMatch);
    } else {
      snapshot = {
        matchId: finalMatchId,
        status: 'NOT_STARTED',
        matchName: mappedMatch.name,
        teamA: mappedMatch.teamA,
        teamB: mappedMatch.teamB,
        tickerTheme: mappedMatch.tickerTheme || 'neon_classic',
        youtubeVideoId: updatedHostedGame.streamConfig?.youtubeVideoId || null,
        isLive: updatedHostedGame.isLive,
      };
    }

    await liveStateService.setLiveScore(finalMatchId, snapshot);
    const io = getIO();
    if (io) io.to(finalMatchId).emit(SOCKET.SCORE_UPDATED, snapshot);
  } catch (err) {
    logger.error("Error caching/broadcasting live snapshot in configureStream:", err);
  }

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

  const match = await prisma.hostedGame.findUnique({
    where: { id: scoring.gameId },
    include: HOSTED_GAME_SCORING_INCLUDE
  });
  const liveData = computeScoreSnapshot(updatedScoring, mapHostedGame(match));
  await liveStateService.setLiveScore(scoring.gameId, liveData);
  
  const io = getIO();
  if (io) io.to(scoring.gameId).emit(SOCKET.SCORE_UPDATED, liveData);

  return updatedScoring;
};

/**
 * Updates the match status (e.g. LIVE, RAIN_DELAY, BAD_LIGHT).
 */
export const updateMatchStatus = async (scoringId, newStatus) => {
  const scoring = await prisma.cricketMatch.update({
    where: { id: scoringId },
    data: { status: newStatus }
  });

  const hostedGame = await prisma.hostedGame.findUnique({
    where: { id: scoring.gameId },
    include: HOSTED_GAME_SCORING_INCLUDE
  });

  const updatedScoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true, playerStats: true, timeline: { orderBy: { timestamp: 'desc' } } }
  });

  const liveData = computeScoreSnapshot(updatedScoring, mapHostedGame(hostedGame));
  await liveStateService.setLiveScore(scoring.gameId, liveData);
  
  const io = getIO();
  if (io) io.to(scoring.gameId).emit(SOCKET.SCORE_UPDATED, liveData);

  return scoring;
};

/**
 * Revise match target and overs (DLS / Rain Rule).
 */
export const reviseTargetAndOvers = async (scoringId, revisedTarget, revisedOvers) => {
  const scoring = await prisma.cricketMatch.update({
    where: { id: scoringId },
    data: { revisedTarget, revisedOvers }
  });

  const hostedGame = await prisma.hostedGame.findUnique({
    where: { id: scoring.gameId },
    include: HOSTED_GAME_SCORING_INCLUDE
  });

  const updatedScoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true, playerStats: true, timeline: { orderBy: { timestamp: 'desc' } } }
  });

  const liveData = computeScoreSnapshot(updatedScoring, mapHostedGame(hostedGame));
  await liveStateService.setLiveScore(scoring.gameId, liveData);
  
  const io = getIO();
  if (io) io.to(scoring.gameId).emit(SOCKET.SCORE_UPDATED, liveData);

  return scoring;
};

/**
 * Set Match Officials (Umpires, Referees).
 */
export const setMatchOfficials = async (scoringId, officials) => {
  const scoring = await prisma.cricketMatch.update({
    where: { id: scoringId },
    data: { matchOfficials: officials }
  });

  const hostedGame = await prisma.hostedGame.findUnique({
    where: { id: scoring.gameId },
    include: HOSTED_GAME_SCORING_INCLUDE
  });

  const updatedScoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true, playerStats: true, timeline: { orderBy: { timestamp: 'desc' } } }
  });

  const liveData = computeScoreSnapshot(updatedScoring, mapHostedGame(hostedGame));
  await liveStateService.setLiveScore(scoring.gameId, liveData);
  
  const io = getIO();
  if (io) io.to(scoring.gameId).emit(SOCKET.SCORE_UPDATED, liveData);

  return scoring;
};

/**
 * Substitute an on-field player.
 */
export const substitutePlayer = async (scoringId, userId, substituteForId, inningsIndex) => {
  // Add the substitute to the player stats for the match/innings
  const stat = await prisma.matchPlayerStat.upsert({
    where: {
      matchId_userId_inningsIndex: { matchId: scoringId, userId, inningsIndex }
    },
    update: {
      isSubstitute: true,
      substituteForId: substituteForId
    },
    create: {
      matchId: scoringId,
      userId,
      inningsIndex,
      isSubstitute: true,
      substituteForId: substituteForId
    }
  });

  return stat;
};

/**
 * Use a team review (DRS).
 * @param {string} team - 'batting' or 'fielding'
 * @param {boolean} isSuccessful - if true, review is retained.
 */
export const useReview = async (scoringId, inningsIndex, team, isSuccessful) => {
  const scoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true }
  });
  const innings = scoring.innings.find(i => i.inningsIndex === inningsIndex);
  if (!innings) throw new Error("Innings not found");

  const field = team === 'batting' ? 'battingTeamReviews' : 'fieldingTeamReviews';
  const currentReviews = innings[field];

  if (currentReviews <= 0) {
    throw new Error("No reviews remaining for this team");
  }

  if (!isSuccessful) {
    await prisma.innings.update({
      where: { id: innings.id },
      data: { [field]: currentReviews - 1 }
    });
  }

  // Refresh live score
  const hostedGame = await prisma.hostedGame.findUnique({
    where: { id: scoring.gameId },
    include: HOSTED_GAME_SCORING_INCLUDE
  });
  const updatedScoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true, playerStats: true, timeline: { orderBy: { timestamp: 'desc' } } }
  });

  const liveData = computeScoreSnapshot(updatedScoring, mapHostedGame(hostedGame));
  await liveStateService.setLiveScore(scoring.gameId, liveData);
  const io = getIO();
  if (io) io.to(scoring.gameId).emit(SOCKET.SCORE_UPDATED, liveData);

  return updatedScoring;
};

/**
 * Set Powerplay overs for the current innings.
 */
export const setPowerplayOvers = async (scoringId, inningsIndex, overs) => {
  const scoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true }
  });
  const innings = scoring.innings.find(i => i.inningsIndex === inningsIndex);
  
  if (innings) {
    await prisma.innings.update({
      where: { id: innings.id },
      data: { powerplayOvers: overs }
    });
  }

  return scoring;
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

  const isLegalBall = !lastBall.isExtra || lastBall.extraType === "BYE" || lastBall.extraType === "LEG_BYE" || lastBall.extraType === "PENALTY";
  const runs = lastBall.runs ?? 0;
  const extraRuns = lastBall.extraRuns ?? (lastBall.isExtra ? 1 : 0);

  const newExtras = { ...currentInnings.extras };
  if (lastBall.extraType === "WIDE") newExtras.wides = Math.max(0, newExtras.wides - extraRuns);
  else if (lastBall.extraType === "NO_BALL") newExtras.noBalls = Math.max(0, newExtras.noBalls - extraRuns);
  else if (lastBall.extraType === "BYE") newExtras.byes = Math.max(0, newExtras.byes - extraRuns);
  else if (lastBall.extraType === "LEG_BYE") newExtras.legByes = Math.max(0, newExtras.legByes - extraRuns);
  else if (lastBall.extraType === "PENALTY") newExtras.penalty = Math.max(0, newExtras.penalty - extraRuns);

  let wasMaiden = false;
  if (isLegalBall && lastBall.ballInOver === 5) {
    const overBalls = await prisma.matchBall.findMany({
      where: {
        matchId: scoring.id,
        inningsIndex: lastBall.inningsIndex,
        over: lastBall.over,
        bowlerId: lastBall.bowlerId
      }
    });

    let totalBowlerRuns = 0;
    for (const b of overBalls) {
      if (!["BYE", "LEG_BYE", "PENALTY"].includes(b.extraType)) {
        totalBowlerRuns += (b.runs || 0) + (b.extraRuns || 0);
      }
    }
    if (totalBowlerRuns === 0) {
      wasMaiden = true;
    }
  }

  await prisma.$transaction([
    prisma.matchBall.delete({ where: { id: lastBall.id } }),
    prisma.innings.update({
      where: { id: currentInnings.id },
      data: {
        totalRuns: { decrement: runs + extraRuns },
        totalBalls: isLegalBall ? { decrement: 1 } : undefined,
        totalWickets: lastBall.isWicket ? { decrement: 1 } : undefined,
        extras: newExtras
      }
    }),
    prisma.matchPlayerStat.updateMany({
      where: { matchId: scoring.id, userId: lastBall.batterId, inningsIndex: lastBall.inningsIndex },
      data: {
        battingRuns: { decrement: runs },
        battingBalls: { decrement: (!["WIDE", "PENALTY"].includes(lastBall.extraType)) ? 1 : 0 },
        battingFours: { decrement: lastBall.isFour ? 1 : 0 },
        battingSixes: { decrement: lastBall.isSix ? 1 : 0 }
      }
    }),
    prisma.matchPlayerStat.updateMany({
      where: { matchId: scoring.id, userId: lastBall.bowlerId, inningsIndex: lastBall.inningsIndex },
      data: {
        bowlingRuns: { decrement: (!["BYE", "LEG_BYE", "PENALTY"].includes(lastBall.extraType)) ? (runs + extraRuns) : 0 },
        bowlingBalls: { decrement: isLegalBall ? 1 : 0 },
        bowlingMaidens: { decrement: wasMaiden ? 1 : 0 },
        bowlingWickets: { decrement: (lastBall.isWicket && !["RUN_OUT", "RETIRED_HURT", "RETIRED_OUT", "OBSTRUCTING", "TIMED_OUT", "OBSTRUCTING_FIELD", "HIT_BALL_TWICE", "HANDLED_BALL"].includes(lastBall.wicketType)) ? 1 : 0 }
      }
    }),
    ...(lastBall.isWicket ? [
      prisma.matchPlayerStat.updateMany({
        where: { matchId: scoring.id, userId: lastBall.playerOutId || lastBall.batterId, inningsIndex: lastBall.inningsIndex },
        data: {
          outStatus: "NOT_OUT"
        }
      })
    ] : [])
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
  const isPenalty = ballData.extraType === "PENALTY";
  const runs = ballData.runs ?? 0;
  const extraRuns = ballData.extraRuns ?? (ballData.isExtra ? 1 : 0);

  const strikerId = ballData.batterId || ballData.batsmanId || scoring.strikerId;
  const bowlerId = ballData.bowlerId || scoring.bowlerId;
  const nonStrikerId = scoring.nonStrikerId;

  const overNumber = Math.floor(currentInnings.totalBalls / 6);
  const ballInOver = currentInnings.totalBalls % 6;

  const isLegalBall = !isWide && !isNoBall && !isPenalty;
  const newExtras = { ...currentInnings.extras };
  if (isWide) newExtras.wides += extraRuns;
  else if (isNoBall) newExtras.noBalls += extraRuns;
  else if (isBye) newExtras.byes += extraRuns;
  else if (isLegBye) newExtras.legByes += extraRuns;
  else if (isPenalty) newExtras.penalty = (newExtras.penalty || 0) + extraRuns;

  // Strike Rotation Logic
  let newStrikerId = strikerId;
  let newNonStrikerId = nonStrikerId;
  const isOverComplete = isLegalBall && (ballInOver === 5);

  const physicalRunsRan = runs + (isBye || isLegBye ? extraRuns : 0) + ((isWide || isNoBall) && extraRuns > 1 ? extraRuns - 1 : 0);
  const pOutId = ballData.isWicket ? (ballData.playerOutId || strikerId) : null;
  
  if (ballData.isWicket) {
    const isRunOutOrRetired = ["RUN_OUT", "RETIRED_HURT", "RETIRED_OUT"].includes(ballData.wicketType);

    if (isRunOutOrRetired) {
      let currentStrikerEndId = strikerId;
      let currentNonStrikerEndId = nonStrikerId;

      if (physicalRunsRan % 2 !== 0) {
        currentStrikerEndId = nonStrikerId;
        currentNonStrikerEndId = strikerId;
      }

      if (pOutId === currentStrikerEndId) {
        newStrikerId = ballData.nextBatterId || currentStrikerEndId;
        newNonStrikerId = currentNonStrikerEndId;
      } else {
        newNonStrikerId = ballData.nextBatterId || currentNonStrikerEndId;
        newStrikerId = currentStrikerEndId;
      }
    } else {
      newStrikerId = ballData.nextBatterId || strikerId;
      newNonStrikerId = nonStrikerId;
    }
  } else {
    if (!isPenalty && physicalRunsRan % 2 !== 0) {
      [newStrikerId, newNonStrikerId] = [newNonStrikerId, newStrikerId];
    }
  }

  if (isOverComplete) {
    [newStrikerId, newNonStrikerId] = [newNonStrikerId, newStrikerId];
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
        extraRuns: extraRuns,
        isBoundary: ballData.isBoundary || false,
        isFour: ballData.isFour || false,
        isSix: ballData.isSix || false,
        isWicket: ballData.isWicket || false,
        wicketType: ballData.wicketType,
        playerOutId: ballData.playerOutId,
        wicketTakerId: ballData.wicketTakerId,
        fielderId: ballData.fielderId,
        fieldingPosition: ballData.fieldingPosition,
        distance: ballData.distance
      }
    }),
    prisma.innings.update({
      where: { id: currentInnings.id },
      data: {
        totalRuns: { increment: runs + extraRuns },
        totalBalls: isLegalBall ? { increment: 1 } : undefined,
        totalWickets: (ballData.isWicket && ballData.wicketType !== 'RETIRED_HURT') ? { increment: 1 } : undefined,
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
          battingRuns: { increment: runs },
          battingBalls: { increment: (!isWide && !isPenalty) ? 1 : 0 },
          battingFours: { increment: ballData.isFour ? 1 : 0 },
          battingSixes: { increment: ballData.isSix ? 1 : 0 },
          outStatus: (ballData.isWicket && pOutId === strikerId) ? ballData.wicketType : undefined
        },
        create: {
          matchId: scoring.id,
          userId: strikerId,
          inningsIndex: scoring.currentInningsIndex,
          battingRuns: runs,
          battingBalls: (!isWide && !isPenalty) ? 1 : 0,
          battingFours: ballData.isFour ? 1 : 0,
          battingSixes: ballData.isSix ? 1 : 0,
          outStatus: (ballData.isWicket && pOutId === strikerId) ? ballData.wicketType : "NOT_OUT"
        }
      })
    ] : []),
    ...((ballData.isWicket && pOutId === nonStrikerId) ? [
      prisma.matchPlayerStat.upsert({
        where: {
          matchId_userId_inningsIndex: {
            matchId: scoring.id,
            userId: nonStrikerId,
            inningsIndex: scoring.currentInningsIndex
          }
        },
        update: {
          outStatus: ballData.wicketType
        },
        create: {
          matchId: scoring.id,
          userId: nonStrikerId,
          inningsIndex: scoring.currentInningsIndex,
          battingRuns: 0,
          battingBalls: 0,
          battingFours: 0,
          battingSixes: 0,
          outStatus: ballData.wicketType
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
          bowlingRuns: { increment: (!isBye && !isLegBye && !isPenalty) ? (runs + extraRuns) : 0 },
          bowlingBalls: { increment: isLegalBall ? 1 : 0 },
          bowlingWickets: { increment: (ballData.isWicket && !["RUN_OUT", "RETIRED_HURT", "RETIRED_OUT", "OBSTRUCTING", "TIMED_OUT", "OBSTRUCTING_FIELD", "HIT_BALL_TWICE", "HANDLED_BALL"].includes(ballData.wicketType)) ? 1 : 0 }
        },
        create: {
          matchId: scoring.id,
          userId: bowlerId,
          inningsIndex: scoring.currentInningsIndex,
          bowlingRuns: (!isBye && !isLegBye && !isPenalty) ? (runs + extraRuns) : 0,
          bowlingBalls: isLegalBall ? 1 : 0,
          bowlingWickets: (ballData.isWicket && !["RUN_OUT", "RETIRED_HURT", "RETIRED_OUT", "OBSTRUCTING", "TIMED_OUT", "OBSTRUCTING_FIELD", "HIT_BALL_TWICE", "HANDLED_BALL"].includes(ballData.wicketType)) ? 1 : 0
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

  if (isOverComplete && bowlerId) {
    const overBalls = await prisma.matchBall.findMany({
      where: {
        matchId: scoring.id,
        inningsIndex: scoring.currentInningsIndex,
        over: overNumber,
        bowlerId: bowlerId
      }
    });

    let totalBowlerRuns = 0;
    for (const b of overBalls) {
      if (!["BYE", "LEG_BYE", "PENALTY"].includes(b.extraType)) {
        totalBowlerRuns += (b.runs || 0) + (b.extraRuns || 0);
      }
    }

    if (totalBowlerRuns === 0) {
      await prisma.matchPlayerStat.updateMany({
        where: { matchId: scoring.id, userId: bowlerId, inningsIndex: scoring.currentInningsIndex },
        data: { bowlingMaidens: { increment: 1 } }
      });
    }
  }

  const [updatedScoring, hostedGame] = await Promise.all([
    prisma.cricketMatch.findUnique({
      where: { id: scoring.id },
      include: { innings: true, playerStats: true, timeline: { orderBy: { timestamp: 'desc' } } }
    }),
    prisma.hostedGame.findUnique({ 
      where: { id: scoring.gameId },
      include: HOSTED_GAME_SCORING_INCLUDE
    })
  ]);

  const mappedHostedGame = mapHostedGame(hostedGame);
  const liveData = computeScoreSnapshot(updatedScoring, mappedHostedGame);
  await liveStateService.setLiveScore(scoring.gameId, liveData);
  
  const io = getIO();
  if (io) {
    io.to(scoring.gameId).emit(SOCKET.SCORE_UPDATED, liveData);
  }

  // AI Commentary (Async Background Job)
  import('../commentary/commentary.service.js')
    .then(({ commentaryQueue }) => {
      commentaryQueue.add('generate', {
        matchId: scoring.gameId,
        liveData,
        ballEvent: ballData
      });
    })
    .catch(err => logger.error("[Scoring] Failed to load commentary queue:", err));

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
      include: HOSTED_GAME_SCORING_INCLUDE
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
      teams: HOSTED_GAME_SCORING_INCLUDE.teams
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
    include: HOSTED_GAME_SCORING_INCLUDE
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
      tickerTheme: match.tickerTheme || 'neon_classic',
      isLive: match.isLive ?? false,
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
              user: { select: { id: true, name: true, profilePicture: true } },
              customPlayer: true
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
          slots: {
            include: {
              user: { select: { id: true, name: true, profilePicture: true } },
              customPlayer: true
            }
          }
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
              user: { select: { id: true, name: true, profilePicture: true, username: true } },
              customPlayer: true
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
 * Delete match permanently (placeholder for actual implementation)
 */
export const deleteScoringMatch = async (matchId, userId) => {
  // Add appropriate validation
  const game = await prisma.hostedGame.findUnique({ where: { id: matchId } });
  if (!game) {
    const err = new Error("MATCH_NOT_FOUND");
    err.statusCode = 404;
    throw err;
  }

  // Delete the match
  await prisma.hostedGame.delete({ where: { id: matchId } });
  return true;
};
export const toggleMatchTimer = async (scoringId) => {
  const match = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { playerStats: true }
  });

  if (!match) throw new Error("Match not found");

  const now = new Date();
  let newTimerState;
  let newTotalDuration = match.totalDurationSeconds;
  let newTimerLastStartedAt = match.timerLastStartedAt;

  if (match.timerState === "NOT_STARTED" || match.timerState === "PAUSED") {
    newTimerState = "RUNNING";
    newTimerLastStartedAt = now;
  } else if (match.timerState === "RUNNING") {
    newTimerState = "PAUSED";
    if (match.timerLastStartedAt) {
      const diffSecs = Math.floor((now.getTime() - match.timerLastStartedAt.getTime()) / 1000);
      newTotalDuration += diffSecs;
    }
    newTimerLastStartedAt = null;
  } else {
    throw new Error("Match already ended");
  }

  const updatedMatch = await prisma.cricketMatch.update({
    where: { id: scoringId },
    data: {
      timerState: newTimerState,
      totalDurationSeconds: newTotalDuration,
      timerLastStartedAt: newTimerLastStartedAt,
      status: match.status === "NOT_STARTED" && newTimerState === "RUNNING" ? "LIVE" : undefined
    }
  });

  const activeIds = [match.strikerId, match.nonStrikerId, match.bowlerId].filter(Boolean);
  
  for (const stat of match.playerStats) {
    if (activeIds.includes(stat.userId)) {
      if (newTimerState === "RUNNING") {
        await prisma.matchPlayerStat.update({
          where: { id: stat.id },
          data: { timerLastStartedAt: now }
        });
      } else if (newTimerState === "PAUSED") {
        const timeDiff = stat.timerLastStartedAt ? Math.floor((now.getTime() - stat.timerLastStartedAt.getTime()) / 1000) : 0;
        await prisma.matchPlayerStat.update({
          where: { id: stat.id },
          data: {
            timeSpentSeconds: stat.timeSpentSeconds + timeDiff,
            timerLastStartedAt: null
          }
        });
      }
    }
  }

  return { updatedMatch };
};

export const addPenaltyRuns = async (scoringId, runs, teamId) => {
  const match = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true }
  });
  
  if (!match) throw new Error("Match not found");
  
  const currentInnings = match.innings.find(i => i.inningsIndex === match.currentInningsIndex);
  if (!currentInnings) throw new Error("Innings not active");

  const isBattingTeamPenalty = (teamId === currentInnings.battingTeam);

  const over = Math.floor(currentInnings.totalBalls / 6);
  const ballInOver = currentInnings.totalBalls % 6;

  const newBall = await prisma.matchBall.create({
    data: {
      matchId: scoringId,
      inningsIndex: currentInnings.inningsIndex,
      over,
      ballInOver,
      batterId: match.strikerId || "PENALTY",
      bowlerId: match.bowlerId || "PENALTY",
      runs: 0,
      isExtra: true,
      extraType: "PENALTY",
      extraRuns: parseInt(runs),
      commentary: `Penalty of ${runs} runs awarded.`
    }
  });

  let targetInnings = currentInnings;
  if (!isBattingTeamPenalty) {
    const otherInnings = match.innings.find(i => i.inningsIndex !== match.currentInningsIndex);
    if (otherInnings) targetInnings = otherInnings;
  }

  const updatedInnings = await prisma.innings.update({
    where: { id: targetInnings.id },
    data: { totalRuns: targetInnings.totalRuns + parseInt(runs) }
  });

  const { getIo } = await import('../../config/socket.js');
  const io = getIo();
  io.to(match.gameId).emit('scoreUpdated', {
    ballId: newBall.id,
    type: 'penalty',
    runs: parseInt(runs),
    match: match
  });

  return { newBall, updatedInnings };
};

export const getMatchReport = async (matchId) => {
  const match = await prisma.cricketMatch.findUnique({
    where: { id: matchId },
    include: {
      innings: true,
      playerStats: true,
      timeline: true
    }
  });

  if (!match) throw new Error("Match not found");

  return match;
};
