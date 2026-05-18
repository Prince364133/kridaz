import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient as redis } from '../config/redis.js';

const isTest = process.env.NODE_ENV === 'test';
const defaultWindow = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;

/**
 * Auth limiter — login, register, Google auth, password reset.
 * 10 attempts per 15 minutes per IP.
 * skipSuccessfulRequests: true means the counter only increments on failed attempts.
 */
export const authLimiter = rateLimit({
  windowMs: defaultWindow,
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true,
  skip: (req) => process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
});

/**
 * OTP limiter — send-otp and login-step1 (OTP verification entry point).
 * 5 requests per 15 mins (was 3 per min, adjusted to environment variable).
 */
export const otpLimiter = rateLimit({
  windowMs: defaultWindow,
  max: parseInt(process.env.RATE_LIMIT_OTP_MAX) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
  message: { success: false, message: 'Too many OTP requests. Please wait a while.' },
  skip: (req) => process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
});

/**
 * Payment limiter — order creation, payment verification, etc.
 */
export const paymentLimiter = rateLimit({
  windowMs: defaultWindow,
  max: parseInt(process.env.RATE_LIMIT_PAYMENT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
  message: { success: false, message: 'Too many payment requests. Please slow down.' },
  skip: (req) => process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
});

/**
 * Global limiter — all /api routes.
 * 200 requests per minute per IP.
 */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
  message: { success: false, message: 'Too many requests. Please slow down.' },
  skip: (req) => process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development' || req.path === '/health' || req.path === '/api/health',
});
