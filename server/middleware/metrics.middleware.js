import { httpRequestDurationMicroseconds } from "../utils/metrics.js";

/**
 * Middleware to track HTTP request duration for Prometheus
 */
export const metricsMiddleware = (req, res, next) => {
  // Skip metrics for specific paths if needed
  if (req.path === "/metrics" || req.path === "/favicon.ico") {
    return next();
  }

  const start = process.hrtime();

  res.on("finish", () => {
    const duration = process.hrtime(start);
    const durationInSeconds = duration[0] + duration[1] / 1e9;

    // Determine the route pattern (to avoid high cardinality with IDs)
    // Express stores the matched route in res.req.route.path if it was a named route
    const route = req.route ? req.route.path : req.path;

    httpRequestDurationMicroseconds.observe(
      {
        method: req.method,
        route: route,
        status_code: res.statusCode,
      },
      durationInSeconds
    );
  });

  next();
};
