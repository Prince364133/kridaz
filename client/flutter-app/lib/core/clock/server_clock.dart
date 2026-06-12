import 'dart:async';

import '../../services/api_service.dart';

/// Authoritative clock for booking-window / slot-bookability checks.
///
/// Device clocks drift — auto-time-zone toggles, post-travel state, and
/// flaky NTP can leave a device 5–30 minutes off the server. Comparing a
/// drifted `DateTime.now()` against a server-issued slot time can:
///   * hide slots the server would still accept (false "past"), or
///   * accept slots the server has already moved past, which fails on
///     `create-order` with a confusing 4xx after the user committed.
///
/// Call [sync] on app boot and on every `AppLifecycleState.resumed`
/// transition when the last sync is stale. Use [now] anywhere you'd
/// previously written `DateTime.now()` for booking-window decisions —
/// never for UI animations, cache TTLs, or local debounce timers
/// (those should keep using the device clock).
class ServerClock {
  static Duration _offset = Duration.zero;
  static DateTime? _lastSyncedAt;

  /// Re-sync if the last sync is older than this. 1h is a balance — short
  /// enough to catch ad-hoc clock fixes from the OS, long enough to avoid
  /// hammering the server on every screen.
  static const Duration _staleAfter = Duration(hours: 1);

  /// Server-aligned wall clock. Falls back to the device clock when no
  /// sync has happened — better stale-but-present than null in the UI.
  static DateTime now() => DateTime.now().add(_offset);

  /// Returns true when we've never synced or the last sync is stale.
  static bool get isStale {
    final last = _lastSyncedAt;
    if (last == null) return true;
    return DateTime.now().difference(last) >= _staleAfter;
  }

  /// Hit `GET /sync/clock` and recompute the offset. Best-effort: a
  /// failure leaves the previous offset in place rather than zeroing it.
  ///
  /// The offset is adjusted by half the round-trip so it approximates
  /// when the server *processed* the request, not when we received the
  /// response — keeps the offset accurate even on flaky 4G.
  static Future<void> sync() async {
    try {
      final t0 = DateTime.now();
      final response =
          await ApiService().get<Map<String, dynamic>>('/sync/clock');
      final t1 = DateTime.now();
      if (!response.isSuccess || response.data == null) return;

      final body = response.data!;
      // Contract returns { success, data: { now: "<iso>" } }
      final inner = body['data'];
      final nowStr = inner is Map ? inner['now']?.toString() : null;
      if (nowStr == null) return;

      final serverNow = DateTime.tryParse(nowStr);
      if (serverNow == null) return;

      final rttHalf =
          Duration(microseconds: t1.difference(t0).inMicroseconds ~/ 2);
      final adjustedServerNow = serverNow.subtract(rttHalf);
      _offset = adjustedServerNow.difference(DateTime.now());
      _lastSyncedAt = t1;
    } catch (_) {
      // Swallow: stale offset is better than no offset.
    }
  }

  /// Re-sync only when stale. Cheap to call — safe in lifecycle handlers.
  static Future<void> syncIfStale() async {
    if (isStale) await sync();
  }
}
