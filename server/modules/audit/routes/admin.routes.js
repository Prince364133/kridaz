import { Router } from "express";
import { getAuditLogs } from "../audit.controller.js";
import verifyAdminToken from "../../../middleware/jwt/admin.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Audit
 *   description: System activity logs and administrative audit trails
 */

router.get("/logs", verifyAdminToken, getAuditLogs);

export default router;
