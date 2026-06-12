import 'dart:io' show Platform;
import 'package:firebase_messaging/firebase_messaging.dart';
import '../core/version/app_version.dart';
import 'auth_manager.dart';
import 'notifications_service.dart';

/// Push notification bootstrap.
///
/// Responsibilities:
///   - request system permission
///   - obtain the FCM (or APNs-wrapped) token
///   - send it to the backend so push messages can be delivered
///   - re-send the token whenever Firebase rotates it
///   - expose foreground message + tap handlers
///
/// Mirrors the web frontend's `user/notifications/device-token` registration.
/// All Firebase-Messaging methods no-op gracefully if the user denies the
/// permission prompt.
class PushNotificationService {
  PushNotificationService._();
  static final PushNotificationService instance = PushNotificationService._();

  final _messaging = FirebaseMessaging.instance;
  final _notifications = NotificationsService();

  bool _permissionRequested = false;
  String? _cachedFcmToken;

  /// One-time setup on cold start: prompt for permission, fetch the FCM
  /// token, listen for rotations. Does NOT POST to the backend here —
  /// without an auth token the call returns 401 and trips the session-
  /// expired interceptor. Call [registerWithBackend] after login.
  Future<void> init() async {
    if (_permissionRequested) return;
    _permissionRequested = true;

    try {
      final settings = await _messaging.requestPermission(
          alert: true, badge: true, sound: true);
      if (settings.authorizationStatus == AuthorizationStatus.denied) return;

      _cachedFcmToken = await _messaging.getToken();
      // If the user is somehow already authenticated when init() runs
      // (e.g. session restored from disk), register immediately.
      if (_cachedFcmToken != null && AuthManager().token != null) {
        await _notifications.registerDeviceToken(
          token: _cachedFcmToken!,
          platform: Platform.isIOS ? 'ios' : 'android',
          appVersion: AppVersion.current,
        );
      }

      _messaging.onTokenRefresh.listen((newToken) {
        _cachedFcmToken = newToken;
        if (AuthManager().token != null) {
          _notifications.registerDeviceToken(
            token: newToken,
            platform: Platform.isIOS ? 'ios' : 'android',
            appVersion: AppVersion.current,
          );
        }
      });
    } catch (_) {
      // Push is non-critical; swallow init failures so they don't crash
      // launch. The user can still use the app without push.
    }
  }

  /// Call after a successful login. POSTs the cached FCM token to the
  /// backend so push messages can be routed to this device. Re-runs the
  /// token fetch if [init] hasn't populated it yet.
  Future<void> registerWithBackend() async {
    try {
      _cachedFcmToken ??= await _messaging.getToken();
      final token = _cachedFcmToken;
      if (token == null) return;
      if (AuthManager().token == null) return;
      await _notifications.registerDeviceToken(
        token: token,
        platform: Platform.isIOS ? 'ios' : 'android',
        appVersion: AppVersion.current,
      );
    } catch (_) {
      // Non-critical.
    }
  }

  /// Call from sign-out so the backend stops pushing to this device. The
  /// FCM token itself is kept in [_cachedFcmToken] — if the same user (or
  /// a different one) signs in on this device later, [registerWithBackend]
  /// re-attaches it.
  Future<void> unregisterFromBackend() async {
    try {
      final token = _cachedFcmToken;
      if (token == null) return;
      await _notifications.unregisterDeviceToken(token);
    } catch (_) {
      // Non-critical.
    }
  }

  /// Subscribe this device's FCM token to [topic] so the backend can
  /// push to it without enumerating users. Use for "follow this match",
  /// host-side join notifications, etc. Returns false when the topic
  /// is invalid, the FCM token isn't available, or the server rejected.
  ///
  /// Topic format per contract: `[a-zA-Z0-9-_.~%]{1,200}`.
  Future<bool> subscribeToTopic(String topic) async {
    try {
      _cachedFcmToken ??= await _messaging.getToken();
      final token = _cachedFcmToken;
      if (token == null) return false;
      return _notifications.subscribeToTopic(
        topic: topic,
        tokens: [token],
      );
    } catch (_) {
      return false;
    }
  }

  /// Inverse of [subscribeToTopic]. Idempotent on the server — calling
  /// it for a topic this device never subscribed to is harmless.
  Future<bool> unsubscribeFromTopic(String topic) async {
    try {
      _cachedFcmToken ??= await _messaging.getToken();
      final token = _cachedFcmToken;
      if (token == null) return false;
      return _notifications.unsubscribeFromTopic(
        topic: topic,
        tokens: [token],
      );
    } catch (_) {
      return false;
    }
  }

  /// Hook for foreground messages. Wire this from main.dart if you want
  /// in-app notification banners.
  static Stream<RemoteMessage> get onForegroundMessage =>
      FirebaseMessaging.onMessage;

  /// Hook for taps that opened the app from a background notification.
  static Stream<RemoteMessage> get onMessageOpenedApp =>
      FirebaseMessaging.onMessageOpenedApp;
}
