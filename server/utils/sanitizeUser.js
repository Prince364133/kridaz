/**
 * Strip secrets from a Prisma user row before serialising over the wire.
 *
 * What gets removed:
 *   - password       — argon2 hash, MUST never leave the server
 *   - fcmToken       — push token; not secret per se but pollutes responses
 *   - googleId       — auth provider id; we don't surface it to clients
 *   - refreshTokens  — relation array (sometimes included accidentally)
 *   - tokenVersion   — internal counter for /logout-all session invalidation;
 *                      clients have no reason to see it
 *
 * If a route also includes `ownerProfile`, its fields are passed through
 * untouched — owner profiles don't carry secrets in this schema.
 *
 * Safe with null/undefined input.
 */
export const sanitizeUser = (u) => {
  if (!u) return null;
  const { password, fcmToken, googleId, refreshTokens, tokenVersion, _count, ...safe } = u;
  return safe;
};

/**
 * Sanitize an array of user rows.
 */
export const sanitizeUsers = (rows) =>
  Array.isArray(rows) ? rows.map(sanitizeUser) : [];

/**
 * Shape version of the auth user payload returned by /getMe, /google-auth,
 * /login, /signup. Flutter gates on this so we can extend the shape without
 * breaking older clients. Bump when fields are added/removed at the top level.
 *   1 — legacy
 *   2 — Player Profile Phase 1: coverImage, languages, lookingFor, skillLevels,
 *       preferredPositions, availability, privacyFlags, xp, level,
 *       verifiedPhone/Email/Id, profileViewsCount, followersCount,
 *       followingCount.
 */
export const PROFILE_SHAPE_VERSION = 2;

/**
 * Build the auth-user payload used by getMe and googleAuth so both endpoints
 * stay structurally identical (Flutter's auth_manager calls getMe right after
 * google-auth today; matching shapes removes that round-trip).
 *
 * Pass the Prisma row with `include: { _count: { select: { followers: true,
 * following: true } } }` to get accurate counts; missing _count falls back
 * to 0 so the field is always present.
 */
export const buildAuthUserPayload = (user) => {
  if (!user) return null;
  const followersCount = user._count?.followers ?? 0;
  const followingCount = user._count?.following ?? 0;
  return {
    ...sanitizeUser(user),
    followersCount,
    followingCount,
    profileShapeVersion: PROFILE_SHAPE_VERSION,
  };
};
