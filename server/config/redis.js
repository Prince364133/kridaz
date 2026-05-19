/**
 * Shared Redis connection pool.
 */
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { EventEmitter } from 'events';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

if (!process.env.REDIS_URL) {
  console.warn('[REDIS] WARNING: REDIS_URL env var is not set. Falling back to localhost.');
}

// ── In-Memory Mock Redis for Fallback ────────────────────────────────────────
class MockRedis extends EventEmitter {
  constructor() {
    super();
    this.store = new Map();
    this.sets = new Map();
    this.geo = new Map();
    this.lists = new Map();
    this.status = 'ready';
    
    // Simulate connection events
    setTimeout(() => {
      this.emit('connect');
      this.emit('ready');
    }, 10);

    // Wrap the instance in a Proxy to dynamically mock any missing Redis methods
    return new Proxy(this, {
      get: (target, prop) => {
        // If target has the property/method explicitly, return it
        if (prop in target) {
          const val = target[prop];
          return typeof val === 'function' ? val.bind(target) : val;
        }
        
        // If it's a Symbol or standard handler, let it pass
        if (typeof prop === 'symbol' || prop === 'then' || prop === 'catch') {
          return undefined;
        }
        
        const propStr = prop.toString();
        
        // Return a default mock function that resolves to dummy values
        return async (...args) => {
          const lowerProp = propStr.toLowerCase();
          
          if (lowerProp === 'script') {
            // SCRIPT LOAD needs to return a dummy SHA1 hash
            if (args[0]?.toLowerCase() === 'load') {
              return 'b8281a8b13cdcc300efc687e8346e819c45c7f02';
            }
            return 'OK';
          }
          
          if (lowerProp === 'definecommand') {
            return 'OK';
          }
          
          // BullMQ custom commands called directly as methods (e.g. checkStalledJobs)
          if (lowerProp.includes('stalled')) {
            return [[], []];
          }
          
          if (lowerProp.includes('job') || lowerProp.includes('moveto') || lowerProp.includes('retry') || lowerProp.includes('clean')) {
            return [];
          }
          
          // Fallback return value
          return 'OK';
        };
      }
    });
  }

  async ping() {
    return 'PONG';
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async set(key, val, ...args) {
    this.store.set(key, val);
    const exIdx = args.indexOf('EX');
    if (exIdx !== -1 && args[exIdx + 1]) {
      const ttl = parseInt(args[exIdx + 1], 10);
      setTimeout(() => this.store.delete(key), ttl * 1000);
    }
    return 'OK';
  }

  async del(key) {
    this.store.delete(key);
    this.sets.delete(key);
    this.geo.delete(key);
    this.lists.delete(key);
    return 1;
  }

  async expire(key, seconds) {
    setTimeout(() => {
      this.store.delete(key);
      this.sets.delete(key);
      this.geo.delete(key);
      this.lists.delete(key);
    }, seconds * 1000);
    return 1;
  }

  async sadd(key, val) {
    if (!this.sets.has(key)) {
      this.sets.set(key, new Set());
    }
    this.sets.get(key).add(val.toString());
    return 1;
  }

  async srem(key, val) {
    if (this.sets.has(key)) {
      this.sets.get(key).delete(val.toString());
    }
    return 1;
  }

  async scard(key) {
    if (this.sets.has(key)) {
      return this.sets.get(key).size;
    }
    return 0;
  }

  async geoadd(key, lng, lat, member) {
    if (!this.geo.has(key)) {
      this.geo.set(key, new Map());
    }
    this.geo.get(key).set(member.toString(), { lat: parseFloat(lat), lng: parseFloat(lng) });
    return 1;
  }

  async georadius(key, lng, lat, radius, unit) {
    if (!this.geo.has(key)) return [];
    const members = this.geo.get(key);
    const results = [];
    
    const lat1 = parseFloat(lat);
    const lng1 = parseFloat(lng);
    const R = 6371; // Earth radius in km
    
    for (const [member, coords] of members.entries()) {
      const lat2 = coords.lat;
      const lng2 = coords.lng;
      
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const dist = R * c;
      
      if (dist <= radius) {
        results.push(member);
      }
    }
    return results;
  }

  async zrem(key, member) {
    if (this.geo.has(key)) {
      this.geo.get(key).delete(member.toString());
    }
    return 1;
  }

  async lpush(key, val) {
    if (!this.lists.has(key)) {
      this.lists.set(key, []);
    }
    this.lists.get(key).unshift(val);
    return this.lists.get(key).length;
  }

  async ltrim(key, start, end) {
    if (this.lists.has(key)) {
      const list = this.lists.get(key);
      const trimmed = list.slice(start, end + 1);
      this.lists.set(key, trimmed);
    }
    return 'OK';
  }

  async lrange(key, start, end) {
    if (!this.lists.has(key)) return [];
    const list = this.lists.get(key);
    if (end === -1) {
      return list.slice(start);
    }
    return list.slice(start, end + 1);
  }

  // Pub/Sub methods required by socket.io Redis adapter
  async psubscribe(pattern) {
    return 'OK';
  }

  async punsubscribe(pattern) {
    return 'OK';
  }

  async subscribe(channel) {
    return 'OK';
  }

  async unsubscribe(channel) {
    return 'OK';
  }

  async publish(channel, message) {
    return 0;
  }

  async call(cmd, ...args) {
    const lowerCmd = cmd.toLowerCase();
    if (lowerCmd === 'eval' || lowerCmd === 'evalsha') {
      const script = args[0] || '';
      if (script.includes('stalled')) {
        return [[], []];
      }
      if (script.includes('bull') || script.includes('moveToActive') || script.includes('moveToFinished') || script.includes('moveToFailed')) {
        return [];
      }
      // Default fallback response for rate-limit-redis Lua script
      return [1, 60000];
    }
    if (lowerCmd === 'script' && args[0]?.toLowerCase() === 'load') {
      return 'b8281a8b13cdcc300efc687e8346e819c45c7f02';
    }
    const method = this[lowerCmd];
    if (typeof method === 'function') {
      return method.apply(this, args);
    }
    return null;
  }

  duplicate() {
    return new MockRedis();
  }
}

// Custom retry strategy: try once, then stop reconnecting
const customRetryStrategy = (times) => {
  return null;
};

// Use real Redis only in production, use MockRedis in development
const useRealRedis = process.env.NODE_ENV === 'production';

let rClient, bConn, pClient, sClient;
const activeClients = {};

if (useRealRedis) {
  // ── Instantiate Real Clients in Background ──────────────────────────────────
  rClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    connectTimeout: 2000,
    lazyConnect: false,
    retryStrategy: customRetryStrategy
  });

  bConn = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: customRetryStrategy
  });

  pClient = new Redis(REDIS_URL, {
    retryStrategy: customRetryStrategy
  });
  sClient = pClient.duplicate();

  activeClients.redisClient = rClient;
  activeClients.bullmqConnection = bConn;
  activeClients.pubClient = pClient;
  activeClients.subClient = sClient;
}

