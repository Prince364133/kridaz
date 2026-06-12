import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Keystore (Android) / Keychain (iOS)-backed storage for auth tokens.
///
/// Do NOT use SharedPreferences for tokens — on rooted Android the file is
/// world-readable. flutter_secure_storage encrypts at rest via:
///   • Android: EncryptedSharedPreferences + AES key in Keystore
///   • iOS:     Keychain with `first_unlock` accessibility (survives lock
///              but not iCloud backup)
///
/// The store also keeps the access-token expiry so [accessToken] can return
/// `null` BEFORE expiry — signalling AuthInterceptor to refresh proactively
/// instead of round-tripping a guaranteed-to-fail request first.
class SecureTokenStore {
  static const _kAccess = 'kridaz_access_token';
  static const _kRefresh = 'kridaz_refresh_token';
  static const _kExpiry = 'kridaz_access_expiry';

  final FlutterSecureStorage _storage;

  /// Refresh this many seconds before actual expiry, so an in-flight request
  /// can't race the clock and fail.
  final Duration refreshSkew;

  SecureTokenStore({
    FlutterSecureStorage? storage,
    this.refreshSkew = const Duration(seconds: 30),
  }) : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(
                accessibility: KeychainAccessibility.first_unlock,
              ),
            );

  Future<void> save({
    required String access,
    required String refresh,
    required DateTime expiresAt,
  }) async {
    await Future.wait([
      _storage.write(key: _kAccess, value: access),
      _storage.write(key: _kRefresh, value: refresh),
      _storage.write(key: _kExpiry, value: expiresAt.toUtc().toIso8601String()),
    ]);
  }

  /// Returns the access token if it's still valid (with [refreshSkew]
  /// headroom). Returns `null` when expired or missing — AuthInterceptor
  /// reads this and triggers a refresh BEFORE making the outbound call.
  Future<String?> accessToken() async {
    final expIso = await _storage.read(key: _kExpiry);
    if (expIso != null) {
      final exp = DateTime.tryParse(expIso);
      if (exp != null &&
          exp.isBefore(DateTime.now().toUtc().add(refreshSkew))) {
        return null;
      }
    }
    return _storage.read(key: _kAccess);
  }

  /// Bypasses the expiry check — returns whatever is stored. Use only when
  /// you specifically need the raw value (e.g. forced refresh).
  Future<String?> accessTokenRaw() => _storage.read(key: _kAccess);

  Future<String?> refreshToken() => _storage.read(key: _kRefresh);

  Future<DateTime?> expiresAt() async {
    final iso = await _storage.read(key: _kExpiry);
    return iso == null ? null : DateTime.tryParse(iso);
  }

  Future<bool> get hasSession async =>
      (await _storage.read(key: _kRefresh)) != null;

  /// Wipe everything. Call on:
  ///   • explicit logout
  ///   • server returns `TOKEN_COMPROMISE_DETECTED`
  ///   • refresh attempt fails terminally
  Future<void> clear() async {
    await Future.wait([
      _storage.delete(key: _kAccess),
      _storage.delete(key: _kRefresh),
      _storage.delete(key: _kExpiry),
    ]);
  }
}
