import logger from '../utils/logger.js';
import { HttpError, NotFoundError } from '@kridaz/common';
import * as Sentry from '@sentry/node';

/**
 * Legacy codes whose `message` field used to BE the code string itself —
 * the old web axios interceptor matches on `data.message === "TOKEN_EXPIRED"`
 * for the silent-refresh path. To avoid breaking deployed web clients during
 * the Wave 1 envelope rollout, we surface the code as the message text for
 * exactly these entries while the canonical `code` field carries the same
 * value. Once the web client cuts over to reading `data.code`, this list
 * shrinks to empty and the override can be removed.
 */
const LEGACY_MESSAGE_AS_CODE = new Set([
  "TOKEN_EXPIRED",
]);

/**
 * Global error handler. Must be the LAST middleware registered in app.js.
 * Handles both typed HttpErrors and unexpected errors.
 *
 * Response shape:
 *   {
 *     success: false,
 *     error:   "NotFoundError",        // legacy — class name, kept for back-compat
 *     code:    "USER_NOT_FOUND" | null, // stable machine-readable code (preferred)
 *     message: "...",
 *     details: { ... },                // optional — non-code keys from err.meta
 *     requestId: "uuid"                // echo of X-Request-Id for log correlation
 *   }
 */
export const errorHandler = (err, req, res, next) => {
  const requestId = res.locals?.requestId;

  // Typed errors — use their statusCode and name directly
  if (err instanceof HttpError) {
    // Only log 5xx as errors; 4xx are expected and logged as warnings
    const logFn = err.statusCode >= 500 ? logger.error : logger.warn;
    logFn(`[${err.name}] ${err.message}`, {
      statusCode: err.statusCode,
      path: req.originalUrl,
      method: req.method,
      requestId,
      ...(Object.keys(err.meta || {}).length && { meta: err.meta }),
    });

    // Split `code` out of meta so it surfaces as a top-level field; the rest
    // stays under `details` for field-level context (validation, etc.).
    const { code = null, ...detailsRest } = err.meta || {};
    const hasDetails = Object.keys(detailsRest).length > 0;

    // Legacy message-as-code shim — see LEGACY_MESSAGE_AS_CODE.
    const message = code && LEGACY_MESSAGE_AS_CODE.has(code) ? code : err.message;

    // Sanitize Prisma internals out of the wire body regardless of env —
    // server-side method signatures should never reach the client even in
    // dev, since they leak schema details.
    const sanitizedMessage = looksLikePrismaInternal(message)
      ? 'Internal server error.'
      : message;

    return res.status(err.statusCode).json({
      success: false,
      code,
      message: sanitizedMessage,
      ...(hasDetails && { details: detailsRest }),
      ...(requestId && { requestId }),
    });
  }

  // Unexpected / untyped errors — always a 500
  logger.error('[UNHANDLED_ERROR]', err);
  Sentry.captureException(err, {
    extra: { path: req.originalUrl, method: req.method, requestId },
  });

  const rawMessage = process.env.NODE_ENV === 'production' ? 'Something went wrong.' : err.message;
  const safeMessage = looksLikePrismaInternal(rawMessage) ? 'Internal server error.' : rawMessage;

  return res.status(500).json({
    success: false,
    code:    'INTERNAL_ERROR',
    message: safeMessage,
    ...(requestId && { requestId }),
  });
};

/** Strip Prisma method signatures / Where-input shapes from response bodies. */
const looksLikePrismaInternal = (msg) =>
  typeof msg === 'string' && /prisma\.|WhereInput|StringNullableFilter|NullableJsonNullValueInput/i.test(msg);

/**
 * 404 handler — must be registered BEFORE errorHandler in app.js.
 */
export const notFound = (req, res, next) => {
  next(new NotFoundError(`Route not found: ${req.originalUrl}`));
};
