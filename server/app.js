import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import rootRouter from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import VenueOwnerLanding from "../client/user/src/pages/business/VenueOwnerLanding.jsx";
import { adminApproveTurf } from "./modules/turf/turf.controller.js";
import { approveOwnerRequest } from "./modules/admin/admin.controller.js";
import { addMinutes } from "date-fns";
import OTP from "./models/otp.model.js";
import { jwt } from "zod";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

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

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
