import 'package:connectivity_plus/connectivity_plus.dart';

/// Thin wrapper over [Connectivity] so repositories don't depend on the
/// `connectivity_plus` API directly (easier to mock in tests).
class NetworkInfo {
  final Connectivity _connectivity;

  NetworkInfo([Connectivity? connectivity])
      : _connectivity = connectivity ?? Connectivity();

  /// True if the device has any active network interface (wifi/mobile/ethernet).
  /// Note: this does NOT guarantee the backend is reachable — use it as a
  /// fast-fail before queueing an outbound request.
  Future<bool> get isOnline async {
    final results = await _connectivity.checkConnectivity();
    return results.any((r) => r != ConnectivityResult.none);
  }

  Stream<bool> get onStatusChange => _connectivity.onConnectivityChanged
      .map((results) => results.any((r) => r != ConnectivityResult.none))
      .distinct();
}
