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

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

if (!process.env.REDIS_URL) {
  console.warn('[REDIS] WARNING: REDIS_URL env var is not set. Falling back to localhost.');
}

// ── General-purpose client (presence, rate-limit, live state) ──────────────
export const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 5000,
  lazyConnect: false,
});

redisClient.on('connect', () => console.log('[REDIS] General client connected.'));
redisClient.on('error', (err) => console.error('[REDIS] General client error:', err.message));

// ── BullMQ-specific client (maxRetriesPerRequest MUST be null for BullMQ) ──
export const bullmqConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

bullmqConnection.on('connect', () => console.log('[REDIS] BullMQ client connected.'));
bullmqConnection.on('error', (err) => console.error('[REDIS] BullMQ client error:', err.message));

export default redisClient;
