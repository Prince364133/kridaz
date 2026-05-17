import { prisma } from "../../config/prisma.js";
import StatsService from "../../services/stats.service.js";
import logger from "../../utils/logger.js";

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
      if (stat.balls > 0 || stat.runs > 0) {
        cricket.matches = (cricket.matches || 0) + 1;
        cricket.runs = (cricket.runs || 0) + (stat.runs || 0);
        cricket.ballsFaced = (cricket.ballsFaced || 0) + (stat.balls || 0);
        
        if ((stat.runs || 0) > (cricket.highestScore || 0)) {
          cricket.highestScore = stat.runs;
        }

        if (stat.runs >= 100) cricket.hundreds = (cricket.hundreds || 0) + 1;
        else if (stat.runs >= 50) cricket.fifties = (cricket.fifties || 0) + 1;

        cricket.battingAverage = cricket.matches > 0 ? Number((cricket.runs / cricket.matches).toFixed(2)) : 0;
        cricket.battingStrikeRate = cricket.ballsFaced > 0 ? Number(((cricket.runs / cricket.ballsFaced) * 100).toFixed(2)) : 0;
      }

      // Bowling
      if (stat.ballsBowled > 0) {
        cricket.wickets = (cricket.wickets || 0) + (stat.wickets || 0);
        cricket.runsConceded = (cricket.runsConceded || 0) + (stat.runsConceded || 0);
        cricket.ballsBowled = (cricket.ballsBowled || 0) + (stat.ballsBowled || 0);

        const currentBest = cricket.bestBowling || { wickets: 0, runs: 999 };
        if (stat.wickets > currentBest.wickets || (stat.wickets === currentBest.wickets && stat.runsConceded < currentBest.runs)) {
          cricket.bestBowling = { wickets: stat.wickets, runs: stat.runsConceded };
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
