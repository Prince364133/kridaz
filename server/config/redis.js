/**
 * Shared Redis connection pool.
 *
 * Rules:
 *  - BullMQ queues and workers MUST use `bullmqConnection` (maxRetriesPerRequest: null).
 *  - All other uses (rate-limit, presence, live state) use `redisClient`.
 *  - Never create a new Redis() anywhere else in the codebase.
 */
import Redis from 'ioredis';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

if (!process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
  logger.error('[REDIS] FATAL: REDIS_URL env var is NOT set in production! Falling back to localhost will likely fail.');
} else if (!process.env.REDIS_URL) {
  logger.warn('[REDIS] WARNING: REDIS_URL env var is not set. Falling back to localhost.');
}

// ── General-purpose client (presence, rate-limit, live state) ──────────────
export const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 5000,
  lazyConnect: false,
});

redisClient.on('connect', () => logger.info('[REDIS] General client connected.'));
redisClient.on('error', (err) => logger.error('[REDIS] General client error:', err));

// ── BullMQ-specific client (maxRetriesPerRequest MUST be null for BullMQ) ──
export const bullmqConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

bullmqConnection.on('connect', () => logger.info('[REDIS] BullMQ client connected.'));
bullmqConnection.on('error', (err) => logger.error('[REDIS] BullMQ client error:', err));

// ── Socket.io Redis Adapter Clients ────────────────────────────────────────
export const pubClient = new Redis(REDIS_URL);
export const subClient = pubClient.duplicate();

export default redisClient;
