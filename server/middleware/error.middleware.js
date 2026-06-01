import logger from '../utils/logger.js';
import { HttpError, NotFoundError } from '@kridaz/common';
import * as Sentry from '@sentry/node';

/**
 * Global error handler. Must be the LAST middleware registered in app.js.
 * Handles both typed HttpErrors and unexpected errors.
 */
export const errorHandler = (err, req, res, next) => {
  // Typed errors — use their statusCode and name directly
  if (err instanceof HttpError) {
    // Only log 5xx as errors; 4xx are expected and logged as warnings
    const logFn = err.statusCode >= 500 ? logger.error : logger.warn;
    logFn(`[${err.name}] ${err.message}`, {
      statusCode: err.statusCode,
      path: req.originalUrl,
      method: req.method,
      ...(Object.keys(err.meta || {}).length && { meta: err.meta }),
    });

    return res.status(err.statusCode).json({
      success: false,
      error:   err.name,
      message: err.message,
      ...(Object.keys(err.meta || {}).length && { details: err.meta }),
    });
  }

  // Unexpected / untyped errors — always a 500
  logger.error('[UNHANDLED_ERROR]', err);
  Sentry.captureException(err, {
    extra: { path: req.originalUrl, method: req.method },
  });

  return res.status(500).json({
    success: false,
    error:   'InternalError',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong.' : err.message,
    stack:   process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

/**
 * 404 handler — must be registered BEFORE errorHandler in app.js.
 */
export const notFound = (req, res, next) => {
  next(new NotFoundError(`Route not found: ${req.originalUrl}`));
};
