import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import rootRouter from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import {
  authLimiter,
  otpLimiter,
  paymentLimiter,
  globalLimiter,
} from "./middleware/rateLimiter.middleware.js";

dotenv.config(); // Hot-reload trigger for route alias updates

const app = express();

app.use(express.json({
  limit: "50mb",
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

import requestLogger from "./middleware/requestLogger.middleware.js";
app.use(requestLogger);

// Serve static files from the public directory
import path from "path";
app.use(express.static(path.join(process.cwd(), "public")));



const defaultOrigins = ["http://localhost:5174", "https://kridaz.vercel.app", "http://localhost", "https://localhost", "capacitor://localhost"];
const allowedOrigins = process.env.CLIENT_URLS
  ? [...process.env.CLIENT_URLS.split(",").map((url) => url.trim()), "http://localhost", "https://localhost", "capacitor://localhost"]
  : defaultOrigins;

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

import { register } from "./utils/metrics.js";

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// ── Rate Limiters ─────────────────────────────────────────────────────────────â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Global â€” all /api routes (health check excluded via skip in the middleware)
app.use('/api', globalLimiter);


// Auth routes â€” user
app.use('/api/user/auth/send-otp', otpLimiter);
app.use('/api/user/auth/login-step1', otpLimiter);
app.use('/api/user/auth/login', authLimiter);
app.use('/api/user/auth/register', authLimiter);
app.use('/api/user/auth/google-auth', authLimiter); // Google Auth usually handles its own bot protection
app.use('/api/user/auth/forgot-password-otp', authLimiter);
app.use('/api/user/auth/reset-password', authLimiter);

// Auth routes â€” owner
app.use('/api/owner/auth/send-otp', otpLimiter);
app.use('/api/owner/auth/login-step1', otpLimiter);
app.use('/api/owner/auth/login', authLimiter);
app.use('/api/owner/auth/register', authLimiter);
app.use('/api/owner/auth/google-auth', authLimiter);

// Payment routes â€” user bookings
app.use('/api/user/booking/create-order', paymentLimiter);
app.use('/api/user/booking/verify-payment', paymentLimiter);
app.use('/api/user/booking/book-with-wallet', paymentLimiter);

// Payment routes â€” user wallet top-up
app.use('/api/user/wallet/topup/create-order', paymentLimiter);
app.use('/api/user/wallet/topup/verify', paymentLimiter);

// Payment routes â€” owner banking & wallet
app.use('/api/owner/banking/payout', paymentLimiter);
app.use('/api/owner/wallet/withdraw', paymentLimiter);

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

app.get("/", (req, res) => {
  res.send("Kridaz API is running");
});

import * as Sentry from "@sentry/node";

// Error handling
app.use(notFound);

// Sentry error handler (must be after controllers but before other error middleware)
Sentry.setupExpressErrorHandler(app);

app.use(errorHandler);

export default app;
