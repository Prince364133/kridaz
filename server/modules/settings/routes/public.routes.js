import { Router } from "express";
import { getPublicSettings } from "../settings.controller.js";

const router = Router();

/**
 * @swagger
 * /api/settings/payout:
 *   get:
 *     summary: Get public payout configuration settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/payout", getPublicSettings);

export default router;
