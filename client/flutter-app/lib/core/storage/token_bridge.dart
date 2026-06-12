import 'dart:convert';

import 'secure_token_store.dart';

/// Bridge between the legacy [AuthManager] (which stores the access token in
/// SharedPreferences) and the new [SecureTokenStore] (which the new
/// [ApiClient] reads from).
///
/// The old stack continues to own the authoritative token + cookie-based
/// refresh. Every time it writes a new token, it calls
/// [TokenBridge.publish] so the new stack stays in sync.
///
/// Why this exists: refactoring AuthManager + all 70 existing screens onto
/// the new stack in one PR would brick the app. The bridge lets us migrate
/// feature-by-feature while keeping both stacks coherent.
class TokenBridge {
  TokenBridge._();

  static SecureTokenStore? _store;

  /// Wire the bridge once at app bootstrap. After this call, [publish] /
  /// [clear] become hot.
  static void bind(SecureTokenStore store) {
    _store = store;
  }

  /// Mirror an access token into [SecureTokenStore]. Safe to call when the
  /// bridge isn't bound yet (no-op).
  ///
  /// The expiry is read from the JWT `exp` claim when possible, falling
  /// back to 14 minutes (the backend issues 15-minute access tokens; we
  /// give ourselves 1 min of skew).
  static Future<void> publish(String accessToken) async {
    final store = _store;
    if (store == null || accessToken.isEmpty) return;

    final expiresAt = _readJwtExpiry(accessToken) ??
        DateTime.now().toUtc().add(const Duration(minutes: 14));

    await store.save(
      access: accessToken,
      refresh: accessToken, // see TokenBridge note below
      expiresAt: expiresAt,
    );
  }

  /// Wipe both stores on logout.
  static Future<void> clear() async {
    await _store?.clear();
  }

  static DateTime? _readJwtExpiry(String jwt) {
    try {
      final parts = jwt.split('.');
      if (parts.length != 3) return null;
      final payload = parts[1];
      final normalized = base64.normalize(payload);
      final json = jsonDecode(utf8.decode(base64.decode(normalized)))
          as Map<String, dynamic>;
      final exp = json['exp'];
      if (exp is num) {
        return DateTime.fromMillisecondsSinceEpoch(exp.toInt() * 1000,
            isUtc: true);
      }
    } catch (_) {/* fall through */}
    return null;
  }
}

// ── Why refresh: accessToken ────────────────────────────────────────────
// The new SecureTokenStore expects both access and refresh tokens. The
// legacy stack keeps the refresh token in an HttpOnly cookie that this
// process can't read. We store the access token in BOTH fields so the new
// AuthInterceptor sees "a refresh token exists" and attempts one refresh
// before signing the user out. If that refresh call hits the backend,
// the cookie-bearing dio is the LEGACY one (because we share no jar yet)
// — so it will fail and trigger onAuthFailure, which calls
// AuthManager().signOut(). For now that's acceptable: most sessions
// complete within the 15-minute access window. A future PR can wire the
// legacy CookieJar into the new dio so the new stack can refresh too.
