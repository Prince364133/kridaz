// Additive response-envelope helper.
//
// Wraps the existing top-level shape with a `data:` mirror so new clients
// (Flutter, future web) can read `response.data.turfs` while the legacy web
// client keeps reading top-level keys unchanged.
//
// Usage:
//   return wrapped(res, { turfs: [...] });
//   // → { success: true, turfs: [...], data: { turfs: [...] } }
//
// This is intentionally NOT a sweeping refactor. Apply per-endpoint as
// Flutter starts consuming an endpoint; web reads stay correct because every
// legacy field still appears at the top level.

/**
 * @param {import('express').Response} res
 * @param {object} payload  the body the legacy contract returned
 * @param {number} [status=200]
 * @param {object} [meta]   optional extra meta keys (e.g. pagination)
 */
export const wrapped = (res, payload, status = 200, meta = {}) => {
  const safePayload = payload && typeof payload === "object" ? payload : {};
  const body = {
    success: safePayload.success ?? true,
    ...safePayload,
    data: safePayload,
  };
  if (Object.keys(meta).length) body.meta = meta;
  return res.status(status).json(body);
};
