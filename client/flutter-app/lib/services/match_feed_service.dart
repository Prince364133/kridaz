import 'booking_service.dart';
import 'game_service.dart';

/// Aggregates live + recently-completed match data the home / join-games
/// screens want to surface. Combines three sources, in priority order:
///
///   1. The user's hosted games (`/hosted-game/my-hosted`)
///   2. The user's joined games (`/hosted-game/my-joined`)
///   3. Nearby games in the user's city (`/hosted-game/list?city=…`) — only
///      used as fallback when 1+2 don't have enough live matches.
///
/// Each returned map is the raw hosted-game JSON; the caller renders it.
/// Status values the backend uses: `UPCOMING` · `ACTIVE` · `LIVE`
/// · `COMPLETED` · `CANCELLED`. `gameType == 'SCORING_MATCH'` flags cricket
/// matches that have a scoring session attached.
class MatchFeedService {
  static final MatchFeedService _instance = MatchFeedService._internal();
  factory MatchFeedService() => _instance;
  MatchFeedService._internal();

  final _booking = BookingService();
  final _games = GameService();

  /// Returns matches a player would care about watching right now.
  ///
  /// Priority:
  /// - Hosted + joined matches with status == LIVE first
  /// - Nearby live matches (same city) appended afterwards as fallback
  /// Deduplicated by game id.
  Future<List<Map<String, dynamic>>> liveForUser({String? nearbyCity}) async {
    final hosted = await _booking.getMyHostedGames();
    final joined = await _booking.getMyJoinedGames();
    final mine = _filterLive([...hosted, ...joined]);

    if (nearbyCity != null && nearbyCity.isNotEmpty) {
      final nearby = await _games.listGames(city: nearbyCity);
      final nearbyLive = _filterLive(nearby);
      // Dedup by id so a hosted game that also matched the nearby query
      // doesn't appear twice.
      final seen = mine.map(_idOf).whereType<String>().toSet();
      for (final g in nearbyLive) {
        final id = _idOf(g);
        if (id == null || seen.contains(id)) continue;
        seen.add(id);
        mine.add(g);
      }
    }

    // Sort: hosted/joined-by-me first (priority), then everything else by
    // most recently updated.
    mine.sort((a, b) {
      final da = _date(a);
      final db = _date(b);
      if (da == null && db == null) return 0;
      if (da == null) return 1;
      if (db == null) return -1;
      return db.compareTo(da);
    });
    return mine;
  }

  /// Recently-completed matches the user was involved in. Returns the most
  /// recent N (default 10) sorted newest first.
  Future<List<Map<String, dynamic>>> recentForUser({int limit = 10}) async {
    final hosted = await _booking.getMyHostedGames();
    final joined = await _booking.getMyJoinedGames();
    final all = <Map<String, dynamic>>[...hosted, ...joined];

    final completed = all.where((g) {
      final status = g['status']?.toString().toUpperCase();
      return status == 'COMPLETED';
    }).toList();

    // Dedup by id.
    final seen = <String>{};
    final unique = <Map<String, dynamic>>[];
    for (final g in completed) {
      final id = _idOf(g);
      if (id == null || seen.add(id)) unique.add(g);
    }

    unique.sort((a, b) {
      final da = _date(a);
      final db = _date(b);
      if (da == null && db == null) return 0;
      if (da == null) return 1;
      if (db == null) return -1;
      return db.compareTo(da);
    });

    return unique.take(limit).toList();
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  List<Map<String, dynamic>> _filterLive(List<Map<String, dynamic>> games) {
    return games.where((g) {
      final status = g['status']?.toString().toUpperCase();
      final isLive = g['isLive'] == true;
      // Treat both the explicit isLive flag (older shape) and status==LIVE
      // (current backend) as "live". Some endpoints may send IN_PROGRESS.
      return isLive ||
          status == 'LIVE' ||
          status == 'IN_PROGRESS' ||
          status == 'SCORING';
    }).toList();
  }

  String? _idOf(Map<String, dynamic> g) => (g['id'] ?? g['_id'])?.toString();

  DateTime? _date(Map<String, dynamic> g) {
    final raw = g['updatedAt']?.toString() ??
        g['date']?.toString() ??
        g['createdAt']?.toString();
    if (raw == null || raw.isEmpty) return null;
    try {
      return DateTime.parse(raw).toLocal();
    } catch (_) {
      return null;
    }
  }
}
