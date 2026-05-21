import { Router } from "express";
import {
  searchMatch,
  startScoring,
  updateScore,
  getMatchStatus,
  completeMatch,
  getMatchAnalytics,
  goLive,
  endLive,
  updateStreamConfig,
  startNextInnings,
  // Phase 1 additions
  setToss,
  setPlayers,
  undoLastBall,
  // Phase 3: Live overlay
  getLiveScore,
  setupScoringGame,
  getMyScoringGames,
} from "./scoring.controller.js";
import verifyAuth from "../../middleware/jwt/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { startScoringSchema, updateScoreSchema, tossSchema, setupScoringGameSchema } from "./scoring.validator.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Scoring
 *   description: Real-time Match Scoring and Live Broadcasting
 */

// Public routes (anyone can see live score)

/**
 * @swagger
 * /scoring/status/{matchId}:
 *   get:
 *     summary: Get live match status
 *     description: Returns the current score, batsman, and bowler details for a live match.
 *     tags: [Scoring]
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Match status data
 */
router.get("/status/:matchId", getMatchStatus);

/**
 * @swagger
 * /scoring/search/{shortId}:
 *   get:
 *     summary: Find match by short ID
 *     description: Quick lookup for matches using their unique short identifier.
 *     tags: [Scoring]
 *     parameters:
 *       - in: path
 *         name: shortId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Match details
 */
router.get("/search/:shortId", searchMatch);

/**
 * @swagger
 * /scoring/analytics/{matchId}:
 *   get:
 *     summary: Get match analytics
 *     description: Returns detailed stats like run rate, worm chart, and wagon wheel data.
 *     tags: [Scoring]
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Analytics data
 */
router.get("/analytics/:matchId", getMatchAnalytics);

/**
 * @swagger
 * /scoring/live-score/{matchId}:
 *   get:
 *     summary: Get live score snapshot
 *     description: Snapshot used for external scoreboards and streaming overlays.
 *     tags: [Scoring]
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Live score snapshot
 */
router.get("/live-score/:matchId", getLiveScore);

// Protected routes (Only authorized umpires can score)
router.use(verifyAuth);

/**
 * @swagger
 * /scoring/setup:
 *   post:
 *     summary: Setup a new Scoring Match
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Match created
 */
router.post("/setup", validate(setupScoringGameSchema), setupScoringGame);

/**
 * @swagger
 * /scoring/my-games:
 *   get:
 *     summary: Get scoring matches for the current user
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Matches retrieved
 */
router.get("/my-games", getMyScoringGames);

/**
 * @swagger
 * /scoring/start:
 *   post:
 *     summary: Start scoring for a match
 *     description: Initializes the scoring session for an authorized match.
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/StartScoringRequest' }
 *     responses:
 *       200:
 *         description: Scoring started
 */
router.post("/start", validate(startScoringSchema), startScoring);

/**
 * @swagger
 * /scoring/update:
 *   put:
 *     summary: Update score (ball by ball)
 *     description: Records a new ball, runs, extras, and wickets.
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateScoreRequest' }
 *     responses:
 *       200:
 *         description: Score updated
 */
router.put("/update", validate(updateScoreSchema), updateScore);

/**
 * @swagger
 * /scoring/complete:
 *   post:
 *     summary: Finalize match
 *     description: Marks the match as completed and generates final results.
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Match completed
 */
router.post("/complete", completeMatch);

/**
 * @swagger
 * /scoring/{matchId}/go-live:
 *   post:
 *     summary: Enable live broadcast
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Broadcast live
 */
router.post("/:matchId/go-live", goLive);

/**
 * @swagger
 * /scoring/{matchId}/end-live:
 *   post:
 *     summary: Stop live broadcast
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Broadcast stopped
 */
router.post("/:matchId/end-live", endLive);

/**
 * @swagger
 * /scoring/{matchId}/stream-config:
 *   post:
 *     summary: Update stream overlay config
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Config updated
 */
router.post("/:matchId/stream-config", updateStreamConfig);

/**
 * @swagger
 * /scoring/next-innings:
 *   post:
 *     summary: Transition to next innings
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Innings started
 */
router.post("/next-innings", startNextInnings);

/**
 * @swagger
 * /scoring/toss:
 *   post:
 *     summary: Set match toss result
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [winnerId, decision]
 *             properties:
 *               winnerId: { type: string }
 *               decision: { type: string, enum: [BAT, BOWL] }
 *     responses:
 *       200:
 *         description: Toss result recorded
 */
router.post("/toss", validate(tossSchema), setToss);

/**
 * @swagger
 * /scoring/set-players:
 *   post:
 *     summary: Set active players for scoring
 *     description: Assigns the striker, non-striker, and bowler for the current over.
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Players assigned
 */
router.post("/set-players", setPlayers);

/**
 * @swagger
 * /scoring/undo:
 *   delete:
 *     summary: Undo last action
 *     description: Reverts the last ball or action recorded.
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Action reverted
 */
router.delete("/undo", undoLastBall);

export default router;
