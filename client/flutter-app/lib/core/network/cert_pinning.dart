import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:dio/dio.dart';
import 'package:dio/io.dart';

import '../../config/api_config.dart';

/// Cert pinning for the production backend.
///
/// Pins are injected at build time as a comma-separated list of base64
/// SHA-256 fingerprints of the leaf certificate's DER bytes:
///
///   --dart-define=CERT_PINS=AAAA...=,BBBB...=
///
/// In production the pin list MUST be non-empty: a missing pin trips the
/// startup assert. In dev/local builds we skip pinning so self-signed certs
/// and plain HTTP work without ceremony.
class CertPinning {
  static const String _rawPins =
      String.fromEnvironment('CERT_PINS', defaultValue: '');

  static List<String> get pins => _rawPins
      .split(',')
      .map((p) => p.trim())
      .where((p) => p.isNotEmpty)
      .toList(growable: false);

  static bool get isEnabled => pins.isNotEmpty && ApiConfig.isProduction;

  /// Attach the pinning adapter to a Dio instance if enabled.
  static void apply(Dio dio) {
    if (!isEnabled) return;
    final allowed = pins.toSet();
    dio.httpClientAdapter = IOHttpClientAdapter(
      createHttpClient: () {
        final client = HttpClient();
        client.badCertificateCallback = (cert, host, port) {
          final fingerprint = base64.encode(sha256.convert(cert.der).bytes);
          return allowed.contains(fingerprint);
        };
        return client;
      },
    );
  }

  static void assertConfigured() {
    assert(
      !ApiConfig.isProduction || pins.isNotEmpty,
      'CERT_PINS is empty in a production build. '
      'Run with: --dart-define=CERT_PINS=<base64-sha256-of-cert-DER>',
    );
  }
}
