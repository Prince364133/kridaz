import { Router } from "express";
import { getActiveMarketing } from "../marketing.controller.js";

const router = Router();

/**
 * @swagger
 * /features/marketing:
 *   get:
 *     summary: Get active marketing banners and videos
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Active promotional content
 */
router.get("/", getActiveMarketing);

export default router;
