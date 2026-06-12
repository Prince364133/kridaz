import 'dart:async' show StreamSubscription, unawaited;
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'config/api_config.dart';
import 'core/clock/server_clock.dart';
import 'core/constants/app_colors.dart';
import 'core/network/cert_pinning.dart';
import 'core/observability/sentry_init.dart';
import 'core/di/core_providers.dart';
import 'core/network/interceptors/auth_interceptor.dart';
import 'core/storage/token_bridge.dart';
import 'core/version/version_state.dart';
import 'providers/notification_provider.dart';
import 'router/app_router.dart';
import 'screens/force_update_screen.dart';
import 'services/auth_manager.dart';
import 'services/connectivity_service.dart';
import 'services/api_service.dart';
import 'services/push_notification_service.dart';
import 'widgets/scoring/themes/theme_packs.dart';

/// Global key so any layer can show a SnackBar without grabbing a
/// BuildContext — used for forced-logout notifications fired from the
/// Dio error interceptor.
final GlobalKey<ScaffoldMessengerState> rootScaffoldMessengerKey =
    GlobalKey<ScaffoldMessengerState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  ApiConfig.assertConfigured();
  CertPinning.assertConfigured();

  // Populate the scoring theme-pack registry before any LiveOverlay or
  // ThemePreview can resolve a pack by id.
  registerDefaultThemePacks();

  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
  };

  // Replace Flutter's default red error overlay with a calm fallback so a
  // widget-level crash (e.g. a server returning a raw Prisma stack trace
  // that some text widget tried to render) doesn't expose backend internals
  // to the user. The original details still go to the console / crash
  // reporter via FlutterError.onError above.
  ErrorWidget.builder = (FlutterErrorDetails details) => Container(
        color: Colors.black,
        alignment: Alignment.center,
        padding: const EdgeInsets.all(24),
        child: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, color: Colors.white54, size: 40),
            SizedBox(height: 12),
            Text(
              'Something went wrong rendering this screen.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontFamily: 'Poppins',
              ),
            ),
            SizedBox(height: 6),
            Text(
              'Try again in a moment.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white54,
                fontSize: 12,
                fontFamily: 'Poppins',
              ),
            ),
          ],
        ),
      );

  // We build the Riverpod root container manually so we can read providers
  // before runApp — needed to wire the new ApiClient ↔ legacy AuthManager.
  final container = ProviderContainer();

  try {
    // Load stored JWT token into Dio before the first request
    await ApiService().loadAuthToken();

    // ── New networking stack bootstrap ────────────────────────────────────
    // 1. Bind the bridge so AuthManager._setToken / signOut mirror into
    //    SecureTokenStore from now on.
    TokenBridge.bind(container.read(secureTokenStoreProvider));

    // 2. Cold-start seed: if a token already lives in SharedPreferences
    //    (last session), copy it into SecureTokenStore so the new ApiClient
    //    is authenticated from the first frame.
    final prefs = await SharedPreferences.getInstance();
    final storedToken = prefs.getString('auth_token');
    if (storedToken != null && storedToken.isNotEmpty) {
      await TokenBridge.publish(storedToken);
    }

    // 3. Hook the new AuthInterceptor's onAuthFailure into the legacy
    //    AuthManager. When the new stack can't refresh, the legacy stack
    //    owns the "sign the user out" flow (clears cookies, kicks the
    //    router back to /login via authStateChanges).
    final apiClient = container.read(apiClientProvider);
    final authInterceptor =
        apiClient.raw.interceptors.whereType<AuthInterceptor>().firstOrNull;
    authInterceptor?.onAuthFailure = () {
      unawaited(AuthManager().signOut());
    };

    // Forward Server-Version / Min-Client-Version headers into the Riverpod
    // notifier on every response — keeps the force-update gate fresh
    // without polling.
    ApiService().onServerHeaders = (server, minClient) {
      container.read(serverVersionProvider.notifier).observe(
            serverVersion: server,
            minSupportedClient: minClient,
          );
    };

    // Authoritative version probe — fires-and-forgets so app start isn't
    // blocked on it. The first response also carries the headers, so even
    // if /version 404s, the gate fills in once any other request lands.
    unawaited(() async {
      final v = await ApiService().fetchServerVersion();
      container.read(serverVersionProvider.notifier).observe(
            serverVersion: v.server,
            minSupportedClient: v.minSupportedClient,
          );
    }());

    // Server-clock probe — keeps slot-bookability comparisons honest
    // against drifted device clocks. Fire-and-forget; ServerClock.now()
    // falls back to the device clock until this lands.
    unawaited(ServerClock.sync());

    // Initialize connectivity monitoring
    await ConnectivityService().initialize();

    // Firebase init — required before any Firebase Messaging calls. Uses the
    // platform-specific GoogleService-Info.plist / google-services.json that
    // the build system bundles. If the file is missing/misconfigured this
    // throws and we silently skip push (caught below).
    await Firebase.initializeApp();
    // Fire-and-forget push registration. Safe to call before login — the
    // service no-ops gracefully if the user denies permission. After login
    // AuthManager calls it again so the token is associated with the new
    // session.
    unawaited(PushNotificationService.instance.init());
  } catch (_) {
    // Boot failures are silenced — UI continues with whatever state is
    // available. Specific subsystems (auth, push, version probe) each log
    // their own diagnostics.
  }

  await CrashReporter.runWithSentry(() async {
    runApp(UncontrolledProviderScope(
      container: container,
      child: const BmsApp(),
    ));
  });
}

class BmsApp extends ConsumerStatefulWidget {
  const BmsApp({super.key});

