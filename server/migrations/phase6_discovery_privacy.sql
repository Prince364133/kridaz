-- Phase 6 — Discovery + privacy (UserReport, ProfileView, supporting indexes)
-- Spec: docs/superpowers/specs/2026-06-10-player-profile-backend.md
--
-- Effects:
--   1. UserReport — moderation queue for reports against a user profile.
--      Mirrors PostReport. Reviewed off-platform via admin tooling.
--   2. ProfileView — "who viewed me". One row per viewer-target per UTC day
--      (the (viewerId, viewedId, dayBucket) unique constraint enforces this).
--      Older rows are pruned by an off-platform sweep job.
--   3. Adds User(city) and User(state) indexes — the discovery endpoint
--      filters on these and the existing User table has neither.
--
-- Safety:
--   - Idempotent: IF NOT EXISTS guards on every object.
--   - CREATE INDEX CONCURRENTLY runs OUTSIDE any transaction — run this
--     file via `psql -f`, not inside BEGIN/COMMIT.

-- =============================================================================
-- 1. UserReport
-- =============================================================================
CREATE TABLE IF NOT EXISTS "UserReport" (
  "id"         TEXT         NOT NULL,
  "reporterId" TEXT         NOT NULL,
  "reportedId" TEXT         NOT NULL,
  "reason"     TEXT         NOT NULL,
  "details"    TEXT,
  "status"     TEXT         NOT NULL DEFAULT 'PENDING',
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserReport_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "UserReport_reporter_fk" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "UserReport_reported_fk" FOREIGN KEY ("reportedId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "UserReport_reportedId_status_idx"
  ON "UserReport"("reportedId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "UserReport_reporterId_idx"
  ON "UserReport"("reporterId");

-- =============================================================================
-- 2. ProfileView
-- =============================================================================
CREATE TABLE IF NOT EXISTS "ProfileView" (
  "id"        TEXT         NOT NULL,
  "viewerId"  TEXT         NOT NULL,
  "viewedId"  TEXT         NOT NULL,
  "viewedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dayBucket" TEXT         NOT NULL,

  CONSTRAINT "ProfileView_pkey"      PRIMARY KEY ("id"),
  CONSTRAINT "ProfileView_viewer_fk" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "ProfileView_viewed_fk" FOREIGN KEY ("viewedId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "ProfileView_viewer_viewed_day_uq"
  ON "ProfileView"("viewerId", "viewedId", "dayBucket");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ProfileView_viewedId_viewedAt_idx"
  ON "ProfileView"("viewedId", "viewedAt" DESC);

-- =============================================================================
-- 3. Discovery-supporting User indexes
--    (sportTypes is already a String[] — array contains is index-able via GIN
--    only if added explicitly; keep simple btree for city/state today.)
-- =============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_city_idx"  ON "User"("city");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_state_idx" ON "User"("state");
