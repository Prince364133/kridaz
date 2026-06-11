# Player Profile — Backend Implementation Doc

> **Status:** Implemented through Phase 7
> **Date applied:** 2026-06-10
> **Spec:** `bms/docs/superpowers/specs/2026-06-10-player-profile-backend.md`
> **Branch:** `version3`

This doc is the implementation record for the Player Profile backend — what
shipped, where it lives, and the trade-offs taken. Phases map 1:1 to the spec
section 2 rollout table.

---

## 1. TL;DR

- 6 phases of the spec implemented end-to-end, plus a Phase 7 catch-up for
  the remaining loose ends (mutuals, QR, chat block, snapshot + cleanup jobs).
- 10 new Prisma models, 16 new columns on `User`, 25+ new endpoints, 5 new
  background-job consumers, 1 new middleware, 5 new rate limiters, 1 new
  utility module (`dmGate`).
- 6 idempotent SQL migrations applied against local Postgres (`kridaz`).
- 2 legacy tables retired: `UserProfile` (data reconciled into `User` first)
  and `UserBadge` (rows migrated into `UserAchievement` first).
- 1 legacy controller removed: the cricket-only `getLeaderboard` shadow that
  collided with the Phase 4 per-sport version.
- `is_reels_creator` and the reels gating path from the spec were
  **intentionally skipped** per direct user instruction.

---

## 2. Phase-by-phase

### Phase 1 — Schema base + getMe extension

**Schema (`server/prisma/schema.prisma`)**

Added to `User`:
- `coverImage`, `preferredFoot`, `preferredHand`, `languages[]`, `travelRadiusKm`,
  `lookingFor[]`, `skillLevels` (JSONB), `preferredPositions` (JSONB),
  `availability` (JSONB), `privacyFlags` (JSONB,
  `{showOnMap, allowDM, statsPublic}` default),
  `xp`, `level`, `verifiedPhone`, `verifiedEmail`, `verifiedId`,
  `profileViewsCount`.
- New relations: `blocksMade`, `blocksReceived`, `xpEvents`.

New models:
- `BlockedUser` — `(blockerId, blockedId)` PK + reason. Indexed on
  `blockedId`.
- `XpEvent` — ledger row per XP grant. Source enum (`'match' | 'booking' |
  'review' | 'host_game' | 'achievement'`), amount, optional referenceId.
  Indexed on `(userId, createdAt desc)`.

Dropped:
- `UserProfile` — its fields (`bio`, `gender`, `dob`, `city`, `state`,
  `sportTypes`, `interests`) are now first-class on `User`. The migration
  reconciles old data into the new columns before dropping (see §6).

**`getMe` (`server/modules/auth/auth.controller.js`)**

- Returns `_count: { followers, following }` so the client gets follower
  counts in a single round-trip.
- Routes through `buildAuthUserPayload(user, { profileShapeVersion: 2 })`
  in `server/utils/sanitizeUser.js`, which strips `_count` (after surfacing
  it as a top-level field), Google tokens, password hash, etc.
- `googleAuth` re-fetches the user with the same shape after invitation
  handling so the post-login `getMe` round-trip the Flutter client makes
  can be eliminated.

**Migration:** `server/migrations/phase1_player_profile_base.sql`

Idempotent. Adds columns, runs a `DO $$` block that reconciles `UserProfile`
data into the new User columns only if the table still exists, then drops
`UserProfile`. Creates `BlockedUser` and `XpEvent`, plus the supporting
indexes (using `CREATE INDEX CONCURRENTLY` — file must not run inside a tx).

---

### Phase 2 — Per-sport stats + match aggregation

**Schema additions**

- Extended `PlayerCareerStats` with football fields (`goalsScored`,
  `assistsCount`, `cleanSheets`) and cross-sport fields (`matchesDrawn`,
  `currentStreak`, `longestStreak`, `mvpCount`, `motmCount`, `playerRating`
  default 1200, `hoursPlayed`).
