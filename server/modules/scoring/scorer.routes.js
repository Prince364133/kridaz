import { Router } from "express";
import { getScorerDashboardData } from "../owner/dashboard.controller.js";
import verifyAuth, { authorizeRoles } from "../../middleware/jwt/auth.middleware.js";

const router = Router();

// Protected Scorer routes
router.use(verifyAuth);
router.get("/dashboard", authorizeRoles("scorer"), getScorerDashboardData);

export default router;
