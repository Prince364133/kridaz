import 'dart:async';
import 'dart:io';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:logger/logger.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import '../config/api_config.dart';
import '../core/network/interceptors/etag_interceptor.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  late Dio _dio;
  late Dio
      _refreshDio; // separate instance — no auth interceptor so refresh can't loop
  PersistCookieJar? _cookieJar;
  bool _isRefreshing = false;

  /// Every Dio that should track the central auth/refresh/correlation stack.
  /// Services that build their own Dio (rather than calling
  /// [ApiService.post]/[get]) get added here via [createSharedDio] so a
  /// token refresh propagates everywhere without each service re-reading
  /// SharedPreferences on every request.
  final List<Dio> _trackedDios = [];

  /// Shared across every tracked Dio so a cache hit on one service maps
  /// to the same `(path+query → etag, body)` entry on another. The cache
  /// is in-memory only — wiped on logout via [clearCache].
  final EtagInterceptor _etagInterceptor = EtagInterceptor();

  // Refresh token + access-token expiry, persisted so we survive cold starts.
  // The cookie jar covers web clients; mobile has to send the value in the
  // body — these fields hold what we got back on the last login/refresh.
  String? _refreshToken;
  DateTime? _accessTokenExpiresAt;

  // Proactive refresh — fires ~60s before access-token expiry so the next
  // user-initiated request doesn't pay a refresh round-trip on top of its
  // own latency. Cancelled on signOut / clearAuthToken.
  Timer? _proactiveRefreshTimer;
  static const _proactiveRefreshLeeway = Duration(seconds: 60);

  static const _kRefreshTokenKey = 'refresh_token';
  static const _kAccessExpiresAtKey = 'access_token_expires_at';

  // Payment endpoints that REQUIRE an Idempotency-Key per the backend
  // contract — sending a fresh UUID lets the server replay the original
  // response on retry instead of double-charging.
  static const Set<String> _idempotentPaymentPaths = {
    '/user/booking/create-order',
    '/user/booking/verify-payment',
    '/user/booking/book-with-wallet',
    '/user/wallet/topup/create-order',
    '/user/wallet/topup/verify',
    '/user/wallet/owner/withdraw',
  };

  final Logger _logger = Logger(
    printer: PrettyPrinter(
      methodCount: 0,
      errorMethodCount: 5,
      lineLength: 50,
      colors: true,
      printEmojis: true,
    ),
  );

  static String get _baseUrl => ApiConfig.apiUrl;

  final Map<String, CachedResponse> _cache = {};
  static const Duration _cacheDuration = Duration(minutes: 5);

  // Callbacks wired by AuthManager to avoid circular imports
  Function(String newToken)? onTokenRefreshed;
  Function()? onSessionExpired;
  // Fires when the server tells us all refresh tokens for this user were
  // revoked (REFRESH_TOKEN_REUSE) — UI should show a "logged out from all
  // devices" message instead of a generic session-expired toast.
  Function()? onRefreshTokenReuseDetected;

  /// Fires on every response/error carrying `Server-Version` or
  /// `Min-Client-Version` headers. The version notifier wires into this so
  /// the force-update gate stays current without polling.
  Function(String? serverVersion, String? minClientVersion)? onServerHeaders;

  static const _uuid = Uuid();

  ApiService._internal() {
    final baseOptions = BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Accept 304 as a non-error so the EtagInterceptor can substitute
      // the cached body in onResponse. Dio's default rejects anything
      // outside 2xx, which would shunt the ETag fast-path into the error
      // chain and break every polled endpoint.
      validateStatus: (s) => s != null && ((s >= 200 && s < 300) || s == 304),
    );

    _dio = Dio(baseOptions);
    _refreshDio = Dio(baseOptions.copyWith());

    _trackedDios.add(_dio);
    _dio.interceptors.add(_buildBaseInterceptor(_dio));
    _dio.interceptors.add(_etagInterceptor);

    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      // Print the full error envelope so we can diagnose 4xx/5xx from the
      // log — status code, error.code, message all land in stdout.
      error: true,
      logPrint: (obj) => _logger.d(obj),
    ));

    _initCookieJar();
  }

  /// Build the shared interceptor (correlation IDs, idempotency keys,
  /// auth-token attach, version-header capture, refresh-on-401,
  /// retry-on-429/409/timeout) bound to [targetDio] for any retry calls.
  /// Every Dio that wants the full contract behavior wires this in.
  Interceptor _buildBaseInterceptor(Dio targetDio) {
    return InterceptorsWrapper(
      onRequest: _onRequest,
      onResponse: _onResponse,
      onError: (err, handler) => _onError(err, handler, targetDio),
    );
  }

  /// Factory for service-owned Dios that should share the central auth /
  /// refresh / correlation stack. Pass overrides if the service needs a
  /// different timeout etc. The returned Dio is tracked so [setAuthToken]
  /// keeps its Authorization header in sync.
  static Dio createSharedDio({
    Duration? connectTimeout,
    Duration? receiveTimeout,
    Map<String, dynamic>? extraHeaders,
  }) {
    final inst = ApiService();
    final dio = Dio(BaseOptions(
      baseUrl: ApiConfig.apiUrl,
      connectTimeout: connectTimeout ?? const Duration(seconds: 30),
      receiveTimeout: receiveTimeout ?? const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...?extraHeaders,
      },
      // See note on the main Dio's validateStatus — 304 must reach the
      // success chain so EtagInterceptor can swap in the cached body.
      validateStatus: (s) => s != null && ((s >= 200 && s < 300) || s == 304),
    ));
    // Carry the current bearer token immediately so the first request
    // doesn't go out unauthenticated while the auth interceptor warms up.
    final tok = inst._dio.options.headers['Authorization'];
    if (tok != null) dio.options.headers['Authorization'] = tok;

    dio.interceptors.add(inst._buildBaseInterceptor(dio));
    dio.interceptors.add(inst._etagInterceptor);

    // Share the cookie jar so the refresh-cookie path (web parity) keeps
    // working across every Dio.
    final jar = inst._cookieJar;
    if (jar != null) dio.interceptors.add(CookieManager(jar));

    inst._trackedDios.add(dio);
    return dio;
  }

  Future<void> _initCookieJar() async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      _cookieJar = PersistCookieJar(
        storage: FileStorage('${dir.path}/.cookies/'),
        ignoreExpires: false,
      );
      // The cookie manager has to be added per Dio instance — Dios that
      // were created before this fired (any tracked Dio besides the main
      // one) won't see cookies. Service-owned Dios are typically built at
      // startup so this races; we add to whatever's tracked now, and the
      // factory adds to anything created later.
      for (final d in _trackedDios) {
        d.interceptors.add(CookieManager(_cookieJar!));
      }
      _refreshDio.interceptors.add(CookieManager(_cookieJar!));
    } catch (e) {
      _logger.e('Cookie jar init failed: $e');
    }
  }

  void _onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    _logger.i('🚀 ${options.method} ${options.path}');

    // X-Request-Id: correlate the call across server logs / Sentry. The
    // backend will propagate ours if we send one; otherwise it mints its
    // own. We keep ours stable across retries via `extra['requestId']`
    // so a retried request shows up as the same logical trace.
    final existing = options.extra['requestId'];
    final requestId =
        (existing is String && existing.isNotEmpty) ? existing : _uuid.v4();
    options.extra['requestId'] = requestId;
    options.headers['X-Request-Id'] = requestId;

    // Idempotency-Key: the caller mints a UUID once when the user taps "Pay"
    // and threads it through every retry of that single intent via
    // `options.extra['idempotencyKey']`. We forward it as the header the
    // backend expects.
    final idemKey = options.extra['idempotencyKey'];
    if (idemKey is String && idemKey.isNotEmpty) {
      options.headers['Idempotency-Key'] = idemKey;
    } else if (_isPaymentPath(options.path) &&
        options.method.toUpperCase() == 'POST') {
      // Loud dev-time warning: payment endpoint without a key is unsafe
      // under retry — caller forgot to thread the UUID through.
      _logger.w('⚠️  Payment POST without Idempotency-Key: ${options.path}');
    }
    handler.next(options);
  }

  /// Pull `Server-Version` and `Min-Client-Version` out of response headers
  /// (case-insensitive — Dio normalises to lowercase) and forward to the
  /// version notifier so the force-update gate updates in near-real-time.
  void _captureVersionHeaders(Headers? headers) {
    if (headers == null || onServerHeaders == null) return;
    final sv = headers.value('server-version');
    final mcv = headers.value('min-client-version');
    if (sv == null && mcv == null) return;
    onServerHeaders!(sv, mcv);
  }

  bool _isPaymentPath(String path) {
    // Path may be the raw relative path or include the base URL — match by
    // suffix so both shapes work.
    for (final p in _idempotentPaymentPaths) {
      if (path.endsWith(p)) return true;
    }
    return false;
  }

  void _onResponse(Response response, ResponseInterceptorHandler handler) {
    _logger.i('✅ ${response.statusCode} ${response.requestOptions.path}');
    _captureVersionHeaders(response.headers);
    handler.next(response);
  }

  Future<void> _onError(
    DioException err,
    ErrorInterceptorHandler handler,
    Dio targetDio,
  ) async {
    _logger.e('❌ ${err.type} ${err.requestOptions.path}');
    _captureVersionHeaders(err.response?.headers);

    final statusCode = err.response?.statusCode;
    final body = err.response?.data;
    final errorCode = body is Map ? (body['code'] ?? body['error']) : null;

    // REFRESH_TOKEN_REUSE → server revoked every refresh token on this
    // account. Treat as a hard logout, not a generic session expiry.
    if (statusCode == 401 && errorCode == 'REFRESH_TOKEN_REUSE') {
      _logger.w('🚨 Refresh token reuse detected — forcing logout');
      await _handleSessionExpiry();
      onRefreshTokenReuseDetected?.call();
      return handler.next(err);
    }

    // TOKEN_REVOKED → access token was issued before a logout-all bumped
    // tokenVersion. Per the doc (§0), force a clean logout — refresh
    // won't help because the refresh token was revoked too.
    if (statusCode == 401 && errorCode == 'TOKEN_REVOKED') {
      _logger.w('🚨 Token revoked (logout-all) — forcing logout');
      await _handleSessionExpiry();
      return handler.next(err);
    }

    // 409 IDEMPOTENCY_IN_PROGRESS → the previous attempt with this key is
    // still running. Backoff briefly and retry once. Only meaningful on
    // payment endpoints (the only place we attach a key).
    if (statusCode == 409 && errorCode == 'IDEMPOTENCY_IN_PROGRESS') {
      if (err.requestOptions.extra['_idemRetryDone'] != true) {
        await Future<void>.delayed(const Duration(milliseconds: 1500));
        try {
          final response = await targetDio.request(
            err.requestOptions.path,
            data: err.requestOptions.data,
            queryParameters: err.requestOptions.queryParameters,
            options: Options(
              method: err.requestOptions.method,
              headers: err.requestOptions.headers,
              extra: {...err.requestOptions.extra, '_idemRetryDone': true},
            ),
          );
          return handler.resolve(response);
        } catch (_) {
          // fall through — surface the original error to the caller
        }
      }
    }

    // 429 RATE_LIMITED → honour Retry-After (seconds or HTTP-date). Retry
    // once at most so we don't make the rate-limit situation worse.
    if (statusCode == 429) {
      if (err.requestOptions.extra['_rateRetryDone'] != true) {
        final wait =
            _parseRetryAfter(err.response?.headers.value('retry-after'));
        await Future<void>.delayed(wait);
        try {
          final response = await targetDio.request(
            err.requestOptions.path,
            data: err.requestOptions.data,
            queryParameters: err.requestOptions.queryParameters,
            options: Options(
              method: err.requestOptions.method,
              headers: err.requestOptions.headers,
              extra: {...err.requestOptions.extra, '_rateRetryDone': true},
            ),
          );
          return handler.resolve(response);
        } catch (_) {
          // surface original error
        }
      }
    }

    // TOKEN_EXPIRED → try refresh once, then retry original request
    if (statusCode == 401 && errorCode == 'TOKEN_EXPIRED') {
      // Don't loop: if this is already a retry, give up
      if (err.requestOptions.extra['_isRetry'] == true) {
        await _handleSessionExpiry();
        return handler.next(err);
      }

      if (!_isRefreshing) {
        _isRefreshing = true;
        try {
          final newToken = await _callRefresh();
          if (newToken != null) {
            await setAuthToken(newToken);
            onTokenRefreshed?.call(newToken);
            _isRefreshing = false;

            final response = await targetDio.request(
              err.requestOptions.path,
              data: err.requestOptions.data,
              queryParameters: err.requestOptions.queryParameters,
              options: Options(
                method: err.requestOptions.method,
                headers: {
                  ...err.requestOptions.headers,
                  'Authorization': 'Bearer $newToken',
                },
                extra: {...err.requestOptions.extra, '_isRetry': true},
              ),
            );
            return handler.resolve(response);
          }
        } catch (e) {
          _logger.e('Refresh failed: $e');
        }
        _isRefreshing = false;
        await _handleSessionExpiry();
      }
      return handler.next(err);
    }

    // Any other 401 → session is invalid (skip for auth endpoints — a 401 there
    // means wrong credentials, not an expired session)
    if (statusCode == 401) {
      final isAuthEndpoint = err.requestOptions.path.contains('/auth/');
      if (!isAuthEndpoint) {
        _logger.w('🔒 Session invalid — logging out');
        await _handleSessionExpiry();
      }
      return handler.next(err);
    }

    // Network timeout retry (up to 3 attempts)
    if (err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.sendTimeout) {
      final retryCount = (err.requestOptions.extra['retryCount'] as int?) ?? 0;
      if (retryCount < 3) {
        err.requestOptions.extra['retryCount'] = retryCount + 1;
        await Future.delayed(Duration(seconds: retryCount + 1));
        try {
          final response = await targetDio.request(
            err.requestOptions.path,
            data: err.requestOptions.data,
            queryParameters: err.requestOptions.queryParameters,
            options: Options(
              method: err.requestOptions.method,
              headers: err.requestOptions.headers,
              extra: err.requestOptions.extra,
            ),
          );
          return handler.resolve(response);
        } catch (_) {}
      }
    }

    handler.next(err);
  }

  /// Calls /refresh using the separate Dio instance so the auth interceptor
  /// is not involved. Mobile clients send the refresh token in the body —
  /// the web also accepts a cookie, but the cookie jar isn't reliably set
  /// on first install, so the body path is the source of truth here.
  ///
  /// Also updates `_accessTokenExpiresAt` and rotates `_refreshToken` so the
  /// caller can schedule the next proactive refresh.
  Future<String?> _callRefresh() async {
    final body = <String, dynamic>{};
    if (_refreshToken != null && _refreshToken!.isNotEmpty) {
      body['refreshToken'] = _refreshToken;
    }
    final response = await _refreshDio.post('/user/auth/refresh', data: body);
    final data = response.data;
    if (data is! Map) return null;

    final newAccess = data['token'] as String?;
    final newRefresh = data['refreshToken'] as String?;
    final expIso = data['accessTokenExpiresAt']?.toString();

    if (newRefresh != null && newRefresh.isNotEmpty) {
      _refreshToken = newRefresh;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_kRefreshTokenKey, newRefresh);
    }
    if (expIso != null) {
      final parsed = DateTime.tryParse(expIso);
      if (parsed != null) {
        _accessTokenExpiresAt = parsed;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_kAccessExpiresAtKey, expIso);
      }
    }
    // Re-arm the proactive timer against the new expiry.
    _scheduleProactiveRefresh();
    return newAccess;
  }

  /// Persist the full session after login / register / google-auth.
  /// Callers should pass everything the backend returned so we can drive
  /// proactive refresh without re-reading the login response.
  Future<void> setSession({
    required String accessToken,
    String? refreshToken,
    String? accessTokenExpiresAt,
  }) async {
    await setAuthToken(accessToken);
    final prefs = await SharedPreferences.getInstance();
    if (refreshToken != null && refreshToken.isNotEmpty) {
      _refreshToken = refreshToken;
      await prefs.setString(_kRefreshTokenKey, refreshToken);
    }
    if (accessTokenExpiresAt != null) {
      final parsed = DateTime.tryParse(accessTokenExpiresAt);
      if (parsed != null) {
        _accessTokenExpiresAt = parsed;
        await prefs.setString(_kAccessExpiresAtKey, accessTokenExpiresAt);
      }
    }
    _scheduleProactiveRefresh();
  }

  /// Read access-token expiry (or null if unknown). Lets callers schedule a
  /// proactive refresh ~60s before expiry instead of waiting for a 401.
  DateTime? get accessTokenExpiresAt => _accessTokenExpiresAt;

  /// Current `Authorization` header value on the main Dio, e.g.
  /// `Bearer eyJ…`. Used by the dev smoke harness to confirm a refresh
  /// actually swapped the bearer everywhere.
  String? get currentAuthHeader =>
      _dio.options.headers['Authorization'] as String?;

  /// Refresh-token currently persisted in memory. Exposed for the dev
  /// smoke harness only — the production refresh path reads this
  /// internally and you should not call it from product code.
  String? get debugRefreshToken => _refreshToken;

  /// Trigger a refresh immediately and propagate the new access token
  /// to every tracked Dio — same code path as the reactive 401 handler,
  /// just without needing to manufacture a 401. Returns the new access
  /// token on success, or throws the underlying DioException.
  ///
  /// Dev-only entry point. Not used by product code.
  Future<String?> forceRefresh() async {
    final newToken = await _callRefresh();
    if (newToken != null && newToken.isNotEmpty) {
      await setAuthToken(newToken);
      onTokenRefreshed?.call(newToken);
    }
    return newToken;
  }

  /// (Re)schedule the proactive refresh timer. Called whenever the access
  /// token or its expiry is set. Cancels any pending timer first so we
  /// always have at most one armed.
  ///
  /// If the expiry is unknown or already in the past, this is a no-op —
  /// the reactive `_onError` TOKEN_EXPIRED path will catch it.
  void _scheduleProactiveRefresh() {
    _proactiveRefreshTimer?.cancel();
    final exp = _accessTokenExpiresAt;
    if (exp == null) return;
    final fireAt = exp.subtract(_proactiveRefreshLeeway);
    final delay = fireAt.difference(DateTime.now());
    if (delay.isNegative) return;
    _proactiveRefreshTimer = Timer(delay, () async {
      if (_isRefreshing) return; // reactive flow already in progress
      _isRefreshing = true;
      try {
        final newToken = await _callRefresh();
        if (newToken != null) {
          await setAuthToken(newToken);
          onTokenRefreshed?.call(newToken);
        }
      } catch (e) {
        _logger.w('Proactive refresh failed: $e');
      } finally {
        _isRefreshing = false;
        // Either succeeded (new exp → new timer) or failed (token is now
        // stale, let the next 401 drive the reactive path).
        _scheduleProactiveRefresh();
      }
    });
  }

  /// Boot-time version probe — calls `GET /version` so the force-update
  /// gate has authoritative data before the user lands on the home screen.
  /// Subsequent requests refresh this from `Server-Version` /
  /// `Min-Client-Version` response headers, so this only needs to be
  /// called once at startup.
  ///
  /// Returns `(server, minSupportedClient)` or `(null, null)` on failure
  /// — the gate stays open on a network blip rather than blocking the user.
  Future<({String? server, String? minSupportedClient})>
      fetchServerVersion() async {
    try {
      final response = await _dio.get('/version');
      final data = response.data;
      if (data is Map) {
        final inner = data['data'];
        if (inner is Map) {
          return (
            server: inner['server']?.toString(),
            minSupportedClient: inner['minSupportedClient']?.toString(),
          );
        }
      }
    } catch (e) {
      _logger.w('Version probe failed: $e');
    }
    return (server: null, minSupportedClient: null);
  }

  Future<void> _handleSessionExpiry() async {
    try {
      await clearAuthToken();
      clearCache();
      onSessionExpired?.call();
    } catch (e) {
      _logger.e('Error handling session expiry: $e');
    }
  }

  /// Public: attempt to refresh the access token. Returns true on success.
  Future<bool> refreshAuthToken() async {
    try {
      final newToken = await _callRefresh();
      if (newToken != null) {
        await setAuthToken(newToken);
        onTokenRefreshed?.call(newToken);
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<void> setAuthToken(String token) async {
    final bearer = 'Bearer $token';
    // Update every tracked Dio (main + every service-owned Dio built via
    // [createSharedDio]) so a refresh propagates without each service
    // having to re-read SharedPreferences on the next request.
    for (final d in _trackedDios) {
      d.options.headers['Authorization'] = bearer;
    }
    _refreshDio.options.headers['Authorization'] = bearer;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  Future<void> clearAuthToken() async {
    for (final d in _trackedDios) {
      d.options.headers.remove('Authorization');
    }
    _refreshDio.options.headers.remove('Authorization');
    _refreshToken = null;
    _accessTokenExpiresAt = null;
    _proactiveRefreshTimer?.cancel();
    _proactiveRefreshTimer = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove(_kRefreshTokenKey);
    await prefs.remove(_kAccessExpiresAtKey);
  }

  Future<void> loadAuthToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    if (token != null) {
      final bearer = 'Bearer $token';
      for (final d in _trackedDios) {
        d.options.headers['Authorization'] = bearer;
      }
      _refreshDio.options.headers['Authorization'] = bearer;
    }
    _refreshToken = prefs.getString(_kRefreshTokenKey);
    final expIso = prefs.getString(_kAccessExpiresAtKey);
    if (expIso != null) _accessTokenExpiresAt = DateTime.tryParse(expIso);
    _scheduleProactiveRefresh();
  }

  Future<bool> isSessionValid() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token') != null;
  }

  // ── HTTP verbs ────────────────────────────────────────────────────────────

  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    bool useCache = false,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      if (useCache) {
        final key = _cacheKey('GET', path, queryParameters);
        final cached = _getFromCache(key);
        if (cached != null) {
          return ApiResponse.success(
              fromJson != null ? fromJson(cached) : cached as T);
        }
      }

      final response = await _dio.get(path, queryParameters: queryParameters);

      if (useCache) {
        _saveToCache(_cacheKey('GET', path, queryParameters), response.data);
      }
      return ApiResponse.success(
          fromJson != null ? fromJson(response.data) : response.data as T);
    } on DioException catch (e) {
      return _errorFrom(e);
    } catch (e) {
      return ApiResponse.error('Unexpected error: $e');
    }
  }

  Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    T Function(dynamic)? fromJson,
    String? idempotencyKey,
  }) async {
    try {
      final options = idempotencyKey != null && idempotencyKey.isNotEmpty
          ? Options(extra: {'idempotencyKey': idempotencyKey})
          : null;
      final response = await _dio.post(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return ApiResponse.success(
          fromJson != null ? fromJson(response.data) : response.data as T);
    } on DioException catch (e) {
      return _errorFrom(e);
    } catch (e) {
      return ApiResponse.error('Unexpected error: $e');
    }
  }

  Future<ApiResponse<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response =
          await _dio.put(path, data: data, queryParameters: queryParameters);
      return ApiResponse.success(
          fromJson != null ? fromJson(response.data) : response.data as T);
    } on DioException catch (e) {
      return _errorFrom(e);
    } catch (e) {
      return ApiResponse.error('Unexpected error: $e');
    }
  }

  Future<ApiResponse<T>> delete<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response =
          await _dio.delete(path, queryParameters: queryParameters);
      return ApiResponse.success(
          fromJson != null ? fromJson(response.data) : response.data as T);
    } on DioException catch (e) {
      return _errorFrom(e);
    } catch (e) {
      return ApiResponse.error('Unexpected error: $e');
    }
  }

  Future<ApiResponse<T>> uploadFile<T>(
    String path,
    File file, {
    String fieldName = 'file',
    Map<String, dynamic>? additionalData,
    T Function(dynamic)? fromJson,
    Function(int sent, int total)? onProgress,
  }) async {
    try {
      final formData = FormData.fromMap({
        fieldName: await MultipartFile.fromFile(
          file.path,
          filename: file.path.split('/').last,
        ),
        ...?additionalData,
      });
      final response =
          await _dio.post(path, data: formData, onSendProgress: onProgress);
      return ApiResponse.success(
          fromJson != null ? fromJson(response.data) : response.data as T);
    } on DioException catch (e) {
      return _errorFrom(e);
    } catch (e) {
      return ApiResponse.error('Unexpected error: $e');
    }
  }

  void updateBaseUrl(String baseUrl) {
    _dio.options.baseUrl = baseUrl;
    _refreshDio.options.baseUrl = baseUrl;
  }

  // ── Error handling ────────────────────────────────────────────────────────

  /// Parse a `Retry-After` header. Accepts "<seconds>" or an HTTP-date.
  /// Falls back to 2s when missing or unparseable so we don't hammer the
  /// server. Clamped to [1s, 60s] — callers shouldn't wait longer than
  /// that inside a single request.
  Duration _parseRetryAfter(String? raw) {
    const fallback = Duration(seconds: 2);
    const minWait = Duration(seconds: 1);
    const maxWait = Duration(seconds: 60);
    if (raw == null || raw.trim().isEmpty) return fallback;
    final secs = int.tryParse(raw.trim());
    if (secs != null) {
      final d = Duration(seconds: secs);
      if (d < minWait) return minWait;
      if (d > maxWait) return maxWait;
      return d;
    }
    final parsed = HttpDate.parse(raw);
    final delta = parsed.difference(DateTime.now());
    if (delta < minWait) return minWait;
    if (delta > maxWait) return maxWait;
    return delta;
  }

  /// User-facing messages keyed by the backend's stable `code` field.
  /// Branch on `code`, never on the human-readable `message` — those
  /// strings change without notice.
  static const Map<String, String> _codeToUserMessage = {
    'NO_TOKEN': 'Please sign in to continue.',
    'INVALID_TOKEN': 'Please sign in to continue.',
    'TOKEN_EXPIRED': 'Your session expired. Refreshing…',
    'NO_REFRESH_TOKEN': 'Please sign in to continue.',
    'INVALID_REFRESH_TOKEN': 'Please sign in to continue.',
    'REFRESH_TOKEN_EXPIRED': 'Your session expired. Please sign in again.',
    'REFRESH_TOKEN_REUSE':
        'For your security, you were logged out of all devices. Please sign in again.',
    'ACCOUNT_BLOCKED':
        'This account has been blocked. Contact support if this is unexpected.',
    'USER_NOT_FOUND': 'Please sign in to continue.',
    'FORBIDDEN_ROLE': "You don't have access to this.",
    'FORBIDDEN_NO_ROLE': 'Please sign in to continue.',
    'REGISTRATION_TOKEN_MISSING':
        'Your sign-up session expired. Please start again.',
    'REGISTRATION_TOKEN_INVALID':
        'Your sign-up session expired. Please start again.',
    'REGISTRATION_TOKEN_USED':
        'This sign-up link was already used. Please start again.',
    'PHONE_REGISTRATION_TOKEN_INVALID':
        'Please verify your phone number again.',
    'PHONE_REGISTRATION_TOKEN_USED': 'Please verify your phone number again.',
    'INVALID_FILE_TYPE': 'That file type is not supported.',
    'IDEMPOTENCY_IN_PROGRESS':
        'Still processing your last payment. Please wait a moment.',
    'RATE_LIMITED': 'Too many attempts. Please wait a moment and try again.',
  };

  bool _looksLikeInternalTrace(String msg) {
    final lower = msg.toLowerCase();
    return lower.contains('prisma.') ||
        lower.contains('invocation:') ||
        lower.contains('sequelize') ||
        lower.contains('syntax error at or near') ||
        lower.contains('whereinput') ||
        lower.contains('stringnullablefilter') ||
        lower.contains('relationfilter');
  }

  /// Pull the stable backend code out of a Dio error response, if the
  /// server attached one (post-§4 envelope: `{ code: 'STABLE_CODE', ... }`).
  /// Returns null for legacy endpoints / non-JSON responses.
  String? _errorCode(DioException error) {
    final body = error.response?.data;
    if (body is Map) {
      final c = body['code'];
      if (c is String && c.isNotEmpty) return c;
    }
    return null;
  }

  /// Build an `ApiResponse.error` that carries the human message AND the
  /// stable backend code + status, so callers can branch reliably.
  ApiResponse<T> _errorFrom<T>(DioException e) => ApiResponse.error(
        _handleError(e),
        code: _errorCode(e),
        statusCode: e.response?.statusCode,
      );

  String _handleError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Connection timeout. Please check your internet connection.';

      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final body = error.response?.data;
        final code = body is Map ? body['code']?.toString() : null;
        final serverMessage = body is Map ? body['message']?.toString() : null;

        // Stable-code branching first — these are contract-guaranteed.
        if (code != null) {
          final mapped = _codeToUserMessage[code];
          if (mapped != null) return mapped;
        }

        // INVALID_FILE_TYPE carries the allowed MIME list — surface it.
        if (code == 'INVALID_FILE_TYPE' &&
            body is Map &&
            body['details'] is Map &&
            (body['details'] as Map)['allowed'] is List) {
          final allowed =
              ((body['details'] as Map)['allowed'] as List).join(', ');
          return 'Unsupported file type. Allowed: $allowed';
        }

        if (statusCode == 401) {
          final path = error.requestOptions.path;
          if (path.contains('/auth/')) {
            return serverMessage ?? 'Authentication failed';
          }
          return 'Your session has expired. Please sign in again.';
        }
        if (statusCode == 403) return "You don't have access to this.";
        if (statusCode == 404) return 'Resource not found.';
        if (statusCode == 422) {
          return serverMessage != null
              ? 'Validation error: $serverMessage'
              : 'Validation error';
        }
        if (statusCode == 500) {
          return 'Server error. Please try again in a moment.';
        }
        // Strip internal stack traces (Prisma, Sequelize, raw SQL) before
        // bubbling up — these expose schema field names and shouldn't reach
        // the user even if the backend echoes them in non-500 responses.
        if (serverMessage != null && _looksLikeInternalTrace(serverMessage)) {
          return 'Server error. Please try again in a moment.';
        }
        return serverMessage ?? 'Server error';

      case DioExceptionType.cancel:
        return 'Request cancelled.';

      case DioExceptionType.unknown:
        if (error.error is SocketException) return 'No internet connection.';
        return 'An unexpected error occurred.';

      default:
        return 'An error occurred: ${error.message}';
    }
  }

  // ── Cache ─────────────────────────────────────────────────────────────────

  String _cacheKey(String method, String path, Map<String, dynamic>? params) =>
      '$method:$path:${params?.toString() ?? ""}';

  void _saveToCache(String key, dynamic data) {
    _cache[key] = CachedResponse(data: data, timestamp: DateTime.now());
  }

  dynamic _getFromCache(String key) {
    final cached = _cache[key];
    if (cached == null) return null;
    if (DateTime.now().difference(cached.timestamp) > _cacheDuration) {
      _cache.remove(key);
      return null;
    }
    return cached.data;
  }

  void clearCache() {
    _cache.clear();
    _etagInterceptor.clear();
    _logger.i('🗑️ Cache cleared');
  }
}

class CachedResponse {
  final dynamic data;
  final DateTime timestamp;
  CachedResponse({required this.data, required this.timestamp});
}

class ApiResponse<T> {
  final T? data;
  final String? error;
  final bool isSuccess;

  /// Stable backend error code (e.g. `SLOT_UNAVAILABLE`,
  /// `INSUFFICIENT_BALANCE`). Preserved here even when `_handleError`
  /// rewrites the user-facing message — UI code should branch on this
  /// instead of pattern-matching the human string, which is sanitized
  /// for 500/internal-trace responses and isn't a stable contract.
  final String? code;

  /// HTTP status code on the response that produced this result. Useful
  /// when no stable code is present (legacy endpoint, network error)
  /// but the screen still wants to differentiate 409 from 500.
  final int? statusCode;

  ApiResponse._({
    this.data,
    this.error,
    this.code,
    this.statusCode,
    required this.isSuccess,
  });

  factory ApiResponse.success(T data) =>
      ApiResponse._(data: data, isSuccess: true);

  factory ApiResponse.error(String error, {String? code, int? statusCode}) =>
      ApiResponse._(
        error: error,
        code: code,
        statusCode: statusCode,
        isSuccess: false,
      );
}
