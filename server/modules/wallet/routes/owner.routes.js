import { Router } from "express";
import {
  getWalletData,
  requestWithdrawal,
  getOwnerWithdrawals
} from "../wallet.controller.js";
import verifyToken from "../../../middleware/jwt/user.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { requestWithdrawalSchema } from "../wallet.validator.js";
import { paymentLimiter } from "../../../middleware/rateLimiter.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Owner Wallet
 *   description: Wallet and withdrawal management for turf owners
 */

/**
 * @swagger
 * /wallet/owner/data:
 *   get:
 *     summary: Get wallet data
 *     tags: [Owner Wallet]
 *     security:
 *       - BearerAuth: []
 */
router.get("/data", verifyToken, getWalletData);

/**
 * @swagger
 * /wallet/owner/withdraw:
 *   post:
 *     summary: Request withdrawal
 *     tags: [Owner Wallet]
 *     security:
 *       - BearerAuth: []
 */
router.post("/withdraw", paymentLimiter, verifyToken, validate(requestWithdrawalSchema), requestWithdrawal);

/**
 * @swagger
 * /wallet/owner/withdrawals:
 *   get:
 *     summary: Get withdrawal history
 *     tags: [Owner Wallet]
 *     security:
 *       - BearerAuth: []
 */
router.get("/withdrawals", verifyToken, getOwnerWithdrawals);

export default router;
