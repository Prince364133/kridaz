import { notificationQueue } from "../../queues/notification.queue.js";
import logger from "../../utils/logger.js";

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
