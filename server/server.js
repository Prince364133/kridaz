import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/database.js";
import http from "http";
import socketConfig from "./config/socket.js";
import { initSettlementWorker } from "./utils/settlementWorker.js";
import { initSettlementJobs } from "./queues/settlement.queue.js";

const port = process.env.PORT || 4000;
const server = http.createServer(app);

// Disable timeout for large video uploads
server.timeout = 0;
server.keepAliveTimeout = 0;

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
      
      // Start Reels Worker
      const { reelWorker } = await import("./queues/reel.queue.js");
      console.log("[REELS] Worker initialized and listening for jobs.");

    }).catch(err => {
      console.error("[DATABASE] Background connection error:", err.message);
    });
  });
};

// Start the server
startServer();
