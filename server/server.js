import { setDefaultResultOrder } from "dns";
import { setServers } from "dns";
import app from "./app.js";
import connectDB from "./config/database.js";
import dotenv from "dotenv";

// Force Node.js to use Google DNS to resolve MongoDB Atlas SRV records
setDefaultResultOrder("ipv4first");
setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

const port = process.env.PORT || 4000;

// Function to start the server
const startServer = () => {
  // Start listening immediately so frontend can connect
  app.listen(port, () => {
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
