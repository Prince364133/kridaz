import * as Sentry from "@sentry/node";

export const initSentry = async () => {
  if (process.env.SENTRY_DSN) {
    try {
      const { nodeProfilingIntegration } = await import("@sentry/profiling-node");
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        integrations: [
          nodeProfilingIntegration(),
        ],
        // Performance Monitoring
        tracesSampleRate: 1.0, // Capture 100% of the transactions
        
        // Set sampling rate for profiling - this is relative to tracesSampleRate
        profilesSampleRate: 1.0,
        
        environment: process.env.NODE_ENV || "development",
      });
      console.log("[SENTRY] Initialized successfully.");
    } catch (error) {
      console.error("[SENTRY] Failed to initialize profiler:", error.message);
    }
  } else {
    console.warn("[SENTRY] DSN not found. Sentry is disabled.");
  }
};

export default Sentry;
