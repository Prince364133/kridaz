import mongoose from "mongoose";
import HostedGame from "../../models/hostedGame.model.js";
import CricketScoring from "../../models/cricketScoring.model.js";

import User from "../../models/user.model.js";
import { generateShortId, computeScoreSnapshot } from "./scoring.utils.js";
import { aggregatePlayerStats } from "./scoring.service.js";
import { liveStateService } from "../../services/liveState.service.js";
import { commentaryService } from "../../services/commentary.service.js";
import { getIO } from "../../config/socket.js";
import jwt from "jsonwebtoken";

/**
 * Initialize a Live Stream overlay session
 */
export const goLive = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const hostedGame = await HostedGame.findById(matchId);
    if (!hostedGame) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    // Generate secure token for OBS overlay
    const overlayToken = jwt.sign(
      { matchId: hostedGame._id, type: 'OBS_OVERLAY' }, 
      process.env.OVERLAY_TOKEN_SECRET || 'fallback_secret', 
      { expiresIn: '12h' }
    );

    hostedGame.isLive = true;
    hostedGame.overlayToken = overlayToken;
    hostedGame.streamStatus = 'starting';
    hostedGame.liveStartedAt = new Date();
    await hostedGame.save();

    // Initialize Redis state — errors here are non-fatal; log and continue
    const overlayConfig = hostedGame.overlayConfig || { showScoreboard: true, showCommentary: true };
    try {
      await liveStateService.setStreamStatus(matchId, 'starting');
      await liveStateService.setOverlayConfig(matchId, overlayConfig);
    } catch (redisErr) {
      console.warn("[Scoring] Redis state init failed (non-fatal):", redisErr.message);
    }

    const appBase = process.env.APP_BASE_URL || 'http://localhost:5174';
    res.status(200).json({ 
      success: true, 
      overlayToken,
      streamStatus: hostedGame.streamStatus,
      youtubeVideoId: hostedGame.youtubeVideoId,
      urls: {
        obsOverlay: `${appBase}/live-overlay/${matchId}?token=${overlayToken}`,
        publicScoreboard: `${appBase}/live-score/${matchId}`
      }
    });
  } catch (error) {
    console.error("[Scoring] Go Live Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * End Live Broadcast
 */
export const endLive = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const hostedGame = await HostedGame.findById(matchId);
    if (!hostedGame) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    hostedGame.isLive = false;
    hostedGame.overlayToken = null;
    hostedGame.streamStatus = 'ended';
    await hostedGame.save();

    // Redis cleanup — non-fatal
    try {
      await liveStateService.setStreamStatus(matchId, 'ended');
    } catch (redisErr) {
      console.warn("[Scoring] Redis cleanup failed (non-fatal):", redisErr.message);
    }

    res.status(200).json({ success: true, message: "Live stream ended." });
  } catch (error) {
    console.error("[Scoring] End Live Error:", error);
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

    const hostedGame = await HostedGame.findById(matchId);
    if (!hostedGame) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    hostedGame.youtubeVideoId = youtubeVideoId;
    hostedGame.youtubeLiveChatId = youtubeLiveChatId;
    hostedGame.streamStatus = youtubeVideoId ? 'online' : 'offline';
    await hostedGame.save();

    await liveStateService.setStreamStatus(matchId, hostedGame.streamStatus);

    res.status(200).json({ success: true, message: "Stream configuration updated", streamStatus: hostedGame.streamStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * Complete a match and aggregate stats
 */
export const completeMatch = async (req, res) => {
  try {
    const { scoringId } = req.body;
    const scoring = await CricketScoring.findById(scoringId);
    
    if (!scoring) {
      return res.status(404).json({ success: false, message: "Scoring session not found" });
    }

    scoring.status = "COMPLETED";
    await scoring.save();

    const match = await HostedGame.findById(scoring.matchId);
    if (match) {
      match.scoringStatus = "COMPLETED";
      match.status = "COMPLETED";
      await match.save();
    }

    // Trigger aggregation
    const earnedBadges = await aggregatePlayerStats(scoring);

    res.status(200).json({ 
      success: true, 
      message: "Match completed and stats aggregated",
      earnedBadges
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Find a match by its short ID
 */
export const searchMatch = async (req, res) => {
  try {
    const { shortId } = req.params;
    const match = await HostedGame.findOne({ shortId: shortId.toUpperCase() })
      .populate("host", "name profilePicture")
      .populate("ground", "name location city");

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
    
    // Support both req.owner and req.user for maximum compatibility
    const umpireId = req.owner?.ownerId || req.user?.id;

    console.log(`[Scoring] startScoring: matchId=${matchId}, umpireId=${umpireId}, team=${finalBattingTeam}`);

    if (!umpireId) {
      return res.status(401).json({ success: false, message: "Umpire identity not found. Please log in again." });
    }

    const hostedGame = await HostedGame.findById(matchId).populate("umpire");
    if (!hostedGame) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    // Support both direct ID match and Owner-User relationship match
    const matchUmpireId = hostedGame.umpire?._id || hostedGame.umpire;
    const matchUmpireUserId = hostedGame.umpire?.userId;

    // Comprehensive Authorization Check
    const matchUmpireIdStr = matchUmpireId?.toString();
    const matchUmpireUserIdStr = matchUmpireUserId?.toString();
    const matchHostIdStr = hostedGame.host?._id?.toString() || hostedGame.host?.toString();
    const matchRequestUmpireIdStr = hostedGame.umpireRequest?.user?._id?.toString() || hostedGame.umpireRequest?.user?.toString();
    
    const reqUmpireIdStr = umpireId?.toString();
    const reqUserIdStr = req.user?.id?.toString() || req.user?.user?.toString();
    const userRole = req.user?.role;
    const isAdmin = ["BMSP_SUPER_ADMIN", "BMSP_ADMIN"].includes(userRole);

    console.log(`[Scoring] Auth Debug:
      Match Umpire: ${matchUmpireIdStr}
      Match Umpire User: ${matchUmpireUserIdStr}
      Match Request Umpire: ${matchRequestUmpireIdStr}
      Match Host: ${matchHostIdStr}
      Req Umpire: ${reqUmpireIdStr}
      Req User: ${reqUserIdStr}
      User Role: ${userRole}
    `);

    const isAuthorized = 
      isAdmin ||
      (matchUmpireIdStr && matchUmpireIdStr === reqUmpireIdStr) || 
      (matchUmpireUserIdStr && matchUmpireUserIdStr === reqUserIdStr) ||
      (matchUmpireIdStr && matchUmpireIdStr === reqUserIdStr) ||
      (matchHostIdStr && matchHostIdStr === reqUserIdStr) ||
      (matchRequestUmpireIdStr && matchRequestUmpireIdStr === reqUmpireIdStr);

    if (!isAuthorized) {
      console.log(`[Scoring] Auth FAILED after check.`);
      return res.status(403).json({ 
        success: false, 
        message: "Authorization failed. Only the assigned umpire, host, or admin can score this match.",
        debug: { matchUmpireIdStr, matchHostIdStr, matchRequestUmpireIdStr, reqUmpireIdStr, reqUserIdStr, userRole }
      });
    }

    let scoring = await CricketScoring.findOne({ matchId });

    if (!scoring) {
      scoring = new CricketScoring({
        matchId,
        umpire: req.user.id,
        currentInningsIndex: 0,
        innings: [
          {
            battingTeam: finalBattingTeam,
            totalRuns: 0,
            totalWickets: 0,
            totalBalls: 0,
            isCompleted: false,
            extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 }
          }
        ]
      });
      await scoring.save();

      hostedGame.scoringStatus = "IN_PROGRESS";
      await hostedGame.save();
    }

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    console.error("[Scoring] Start Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Transition to next innings (P4.2)
 * Body: { scoringId, battingTeamId }
 */
export const startNextInnings = async (req, res) => {
  try {
    const { scoringId, battingTeamId } = req.body;
    const scoring = await CricketScoring.findById(scoringId);
    if (!scoring) return res.status(404).json({ success: false, message: "Scoring session not found" });

    // Mark current innings as complete
    if (scoring.innings[scoring.currentInningsIndex]) {
      scoring.innings[scoring.currentInningsIndex].isCompleted = true;
    }

    // Increment index
    scoring.currentInningsIndex = 1;
    
    // Add 2nd innings object if not present
    if (scoring.innings.length < 2) {
      scoring.innings.push({
        battingTeam: battingTeamId,
        totalRuns: 0,
        totalWickets: 0,
        totalBalls: 0,
        isCompleted: false,
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 }
      });
    }

    // Reset active players for new innings
    scoring.currentStriker = null;
    scoring.currentNonStriker = null;
    scoring.currentBowler = null;

    await scoring.save();

    // Trigger score snapshot update for all clients
    const match = await HostedGame.findById(scoring.matchId);
    const liveData = computeScoreSnapshot(scoring, match);
    await liveStateService.setLiveScore(scoring.matchId, liveData);
    
    const io = getIO();
    if (io) io.to(scoring.matchId.toString()).emit("scoreUpdated", liveData);

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Set toss result (P2.1)
 * Body: { scoringId, winnerTeam: "teamA"|"teamB", decision: "BAT"|"BOWL" }
 */
export const setToss = async (req, res) => {
  try {
    const { scoringId, winnerTeam, decision } = req.body;
    const scoring = await CricketScoring.findById(scoringId);
    if (!scoring) return res.status(404).json({ success: false, message: "Scoring session not found" });

    scoring.toss = { winnerTeam, decision };
    await scoring.save();

    res.status(200).json({ success: true, toss: scoring.toss });
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
    const scoring = await CricketScoring.findById(scoringId);
    if (!scoring) return res.status(404).json({ success: false, message: "Scoring session not found" });

    // Validate no consecutive bowler
    if (bowlerId && scoring.currentBowler?.toString() === bowlerId) {
      return res.status(400).json({ success: false, message: "Same bowler cannot bowl consecutive overs" });
    }

    if (bowlerId) {
      scoring.previousBowler = scoring.currentBowler;
      scoring.currentBowler = bowlerId;
      // Ensure bowler has a bowlingStats entry
      const hasBowlStats = scoring.bowlingStats.some(b => b.user?.toString() === bowlerId);
      if (!hasBowlStats) {
        scoring.bowlingStats.push({ user: bowlerId, inningsIndex: scoring.currentInningsIndex });
      }
    }
    if (strikerId) {
      scoring.currentStriker = strikerId;
      // Ensure batter has a battingStats entry
      const hasBatStats = scoring.battingStats.some(b => b.user?.toString() === strikerId);
      if (!hasBatStats) {
        scoring.battingStats.push({ user: strikerId, inningsIndex: scoring.currentInningsIndex });
      }
    }
    if (nonStrikerId) {
      scoring.currentNonStriker = nonStrikerId;
      const hasBatStats = scoring.battingStats.some(b => b.user?.toString() === nonStrikerId);
      if (!hasBatStats) {
        scoring.battingStats.push({ user: nonStrikerId, inningsIndex: scoring.currentInningsIndex });
      }
    }

    await scoring.save();
    res.status(200).json({ success: true, scoring });
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
    const scoring = await CricketScoring.findById(scoringId);
    if (!scoring) return res.status(404).json({ success: false, message: "Scoring session not found" });
    if (!scoring.timeline.length) return res.status(400).json({ success: false, message: "No balls to undo" });

    const lastBall = scoring.timeline[scoring.timeline.length - 1];
    const inningsIdx = lastBall.inningsIndex ?? scoring.currentInningsIndex;
    const currentInnings = scoring.innings[inningsIdx];

    // Reverse innings totals
    currentInnings.totalRuns -= (lastBall.runs ?? 0);
    if (!lastBall.isExtra || lastBall.extraType === "NO_BALL") {
      if (lastBall.extraType !== "WIDE") currentInnings.totalBalls = Math.max(0, currentInnings.totalBalls - 1);
    }
    if (lastBall.isWicket) currentInnings.totalWickets = Math.max(0, currentInnings.totalWickets - 1);

    // Reverse extras
    const runs = lastBall.runs ?? 0;
    if (lastBall.extraType === "WIDE") currentInnings.extras.wides = Math.max(0, currentInnings.extras.wides - runs);
    else if (lastBall.extraType === "NO_BALL") currentInnings.extras.noBalls = Math.max(0, currentInnings.extras.noBalls - 1);
    else if (lastBall.extraType === "BYE") currentInnings.extras.byes = Math.max(0, currentInnings.extras.byes - runs);
    else if (lastBall.extraType === "LEG_BYE") currentInnings.extras.legByes = Math.max(0, currentInnings.extras.legByes - runs);

    // Reverse batting stats (only for legal + BYE/LB credit runs)
    const batterId = lastBall.batter?.toString();
    if (batterId && !["WIDE", "BYE", "LEG_BYE"].includes(lastBall.extraType)) {
      const batStat = scoring.battingStats.find(b => b.user?.toString() === batterId);
      if (batStat) {
        const runsToRemove = lastBall.extraType === "NO_BALL" ? (lastBall.runs ?? 0) : (lastBall.runs ?? 0);
        batStat.runs = Math.max(0, batStat.runs - runsToRemove);
        if (lastBall.extraType !== "NO_BALL") batStat.balls = Math.max(0, batStat.balls - 1);
        if (lastBall.isBoundary && runs === 4) batStat.fours = Math.max(0, batStat.fours - 1);
        if (lastBall.isBoundary && runs === 6) batStat.sixes = Math.max(0, batStat.sixes - 1);
        if (lastBall.isWicket) batStat.outStatus = "NOT_OUT";
        batStat.strikeRate = batStat.balls > 0 ? parseFloat(((batStat.runs / batStat.balls) * 100).toFixed(2)) : 0;
      }
    }

    // Reverse bowling stats
    const bowlerId = lastBall.bowler?.toString();
    if (bowlerId) {
      const bowlStat = scoring.bowlingStats.find(b => b.user?.toString() === bowlerId);
      if (bowlStat) {
        if (lastBall.extraType !== "WIDE") bowlStat.balls = Math.max(0, bowlStat.balls - 1);
        if (lastBall.extraType === "WIDE") bowlStat.wides = Math.max(0, bowlStat.wides - 1);
        if (lastBall.extraType === "NO_BALL") bowlStat.noBalls = Math.max(0, bowlStat.noBalls - 1);
        // Only non-bye/legbye runs are charged to bowler
        if (!["BYE", "LEG_BYE"].includes(lastBall.extraType)) {
          bowlStat.runs = Math.max(0, bowlStat.runs - (lastBall.runs ?? 0));
        }
        if (lastBall.isWicket && !["RUN_OUT", "RETIRED_HURT", "OBSTRUCTING"].includes(lastBall.wicketType)) {
          bowlStat.wickets = Math.max(0, bowlStat.wickets - 1);
        }
        bowlStat.overs = Math.floor(bowlStat.balls / 6);
        bowlStat.economy = bowlStat.balls > 0 ? parseFloat(((bowlStat.runs / bowlStat.balls) * 6).toFixed(2)) : 0;
      }
    }

    // Remove last ball from timeline
    scoring.timeline.pop();
    await scoring.save();

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    console.error("[Scoring] Undo Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update score (Ball-by-ball) — Phase 1 full implementation
 */
export const updateScore = async (req, res) => {
  try {
    const { scoringId, ballData } = req.body;
    // ballData shape: { runs, isExtra, extraType, isBoundary, isWicket, wicketType, fielderId, nextBatterId, bowlerId?, batterId? }

    const scoring = await CricketScoring.findById(scoringId);
    if (!scoring) return res.status(404).json({ success: false, message: "Scoring session not found" });

    const inningsIdx = scoring.currentInningsIndex;
    const currentInnings = scoring.innings[inningsIdx];
    if (!currentInnings) return res.status(400).json({ success: false, message: "No active innings" });

    const isWide = ballData.extraType === "WIDE";
    const isNoBall = ballData.extraType === "NO_BALL";
    const isBye = ballData.extraType === "BYE";
    const isLegBye = ballData.extraType === "LEG_BYE";
    const runs = ballData.runs ?? 0;

    // Active players — use ballData overrides or current scoring state
    const strikerId = ballData.batterId || scoring.currentStriker?.toString();
    const bowlerId = ballData.bowlerId || scoring.currentBowler?.toString();

    // ── 1. Determine over/ball position ──────────────────────────────────────
    const overNumber = Math.floor(currentInnings.totalBalls / 6);
    const ballInOver = currentInnings.totalBalls % 6;

    // ── 2. Push ball to timeline ─────────────────────────────────────────────
    const timelineEntry = {
      inningsIndex: inningsIdx,
      over: overNumber,
      ballInOver,
      batter: strikerId || undefined,
      bowler: bowlerId || undefined,
      runs,
      isExtra: ballData.isExtra || false,
      extraType: ballData.extraType || "NONE",
      isBoundary: ballData.isBoundary || false,
      isWicket: ballData.isWicket || false,
      wicketType: ballData.wicketType || null,
      fielder: ballData.fielderId || undefined,
      timestamp: new Date(),
    };
    scoring.timeline.push(timelineEntry);

    // ── 3. Update innings totals ─────────────────────────────────────────────
    currentInnings.totalRuns += runs;
    if (!isWide) currentInnings.totalBalls += 1; // wides don't count as legal balls
    if (ballData.isWicket) currentInnings.totalWickets += 1;

    // ── 4. Update extras breakdown ───────────────────────────────────────────
    if (isWide) currentInnings.extras.wides += runs;
    else if (isNoBall) currentInnings.extras.noBalls += 1;
    else if (isBye) currentInnings.extras.byes += runs;
    else if (isLegBye) currentInnings.extras.legByes += runs;

    // ── 5. Update batting stats ──────────────────────────────────────────────
    // Runs credited to batsman: regular + NB runs; NOT wides/byes/legbyes
    if (strikerId && !isWide && !isBye && !isLegBye) {
      let batStat = scoring.battingStats.find(b => b.user?.toString() === strikerId);
      if (!batStat) {
        scoring.battingStats.push({ user: strikerId, inningsIndex: inningsIdx });
        batStat = scoring.battingStats[scoring.battingStats.length - 1];
      }
      batStat.runs += runs;
      if (!isNoBall) batStat.balls += 1; // NB doesn't count as a ball faced
      if (ballData.isBoundary && runs === 4) batStat.fours += 1;
      if (ballData.isBoundary && runs === 6) batStat.sixes += 1;
      batStat.strikeRate = batStat.balls > 0 ? parseFloat(((batStat.runs / batStat.balls) * 100).toFixed(2)) : 0;

      // Record dismissal
      if (ballData.isWicket) {
        batStat.outStatus = ballData.wicketType || "OUT";
        batStat.wicketType = ballData.wicketType || null;
        batStat.dismissedBy = bowlerId || undefined;
        if (["CAUGHT", "STUMPED"].includes(ballData.wicketType)) {
          batStat.caughtBy = ballData.fielderId || undefined;
        }
      }
    }

    // ── 6. Update bowling stats ──────────────────────────────────────────────
    if (bowlerId) {
      let bowlStat = scoring.bowlingStats.find(b => b.user?.toString() === bowlerId);
      if (!bowlStat) {
        scoring.bowlingStats.push({ user: bowlerId, inningsIndex: inningsIdx });
        bowlStat = scoring.bowlingStats[scoring.bowlingStats.length - 1];
      }
      if (!isWide) bowlStat.balls += 1;
      if (isWide) bowlStat.wides += 1;
      if (isNoBall) bowlStat.noBalls += 1;
      // Byes/legbyes don't charge runs to bowler
      if (!isBye && !isLegBye) bowlStat.runs += runs;
      // Wickets that credit the bowler (not run-outs, retired, obstructing)
      if (ballData.isWicket && !["RUN_OUT", "RETIRED_HURT", "RETIRED_OUT", "OBSTRUCTING", "TIMED_OUT"].includes(ballData.wicketType)) {
        bowlStat.wickets += 1;
      }
      bowlStat.overs = Math.floor(bowlStat.balls / 6);
      bowlStat.economy = bowlStat.balls > 0 ? parseFloat(((bowlStat.runs / bowlStat.balls) * 6).toFixed(2)) : 0;
    }

    // ── 7. Strike rotation (P1.3) ────────────────────────────────────────────
    // No rotation on: wides, no-balls, wickets (handled separately via setPlayers)
    const isOverComplete = !isWide && (currentInnings.totalBalls % 6 === 0) && currentInnings.totalBalls > 0;
    if (!ballData.isWicket && !isWide) {
      const isOdd = runs % 2 !== 0;
      if (isOdd) {
        // Swap striker and non-striker
        const temp = scoring.currentStriker;
        scoring.currentStriker = scoring.currentNonStriker;
        scoring.currentNonStriker = temp;
      }
    }
    // At end of over, swap strike (batters swap ends)
    if (isOverComplete && !ballData.isWicket) {
      const temp = scoring.currentStriker;
      scoring.currentStriker = scoring.currentNonStriker;
      scoring.currentNonStriker = temp;
    }

    // Handle next batter after wicket
    if (ballData.isWicket && ballData.nextBatterId) {
      scoring.currentStriker = ballData.nextBatterId;
      // Ensure stats entry
      const hasBatStats = scoring.battingStats.some(b => b.user?.toString() === ballData.nextBatterId);
      if (!hasBatStats) {
        scoring.battingStats.push({ user: ballData.nextBatterId, inningsIndex: inningsIdx });
      }
    }

    await scoring.save();

    // ── 8. Live broadcast (existing logic) ───────────────────────────────────
    const match = await HostedGame.findById(scoring.matchId).populate("teams.teamA.slots.user teams.teamB.slots.user");
    const battingTeamLabel = currentInnings.battingTeam === "teamA" ? "Team A" : "Team B";
    const batsmanUser = await User.findById(strikerId).select("name");
    const bowlerUser = await User.findById(bowlerId).select("name");

    const isBoundary = ballData.isBoundary && (runs === 4 || runs === 6);
    const isKeyEvent = isBoundary || ballData.isWicket || isOverComplete || (currentInnings.totalBalls % 3 === 0);

    let commentaryObj = null;
    if (isKeyEvent) {
      const commentaryText = await commentaryService.generateCommentary({
        battingTeam: battingTeamLabel,
        batsman: batsmanUser?.name || "Batsman",
        bowler: bowlerUser?.name || "Bowler",
        event: ballData.wicketType || (runs === 6 ? "SIX" : runs === 4 ? "FOUR" : runs === 0 ? "DOT" : "RUNS"),
        runs,
        isWicket: ballData.isWicket,
        isOverComplete,
        context: `${currentInnings.totalRuns}/${currentInnings.totalWickets} in ${Math.floor(currentInnings.totalBalls / 6)}.${currentInnings.totalBalls % 6} overs. ${battingTeamLabel} is batting.`
      });
      commentaryObj = { ballIndex: currentInnings.totalBalls, text: commentaryText, timestamp: new Date(), type: "AI" };
      await liveStateService.addCommentary(scoring.matchId, commentaryObj);
      match.lastCommentary = commentaryText;
      match.lastCommentaryAt = new Date();
    }

    const liveData = computeScoreSnapshot(scoring, match);
    liveData.commentary = commentaryObj;
    liveData.overComplete = isOverComplete;

    await liveStateService.setLiveScore(scoring.matchId, liveData);
    match.liveScoreSnapshot = liveData;
    await match.save();

    const io = getIO();
    if (io) {
      const roomId = scoring.matchId.toString();
      io.to(roomId).emit("scoreUpdated", liveData);

      const eventType =
        ballData.isWicket         ? 'wicket'  :
        ballData.isBoundary && runs === 6 ? 'six'     :
        ballData.isBoundary && runs === 4 ? 'four'    :
        isWide                    ? 'wide'    :
        isNoBall                  ? 'no_ball' :
        runs === 0                ? 'dot'     : 'run';

      io.to(roomId).emit("ballEvent", {
        type: eventType,
        runs,
        isWicket: ballData.isWicket || false,
        wicketType: ballData.wicketType || null,
        strikerName: batsmanUser?.name || null,
        description: liveData.lastBallRaw ? buildBallDesc(eventType, runs, batsmanUser?.name, ballData.wicketType) : null,
        timestamp: Date.now(),
      });
    }

    // ── 9. Automatic Match Conclusion Detection ──────────────────────────────
    const maxOvers = match.oversPerInnings || 20;
    const totalLegalBalls = currentInnings.totalBalls;
    const isInningsEnd = (currentInnings.totalWickets >= 10) || (totalLegalBalls >= maxOvers * 6);
    
    if (inningsIdx === 1) {
      // 2nd Innings Check
      const firstInningsRuns = scoring.innings[0].totalRuns;
      const target = firstInningsRuns + 1;
      
      let matchResult = null;
      if (currentInnings.totalRuns >= target) {
        matchResult = `${battingTeamLabel} won by ${10 - currentInnings.totalWickets} wickets`;
      } else if (isInningsEnd) {
        if (currentInnings.totalRuns < firstInningsRuns) {
          const bowlingTeamLabel = currentInnings.battingTeam === "teamA" ? "Team B" : "Team A";
          const runsWonBy = firstInningsRuns - currentInnings.totalRuns;
          matchResult = `${bowlingTeamLabel} won by ${runsWonBy} runs`;
        } else if (currentInnings.totalRuns === firstInningsRuns) {
          matchResult = "Match Tied";
        }
      }

      if (matchResult) {
        scoring.status = "COMPLETED";
        scoring.result = matchResult;
        scoring.innings[1].isCompleted = true;
        await scoring.save();
        
        match.status = "COMPLETED";
        match.scoringStatus = "COMPLETED";
        match.liveScoreSnapshot = { ...liveData, result: matchResult, isCompleted: true };
        await match.save();
        
        if (io) {
          io.to(scoring.matchId.toString()).emit("matchCompleted", { matchResult, liveData: match.liveScoreSnapshot });
        }
      }
    } else if (isInningsEnd) {
      // 1st Innings End
      if (io) {
        io.to(scoring.matchId.toString()).emit("inningsCompleted", { inningsIndex: 0, totalRuns: currentInnings.totalRuns });
      }
    }

    res.status(200).json({
      success: true,
      scoring,
      commentary: commentaryObj?.text || null,
      overComplete: isOverComplete,
      liveData,
    });
  } catch (error) {
    console.error("[Scoring] Update Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * Get current match status
 */
export const getMatchStatus = async (req, res) => {
  try {
    const { matchId } = req.params;
    console.log(`[Scoring] Fetching status for match: ${matchId}`);
    
    // Check if scoring exists
    const scoring = await CricketScoring.findOne({ matchId })
      .populate("matchId")
      .populate("umpire", "name")
      .populate("battingStats.user", "name profilePicture")
      .populate("bowlingStats.user", "name profilePicture");

    if (!scoring) {
      console.log(`[Scoring] No active session, providing hostedGame fallback for: ${matchId}`);
      // Fallback to hosted game details
      const hostedGame = await HostedGame.findById(matchId)
        .populate("host", "name profilePicture")
        .populate("ground", "name location city")
        .populate("umpire", "name profilePicture")
        .populate("teams.teamA.slots.user", "name profilePicture")
        .populate("teams.teamB.slots.user", "name profilePicture");

      if (!hostedGame) {
        return res.status(404).json({ success: false, message: "Match not found" });
      }

      return res.status(200).json({ success: true, hostedGame });
    }

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    console.error("[Scoring] Status Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get detailed post-match analytics
 */
export const getMatchAnalytics = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    // Resolve matchId if it's a shortId
    let actualMatchId = matchId;
    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      const match = await HostedGame.findOne({ shortId: matchId });
      if (!match) return res.status(404).json({ success: false, message: "Match not found" });
      actualMatchId = match._id;
    }

    const scoring = await CricketScoring.findOne({ matchId: actualMatchId })
      .populate("matchId")
      .populate("umpire", "name")
      .populate("battingStats.user", "name profilePicture")
      .populate("bowlingStats.user", "name profilePicture")
      .populate("timeline.batter", "name")
      .populate("timeline.bowler", "name")
      .populate("timeline.fielder", "name");


    if (!scoring) {
      return res.status(404).json({ success: false, message: "Match data not found" });
    }

    // Calculate MVP based on simple point system
    // Runs: 1pt, Wicket: 25pts, Catch: 10pts, 6s: 2pts extra
    const playerPoints = new Map();

    scoring.battingStats.forEach(s => {
      const userId = s.user?._id?.toString();
      if (!userId) return;
      const pts = (s.runs || 0) + (s.sixes * 2) + (s.fours * 1);
      const current = playerPoints.get(userId) || { name: s.user.name, points: 0, profilePicture: s.user.profilePicture };
      current.points += pts;
      playerPoints.set(userId, current);
    });

    scoring.bowlingStats.forEach(s => {
      const userId = s.user?._id?.toString();
      if (!userId) return;
      const pts = (s.wickets || 0) * 25;
      const current = playerPoints.get(userId) || { name: s.user.name, points: 0, profilePicture: s.user.profilePicture };
      current.points += pts;
      playerPoints.set(userId, current);
    });

    // Add fielding points from timeline
    scoring.timeline.forEach(ball => {
      if (ball.isWicket && ball.fielder) {
        const userId = ball.fielder._id?.toString();
        if (!userId) return;
        const current = playerPoints.get(userId) || { name: ball.fielder.name, points: 0 };
        current.points += 10;
        playerPoints.set(userId, current);
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
        totalFours: scoring.battingStats.reduce((acc, curr) => acc + (curr.fours || 0), 0),
        totalSixes: scoring.battingStats.reduce((acc, curr) => acc + (curr.sixes || 0), 0),
        runRate: scoring.innings[0]?.totalBalls > 0 
          ? (scoring.innings[0].totalRuns / (scoring.innings[0].totalBalls / 6)).toFixed(2) 
          : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Helper: human-readable ball event description ────────────────────────────
function buildBallDesc(type, runs, strikerName, wicketType) {
  const name = strikerName || 'Batsman';
  switch (type) {
    case 'six':     return `SIX! ${name} hits a maximum!`;
    case 'four':    return `FOUR! ${name} finds the boundary!`;
    case 'wicket':  return `OUT! ${wicketType?.replace(/_/g, ' ') || 'Dismissed'} — ${name}`;
    case 'wide':    return 'Wide ball';
    case 'no_ball': return 'No Ball!';
    case 'dot':     return 'Dot ball';
    default:        return `${runs} run${runs !== 1 ? 's' : ''}`;
  }
}

/**
 * GET /api/scoring/live-score/:matchId  (public — no auth)
 * Called by LiveOverlay + LiveScoreboard on initial HTTP load before WS connects.
 * Redis-first, MongoDB fallback.
 */
export const getLiveScore = async (req, res) => {
  try {
    const { matchId } = req.params;

    // 1. Try Redis cache first (fastest path)
    const cached = await liveStateService.getLiveScore(matchId);
    if (cached) {
      return res.status(200).json({ success: true, data: cached, source: 'redis' });
    }

    // 2. Compute from MongoDB as fallback
    const scoring = await CricketScoring.findOne({ matchId })
      .populate('battingStats.user', 'name')
      .populate('bowlingStats.user', 'name')
      .lean();

    if (!scoring) {
      return res.status(404).json({ success: false, message: 'No live score found for this match' });
    }

    const match = await HostedGame.findById(matchId)
      .populate('teams.teamA.slots.user', 'name')
      .populate('teams.teamB.slots.user', 'name')
      .lean();

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    const snapshot = computeScoreSnapshot(scoring, match);
    if (!snapshot) {
      return res.status(404).json({ success: false, message: 'Match has not started yet' });
    }

    // Populate Redis for next caller
    await liveStateService.setLiveScore(matchId, snapshot);

    return res.status(200).json({ success: true, data: snapshot, source: 'mongodb' });
  } catch (error) {
    console.error('[Scoring] getLiveScore Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
