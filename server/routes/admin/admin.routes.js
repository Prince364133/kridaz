import { Router } from "express"

import turfRouter from "./turf.routes.js"
import dashboardRouter from "./dashboard.routes.js";
import transactionRouter from "./transaction.routes.js"
import userManagementRouter from "./userManagement.routes.js"
import ownerRequestRouter from "./requestManagement.routes.js"
import ownerManagementRouter from "./ownerManagement.routes.js"
import featureFlagRouter from "./featureFlag.routes.js"
import marketingRouter from "./marketing.routes.js"
import blogRouter from "./blog.routes.js"
import verifyAdminToken from "../../middleware/jwt/admin.middleware.js"

const adminRouter = Router()

adminRouter.use("/blogs", verifyAdminToken, blogRouter);
adminRouter.use("/marketing", verifyAdminToken, marketingRouter);
adminRouter.use("/features", verifyAdminToken, featureFlagRouter);
adminRouter.use("/partner-requests", verifyAdminToken, ownerRequestRouter);
adminRouter.use("/users", verifyAdminToken, userManagementRouter);
adminRouter.use("/owners", verifyAdminToken, ownerManagementRouter);
adminRouter.use("/turfs", verifyAdminToken, turfRouter);
adminRouter.use("/dashboard", verifyAdminToken, dashboardRouter);
adminRouter.use("/transactions", verifyAdminToken, transactionRouter);

export default adminRouter;

