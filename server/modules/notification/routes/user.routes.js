import { Router } from "express";
import { 
  getMyNotifications, 
  markAsRead, 
  markAllAsRead, 
  clearNotifications,
  saveDeviceToken
} from "../notification.controller.js";
import verifyAuth from "../../../middleware/jwt/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notification
 *   description: Push and In-app notifications for users and owners
 */

router.use(verifyAuth);

/**
 * @swagger
 * /notification:
 *   get:
 *     summary: Get my notifications
 *     tags: [Notification]
 */
router.get("/", getMyNotifications);

/**
 * @swagger
 * /notification/mark-all-read:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notification]
 */
router.put("/mark-all-read", markAllAsRead);

/**
 * @swagger
 * /notification/{id}/mark-read:
 *   put:
 *     summary: Mark specific notification as read
 *     tags: [Notification]
 */
router.put("/:id/mark-read", markAsRead);

/**
 * @swagger
 * /notification/clear:
 *   delete:
 *     summary: Clear all notifications
 *     tags: [Notification]
 */
router.delete("/clear", clearNotifications);

/**
 * @swagger
 * /notification/device-token:
 *   post:
 *     summary: Save device token for push notifications
 *     tags: [Notification]
 */
router.post("/device-token", saveDeviceToken);

export default router;