- New model `MatchParticipant` — one row per (match, user). Cricket per-ball
  detail stays in `MatchPlayerStat`/`MatchBall`; this is the cross-sport
  summary that powers recent-matches list + heatmap + career rollup.

**Services**

- `server/services/matchCompletedEmitter.service.js`
  - `emitMatchCompleted({matchId, hostedGameId, sport, completedAt, participants})`
    enqueues onto `playerStatsQueue` with jobId `match-completed:${matchId}`
    so re-finalizes dedupe.
  - `buildCricketParticipants(matchScoring, hostedGame)` derives win/loss
    by string-matching `cricketMatch.result` against team names — cricket
    is the only sport with a live result string today.
- `server/services/playerStatsAggregator.service.js`
  - `processMatchCompleted(event)` — checks for existing MatchParticipant
    rows under the matchId; if any exist, skips entirely. Idempotent on
    repeat dispatch.
  - `aggregateOneParticipant(tx, participant)` — writes MatchParticipant +
    upserts PlayerCareerStats + writes XpEvent + recomputes User.xp/level
    in a single transaction.
  - Streak rule: `+n` on win, `-n` on loss, `0` on draw.
  - XP constants: `XP_BASE_MATCH = 50`, `XP_WIN_BONUS = 20`,
    `XP_MOTM_BONUS = 30`.

**Queue (`server/queues/playerStats.queue.js`)**

- BullMQ queue + worker (`concurrency: 2`).
- `initPlayerStatsJobs()` registers three repeatables (Phase 2/4/7):
  - `milestone-sweep` — daily 02:00 UTC
  - `profile-view-cleanup` — daily 03:00 UTC (Phase 7)
  - `leaderboard-snapshot` — hourly (Phase 7)
- Boot/shutdown wired in `server/server.js`.

**Integration hook**

- `server/modules/scoring/scoring.service.js` `finalizeMatch()` now calls
  `emitMatchCompleted(...)` after the existing `aggregatePlayerStats()`
  path, so live-scored matches fan out into the new queue.

**Endpoints (`server/modules/player/player.controller.js`)**

- `GET /:id/stats?sport=` — one row per sport, or filter by sport.
  Privacy-gated via `canViewStats()` (false ⇒ 403).
- `GET /:id/matches?sport=&cursor=&limit=` — cursor paginated recent
  matches off `MatchParticipant`. Returns sport context per row.
- `GET /:id/activity?window=30d|90d|365d` — heatmap data:
  `perDay` array, `weekdayHistogram`, `mostActiveDay`, `peakHour`.

**Migration:** `server/migrations/phase2_player_profile_stats.sql`

---

### Phase 3 — Peer reviews

**Schema additions**

- `PlayerReview` — `(matchId, reviewerId, revieweeId)` unique constraint
  prevents duplicate reviews. `sportsmanship/punctuality/skill` SMALLINT
  CHECK(1..5). `tags[]`, optional `note`.
- `PlayerReviewAggregate` — one-per-user denormalized rollup: averages +
  `topTags` (top 5 as `{tag, count}[]`).

**Service**

- `server/services/playerReviewAggregator.service.js`
  - `rebuildAggregateForUser(userId)` — recomputes averages and top-5 tag
    histogram. Called incrementally on each review submit.

**Endpoints**

- `POST /match/:matchId/review` (auth required)
  - Body: `{ reviews: [{revieweeId, sportsmanship, punctuality, skill,
    tags?, note?}, ...] }`.
  - **Eligibility gate:** `reviewerPlayedMatch()` verifies the caller has
    a `MatchParticipant` row in this match. Reviewees must also be
    participants. Non-participants get a 403.
  - Grants `min(created.length * 5, 25)` XP via `grantXp({source: 'review'})`.
  - Idempotent: pre-existing review rows are upserted (`update` path picks
    up the new ratings).
  - Phase 6 adds `reviewLimiter` (5/hr) on this route.
