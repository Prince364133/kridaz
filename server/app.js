import express from "express";
import cors from "cors";

import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import rootRouter from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import helmet from "helmet";
import helmetConfig from "./config/helmet.js";
import {
  authLimiter,
  otpLimiter,
  paymentLimiter,
  globalLimiter,
} from "./middleware/rateLimiter.middleware.js";
import { prisma } from "./config/prisma.js";

dotenv.config();

const app = express();

// ── Security Headers ──────────────────────────────────────────────────────────
app.use(helmet(helmetConfig));

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(cookieParser());


const allowedOrigins = process.env.CLIENT_URLS
  ? process.env.CLIENT_URLS.split(",").map((url) => url.trim())
  : ["https://kridaz.com", "https://owner.kridaz.com", "https://kridaz.vercel.app"];

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

import { validateTurnstile } from "./middleware/turnstile.middleware.js";

// Auth routes — user
app.use('/api/user/auth/send-otp',           otpLimiter, validateTurnstile);
app.use('/api/user/auth/login-step1',         otpLimiter, validateTurnstile);
app.use('/api/user/auth/login',               authLimiter, validateTurnstile);
app.use('/api/user/auth/register',            authLimiter, validateTurnstile);
app.use('/api/user/auth/google-auth',         authLimiter); // Google Auth usually handles its own bot protection
app.use('/api/user/auth/forgot-password-otp', authLimiter, validateTurnstile);
app.use('/api/user/auth/reset-password',      authLimiter, validateTurnstile);

// Auth routes — owner
app.use('/api/owner/auth/send-otp',    otpLimiter, validateTurnstile);
app.use('/api/owner/auth/login-step1', otpLimiter, validateTurnstile);
app.use('/api/owner/auth/login',       authLimiter, validateTurnstile);
app.use('/api/owner/auth/register',    authLimiter, validateTurnstile);
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

import queryCounter from "./middleware/queryCounter.middleware.js";

// ── Performance Monitoring ────────────────────────────────────────────────────
app.use("/api", queryCounter);

// routes
app.use("/api", rootRouter);

// Health check route
app.get("/api/health", async (req, res) => {
  try {
    // Basic connectivity check via Prisma
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      status: "OK", 
      database: "Connected",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({ 
      status: "Error", 
      database: "Disconnected",
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
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
