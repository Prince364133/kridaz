-- Phase 4 — Achievements catalog + XP / Level + UserBadge → UserAchievement
-- Spec: docs/superpowers/specs/2026-06-10-player-profile-backend.md
--
-- Effects:
--   1. Creates "Achievement" catalog + "UserAchievement" join.
--   2. Seeds the catalog with the 10 in-flight badge codes (the 6 from
--      careerStats.service.js plus the 4 from scoring.service.js).
--   3. Migrates "UserBadge" rows into "UserAchievement", matching badge.name
--      to the seeded Achievement.code. Unmatched names get a generic
--      catalog row created on the fly (so no earned badge is lost).
--   4. Drops "UserBadge".
--
-- Safety:
--   - Idempotent: IF NOT EXISTS guards, ON CONFLICT DO NOTHING on inserts.
--   - Migration only runs if UserBadge still exists.
--   - CREATE INDEX CONCURRENTLY runs outside any transaction.

-- =============================================================================
-- 1. Achievement catalog
-- =============================================================================
CREATE TABLE IF NOT EXISTS "Achievement" (
  "id"          TEXT         NOT NULL,
  "code"        TEXT         NOT NULL,
  "name"        TEXT         NOT NULL,
  "description" TEXT,
  "iconUrl"     TEXT,
  "tier"        TEXT         NOT NULL DEFAULT 'bronze',
  "sport"       TEXT,
  "criteria"    JSONB        NOT NULL DEFAULT '{}'::jsonb,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Achievement_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "Achievement_code_unique" UNIQUE ("code")
);

-- =============================================================================
-- 2. UserAchievement join
-- =============================================================================
CREATE TABLE IF NOT EXISTS "UserAchievement" (
  "userId"        TEXT         NOT NULL,
  "achievementId" TEXT         NOT NULL,
  "awardedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "context"       JSONB        NOT NULL DEFAULT '{}'::jsonb,

  CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("userId", "achievementId"),
  CONSTRAINT "UserAchievement_user_fk"        FOREIGN KEY ("userId")        REFERENCES "User"("id")        ON DELETE CASCADE,
  CONSTRAINT "UserAchievement_achievement_fk" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE
);

-- =============================================================================
-- 3. Seed the catalog. Codes match what awardAchievement() expects.
-- =============================================================================
INSERT INTO "Achievement" ("id", "code", "name", "description", "tier", "sport", "criteria") VALUES
  (gen_random_uuid(), 'centurion',           'Centurion',           'Scored 100+ runs in a single match.',                              'gold',   'CRICKET', '{"type":"per_match","metric":"runs","min":100}'::jsonb),
  (gen_random_uuid(), 'fifer_master',        'Fifer Master',        'Five-wicket haul in an innings.',                                  'gold',   'CRICKET', '{"type":"per_match","metric":"wickets","min":5}'::jsonb),
  (gen_random_uuid(), 'sixer_king',          'Sixer King',          '5+ sixes in a single innings.',                                    'silver', 'CRICKET', '{"type":"per_match","metric":"sixes","min":5}'::jsonb),
  (gen_random_uuid(), 'anchor',              'Anchor',              'Anchored the innings with 50+ runs at SR < 100.',                  'silver', 'CRICKET', '{"type":"per_match","metric":"runs","min":50,"maxStrikeRate":100}'::jsonb),
  (gen_random_uuid(), 'veteran',             'Veteran',             '100 career matches.',                                              'gold',   'CRICKET', '{"type":"career_matches","min":100}'::jsonb),
  (gen_random_uuid(), 'invincible',          'Invincible',          '10 career wins.',                                                  'silver', NULL,      '{"type":"career_wins","min":10,"xpReward":50}'::jsonb),
  (gen_random_uuid(), 'rising_star',         'Rising Star',         'Played your first match on Kridaz.',                               'bronze', NULL,      '{"type":"career_matches","min":1}'::jsonb),
  (gen_random_uuid(), 'century_maker',       'Century Maker',       '100 career runs.',                                                 'silver', 'CRICKET', '{"type":"career_runs","min":100}'::jsonb),
  (gen_random_uuid(), 'wicket_machine',      'Wicket Machine',      '10 career wickets.',                                               'silver', 'CRICKET', '{"type":"career_wickets","min":10}'::jsonb),
  (gen_random_uuid(), 'safe_hands',          'Safe Hands',          '5 career catches.',                                                'bronze', 'CRICKET', '{"type":"career_catches","min":5}'::jsonb),
  (gen_random_uuid(), 'milestone_10_matches','10 Matches',          '10 career matches.',                                               'bronze', NULL,      '{"type":"career_matches","min":10}'::jsonb),
  (gen_random_uuid(), 'milestone_50_matches','50 Matches',          '50 career matches.',                                               'silver', NULL,      '{"type":"career_matches","min":50}'::jsonb),
  (gen_random_uuid(), 'milestone_100_matches','100 Matches',        '100 career matches.',                                              'gold',   NULL,      '{"type":"career_matches","min":100,"xpReward":100}'::jsonb),
  (gen_random_uuid(), 'milestone_500_matches','500 Matches',        '500 career matches.',                                              'trophy', NULL,      '{"type":"career_matches","min":500,"xpReward":500}'::jsonb),
  (gen_random_uuid(), 'first_century',      'First Century',        'Scored your first century.',                                       'trophy', 'CRICKET', '{"type":"career_centuries","min":1,"xpReward":250}'::jsonb)
ON CONFLICT ("code") DO NOTHING;

-- =============================================================================
-- 4. Migrate UserBadge rows -> UserAchievement.
--    Only runs when UserBadge still exists. Catalog-unknown names get a
--    catalog row materialized so no earned badge is lost.
-- =============================================================================
DO $$
DECLARE
  rec RECORD;
  ach_id TEXT;
  ach_code TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'UserBadge') THEN
    RAISE NOTICE 'UserBadge not present — skipping migration step';
    RETURN;
  END IF;

  FOR rec IN SELECT * FROM "UserBadge" LOOP
    -- Try to match by name -> seeded code (lower + underscored).
    ach_code := lower(regexp_replace(rec.name, '[^a-zA-Z0-9]+', '_', 'g'));

    SELECT "id" INTO ach_id FROM "Achievement" WHERE "code" = ach_code;

    IF ach_id IS NULL THEN
      -- Materialize a catalog row for any user-visible badge we don't yet
      -- ship in the seed. Tier defaults to bronze; admin can curate later.
      ach_id := gen_random_uuid();
      INSERT INTO "Achievement" ("id", "code", "name", "description", "tier", "sport", "criteria")
      VALUES (ach_id, ach_code, rec.name, rec.description, 'bronze', rec."sportType",
              jsonb_build_object('migrated_from', 'UserBadge', 'category', rec.category, 'icon', rec."badgeIcon"));
    END IF;

    INSERT INTO "UserAchievement" ("userId", "achievementId", "awardedAt", "context")
    VALUES (rec."userId", ach_id, rec."earnedAt",
            jsonb_build_object('migrated_from', 'UserBadge', 'badgeIcon', rec."badgeIcon"))
    ON CONFLICT ("userId", "achievementId") DO NOTHING;
  END LOOP;
END $$;

-- =============================================================================
-- 5. Drop UserBadge after migration.
-- =============================================================================
DROP TABLE IF EXISTS "UserBadge" CASCADE;

-- =============================================================================
-- 6. Indexes
-- =============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS "UserAchievement_achievementId_idx"
  ON "UserAchievement"("achievementId");
