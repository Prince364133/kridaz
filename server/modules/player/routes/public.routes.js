import express from "express";
import { getPublicPlayers, getLeaderboard } from "../player.controller.js";
import { optionalUserAuth } from "../../../middleware/jwt/user.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Player Public
 *   description: Public player listings and leaderboard metrics
 */

/**
 * @swagger
 * /user/players:
 *   get:
 *     summary: Get list of public players
 *     tags: [Player Public]
 *     responses:
 *       200:
 *         description: Array of player profiles
 */
router.get("/players", optionalUserAuth, getPublicPlayers);

/**
 * @swagger
 * /user/leaderboard:
 *   get:
 *     summary: Get top-scoring players leaderboard
 *     tags: [Player Public]
 *     responses:
 *       200:
 *         description: Leaderboard rank list
 */
router.get("/leaderboard", getLeaderboard);

export default router;
