import crypto from "crypto";

/**
 * Generates a unique short ID for matches
 * Format: KRZ-XXXX (e.g., KRZ-A92B)
 */
export const generateShortId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  const randomBytes = crypto.randomBytes(4);
  for (let i = 0; i < 4; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return `KRZ-${result}`;
};

/**
 * Computes a comprehensive snapshot of the live score for overlays and broadcast.
 * @param {Object} scoring - The CricketMatch Prisma object (includes innings, playerStats, timeline).
 * @param {Object} match - The HostedGame Prisma object (includes teams/slots).
 */
export const computeScoreSnapshot = (scoring, match) => {
  const currentInningsIndex = scoring.currentInningsIndex || 0;
  const currentInnings = scoring.innings.find(i => i.inningsIndex === currentInningsIndex);
  
  if (!currentInnings) return null;

  const isTeamABatting = currentInnings.battingTeam === "teamA";
  const battingTeamName = isTeamABatting ? (match.teamA?.name || "Team A") : (match.teamB?.name || "Team B");

  // Calculate Overs & Balls
  const totalValidBalls = currentInnings.totalBalls || 0;
  const overs = Math.floor(totalValidBalls / 6);
  const balls = totalValidBalls % 6;
  const overString = `${overs}.${balls}`;

  // Current Run Rate
  const totalRuns = currentInnings.totalRuns || 0;
  const totalWickets = currentInnings.totalWickets || 0;
  const crr = totalValidBalls > 0 ? (totalRuns / (totalValidBalls / 6)).toFixed(2) : "0.00";

  // Last 6 balls from timeline
  const lastBalls = (scoring.timeline || []).slice(-6).map(ball => {
    if (ball.isWicket) return { type: 'wicket', label: 'W', isExtra: ball.isExtra };
    if (ball.runs === 4 && !ball.isExtra) return { type: 'boundary', label: '4', isExtra: false };
    if (ball.runs === 6 && !ball.isExtra) return { type: 'boundary', label: '6', isExtra: false };
    return { type: 'run', label: ball.runs.toString(), isExtra: ball.isExtra };
  });

  // Target & Chase Info
  let target = null;
  let runsNeeded = null;
  let ballsRemaining = null;
  
  if (currentInningsIndex === 1) {
    const firstInnings = scoring.innings.find(i => i.inningsIndex === 0);
    target = (firstInnings?.totalRuns || 0) + 1;
    runsNeeded = Math.max(0, target - totalRuns);
    const maxOvers = match.oversPerInnings || 20;
    ballsRemaining = Math.max(0, (maxOvers * 6) - totalValidBalls);
  }

  // Resolver for player names using slots
  const getPlayerName = (userId) => {
    if (!userId) return "Unknown";
    const allSlots = [
      ...(match.teamA?.slots || []),
      ...(match.teamB?.slots || [])
    ];
    const slot = allSlots.find(s => s.userId === userId);
    return slot?.user?.name || "Player";
  };

  // Active Batters
  const activeBatters = [scoring.strikerId, scoring.nonStrikerId].filter(id => id).map(id => {
    const stat = scoring.playerStats.find(s => s.userId === id);
    return {
      id: id,
      name: getPlayerName(id),
      runs: stat?.battingRuns || 0,
      balls: stat?.battingBalls || 0,
      fours: stat?.battingFours || 0,
      sixes: stat?.battingSixes || 0,
      strikeRate: stat?.battingBalls > 0 ? Number(((stat.battingRuns / stat.battingBalls) * 100).toFixed(2)) : 0
    };
  });

  // Current Bowler
  let currentBowler = null;
  if (scoring.bowlerId) {
    const bStat = scoring.playerStats.find(s => s.userId === scoring.bowlerId);
    currentBowler = {
      id: scoring.bowlerId,
      name: getPlayerName(scoring.bowlerId),
      overs: bStat ? Math.floor(bStat.bowlingBalls / 6) : 0,
      balls: bStat ? (bStat.bowlingBalls % 6) : 0,
      runs: bStat?.bowlingRuns || 0,
      wickets: bStat?.bowlingWickets || 0,
      economy: bStat?.bowlingBalls > 0 ? Number(((bStat.bowlingRuns / bStat.bowlingBalls) * 6).toFixed(2)) : 0
    };
  }

  return {
    matchId: scoring.gameId,
    battingTeamName,
    totalRuns,
    totalWickets,
    runs: totalRuns,
    wickets: totalWickets,
    overs,
    balls,
    overString,
    crr,
    target,
    runsNeeded,
    ballsRemaining,
    rrr: (runsNeeded && ballsRemaining) ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : null,
    last6Balls: lastBalls,
    batters: activeBatters,
    bowler: currentBowler,
    result: scoring.status === "COMPLETED" ? "Match Ended" : null
  };
};
