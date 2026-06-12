# Player Profile — Backend Spec

> **Status:** Draft for backend implementation
> **Date:** 2026-06-10
> **Owner:** TBD
> **Scope:** Schema, endpoints, jobs, integration hooks, and privacy rules required to power the new Player Profile page (hero, sport-specific stats, teams, activity, reviews, achievements, gated reels).

---

## 1. Context

The bms (Kridaz) app currently exposes a thin user profile that captures only auth essentials, demographic fields, and a flat list of sports/interests. The new Player Profile page surfaces:

- An identity hero (avatar, cover, handle, verified tier, skill chip, CTAs)
- A quick-stats strip (games, win-rate, rating, streak, hours, followers)
- Per-sport deep stats (cricket, football, etc.) wired to live scoring
- Activity heatmap, recent matches, most active day/time
- Teams I belong to, social graph (followers/following, mutual)
- Achievements, level/XP, leaderboard rank
- Peer reviews & reputation tags (sportsmanship, punctuality, skill)
- Media gallery — photos for everyone, **reels gated to admin-whitelisted creators only**
- Availability / playing preferences fueling matchmaking & nearby-players discovery

The backend changes below are organized as the minimum required to ship each layer and the seams to defer cleanly.

## 2. Phased Rollout

Don't ship all at once. Suggested order:

| Phase | What ships | Why first |
|---|---|---|
| **1. Schema base** | Extend `users`, create `follows`, `blocked_users`, `xp_events`. Extend `getMe`. | Unlocks hero, edit profile, follow CTA. |
| **2. Stats** | `player_stats`, `match_participants`, aggregate-stats job. Stats endpoints. | Makes the profile meaningfully sport-aware. |
| **3. Social proof** | `player_reviews` + aggregates, post-match review flow. | Differentiator; raises trust for nearby-players. |
| **4. Achievements + XP** | `achievements`, `user_achievements`, milestone job, leaderboard endpoint. | Retention loop. |
| **5. Media + reels gating** | `player_media`, photo upload, reels admin whitelist enforcement. | Visual depth; needs CDN + moderation. |
| **6. Discovery & search** | `/user/profile/search`, leaderboard snapshots, profile-views, mutual queries. | Long tail; can lag behind v1. |

---

## 3. Data Model

### 3.1 `users` — column additions

Extend the existing table. Keep here until the row gets unwieldy (~30 cols); only then split into `user_profiles`.

```sql
ALTER TABLE users
  ADD COLUMN username           VARCHAR(30) UNIQUE,
  ADD COLUMN bio                VARCHAR(160),
  ADD COLUMN cover_image        TEXT,
  ADD COLUMN preferred_foot     VARCHAR(10),         -- L / R / Both (football)
  ADD COLUMN preferred_hand     VARCHAR(10),         -- L / R (cricket)
  ADD COLUMN languages          TEXT[],
  ADD COLUMN travel_radius_km   INT DEFAULT 10,
  ADD COLUMN looking_for        TEXT[],              -- ['pickup','tournament','team','coaching']
  ADD COLUMN xp                 INT DEFAULT 0,
  ADD COLUMN level              INT DEFAULT 1,
  ADD COLUMN last_seen_at       TIMESTAMPTZ,
  ADD COLUMN verified_phone     BOOL DEFAULT false,
  ADD COLUMN verified_email     BOOL DEFAULT false,
  ADD COLUMN verified_id        BOOL DEFAULT false,  -- KYC tier
  ADD COLUMN is_reels_creator   BOOL DEFAULT false,  -- admin whitelist; do NOT expose self-service
  ADD COLUMN profile_views_count INT DEFAULT 0,
  ADD COLUMN privacy_flags      JSONB DEFAULT '{"showOnMap":true,"allowDM":true,"statsPublic":true}'::jsonb,
  ADD COLUMN skill_levels       JSONB DEFAULT '{}'::jsonb,   -- {football:'intermediate'}
  ADD COLUMN preferred_positions JSONB DEFAULT '{}'::jsonb,  -- {football:['ST','LW']}
  ADD COLUMN availability       JSONB DEFAULT '{}'::jsonb;   -- {weekdays:['evening'],weekends:['morning']}
```

