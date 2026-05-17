import { initSentry } from "./config/sentry.js";
initSentry();

import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/database.js";
import http from "http";
import socketConfig from "./config/socket.js";
import { initSettlementWorker } from "./utils/settlementWorker.js";
import { initSettlementJobs } from "./queues/settlement.queue.js";
import { initCronJobs } from "./utils/cronJobs.js";

import logger from "./utils/logger.js";
import { trackQueue } from "./utils/metrics.js";

const port = process.env.PORT || 4000;
const server = http.createServer(app);

// Keep-alive tuned for Render's load balancer (recommended: 75s)
server.keepAliveTimeout = 75000;
server.headersTimeout = 76000;

// Initialize Socket.io
socketConfig(server);

// Function to start the server
const startServer = () => {
  server.listen(port, () => {
    logger.info(`[SERVER] Running on http://localhost:${port}`);
    
    // Connect to database in the background
    connectDB().then(async () => {
      logger.info("[DATABASE] Connection established successfully.");
      
      // Initialize Workers & Queues
      import("./utils/bloomFilter.js").then(({ seedUsernameBloom }) => seedUsernameBloom());
      
      initSettlementWorker();           // startup runs + backfill (immediate)
      const { settlementQueue } = await initSettlementJobs();       // recurring jobs via BullMQ (singleton)
      trackQueue("settlement", settlementQueue);
      
      // Initialize Notification Worker
      import("./queues/notification.worker.js").then(() => {
        logger.info("[NOTIFICATION] BullMQ worker initialized.");
      });
      
      const { notificationQueue } = await import("./queues/notification.queue.js");
      trackQueue("notifications", notificationQueue);

      // Conditionally start CPU-heavy media workers
      // In production, you can set ENABLE_WORKERS=false on the API service 
      // and run a separate 'worker' service with ENABLE_WORKERS=true
      if (process.env.ENABLE_WORKERS !== "false") {
        logger.info("[WORKER] Starting media processing workers...");
        
        // Start Unified Media Worker (Reels, Stories, Community)
        const { mediaWorker, mediaQueue } = await import("./queues/media.queue.js");
        trackQueue("media", mediaQueue);
        logger.info("[MEDIA] Unified sandboxed worker initialized.");
      } else {
        logger.info("[SERVER] Media workers disabled (API-only mode).");
      }

      // Initialize Recurring Maintenance Tasks
      initCronJobs();

    }).catch(err => {
      logger.error("[DATABASE] Background connection error:", err);
    });
  });
};

// Start the server
startServer();
