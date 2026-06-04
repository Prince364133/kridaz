/**
 * Canonical success-response envelope.
 *
 *   { success: true, data: { ... }, meta: { requestId, timestamp, ...extra } }
 *
 * Use this for new endpoints and for the auth endpoints the mobile client reads
 * (login, register, refresh, getMe). Existing endpoints can adopt it
 * incrementally — old top-level fields are kept alongside `data` during the
 * Wave 4 sweep, then removed once both clients consume `data.*`.
 *
 * Why a helper at all: typing the envelope by hand drifts (different keys
 * across controllers, missing requestId). One helper keeps it tight.
 *
 * @param {import('express').Response} res
 * @param {any}    data    payload to wrap
 * @param {number} [status=200]
 * @param {object} [meta={}]  extra meta keys (e.g. pagination)
 */
export const ok = (res, data, status = 200, meta = {}) => {
  const requestId = res.locals?.requestId;
  return res.status(status).json({
    success: true,
    data,
    meta: {
      ...(requestId && { requestId }),
      timestamp: new Date().toISOString(),
      ...meta,
    },
  });
};

/**
 * Convenience for 201 Created responses.
 */
export const created = (res, data, meta = {}) => ok(res, data, 201, meta);
