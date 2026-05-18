/**
 * Shared Redis connection pool.
 *
 * Rules:
 *  - BullMQ queues and workers MUST use `bullmqConnection` (maxRetriesPerRequest: null).
 *  - All other uses (rate-limit, presence, live state) use `redisClient`.
 *  - Never create a new Redis() anywhere else in the codebase.
 */
import net from 'net';
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

const checkRedisReachable = (url) => {
  return new Promise((resolve) => {
    try {
      let urlWithProtocol = url;
      if (!url.startsWith('redis://') && !url.startsWith('rediss://')) {
        urlWithProtocol = 'redis://' + url;
      }
      const parsed = new URL(urlWithProtocol);
      const port = parsed.port || 6379;
      const host = parsed.hostname || 'localhost';
      
      const socket = net.createConnection({
        port: parseInt(port),
        host: host,
        timeout: 1000
      });
      
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
    } catch (e) {
      resolve(false);
    }
  });
};

// Simple in-memory fallback MockRedis
class MockRedis {
  constructor(name = 'Mock') {
    this.name = name;
    this.store = new Map();
    this.sets = new Map();
    this.callbacks = {};
  }
  
  async get(key) {
    return this.store.get(key) || null;
  }
  
  async set(key, val, ...args) {
    this.store.set(key, String(val));
    return 'OK';
  }
  
  async incr(key) {
    const val = Number(this.store.get(key) || 0) + 1;
    this.store.set(key, String(val));
    return val;
  }
  
  async expire(key, seconds) {
    return 1;
  }
  
  async sadd(key, ...members) {
    if (!this.sets.has(key)) {
      this.sets.set(key, new Set());
    }
    const set = this.sets.get(key);
    let added = 0;
    const flatMembers = members.flat();
    for (const m of flatMembers) {
      if (!set.has(String(m))) {
        set.add(String(m));
        added++;
      }
    }
    return added;
  }
  
  async sismember(key, member) {
    const set = this.sets.get(key);
    return set && set.has(String(member)) ? 1 : 0;
  }

  async srem(key, ...members) {
    const set = this.sets.get(key);
    if (!set) return 0;
    let removed = 0;
    const flatMembers = members.flat();
    for (const m of flatMembers) {
      if (set.has(String(m))) {
        set.delete(String(m));
        removed++;
      }
    }
    return removed;
  }
  
  async del(key) {
    const deleted = this.store.delete(key) || this.sets.delete(key);
    return deleted ? 1 : 0;
  }
  
  async quit() {
    return 'OK';
  }

  async call(command, ...args) {
    const cmd = command.toLowerCase();
    if (typeof this[cmd] === 'function') {
      return this[cmd](...args);
    }
    return null;
  }

  // Pub/Sub Mock Methods
  async psubscribe(pattern) {
    return 'OK';
  }

  async punsubscribe(pattern) {
    return 'OK';
  }

  async publish(channel, message) {
    return 1;
  }

  async subscribe(channel) {
    return 'OK';
  }

  async unsubscribe(channel) {
    return 'OK';
  }
  
  on(event, cb) {
    if (!this.callbacks[event]) this.callbacks[event] = [];
    this.callbacks[event].push(cb);
    if (event === 'connect' || event === 'ready') {
      setTimeout(() => cb(), 10);
    }
    return this;
  }
}

// Perform active top-level check
const isProduction = process.env.NODE_ENV === 'production';
const isRedisAvailable = isProduction || (await checkRedisReachable(REDIS_URL));

function createRedisClient(name, url, isBullMQ = false) {
  if (!isRedisAvailable) {
    logger.warn(`[REDIS] Redis is offline/unreachable on local environment. Using MockRedis for ${name}.`);
    return new MockRedis(name);
  }

  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: isBullMQ ? null : 3,
      connectTimeout: 5000,
      enableReadyCheck: false,
    });

    client.on('connect', () => logger.info(`[REDIS] ${name} client connected.`));
    client.on('error', (err) => logger.error(`[REDIS] ${name} client error: ${err.message || err}`));

    return client;
  } catch (err) {
    logger.error(`[REDIS] Failed to initialize Redis ${name}: ${err.message || err}`);
    return new MockRedis(name);
  }
}

// ── General-purpose client (presence, rate-limit, live state) ──────────────
export const redisClient = createRedisClient('General', REDIS_URL);

// ── BullMQ-specific client (maxRetriesPerRequest MUST be null for BullMQ) ──
export const bullmqConnection = createRedisClient('BullMQ', REDIS_URL, true);

// ── Socket.io Redis Adapter Clients ────────────────────────────────────────
export const pubClient = createRedisClient('Pub', REDIS_URL);
export const subClient = createRedisClient('Sub', REDIS_URL);

export default redisClient;
