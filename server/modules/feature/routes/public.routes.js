import { Router } from "express";
import { getAllFeatureFlags } from "../../admin/featureFlag.controller.js";

const router = Router();

/**
 * @swagger
 * /features:
 *   get:
 *     summary: Get all active feature flags
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Map of enabled features
 */
router.get("/", getAllFeatureFlags);

export default router;
