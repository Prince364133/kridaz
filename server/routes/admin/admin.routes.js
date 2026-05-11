import { Router } from "express"

import turfRouter from "./turf.routes.js"
import dashboardRouter from "./dashboard.routes.js";
import communityRouter from "../../modules/community/community.routes.js"
import transactionRouter from "./transaction.routes.js"
import userManagementRouter from "./userManagement.routes.js"
import ownerRequestRouter from "./requestManagement.routes.js"
import ownerManagementRouter from "./ownerManagement.routes.js"
import featureFlagRouter from "./featureFlag.routes.js"
import marketingRouter from "./marketing.routes.js"
import blogRouter from "./blog.routes.js"
import professionalRouter from "./professionalManagement.routes.js"
import withdrawalRouter from "./withdrawal.routes.js"
import supportRouter from "./support.routes.js"
import auditRouter from "./audit.routes.js"
import settingsRouter from "./settings.routes.js"
import notificationRouter from "../notification.routes.js"
import adminDisputeRouter from "./dispute.routes.js"
import verifyAdminToken from "../../middleware/jwt/admin.middleware.js"

const adminRouter = Router()

adminRouter.use("/blogs", verifyAdminToken, blogRouter);
adminRouter.use("/marketing", verifyAdminToken, marketingRouter);
adminRouter.use("/features", verifyAdminToken, featureFlagRouter);
adminRouter.use("/partner-requests", verifyAdminToken, ownerRequestRouter);
adminRouter.use("/professionals", verifyAdminToken, professionalRouter);
adminRouter.use("/withdrawals", verifyAdminToken, withdrawalRouter);
adminRouter.use("/support", verifyAdminToken, supportRouter);
adminRouter.use("/audit", verifyAdminToken, auditRouter);
adminRouter.use("/settings", verifyAdminToken, settingsRouter);
adminRouter.use("/users", verifyAdminToken, userManagementRouter);
adminRouter.use("/owners", verifyAdminToken, ownerManagementRouter);
adminRouter.use("/turfs", verifyAdminToken, turfRouter);
adminRouter.use("/dashboard", verifyAdminToken, dashboardRouter);
adminRouter.use("/transactions", verifyAdminToken, transactionRouter);
adminRouter.use("/community", verifyAdminToken, communityRouter);
adminRouter.use("/dispute", verifyAdminToken, adminDisputeRouter);
adminRouter.use("/notifications", verifyAdminToken, notificationRouter);

export default adminRouter;

