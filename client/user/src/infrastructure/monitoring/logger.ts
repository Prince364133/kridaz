/**
 * Centralized logging adapter for frontend observability.
 * Can be swapped with Sentry, Datadog, or other external services
 * without touching feature code.
 */
export const logger = {
  info: (message: string, ...args: any[]) => {
    if (import.meta.env.MODE !== 'production') {
      console.log(`[INFO] ${message}`, ...args);
    }
    // Remote logging (Sentry/Datadog) can go here
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  error: (message: string, error?: unknown, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, error || '', ...args);
    // Error tracking (Sentry) can go here
  },
  debug: (message: string, ...args: any[]) => {
     if (import.meta.env.MODE === 'development') {
        console.debug(`[DEBUG] ${message}`, ...args);
     }
  }
};