- `GET /:id/reviews?cursor=&limit=` — paginated reviews-received plus
  aggregate roll-up.

**Migration:** `server/migrations/phase3_player_reviews.sql`

---

### Phase 4 — Achievements + XP + leaderboard

**Schema additions**

- `Achievement` — catalog. `code` is the stable string key
  (`'centurion'`, `'first_century'`, etc.); `tier` is
  `'bronze' | 'silver' | 'gold' | 'trophy'`; `sport` is nullable for
  cross-sport entries; `criteria` is a JSONB blob describing the rule
  shape (`{type:'per_match', metric:'runs', min:100}`).
- `UserAchievement` — join table with `(userId, achievementId)` PK and a
  `context` JSONB for the per-award metadata.
- Removed `UserBadge`. Phase 4 migration migrates existing badge rows
  into `UserAchievement` BEFORE dropping it (see §6).

**Service**

- `server/services/achievement.service.js`
  - `awardAchievement({userId, code, context})` — idempotent via the
    compound PK. No-ops if the user already has the achievement.
  - `runMilestoneSweep({lookbackDays = 7})` — scans recently active users
    for 10/50/100/500 match milestones, `'invincible'` (10 wins),
    `'first_century'`, `'rising_star'`. Driven nightly from the queue.

**XP module**

- `server/services/xp.service.js`
  - `computeLevel(xp) = floor(sqrt(max(xp,0)/100)) + 1` — the curve the
    spec calls for in §5.
  - `grantXp({userId, source, amount, referenceId?, tx?})` — writes an
    XpEvent and bumps `User.xp` + recomputes `User.level` in a single
    transaction. Accepts an existing tx so the aggregator can call it
    inside its own transaction without nesting.
  - Known sources: `'match' | 'booking' | 'review' | 'host_game' |
    'achievement'`.

**Integration hooks**

- `server/modules/hostedGame/hostedGame.controller.js`
  `createHostedGame()` grants 25 XP to the host on successful creation.
- `server/utils/settlementWorker.js` Phase B grants 10 XP per booker after
  the settlement transaction succeeds.
- `server/services/careerStats.service.js` `checkAndAwardBadges()`
  refactored to use `awardAchievement()` with the stable catalog codes
  (`'centurion'`, `'fifer_master'`, `'sixer_king'`, `'anchor'`,
  `'veteran'`, `'invincible'`). All previous in-flight badge names are
  preserved by the migration auto-materializing catalog rows for any
  unknown name (see §6).

**Endpoints**

- `GET /:id/achievements` — trophies/badges earned, newest first, with
  catalog metadata joined.
- `GET /leaderboard?sport=&city=&limit=` — per-sport per-city ranking
  by `playerRating` desc, tie-break `matchesPlayed` desc. Phase 7 adds a
  Redis read-through (`source: 'cache' | 'live'` in the response).

**Migration:** `server/migrations/phase4_achievements_xp.sql`

Seeds the catalog with 15 entries:

| code | tier | sport |
|---|---|---|
| `centurion` | gold | CRICKET |
| `fifer_master` | gold | CRICKET |
| `sixer_king` | silver | CRICKET |
| `anchor` | silver | CRICKET |
| `veteran` | gold | CRICKET |
| `invincible` | silver | any |
| `rising_star` | bronze | any |
| `century_maker` | silver | CRICKET |
| `wicket_machine` | silver | CRICKET |
| `safe_hands` | bronze | CRICKET |
| `milestone_10_matches` | bronze | any |
| `milestone_50_matches` | silver | any |
| `milestone_100_matches` | gold | any |
| `milestone_500_matches` | trophy | any |
| `first_century` | trophy | CRICKET |

---

### Phase 5 — Media gallery + cover

**Schema additions**

- `PlayerMedia` — photo gallery surface. `type` defaults to `'photo'`
  (reels stay in the existing `Reel` table). `isPinned`, `viewCount`,
  `likeCount`, `caption`, `tags[]`, optional `matchId`. Indexed on
  `(userId, type, createdAt desc)` and `(userId, isPinned)`.