Indexes:
```sql
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_last_seen ON users (last_seen_at DESC);
CREATE INDEX idx_users_creator ON users (is_reels_creator) WHERE is_reels_creator = true;
```

### 3.2 `player_stats` — sport-aggregated counters

One row per (user, sport). Updated by the match-end job, not by API writes.

```sql
CREATE TABLE player_stats (
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sport              VARCHAR(40) NOT NULL,
  matches            INT DEFAULT 0,
  wins               INT DEFAULT 0,
  losses             INT DEFAULT 0,
  draws              INT DEFAULT 0,
  -- football
  goals_scored       INT DEFAULT 0,
  assists_count      INT DEFAULT 0,
  clean_sheets       INT DEFAULT 0,
  -- cricket
  runs               INT DEFAULT 0,
  wickets            INT DEFAULT 0,
  balls_faced        INT DEFAULT 0,
  overs_bowled       NUMERIC(6,1) DEFAULT 0,
  high_score         INT DEFAULT 0,
  best_bowling       VARCHAR(20),
  -- generic
  current_streak     INT DEFAULT 0,                -- +n win streak, -n loss
  longest_streak     INT DEFAULT 0,
  mvp_count          INT DEFAULT 0,
  motm_count         INT DEFAULT 0,
  player_rating      INT DEFAULT 1200,             -- ELO-style 0..2000
  hours_played       NUMERIC(8,1) DEFAULT 0,
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, sport)
);
```

### 3.3 `match_participants` — per-match player row

Write at match end. Powers recent-matches list, weekly heatmap, and aggregate rebuilds.

```sql
CREATE TABLE match_participants (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id           UUID NOT NULL,
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id            UUID,
  sport              VARCHAR(40) NOT NULL,
  role               VARCHAR(40),                  -- batsman/bowler, ST/GK, etc.
  runs               INT,
  wickets            INT,
  goals              INT,
  assists            INT,
  minutes_played     INT,
  is_motm            BOOL DEFAULT false,
  result             VARCHAR(10),                  -- won / lost / draw
  xp_awarded         INT DEFAULT 0,
  played_at          TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_match_participants_user_played
  ON match_participants (user_id, played_at DESC);
CREATE INDEX idx_match_participants_match
  ON match_participants (match_id);
```

### 3.4 `follows` — one-way follow graph

Decouple from existing "friends" — friends are mutual, follows are not.

```sql
CREATE TABLE follows (
  follower_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX idx_follows_following ON follows (following_id);
```

### 3.5 `player_reviews` — peer rating after a match

```sql
CREATE TABLE player_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        UUID NOT NULL,
  reviewer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sportsmanship   SMALLINT CHECK (sportsmanship BETWEEN 1 AND 5),
  punctuality     SMALLINT CHECK (punctuality BETWEEN 1 AND 5),
  skill           SMALLINT CHECK (skill BETWEEN 1 AND 5),
  tags            TEXT[],                         -- ['team_player','punctual']
  note            VARCHAR(200),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (match_id, reviewer_id, reviewee_id),
  CHECK (reviewer_id <> reviewee_id)
);

CREATE INDEX idx_player_reviews_reviewee
  ON player_reviews (reviewee_id, created_at DESC);
```

### 3.6 `player_review_aggregates` — denormalized read-side

```sql
CREATE TABLE player_review_aggregates (
  user_id            UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  avg_sportsmanship  NUMERIC(3,2),
  avg_punctuality    NUMERIC(3,2),
  avg_skill          NUMERIC(3,2),
  review_count       INT DEFAULT 0,
  top_tags           JSONB,                        -- [{tag,count}] top 5
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.7 `achievements` — catalog

```sql
CREATE TABLE achievements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(60) UNIQUE NOT NULL,         -- 'first_century'
  name        VARCHAR(80) NOT NULL,
  description TEXT,
  icon_url    TEXT,
  tier        VARCHAR(20) NOT NULL,                -- bronze/silver/gold/trophy
  sport       VARCHAR(40),                         -- nullable for cross-sport
  criteria    JSONB                                -- machine-readable
);
```

### 3.8 `user_achievements`

```sql
CREATE TABLE user_achievements (
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id),
  awarded_at     TIMESTAMPTZ DEFAULT NOW(),
  context        JSONB,                            -- {matchId, season, rank}
  PRIMARY KEY (user_id, achievement_id)
);
```

### 3.9 `xp_events` — ledger

Source of truth for `users.xp` (sum of amounts) and `users.level` (curve fn of xp).

```sql
CREATE TABLE xp_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source       VARCHAR(40) NOT NULL,                -- 'match','booking','review','host_game'
  amount       INT NOT NULL,
  reference_id UUID,                                -- matchId/bookingId/etc.
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_xp_events_user_created
  ON xp_events (user_id, created_at DESC);
