import express from "express";
import { getAdminDashboardData } from "../../modules/admin/admin.controller.js"

const dashboardRouter = express.Router();

dashboardRouter.get("/", getAdminDashboardData);

export default dashboardRouter;
