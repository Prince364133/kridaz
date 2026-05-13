import express from "express";
import { 
  getDashboardData, 
  getCoachDashboardData, 
  getUmpireDashboardData,
  getStreamerDashboardData,
  getOwnerCalendarData,
  getDetailedOccupancyStats,
  getOwnerCustomers
} from "../../modules/owner/dashboard.controller.js"
import verifyOwnerToken from "../../middleware/jwt/owner.middleware.js";
import { authorizeRoles } from "../../middleware/jwt/auth.middleware.js";

const dashboardRouter = express.Router();

dashboardRouter.get("/", verifyOwnerToken, authorizeRoles("owner"), getDashboardData);
dashboardRouter.get("/coach", verifyOwnerToken, authorizeRoles("coach"), getCoachDashboardData);
dashboardRouter.get("/umpire", verifyOwnerToken, authorizeRoles("umpire", "limited_umpire"), getUmpireDashboardData);
dashboardRouter.get("/streamer", verifyOwnerToken, authorizeRoles("streamer"), getStreamerDashboardData);
dashboardRouter.get("/calendar", verifyOwnerToken, authorizeRoles("owner"), getOwnerCalendarData);
dashboardRouter.get("/occupancy", verifyOwnerToken, authorizeRoles("owner"), getDetailedOccupancyStats);
dashboardRouter.get("/customers", verifyOwnerToken, authorizeRoles("owner"), getOwnerCustomers);

export default dashboardRouter;