// Start with Mock clients active by default to prevent connection blocking
const fallbackMocks = {
  redisClient: new MockRedis(),
  bullmqConnection: new MockRedis(),
  pubClient: new MockRedis(),
  subClient: new MockRedis()
};

const warned = {};
function handleConnectionError(clientName, err) {
  if (!warned[clientName]) {
    console.warn(`[REDIS] ${clientName} failed to connect (using in-memory mock instead):`, err.message);
    warned[clientName] = true;
  }
  // Disconnect the real client to stop retry spam
  try {
    activeClients[clientName].disconnect();
  } catch (e) {}
}

if (useRealRedis) {
  rClient.on('error', (err) => handleConnectionError('redisClient', err));
  bConn.on('error', (err) => handleConnectionError('bullmqConnection', err));
  pClient.on('error', (err) => handleConnectionError('pubClient', err));
  sClient.on('error', (err) => handleConnectionError('subClient', err));

  rClient.on('ready', () => {
    console.log('[REDIS] General client ready. Swapping to real Redis server.');
    fallbackMocks.redisClient = null;
  });
  bConn.on('ready', () => {
    console.log('[REDIS] BullMQ client ready. Swapping to real Redis server.');
    fallbackMocks.bullmqConnection = null;
  });
  pClient.on('ready', () => {
    console.log('[REDIS] pubClient ready. Swapping to real Redis server.');
    fallbackMocks.pubClient = null;
  });
  sClient.on('ready', () => {
    console.log('[REDIS] subClient ready. Swapping to real Redis server.');
    fallbackMocks.subClient = null;
  });
}

// ── Create Proxy wrappers to swap clients dynamically ────────────────────────
const createProxy = (clientName) => {
  return new Proxy({}, {
    get: (target, prop) => {
      // If swapped to mock (or not in production), return mock prop
      if (!useRealRedis || fallbackMocks[clientName]) {
        const mock = fallbackMocks[clientName];
        const val = mock[prop];
        return typeof val === 'function' ? val.bind(mock) : val;
      }
      
      // Otherwise return real client prop
      const realClient = activeClients[clientName];
      const val = realClient[prop];
      if (typeof val === 'function') {
        return (...args) => {
          try {
            return val.apply(realClient, args);
          } catch (err) {
            handleConnectionError(clientName, err);
            const mock = fallbackMocks[clientName];
            if (mock && typeof mock[prop] === 'function') {
              return mock[prop].apply(mock, args);
            }
            throw err;
          }
        };
      }
      return val;
    }
  });
};

export const redisClient = createProxy('redisClient');
export const bullmqConnection = createProxy('bullmqConnection');
export const pubClient = createProxy('pubClient');
export const subClient = createProxy('subClient');

export default redisClient;
