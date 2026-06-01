/**
 * Base HTTP error class. All typed errors extend this.
 * Preserves subclass name in logs via new.target.name.
 */
export class HttpError extends Error {
  statusCode: number;
  meta: any;

  constructor(statusCode: number, message: string, meta: any = {}) {
    super(message);
    this.name       = new.target.name;
    this.statusCode = statusCode;
    this.meta       = meta;
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, new.target);
    }
  }
}

/** 400 — malformed request body or invalid parameters */
export class BadRequestError extends HttpError {
  constructor(msg = 'Bad Request', meta = {}) { super(400, msg, meta); }
}

/** 401 — missing or invalid auth token */
export class UnauthorizedError extends HttpError {
  constructor(msg = 'Unauthorized') { super(401, msg); }
}

/** 403 — authenticated but not allowed */
export class ForbiddenError extends HttpError {
  constructor(msg = 'Forbidden') { super(403, msg); }
}

/** 404 — resource does not exist */
export class NotFoundError extends HttpError {
  constructor(msg = 'Not Found') { super(404, msg); }
}

/** 409 — resource already exists or state conflict */
export class ConflictError extends HttpError {
  constructor(msg = 'Conflict') { super(409, msg); }
}

/** 422 — validation failed (use meta for field-level errors) */
export class UnprocessableError extends HttpError {
  constructor(msg = 'Validation Failed', meta = {}) { super(422, msg, meta); }
}

/** 429 — rate limit exceeded */
export class TooManyRequestsError extends HttpError {
  constructor(msg = 'Too Many Requests') { super(429, msg); }
}

/** 500 — unexpected server error */
export class InternalError extends HttpError {
  constructor(msg = 'Internal Server Error') { super(500, msg); }
}