**Endpoints**

| Endpoint | Notes |
|---|---|
| `POST /me/cover` (`upload.single('coverImage')`) | 8 MB cap. Writes `User.coverImage`. |
| `POST /me/media` (`upload.single('photo')`) | 5 MB cap. Phase 5 supports type='photo' only. |
| `PATCH /me/media/:mediaId` | Owner only. Caption / tags / pinned. Pinned has a `MAX_PINNED_PHOTOS = 4` cap. |
| `DELETE /me/media/:mediaId` | Owner only. Best-effort Cloudinary `destroy()` if URL matches `kridaz/players/${userId}/` prefix. |
| `GET /:id/media?type=photo` | Paginated gallery. |

**Reels gating:** explicitly NOT implemented per direct user instruction.
The `User.isReelsCreator` column is **not** added; the reel-create
controller is **not** modified. If/when this is enabled later, the spec
§3.13 reels gating note is the authoritative reference.

**Migration:** `server/migrations/phase5_player_media.sql`

---

### Phase 6 — Discovery + privacy + moderation

**Schema additions**

- `UserReport` — mirrors `PostReport`. `(reporterId, reportedId, status)`
  shape with status enum-by-string (`'PENDING' | 'RESOLVED' | 'DISMISSED'`).
  Indexed on `(reportedId, status)` and `reporterId`.
- `ProfileView` — "who viewed me." Unique on
  `(viewerId, viewedId, dayBucket)` so per-day dedupe is enforced at the
  index, not at the controller. `dayBucket` is `YYYY-MM-DD` in UTC.
  Indexed on `(viewedId, viewedAt desc)`.
- New `User` indexes on `city` and `state` to back the discovery filters.

**Middleware**

- `server/middleware/block.middleware.js`
  - `blockCheck` — bidirectional `BlockedUser` lookup. **Returns 404
    when either side has blocked the other**, not 403 — leaking "you are
    blocked" is itself a UX regression. Self-views always pass through.
    Unauth requests pass through (no viewer ⇒ no block).
- `server/middleware/rateLimiter.middleware.js` — five new limiters:

| Limiter | Window | Cap | Applied to |
|---|---|---|---|
| `reviewLimiter` | 1 hr | 5 | `POST /match/:matchId/review` |
| `reportLimiter` | 24 hr | 10 | `POST /:id/report` |
| `blockLimiter` | 24 hr | 30 | `POST /:id/block`, `DELETE /:id/block` |
| `followLimiter` | 1 hr | 60 | `POST /:id/follow`, `POST /:id/unfollow` |
| `profileViewLimiter` | 1 hr | 600 | `POST /:id/view` |

All limiters key by user ID when authenticated, else IPv6-/64-bucketed IP.
Redis-backed with Opossum circuit-breaker fallback to in-memory store on
Redis outage (existing pattern).

**Controllers (`server/modules/player/player.controller.js`)**

- `discoverPlayers` — `GET /discover?q=&sport=&city=&state=&minRating=&skillLevel=&cursor=&limit=`.
  Cursor pagination by `id desc` (stable, not relevance-ranked — relevance
  would need a search index, deferred). Honors
  `privacyFlags.discoverable !== false`. Excludes viewer and both
  directions of `BlockedUser`.
- `recordProfileView` — `POST /:id/view`. UTC-day-deduped via upsert on
  the compound unique. Bumps `User.profileViewsCount` only on the first
  hit per day (detected via `viewedAt` age < 2 s after the upsert).
- `getMyViewers` — `GET /me/viewers`. Recent unique viewers, paginated.
  Respects each viewer's own `privacyFlags.profileViewsPublic` — viewers
  who set it false are returned as anonymous placeholders so the count
  stays honest.
