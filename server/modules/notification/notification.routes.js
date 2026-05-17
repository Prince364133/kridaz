import { Router } from "express";
import userNotificationRouter from "./routes/user.routes.js";
import adminNotificationRouter from "./routes/admin.routes.js";

/**
 * Notification Domain Router
 * Mounts actor-specific sub-routers for Notifications.
 * 
 * Routes:
 * /api/notification/...
 */

const notificationRouter = Router();

// Mount Actor Sub-Routers
notificationRouter.use("/user", userNotificationRouter);
notificationRouter.use("/admin", adminNotificationRouter);

// Fallback / Root - Map to user routes
notificationRouter.use("/", userNotificationRouter);

export default notificationRouter;
