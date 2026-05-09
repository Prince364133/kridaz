import { Router } from "express";
import { getAuditLogs } from "../../modules/admin/audit.controller.js";
import verifyAdminToken from "../../middleware/jwt/admin.middleware.js";

const auditRouter = Router();

auditRouter.get("/logs", verifyAdminToken, getAuditLogs);

export default auditRouter;
