import express from "express";
import { 
  getDashboardData, 
  getCoachDashboardData, 
  getUmpireDashboardData,
  getOwnerCalendarData
} from "../../modules/owner/dashboard.controller.js"
import verifyOwnerToken from "../../middleware/jwt/owner.middleware.js";

const dashboardRouter = express.Router();

dashboardRouter.get("/", verifyOwnerToken, getDashboardData);
dashboardRouter.get("/coach", verifyOwnerToken, getCoachDashboardData);
dashboardRouter.get("/umpire", verifyOwnerToken, getUmpireDashboardData);
dashboardRouter.get("/calendar", verifyOwnerToken, getOwnerCalendarData);

export default dashboardRouter;