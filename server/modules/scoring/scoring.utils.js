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
 * Computes a comprehensive snapshot of the live score for overlays and broadcast
 */
export const computeScoreSnapshot = (scoringDoc, matchDoc) => {
  const currentInningsIndex = scoringDoc.currentInningsIndex || 0;
  const currentInnings = scoringDoc.innings[currentInningsIndex];
  
  if (!currentInnings) return null;

  const battingTeamName = currentInnings.battingTeam === "teamA" ? 
    (matchDoc.teams?.teamA?.name || "Team A") : 
    (matchDoc.teams?.teamB?.name || "Team B");

  // Calculate Overs & Balls
  const totalValidBalls = currentInnings.totalBalls || 0;
  const overs = Math.floor(totalValidBalls / 6);
  const balls = totalValidBalls % 6;
  const overString = `${overs}.${balls}`;

  // Current Run Rate
  const totalRuns = currentInnings.totalRuns || 0;
  const totalWickets = currentInnings.totalWickets || 0;
  const crr = totalValidBalls > 0 ? (totalRuns / (totalValidBalls / 6)).toFixed(2) : "0.00";

  // Last 6 balls
  const lastBalls = scoringDoc.timeline.slice(-6).map(ball => {
    if (ball.isWicket) return { type: 'wicket', label: 'W', isExtra: ball.isExtra };
    if (ball.runs === 4) return { type: 'boundary', label: '4', isExtra: ball.isExtra };
    if (ball.runs === 6) return { type: 'boundary', label: '6', isExtra: ball.isExtra };
    return { type: 'run', label: ball.runs.toString(), isExtra: ball.isExtra };
  });

  // Calculate Target & Chase Info (if 2nd Innings)
  let target = null;
  let runsNeeded = null;
  let ballsRemaining = null;
  
  if (currentInningsIndex === 1) {
    const firstInnings = scoringDoc.innings[0];
    target = (firstInnings?.totalRuns || 0) + 1;
    runsNeeded = Math.max(0, target - totalRuns);
    
    // Use match-specific overs if available
    const maxOvers = matchDoc.oversPerInnings || 20;
    ballsRemaining = Math.max(0, (maxOvers * 6) - totalValidBalls);
  }

  const result = scoringDoc.result || null;

  // Find player name from matchDoc slots
  const getPlayerName = (userId) => {
    if (!userId) return "Unknown";
    const idStr = userId.toString();
    const allSlots = [
      ...(matchDoc.teams?.teamA?.slots || []),
      ...(matchDoc.teams?.teamB?.slots || [])
    ];
    const slot = allSlots.find(s => s.user?._id?.toString() === idStr || s.user === idStr);
    return slot?.user?.name || slot?.user?.username || "Player";
  };

  // Find active batters
  const activeBatters = scoringDoc.battingStats?.filter(b => b.outStatus === "NOT_OUT").map(b => ({
    id: b.user,
    name: getPlayerName(b.user),
    runs: b.runs,
    balls: b.balls,
    fours: b.fours,
    sixes: b.sixes,
    strikeRate: b.strikeRate
  })) || [];

  // Find current bowler from last ball
  let currentBowler = null;
  const lastBall = scoringDoc.timeline[scoringDoc.timeline.length - 1];
  if (lastBall?.bowler) {
    const bStats = scoringDoc.bowlingStats?.find(b => b.user?.toString() === lastBall.bowler.toString());
    currentBowler = {
      id: lastBall.bowler,
      name: getPlayerName(lastBall.bowler),
      overs: bStats ? Math.floor(bStats.balls / 6) : 0,
      balls: bStats ? (bStats.balls % 6) : 0,
      runs: bStats?.runs || 0,
      wickets: bStats?.wickets || 0,
      economy: bStats?.economy || 0
    };
  }

  // Calculate Partnership
  const activeBatStats = scoringDoc.battingStats?.filter(b => b.outStatus === "NOT_OUT") || [];
  let partnershipRuns = 0;
  let partnershipBalls = 0;
  if (activeBatStats.length >= 2) {
    // This is a simplification; a true partnership would track since the last wicket.
    // For now, we'll sum the current batters' runs/balls as a proxy for the current stand.
    partnershipRuns = activeBatStats.reduce((sum, b) => sum + (b.runs || 0), 0);
    partnershipBalls = activeBatStats.reduce((sum, b) => sum + (b.balls || 0), 0);
  }

  return {
    matchId: scoringDoc.matchId,
    battingTeamName,
    totalRuns,
    totalWickets,
    overs,
    balls,
    overString,
    crr,
    target,
    runsNeeded,
    ballsRemaining,
    rrr: (runsNeeded && ballsRemaining) ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : null,
    last6Balls: lastBalls,
    lastBallRaw: lastBall || null,
    batters: activeBatters,
    bowler: currentBowler,
    partnership: { runs: partnershipRuns, balls: partnershipBalls },
    commentary: matchDoc.lastCommentary || null,
    tickerTheme: matchDoc.tickerTheme || "classic",
    result
  };
};
