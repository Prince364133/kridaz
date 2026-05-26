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
    if (ball.isFour) return { type: 'boundary', label: '4', isExtra: false };
    if (ball.isSix) return { type: 'boundary', label: '6', isExtra: false };
    if (ball.isExtra && ball.extraType === 'PENALTY') return { type: 'run', label: `P${ball.extraRuns || ball.runs}`, isExtra: true };
    return { type: 'run', label: (ball.runs + (ball.extraRuns || 0)).toString(), isExtra: ball.isExtra };
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
    const slot = allSlots.find(s => s.userId === userId || s.customPlayerId === userId || s.id === userId);
    return slot?.user?.name || slot?.customPlayer?.name || "Player";
  };

  // Resolver for player profile pictures using slots
  const getPlayerImage = (userId) => {
    if (!userId) return null;
    const allSlots = [
      ...(match.teamA?.slots || []),
      ...(match.teamB?.slots || [])
    ];
    const slot = allSlots.find(s => s.userId === userId || s.customPlayerId === userId || s.id === userId);
    return slot?.user?.profilePicture || null;
  };

  // Active Batters
  const activeBatters = [scoring.strikerId, scoring.nonStrikerId].filter(id => id).map(id => {
    const stat = scoring.playerStats.find(s => s.userId === id);
    return {
      id: id,
      name: getPlayerName(id),
      profilePicture: getPlayerImage(id),
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
      profilePicture: getPlayerImage(scoring.bowlerId),
      overs: bStat ? Math.floor(bStat.bowlingBalls / 6) : 0,
      balls: bStat ? (bStat.bowlingBalls % 6) : 0,
      runs: bStat?.bowlingRuns || 0,
      wickets: bStat?.bowlingWickets || 0,
      economy: bStat?.bowlingBalls > 0 ? Number(((bStat.bowlingRuns / bStat.bowlingBalls) * 6).toFixed(2)) : 0
    };
  }

  const battingTeamImage = isTeamABatting ? match.teamA?.image : match.teamB?.image;

  // --- Phase 6: Worm Chart Data ---
  const wormData = [];
  let currentOversRuns = 0;
  let currentOversWickets = 0;
  let validBallsInInnings = 0;

  // timeline is ordered by timestamp desc, so we reverse to process chronologically
  const chronologicalTimeline = [...(scoring.timeline || [])].reverse();
  for (const ball of chronologicalTimeline) {
    currentOversRuns += ball.runs + (ball.extraRuns || 0);
    if (ball.isWicket) currentOversWickets++;
    
    // Check if it's a valid ball (not a wide or no-ball, unless it's a penalty)
    if (!ball.isExtra || ball.extraType === 'PENALTY' || ball.extraType === 'BYE' || ball.extraType === 'LEG_BYE') {
      validBallsInInnings++;
    }

    if (validBallsInInnings > 0 && validBallsInInnings % 6 === 0) {
      // Avoid pushing multiple times for the same over if consecutive extras happen
      const currentOver = validBallsInInnings / 6;
      if (!wormData.find(w => w.over === currentOver)) {
        wormData.push({ over: currentOver, runs: currentOversRuns, wickets: currentOversWickets });
      }
    }
  }
  if (validBallsInInnings % 6 !== 0) {
    wormData.push({ over: Number((validBallsInInnings / 6).toFixed(1)), runs: currentOversRuns, wickets: currentOversWickets });
  }

  // --- Phase 6: NRR Effective Overs ---
  const maxOvers = match.oversPerInnings || 20;
  const isAllOut = totalWickets >= 10;
  const nrrEffectiveBalls = (currentInnings.isCompleted && isAllOut) ? (maxOvers * 6) : totalValidBalls;
  const nrrEffectiveOvers = nrrEffectiveBalls / 6;

  // --- Phase 6: MVP/Player of the Match Engine ---
  const mvpLeaderboard = (scoring.playerStats || []).map(stat => {
    let points = 0;
    // Batting points
    points += stat.battingRuns; // 1 pt per run
    if (stat.battingRuns >= 30) points += 10;
    if (stat.battingRuns >= 50) points += 20;
    if (stat.battingRuns >= 100) points += 30;
    
    const sr = stat.battingBalls > 0 ? (stat.battingRuns / stat.battingBalls) * 100 : 0;
    if (stat.battingBalls >= 10 && sr > 150) points += 15;
    
    // Bowling points
    points += stat.bowlingWickets * 20;
    if (stat.bowlingWickets >= 3) points += 10;
    if (stat.bowlingWickets >= 5) points += 25;
    
    const econ = stat.bowlingBalls > 0 ? (stat.bowlingRuns / stat.bowlingBalls) * 6 : 0;
    if (stat.bowlingBalls >= 12 && econ < 6.0) points += 15;
    
    return {
      userId: stat.userId,
      name: getPlayerName(stat.userId),
      profilePicture: getPlayerImage(stat.userId),
      points
    };
  }).sort((a, b) => b.points - a.points).slice(0, 5); // Top 5 MVP candidates

  // --- Innings & Match Completion Detection ---
  const oversFinished = totalValidBalls >= (maxOvers * 6);
  let isInningsComplete = isAllOut || oversFinished;
  let isMatchComplete = false;

  if (currentInningsIndex === 1) {
    const targetReached = target !== null && totalRuns >= target;
    if (targetReached) {
      isInningsComplete = true;
    }
    isMatchComplete = isInningsComplete;
  }

  return {
    matchId: scoring.gameId,
    battingTeamName,
    battingTeamImage,
    date: match.date,
    time: match.time,
    scheduledStartAt: match.scheduledStartAt,
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
    lastBallRaw: scoring.timeline && scoring.timeline.length > 0 ? scoring.timeline[0] : null,
    batters: activeBatters,
    bowler: currentBowler,
    result: scoring.status === "COMPLETED" ? "Match Ended" : null,
    status: match.status,
    timerState: scoring.timerState,
    isLive: match.isLive ?? false,
    matchName: match.name,
    teamA: match.teamA,
    teamB: match.teamB,
    tickerTheme: match.tickerTheme || "neon_classic",
    youtubeVideoId: match.youtubeLiveUrl ? extractYouTubeId(match.youtubeLiveUrl) : (match.streamConfig?.youtubeVideoId ? extractYouTubeId(match.streamConfig.youtubeVideoId) || match.streamConfig.youtubeVideoId : null),
    wormData,
    nrrEffectiveOvers,
    mvpLeaderboard,
    reviews: {
      batting: currentInnings.battingTeamReviews ?? 2,
      fielding: currentInnings.fieldingTeamReviews ?? 2
    },
    powerplayOvers: currentInnings.powerplayOvers || 0,
    isInningsComplete,
    isMatchComplete,
    currentInningsIndex,
    location: match.city || match.state ? `${match.city || ''} ${match.state || ''}`.trim() : null,
    venueId: match.turfId || null,
    ground: match.ground || match.customVenue || null,
    ballType: match.ballType || null,
    format: match.format || match.gameType || null,
    professionals: (() => {
      const pros = [];
      if (match.umpire?.name) pros.push({ id: match.umpire.id, name: match.umpire.name, role: 'Umpire', profilePicture: match.umpire.profilePicture });
      else if (match.customUmpire?.name) pros.push({ name: match.customUmpire.name, role: 'Umpire' });

      if (match.scorer?.name) pros.push({ id: match.scorer.id, name: match.scorer.name, role: 'Scorer', profilePicture: match.scorer.profilePicture });
      else if (match.customScorer?.name) pros.push({ name: match.customScorer.name, role: 'Scorer' });

      if (match.streamer?.name) pros.push({ id: match.streamer.id, name: match.streamer.name, role: 'Streamer', profilePicture: match.streamer.profilePicture });
      else if (match.customStreamer?.name) pros.push({ name: match.customStreamer.name, role: 'Streamer' });

      if (Array.isArray(match.customProfessionals)) {
        match.customProfessionals.forEach(p => {
          if (p?.name) pros.push({ name: p.name, role: p.role || 'Official' });
        });
      }
      return pros;
    })(),
  };
};

function extractYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}
