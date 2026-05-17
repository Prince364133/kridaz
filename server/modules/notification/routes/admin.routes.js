import { Router } from "express";
import { 
  getFailedJobs, 
  retryJob, 
  removeFailedJob 
} from "../admin.notification.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin Notification
 *   description: Monitoring and management of push notification delivery jobs
 */

/**
 * @swagger
 * /notification/admin/failed:
 *   get:
 *     summary: List failed notification jobs
 *     tags: [Admin Notification]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of failed attempts
 */
router.get("/failed", getFailedJobs);

/**
 * @swagger
 * /notification/admin/failed/{jobId}/retry:
 *   post:
 *     summary: Retry a failed notification job
 *     tags: [Admin Notification]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Job re-queued
 */
router.post("/failed/:jobId/retry", retryJob);

/**
 * @swagger
 * /notification/admin/failed/{jobId}:
 *   delete:
 *     summary: Remove a failed notification job from record
 *     tags: [Admin Notification]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Job entry deleted
 */
router.delete("/failed/:jobId", removeFailedJob);

export default router;
