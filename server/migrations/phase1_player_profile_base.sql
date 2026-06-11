-- Phase 1 — Player Profile backend base schema
-- Spec: docs/superpowers/specs/2026-06-10-player-profile-backend.md
--
-- Effects:
--   1. Adds Player Profile columns to "User" (16 new fields, all defaulted)
--   2. Reconciles any "UserProfile" data into "User" where the User column is
--      empty (defensive — UserProfile mirrored fields that already live on
--      User, but we don't trust that history is leak-free).
--   3. Drops "UserProfile" — superseded by the User row.
--   4. Creates "BlockedUser" (bidirectional block enforcement).
--   5. Creates "XpEvent" (ledger; sum drives User.xp).
--   6. Adds indexes: username, lastSeen DESC, BlockedUser(blockedId),
--      XpEvent(userId, createdAt DESC).
--
-- Safety:
--   - All ALTERs are IF NOT EXISTS.
--   - Reconcile uses COALESCE / array-length guards so it never overwrites a
--     non-empty User field.
--   - CREATE INDEX CONCURRENTLY at the bottom; must NOT run inside a txn.
--   - Re-runnable.
--
-- The "is_reels_creator" column from the spec is intentionally OMITTED — reels
-- gating is descoped from Phase 1.

-- =============================================================================
-- 1. Extend "User" with Player Profile columns
-- =============================================================================
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "coverImage"          TEXT,
  ADD COLUMN IF NOT EXISTS "preferredFoot"       TEXT,
  ADD COLUMN IF NOT EXISTS "preferredHand"       TEXT,
  ADD COLUMN IF NOT EXISTS "languages"           TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "travelRadiusKm"      INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS "lookingFor"          TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "skillLevels"         JSONB   NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "preferredPositions"  JSONB   NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "availability"        JSONB   NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "privacyFlags"        JSONB   NOT NULL DEFAULT '{"showOnMap":true,"allowDM":true,"statsPublic":true}'::jsonb,
  ADD COLUMN IF NOT EXISTS "xp"                  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "level"               INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "verifiedPhone"       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "verifiedEmail"       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "verifiedId"          BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "profileViewsCount"   INTEGER NOT NULL DEFAULT 0;

-- =============================================================================
-- 2. Reconcile UserProfile -> User before dropping UserProfile.
--    Only sets User columns that are NULL or empty.
--    No-op when UserProfile table is already gone.
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'UserProfile'
  ) THEN
    UPDATE "User" u
       SET "bio"        = COALESCE(NULLIF(u."bio", ''),        p."bio"),
           "gender"     = COALESCE(NULLIF(u."gender", ''),     p."gender"),
           "dob"        = COALESCE(u."dob",                    p."dob"),
           "city"       = COALESCE(NULLIF(u."city", ''),       p."city"),
           "state"      = COALESCE(NULLIF(u."state", ''),      p."state"),
           "latitude"   = COALESCE(u."latitude",               p."latitude"),
           "longitude"  = COALESCE(u."longitude",              p."longitude"),
           "interests"  = CASE
                            WHEN COALESCE(array_length(u."interests", 1), 0) = 0
                              THEN COALESCE(p."interests", u."interests")
                            ELSE u."interests"
                          END,
           "sportTypes" = CASE
                            WHEN COALESCE(array_length(u."sportTypes", 1), 0) = 0
                              THEN COALESCE(p."sportTypes", u."sportTypes")
                            ELSE u."sportTypes"
                          END
      FROM "UserProfile" p
     WHERE p."userId" = u."id";
  END IF;
END $$;

-- =============================================================================
-- 3. Drop UserProfile
-- =============================================================================
DROP TABLE IF EXISTS "UserProfile" CASCADE;

-- =============================================================================
-- 4. BlockedUser — bidirectional block table
-- =============================================================================
CREATE TABLE IF NOT EXISTS "BlockedUser" (
  "blockerId" TEXT      NOT NULL,
  "blockedId" TEXT      NOT NULL,
  "reason"    TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BlockedUser_pkey"        PRIMARY KEY ("blockerId", "blockedId"),
  CONSTRAINT "BlockedUser_no_self"     CHECK ("blockerId" <> "blockedId"),
  CONSTRAINT "BlockedUser_blocker_fk"  FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "BlockedUser_blocked_fk"  FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- =============================================================================
-- 5. XpEvent — XP ledger. Sum of amounts drives User.xp; recompute job sets level.
-- =============================================================================
CREATE TABLE IF NOT EXISTS "XpEvent" (
  "id"          TEXT         NOT NULL,
  "userId"      TEXT         NOT NULL,
  "source"      TEXT         NOT NULL,
  "amount"      INTEGER      NOT NULL,
  "referenceId" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "XpEvent_pkey"    PRIMARY KEY ("id"),
  CONSTRAINT "XpEvent_user_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- =============================================================================
-- 6. Indexes (CONCURRENTLY — must run outside any explicit transaction block)
-- =============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_username_idx"         ON "User"("username");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_lastSeen_idx"         ON "User"("lastSeen" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "BlockedUser_blockedId_idx" ON "BlockedUser"("blockedId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "XpEvent_userId_createdAt_idx" ON "XpEvent"("userId", "createdAt" DESC);