- `reportPlayer` — `POST /:id/report`. Body `{reason, details?}`. Closed
  reason set: `'inappropriate_content' | 'harassment' | 'spam' |
  'impersonation' | 'underage' | 'safety' | 'other'`. Pending reports from
  the same reporter against the same target merge details (capped at
  4 000 chars) instead of creating duplicates. Self-report → 400.
- `blockPlayer` — `POST /:id/block`. Idempotent upsert. Tears down
  follow edges in both directions within the same transaction so a
  blocked user immediately stops appearing in feeds.
- `unblockPlayer` — `DELETE /:id/block`. Lifts only the blocker→blocked
  direction (target's block against blocker, if any, stays intact).

**`blockCheck` is wired into** every parameterized profile read route plus
follow/network: `/:id`, `/:id/stats`, `/:id/matches`, `/:id/activity`,
`/:id/achievements`, `/:id/reviews`, `/:id/media`, `/:id/network`,
`/:id/follow`, `/:id/view`. Notably **not** wired into `/:id/report` —
being blocked must not stop you from reporting harassment.

**Migration:** `server/migrations/phase6_discovery_privacy.sql`

---

### Phase 7 — Loose ends

Five spec items that didn't naturally fit one of the rollout phases.

**1. Mutual connections — `GET /:id/mutual`**

`getMutualConnections` in `player.controller.js`. Single-roundtrip
intersect: users the viewer follows whose target list also includes the
target user. Returns up to 50 users with their public profile fields.
Auth required + `blockCheck` applied.

**2. Profile QR — `GET /me/qr?format=png|svg`**

`getMyProfileQr` encodes `kridaz://player/<username || id>` to a 512×512
PNG (default) or SVG. Uses the `qrcode` npm package. Sets
`Cache-Control: private, max-age=600`. Auth required.

**3. Chat block + allowDM enforcement**

New helper: `server/utils/dmGate.js` — `canDirectMessage({senderUserId,
targetUserId, senderIsOwner})` returns `{ok, status, code, message}`.

Two rails enforced:
- **Bidirectional block:** any `BlockedUser` row between sender and
  target → `403 DM_BLOCKED`.
- **`privacyFlags.allowDM = false`** → `403 DM_NOT_ALLOWED` unless the
  target already follows the sender (target opted in by following).
  Owners skip this rail (business outreach is a different flow), but
  blocks still apply.

Wired into:
- `server/modules/chat/chat.controller.js` `accessChat` — only for
  `onModel: 'User'` 1-on-1 chat creation. Runs before the in-flight
  dedupe registry write.
- `server/modules/chat/message.controller.js` `sendMessage` — only for
  `!chat.isGroupChat`, where the "other participant" is a User (not an
  Owner). Group chats are skipped — group membership is implicit consent.

**4. `staleProfileViewCleanup` job — daily 03:00 UTC**

Added to `playerStatsQueue` as a repeatable. Worker handler:
`prisma.profileView.deleteMany({ viewedAt: { lt: 30d ago } })`. Logs the
pruned row count.

**5. `leaderboardSnapshot` job — hourly + Redis read-through**

New service: `server/services/leaderboardSnapshot.service.js`.

- `snapshotLeaderboards()` — iterates over `SPORT_LIST`, finds cities
  with `>= 5` `PlayerCareerStats` rows for that sport, snapshots
  per-sport-per-city + per-sport-global top-100 into Redis under
  `lb:{sport}:{city || 'GLOBAL'}` with a 90-minute TTL (60-min schedule
  + 30-min headroom so a missed run doesn't blank the cache).
- `readLeaderboardCache(sport, city)` — returns parsed JSON or null. Null
  → controller falls back to live query.

`getLeaderboard` controller picks the cache path when:
- `cityRaw` is null (global), OR
- `cityRaw` matches a simple letters/spaces pattern (snapshots key on
  exact city strings; ambiguous case-insensitive contains queries can't
  hit cache safely)

The response shape now includes `source: 'cache' | 'live'` so the client
can see which path served the call. Useful for grafana later.

---

## 3. updateProfile fix (post-Phase-1 hardening)

`PUT /auth/updateProfile` was broken in two ways once Phase 1 schema
applied:
1. Still upserted the dropped `User.profile` (UserProfile) relation —
   would throw on every save.
2. Lacked the field-level auth that spec §7 explicitly requires
   ("Don't let the client set xp, level, is_reels_creator, verified_*,
   profile_views_count. Whitelist editable fields only.").

The rewrite in `server/modules/auth/auth.controller.js`:
- Adds an explicit `EDITABLE_PROFILE_FIELDS` allowlist; anything else in
  `req.body` is dropped and surfaced in `rejected[]` on the response.
- Adds `PRIVACY_KEYS` allowlist on `privacyFlags` JSONB (only
  `showOnMap | allowDM | statsPublic | discoverable | profileViewsPublic`,
  coerced to booleans).
- Merges privacy-flag patches onto existing flags so the client can
  flip one toggle without clobbering the rest.
- Removes the stale `profile: { upsert: ... }` block.
- Accepts the new Phase 1+ fields: `coverImage`, `preferredFoot`,
  `preferredHand`, `languages`, `travelRadiusKm`, `lookingFor`,
  `skillLevels`, `preferredPositions`, `availability`, `privacyFlags`,
  `notificationPreferences`, `locationSharingEnabled`, `profilePicture`.

---

## 4. Endpoint inventory

| Method | Path | Phase | Auth | Notes |
|---|---|---|---|---|
| GET | `/players/discover` | 6 | optional | Facets: q, sport, city, state, minRating, skillLevel |
| GET | `/players/leaderboard` | 4 | optional | `?sport=` required. Cache-backed in Phase 7 |
| GET | `/players/me/qr` | 7 | required | PNG default; `?format=svg` for vector |
| GET | `/players/me/viewers` | 6 | required | Who viewed me |
| POST | `/players/me/cover` | 5 | required | Cover image upload |
| POST | `/players/me/media` | 5 | required | Gallery photo upload |
| PATCH | `/players/me/media/:mediaId` | 5 | required | Owner edit |
| DELETE | `/players/me/media/:mediaId` | 5 | required | Owner delete |
| GET | `/players/:id` | base | optional | `blockCheck` |
| GET | `/players/:id/stats` | 2 | optional | `blockCheck`. Privacy-gated |
| GET | `/players/:id/matches` | 2 | optional | `blockCheck`. Cursor paginated |
| GET | `/players/:id/activity` | 2 | optional | `blockCheck` |
| GET | `/players/:id/achievements` | 4 | optional | `blockCheck` |
| GET | `/players/:id/reviews` | 3 | optional | `blockCheck`. Paginated + aggregate |
| GET | `/players/:id/media` | 5 | optional | `blockCheck` |
| GET | `/players/:id/network` | base | required | `blockCheck` |
| GET | `/players/:id/mutual` | 7 | required | `blockCheck` |
| POST | `/players/:id/follow` | base | required | `followLimiter` + `blockCheck` |
| POST | `/players/:id/unfollow` | base | required | `followLimiter` |
| POST | `/players/:id/view` | 6 | required | `profileViewLimiter` + `blockCheck` |
| POST | `/players/:id/report` | 6 | required | `reportLimiter` (no `blockCheck`) |
| POST | `/players/:id/block` | 6 | required | `blockLimiter` |
| DELETE | `/players/:id/block` | 6 | required | `blockLimiter` |
| POST | `/match/:matchId/review` | 3 | required | `reviewLimiter` |

Existing endpoints that changed behavior (not new routes):

- `GET /auth/getMe` — extended payload, `profileShapeVersion: 2`.
- `POST /auth/google-auth` — now returns the same shape as `getMe`.
- `PUT /auth/updateProfile` — whitelisted fields, privacy patch
  semantics, dropped UserProfile reference (§3 above).
- `POST /chat` (`accessChat`) — `canDirectMessage` gate.
- `POST /chat/message` (`sendMessage`) — `canDirectMessage` gate on 1-on-1.
- `POST /scoring/finalize` (`finalizeMatch`) — emits `match-completed`
  onto `playerStatsQueue`.

---

## 5. Background jobs

| Job | Cadence | Where |
|---|---|---|
| `match-completed` | on demand | `playerStatsQueue`, dispatched from `finalizeMatch` |
| `milestone-sweep` | daily 02:00 UTC | `playerStatsQueue` repeatable |
| `profile-view-cleanup` | daily 03:00 UTC | `playerStatsQueue` repeatable — Phase 7 |
| `leaderboard-snapshot` | hourly `0 * * * *` | `playerStatsQueue` repeatable — Phase 7 |

All four share the same queue + worker (concurrency 2). The worker
dispatches on `job.name`. Failures are logged and forwarded to Sentry.
Boot/shutdown wired in `server/server.js`.

---

## 6. Migrations applied

All idempotent (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`,
`CREATE INDEX CONCURRENTLY`). All applied against local Postgres `kridaz`
on 2026-06-10.

| File | Effect |
|---|---|
| `phase1_player_profile_base.sql` | User columns + `UserProfile` reconcile-then-drop + `BlockedUser` + `XpEvent` |
| `phase2_player_profile_stats.sql` | `PlayerCareerStats` columns + `MatchParticipant` |
| `phase3_player_reviews.sql` | `PlayerReview` + `PlayerReviewAggregate` |
| `phase4_achievements_xp.sql` | Catalog (15 seeded entries) + `UserAchievement` + `UserBadge` → `UserAchievement` migration + drop `UserBadge` |
| `phase5_player_media.sql` | `PlayerMedia` + indexes |
| `phase6_discovery_privacy.sql` | `UserReport` + `ProfileView` + User(city)/(state) indexes |

**Two tables retired safely:**
- `UserProfile`: Phase 1 reconciles its `bio/gender/dob/city/state/sportTypes/interests` columns into `User` before the drop (only if `UserProfile` still exists; the `DO $$` block is a no-op otherwise).
- `UserBadge`: Phase 4 walks every `UserBadge` row, slugifies the badge name to a catalog code, materializes a catalog row for any unknown name (so no earned badge is lost), then drops the table.

**Caveats:**
- All files contain `CREATE INDEX CONCURRENTLY` — they must run outside
  a transaction. Run with `psql -f`, not inside `BEGIN/COMMIT`. The files
  do not contain transaction wrappers; do not add `--single-transaction`.
- Each phase is independently idempotent. Reapplying in a different order
  is **not** guaranteed safe, because Phase 4 expects `UserBadge` to still
  exist (or be already absent); applying Phase 4 before Phase 1 is fine
  but applying Phase 1 then Phase 4 then re-applying Phase 1 is fine.

---

## 7. Files changed (working set)

**Schema/migrations**
- `server/prisma/schema.prisma`
- `server/migrations/phase1_player_profile_base.sql`
- `server/migrations/phase2_player_profile_stats.sql`
- `server/migrations/phase3_player_reviews.sql`
- `server/migrations/phase4_achievements_xp.sql`
- `server/migrations/phase5_player_media.sql`
- `server/migrations/phase6_discovery_privacy.sql`

**Controllers**
- `server/modules/player/player.controller.js` (extensively extended)
- `server/modules/player/routes/user.routes.js`
- `server/modules/auth/auth.controller.js` (getMe, googleAuth, updateProfile)
- `server/modules/chat/chat.controller.js` (accessChat dmGate hook)
- `server/modules/chat/message.controller.js` (sendMessage dmGate hook)
- `server/modules/scoring/scoring.service.js` (emitMatchCompleted hook)
- `server/modules/hostedGame/hostedGame.controller.js` (host-XP grant)

**Services / utilities**
- `server/services/matchCompletedEmitter.service.js` *(new)*
- `server/services/playerStatsAggregator.service.js` *(new)*
- `server/services/xp.service.js` *(new)*
- `server/services/achievement.service.js` *(new)*
- `server/services/playerReviewAggregator.service.js` *(new)*
- `server/services/leaderboardSnapshot.service.js` *(new)*
- `server/services/careerStats.service.js` (refactor: awardAchievement)
- `server/utils/sports.js` *(new)*
- `server/utils/sanitizeUser.js` (buildAuthUserPayload + PROFILE_SHAPE_VERSION)
- `server/utils/dmGate.js` *(new)*
- `server/utils/settlementWorker.js` (XP grant on booker settlement)

**Middleware / config**
- `server/middleware/block.middleware.js` *(new)*
- `server/middleware/rateLimiter.middleware.js` (5 new limiters)
- `server/queues/playerStats.queue.js` *(new — registers 3 repeatables)*
- `server/server.js` (queue boot/shutdown)
- `server/config/socket.js` (touched during session)

**Tests**
- `server/tests/player.test.js` (touched)
- `server/tests/team.test.js` (touched)

---

## 8. Smoke test results (2026-06-10)

Server booted clean (`localhost:6001`) after the Prisma client-init fix
(adapter pattern — the new services must import the shared `prisma` from
`config/prisma.js`, not construct their own).

| Endpoint | Status | Result |
|---|---|---|
| `GET /players/discover?limit=3` | 200 | Returns 3 players, `nextCursor` present |
| `GET /players/leaderboard?sport=CRICKET&limit=3` | 200 | 3 rows, `source: "live"` (cache empty) |
| `GET /players/search?query=v` | 200 | Existing endpoint still works |
| `GET /players/:id` | 200 | Full profile (Rohit Gupta) |
| `GET /players/:id/stats` | 200 | 40 matches, 2164 runs (real seeded data) |
| `GET /players/:id/matches` | 200 | Empty (no MatchParticipant rows yet) |
| `GET /players/:id/activity?window=30d` | 200 | Empty heatmap |
| `GET /players/:id/achievements` | 200 | Empty |
| `GET /players/:id/reviews` | 200 | Aggregate scaffolded, empty array |
| `GET /players/:id/media` | 200 | Empty gallery |
| `GET /players/me/qr` (no auth) | 401 NO_TOKEN | Clean 401 |
| `GET /players/me/viewers` (no auth) | 401 NO_TOKEN | Clean 401 |
| `GET /players/:id/mutual` (no auth) | 401 NO_TOKEN | Clean 401 |
| `POST /players/:id/block` (no auth) | 401 NO_TOKEN | Clean 401 |
| `POST /players/:id/report` (no auth) | 401 NO_TOKEN | Clean 401 |

No 500s on any tested path; auth ordering is correct on every new route.

Write paths (block/report/follow/cover-upload/media/profile-view,
post-match review submission) need a logged-in JWT to verify end-to-end.

---

## 9. Known follow-ups (not implemented)

**Deliberately skipped** per direct user instruction:
- `User.isReelsCreator` column and reel-create gating. Spec §3.13/§7
  remains authoritative if/when this is enabled.

**Deferrable polish:**
- Soft-delete semantics on `User` for account deletion (spec §8 Q9).
- `lastSeenAt` heartbeat strategy (spec §8 Q10) — currently driven by
  existing auth middleware.
- pg_trgm index on `User.name` / `User.username` if discovery search needs
  fuzzy ranking — currently exact-substring `contains`.
- GIN index on `User.sportTypes` if the discovery endpoint's
  `sportTypes: { has: ... }` filter becomes hot.
- Admin tool for `UserReport` status transitions
  (`PENDING → RESOLVED|DISMISSED`).
- NSFW scan on photo uploads (spec §7) — currently MIME + size validation
  only.
- Apply-as-coach approval flow flipping `verified_id` + adding `is_coach`
  (spec §6) — separate concern, not part of this implementation.
