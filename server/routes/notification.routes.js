import { Router } from "express";
import { 
  getMyNotifications, 
  markAsRead, 
  markAllAsRead, 
  clearNotifications 
} from "../modules/notification/notification.controller.js";
import verifyAuth from "../middleware/jwt/auth.middleware.js";

const notificationRouter = Router();

notificationRouter.use(verifyAuth);

notificationRouter.get("/", getMyNotifications);
notificationRouter.put("/mark-all-read", markAllAsRead);
notificationRouter.put("/:id/mark-read", markAsRead);
notificationRouter.delete("/clear", clearNotifications);

export default notificationRouter;
