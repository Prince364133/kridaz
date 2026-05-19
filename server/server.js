process.stderr.write("[DEBUG] 1. Starting server.js\n");
import dotenv from "dotenv";
dotenv.config();

process.stderr.write("[DEBUG] 2. dotenv configured\n");
import { initSentry } from "./config/sentry.js";
initSentry();

process.stderr.write("[DEBUG] 3. Sentry initialized\n");
import app from "./app.js";
process.stderr.write("[DEBUG] 4. app.js imported\n");
import connectDB from "./config/database.js";
process.stderr.write("[DEBUG] 5. database.js imported\n");
import http from "http";
import socketConfig from "./config/socket.js";
process.stderr.write("[DEBUG] 6. socket.js imported\n");
import { initSettlementWorker } from "./utils/settlementWorker.js";
process.stderr.write("[DEBUG] 7. settlementWorker.js imported\n");
import { initSettlementJobs } from "./queues/settlement.queue.js";
process.stderr.write("[DEBUG] 8. settlement.queue.js imported\n");

const port = process.env.PORT || 4000;
const server = http.createServer(app);

// Keep-alive tuned for Render's load balancer (recommended: 75s)
server.keepAliveTimeout = 75000;
server.headersTimeout = 76000;

// Initialize Socket.io
process.stderr.write("[DEBUG] 9. Initializing socketConfig\n");
socketConfig(server);
process.stderr.write("[DEBUG] 10. socketConfig initialized\n");

// Function to start the server
const startServer = () => {
  process.stderr.write("[DEBUG] 11. Calling server.listen\n");
  server.listen(port, () => {
    process.stderr.write(`[DEBUG] 12. server.listen callback fired. Server running on http://localhost:${port}\n`);
    
    // Connect to database in the background
    connectDB().then(async () => {
      process.stderr.write("[DEBUG] 13. connectDB resolved\n");
      
      // Initialize Workers & Queues
      initSettlementWorker();           // startup runs + backfill (immediate)
      await initSettlementJobs();       // recurring jobs via BullMQ (singleton)
      
      // Conditionally start CPU-heavy media workers
      if (process.env.ENABLE_WORKERS !== "false") {
        process.stderr.write("[DEBUG] 14. Loading media.queue.js\n");
        const { mediaWorker } = await import("./queues/media.queue.js");
        process.stderr.write("[DEBUG] 15. Unified sandboxed worker initialized\n");
      }

    }).catch(err => {
      process.stderr.write(`[DEBUG] Database connection error: ${err.message}\n`);
    });
  });
};

// Start the server
process.stderr.write("[DEBUG] 16. Calling startServer\n");
startServer();
