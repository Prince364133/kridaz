import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/database.js";
import http from "http";
import socketConfig from "./config/socket.js";

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
    }).catch(err => {
      console.error("[DATABASE] Background connection error:", err.message);
    });
  });
};

// Start the server
startServer();
