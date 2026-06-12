import 'package:flutter/foundation.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import '../../config/api_config.dart';

/// Sentry setup. DSN is build-time injected:
///
///   --dart-define=SENTRY_DSN=https://xxx@oyyy.ingest.sentry.io/zzzz
///
/// An empty DSN disables Sentry entirely (default for local dev). When
/// enabled, the Sentry zone wraps [appRunner] so unhandled async errors
/// and widget-tree exceptions are captured.
class CrashReporter {
  static const String _dsn =
      String.fromEnvironment('SENTRY_DSN', defaultValue: '');

  static const String _release =
      String.fromEnvironment('APP_RELEASE', defaultValue: '');

  static bool get isEnabled => _dsn.isNotEmpty;

  static Future<void> runWithSentry(Future<void> Function() appRunner) async {
    if (!isEnabled) {
      await appRunner();
      return;
    }
    await SentryFlutter.init(
      (options) {
        options.dsn = _dsn;
        options.environment = ApiConfig.isProduction ? 'prod' : 'dev';
        options.release = _release.isNotEmpty ? _release : null;
        options.tracesSampleRate = ApiConfig.isProduction ? 0.1 : 1.0;
        options.debug = kDebugMode;
        options.attachStacktrace = true;
        // Don't ship PII by default — chat content, emails, etc.
        options.sendDefaultPii = false;
      },
      appRunner: appRunner,
    );
  }

  /// Manual capture for caught exceptions worth reporting.
  static Future<void> capture(
    Object error, {
    StackTrace? stackTrace,
    Map<String, dynamic>? context,
  }) async {
    if (!isEnabled) return;
    await Sentry.captureException(
      error,
      stackTrace: stackTrace,
      withScope: (scope) {
        if (context != null && context.isNotEmpty) {
          scope.setContexts('details', context);
        }
      },
    );
  }
}
