import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

import logger from "../utils/logger.js";

export const initSentry = () => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [
        nodeProfilingIntegration(),
        Sentry.prismaIntegration(),
        Sentry.httpIntegration({ tracing: true }),
        Sentry.expressIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0, 
      
      // Set sampling rate for profiling - this is relative to tracesSampleRate
      profilesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
      
      environment: process.env.NODE_ENV || "development",
      
      // Ignore some common noisey errors
      ignoreErrors: [
        "UnauthorizedError",
        "PrismaClientKnownRequestError", // Handle specific codes in logic
      ],
    });
    logger.info("[SENTRY] Initialized successfully with advanced integrations.");
  } else {
    logger.warn("[SENTRY] DSN not found. Sentry is disabled.");
  }
};

export default Sentry;
