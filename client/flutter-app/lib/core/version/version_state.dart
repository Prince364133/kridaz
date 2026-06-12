import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app_version.dart';

/// Snapshot of what we know about server compatibility right now.
/// Updated from two sources:
///   1. `GET /version` on app boot (authoritative).
///   2. `Min-Client-Version` / `Server-Version` response headers on every
///      subsequent request (cheap continuous re-check — catches a server
///      bump while the app is live).
class ServerVersionState {
  /// Backend build id (e.g. `wave-5-hygiene`). Null until first response.
  final String? serverVersion;

  /// Lowest mobile build the server still serves. Null until first response.
  final String? minSupportedClient;

  /// True when we've observed a `minSupportedClient` and the current build
  /// is older than it. UI should overlay a "please update" screen.
  bool get forceUpdate {
    final min = minSupportedClient;
    if (min == null || min.isEmpty) return false;
    return !AppVersion.isAtLeast(min);
  }

  const ServerVersionState({
    this.serverVersion,
    this.minSupportedClient,
  });

  ServerVersionState copyWith({
    String? serverVersion,
    String? minSupportedClient,
  }) =>
      ServerVersionState(
        serverVersion: serverVersion ?? this.serverVersion,
        minSupportedClient: minSupportedClient ?? this.minSupportedClient,
      );
}

class ServerVersionNotifier extends StateNotifier<ServerVersionState> {
  ServerVersionNotifier() : super(const ServerVersionState());

  /// Merge a fresh observation. Only updates fields that came in non-null
  /// so a request that omits one header doesn't clobber the cached value.
  void observe({String? serverVersion, String? minSupportedClient}) {
    if (serverVersion == null && minSupportedClient == null) return;
    state = state.copyWith(
      serverVersion: serverVersion,
      minSupportedClient: minSupportedClient,
    );
  }
}

final serverVersionProvider =
    StateNotifierProvider<ServerVersionNotifier, ServerVersionState>(
        (ref) => ServerVersionNotifier());