  @override
  ConsumerState<BmsApp> createState() => _BmsAppState();
}

class _BmsAppState extends ConsumerState<BmsApp> with WidgetsBindingObserver {
  StreamSubscription<String>? _forcedLogoutSub;
  StreamSubscription<RemoteMessage>? _fgMessageSub;
  StreamSubscription<RemoteMessage>? _tapOpenedAppSub;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _forcedLogoutSub = AuthManager().forcedLogoutEvents.listen((reason) {
      final messenger = rootScaffoldMessengerKey.currentState;
      if (messenger == null) return;
      final copy = switch (reason) {
        'refresh_token_reuse' =>
          'For your security, you were logged out of all devices.',
        _ => 'Your session expired. Please sign in again.',
      };
      messenger.showSnackBar(SnackBar(
        content: Text(copy),
        backgroundColor: AppColors.surfaceL3,
        duration: const Duration(seconds: 4),
      ));
    });

    // ── Push notification handlers ──────────────────────────────────────
    // Foreground delivery: show an in-app banner via the root messenger
    // and refresh the bell badge + notification list so the data the user
    // sees if they open the bell matches what they just got pushed.
    _fgMessageSub =
        PushNotificationService.onForegroundMessage.listen(_onForegroundPush);
    // Cold-tap (app was backgrounded and the user tapped the system
    // notification to open it).
    _tapOpenedAppSub =
        PushNotificationService.onMessageOpenedApp.listen(_onPushTap);
    // App launched from a terminated state by tapping a notification —
    // FCM hands the message via getInitialMessage(). Fire-and-forget.
    unawaited(FirebaseMessaging.instance.getInitialMessage().then((msg) {
      if (msg != null) _onPushTap(msg);
    }));
  }

  /// Foreground push handler — banner + refresh.
  void _onForegroundPush(RemoteMessage msg) {
    // Always refresh, even if the payload doesn't carry the new count —
    // the backend has the authoritative number.
    try {
      ref.read(unreadNotificationCountProvider.notifier).refresh();
      ref.read(notificationsProvider.notifier).load();
    } catch (_) {
      // Provider container may not be ready yet on very early pushes.
    }
    final n = msg.notification;
    final title = (n?.title ?? msg.data['title'] ?? '').toString().trim();
    final body = (n?.body ?? msg.data['body'] ?? '').toString().trim();
    if (title.isEmpty && body.isEmpty) return;
    final messenger = rootScaffoldMessengerKey.currentState;
    if (messenger == null) return;
    messenger.showSnackBar(SnackBar(
      backgroundColor: AppColors.surfaceL3,
      duration: const Duration(seconds: 4),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title.isNotEmpty)
            Text(title,
                style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.w700)),
          if (body.isNotEmpty)
            Padding(
              padding: EdgeInsets.only(top: title.isNotEmpty ? 4 : 0),
              child: Text(body, style: const TextStyle(color: Colors.white70)),
            ),
        ],
      ),
      action: SnackBarAction(
        label: 'OPEN',
        textColor: AppColors.primary,
        onPressed: () => _onPushTap(msg),
      ),
    ));
  }

  /// Tap handler — navigate to whatever the payload points at. Falls
  /// back to the notifications list when the server didn't include a
  /// route hint.
  void _onPushTap(RemoteMessage msg) {
    try {
      ref.read(unreadNotificationCountProvider.notifier).refresh();
    } catch (_) {}
    final data = msg.data;
    String? route;
    // 1. Explicit route the backend can pre-compute (best case).
    final r = data['route'];
    if (r is String && r.startsWith('/')) {
      route = r;
    }
    // 2. Common ID-based fallbacks — match what the web frontend does
    //    for the same notification types.
    route ??= switch (data['type']?.toString()) {
      'CHAT_MESSAGE' ||
      'NEW_MESSAGE' when data['chatId'] != null =>
        '/chat?chatId=${data['chatId']}',
      'MATCH_INVITE' ||
      'MATCH_UPDATE' ||
      'MATCH_LIVE' when data['matchId'] != null =>
        '/scorecard/${data['matchId']}',
      'FOLLOW_REQUEST' ||
      'NEW_FOLLOWER' when data['userId'] != null =>
        '/user-profile?userId=${data['userId']}',
      _ => null,
    };
    final router = ref.read(routerProvider);
    router.push(route ?? '/home/notifications');
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _forcedLogoutSub?.cancel();
    _fgMessageSub?.cancel();
    _tapOpenedAppSub?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    // Re-sync the server clock when the user comes back to the app — catches
    // OS-level clock corrections that happened while we were backgrounded.
    if (state == AppLifecycleState.resumed) {
      unawaited(ServerClock.syncIfStale());
    }
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);
    final versionState = ref.watch(serverVersionProvider);

    return MaterialApp.router(
      title: 'BMS Gaming Hub',
      scaffoldMessengerKey: rootScaffoldMessengerKey,
      theme: ThemeData.dark().copyWith(
        primaryColor: AppColors.primary,
        scaffoldBackgroundColor: Colors.black,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.black,
          foregroundColor: Colors.white,
          elevation: 0,
        ),
      ),
      debugShowCheckedModeBanner: false,
      routerConfig: router,
      // Overlay the force-update screen on top of whatever the router is
      // showing — covers every route without touching app_router.dart.
      builder: (context, child) {
        if (versionState.forceUpdate) {
          return ForceUpdateScreen(
            minSupportedClient: versionState.minSupportedClient,
          );
        }
        return child ?? const SizedBox.shrink();
      },
    );
  }
}
