-- Phase 3 — Peer reviews / social proof
-- Spec: docs/superpowers/specs/2026-06-10-player-profile-backend.md
--
-- Effects:
--   1. Creates "PlayerReview" — per-match peer rating (sportsmanship,
--      punctuality, skill each 1..5, plus tags + free-text note).
--   2. Creates "PlayerReviewAggregate" — denormalized rollup per user
--      (averages, count, top tags), rebuilt incrementally on each review.
--
-- Safety:
--   - IF NOT EXISTS guards; re-runnable.
--   - CHECK constraints enforce 1..5 ratings and no-self-review on
--     PlayerReview.
--   - CREATE INDEX CONCURRENTLY at the bottom; must NOT run inside a txn.

-- =============================================================================
-- 1. PlayerReview
-- =============================================================================
CREATE TABLE IF NOT EXISTS "PlayerReview" (
  "id"            TEXT         NOT NULL,
  "matchId"       TEXT         NOT NULL,
  "hostedGameId"  TEXT,
  "reviewerId"    TEXT         NOT NULL,
  "revieweeId"    TEXT         NOT NULL,
  "sportsmanship" INTEGER      NOT NULL,
  "punctuality"   INTEGER      NOT NULL,
  "skill"         INTEGER      NOT NULL,
  "tags"          TEXT[]       NOT NULL DEFAULT '{}',
  "note"          TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PlayerReview_pkey"          PRIMARY KEY ("id"),
  CONSTRAINT "PlayerReview_unique_per_match" UNIQUE ("matchId", "reviewerId", "revieweeId"),
  CONSTRAINT "PlayerReview_no_self"       CHECK ("reviewerId" <> "revieweeId"),
  CONSTRAINT "PlayerReview_sportsmanship_range" CHECK ("sportsmanship" BETWEEN 1 AND 5),
  CONSTRAINT "PlayerReview_punctuality_range"   CHECK ("punctuality"   BETWEEN 1 AND 5),
  CONSTRAINT "PlayerReview_skill_range"         CHECK ("skill"         BETWEEN 1 AND 5),
  CONSTRAINT "PlayerReview_reviewer_fk"   FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "PlayerReview_reviewee_fk"   FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- =============================================================================
-- 2. PlayerReviewAggregate
-- =============================================================================
CREATE TABLE IF NOT EXISTS "PlayerReviewAggregate" (
  "userId"           TEXT             NOT NULL,
  "avgSportsmanship" DOUBLE PRECISION,
  "avgPunctuality"   DOUBLE PRECISION,
  "avgSkill"         DOUBLE PRECISION,
  "reviewCount"      INTEGER          NOT NULL DEFAULT 0,
  "topTags"          JSONB            NOT NULL DEFAULT '[]'::jsonb,
  "updatedAt"        TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PlayerReviewAggregate_pkey"    PRIMARY KEY ("userId"),
  CONSTRAINT "PlayerReviewAggregate_user_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- =============================================================================
-- 3. Indexes
-- =============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PlayerReview_revieweeId_createdAt_idx"
  ON "PlayerReview"("revieweeId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PlayerReview_reviewerId_idx"
  ON "PlayerReview"("reviewerId");