```

### 3.10 `blocked_users`

```sql
CREATE TABLE blocked_users (
  blocker_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  reason       TEXT,
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
```

### 3.11 `user_reports`

```sql
CREATE TABLE user_reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id       UUID NOT NULL REFERENCES users(id),
  reported_user_id  UUID NOT NULL REFERENCES users(id),
  reason            TEXT NOT NULL,
  status            VARCHAR(20) DEFAULT 'open',     -- open/reviewed/actioned
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.12 `profile_views` *(optional — "who viewed me")*

```sql
CREATE TABLE profile_views (
  viewer_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profile_views_viewed
  ON profile_views (viewed_user_id, viewed_at DESC);
```

### 3.13 `player_media` — photos & gated reels

```sql
CREATE TABLE player_media (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          VARCHAR(10) NOT NULL,               -- 'photo' | 'reel'
  url           TEXT NOT NULL,
  thumbnail_url TEXT,
  match_id      UUID,
  caption       VARCHAR(200),
  tags          TEXT[],
  is_pinned     BOOL DEFAULT false,
  view_count    INT DEFAULT 0,
  like_count    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_player_media_user_type
  ON player_media (user_id, type, created_at DESC);
```

> **Reels gating:** the API layer must reject `INSERT` of `type='reel'` unless `users.is_reels_creator = true`. Do **not** rely on the client. Reel creation is whitelist-only — there is no self-service apply flow (unlike apply-as-coach).

---

## 4. Endpoints

### 4.1 New endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/user/profile/me` | GET | Own profile (private fields included) |
| `/user/profile/me` | PATCH | Edit bio, prefs, availability, skill levels |
| `/user/profile/me/avatar` | POST | Multipart upload |
| `/user/profile/me/cover` | POST | Multipart upload |
| `/user/profile/me/views` | GET | Who viewed me, last 30d |
| `/user/profile/me/qr` | GET | QR code PNG for profile share |
| `/user/profile/:userId` | GET | Public profile (privacy + block enforced) |
| `/user/profile/:userId/stats` | GET | `?sport=football` deep stats |
| `/user/profile/:userId/matches` | GET | Paginated recent matches |
| `/user/profile/:userId/activity` | GET | `?window=90d` heatmap data |
| `/user/profile/:userId/teams` | GET | Teams user belongs to |
| `/user/profile/:userId/achievements` | GET | Trophies & badges |
| `/user/profile/:userId/reviews` | GET | Paginated reviews + aggregates |
| `/user/profile/:userId/mutual` | GET | Mutual friends/teammates |
| `/user/profile/:userId/follow` | POST | Follow |
| `/user/profile/:userId/follow` | DELETE | Unfollow |
| `/user/profile/:userId/followers` | GET | Paginated list |
| `/user/profile/:userId/following` | GET | Paginated list |
| `/user/profile/:userId/block` | POST | Block |
| `/user/profile/:userId/block` | DELETE | Unblock |
| `/user/profile/:userId/report` | POST | Report user |
| `/user/profile/search` | GET | Discovery — `?sport=&skill=&city=&lookingFor=&availability=` |
| `/user/leaderboard` | GET | `?sport=&city=&window=month` |
| `/match/:matchId/review` | POST | Submit post-match peer reviews (bulk allowed) |

### 4.2 Existing endpoint extensions

| Endpoint | Change |
|---|---|
| `/user/auth/getMe` | Return all new columns + computed `followersCount`, `followingCount`, `xp`, `level`. Bump response shape version so Flutter can gate on it. |
| `/user/auth/google-auth` | Return the same payload shape as `getMe`. Eliminates the post-login `getMe` round-trip the Flutter client now makes (see auth_manager.dart). |
| `/user/turf/all`, `/user/turf/details/:id` | Add `bookmarked: bool` per turf if the requesting user has saved it — keeps profile↔saved-venues consistent. |

### 4.3 Sample payloads

**`GET /user/profile/:userId` (public view)**
```json
{
  "user": {
    "id": "uuid",
    "username": "vamshi_z",
    "name": "Vamshi Z",
    "photoURL": "https://cdn.../avatar.jpg",
    "coverImage": "https://cdn.../cover.jpg",
    "bio": "Striker · Gurugram · weekend warrior",
    "city": "Gurugram",
    "state": "Haryana",
    "primarySport": "football",
    "skillLevels": { "football": "intermediate" },
    "verified": { "phone": true, "email": true, "id": false },
    "level": 12,
    "xp": 2350,
    "isReelsCreator": false,
    "lastSeenAt": "2026-06-10T14:21:00Z",
    "isFollowing": false,
    "isFollowedBy": true,
    "isBlocked": false,
    "privacyFlags": { "statsPublic": true, "showOnMap": true, "allowDM": true }
  },
  "quickStats": {
    "matches": 47,
    "winRate": 0.62,
    "playerRating": 1310,
    "streak": "+3",
    "hoursPlayed": 84.5,
    "followersCount": 128
  },
  "reviewSummary": {
    "avgSportsmanship": 4.6,
    "avgPunctuality": 4.8,
    "avgSkill": 4.1,
    "reviewCount": 23,
    "topTags": [
      { "tag": "team_player", "count": 18 },
      { "tag": "punctual", "count": 14 }
    ]
  },
  "leaderboardRank": { "city": "Gurugram", "sport": "football", "rank": 47 }
}
```

**`GET /user/profile/:userId/stats?sport=football`**
```json
{
  "sport": "football",
  "matches": 31,
  "wins": 19,
  "losses": 9,
  "draws": 3,
  "goalsScored": 22,
  "assistsCount": 11,
  "cleanSheets": 0,
  "motmCount": 4,
  "currentStreak": 3,
  "longestStreak": 7,
  "playerRating": 1310,
  "personalBests": [
    { "label": "Most goals in a match", "value": 4, "matchId": "uuid", "date": "2026-05-12" }
  ],
  "recentForm": ["W","W","D","W","L"]
}
```

**`GET /user/profile/:userId/activity?window=90d`**
```json
{
  "window": "90d",
  "perDay": [
    { "date": "2026-03-13", "minutes": 90, "matches": 1 },
    { "date": "2026-03-14", "minutes": 0,  "matches": 0 }
  ],
  "weekdayHistogram": { "mon": 2, "tue": 1, "wed": 3, "thu": 0, "fri": 2, "sat": 7, "sun": 5 },
  "mostActiveDay": "sat",
  "peakHour": 19
}
```

**`POST /match/:matchId/review`**
```json
{
  "reviews": [
    {
      "revieweeId": "uuid",
      "sportsmanship": 5,
      "punctuality": 5,
      "skill": 4,
      "tags": ["team_player","punctual"],
      "note": "Great teammate, never argues."
    }
  ]
}
```

---

## 5. Background Jobs

| Job | Cadence | Effect |
|---|---|---|
| `aggregateStats` | Queue — fires on match end | Upsert `player_stats`, insert `match_participants`, write `xp_events` |
| `recomputeLevel` | After `xp_events` insert | `level = floor(sqrt(xp / 100)) + 1` (or your curve) |
| `awardMilestones` | Nightly | Sweep for 10/50/100/500 match milestones, first century, hat-tricks → `user_achievements` |
| `rebuildReviewAggregates` | Every 15 min | Roll up `player_reviews` → `player_review_aggregates`, recompute top tags |
| `leaderboardSnapshot` | Hourly | Per-sport per-city ranks cached in Redis (`lb:{sport}:{city}:{window}`) |
| `staleProfileViewCleanup` | Daily | Delete `profile_views` rows older than 30 days |
| `reelWhitelistAudit` | On-demand admin tool | Flip `users.is_reels_creator` |

---

## 6. Integration Hooks (existing → new)

| Existing flow | Hook to add |
|---|---|
| Live scoring match end (`live_scoreboard_screen.dart`) | Trigger `aggregateStats` job |
| Tournament finish | Award trophy via `user_achievements`; surface on leaderboard |
| Turf booking complete | `xp_event(source='booking', amount=10)` |
| Game hosting (`host_game_provider.dart`) | XP event on successful host; bonus per participant |
| Friend system (`my_friends_screen.dart`) | Keep separate from `follows` — friends mutual, follows one-way; mirror both into UI as appropriate |
| Chat (`conversations_screen.dart`) | Reject DM if `blocked_users` row exists in either direction; reject if `privacy_flags.allowDM = false` from a non-followed user |
| Apply-as-coach approval | Flip `verified_id = true` and a separate `is_coach` flag; surface coach badge on profile |
| Reels upload UI | API layer hard-rejects `type='reel'` writes when `users.is_reels_creator = false` |

---

## 7. Privacy & Security

- **Enforce privacy at the API layer.** Public profile responses must redact stats, teams, activity per `privacy_flags`. Client-side hiding is not a substitute.
- **Block enforcement bidirectional.** Every social endpoint — follow, message, profile view, game invite, team invite — must check `blocked_users` in both directions before returning data.
- **Rate limits.**
  - `POST /user/profile/:userId/follow` — 10 per minute per user.
  - `GET /user/profile/:userId` — 60 per minute per viewer.
  - `POST /user/profile/:userId/report` — 5 per day per user.
- **Image upload.** Server-side MIME + size validation (5MB photo, 50MB reel). Generate thumbnails server-side. Reels run an NSFW scan before becoming visible.
- **PII visibility.** `dob`, `phone`, `email`, exact lat/lng never returned on the public profile — only on `/me`.
- **Profile view recording.** Skip self-views. Debounce same `(viewer, viewed)` pair to one record per hour to avoid log spam.
- **Reels API gating.** Even if a client somehow constructs a reel POST, the server returns 403 unless `is_reels_creator = true`. Log all attempts for admin audit.
- **Field-level auth on PATCH `/me`.** Don't let the client set `xp`, `level`, `is_reels_creator`, `verified_*`, `profile_views_count`. Whitelist editable fields only.

---

## 8. Open Questions / Sanity Checks Before Build

1. **Does the scoring backend already emit a "match completed" event?** If not, that is a prerequisite — without it every stat is fiction.
2. **Booking ↔ Match cardinality.** Is one booking always one match? Round-robin tournaments may have many; `match_participants.match_id` must point at the *match*, not the booking.
3. **`users.id` type.** Spec assumes UUID — verify against the existing schema.
4. **Existing `friends` table shape.** Decide whether to keep `follows` and `friends` as separate concepts (recommended) or migrate one into the other.
5. **Storage backend.** Avatars, covers, photos, reels need a CDN-fronted bucket (S3 + CloudFront, or Cloudinary). Do not store binaries in Postgres.
6. **Existing reels schema.** Check `docs/REELS_PERFORMANCE_BACKEND.md` — there may already be a reels table to extend rather than `player_media` being a fresh table.
7. **Sport list canonicalization.** `player_stats.sport`, `match_participants.sport`, `skill_levels` keys all need to use the same enum/string set. Define it once.
8. **Search performance.** `/user/profile/search` with filters (`sport`, `skill`, `city`, `availability`) will need indexes on the JSONB fields and possibly Postgres trigram / pg_trgm for name search.
9. **Soft delete vs hard delete.** Account deletion is Play Store-required — decide whether `users` rows are deleted, anonymized, or flagged with `deleted_at` so historical match data survives.
10. **Webhook to Flutter.** Should `lastSeenAt` update via heartbeat from the client, or be derived server-side from the most recent authenticated request? Server-side is cheaper but less precise.

---

## 9. Out of Scope (for this spec)

- Reels feed ranking algorithm — covered separately in `docs/REELS_PERFORMANCE_BACKEND.md`.
- Push notifications wiring for follow / review events — handled by the existing notification system; only the event triggers are new.
- Admin dashboard for whitelisting reel creators — a separate internal-tool spec.
- Monetization tiers / Pro subscription — not part of v1.
- Cross-promo with coaches & academies — already has its own flow; this spec only references the badge.
