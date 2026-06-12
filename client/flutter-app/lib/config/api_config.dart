// ══════════════════════════════════════════════════════════════════════════════
// ENVIRONMENT — selected at build time via --dart-define=ENV=prod|local|emulator
//
//   prod      → live backend (default)
//   local     → physical Android/iOS on same WiFi as dev machine
//   emulator  → Android AVD / iOS Sim (10.0.2.2 / 127.0.0.1)
//
// Examples:
//   flutter run --dart-define=ENV=emulator --dart-define=RAZORPAY_KEY_ID=rzp_test_xxx
//   flutter build appbundle --dart-define=ENV=prod --dart-define=RAZORPAY_KEY_ID=$RZP
// ══════════════════════════════════════════════════════════════════════════════
enum _Env { production, localDevice, emulator }

class ApiConfig {
  static const String _envName = 
      String.fromEnvironment('ENV', defaultValue: 'prod');

  static _Env get _env {
    switch (_envName) {
      case 'local':
        return _Env.localDevice;
      case 'emulator':
        return _Env.emulator;
      case 'prod':
      default:
        return _Env.production;
    }
  }

  static const String _localHost = '10.217.104.209';
  static const String _localPort = '6001';

  // ── Resolved URLs ─────────────────────────────────────────────────────────
  // Backend pulled the /v1 prefix — canonical base is /api now. The
  // versioned form (/api/v1) is no longer mounted on either local or prod.
  static const String _productionUrl = 'https://prod-api.kridaz.com/api';
  static const String _localDeviceUrl = 'http://$_localHost:$_localPort/api';
  static const String _emulatorUrl = 'http://10.0.2.2:$_localPort/api';

  static String get apiUrl {
    switch (_env) {
      case _Env.production:
        return _productionUrl;
      case _Env.localDevice:
        return _localDeviceUrl;
      case _Env.emulator:
        return _emulatorUrl;
    }
  }

  static bool get isProduction => _env == _Env.production;

  // Convenience aliases — all services use one of these
  static String get baseUrl => apiUrl;
  static String get localBaseUrl => apiUrl;

  // True when running against a local server
  static bool get isLocal => _env != _Env.production;

  // Base host without /api or /api/vN suffix (used by socket service).
  // Matches both the legacy `/api` prefix and the versioned `/api/v<N>` form
  // so the socket service keeps connecting to the bare host.
  static String get socketUrl =>
      apiUrl.replaceAll(RegExp(r'/api(?:/v\d+)?$'), '');

  // ── Timeouts ──────────────────────────────────────────────────────────────
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // ── Razorpay ──────────────────────────────────────────────────────────────
  // Injected at build time via --dart-define=RAZORPAY_KEY_ID=...
  // No default: a missing key trips the assert in `assertConfigured()` so
  // the failure is loud at dev time instead of a silent payment error.
  static const String razorpayKeyId = String.fromEnvironment('RAZORPAY_KEY_ID');

  static void assertConfigured() {
    assert(
      razorpayKeyId.isNotEmpty,
      'RAZORPAY_KEY_ID missing. Run with: '
      'flutter run --dart-define=RAZORPAY_KEY_ID=rzp_test_xxx',
    );
  }
}
