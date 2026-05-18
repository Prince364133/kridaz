import express from "express";
import { getAllTransactions } from "../../admin/admin.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin Transaction
 *   description: Admin view of all platform financial movements within the Wallet module
 */

/**
 * @swagger
 * /wallet/admin/transactions/all:
 *   get:
 *     summary: Get all system transactions
 *     tags: [Admin Transaction]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of transactions
 */
router.get("/all", getAllTransactions);

export default router;
