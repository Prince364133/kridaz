import * as scoringService from "./scoring.service.js";
import logger from "../../utils/logger.js";

/**
 * Standard utility to catch thrown errors from the service layer
 * and map them directly to the appropriate HTTP status codes.
 */
const handleControllerError = (res, error, fallbackMsg = "Internal Server Error") => {
  const status = error.statusCode || 500;
  res.status(status).json({ success: false, message: error.message || fallbackMsg });
};

export const setupScoringGame = async (req, res) => {
  try {
    const userId = req.user.id;
    const matchData = req.body;
    
    const game = await scoringService.createScoringMatch(userId, matchData);
    
    res.status(201).json({ success: true, game });
  } catch (error) {
    logger.error("[Scoring] Setup Scoring Game Error:", error);
    handleControllerError(res, error);
  }
};

export const getMyScoringGames = async (req, res) => {
  try {
    const userId = req.user.id;
    const games = await scoringService.getUserScoringGames(userId);
    
    res.status(200).json({ success: true, games });
  } catch (error) {
    logger.error("[Scoring] Get My Games Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Initialize a Live Stream overlay session
 */
export const goLive = async (req, res) => {
  try {
    const { matchId } = req.params;
    const result = await scoringService.goLiveSession(matchId);
    
    res.status(200).json({ 
      success: true, 
      ...result
    });
  } catch (error) {
    logger.error("[Scoring] Go Live Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * End Live Broadcast
 */
export const endLive = async (req, res) => {
  try {
    const { matchId } = req.params;
    await scoringService.endLiveSession(matchId);
    
    res.status(200).json({ success: true, message: "Live stream ended." });
  } catch (error) {
    logger.error("[Scoring] End Live Controller Error:", error);
    handleControllerError(res, error);
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
    
    const { streamStatus } = await scoringService.configureStream(matchId, { 
      youtubeVideoId, 
      youtubeLiveChatId 
    });

    res.status(200).json({ 
      success: true, 
      message: "Stream configuration updated", 
      streamStatus 
    });
  } catch (error) {
    logger.error("[Scoring] Update Stream Config Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Finalize Cricket Match and run user/umpire stats aggregation.
 */
export const completeMatch = async (req, res) => {
  try {
    const { scoringId } = req.body;
    const { earnedBadges } = await scoringService.finalizeMatch(scoringId);

    res.status(200).json({ 
      success: true, 
      message: "Match completed and stats aggregated",
      earnedBadges
    });
  } catch (error) {
    logger.error("[Scoring] Complete Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Search and lookup match details by short ID.
 */
export const searchMatch = async (req, res) => {
  try {
    const { shortId } = req.params;
    const match = await scoringService.lookupMatchByShortId(shortId);
    
    res.status(200).json({ success: true, match });
  } catch (error) {
    logger.error("[Scoring] Search Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Start or retrieve a live scoring session.
 */
export const startScoring = async (req, res) => {
  try {
    const { matchId, gameId, battingTeamId, battingTeam } = req.body;
    const finalMatchId = matchId || gameId;
    const finalBattingTeam = battingTeamId || battingTeam || "teamA";
    
    const umpireId = req.user?.id;
    if (!umpireId) {
      return res.status(401).json({ 
        success: false, 
        message: "Umpire identity not found. Please log in again." 
      });
    }

    const scoring = await scoringService.initializeScoringSession(
      finalMatchId, 
      finalBattingTeam, 
      umpireId, 
      req.user?.role
    );

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    logger.error("[Scoring] Start Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Transition the scoring session to the next innings.
 */
export const startNextInnings = async (req, res) => {
  try {
    const { scoringId, battingTeamId } = req.body;
    const scoring = await scoringService.advanceToNextInnings(scoringId, battingTeamId);

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    logger.error("[Scoring] StartNextInnings Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Set toss result details.
 */
export const setToss = async (req, res) => {
  try {
    const { scoringId, winnerTeam, wonByTeamId, decision } = req.body;
    const finalWinnerTeam = winnerTeam || wonByTeamId;

    const scoring = await scoringService.updateTossResult(scoringId, finalWinnerTeam, decision);

    res.status(200).json({ 
      success: true, 
      scoring, 
      toss: { 
        winnerTeam: scoring.tossWinner, 
        decision: scoring.tossDecision 
      } 
    });
  } catch (error) {
    logger.error("[Scoring] SetToss Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Set active striker, non-striker and bowler.
 */
export const setPlayers = async (req, res) => {
  try {
    const { scoringId, strikerId, nonStrikerId, bowlerId } = req.body;
    const scoring = await scoringService.updateActivePlayers(scoringId, { 
      strikerId, 
      nonStrikerId, 
      bowlerId 
    });

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    logger.error("[Scoring] SetPlayers Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Undo last ball in the database timeline.
 */
export const undoLastBall = async (req, res) => {
  try {
    const { scoringId } = req.body;
    const scoring = await scoringService.revertLastBall(scoringId);

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    logger.error("[Scoring] Undo Last Ball Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Record a ball and increment score runs, wickets, bounds.
 */
export const updateScore = async (req, res) => {
  try {
    const { scoringId, ballData } = req.body;
    const { scoring, liveData } = await scoringService.processScoreUpdate(scoringId, ballData);

    res.status(200).json({ success: true, scoring, liveData });
  } catch (error) {
    logger.error("[Scoring] UpdateScore Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Retrieve scoreboard snapshot details.
 */
export const getMatchStatus = async (req, res) => {
  try {
    const { matchId } = req.params;
    const result = await scoringService.fetchMatchStatus(matchId);

    if (result.type === "SCORING_EXISTS") {
      return res.status(200).json({ 
        success: true, 
        scoring: result.scoring, 
        scoringSnapshot: result.scoringSnapshot 
      });
    }

    return res.status(200).json({ success: true, hostedGame: result.hostedGame });
  } catch (error) {
    logger.error("[Scoring] Status Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Get detailed post-match analytics and highlight the MVP.
 */
export const getMatchAnalytics = async (req, res) => {
  try {
    const { matchId } = req.params;
    const result = await scoringService.fetchMatchAnalytics(matchId);

    res.status(200).json({ 
      success: true, 
      scoring: result.scoring, 
      analytics: result.analytics
    });
  } catch (error) {
    logger.error("[Scoring] Analytics Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Fast endpoint to get live score dashboard snapshots.
 */
export const getLiveScore = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { data, source } = await scoringService.fetchLiveScoreSnapshot(matchId);

    return res.status(200).json({ success: true, data, source });
  } catch (error) {
    logger.error("[Scoring] Live Score Controller Error:", error);
    handleControllerError(res, error);
  }
};
