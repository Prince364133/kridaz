import { Queue } from "bullmq";
import ioredis from "ioredis";
import logger from "../utils/logger.js";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Redis Connection for BullMQ
const connection = new ioredis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required for BullMQ
});

connection.on("error", (err) => {
  logger.error("[Notification Queue] Redis connection error:", err);
});

// Create the Queue
export const notificationQueue = new Queue("notifications", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true, // Keep it clean
    removeOnFail: false,   // Keep for debugging failed jobs
  },
});

logger.info("[Notification Queue] Initialized successfully.");
