import { Router } from "express";
import {
  getMyNotifications,
  getUnreadCount,
  deleteNotification,
  markAsRead,
  markAllAsRead,
  clearNotifications,
  saveDeviceToken,
  unregisterDeviceToken,
  subscribeToTopic,
  unsubscribeFromTopic,
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

// Specific paths MUST be registered before parametric /:id so they aren't
// shadowed — e.g. DELETE /clear could otherwise be matched by DELETE /:id
// with id="clear" (idempotent deleteMany, returns success but no-op).

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
 * /notification/unread-count:
 *   get:
 *     summary: Number of unread notifications for the current actor
 *     tags: [Notification]
 */
router.get("/unread-count", getUnreadCount);

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

/**
 * @swagger
 * /notification/device-token/unregister:
 *   post:
 *     summary: Remove a device token (logout / app uninstall)
 *     tags: [Notification]
 */
router.post("/device-token/unregister", unregisterDeviceToken);

/**
 * @swagger
 * /notification/topics/subscribe:
 *   post:
 *     summary: Subscribe tokens to an FCM topic (e.g. match-<id>)
 *     tags: [Notification]
 */
router.post("/topics/subscribe", subscribeToTopic);

/**
 * @swagger
 * /notification/topics/unsubscribe:
 *   post:
 *     summary: Unsubscribe tokens from an FCM topic
 *     tags: [Notification]
 */
router.post("/topics/unsubscribe", unsubscribeFromTopic);

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
 * /notification/{id}:
 *   delete:
 *     summary: Delete a single notification (recipient-scoped, idempotent)
 *     tags: [Notification]
 */
router.delete("/:id", deleteNotification);

export default router;
