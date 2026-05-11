import { setDefaultResultOrder } from "dns";
import { setServers } from "dns";
import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/database.js";
import http from "http";
import socketConfig from "./config/socket.js";
import { initSettlementWorker } from "./utils/settlementWorker.js";
import dns from 'node:dns';

// Set DNS resolution order and servers to bypass unreliable local network DNS
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

dotenv.config();

const port = process.env.PORT || 4000;
const server = http.createServer(app);

// Initialize Socket.io
socketConfig(server);

// Function to start the server
const startServer = () => {
  server.listen(port, () => {
    console.log(`[SERVER] Running on http://localhost:${port}`);
    
    // Connect to database in the background
    connectDB().then(() => {
      console.log("[DATABASE] Connection established successfully.");
      initSettlementWorker();
    }).catch(err => {
      console.error("[DATABASE] Background connection error:", err.message);
    });
  });
};

// Start the server
startServer();
