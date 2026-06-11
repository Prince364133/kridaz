/**
 * Canonical sport identifiers used across the platform.
 *
 * Historically the codebase has accepted variants:
 *   - HostedGame.gameType: "CRICKET" | "Cricket" | "cricket" | "T20" | "ODI" |
 *     "TEST" | "QUICK" | "SCORING_MATCH" | "OTHER"
 *   - Team.sportType:         defaults to "CRICKET"
 *   - PlayerCareerStats.sportType: defaults to "CRICKET"
 *   - User.sportTypes:        free-form array, tests use "FOOTBALL", "Rugby" etc.
 *
 * Going forward, every column that stores "a sport" must use one of the
 * SPORTS values below. Use `normalizeSport()` at the boundary (e.g. when
 * reading HostedGame.gameType inside aggregateStats) to convert legacy
 * variants. Anything that doesn't match returns null — callers decide
 * whether to default or skip.
 */

export const SPORTS = Object.freeze({
  CRICKET:    'CRICKET',
  FOOTBALL:   'FOOTBALL',
  BASKETBALL: 'BASKETBALL',
  TENNIS:     'TENNIS',
  BADMINTON:  'BADMINTON',
  VOLLEYBALL: 'VOLLEYBALL',
  KABADDI:    'KABADDI',
  PICKLEBALL: 'PICKLEBALL',
});

export const SPORT_LIST = Object.values(SPORTS);

// Legacy variants that should normalize to a canonical sport. Cricket-format
// strings (T20/ODI/TEST/QUICK/SCORING_MATCH) all collapse to CRICKET because
// they describe match length, not the sport itself. Keep this aligned with
// CRICKET_GAME_TYPES in scoring.service.js.
const ALIASES = new Map([
  ['cricket', SPORTS.CRICKET],
  ['scoring_match', SPORTS.CRICKET],
  ['t20', SPORTS.CRICKET],
  ['odi', SPORTS.CRICKET],
  ['test', SPORTS.CRICKET],
  ['quick', SPORTS.CRICKET],
  ['football', SPORTS.FOOTBALL],
  ['soccer', SPORTS.FOOTBALL],
  ['basketball', SPORTS.BASKETBALL],
  ['tennis', SPORTS.TENNIS],
  ['badminton', SPORTS.BADMINTON],
  ['volleyball', SPORTS.VOLLEYBALL],
  ['kabaddi', SPORTS.KABADDI],
  ['pickleball', SPORTS.PICKLEBALL],
]);

/**
 * Returns the canonical SPORTS value for an input string, or null if the
 * input cannot be resolved to a known sport. Case-insensitive.
 */
export const normalizeSport = (input) => {
  if (!input || typeof input !== 'string') return null;
  const key = input.trim().toLowerCase();
  if (!key) return null;
  return ALIASES.get(key) ?? null;
};

/**
 * True when `s` is one of the canonical SPORTS values (NOT a legacy alias).
 * Use at API boundaries to validate query params.
 */
export const isCanonicalSport = (s) => typeof s === 'string' && SPORT_LIST.includes(s);
