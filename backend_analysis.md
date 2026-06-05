
● Kridaz — Principal Backend Architect Deep Review

  ---
  PART I: CRITICAL ISSUE ANALYSIS

  ---
  ISSUE 1 — Helmet Missing From Production

  Why it's dangerous:
  HTTP security headers are your browser-enforced defense layer. Without
  them, the browser trusts everything — arbitrary inline scripts,
  cross-origin frames, mixed content. Helmet sets 11 headers in one call.
  Without it, you are one XSS payload away from session hijacking across
  every logged-in user simultaneously.

  Failure scenarios:
  - An attacker injects a <script> tag via a stored XSS vector (e.g., a user
   bio, a team name, a reel caption). Without Content-Security-Policy, the
  browser executes it. The script calls your API with the victim's cookie
  (since credentials: include is set by the frontend). Full account
  takeover.
  - Without X-Frame-Options: DENY, your login page can be embedded in a
  foreign iframe with CSS opacity 0, creating a clickjacking attack that
  captures user credentials.
  - Without Strict-Transport-Security, a user on a shared WiFi network who
  visits http://kridaz.com before the redirect can have their session cookie
   intercepted in plaintext via SSL stripping.
  - Without X-Content-Type-Options: nosniff, a browser may sniff a MIME type
   and execute an uploaded file as JavaScript.

  Scale implications: XSS at scale = credentials theft at scale. With 100k
  users, one stored XSS in a viral reel caption could harvest thousands of
  sessions in minutes.

  Security maturity gap: OWASP Top 10 A05 (Security Misconfiguration). A
  PCI-DSS audit (required if you ever handle card data directly) would fail
  immediately.

  Production-grade solution:

  // app.js — add immediately after express() init
  import helmet from 'helmet';

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://challenges.cloudflare.com",  // Turnstile
          "'nonce-{NONCE}'"                     // for inline scripts if any
        ],
        styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind needs this
  currently
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com",
  "https://pub-*.r2.dev"],
        connectSrc: [
          "'self'",
          process.env.SOCKET_URL,
          "https://sentry.io"
        ],
        mediaSrc: ["'self'", "https://pub-*.r2.dev"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,        // 1 year
      includeSubDomains: true,
      preload: true,           // submit to HSTS preload list
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginEmbedderPolicy: false, // disable if embedding YouTube
  iframes
  }));

  Tradeoffs: CSP unsafe-inline for styles is a concession until you migrate
  Tailwind to PurgeCSS-only output with external stylesheets. Accept this
  temporarily. Do NOT use unsafe-eval — this would defeat CSP entirely.

  Infra-level: Also configure security headers at the Render/CDN level as a
  secondary layer. Cloudflare in front of Render adds another header
  injection layer.

  Priority: P0 — Deploy in the next hour.

  ---
  ISSUE 2 — Online User Broadcast: O(n²) Fan-Out Catastrophe

  Why it's dangerous:
  Every socket connect and disconnect triggers two operations:
  1. redis.smembers('kridaz:online:users') — returns the complete array of
  online user IDs
  2. io.emit('online users', onlineUserIds) — broadcasts that array to every
   connected socket

  At 10,000 concurrent users: each connect event sends a 10,000-element JSON
   array to 10,000 sockets simultaneously. That is 100 million data points
  per connection event. With users connecting and disconnecting at a rate of
   even 10/second, you're pushing 1 billion data points per second through
  Socket.IO.

  Failure scenarios:
  - The Node.js event loop blocks on serializing a 50,000-element JSON array
   for 10,000 recipients. New connections time out. Existing socket handlers
   queue up. The server appears hung. Render's health check fails. Instance
  is terminated. All sockets reconnect simultaneously. The cascade kills
  every instance.
  - Redis SMEMBERS with 100,000 members returns a 100,000-element array over
   the network every single connection event. Redis CPU spikes. Rate
  limiters fail. BullMQ jobs fail (same Redis). Presence tracking fails.
  Payment confirmation queues stall.
  - Socket.IO's internal write buffer fills up faster than clients can drain
   it. Memory grows unbounded until OOM kill.

  Race condition: Between smembers and io.emit, more users can disconnect.
  The broadcasted list is stale the moment it leaves the server. You're
  broadcasting incorrect state constantly.

  Exact production-grade solution:

  // config/socket.js — replace all presence broadcasting

  // WRONG: send full user list
  io.emit('online users', onlineUserIds); // ❌

  // CORRECT: send only counts and delta events
  // On connect:
  await redis.sadd('kridaz:online:users', userId);
  const count = await redis.scard('kridaz:online:users'); // O(1)
  io.emit(SOCKET.ONLINE_USERS_COUNT, { count }); // tiny payload

  // On disconnect:
  await redis.srem('kridaz:online:users', userId);
  const count = await redis.scard('kridaz:online:users');
  io.emit(SOCKET.ONLINE_USERS_COUNT, { count }); // tiny payload

  // If a client needs to know if a SPECIFIC user is online:
  // HTTP endpoint (not socket event):
  // GET /api/presence/users?ids=a,b,c → { a: true, b: false, c: true }
  // Uses redis.smismember() — O(n) but controlled n, on-demand

  For "who is online in my friend list" (common pattern):
  // Batched presence check — called by client on demand, not pushed
  app.get('/api/presence/batch', authenticate, async (req, res) => {
    const { userIds } = req.query; // comma-separated, max 100
    const ids = userIds.split(',').slice(0, 100);

    // Redis 7+ SMISMEMBER: O(n) for n ids, single round-trip
    const results = await redis.smismember('kridaz:online:users', ...ids);
    const presence = Object.fromEntries(ids.map((id, i) => [id, results[i]
  === 1]));

    res.json({ presence });
  });

  Throttled presence broadcast using distributed lock (already partially
  done, expand it):
  // Already have schedulePresenceBroadcast — expand it to debounce:
  const BROADCAST_INTERVAL_MS = 5000; // max 1 broadcast per 5 seconds

  const schedulePresenceBroadcast = async () => {
    const lockKey = 'kridaz:presence:broadcast:lock';
    const acquired = await redis.set(lockKey, 'locked', 'PX',
  BROADCAST_INTERVAL_MS, 'NX');
    if (acquired) {
      const count = await redis.scard('kridaz:online:users'); // O(1), NOT
  smembers
      io.emit(SOCKET.ONLINE_USERS_COUNT, { count }); // just the number
    }
  };

  Tradeoffs: Clients lose real-time per-user online indicators. This is
  acceptable — Discord, WhatsApp, and Instagram all use eventual consistency
   for presence. Exact presence is shown only when opening a specific chat.

  Priority: P0 — This will kill your production instance at 2,000 concurrent
   users.

  ---
  ISSUE 3 — redis.keys() in Cache Invalidation

  Why it's dangerous:
  Redis is single-threaded. KEYS pattern is an O(n) operation that blocks
  the entire Redis server for the duration of the scan. While KEYS is
  running, no other command executes. Rate limiters block. BullMQ job pops
  block. Socket.IO pub/sub blocks. Presence updates block. Payment
  confirmation queues stall.

  Failure scenarios:
  - With 500,000 Redis keys (realistic at 10k users with sessions, presence,
   geo, cache entries), KEYS *rec:grounds:* takes 50–200ms. During those
  50–200ms, every Redis-dependent operation in your entire system queues up.
   Rate limiters start returning false positives. OTP limiters reset
  incorrectly. Socket heartbeats miss. BullMQ workers time out.
  - An attacker who can trigger cache invalidation (e.g., by uploading a
  turf image repeatedly) can deliberately cause repeated KEYS scans, turning
   it into a Redis-layer denial of service.

  Exact production-grade fix:

  // utils/cache.js — replace KEYS with SCAN

  export const invalidateCache = async (pattern) => {
    try {
      let cursor = '0';
      let totalDeleted = 0;

      do {
        // SCAN is O(1) per call, non-blocking, iterates in chunks
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH',
  pattern, 'COUNT', 100);
        cursor = nextCursor;

        if (keys.length > 0) {
          // Pipeline deletions — single round-trip
          const pipeline = redis.pipeline();
          keys.forEach(key => pipeline.del(key));
          await pipeline.exec();
          totalDeleted += keys.length;
        }
      } while (cursor !== '0');

      logger.info(`[CACHE] Invalidated ${totalDeleted} keys matching
  ${pattern}`);
    } catch (err) {
      logger.warn(`[CACHE] Invalidation Error for ${pattern}`, err);
    }
  };

  Better architectural approach — namespaced cache with tag-based
  invalidation:
  // Instead of pattern scanning, maintain an index of cache keys per
  entity:
  // When caching ground recommendations for user X:
  //   SET rec:grounds:userId:X → data
  //   SADD cache:tags:user:X → rec:grounds:userId:X

  // When invalidating user X's caches:
  export const invalidateByTag = async (tag) => {
    const tagKey = `cache:tags:${tag}`;
    const keys = await redis.smembers(tagKey);
    if (keys.length > 0) {
      const pipeline = redis.pipeline();
      keys.forEach(key => pipeline.del(key));
      pipeline.del(tagKey); // clean up the index too
      await pipeline.exec();
    }
  };

  Priority: P0 — Deploy before any traffic spike.

  ---
  ISSUE 4 — Health Endpoint Reports Wrong Database

  Why it's dangerous:
  Your health endpoint is your uptime monitor's source of truth. Render uses
   it for instance health checks. Your PagerDuty/BetterUptime uses it for
  alerting. When it reports "Disconnected" for the database you actually use
   (Mongoose → MongoDB) but you're actually running on PostgreSQL, you have
  two problems:
  1. Alert fatigue — ops team starts ignoring database health alerts because
   they're always "disconnected"
  2. False sense of security — PostgreSQL can go down and the health check
  still returns 200 OK

  Exact fix:

  // app.js — replace health check

  app.get("/api/health", async (req, res) => {
    const checks = {};
    let overallStatus = 'healthy';

    // PostgreSQL check
    try {
      const { prisma } = await import('./config/prisma.js');
      await prisma.$queryRaw`SELECT 1`;
      checks.postgres = 'connected';
    } catch (err) {
      checks.postgres = 'disconnected';
      overallStatus = 'degraded';
    }

    // Redis check
    try {
      const pong = await redis.ping();
      checks.redis = pong === 'PONG' ? 'connected' : 'degraded';
    } catch (err) {
      checks.redis = 'disconnected';
      overallStatus = 'degraded';
    }

    // BullMQ queue depth snapshot (non-blocking)
    try {
      const { notificationQueue } = await
  import('./queues/notification.queue.js');
      const counts = await notificationQueue.getJobCounts();
      checks.queues = { notification: counts };
    } catch {
      checks.queues = 'unavailable';
    }

    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    });
  });

  Also: remove Mongoose entirely. It's dead weight. If no module uses it,
  npm uninstall mongoose saves ~4MB and removes an entire unnecessary
  connection pool initialization path.

  # Verify nothing uses it first:
  grep -r "mongoose" server/modules server/routes server/services
  --include="*.js" | grep -v "app.js"
  # If empty: remove it

  Priority: P1

  ---
  ISSUE 5 — JWT Without Refresh Token Rotation

  Why it's dangerous:
  Your RefreshToken model exists in Prisma but there's no evidence of token
  rotation — issuing a new refresh token on every use and invalidating the
  old one. Without rotation, a stolen refresh token is permanently valid
  until expiry. If an attacker exfiltrates a user's refresh token (via XSS,
  malware, compromised device), they have persistent access for the full
  refresh token TTL, which could be weeks or months.

  Failure scenario:
  User reports account compromise. You revoke their JWT (short-lived, 15
  minutes). But the attacker has the refresh token. Every 15 minutes they
  silently get a new JWT. The user cannot fully log out the attacker without
   a full token revocation system.

  Race condition in token refresh:
  Without rotation + invalidation, two concurrent refresh requests (common
  on mobile with poor connectivity causing retries) can both succeed,
  creating duplicate sessions.

  Production-grade solution:

  // modules/auth/auth.controller.js — refresh token endpoint

  export const refreshAccessToken = async (req, res) => {
    const { refreshToken } = req.cookies; // HttpOnly cookie

    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    // 1. Find and validate the token
    const tokenHash =
  crypto.createHash('sha256').update(refreshToken).digest('hex');
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date() ||
  storedToken.revokedAt) {
      // Potential token reuse attack — revoke entire family
      if (storedToken?.familyId) {
        await prisma.refreshToken.updateMany({
          where: { familyId: storedToken.familyId },
          data: { revokedAt: new Date() },
        });
        logger.warn(`[AUTH] Token reuse detected for user
  ${storedToken?.userId}. Family ${storedToken?.familyId} revoked.`);
      }
      return res.status(401).json({ message: 'Invalid or expired refresh
  token' });
    }

    // 2. Rotate: revoke old, issue new (within same family)
    const newRawToken = crypto.randomBytes(64).toString('hex');
    const newTokenHash =
  crypto.createHash('sha256').update(newRawToken).digest('hex');

    await prisma.$transaction([
      // Revoke the old token
      prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      }),
      // Issue new token in same family (for reuse attack detection)
      prisma.refreshToken.create({
        data: {
          tokenHash: newTokenHash,
          userId: storedToken.userId,
          familyId: storedToken.familyId, // inherit family
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30
  days
        },
      }),
    ]);

    // 3. Issue new access token
    const newAccessToken = jwt.sign(
      { id: storedToken.user.id, role: storedToken.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Set new refresh token as HttpOnly cookie
    res.cookie('refresh_token', newRawToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      domain: process.env.COOKIE_DOMAIN,
    });

    res.json({ accessToken: newAccessToken });
  };

  Add familyId and revokedAt to the RefreshToken schema:
  model RefreshToken {
    id        String    @id @default(uuid())
    userId    String
    tokenHash String    @unique
    familyId  String    @default(uuid()) // groups token lineage
    revokedAt DateTime? // null = active
    expiresAt DateTime
    createdAt DateTime  @default(now())
    user      User      @relation(fields: [userId], references: [id],
  onDelete: Cascade)

    @@index([userId])
    @@index([familyId])
  }

  Priority: P1

  ---
  ISSUE 6 — Scoring Lock Race Condition Across Redis Adapter Instances

  Why it's dangerous:
  // socket.js line ~182
  const sockets = await io.in(currentLock).fetchSockets();
  if (sockets.length === 0) {
    isStale = true;
  }

  fetchSockets() when using the Redis adapter queries all Socket.IO server
  instances for sockets with that ID. This is correct in theory but has a
  race window:
  1. Socket A holds the scoring lock. Socket A disconnects.
  2. The disconnect event fires on Server Instance 1, which removes the
  lock.
  3. Simultaneously, Socket B on Server Instance 2 calls
  scoring:acquire_lock.
  4. Between Step 2's redis.del(lockKey) and Step 3's redis.get(lockKey) +
  redis.set(lockKey, ...), another Socket C on Server Instance 3 also calls
  scoring:acquire_lock.
  5. Both B and C read currentLock = null and both set the lock. Two scorers
   now think they own the match simultaneously.

  This is a classic check-then-act race condition. The lock acquisition is
  not atomic.

  Solution — use Redis atomic SET NX:
  socket.on("scoring:acquire_lock", async ({ matchId }) => {
    if (!matchId) return;
    const lockKey = `kridaz:scoring_lock:${matchId}`;

    // Atomic: SET key value NX EX — only sets if key doesn't exist
    // Returns 'OK' if acquired, null if already locked
    const acquired = await redis.set(lockKey, socket.id, 'NX', 'EX', 10800);

    if (acquired === 'OK') {
      socket.scoringMatchId = matchId;
      socket.join(`scoring_wait_${matchId}`);
      socket.emit("scoring:lock_granted", { matchId });
    } else {
      // Check if existing lock holder is actually connected (stale
  detection)
      const currentHolder = await redis.get(lockKey);
      if (currentHolder && currentHolder !== socket.id) {
        // Stale detection: use fetchSockets across all adapter instances
        try {
          const holdingSockets = await io.fetchSockets();
          const holderConnected = holdingSockets.some(s => s.id ===
  currentHolder);

          if (!holderConnected) {
            // Attempt atomic compare-and-swap to steal stale lock
            // Lua script for atomic check-and-replace
            const luaScript = `
              if redis.call('get', KEYS[1]) == ARGV[1] then
                return redis.call('set', KEYS[1], ARGV[2], 'EX', ARGV[3])
              else
                return nil
              end
            `;
            const result = await redis.eval(luaScript, 1, lockKey,
  currentHolder, socket.id, 10800);
            if (result === 'OK') {
              socket.scoringMatchId = matchId;
              socket.join(`scoring_wait_${matchId}`);
              socket.emit("scoring:lock_granted", { matchId });
              return;
            }
          }
        } catch (err) {
          logger.warn(`[SCORING] Stale detection failed: ${err.message}`);
        }

        socket.join(`scoring_wait_${matchId}`);
        socket.emit("scoring:lock_denied", { matchId });
      }
    }
  });

  Priority: P1 — Data integrity issue. Two scorers entering simultaneous
  scoring events corrupts match data.

  ---
  ISSUE 7 — seedUsernameBloom Memory and Startup Risk

  Why it's dangerous:
  On every server startup, this code does:
  const users = await prisma.user.findMany({ select: { username: true } });
  With 1,000,000 users, this loads 1M username strings into Node.js heap
  memory, then chunks and pushes them to Redis. This:
  1. Spikes memory by potentially 100–500MB at startup
  2. Delays server readiness by 5–30 seconds (Render health check could
  fail, triggering restart loop)
  3. Creates a Redis write spike — 1000 SADD commands × 1000 members each

  At scale, this is a boot-loop bomb. If the process OOMs during startup and
   restarts, it tries again, OOMs again, and loops forever.

  Solution — lazy seeding with database-level stream:
  export const seedUsernameBloom = async () => {
    try {
      // Check if already seeded (idempotent)
      const keyExists = await redisClient.exists('kridaz:usernames:bloom');
      if (keyExists) {
        logger.info('[BLOOM] Username bloom already seeded, skipping.');
        return;
      }

      // Use cursor-based batch loading instead of findMany
      let cursor = null;
      let total = 0;
      const BATCH_SIZE = 500;

      do {
        const users = await prisma.user.findMany({
          select: { username: true },
          take: BATCH_SIZE,
          ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
          orderBy: { id: 'asc' },
        });

        if (users.length === 0) break;

        const usernames = users
          .map(u => u.username)
          .filter(Boolean)
          .map(u => u.toLowerCase().trim());

        if (usernames.length > 0) {
          await redisClient.sadd('kridaz:usernames:bloom', ...usernames);
        }

        cursor = users[users.length - 1]?.id;
        total += usernames.length;

        // Yield to event loop every batch to prevent blocking
        await new Promise(resolve => setImmediate(resolve));
      } while (true);

      // Set expiry to force periodic re-seeding (handles new usernames from
   other instances)
      await redisClient.expire('kridaz:usernames:bloom', 86400 * 7); // 7
  days
      logger.info(`[BLOOM] Seeded ${total} usernames.`);
    } catch (err) {
      logger.error('[BLOOM] Seeding failed', err);
      // Non-fatal: fallback to DB check always works
    }
  };

  Architectural note: The "bloom filter" is actually a Redis Set — exact, no
   false positives, but O(n) memory. For 1M usernames averaging 12 chars
  each, this is ~12MB in Redis, which is acceptable. A real probabilistic
  bloom filter (e.g., RedisBloom module) would use ~1.2MB for 1M items at 1%
   false positive rate. However, RedisBloom requires the Redis Stack module.
   For Render's Redis or Railway Redis, you're on standard Redis — keep the
  Set approach but fix the seeding.

  Priority: P2

  ---
  ISSUE 8 — Location Broadcast: No Significance Threshold

  Current behavior:
  socket.on("location:update", async (data) => {
    const { lat, lng } = data;
    // 2-second client throttle
    if (now - socket.lastLocationUpdate < 2000) return;

    await redis.geoadd("kridaz:geo:online", lng, lat,
  socket.userId.toString());
    const nearbyUserIds = await redis.georadius("kridaz:geo:online", lng,
  lat, 10, "km");

    nearbyUserIds.forEach(uid => {
      io.to(uid).emit("nearby:location:update", { userId: socket.userId,
  lat, lng });
    });
  });

  Why it's dangerous:
  A user sitting still in a stadium during a game will still emit location
  every 2 seconds if their GPS wobbles by 5 meters. With 1,000 users at a
  cricket ground, each emitting every 2 seconds, each triggering a GEORADIUS
   query returning 1000 results, each emitting to 1000 sockets: 500 million
  socket emissions per second from location updates alone.

  GEORADIUS is deprecated in Redis 6.2+ in favor of GEOSEARCH. More
  importantly, GEORADIUS with 1000 nearby users returns a 1000-element array
   per query. At 500 location updates/second, that's 500,000 array
  deserialization operations per second.

  Exact solution — haversine significance filter + batched broadcast:

  // utils/geo.util.js
  const SIGNIFICANCE_METERS = 50; // Only process if moved >50m

  export const haversineDistanceMeters = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1) * Math.cos(φ2) *
  Math.sin(Δλ/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  // socket.js — enhanced location handler
  socket.on("location:update", async (data) => {
    const { lat, lng } = data;
    if (!socket.userId || isNaN(lat) || isNaN(lng)) return;

    const now = Date.now();

    // Hard throttle: max 1 update per 3 seconds
    if (socket.lastLocationUpdate && now - socket.lastLocationUpdate < 3000)
   return;

    // Significance filter: only process if moved meaningfully
    if (socket.lastLat && socket.lastLng) {
      const distanceMoved = haversineDistanceMeters(
        socket.lastLat, socket.lastLng, lat, lng
      );
      if (distanceMoved < SIGNIFICANCE_METERS) return;
    }

    socket.lastLocationUpdate = now;
    socket.lastLat = lat;
    socket.lastLng = lng;

    // Hot path: Redis geo update (non-blocking, fire-and-forget for
  presence)
    redis.geoadd("kridaz:geo:online", lng, lat, socket.userId.toString())
      .catch(err => logger.error('GEO add failed:', err));

    // DB write: throttled to 60s (not 30s)
    if (!socket.lastDbLocationWrite || now - socket.lastDbLocationWrite >
  60000) {
      socket.lastDbLocationWrite = now;
      // Offload to BullMQ — don't block the socket event handler
      locationUpdateQueue.add('UPDATE_USER_LOCATION', {
        userId: socket.userId, lat, lng
      }, { jobId: `loc:${socket.userId}`, removeOnComplete: true });
    }

    // Nearby broadcast: limit radius and result set
    const nearbyUserIds = await redis.call(
      'GEOSEARCH', 'kridaz:geo:online',
      'FROMLONLAT', lng, lat,
      'BYRADIUS', 5, 'km',  // 5km, not 10km
      'ASC',
      'COUNT', 50,           // Max 50 nearby users, not unbounded
      'WITHDIST'
    );

    if (nearbyUserIds?.length > 0) {
      // Batch emit using Socket.IO rooms instead of forEach
      // Group nearby users into a room per geo-cell
      const geoCellRoom = `geo:cell:${Math.floor(lat * 10)}:${Math.floor(lng
   * 10)}`;
      socket.to(geoCellRoom).emit("nearby:location:update", {
        userId: socket.userId, lat, lng
      });
    }
  });

  Priority: P1

  ---
  ISSUE 9 — No API Versioning

  Why it's dangerous:
  When you ship Flutter, the mobile app is installed on user devices. You
  cannot force-upgrade all users simultaneously. You will have app store
  review delays (2–7 days for iOS). If you change an API response shape —
  rename a field, restructure a nested object, remove a field — you break
  every v1 mobile client that hasn't updated.

  Without versioning, you face the choice between: (a) never making breaking
   changes (impossible), (b) coordinating simultaneous app store release +
  backend deploy (unreliable), or (c) breaking your mobile users.

  Migration plan:

  // routes/index.js — add versioned prefix
  rootRouter.use("/v1/user", userRouter);
  rootRouter.use("/v1/owner", ownerRouter);
  rootRouter.use("/v1/admin", adminRouter);
  // ... etc

  // Keep unversioned routes for web (which you control):
  rootRouter.use("/user", userRouter); // redirect or alias

  // Client sends header for version negotiation:
  // X-API-Version: 1 (or use URL versioning for REST purity)

  Recommended approach — URL path versioning (most explicit, easiest to
  debug):
  /api/v1/user/profile
  /api/v2/user/profile  ← breaking change, only Flutter 2.0+ uses this

  Header-based versioning (cleaner URLs, harder to cache/debug):
  GET /api/user/profile
  X-API-Version: 2

  For Kridaz, use URL path versioning. It's explicit, Swagger-documentable,
  and allows Cloudflare to cache by URL path differently per version.

  Migration sequence:
  1. Add /api/v1/ prefix to all routes (1 day)
  2. Update React frontend to use /api/v1/ (1 day, can be env var)
  3. Deploy — web works unchanged
  4. Build Flutter against /api/v1/
  5. When you need a breaking change: add /api/v2/ endpoint, keep /api/v1/
  alive for 6 months, deprecation header on v1 responses

  Priority: P1 — Must be done before Flutter launch.

  ---
  ISSUE 10 — MockRedis Silently Breaks BullMQ in Development

  Why it's dangerous:
  When Redis is unreachable locally, createRedisClient returns a MockRedis
  instance. MockRedis is passed to BullMQ as the connection. BullMQ
  internally calls methods that MockRedis doesn't implement (like xadd,
  xread, stream commands). BullMQ silently fails to process jobs. Developers
   think notification queues work fine. They don't. Bugs that only exist in
  the queue path are invisible in development.

  What happens:
  - A booking is created. notificationQueue.add('BOOKING_CONFIRMED', ...)
  returns successfully (MockRedis pretends to work). The notification worker
   does nothing. Developer sees no error. QA misses it. Production has
  broken payment confirmation emails.

  Solution:
  // config/redis.js — fail loud in development instead of falling back

  function createRedisClient(name, url, isBullMQ = false) {
    if (!isRedisAvailable) {
      if (isBullMQ) {
        // BullMQ CANNOT work without real Redis. Fail hard.
        logger.error(`[REDIS] FATAL: BullMQ requires real Redis. Queue
  "${name}" will not function.`);
        logger.error('[REDIS] Start Redis locally: docker run -d -p
  6379:6379 redis:7-alpine');
        // Return a proxy that throws on any queue operation
        return new Proxy({}, {
          get: () => () => { throw new Error(`BullMQ requires real Redis.
  Start Redis locally.`); }
        });
      }
      logger.warn(`[REDIS] Redis offline. Using MockRedis for "${name}"
  (non-queue use only).`);
      return new MockRedis(name);
    }
    // ... existing logic
  }

  Also: add to README and onboarding docs:
  # Required for development — add to docker-compose.yml
  services:
    redis:
      image: redis:7-alpine
      ports:
        - "6379:6379"
      volumes:
        - redis_data:/data
      command: redis-server --appendonly yes

  Priority: P2

  ---
  PART II: CHECKLISTS

  ---
  Launch Readiness Checklist

  SECURITY
  [ ] Helmet applied with CSP, HSTS, X-Frame-Options
  [ ] All cookies: HttpOnly, Secure, SameSite=Strict
  [ ] CORS: exact origin whitelist, no wildcards
  [ ] Rate limiting tested under load
  [ ] Refresh token rotation implemented
  [ ] Token family revocation on reuse detection
  [ ] File upload: MIME type validation + size limits
  [ ] No secrets in git history (git-secrets scan)
  [ ] Dependency audit: pnpm audit --prod, no critical CVEs
  [ ] Mongoose removed if unused
  [ ] SQL injection: all raw queries use parameterized form

  RELIABILITY
  [ ] Health check reports correct DB (PostgreSQL, not Mongoose)
  [ ] Health check returns 503 when DB/Redis down
  [ ] BullMQ dead-letter queues configured
  [ ] All queue jobs have retry limits + exponential backoff
  [ ] Settlement worker has idempotency keys
  [ ] Cron jobs have distributed locks (prevent multi-instance
  double-execution)
  [ ] Scoring lock is atomic (SET NX) not check-then-set

  PERFORMANCE
  [ ] redis.keys() replaced with SCAN everywhere
  [ ] Online user broadcast sends count, not array
  [ ] Location significance threshold (50m minimum move)
  [ ] Pagination on all list endpoints verified
  [ ] Prisma N+1 queries audited (use include/select)
  [ ] No unbounded findMany() calls

  OBSERVABILITY
  [ ] Sentry DSN configured for production
  [ ] Prometheus metrics endpoint protected (METRICS_TOKEN)
  [ ] Winston log files rotating correctly
  [ ] Request ID propagated through all logs (already have
  AsyncLocalStorage)
  [ ] Structured log format (JSON) for log aggregation

  INFRASTRUCTURE
  [ ] DATABASE_URL has connection pool limit (e.g., ?connection_limit=10)
  [ ] Redis maxmemory set with eviction policy (allkeys-lru)
  [ ] Render auto-deploy from main branch configured
  [ ] Environment variables: production values set, no defaults leaking
  [ ] TLS certificates valid (Render handles this, verify)
  [ ] Cloudflare in front of Render (DDoS protection)

  API
  [ ] API versioning (/v1/) deployed
  [ ] Swagger docs accessible (DOCS_TOKEN protected)
  [ ] All critical endpoints have integration tests
  [ ] Response compression enabled (compression middleware)

  ---
  Production Hardening Checklist

  DATABASE
  [ ] PostgreSQL: connection_limit in DATABASE_URL
  [ ] PostgreSQL: statement_timeout = 30000 (30s max query time)
  [ ] Prisma: log slow queries (event: 'query', threshold: 1000ms)
  [ ] All foreign keys have indexes
  [ ] Composite indexes on hot query patterns
  [ ] VACUUM ANALYZE scheduled weekly
  [ ] Read replica for analytics queries

  REDIS
  [ ] maxmemory configured (e.g., 512mb for starter)
  [ ] maxmemory-policy = allkeys-lru
  [ ] Redis persistence: AOF enabled for presence/session data
  [ ] Redis keyspace notifications disabled (they add overhead)
  [ ] Connection pool sizing appropriate for workload
  [ ] Separate Redis instance for BullMQ (optional, high-load)

  SOCKET.IO
  [ ] pingTimeout/pingInterval tuned for mobile (mobile networks drop)
  [ ] maxHttpBufferSize limited (prevent large payload attacks)
  [ ] Per-socket event rate limiting
  [ ] Disconnect cleanup verified across all Redis keys

  SECURITY HEADERS (post-Helmet)
  [ ] CSP nonce rotation for inline scripts
  [ ] HSTS preload submission (hstspreload.org)
  [ ] Subresource integrity for CDN assets
  [ ] Cloudflare WAF rules: block SQLi, XSS patterns
  [ ] Cloudflare bot detection enabled

  PAYMENTS
  [ ] Razorpay webhook signature verification present (it is)
  [ ] Webhook idempotency: check if payment already processed
  [ ] Wallet operations: all in Prisma transactions
  [ ] Settlement worker: idempotency key per settlement run
  [ ] Dispute resolution: audit trail for every state change

  MEDIA
  [ ] Upload size limits enforced by Multer + Cloudinary/R2
  [ ] MIME type validation (not just extension)
  [ ] Video transcoding timeout: kill hung FFmpeg after N minutes
  [ ] R2 bucket: block public write access
  [ ] Cloudinary: restrict upload presets

  COMPLIANCE
  [ ] Privacy policy: what data is stored, for how long
  [ ] Data retention: delete inactive accounts after X months
  [ ] Right to erasure: user account deletion removes all PII
  [ ] GDPR/IT-PDPA: Indian Personal Data Protection Act 2023 compliance

  ---
  Scaling Roadmap

  PHASE 1: 0 → 10k users (Now → Month 3)
  - Fix all P0/P1 issues above
  - Add compression middleware
  - Add /api/v1/ prefix
  - Add pg_stat_statements to PostgreSQL
  - Set up Grafana + Prometheus on a $5 VPS
  - Add GitHub Actions CI
  - Single Render web service + single worker

  PHASE 2: 10k → 50k users (Month 3 → 6)
  - Add Render's managed PostgreSQL read replica
  - Move session/presence Redis to dedicated instance
  - Implement geo-cell rooms for location broadcasts
  - Add CDN layer (Cloudflare) in front of Render
  - Horizontal scale: 2x web service instances (Redis adapter handles this)
  - Add BullMQ flow producer for dependent job chains
  - Implement structured API response pagination audit

  PHASE 3: 50k → 100k users (Month 6 → 9)
  - Extract media worker to dedicated scaled worker pool
  - Add connection pooler (PgBouncer or Supabase pooler) in front of
  PostgreSQL
  - Redis cluster or Redis Sentinel (not Redis Cluster — BullMQ has issues
  with cluster)
  - Add Kafka for high-throughput events (location, analytics)
  - Implement read-through cache for turf listings
  - Add Edge caching (Cloudflare Cache Rules) for public turf pages

  PHASE 4: 100k+ users (Month 9 → 12)
  - Evaluate PostgreSQL → Citus (sharded PostgreSQL) for User/Booking tables
  - Separate PostgreSQL databases per domain (payments DB, social DB)
  - Real-time presence on dedicated service (Presence microservice)
  - Geolocation on dedicated service with Redis Cluster
  - Add ElasticSearch for full-text search (turf search, player search)
  - Kubernetes on GKE/EKS — Render won't scale cost-effectively beyond this

  ---
  Mobile Backend Readiness Checklist

  AUTH
  [ ] Refresh tokens returned in response body (not just cookie) — mobile
  can't use HttpOnly cookies easily
  [ ] OR: implement token store that works with Flutter's
  flutter_secure_storage
  [ ] Apple Sign-In support (required for iOS App Store if Google OAuth
  exists)
  [ ] Phone OTP login fully tested on mobile network conditions
  [ ] Biometric auth integration (device-level, not backend concern but
  document it)
  [ ] App version enforcement endpoint: GET /api/app/version → { minVersion,
   latestVersion }

  API CONTRACT
  [ ] All list endpoints: cursor-based or offset pagination with limit caps
  [ ] All endpoints: gzip/br compression enabled
  [ ] Image URLs: include width/height variants (Cloudinary transforms)
  [ ] Timestamps: all as ISO 8601 with timezone
  [ ] Error responses: consistent { success, message, code } structure
  [ ] Null vs absent: consistent (mobile parsers differ)

  PUSH NOTIFICATIONS
  [ ] Firebase Cloud Messaging (FCM) device token storage
  [ ] APNs certificate/key for iOS
  [ ] Notification preferences: per-type opt-out in DB (already have
  notificationPreferences JSON field)
  [ ] Background notification (data-only) vs foreground notification
  payloads defined
  [ ] Deep link payloads in notification body

  REALTIME
  [ ] Socket.IO client 4.x works with Flutter via socket_io_client package
  [ ] Reconnection strategy: exponential backoff configured on server
  [ ] Offline message queue: store messages for offline users, deliver on
  reconnect
  [ ] Socket auth: pass JWT in auth handshake (not just after connection)

  PERFORMANCE
  [ ] Response payload size audit — mobile on 3G needs <50KB per screen
  [ ] Image lazy loading via Cloudinary transformation URLs
  [ ] Remove unused fields from responses (use Prisma select, not select *)

  PLATFORM
  [ ] Android minimum SDK defined (recommend API 26 / Android 8.0)
  [ ] iOS minimum version defined (recommend iOS 14+)
  [ ] Deep linking: Universal Links (iOS) + App Links (Android) configured
  [ ] App store privacy manifest (iOS 17+) for API usage

  ---
  PART III: DEEP SYSTEM EVALUATIONS

  ---
  Redis Usage Evaluation

  Current Redis key namespace (reconstructed from code):
  kridaz:online:users           SET    — online user IDs (presence)
  kridaz:geo:online             ZSET   — geospatial user locations
  kridaz:location:{userId}      STRING — last known lat/lng JSON, 5min TTL
  kridaz:scoring_lock:{matchId} STRING — scoring distributed lock
  kridaz:presence:broadcast:lock STRING — presence broadcast lock
  kridaz:usernames:bloom        SET    — all usernames for fast lookup
  kridaz:reels:interactions:bloom SET  — reel interaction dedup
  kridaz:otp:blacklist:bloom    SET    — OTP spam blacklist
  blacklist:otp:{identifier}    STRING — TTL-based OTP block (5min)
  cache:tags:*                  SET    — cache invalidation tags
  rec:grounds:*                 STRING — recommendation cache (10min TTL)
  ratelimit:*                   STRING — express-rate-limit keys
  bullmq:*                      STREAM — BullMQ internals
  socket.io:*                   HASH   — Socket.IO Redis adapter internals

  Problems:
  1. No key expiry on kridaz:usernames:bloom — grows forever, never evicted
  2. No expiry on kridaz:reels:interactions:bloom — same issue
  3. kridaz:online:users has 24h expiry but is refreshed on every join —
  could accumulate stale IDs if cleanup code fails
  4. Rate limit keys accumulate until they expire naturally — acceptable but
   adds up

  Memory estimation at 100k users:
  kridaz:online:users: 10k concurrent × 36 bytes (UUID) = ~360KB
  kridaz:geo:online: 10k × ~50 bytes = ~500KB
  kridaz:location:*: 10k × ~100 bytes JSON × 5min TTL = ~1MB
  kridaz:usernames:bloom: 100k × 12 bytes avg = ~1.2MB
  kridaz:reels:interactions:bloom: 100k users × 50 reels × 3 types = ~18MB
  (!)
  Rate limit keys: 100k IPs × 15min window = ~5MB
  BullMQ internals: depends on queue depth
  Socket.IO adapter: O(rooms × sockets) ≈ 5–20MB
  TOTAL ESTIMATE: ~30–50MB for pure application data

  Recommendation for Redis configuration:
  maxmemory 512mb
  maxmemory-policy allkeys-lru
  # For production on Render's Redis: ensure these are set
  save ""              # disable RDB snapshots (use AOF instead)
  appendonly yes       # AOF for durability
  appendfsync everysec # Balance between durability and performance

  Redis Optimization Strategy:

  1. Separate BullMQ Redis from application Redis — BullMQ's stream
  operations are write-heavy and can saturate a shared Redis instance. Use
  two Redis URLs.
  2. Use Redis pipelines for batch operations — currently each socket
  presence update does 3–4 individual Redis commands. Pipeline them:
  // Instead of:
  await redis.sadd('kridaz:online:users', userId);
  await redis.expire('kridaz:online:users', 86400);
  await redis.geoadd('kridaz:geo:online', lng, lat, userId);

  // Use pipeline:
  const pipeline = redis.pipeline();
  pipeline.sadd('kridaz:online:users', userId);
  pipeline.expire('kridaz:online:users', 86400);
  pipeline.geoadd('kridaz:geo:online', lng, lat, userId);
  await pipeline.exec();

  3. Evict interaction bloom aggressively — add TTL:
  await redisClient.sadd(REELS_INTERACTION_KEY, interactionKey);
  await redisClient.expire(REELS_INTERACTION_KEY, 86400); // 24h

  4. Use GEOSEARCH instead of deprecated GEORADIUS:
  // GEORADIUS deprecated in Redis 6.2
  const nearby = await redis.call(
    'GEOSEARCH', 'kridaz:geo:online',
    'FROMLONLAT', lng, lat,
    'BYRADIUS', 5, 'km',
    'ASC', 'COUNT', 50
  );

  ---
  PostgreSQL Optimization Strategy

  Critical indexes to add immediately:

  -- Booking queries (most frequent reads)
  CREATE INDEX idx_booking_turf_date ON "Booking"("turfId", "date",
  "status");
  CREATE INDEX idx_booking_user_status ON "Booking"("userId", "status");
  CREATE INDEX idx_booking_status_date ON "Booking"("status", "date") WHERE
  "status" IN ('pending', 'confirmed');

  -- Geospatial user discovery (core feature)
  CREATE INDEX idx_user_geopoint ON "User" USING GIST("geoPoint");
  CREATE INDEX idx_user_city_state ON "User"("city", "state") WHERE "status"
   = 'active';

  -- Social feed queries
  CREATE INDEX idx_post_user_created ON "Post"("userId", "createdAt" DESC);
  CREATE INDEX idx_reel_created ON "Reel"("createdAt" DESC) WHERE "status" =
   'ready';
  CREATE INDEX idx_story_user_expires ON "Story"("userId", "expiresAt")
  WHERE "expiresAt" > NOW();

  -- Chat/messaging (latency-critical)
  CREATE INDEX idx_message_chat_created ON "Message"("chatId", "createdAt"
  DESC);
  CREATE INDEX idx_chat_participant_user ON "ChatParticipant"("userId");

  -- Hosted games discovery
  CREATE INDEX idx_hostedgame_status_sport ON "HostedGame"("status",
  "sportType", "scheduledAt");

  -- Notification delivery
  CREATE INDEX idx_notification_user_read ON "Notification"("userId",
  "isRead", "createdAt" DESC);

  -- User relationship (follow graph)
  CREATE INDEX idx_userrelationship_follower ON
  "UserRelationship"("followerId");
  CREATE INDEX idx_userrelationship_following ON
  "UserRelationship"("followingId");

  Prisma slow query logging:
  // config/prisma.js
  import { PrismaClient } from '@prisma/client';

  export const prisma = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'warn' },
      { emit: 'event', level: 'error' },
    ],
  });

  // Log slow queries only (>500ms)
  prisma.$on('query', (e) => {
    if (e.duration > 500) {
      logger.warn(`[PRISMA SLOW] ${e.duration}ms → ${e.query.substring(0,
  200)}`);
    }
  });

  Connection pooling — critical for Render:
  DATABASE_URL="postgresql://user:pass@host/db?connection_limit=10&pool_time
  out=20&statement_timeout=30000"

  Render's PostgreSQL instances have a hard connection limit. With 2 web
  service instances + 1 worker, and each with 10 connections: 30 total.
  Render Postgres Starter allows 25 connections. You're already at the
  limit. Add PgBouncer (Supabase provides this free):
  # Connection string via PgBouncer in transaction pooling mode
  DATABASE_URL="postgresql://user:pass@pgbouncer:6543/db?pgbouncer=true&conn
  ection_limit=5"

  The N+1 Problem — audit every controller:
  // DANGEROUS: N+1 — fetches 20 bookings, then 20 separate user queries
  const bookings = await prisma.booking.findMany({ take: 20 });
  const users = await Promise.all(bookings.map(b => prisma.user.findUnique({
   where: { id: b.userId } })));

  // CORRECT: single JOIN
  const bookings = await prisma.booking.findMany({
    take: 20,
    include: {
      user: { select: { id: true, name: true, profilePicture: true } },
      turf: { select: { id: true, name: true, location: true } },
    }
  });

  Partial indexes for common filtered queries:
  -- Only index active users (reduces index size significantly)
  CREATE INDEX idx_user_active_location ON "User"(latitude, longitude)
    WHERE "status" = 'active' AND latitude IS NOT NULL;

  -- Only index pending bookings (these are queried most frequently for
  scheduling)
  CREATE INDEX idx_booking_pending ON "Booking"("turfId", "startTime")
    WHERE "status" = 'pending';

  ---
  Socket.IO Scale Strategy

  Current architecture limitations:
  - Single socket namespace for everything (chat, presence, scoring,
  location)
  - No per-socket message rate limiting
  - No socket authentication verification (socket.userId set from unverified
   client data)

  Socket authentication fix (critical):
  // config/socket.js — authenticate socket on handshake, not on 'setup'
  event
  import jwt from 'jsonwebtoken';

  io.use(async (socket, next) => {
    try {
      // Auth token from handshake (more secure than 'setup' event)
      const token = socket.handshake.auth?.token ||
                    socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        // Allow unauthenticated connections for public features
  (spectators)
        socket.userId = null;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new Error('TOKEN_EXPIRED'));
      }
      next(new Error('UNAUTHORIZED'));
    }
  });

  // Remove the 'setup' event — socket.userId is now set on connection
  // 'setup' was a trust-me-I'm-this-user anti-pattern:
  // socket.on("setup", (userData) => { socket.userId = userData.id; }) ←
  WRONG
  // Any client can send any userId in the 'setup' event. Verified JWT is
  required.

  Per-socket rate limiting:
  // config/socket.js — add per-socket event rate limiter
  const socketRateLimit = new Map(); // socketId → { count, resetAt }

  const isSocketRateLimited = (socketId, maxPerSecond = 20) => {
    const now = Date.now();
    const entry = socketRateLimit.get(socketId) || { count: 0, resetAt: now
  + 1000 };

    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + 1000;
    }

    entry.count++;
    socketRateLimit.set(socketId, entry);

    return entry.count > maxPerSecond;
  };

  io.on("connection", (socket) => {
    // Apply to high-frequency events
    socket.use((packet, next) => {
      const [eventName] = packet;
      const highFrequencyEvents = ['location:update', 'typing', 'new
  message'];

      if (highFrequencyEvents.includes(eventName)) {
        if (isSocketRateLimited(socket.id, 10)) {
          logger.warn(`[SOCKET] Rate limit hit: ${socket.id} on
  ${eventName}`);
          return; // drop the event
        }
      }
      next();
    });
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    socketRateLimit.delete(socket.id);
  });

  Namespace separation for scale:
  // Separate namespaces for different concerns — allows independent scaling
  const chatNS = io.of('/chat');
  const scoringNS = io.of('/scoring');
  const locationNS = io.of('/location');
  const presenceNS = io.of('/presence');

  // Each namespace gets its own Redis adapter channels
  // Scoring can be scaled separately without affecting chat

  At 10k concurrent users — Socket.IO memory math:
  - Each socket: ~10KB memory (socket object + buffers)
  - 10k sockets: 100MB just for sockets
  - Each socket subscribed to 5 rooms avg: 5 × 10k = 50k room memberships
  - Redis adapter syncs room membership across instances: ~5MB Redis
  overhead per instance
  - Recommendation: 3 web instances, max 4000 sockets each = 12k total cap
  per cluster

  ---
  Caching Strategy

  Multi-layer caching architecture:

  L1: In-process cache (node-cache, 30s TTL)
      → Hot path data: turf pricing, sport types enum, feature flags
      → Per-instance, no consistency guarantee
      → Use only for truly immutable or low-consistency data

  L2: Redis cache (varies TTL)
      → User profiles: 5min TTL (invalidated on profile update)
      → Turf listings: 10min TTL (invalidated on turf update)
      → Ground recommendations: 10min TTL (user + location keyed)
      → Booking slot availability: 1min TTL (booking creates invalidate)
      → Social feed: 2min TTL (events invalidate)

  L3: CDN cache (Cloudflare)
      → Public turf pages: 1h TTL
      → Static assets: 1 year TTL
      → Reel thumbnails: 7 day TTL
      → Profile images: 1 day TTL

  L4: Database (source of truth)
      → All writes go here first
      → Cache is always populated from DB on miss

  Cache warming strategy:
  // On server startup, warm the most-accessed caches
  // utils/cacheWarmer.js
  export const warmCriticalCaches = async () => {
    // Top 50 turfs by booking count (most accessed)
    const topTurfs = await prisma.turf.findMany({
      where: { isActive: true, status: 'approved' },
      orderBy: { bookingCount: 'desc' },
      take: 50,
      include: { owner: { select: { businessName: true } } }
    });

    const pipeline = redis.pipeline();
    for (const turf of topTurfs) {
      pipeline.set(`cache:turf:${turf.id}`, JSON.stringify(turf), 'EX',
  600);
    }
    await pipeline.exec();
    logger.info(`[CACHE] Warmed ${topTurfs.length} turf entries.`);
  };

  ---
  BullMQ Architecture & Dead-Letter Strategy

  Current queue inventory:
  - media — video transcoding (FFmpeg HLS)
  - notification — push/email/WhatsApp
  - settlement — wallet settlement

  Missing: dead-letter queues and proper retry configuration.

  // queues/notification.queue.js — add DLQ
  import { Queue, QueueEvents } from 'bullmq';
  import { bullmqConnection } from '../config/redis.js';

  export const notificationQueue = new Queue('notifications', {
    connection: bullmqConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,      // 2s, 4s, 8s
      },
      removeOnComplete: { count: 100 },   // Keep last 100 completed
      removeOnFail: { count: 500 },       // Keep last 500 failed for
  debugging
    },
  });

  // Move permanently failed jobs to a dead-letter queue
  const notificationEvents = new QueueEvents('notifications', {
    connection: bullmqConnection
  });

  export const dlqNotification = new Queue('notifications:dlq', {
    connection: bullmqConnection,
  });

  notificationEvents.on('failed', async ({ jobId, failedReason, prev }) => {
    // If this was the final attempt
    const job = await notificationQueue.getJob(jobId);
    if (job && job.attemptsMade >= job.opts.attempts) {
      logger.error(`[DLQ] Job ${jobId} failed permanently:
  ${failedReason}`);

      // Move to DLQ with failure context
      await dlqNotification.add('failed_notification', {
        originalJob: job.data,
        failedReason,
        attemptsMade: job.attemptsMade,
        failedAt: new Date().toISOString(),
      });

      // Alert: permanent failure in notification queue
      // Sentry.captureMessage('Notification job permanently failed', {
  extra: job.data });
    }
  });

  Media queue — stale job cleanup:
  // Add to server.js startup
  // Already partially done for media queue — formalize:
  export const cleanStaleJobs = async (queue, maxAge = 24 * 60 * 60 * 1000)
  => {
    const failedJobs = await queue.getFailed(0, 500);
    const stale = failedJobs.filter(j => Date.now() - j.timestamp > maxAge);

    logger.info(`[QUEUE] Removing ${stale.length} stale failed jobs from
  ${queue.name}`);
    await Promise.all(stale.map(j => j.remove()));
  };

  Worker starvation prevention:
  // queues/media.queue.js — limit concurrency to prevent FFmpeg OOM
  const mediaWorker = new Worker('media', processor, {
    connection: bullmqConnection,
    concurrency: parseInt(process.env.MEDIA_WORKER_CONCURRENCY) || 2, // 2
  concurrent FFmpeg processes max
    limiter: {
      max: 10,        // Max 10 jobs per duration
      duration: 60000, // Per minute
    },
  });

  ---
  PART IV: FAILURE PREDICTION BY SCALE

  ---
  At 1,000 Concurrent Users

  What breaks first:
  1. redis.keys() pattern scan — with 500k total Redis keys, any cache
  invalidation triggers a 50–100ms Redis block. At 1k users generating cache
   invalidations, this creates 10–20 blocks/second. Rate limiter starts
  miscounting. OTP protection bypassed.
  2. Online user broadcast — 1000 users × 1000-element array × 5
  connects/sec = 5 million data points/sec through Socket.IO. Node.js event
  loop hits 80% utilization. API response times spike to 2–5s.
  3. PostgreSQL connection exhaustion — Render Starter PostgreSQL allows 25
  connections. 2 web instances × 10 pool connections = 20. Worker uses 5
  more = 25. At 1k concurrent users with slow queries, connections queue up.
   pool_timeout triggers. Users get 500 errors on booking/payment flows.

  ETA to first outage: ~500–800 concurrent users.

  ---
  At 10,000 Concurrent Users

  What breaks:
  1. Socket.IO memory — 10k sockets × 10KB = 100MB just for sockets.
  Combined with Node.js overhead, a single Render web instance (512MB RAM on
   Starter) OOMs. Rolling restarts. Reconnection storms.
  2. Location broadcast fan-out — 1000 active location updaters × 30 nearby
  users each × 1 update/3sec = 10,000 socket emissions/sec just for
  location. Combined with chat, presence, and scoring events — event loop
  saturation.
  3. seedUsernameBloom startup — 100k users × startup = 100k username load.
  30-second startup delay. Render health check timeout. Restart loop.
  4. Prisma connection pool exhaustion — need PgBouncer at this scale. 20+
  application connections barely cover 10k users if queries are slow.
  5. BullMQ notification queue depth — 10k users generating events
  (bookings, game joins, follows) = notification queue depth of thousands.
  With 1 worker and 1 concurrency, notifications arrive 5+ minutes late.
  Users think app is broken.

  ETA: first catastrophic failure at ~5,000–8,000 concurrent users without
  fixes.

  ---
  At 100,000 Concurrent Users

  What breaks:
  1. Single PostgreSQL instance — at 100k users, even with PgBouncer and
  read replicas, write throughput on a single PostgreSQL primary becomes the
   bottleneck. Especially wallet transactions (which require SERIALIZABLE
  isolation). Payment throughput caps at ~200 TPS on a single node.
  2. Redis single-instance — 100k concurrent users generate ~50MB/min of
  Redis writes. Single-threaded Redis CPU at 100%. All dependent systems
  degrade.
  3. Render platform limits — Render's largest web service instance is 4
  vCPU / 8GB RAM. Socket.IO with 100k concurrent connections requires
  multiple instances. With Redis adapter, horizontal scaling works — but
  Render's pricing at this scale exceeds $1000/month. Kubernetes on GKE/EKS
  becomes cost-effective.
  4. Recommendation service 200ms timeout — ML inference at 100k users
  becomes a hot path. 200ms per recommendation request × 100k users opening
  the app = 100k simultaneous ML service calls. The FastAPI ML service
  becomes the bottleneck. Need a dedicated recommendation cache layer and
  precomputed recommendations.
  5. Geospatial GEORADIUS — at 100k online users, the geo:online sorted set
  has 100k members. GEORADIUS of a 5km radius in a dense city returns
  thousands of results. Each location update triggers this. GEORADIUS on
  100k members takes 2–5ms. At 10k location updates/sec, Redis GEORADIUS
  alone consumes 20–50ms of Redis CPU per second = Redis saturation.

  Solution at 100k: move geolocation to a dedicated service with PostGIS
  direct queries (not Redis geo) with a 30-second location update interval,
  not real-time.

  ---
  At 1,000,000 Users (Design for the future)

  Architectural changes required:
  - PostgreSQL sharding by user geography (India North / South / West)
  - Separate PostgreSQL databases: kridaz_social, kridaz_payments,
  kridaz_bookings
  - Redis Cluster (multiple shards) with separate cluster for pub/sub vs.
  data
  - Kafka for event stream (booking events, social events, location events)
  - Dedicated microservices: Presence, Geolocation, Notification, Chat,
  Media
  - CDN-first architecture: all reads from Cloudflare cache, database only
  for writes
  - ElasticSearch for player/turf search (PostgreSQL full-text won't scale)
  - Dedicated Socket.IO cluster behind Nginx (not Render's single-instance)

  ---
  PART V: ARCHITECTURAL SMELLS & ANTI-PATTERNS

  ---
  Anti-pattern 1: Business logic in socket event handlers
  // socket.js — PostGIS UPDATE inside a socket event handler ← WRONG
  await prisma.$executeRaw`
    UPDATE "User" SET "geoPoint" = ST_GeomFromText(...) WHERE id =
  ${socket.userId}
  `;
  Socket handlers should be thin event routers. Business logic (DB writes,
  validation, cache updates) belongs in services. A socket error in the DB
  call silently fails with no HTTP error response, no request ID, no
  structured logging.

  Anti-pattern 2: Trust-on-setup socket authentication
  socket.on("setup", async (userData) => {
    socket.userId = userData?.id; // ← TRUSTS CLIENT-PROVIDED ID
  });
  Any socket client can claim to be any userId. Combined with the scoring
  lock — any user could claim to be user ID admin-123 and take locks on any
  match.

  Anti-pattern 3: Unconstrained findMany in controllers
  Any prisma.findMany() without a take limit is a potential full table scan
  returned to the client. At 1M records, this returns a 100MB JSON response
  and OOMs the Node.js process.

  Anti-pattern 4: Wallet operations without row-level locking
  // wallet.service.js — without seeing the code, predict the issue:
  // User A and User B simultaneously trigger wallet deduction
  // Both read balance = 500
  // Both deduct 300
  // Both write balance = 200
  // Final balance: 200 instead of -100 (race condition)
  All wallet balance updates MUST use UPDATE "Wallet" SET balance = balance
  - $1 WHERE id = $2 AND balance >= $1 RETURNING balance — never
  read-modify-write.

  Anti-pattern 5: Scattered raw SQL
  PostGIS queries are in socket.js, not in a repository layer. When the
  schema changes, these queries silently break at runtime, not at compile
  time.

  Anti-pattern 6: No request correlation IDs
  AsyncLocalStorage is set up for request-scoped metadata but there's no
  evidence that a requestId header is read or generated and propagated
  through all logs. When debugging a production incident across 2 instances
  and 3 services, you need requestId to trace a single request.

  // middleware/requestId.middleware.js
  import { v4 as uuidv4 } from 'uuid';
  import { logStorage } from '../utils/logger.js';

  export const requestId = (req, res, next) => {
    const id = req.headers['x-request-id'] || uuidv4();
    req.requestId = id;
    res.setHeader('x-request-id', id);

    // Store in AsyncLocalStorage so all logger calls in this request
  include it
    logStorage.run({ requestId: id }, next);
  };

  ---
  PART VI: RACE CONDITIONS & CONSISTENCY PROBLEMS

  ---
  Race 1: Booking slot double-booking
  Two users simultaneously book the same turf slot for the same time:
  // Without optimistic locking or SELECT FOR UPDATE:
  // User A: check slot availability → available
  // User B: check slot availability → available  (same slot, simultaneous)
  // User A: create booking → OK
  // User B: create booking → OK (double-booked!)

  Fix: database-level unique constraint + SELECT FOR UPDATE:
  // In a Prisma transaction with serializable isolation
  await prisma.$transaction(async (tx) => {
    // Lock the slot row
    await tx.$executeRaw`
      SELECT id FROM "TurfSlot"
      WHERE id = ${slotId} AND "isBooked" = false
      FOR UPDATE NOWAIT
    `;

    // Check again inside the lock
    const slot = await tx.turfSlot.findUnique({ where: { id: slotId } });
    if (slot.isBooked) throw new Error('SLOT_TAKEN');

    // Create booking + mark slot
    const booking = await tx.booking.create({ data: { slotId, userId, ... }
  });
    await tx.turfSlot.update({ where: { id: slotId }, data: { isBooked: true
   } });

    return booking;
  }, { isolationLevel: 'Serializable' });

  Race 2: Wallet double-spend
  User triggers two simultaneous booking payments:
  // WRONG: read-modify-write
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (wallet.balance < amount) throw new Error('Insufficient');
  await prisma.wallet.update({ data: { balance: wallet.balance - amount }
  }); // race!

  // CORRECT: atomic conditional update
  const result = await prisma.$executeRaw`
    UPDATE "Wallet"
    SET balance = balance - ${amount}
    WHERE "userId" = ${userId} AND balance >= ${amount}
    RETURNING balance
  `;
  if (result.count === 0) throw new Error('INSUFFICIENT_FUNDS');

  Race 3: OTP bypass
  Current OTP flow:
  1. User requests OTP → stored in DB + Redis blacklist checked
  2. User submits OTP → verified against DB
  3. If valid → issue JWT + mark OTP used

  If two simultaneous OTP verifications are submitted before the first
  completes marking OTP as used: both succeed. Two JWTs issued. This is rare
   but exploitable with automated tooling.

  Fix: atomic OTP deletion:
  // Instead of find-then-delete, use atomic delete with WHERE
  const deleted = await prisma.oTP.deleteMany({
    where: {
      userId,
      emailOtp: submittedOtp,
      expiresAt: { gt: new Date() }
    }
  });

  if (deleted.count === 0) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }
  // OTP is consumed — safe to issue JWT

  ---
  PART VII: MONOLITH VS MICROSERVICES ANALYSIS

  ---
  Keep the modular monolith until 50k users. This is not a conservative
  recommendation — it's what Shopify, Stack Overflow, and Basecamp run at
  millions of users. The cost of premature microservices extraction is 10x:
  - Network overhead between services
  - Distributed tracing requirement
  - Separate CI/CD pipelines
  - Service mesh complexity (Istio, Linkerd)
  - Data consistency challenges (two-phase commit, sagas)

  When to start extracting (at 50k+ users, with evidence of bottleneck):

  Extract first — Presence Service:
  - Isolated concern: online/offline tracking
  - High write throughput
  - No complex joins to other domains
  - Clean interface: isOnline(userId), setOnline(userId), getOnlineCount()

  Extract second — Notification Service:
  - Already partially isolated in BullMQ queue
  - Independent scaling requirement
  - Can be a simple Express service or a Go service
  - Input: events → Output: push/email/WhatsApp

  Extract third — Media Processing:
  - Already separated as a worker service
  - FFmpeg is CPU-intensive and isolated
  - Can become a standalone service with its own queue consumer

  Do NOT extract early:
  - Booking + Payment (tightly coupled, ACID required)
  - Auth (security-critical, keep in one place)
  - Chat (depends on presence, complex state)
  - Scoring (real-time, depends on game state)

  ---
  Should You Use Kafka/NATS?

  Not yet. At current scale: No.

  BullMQ with Redis handles your current throughput. Kafka's operational
  overhead (ZooKeeper/KRaft, consumer groups, partition management, schema
  registry) adds weeks of setup and ongoing maintenance for a team that
  doesn't yet have a dedicated DevOps engineer.

  Introduce Kafka at 50k+ users when:
  - Notification queue depth consistently > 10,000
  - Location updates need to fan out to multiple consumers (analytics +
  presence + ML)
  - Audit log requires guaranteed delivery with replay capability
  - You need event sourcing for wallet/payment history

  Use NATS instead of Kafka for sports events (match scoring, live state):
  - NATS is simpler than Kafka
  - Sub-millisecond latency (Kafka is high-throughput but adds 10–100ms
  latency)
  - JetStream for persistence when needed
  - Single binary, trivial to operate

  ---
  Should You Migrate to NestJS?

  No. The ROI is negative for your current team size.

  NestJS adds:
  - Decorator-heavy boilerplate
  - DI container overhead (minor but present)
  - Steep learning curve for your existing Express developers
  - Opinionated structure that may not match your domain model

  Your current modular monolith architecture is cleaner than most NestJS
  codebases I've seen. The auto-loading module system (modules/loader.js) is
   a good pattern. The two-tier routing (actor hubs + domain modules) shows
  architectural thinking.

  Instead of NestJS migration, do this:
  1. Add TypeScript to controllers + services (not views/routes)
  2. Add repository layer (separate DB queries from business logic)
  3. Add proper DI via factory functions (no framework needed)

  ---
  Should You Migrate to TypeScript?

  Yes — but incrementally, starting with the service layer.

  Priority order:
  1. services/ directory → TypeScript first (highest business logic density)
  2. config/ → TypeScript (type safety for Redis/Prisma config)
  3. middleware/ → TypeScript (auth types, request augmentation)
  4. modules/*/validator.js → already using Zod, easy to type
  5. modules/*/controller.js → last (most code, lowest ROI per file)

  Prisma already generates TypeScript types. You're leaving this on the
  table by using JavaScript in your service layer. A Prisma type error that
  would be caught at compile time becomes a 3am production incident.

  Migration approach:
  # Enable TS in server with allowJs (gradual migration)
  # tsconfig.json in server/
  {
    "compilerOptions": {
      "allowJs": true,        # existing .js files work
      "checkJs": false,       # don't type-check existing JS
      "strict": true,         # new .ts files are strict
      "target": "ESNext",
      "module": "ESNext",
      "moduleResolution": "bundler",
      "outDir": "./dist"
    }
  }

  ---
  Should You Introduce Go Services?

  Yes — for one specific service at 100k+ users: geolocation.

  The real-time location update path is:
  1. Receive socket event
  2. Throttle check (in-memory)
  3. Haversine distance check
  4. Redis GEOADD
  5. Redis GEOSEARCH
  6. Emit to nearby sockets

  This is a hot path executing 10,000+ times/second at scale. In Node.js,
  this competes with the event loop serving HTTP requests. A Go service here
   gives:
  - 10x lower CPU usage for the same throughput
  - No GC pauses affecting socket latency
  - Can handle 100k location updates/sec on a single $20/month instance

  All other services: keep in Node.js. Don't polyglot prematurely.

  ---
  PART VIII: CI/CD ARCHITECTURE

  ---
  # .github/workflows/ci.yml
  name: CI/CD

  on:
    push:
      branches: [main, develop]
    pull_request:
      branches: [main]

  jobs:
    lint-and-type-check:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v3
          with: { version: 10 }
        - run: pnpm install --frozen-lockfile
        - run: pnpm lint
        - run: pnpm -r type-check

    test:
      runs-on: ubuntu-latest
      services:
        postgres:
          image: postgis/postgis:16-3.4
          env:
            POSTGRES_PASSWORD: testpass
            POSTGRES_DB: kridaz_test
          options: >-
            --health-cmd pg_isready
            --health-interval 10s
            --health-timeout 5s
            --health-retries 5
        redis:
          image: redis:7-alpine
          options: >-
            --health-cmd "redis-cli ping"
            --health-interval 10s
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v3
        - run: pnpm install --frozen-lockfile
        - name: Run migrations
          run: pnpm --filter server prisma migrate deploy
          env:
            DATABASE_URL:
  postgresql://postgres:testpass@localhost:5432/kridaz_test
        - name: Run tests
          run: pnpm --filter server test
          env:
            NODE_ENV: test
            DATABASE_URL:
  postgresql://postgres:testpass@localhost:5432/kridaz_test
            REDIS_URL: redis://localhost:6379
            JWT_SECRET: test_secret_min_32_chars_long_ok

    build-docker:
      runs-on: ubuntu-latest
      needs: [test]
      if: github.ref == 'refs/heads/main'
      steps:
        - uses: actions/checkout@v4
        - name: Build Docker image
          run: docker build -t kridaz-api:${{ github.sha }} .
        - name: Run container health check
          run: |
            docker run -d --name kridaz-test -p 4000:4000 \
              -e NODE_ENV=production \
              -e DATABASE_URL=${{ secrets.DATABASE_URL }} \
              kridaz-api:${{ github.sha }}
            sleep 10
            curl -f http://localhost:4000/api/health || exit 1

    deploy:
      runs-on: ubuntu-latest
      needs: [build-docker]
      if: github.ref == 'refs/heads/main'
      steps:
        - name: Deploy to Render
          run: |
            curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_API }}
            curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_WORKER }}

  Branch strategy:
  main       ← production (auto-deploy to Render)
  develop    ← staging (auto-deploy to Render staging environment)
  feature/*  ← PR → develop → review deploy (ephemeral Render instances or
  Vercel previews)
  hotfix/*   ← PR → main (bypass develop for critical fixes)

  ---
  PART IX: MONITORING & ALERTING STACK

  ---
  Current state: Sentry (errors) + Prometheus metrics exposed + Winston
  logs.
  Missing: Prometheus scraper, Grafana dashboards, alerting rules, log
  aggregation.

  Recommended stack (all open-source, $20/month total):

  Metrics:     Prometheus + Grafana (self-hosted on $5 Hetzner VPS)
  Logs:        Loki + Grafana (same VPS, or Papertrail free tier)
  Traces:      Sentry (already configured)
  Uptime:      BetterUptime or UptimeRobot (free tier)
  Alerting:    Grafana alerts → PagerDuty/Slack webhook

  Critical Grafana dashboards to build:
  1. API Health Dashboard — requests/sec, error rate, P50/P95/P99 response
  time
  2. Socket.IO Dashboard — active connections, events/sec, room sizes
  3. Database Dashboard — query duration, connection pool usage, slow
  queries
  4. Queue Dashboard — queue depths, job completion rate, DLQ depth
  5. Business KPIs — bookings/hour, payments/hour, new user signups/hour
  6. Redis Dashboard — memory usage, commands/sec, cache hit rate

  SLO definitions:
  API availability:   99.9% (43 minutes downtime/month)
  API latency P99:    <2 seconds for all endpoints
  Payment success:    >99.5% of initiated payments complete
  Notification delivery: >99% within 60 seconds
  Socket delivery:    >99.9% of chat messages delivered

  Alert thresholds:
  # Grafana alert rules
  - name: High Error Rate
    condition: error_rate > 5%  over 5 minutes
    severity: critical

  - name: API Latency Spike
    condition: p99_latency > 3s  over 5 minutes
    severity: warning

  - name: Queue Depth Alarm
    condition: notification_queue_depth > 1000
    severity: warning

  - name: PostgreSQL Connection Pool Exhaustion
    condition: active_connections > 20
    severity: critical

  - name: Redis Memory High
    condition: redis_memory_used > 400MB
    severity: warning

  - name: Socket Connection Spike
    condition: active_sockets > 8000
    severity: warning (scale trigger)

  ---
  PART X: DISASTER RECOVERY PLAN

  ---
  RTO (Recovery Time Objective):  < 30 minutes for full outage
  RPO (Recovery Point Objective): < 5 minutes of data loss

  DATABASE RECOVERY
  - Render's managed PostgreSQL: automated daily backups
  - Enable WAL archiving for point-in-time recovery
  - Test restore quarterly: spin up a test instance from backup

  REDIS RECOVERY
  - Redis is ephemeral by design for cache/presence
  - BullMQ job state is persistent (AOF enabled)
  - On Redis failure: system degrades gracefully (MockRedis fallback)
  - Recreate Redis in <5 minutes on Render

  RUNBOOK — Full Outage (database down):
  1. Check Render status page + PostgreSQL metrics
  2. If PostgreSQL unreachable: check Render dashboard for DB status
  3. If DB is healthy but API unhealthy: check connection pool exhaustion
     - Immediate: restart API instances to flush connections
     - Then: investigate slow queries causing pool starvation
  4. Notify users via status page (statuspage.io or Instatus)
  5. If data corruption: restore from backup, replay from WAL

  RUNBOOK — Redis down:
  1. System falls back to MockRedis (degraded but functional)
  2. Rate limiting disabled → risk of abuse
  3. BullMQ stops processing → notification backlog builds
  4. Immediate: provision new Redis instance
  5. Update REDIS_URL → redeploy (2 minutes on Render)

  RUNBOOK — Render platform down:
  1. Check render.com/status
  2. If extended outage: Render supports deploy to Railway/Fly.io
  3. Docker image is ready → deploy anywhere in 15 minutes

  BACKUP STRATEGY:
  - PostgreSQL: Render automated daily backup + manual weekly backup to S3
  - R2 media: Cloudflare manages redundancy
  - Cloudinary: built-in redundancy
  - Redis: Redis AOF (1s fsync) — max 1s of queue data loss
  - Code: GitHub (source of truth)

  ---
  PART XI: 30/90/180/365 DAY ROADMAP

  ---
  Days 1–30: Stabilize & Harden

  WEEK 1 — P0 fixes (deploy immediately):
    Day 1:  Add helmet() to app.js
    Day 1:  Fix health check (PostgreSQL, not Mongoose)
    Day 2:  Replace redis.keys() with SCAN
    Day 2:  Fix online user broadcast (count not array)
    Day 3:  Fix socket authentication (JWT on handshake, not 'setup')
    Day 3:  Fix scoring lock (SET NX atomic)
    Day 4:  Remove Mongoose dependency
    Day 4:  Add compression middleware
    Day 5:  Add requestId middleware + propagate through logs

  WEEK 2 — P1 fixes:
    Day 6:  Implement refresh token rotation with family tracking
    Day 7:  Add API versioning (/api/v1/)
    Day 8:  Fix location broadcast (significance threshold + geo-cells)
    Day 9:  Fix seedUsernameBloom (cursor-based, skip if seeded)
    Day 10: Add GitHub Actions CI pipeline

  WEEK 3 — Database hardening:
    Day 11: Add all recommended PostgreSQL indexes
    Day 12: Add Prisma slow query logging
    Day 13: Audit all findMany() calls for unbounded results
    Day 14: Add connection_limit + pool_timeout to DATABASE_URL
    Day 15: Set up PgBouncer (Supabase free pooler)

  WEEK 4 — Observability:
    Day 16: Set up Prometheus scraper on Hetzner VPS
    Day 17: Build Grafana dashboards (API, DB, Queue, Socket)
    Day 18: Configure Grafana alerts → Slack
    Day 19: Add BullMQ dead-letter queues
    Day 20: Add wallet double-spend protection (atomic updates)

  SUCCESS CRITERIA:
  - 0 P0 security issues
  - Health check reports correct state
  - P99 API latency < 1s on 1k concurrent
  - All critical alerts firing to Slack

  Days 31–90: Scale Preparation

  Month 2:
  - Add Redis pipelines to all high-frequency operations
  - Implement geo-cell rooms for location broadcasts
  - Add Apple Sign-In (required before iOS App Store submission)
  - Add FCM device token storage for mobile push
  - Build Flutter auth flow against /api/v1/
  - Add pagination to all list endpoints (audit + fix)
  - Add E2E tests for payment + booking critical paths
  - Implement Redis Pub/Sub for cross-instance cache invalidation

  Month 3:
  - Performance test: 5k concurrent users with k6
  - Load test booking flow: 100 concurrent bookings
  - Load test WebSocket: 5k concurrent socket connections
  - Tune PostgreSQL based on pg_stat_statements findings
  - Add CDN (Cloudflare) in front of Render
  - Set up Render staging environment
  - Document all API endpoints in Swagger (auto-generate from Zod schemas)
  - Launch Flutter MVP (auth + browse turfs + book + basic social)

  Days 91–180: Feature Velocity + Scale

  Month 4-5:
  - Extract notification service (separate process, dedicated queue)
  - Add ElasticSearch for turf + player search (replace PostgreSQL ILIKE)
  - Implement recommendation precomputation (nightly batch job → Redis)
  - Add read replica for analytics queries
  - Add proper Prisma query middleware for N+1 detection in production
  - Implement offline message delivery (store messages for offline users)
  - Add app version enforcement endpoint for Flutter

  Month 6:
  - Full TypeScript migration for services/ and config/ directories
  - Add repository layer (separate DB queries from controllers)
  - Add event bus (internal) for cross-domain events (booking created →
  notification)
  - Performance test: 25k concurrent users
  - Evaluate Kubernetes readiness (if Render cost exceeds $500/month)

  Days 181–365: Scale & Sophistication

  Month 7-9:
  - Extract Presence Service (Go or Node, dedicated Redis)
  - Add Kafka for location events + analytics stream
  - Add PostGIS query optimization for nearby player discovery
  - Add A/B testing framework (GrowthBook or custom flag service)
  - Add machine learning pipeline for personalized feed ranking
  - Implement event sourcing for wallet transaction history

  Month 10-12:
  - Kubernetes migration (GKE Autopilot)
  - Separate PostgreSQL databases per domain
  - Add ElasticSearch for full-text + geospatial hybrid search
  - Add video transcoding pipeline improvements (AWS MediaConvert)
  - International expansion: multi-region deployment
  - Add real-time analytics dashboard for venue owners
  - Launch creator monetization features

  ---
  PART XII: KUBERNETES MIGRATION READINESS

  ---
  Current state: Docker-ready (Dockerfile exists, multi-stage). Not
  K8s-ready.

  Gaps to fill before Kubernetes:
  1. Stateless application — Socket.IO Redis adapter makes this stateless ✅
  2. Health check HTTP endpoint — exists but reports wrong DB ✗ (fix first)
  3. Graceful shutdown — handle SIGTERM, drain connections, stop accepting
  new requests
  4. Configuration via env vars only — already done ✅
  5. No local file storage — media goes to Cloudinary/R2 ✅
  6. Liveness vs Readiness probes — currently single health endpoint, need
  two

  // app.js — add separate liveness and readiness probes

  // Liveness: is the process running? (K8s restarts if this fails)
  app.get('/healthz/live', (req, res) => {
    res.json({ status: 'alive', uptime: process.uptime() });
  });

  // Readiness: can this instance serve traffic? (K8s removes from LB if
  this fails)
  app.get('/healthz/ready', async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      const pong = await redis.ping();
      if (pong !== 'PONG') throw new Error('Redis not ready');
      res.json({ status: 'ready' });
    } catch (err) {
      res.status(503).json({ status: 'not ready', error: err.message });
    }
  });

  Graceful shutdown:
  // server.js — add graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`[SERVER] Received ${signal}. Starting graceful
  shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
      logger.info('[SERVER] HTTP server closed.');

      // Close Socket.IO connections gracefully
      io.close(() => {
        logger.info('[SOCKET] All sockets disconnected.');
      });

      // Close Prisma connections
      await prisma.$disconnect();
      logger.info('[DATABASE] Prisma disconnected.');

      // Close Redis connections
      await redis.quit();
      logger.info('[REDIS] Redis disconnected.');

      // Wait for BullMQ workers to finish current jobs (max 30s)
      // ... worker.close(true) for each worker

      process.exit(0);
    });

    // Force kill after 30s if graceful shutdown hangs
    setTimeout(() => {
      logger.error('[SERVER] Graceful shutdown timed out. Forcing exit.');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  ---
  PART XIII: EVENT-DRIVEN ARCHITECTURE RECOMMENDATIONS

  ---
  Current state: Tight coupling between domains via direct service calls.
  Booking controller directly calls notification service, wallet service,
  and audit logger. This means:
  - Notification failure rolls back a successful booking
  - Adding a new event consumer requires modifying the booking controller
  - No replay capability for failed side effects

  Introduce an internal event bus (no Kafka yet):
  // utils/eventBus.js — simple Node.js EventEmitter with async handlers
  import { EventEmitter } from 'events';
  import logger from './logger.js';

  class EventBus extends EventEmitter {
    constructor() {
      super();
      this.setMaxListeners(50);
    }

    publish(event, payload) {
      logger.info(`[EVENT] Publishing: ${event}`, { payload:
  Object.keys(payload) });
      // Emit asynchronously to not block the publisher
      setImmediate(() => this.emit(event, payload));
    }

    subscribe(event, handler) {
      this.on(event, async (payload) => {
        try {
          await handler(payload);
        } catch (err) {
          logger.error(`[EVENT] Handler failed for ${event}:`, err);
          // Don't rethrow — event bus errors should not crash the publisher
        }
      });
    }
  }

  export const eventBus = new EventBus();

  // Event type registry (replaces magic strings)
  export const EVENTS = {
    BOOKING_CREATED: 'booking.created',
    BOOKING_CANCELLED: 'booking.cancelled',
    PAYMENT_COMPLETED: 'payment.completed',
    PAYMENT_FAILED: 'payment.failed',
    USER_REGISTERED: 'user.registered',
    GAME_STARTED: 'game.started',
    GAME_ENDED: 'game.ended',
    FOLLOW_CREATED: 'follow.created',
    MESSAGE_SENT: 'message.sent',
  };

  Usage:
  // modules/booking/booking.controller.js — publish event, not direct call
  await createBooking(bookingData);
  eventBus.publish(EVENTS.BOOKING_CREATED, {
    bookingId, userId, turfId, amount, startTime
  });
  // Controller is done — no dependency on notification or wallet service

  // modules/notification/notification.listener.js — subscribe
  eventBus.subscribe(EVENTS.BOOKING_CREATED, async ({ bookingId, userId })
  => {
    await notificationQueue.add('BOOKING_CONFIRMED', { bookingId, userId });
  });

  // services/wallet.service.js — subscribe
  eventBus.subscribe(EVENTS.BOOKING_CREATED, async ({ bookingId, amount,
  userId }) => {
    await reserveWalletBalance(userId, amount, bookingId);
  });

  // services/audit.service.js — subscribe
  eventBus.subscribe(EVENTS.BOOKING_CREATED, async (payload) => {
    await createAuditLog('booking.created', payload);
  });

  This is the foundation. When you later add Kafka, you replace
  eventBus.publish with Kafka producer — no changes to publishers or
  subscribers.

  ---
  PART XIV: GEO-QUERY OPTIMIZATION

  ---
  Current geospatial architecture:
  - Redis GEO (GEOADD/GEORADIUS) for real-time online players
  - PostGIS geoPoint geography column for persistent location
  - Raw SQL ST_GeomFromText for updates

  At 100k online users, Redis GEO becomes the bottleneck. Here's why: Redis
  GEO uses a sorted set with geohash scores. GEOSEARCH on a 100k-member
  sorted set with a radius query is O(N+log M) where N is the count within
  the bounding box. In a dense metro area, N can be 10,000+.

  Solution: H3 geohash-based partitioning:
  // Instead of one global geo:online key, partition by H3 cell
  // H3 resolution 7 = ~5km hexagons — ~400 cells cover India

  import h3 from 'h3-js';

  const getH3Cell = (lat, lng, resolution = 7) => h3.latLngToCell(lat, lng,
  resolution);

  // On location update:
  const cell = getH3Cell(lat, lng);
  const geoKey = `kridaz:geo:cell:${cell}`; // e.g.,
  kridaz:geo:cell:8726c23ffffffff

  await redis.geoadd(geoKey, lng, lat, userId);
  await redis.expire(geoKey, 300); // 5min TTL per cell

  // For nearby query: get current cell + 6 neighboring cells (k-ring)
  const searchCells = h3.gridDisk(cell, 1); // 7 cells total
  const nearbyUsers = await Promise.all(
    searchCells.map(c =>
      redis.call('GEOSEARCH', `kridaz:geo:cell:${c}`,
        'FROMLONLAT', lng, lat, 'BYRADIUS', 5, 'km', 'COUNT', 20)
    )
  );
  const allNearby = [...new Set(nearbyUsers.flat())];

  Benefit: Instead of searching 100k-member sorted set, each cell has
  ~100–500 members. GEOSEARCH is 100–200x faster. 100k users across ~400 H3
  cells = ~250 users per cell on average.

  For venue discovery (not real-time):
  -- PostGIS indexed query — fast even with 100k venues
  -- Uses spatial index automatically
  SELECT id, name,
    ST_Distance(
      "geoPoint"::geography,
      ST_MakePoint($1, $2)::geography
    ) AS distance_meters
  FROM "Turf"
  WHERE
    "isActive" = true
    AND "status" = 'approved'
    AND ST_DWithin(
      "geoPoint"::geography,
      ST_MakePoint($1, $2)::geography,
      $3  -- radius in meters
    )
  ORDER BY distance_meters ASC
  LIMIT 20;

  Ensure the GiST index exists:
  CREATE INDEX idx_turf_geopoint_gist ON "Turf" USING GIST("geoPoint");

  ---
  PART XV: RECOMMENDED LOAD TESTING STRATEGY

  ---
  Tool: k6 (Grafana) — better than Locust/JMeter for Node.js systems

  Test scenarios:

  // load-tests/scenarios.js

  export const scenarios = {
    // Scenario 1: Normal day (baseline)
    normalLoad: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },   // ramp up
        { duration: '5m', target: 100 },   // sustain
        { duration: '1m', target: 0 },     // ramp down
      ],
    },

    // Scenario 2: Tournament day (spike)
    tournamentSpike: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 500 },  // sudden spike
        { duration: '10m', target: 1000 }, // sustain peak
        { duration: '2m', target: 0 },
      ],
    },

    // Scenario 3: Booking rush (slot release)
    bookingRush: {
      executor: 'constant-arrival-rate',
      rate: 100,        // 100 bookings per second
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 200,
    },
  };

  // Test: booking flow under concurrent load
  export default function bookingFlow() {
    // 1. Login
    const loginRes = http.post('/api/v1/user/auth/login', JSON.stringify({
      email: `user_${__VU}@test.com`, password: 'testpass'
    }));
    check(loginRes, { 'login 200': r => r.status === 200 });

    const token = loginRes.json('data.token');

    // 2. Browse turfs
    http.get('/api/v1/location/turfs?lat=28.6&lng=77.2&radius=5');

    // 3. Book slot (concurrent contention test)
    const bookRes = http.post('/api/v1/booking/create-order',
  JSON.stringify({
      turfId: 'test-turf-id', slotId: 'contested-slot-id', ...
    }), { headers: { Authorization: `Bearer ${token}` } });

    // Expected: only 1 user succeeds, rest get 409 Conflict (not 500!)
    check(bookRes, { 'booking handled correctly': r => [200,
  409].includes(r.status) });
  }

  Thresholds to set (SLOs in code):
  export const thresholds = {
    http_req_duration: ['p(95)<500', 'p(99)<2000'], // 95% < 500ms, 99% < 2s
    http_req_failed: ['rate<0.01'],                  // < 1% error rate
    'http_req_duration{name:booking}': ['p(99)<3000'], // booking up to 3s
  (payment)
  };

  ---
  PART XVI: ABUSE PREVENTION & ANTI-SPAM STRATEGY

  ---
  Current state: Cloudflare Turnstile on auth + rate limiting per IP.
  Missing:
  - Per-user rate limiting (IP rotation bypasses IP-based limits)
  - Content moderation for reels/stories/posts
  - Fake account detection
  - Payment fraud detection

  Per-user rate limiting:
  // middleware/userRateLimit.middleware.js
  export const perUserLimiter = (maxRequests = 60, windowSecs = 60) => {
    return async (req, res, next) => {
      if (!req.user?.id) return next(); // only for authenticated users

      const key = `ratelimit:user:${req.user.id}:${req.path}`;
      const count = await redis.incr(key);

      if (count === 1) {
        await redis.expire(key, windowSecs);
      }

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests -
  count));

      if (count > maxRequests) {
        return res.status(429).json({
          success: false,
          message: `Rate limit exceeded. Try again in ${windowSecs}
  seconds.`
        });
      }

      next();
    };
  };

  Content moderation pipeline for reels/stories:
  // queues/processors/moderation.processor.js
  // After media transcoding completes, run content check
  export const moderateContent = async (job) => {
    const { mediaId, mediaType, thumbnailUrl } = job.data;

    // Use OpenAI Vision API to check thumbnail for violations
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // cheap, fast
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'Does this image contain: violence, nudity,
  hate speech, or spam? Reply: SAFE or VIOLATION:<reason>' },
          { type: 'image_url', image_url: { url: thumbnailUrl } }
        ]
      }],
      max_tokens: 50,
    });

    const verdict = response.choices[0].message.content;

    if (verdict.startsWith('VIOLATION')) {
      await prisma.reel.update({
        where: { id: mediaId },
        data: { status: 'flagged', moderationReason: verdict }
      });
      // Notify admins
      await notificationQueue.add('CONTENT_FLAGGED', { mediaId, mediaType,
  verdict });
    }
  };

  ---
  PART XVII: DOMAIN-DRIVEN DESIGN BOUNDARIES

  ---
  Bounded Contexts (for future microservice extraction):

  ┌─────────────────────────────────────────────────┐
  │                   IDENTITY CONTEXT               │
  │  User, Auth, OAuth, Profile, UserStats          │
  │  Anti-corruption: user_id is the shared key     │
  └─────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────┐
  │                  COMMERCE CONTEXT               │
  │  Booking, Payment, Wallet, Settlement, Dispute  │
  │  Owns: financial state, ACID guarantees         │
  │  Never call from other contexts directly        │
  └─────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────┐
  │                  VENUE CONTEXT                  │
  │  Turf, TurfSlot, TurfLike, TurfInteraction     │
  │  OwnerProfile, Review                           │
  │  Geospatial queries live here                   │
  └─────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────┐
  │                  GAME CONTEXT                   │
  │  HostedGame, GameSlot, GameDispute             │
  │  Team, TeamMember                               │
  │  Scoring, Commentary, Livestream               │
  └─────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────┐
  │                  SOCIAL CONTEXT                 │
  │  Post, Comment, Reel, Story, Follow            │
  │  Feed, Like, Report, UserRelationship          │
  └─────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────┐
  │               COMMUNICATION CONTEXT             │
  │  Chat, Message, Notification, Presence         │
  │  Real-time delivery layer                       │
  └─────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────┐
  │               PROFESSIONAL CONTEXT              │
  │  Coach, Umpire, ProfessionalBooking            │
  │  ProfessionalSession, ProfessionalCustomer     │
  └─────────────────────────────────────────────────┘

  Folder structure reflecting bounded contexts:
  server/
    contexts/
      identity/
        domain/          ← entities, value objects
        application/     ← use cases, commands, queries
        infrastructure/  ← Prisma repos, Redis adapters
        interface/       ← Express routes, validators
      commerce/
        domain/
        application/
        infrastructure/
        interface/
      venue/
      game/
      social/
      communication/
      professional/
    shared/
      events/            ← eventBus, EVENTS enum
      middleware/        ← auth, rate limit, error handler
      utils/             ← logger, cache, metrics
      config/            ← redis, prisma, socket, sentry

  This is Domain-Driven Design Lite — you get the benefits without the full
  ceremony of aggregates, domain events, and repositories everywhere.

  ---
  PART XVIII: COST OPTIMIZATION STRATEGY

  ---
  Current estimated Render costs at launch:
  kridaz-api (web service, Starter): $7/month
  kridaz-worker (background worker): $7/month
  Render PostgreSQL (Starter, 1GB): $7/month
  Total Render: ~$21/month

  Cloudinary (free tier: 25GB storage): $0
  Cloudflare R2 (10GB free, then $0.015/GB): $0–5/month
  Redis (Railway Hobby, 1GB): $5/month
  Sentry (Developer free tier): $0

  TOTAL AT LAUNCH: ~$30–35/month

  Cost at 10k users:
  kridaz-api (Standard 2x, 2 instances): 2 × $25 = $50/month
  kridaz-worker (Standard 1x): $25/month
  Render PostgreSQL (Standard, 4GB): $20/month
  Redis (Railway Pro, 4GB): $20/month
  Cloudinary (Plus, 225GB): $89/month
  Cloudflare R2 (100GB): $1.50/month

  TOTAL AT 10K: ~$200–250/month

  Cost optimization moves:
  1. Use Cloudflare R2 aggressively for images (0 egress fees) vs Cloudinary
   ($89 at scale). Migrate image delivery from Cloudinary CDN to Cloudflare
  R2 + Images ($5/month for 100k transformations).
  2. Move from Render PostgreSQL to Supabase (same underlying Postgres, but
  free PgBouncer + auth + real-time built-in, cheaper at scale).
  3. Move worker to Fly.io (cheaper than Render for long-running processes,
  $1.94/month for a 256MB worker).
  4. Use Cloudflare Workers for lightweight edge computation (geolocation
  headers, A/B testing) instead of server round-trips.

  ---
  CONCLUSION: Honest Assessment

  Your architecture shows genuine engineering sophistication for an
  early-stage team. The Redis adapter for horizontal Socket.IO scaling,
  early-stage team. The Redis adapter for horizontal Socket.IO scaling,
  BullMQ queue separation, modular auto-loading system, Sentry + Prometheus
  instrumentation, geospatial PostGIS design, and worker/API process split
  are all decisions that a senior engineer would be proud of.

  The gap is not vision — it's execution depth on the critical path:

  The O(n²) presence broadcast, atomic-unsafe scoring lock, unguarded KEYS
  command, and missing Helmet will each independently cause a production
  incident before you hit 5,000 concurrent users. None of them are hard to
  fix. All of them are dangerous to leave.

  Fix the P0 issues this week. Everything else is a roadmap.

  The foundation is strong enough to get you to 50,000 users with the fixes
  in this document. At 100,000 users you make infrastructure choices
  (Kubernetes, Kafka, PostgreSQL sharding). At 1,000,000 users you make
  organizational choices (dedicated SRE team, service boundaries, on-call
  rotations).

  You are not at those problems yet. Get to your first 10,000 users first.
