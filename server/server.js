import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./config/database.js";
import dotenv from "dotenv";
import rootRouter from "./routes/index.js";

dotenv.config();

const app = express();

app.use(express.json());

const allowedOrigins = process.env.CLIENT_URLS
  ? process.env.CLIENT_URLS.split(",").map((url) => url.trim())
  : ["http://localhost:5173", "http://localhost:5174"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. Postman, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);

// routes
app.use("/api", rootRouter);

// Health check route
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected/Connecting";
  res.status(200).json({ 
    status: "OK", 
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Deep Debug route
app.get("/api/debug", async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = ["disconnected", "connected", "connecting", "disconnecting"];
    
    let collections = [];
    let turfCount = 0;
    
    if (dbState === 1) {
      collections = await mongoose.connection.db.listCollections().toArray();
      const collectionsNames = collections.map(c => c.name);
      if (collectionsNames.includes("turves")) {
        turfCount = await mongoose.connection.db.collection("turves").countDocuments();
      }
    }

    res.json({
      serverStatus: "RUNNING",
      databaseStatus: states[dbState] || "unknown",
      readyState: dbState,
      collections: collections.map(c => c.name),
      turfCount,
      env: {
        PORT: process.env.PORT,
        MONGO_URI_SET: !!process.env.MONGO_URI,
        CLIENT_URLS: process.env.CLIENT_URLS
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("TurfSpot API is running");
});

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
