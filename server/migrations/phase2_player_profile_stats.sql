-- Phase 2 — Player Profile multi-sport stats
-- Spec: docs/superpowers/specs/2026-06-10-player-profile-backend.md
--
-- Effects:
--   1. Extends "PlayerCareerStats" with multi-sport + generic counters
--      (football fields, streak, MVP/MOTM, rating, hours).
--   2. Creates "MatchParticipant" — sport-agnostic per-match player row.
--      Powers recent matches, activity heatmap, and PlayerCareerStats
--      rebuilds; written by the playerStats queue worker.
--
-- Safety:
--   - ALTERs are IF NOT EXISTS.
--   - All new columns have NOT NULL defaults — existing cricket rows survive.
--   - CREATE INDEX CONCURRENTLY at the bottom; must NOT run inside a txn.
--   - Re-runnable.

-- =============================================================================
-- 1. PlayerCareerStats column additions
-- =============================================================================
ALTER TABLE "PlayerCareerStats"
  -- Generalized result tracking (draws were implicit before)
  ADD COLUMN IF NOT EXISTS "matchesDrawn"  INTEGER NOT NULL DEFAULT 0,
  -- Football
  ADD COLUMN IF NOT EXISTS "goalsScored"   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "assistsCount"  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "cleanSheets"   INTEGER NOT NULL DEFAULT 0,
  -- Cross-sport
  ADD COLUMN IF NOT EXISTS "currentStreak" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "longestStreak" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "mvpCount"      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "motmCount"     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "playerRating"  INTEGER NOT NULL DEFAULT 1200,
  ADD COLUMN IF NOT EXISTS "hoursPlayed"   DOUBLE PRECISION NOT NULL DEFAULT 0;

-- =============================================================================
-- 2. MatchParticipant
-- =============================================================================
CREATE TABLE IF NOT EXISTS "MatchParticipant" (
  "id"             TEXT         NOT NULL,
  "matchId"        TEXT         NOT NULL,
  "hostedGameId"   TEXT,
  "userId"         TEXT         NOT NULL,
  "teamId"         TEXT,
  "sport"          TEXT         NOT NULL,
  "role"           TEXT,
  "runs"           INTEGER,
  "wickets"        INTEGER,
  "goals"          INTEGER,
  "assists"        INTEGER,
  "minutesPlayed"  INTEGER,
  "isMotm"         BOOLEAN      NOT NULL DEFAULT FALSE,
  "result"         TEXT,
  "xpAwarded"      INTEGER      NOT NULL DEFAULT 0,
  "playedAt"       TIMESTAMP(3) NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MatchParticipant_pkey"    PRIMARY KEY ("id"),
  CONSTRAINT "MatchParticipant_user_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- =============================================================================
-- 3. Indexes (CONCURRENTLY — must run outside any explicit transaction block)
-- =============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS "MatchParticipant_userId_playedAt_idx"
  ON "MatchParticipant"("userId", "playedAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "MatchParticipant_matchId_idx"
  ON "MatchParticipant"("matchId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "MatchParticipant_hostedGameId_idx"
  ON "MatchParticipant"("hostedGameId");
