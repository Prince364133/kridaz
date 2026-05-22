import * as scoringService from "./scoring.service.js";
import logger from "../../utils/logger.js";
import { prisma } from "../../config/prisma.js";

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
 * Get a single scoring game by its ID (full details for match dashboard/card)
 */
export const getScoringGameById = async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await scoringService.getScoringGameById(gameId);
    if (!game) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }
    res.status(200).json({ success: true, game });
  } catch (error) {
    logger.error("[Scoring] Get Game By ID Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Authenticate scoring app access with password.
 * Returns a short-lived JWT scoped to the specific game for SCORER role.
 * Password is never returned in any response.
 */
export const authenticateScoringApp = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    const result = await scoringService.verifyScoringPassword(gameId, password);
    res.status(200).json({ success: true, token: result.token, gameId });
  } catch (error) {
    logger.error("[Scoring] Auth Error:", error);
    if (error.message === "INVALID_PASSWORD" || error.message === "GAME_NOT_FOUND") {
      return res.status(401).json({ success: false, message: "Invalid password or game not found" });
    }
    handleControllerError(res, error);
  }
};
/**
 * Dispatches notifications to players in the match
 */
export const notifyPlayers = async (req, res) => {
  try {
    const { matchId } = req.body;
    if (!matchId) return res.status(400).json({ success: false, message: "matchId is required" });
    
    // Simulate async notification dispatch
    logger.info(`[Scoring] Dispatched notifications to players for match ${matchId}`);
    
    res.status(200).json({ success: true, message: "Notifications dispatched successfully" });
  } catch (error) {
    logger.error("[Scoring] Notify Players Error:", error);
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
 * Updates the match status (e.g. LIVE, RAIN_DELAY, BAD_LIGHT).
 */
export const updateMatchStatus = async (req, res) => {
  try {
    const { scoringId, status } = req.body;
    const scoring = await scoringService.updateMatchStatus(scoringId, status);

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    logger.error("[Scoring] UpdateMatchStatus Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Revise match target and overs (DLS / Rain Rule).
 */
export const reviseTargetAndOvers = async (req, res) => {
  try {
    const { scoringId, revisedTarget, revisedOvers } = req.body;
    const scoring = await scoringService.reviseTargetAndOvers(scoringId, revisedTarget, revisedOvers);

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    logger.error("[Scoring] ReviseTarget Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Set Match Officials.
 */
export const setMatchOfficials = async (req, res) => {
  try {
    const { scoringId, officials } = req.body;
    const scoring = await scoringService.setMatchOfficials(scoringId, officials);

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    logger.error("[Scoring] SetMatchOfficials Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Substitute an on-field player.
 */
export const substitutePlayer = async (req, res) => {
  try {
    const { scoringId, userId, substituteForId, inningsIndex } = req.body;
    const stat = await scoringService.substitutePlayer(scoringId, userId, substituteForId, inningsIndex);

    res.status(200).json({ success: true, stat });
  } catch (error) {
    logger.error("[Scoring] SubstitutePlayer Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Use a team review (DRS).
 */
export const useReview = async (req, res) => {
  try {
    const { scoringId, inningsIndex, team, isSuccessful } = req.body;
    const scoring = await scoringService.useReview(scoringId, inningsIndex, team, isSuccessful);

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    logger.error("[Scoring] UseReview Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Set Powerplay overs for the current innings.
 */
export const setPowerplayOvers = async (req, res) => {
  try {
    const { scoringId, inningsIndex, overs } = req.body;
    const scoring = await scoringService.setPowerplayOvers(scoringId, inningsIndex, overs);

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    logger.error("[Scoring] SetPowerplayOvers Controller Error:", error);
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
        scoringSnapshot: result.scoringSnapshot,
        hostedGame: result.hostedGame
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

/**
 * Delete match permanently
 */
export const deleteMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;
    // For now just pass it to service, or perform basic verification
    await scoringService.deleteScoringMatch(matchId, userId);
    res.status(200).json({ success: true, message: "Match deleted successfully" });
  } catch (error) {
    logger.error("[Scoring] Delete Match Error:", error);
    handleControllerError(res, error);
  }
};

export const updateCommentarySettings = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { isAiCommentaryEnabled, commentaryVoice, commentaryLanguage, commentaryStyle } = req.body;
    const updatedGame = await prisma.hostedGame.update({
      where: { id: matchId },
      data: { isAiCommentaryEnabled, commentaryVoice, commentaryLanguage, commentaryStyle }
    });
    res.status(200).json({ success: true, data: updatedGame });
  } catch (error) {
    logger.error("[Scoring] Update Commentary Settings Error:", error);
    handleControllerError(res, error);
  }
};
