-- Phase 5 — Profile media gallery (cover image already lives on User.coverImage from Phase 1)
-- Spec: docs/superpowers/specs/2026-06-10-player-profile-backend.md
--
-- Effects:
--   1. Creates "PlayerMedia" — the photo gallery surface shown on a player's
--      public profile. Reels keep living on the existing `Reel` table; this
--      row stores still photos (type = 'photo'). The `type` column is kept
--      so we can later promote reel references into the same gallery feed
--      without another migration.
--   2. Adds indexes for the two query shapes the controller uses:
--        - GET /player/:id/media?type=photo  (userId + type + createdAt desc)
--        - pinned-first ordering in the profile hero (userId + isPinned)
--
-- Safety:
--   - Idempotent: IF NOT EXISTS guards on table + indexes.
--   - CREATE INDEX CONCURRENTLY runs OUTSIDE any transaction. Do not wrap
--     this file in BEGIN/COMMIT — run via psql -f, not inside a tx block.

-- =============================================================================
-- 1. PlayerMedia table
-- =============================================================================
CREATE TABLE IF NOT EXISTS "PlayerMedia" (
  "id"           TEXT         NOT NULL,
  "userId"       TEXT         NOT NULL,
  "type"         TEXT         NOT NULL,
  "url"          TEXT         NOT NULL,
  "thumbnailUrl" TEXT,
  "matchId"      TEXT,
  "caption"      TEXT,
  "tags"         TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
  "isPinned"     BOOLEAN      NOT NULL DEFAULT false,
  "viewCount"    INTEGER      NOT NULL DEFAULT 0,
  "likeCount"    INTEGER      NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PlayerMedia_pkey"    PRIMARY KEY ("id"),
  CONSTRAINT "PlayerMedia_user_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- =============================================================================
-- 2. Indexes
-- =============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PlayerMedia_userId_type_createdAt_idx"
  ON "PlayerMedia"("userId", "type", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "PlayerMedia_userId_isPinned_idx"
  ON "PlayerMedia"("userId", "isPinned");
