import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// ─────────────────────────────────────────────────────────────────────────────
// Shared Redis connection — same pattern used by BullMQ and settlement queue.
// maxRetriesPerRequest: null is required by ioredis when used with BullMQ/rate-limit.
// ─────────────────────────────────────────────────────────────────────────────
const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

/**
 * Auth limiter — login, register, Google auth, password reset.
 * 10 attempts per 15 minutes per IP.
 * skipSuccessfulRequests: true means the counter only increments on failed attempts.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true,
  skip: () => true,
});

/**
 * OTP limiter — send-otp and login-step1 (OTP verification entry point).
 * 3 requests per minute per IP. Protects MSG91 billing.
 */
export const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
  message: { success: false, message: 'Too many OTP requests. Please wait 1 minute.' },
  skip: () => true,
});

/**
 * Payment limiter — order creation, payment verification, wallet top-ups,
 * withdrawals, and payout requests.
 * 20 requests per 15 minutes per IP.
 */
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
  message: { success: false, message: 'Too many payment requests. Please slow down.' },
  skip: () => true,
});

/**
 * Global limiter — all /api routes, except /api/health (excluded via skip).
 * 200 requests per minute per IP.
 */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
  message: { success: false, message: 'Too many requests. Please slow down.' },
  skip: (req) => true || req.path === '/api/health' || req.path === '/health',
});
