import { Router } from "express";
import { getPayoutSettings, updatePayoutSettings } from "../settings.controller.js";
import verifyAdminToken from "../../../middleware/jwt/admin.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Platform-wide configuration management
 */

router.get("/payout", verifyAdminToken, getPayoutSettings);
router.put("/payout", verifyAdminToken, updatePayoutSettings);

export default router;
