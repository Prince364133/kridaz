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

dotenv.config();

const app = express();

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
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

// ── Rate Limiters ─────────────────────────────────────────────────────────────
// Global — all /api routes (health check excluded via skip in the middleware)
app.use('/api', globalLimiter);

// Auth routes — user
app.use('/api/user/auth/send-otp',           otpLimiter);
app.use('/api/user/auth/login-step1',         otpLimiter);  // OTP verification entry
app.use('/api/user/auth/login',               authLimiter);
app.use('/api/user/auth/register',            authLimiter);
app.use('/api/user/auth/google-auth',         authLimiter);
app.use('/api/user/auth/forgot-password-otp', authLimiter);
app.use('/api/user/auth/reset-password',      authLimiter);

// Auth routes — owner
app.use('/api/owner/auth/send-otp',    otpLimiter);
app.use('/api/owner/auth/login-step1', otpLimiter);  // OTP verification entry
app.use('/api/owner/auth/login',       authLimiter);
app.use('/api/owner/auth/register',    authLimiter);
app.use('/api/owner/auth/google-auth', authLimiter);

// Payment routes — user bookings
app.use('/api/user/booking/create-order',       paymentLimiter);
app.use('/api/user/booking/verify-payment',     paymentLimiter);
app.use('/api/user/booking/book-with-wallet',   paymentLimiter);

// Payment routes — user wallet top-up
app.use('/api/user/wallet/topup/create-order',  paymentLimiter);
app.use('/api/user/wallet/topup/verify',        paymentLimiter);

// Payment routes — owner banking & wallet
app.use('/api/owner/banking/payout',    paymentLimiter);
app.use('/api/owner/wallet/withdraw',   paymentLimiter);

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

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
