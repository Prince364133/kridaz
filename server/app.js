import express from "express";
import cors from "cors";

import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import rootRouter from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import helmet from "helmet";
import helmetConfig from "./config/helmet.js";
import {
  globalLimiter,
} from "./middleware/rateLimiter.middleware.js";
import { prisma } from "./config/prisma.js";
import requestLogger from "./middleware/requestLogger.middleware.js";
import { register } from "./utils/metrics.js";
import { metricsMiddleware } from "./middleware/metrics.middleware.js";

dotenv.config();

const app = express();

// ── Security Headers ──────────────────────────────────────────────────────────
app.use(helmet(helmetConfig));
app.use(metricsMiddleware);
app.use(requestLogger);

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

import queryCounter from "./middleware/queryCounter.middleware.js";

// ── Performance Monitoring ────────────────────────────────────────────────────
app.use("/api", queryCounter);

// Swagger JSON endpoint (for Docusaurus and other tools)
app.get("/api/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Swagger Documentation
app.use("/api/docs", (req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    const token = req.query.token;
    if (token !== process.env.DOCS_TOKEN) {
      return res.status(403).send("Forbidden: Invalid docs token");
    }
  }
  next();
}, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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

// Prometheus metrics endpoint
app.get("/metrics", async (req, res) => {
  // Optional: Token-based security for metrics
  const token = req.query.token || req.headers["x-metrics-token"];
  if (process.env.METRICS_TOKEN && token !== process.env.METRICS_TOKEN) {
    return res.status(403).send("Forbidden: Invalid metrics token");
  }

  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

import * as Sentry from "@sentry/node";

// Error handling
app.use(notFound);

// Sentry error handler (must be after controllers but before other error middleware)
Sentry.setupExpressErrorHandler(app);

app.use(errorHandler);

export default app;
