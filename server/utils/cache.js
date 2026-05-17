import redis from '../config/redis.js';
import crypto from 'crypto';
import logger from './logger.js';

/**
 * Generates a consistent hash for a set of query parameters.
 */
export const generateCacheKey = (prefix, params) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  const hash = crypto.createHash('md5').update(sortedParams).digest('hex');
  return `${prefix}:${hash}`;
};

/**
 * Cache-aside helper: returns cached data if available, otherwise fetches and caches it.
 */
export const getOrSetCache = async (key, fetchFn, ttl = 300) => {
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    logger.warn(`[CACHE] Read Error for ${key}`, err);
  }

  const freshData = await fetchFn();

  try {
    if (freshData) {
      await redis.set(key, JSON.stringify(freshData), 'EX', ttl);
    }
  } catch (err) {
    logger.warn(`[CACHE] Write Error for ${key}`, err);
  }

  return freshData;
};

/**
 * Invalidates cache by pattern.
 */
export const invalidateCache = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`[CACHE] Invalidated ${keys.length} keys matching ${pattern}`);
    }
  } catch (err) {
    logger.warn(`[CACHE] Invalidation Error for ${pattern}`, err);
  }
};
