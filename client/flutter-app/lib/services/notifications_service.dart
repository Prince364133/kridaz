import 'package:dio/dio.dart';
import '../config/api_config.dart';
import 'auth_manager.dart';

/// One page of notifications + the cursor to fetch the next page.
/// Mirrors the contract's `data.items` + `data.pagination.nextCursor`
/// shape (§4.4 / §7.1). The top-level `notifications` array the legacy
/// endpoint still echoes is intentionally ignored — it will be removed.
class NotificationsPage {
  final List<Map<String, dynamic>> items;
  final String? nextCursor;
  final bool hasMore;

  const NotificationsPage({
    required this.items,
    required this.nextCursor,
    required this.hasMore,
  });

  static const empty =
      NotificationsPage(items: [], nextCursor: null, hasMore: false);
}

class NotificationsService {
  late final Dio _dio;

  NotificationsService() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.apiUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
    ));
  }

  Options _authedOptions() {
    final jwt = AuthManager().token;
    return Options(
      headers: {
        if (jwt != null) 'Authorization': 'Bearer $jwt',
      },
    );
  }

  /// POST /user/notification/device-token
  ///
  /// Deliberately uses the local [_dio] (no interceptors) instead of
  /// [ApiService] so a transient 401 here can never trigger the global
  /// session-expired callback. Push registration is non-critical — a
  /// failure should never log the user out.
  ///
  /// [platform] must be `'android'` or `'ios'`; the legacy `'mobile'`
  /// value still works but is deprecated.
  /// [deviceId], [appVersion], and [locale] are optional and surface in
  /// the backend's notification debugging tools when present.
  Future<bool> registerDeviceToken({
    required String token,
    required String platform,
    String? deviceId,
    String? appVersion,
    String? locale,
  }) async {
    final jwt = AuthManager().token;
    if (jwt == null) return false;
    try {
      final response = await _dio.post(
        '/user/notification/device-token',
        data: {
          'token': token,
          'platform': platform,
          if (deviceId != null) 'deviceId': deviceId,
          if (appVersion != null) 'appVersion': appVersion,
          if (locale != null) 'locale': locale,
        },
        options: _authedOptions(),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } on DioException {
      return false;
    }
  }

  /// POST /user/notification/device-token/unregister — idempotent;
  /// missing tokens are silently OK per contract.
  Future<bool> unregisterDeviceToken(String token) async {
    try {
      final response = await _dio.post(
        '/user/notification/device-token/unregister',
        data: {'token': token},
        options: _authedOptions(),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } on DioException {
      return false;
    }
  }

  /// GET /notification?cursor=…&limit=…
  ///
  /// Cursor-paginated per contract §7.1. Pass [cursor] back as the
  /// `nextCursor` from the previous page; pass null for the first page.
  /// `limit` defaults to 25, max 100.
  Future<NotificationsPage> getNotifications({
    String? cursor,
    int limit = 25,
  }) async {
    try {
      final response = await _dio.get(
        '/notification',
        queryParameters: {
          'limit': limit,
          if (cursor != null) 'cursor': cursor,
        },
        options: _authedOptions(),
      );
      return _parsePage(response.data);
    } catch (_) {
      return NotificationsPage.empty;
    }
  }

  NotificationsPage _parsePage(dynamic raw) {
    if (raw is! Map) return NotificationsPage.empty;
    final inner = raw['data'];
    if (inner is Map) {
      final items = inner['items'];
      final pagination = inner['pagination'];
      return NotificationsPage(
        items: items is List
            ? items
                .whereType<Map>()
                .map((e) => Map<String, dynamic>.from(e))
                .toList()
            : const [],
        nextCursor:
            pagination is Map ? pagination['nextCursor']?.toString() : null,
        hasMore: pagination is Map ? (pagination['hasMore'] == true) : false,
      );
    }
    // Defensive fallback for the legacy top-level array, which the
    // contract says will be removed but is still populated today. Use it
    // ONLY when no `data` envelope is present.
    final legacy = raw['notifications'];
    if (legacy is List) {
      return NotificationsPage(
        items: legacy
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList(),
        nextCursor: null,
        hasMore: false,
      );
    }
    return NotificationsPage.empty;
  }

  /// PUT /notification/:id/mark-read
  Future<bool> markNotificationRead(String notificationId) async {
    try {
      final response = await _dio.put(
        '/notification/$notificationId/mark-read',
        options: _authedOptions(),
      );
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  /// PUT /notification/mark-all-read
  Future<bool> markAllNotificationsRead() async {
    try {
      final response = await _dio.put(
        '/notification/mark-all-read',
        options: _authedOptions(),
      );
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  /// DELETE /notification/clear — drop every notification for this user.
  /// The contract doesn't expose a per-id delete; clearing-all is the
  /// only supported destructive operation.
  Future<bool> clearAllNotifications() async {
    try {
      final response = await _dio.delete(
        '/notification/clear',
        options: _authedOptions(),
      );
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  // ── Topic subscriptions (FCM topic routing) ──────────────────────────────
  //
  // The backend pushes per-topic so it doesn't have to enumerate every
  // subscriber's FCM token. Used for "follow this match", "host-side push
  // for join requests", etc. Topics must match the contract regex:
  //   [a-zA-Z0-9-_.~%]{1,200}
  // Sending an invalid topic returns 400 INVALID_TOPIC; we filter
  // client-side to keep the round-trip clean.

  static final RegExp _topicRegex = RegExp(r'^[a-zA-Z0-9\-_.~%]{1,200}$');

  /// Returns true when [topic] matches the FCM topic regex the backend
  /// will accept. Use this before calling subscribe/unsubscribe so
  /// programmer mistakes fail loudly in dev instead of as a 400 at runtime.
  static bool isValidTopic(String topic) => _topicRegex.hasMatch(topic);

  /// POST /user/notification/topics/subscribe
  ///
  /// Subscribes [tokens] (typically just the local FCM token) to [topic].
  /// One user can have multiple devices, so the API accepts an array.
  /// Returns true when the server reports any success, false otherwise —
  /// individual per-token results are reported via [successCount] /
  /// [failureCount] in the response if you need to surface them.
  Future<bool> subscribeToTopic({
    required String topic,
    required List<String> tokens,
  }) async {
    if (!isValidTopic(topic) || tokens.isEmpty) return false;
    try {
      final response = await _dio.post(
        '/user/notification/topics/subscribe',
        data: {'topic': topic, 'tokens': tokens},
        options: _authedOptions(),
      );
      if (response.statusCode != 200 && response.statusCode != 201) {
        return false;
      }
      final data = response.data;
      if (data is Map) {
        final ok = data['success'] == true ||
            ((data['successCount'] as num?)?.toInt() ?? 0) > 0;
        return ok;
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  /// POST /user/notification/topics/unsubscribe — same shape as subscribe.
  Future<bool> unsubscribeFromTopic({
    required String topic,
    required List<String> tokens,
  }) async {
    if (!isValidTopic(topic) || tokens.isEmpty) return false;
    try {
      final response = await _dio.post(
        '/user/notification/topics/unsubscribe',
        data: {'topic': topic, 'tokens': tokens},
        options: _authedOptions(),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (_) {
      return false;
    }
  }

  /// Legacy unread-count endpoint — not in the v1 contract.
  /// Kept so existing badge logic keeps working; computed client-side
  /// from the notification list would be a cleaner long-term replacement.
  Future<int> getUnreadCount() async {
    try {
      final response = await _dio.get(
        '/notification/unread-count',
        options: _authedOptions(),
      );
      final data = response.data;
      if (data is Map) {
        final v = data['unread_count'] ?? data['unreadCount'] ?? data['count'];
        if (v is num) return v.toInt();
        if (v != null) return int.tryParse(v.toString()) ?? 0;
      }
      return 0;
    } catch (_) {
      return 0;
    }
  }
}
