import User from "../../models/user.model.js";

/**
 * Aggregates and updates player statistics after a match is completed.
 * @param {Object} matchScoring - The completed CricketScoring document.
 * @param {Object} hostedGame - The corresponding HostedGame document.
 */
export const aggregatePlayerStats = async (matchScoring, hostedGame) => {
  try {
    const userUpdates = new Map();

    const getUserData = async (userId) => {
      const idStr = userId?.toString();
      if (!idStr) return null;
      if (userUpdates.has(idStr)) {
        return userUpdates.get(idStr);
      }
      const user = await User.findById(userId);
      if (user) {
        if (!user.stats) user.stats = { cricket: {} };
        if (!user.stats.cricket) user.stats.cricket = {};
        userUpdates.set(idStr, user);
      }
      return user;
    };

    // 1. Process Batting Stats
    for (const stat of matchScoring.battingStats) {
      const user = await getUserData(stat.user);
      if (!user) continue;

      const cricket = user.stats.cricket;
      cricket.matches = (cricket.matches || 0) + 1;
      cricket.runs = (cricket.runs || 0) + stat.runs;
      cricket.ballsFaced = (cricket.ballsFaced || 0) + stat.balls;
      
      if (stat.runs > (cricket.highestScore || 0)) {
        cricket.highestScore = stat.runs;
      }

      if (stat.runs >= 100) {
        cricket.hundreds = (cricket.hundreds || 0) + 1;
      } else if (stat.runs >= 50) {
        cricket.fifties = (cricket.fifties || 0) + 1;
      }

      // Calculate Averages & Strike Rate
      cricket.battingAverage = Number((cricket.runs / cricket.matches).toFixed(2));
      cricket.battingStrikeRate = cricket.ballsFaced > 0 
        ? Number(((cricket.runs / cricket.ballsFaced) * 100).toFixed(2)) 
        : 0;
    }

    // 2. Process Bowling Stats
    for (const stat of matchScoring.bowlingStats) {
      const user = await getUserData(stat.user);
      if (!user) continue;

      const cricket = user.stats.cricket;
      cricket.wickets = (cricket.wickets || 0) + stat.wickets;
      cricket.runsConceded = (cricket.runsConceded || 0) + stat.runs;
      cricket.ballsBowled = (cricket.ballsBowled || 0) + stat.balls;

      // Best Bowling
      const currentBest = cricket.bestBowling || { wickets: 0, runs: 999 };
      if (stat.wickets > currentBest.wickets || 
         (stat.wickets === currentBest.wickets && stat.runs < currentBest.runs)) {
        cricket.bestBowling = { wickets: stat.wickets, runs: stat.runs };
      }

      // Economy & Average
      cricket.bowlingEconomy = cricket.ballsBowled > 0 
        ? Number(((cricket.runsConceded / cricket.ballsBowled) * 6).toFixed(2)) 
        : 0;
      cricket.bowlingAverage = cricket.wickets > 0 
        ? Number((cricket.runsConceded / cricket.wickets).toFixed(2)) 
        : 0;
    }

    // 3. Process Fielding Stats from Timeline
    for (const ball of matchScoring.timeline) {
      if (ball.isWicket && ball.fielder) {
        const user = await getUserData(ball.fielder);
        if (!user) continue;

        const cricket = user.stats.cricket;
        const wType = ball.wicketType?.toUpperCase();
        if (wType === "CAUGHT") {
          cricket.catches = (cricket.catches || 0) + 1;
        } else if (wType === "STUMPED") {
          cricket.stumpings = (cricket.stumpings || 0) + 1;
        }
      }
    }

    // 4. Update Official Stats (Umpire, Scorer, Streamer)
    if (hostedGame) {
      const umpireId = hostedGame.umpire || hostedGame.umpireRequest?.user;
      if (umpireId) {
        const user = await getUserData(umpireId);
        if (user) {
          user.stats.matchesOfficiated = (user.stats.matchesOfficiated || 0) + 1;
        }
      }

      const scorerId = hostedGame.scorer || hostedGame.scorerRequest?.user;
      if (scorerId) {
        const user = await getUserData(scorerId);
        if (user) {
          user.stats.matchesScored = (user.stats.matchesScored || 0) + 1;
        }
      }

      const streamerId = hostedGame.streamer || hostedGame.streamerRequest?.user;
      if (streamerId) {
        const user = await getUserData(streamerId);
        if (user) {
          user.stats.streamsHosted = (user.stats.streamsHosted || 0) + 1;
        }
      }
    }

    // 5. Check for Badges
    const earnedBadges = [];
    for (const user of userUpdates.values()) {
      const newBadges = checkAndAwardBadges(user);
      if (newBadges.length > 0) {
        earnedBadges.push({
          userId: user._id,
          userName: user.name,
          badges: newBadges
        });
      }
    }

    // Save all updated users
    for (const user of userUpdates.values()) {
      await user.save();
    }

    console.log(`Successfully aggregated advanced stats for match ${matchScoring.matchId}`);
    return earnedBadges;
  } catch (error) {
    console.error("Error in aggregatePlayerStats:", error);
  }
};

const checkAndAwardBadges = (user) => {
  if (!user.stats?.cricket) return [];
  const cricket = user.stats.cricket;
  const currentBadges = user.badges || [];
  const newBadges = [];

  const hasBadge = (name) => currentBadges.some(b => b.name === name);

  // 1. Century Maker (Milestone: Total Runs)
  if (cricket.runs >= 100 && !hasBadge('Century Maker')) {
    newBadges.push({
      name: 'Century Maker',
      category: 'batting',
      icon: 'Trophy',
      description: 'Reached a monumental 100 career runs milestone.'
    });
  }

  // 2. Wicket Machine (Milestone: Total Wickets)
  if (cricket.wickets >= 10 && !hasBadge('Wicket Machine')) {
    newBadges.push({
      name: 'Wicket Machine',
      category: 'bowling',
      icon: 'Target',
      description: 'Became a threat to batters with 10 career wickets.'
    });
  }

  // 3. Safe Hands (Milestone: Catches)
  if (cricket.catches >= 5 && !hasBadge('Safe Hands')) {
    newBadges.push({
      name: 'Safe Hands',
      category: 'fielding',
      icon: 'Activity',
      description: 'Proven defensive reliability with 5 career catches.'
    });
  }

  // 4. Debutant (Milestone: First Match)
  if (cricket.matches >= 1 && !hasBadge('Rising Star')) {
    newBadges.push({
      name: 'Rising Star',
      category: 'ranking',
      icon: 'Star',
      description: 'Successfully completed the first official match on Kridaz.'
    });
  }
  
  if (newBadges.length > 0) {
    user.badges = [...currentBadges, ...newBadges];
  }
  return newBadges;
};
