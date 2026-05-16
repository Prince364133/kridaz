import dotenv from "dotenv";
dotenv.config();

import { initSentry } from "./config/sentry.js";
initSentry();

import app from "./app.js";
import connectDB from "./config/database.js";
import http from "http";
import socketConfig from "./config/socket.js";
import { initSettlementWorker } from "./utils/settlementWorker.js";
import { initSettlementJobs } from "./queues/settlement.queue.js";

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
    console.log(`[SERVER] Running on http://localhost:${port}`);
    
    // Connect to database in the background
    connectDB().then(async () => {
      console.log("[DATABASE] Connection established successfully.");
      
      // Initialize Workers & Queues
      initSettlementWorker();           // startup runs + backfill (immediate)
      await initSettlementJobs();       // recurring jobs via BullMQ (singleton)
      
      // Conditionally start CPU-heavy media workers
      // In production, you can set ENABLE_WORKERS=false on the API service 
      // and run a separate 'worker' service with ENABLE_WORKERS=true
      if (process.env.ENABLE_WORKERS !== "false") {
        console.log("[WORKER] Starting media processing workers...");
        
        // Start Unified Media Worker (Reels, Stories, Community)
        const { mediaWorker } = await import("./queues/media.queue.js");
        console.log("[MEDIA] Unified sandboxed worker initialized.");
      } else {
        console.log("[SERVER] Media workers disabled (API-only mode).");
      }

    }).catch(err => {
      console.error("[DATABASE] Background connection error:", err.message);
    });
  });
};

// Start the server
startServer();
