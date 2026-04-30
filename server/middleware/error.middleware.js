import chalk from "chalk";

/**
 * Global Error Handler Middleware
 * Catch all errors and send standardized JSON response
 */
export const errorHandler = (err, req, res, next) => {
  console.error(chalk.red("[ERROR]"), err.stack || err.message || err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

/**
 * 404 Not Found Middleware
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};
