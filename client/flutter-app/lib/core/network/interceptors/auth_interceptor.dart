import 'dart:async';

import 'package:dio/dio.dart';

import '../../storage/secure_token_store.dart';

/// Attaches `Authorization: Bearer <token>` and recovers from
/// `TOKEN_EXPIRED` 401s by transparently refreshing once and replaying the
/// original request.
///
/// Concurrency: many requests can fire in parallel and all hit 401 at the
/// same time. We share a single in-flight refresh via [_refreshCompleter]
/// so we don't burn N refresh round-trips (which would also race the
/// backend's reuse-detection grace period at §3).
///
/// Loop prevention: the refresh call goes through [refreshDio], a sibling
/// Dio instance that does NOT have this interceptor — so a 401 on the
/// refresh endpoint itself can't trigger another refresh.
class AuthInterceptor extends Interceptor {
  final SecureTokenStore tokenStore;
  final Dio refreshDio;
  final Dio dio;

  /// Called when refresh fails (server returns 401 / TOKEN_COMPROMISE).
  /// Wire this from your auth controller to force a logout + nav to login.
  void Function()? onAuthFailure;

  /// Endpoint paths (without baseUrl) that should NOT receive the
  /// Authorization header even if a token exists — login/register/refresh.
  static const _publicPaths = <String>{
    '/user/auth/login',
    '/user/auth/login-step1',
    '/user/auth/register',
    '/user/auth/send-otp',
    '/user/auth/verify-otp',
    '/user/auth/google-auth',
    '/user/auth/forgot-password-otp',
    '/user/auth/reset-password',
    '/user/auth/refresh-token',
    '/owner/auth/login',
    '/owner/auth/register',
    '/owner/auth/google-auth',
    '/owner/auth/refresh-token',
  };

  Completer<String?>? _refreshCompleter;

  AuthInterceptor({
    required this.tokenStore,
    required this.refreshDio,
    required this.dio,
    this.onAuthFailure,
  });

  bool _isPublic(String path) => _publicPaths.any((p) => path.endsWith(p));

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (_isPublic(options.path)) {
      return handler.next(options);
    }

    final token = await tokenStore.accessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final status = err.response?.statusCode;
    if (status != 401) return handler.next(err);

    // Don't loop on the refresh endpoint itself.
    if (_isPublic(err.requestOptions.path)) return handler.next(err);

    final body = err.response?.data;
    final code = body is Map<String, dynamic>
        ? (body['error'] is Map ? (body['error'] as Map)['code'] : null)
        : null;

    // We only auto-refresh for TOKEN_EXPIRED. Anything else (INVALID_TOKEN,
    // NO_TOKEN, TOKEN_COMPROMISE_DETECTED) means the session is dead —
    // wipe it and let the caller handle.
    if (code != 'TOKEN_EXPIRED') {
      if (code == 'TOKEN_COMPROMISE_DETECTED' || code == 'INVALID_TOKEN') {
        await tokenStore.clear();
        onAuthFailure?.call();
      }
      return handler.next(err);
    }

    try {
      // Single in-flight refresh shared across concurrent 401s.
      final completer = _refreshCompleter ??= _runRefresh();
      final newAccess = await completer.future;
      if (newAccess == null) {
        await tokenStore.clear();
        onAuthFailure?.call();
        return handler.next(err);
      }

      // Replay original request with the new token.
      final req = err.requestOptions;
      req.headers['Authorization'] = 'Bearer $newAccess';
      final resp = await dio.fetch<dynamic>(req);
      handler.resolve(resp);
    } catch (e) {
      await tokenStore.clear();
      onAuthFailure?.call();
      handler.next(err);
    }
  }

  Completer<String?> _runRefresh() {
    final completer = Completer<String?>();
    Future(() async {
      try {
        final refresh = await tokenStore.refreshToken();
        if (refresh == null) return completer.complete(null);

        final resp = await refreshDio.post<Map<String, dynamic>>(
          '/user/auth/refresh-token',
          data: {'refreshToken': refresh},
        );

        // Server may return either the new flat envelope or legacy shape.
        // Read defensively.
        final body = resp.data ?? const <String, dynamic>{};
        final data = (body['data'] ?? body) as Map<String, dynamic>;
        final tokens = (data['tokens'] ?? data) as Map<String, dynamic>;

        final newAccess = (tokens['accessToken'] ?? tokens['token']) as String?;
        final newRefresh = tokens['refreshToken'] as String?;
        final expiresAtIso = tokens['accessTokenExpiresAt'] as String?;
        final expiresIn = tokens['expiresIn'] as int?;

        if (newAccess == null) return completer.complete(null);

        final expiresAt = expiresAtIso != null
            ? DateTime.parse(expiresAtIso)
            : DateTime.now().add(Duration(seconds: expiresIn ?? 15 * 60));

        await tokenStore.save(
          access: newAccess,
          refresh: newRefresh ?? refresh,
          expiresAt: expiresAt,
        );
        completer.complete(newAccess);
      } catch (e) {
        completer.complete(null);
      } finally {
        _refreshCompleter = null;
      }
    });
    return completer;
  }
}
