import { notificationQueue } from "../../queues/notification.queue.js";
import logger from "../../utils/logger.js";
import { prisma } from "../../config/prisma.js";
import NotificationService from "../../services/notification.service.js";

/**
 * GET /api/admin/notifications/failed
 * Fetches all failed notification jobs for manual review.
 */
export const getFailedJobs = async (req, res) => {
  try {
    const failedJobs = await notificationQueue.getFailed();
    
    // Format jobs for a clean UI response
    const formattedJobs = failedJobs.map(job => ({
      id: job.id,
      name: job.name,
      data: job.data,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      timestamp: job.timestamp,
      attemptsMade: job.attemptsMade,
    }));

    res.status(200).json({ 
      success: true, 
      count: formattedJobs.length,
      jobs: formattedJobs 
    });
  } catch (error) {
    logger.error("[Admin Notification] Error fetching failed jobs:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/notifications/failed/:jobId/retry
 * Manually trigger a retry for a specific failed job.
 */
export const retryJob = async (req, res) => {
  const { jobId } = req.params;
  try {
    const job = await notificationQueue.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    await job.retry();
    
    res.status(200).json({ 
      success: true, 
      message: `Job ${jobId} has been queued for retry.` 
    });
  } catch (error) {
    logger.error(`[Admin Notification] Error retrying job ${jobId}:`, error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/admin/notifications/failed/:jobId
 * Remove a failed job from the queue manually.
 */
export const removeFailedJob = async (req, res) => {
  const { jobId } = req.params;
  try {
    const job = await notificationQueue.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    await job.remove();
    
    res.status(200).json({ 
      success: true, 
      message: `Job ${jobId} has been removed from the queue.` 
    });
  } catch (error) {
    logger.error(`[Admin Notification] Error removing job ${jobId}:`, error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/notifications/send
 * Allows admin to send custom push + in-app notification to a user or all users.
 */
export const sendAdminPushNotification = async (req, res) => {
  const admin = req.admin.role;
  if (admin?.toUpperCase() !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized access denied" });
  }

  const { recipientId, title, message, type, link, metadata } = req.body;

  if (!title || !message) {
    return res.status(400).json({ success: false, message: "Title and message are required" });
  }

  try {
    if (recipientId === "ALL") {
      // Find all general users who have registered an FCM device token
      const activeUsers = await prisma.user.findMany({
        where: {
          NOT: {
            fcmToken: {
              equals: null
            }
          }
        },
        select: { id: true }
      });

      if (activeUsers.length === 0) {
        return res.status(200).json({ success: true, message: "No active users with registered mobile devices found." });
      }

      // Enqueue notification tasks in BullMQ
      const promises = activeUsers.map(user => 
        NotificationService.sendInApp({
          recipientId: user.id,
          recipientModel: "User",
          title,
          message,
          type: type || "SYSTEM",
          link: link || "",
          metadata: metadata || {}
        })
      );
      await Promise.all(promises);

      return res.status(200).json({
        success: true,
        message: `Successfully queued push notifications for all ${activeUsers.length} registered device(s).`
      });
    } else {
      // Send to a single user
      if (!recipientId) {
        return res.status(400).json({ success: false, message: "Recipient User ID is required" });
      }

      const user = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { id: true, fcmToken: true }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      await NotificationService.sendInApp({
        recipientId: user.id,
        recipientModel: "User",
        title,
        message,
        type: type || "SYSTEM",
        link: link || "",
        metadata: metadata || {}
      });

      return res.status(200).json({
        success: true,
        message: `Successfully queued push notification for user. Status will be delivered if device token exists (${user.fcmToken ? 'Device is registered' : 'No registered device token found'}).`
      });
    }
  } catch (error) {
    logger.error("[Admin Notification] Error sending custom admin push notification:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

