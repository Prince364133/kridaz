import 'package:dio/dio.dart';

import 'api_service.dart';

/// Client surface for the Phase 1-7 player-profile backend
/// (`server/modules/player/routes/user.routes.js`). One method per
/// endpoint; every call returns a plain `Map<String, dynamic>` or
/// `List<Map<String, dynamic>>` so screens can render without an
/// intermediate model layer.
///
/// All methods swallow Dio errors and return a sensible empty value
/// — the calling widget should treat empty/null as "render the empty
/// hint", never as a fatal error. Real auth/network failures are
/// already surfaced by `ApiService` via the shared interceptors.
class PlayerProfileService {
  late final Dio _dio;

  PlayerProfileService() {
    _dio = ApiService.createSharedDio();
  }

  // ── Phase 2: per-sport stats + recent matches + activity ──────────

  /// `GET /user/players/:id/stats?sport=` — returns a list of per-sport
  /// stat rows. Backend gates on `privacyFlags.statsPublic`; a 403 is
  /// reported as an empty list with [statsGated] set true on the result
  /// map. The strip widget reads `gated` to swap in a "Stats are private"
  /// hint when set.
  Future<Map<String, dynamic>> getStats(String userId, {String? sport}) async {
    try {
      final response = await _dio.get(
        '/user/players/$userId/stats',
        queryParameters: {
          if (sport != null && sport.isNotEmpty) 'sport': sport
        },
      );
      final data = response.data;
      if (data is Map<String, dynamic>) return data;
      if (data is List) return {'stats': data};
      return const {};
    } on DioException catch (e) {
      if (e.response?.statusCode == 403) {
        return {'gated': true, 'stats': const []};
      }
      return const {};
    } catch (_) {
      return const {};
    }
  }

  /// `GET /user/players/:id/matches?sport=&cursor=&limit=` — cursor
  /// paginated MatchParticipant feed.
  Future<Map<String, dynamic>> getMatches(
    String userId, {
    String? sport,
    String? cursor,
    int limit = 20,
  }) async {
    try {
      final response = await _dio.get(
        '/user/players/$userId/matches',
        queryParameters: {
          if (sport != null && sport.isNotEmpty) 'sport': sport,
          if (cursor != null) 'cursor': cursor,
          'limit': limit,
        },
      );
      final data = response.data;
      if (data is Map<String, dynamic>) return data;
      return const {'matches': []};
    } catch (_) {
      return const {'matches': []};
    }
  }

  /// `GET /user/players/:id/activity?window=30d|90d|365d`. Returns
  /// `{perDay, weekdayHistogram, mostActiveDay, peakHour}`.
  Future<Map<String, dynamic>> getActivity(
    String userId, {
    String window = '30d',
  }) async {
    try {
      final response = await _dio.get(
        '/user/players/$userId/activity',
        queryParameters: {'window': window},
      );
      final data = response.data;
      if (data is Map<String, dynamic>) return data;
      return const {};
    } catch (_) {
      return const {};
    }
  }

  // ── Phase 3: peer reviews ─────────────────────────────────────────

  /// `POST /user/match/:matchId/review` — body
  /// `{reviews: [{revieweeId, sportsmanship, punctuality, skill,
  /// tags?, note?}, ...]}`. Rate-limited at 5/hr; backend returns 429
  /// when exceeded.
  Future<Map<String, dynamic>> submitReviews(
    String matchId,
    List<Map<String, dynamic>> reviews,
  ) async {
    try {
      final response = await _dio.post(
        '/user/match/$matchId/review',
        data: {'reviews': reviews},
      );
      final data = response.data;
      if (data is Map<String, dynamic>) return data;
      return {'success': true};
    } on DioException catch (e) {
      return {
        'success': false,
        'status': e.response?.statusCode,
        'error': e.response?.data is Map
            ? (e.response!.data as Map)['message']?.toString()
            : null,
      };
    } catch (_) {
      return const {'success': false};
    }
  }

  /// `GET /user/players/:id/reviews?cursor=&limit=` — paginated reviews
  /// + the aggregate roll-up (`{average, topTags[]}`).
  Future<Map<String, dynamic>> getReviews(
    String userId, {
    String? cursor,
    int limit = 20,
  }) async {
    try {
      final response = await _dio.get(
        '/user/players/$userId/reviews',
        queryParameters: {
          if (cursor != null) 'cursor': cursor,
          'limit': limit,
        },
      );
      final data = response.data;
      if (data is Map<String, dynamic>) return data;
      return const {'reviews': []};
    } catch (_) {
      return const {'reviews': []};
    }
  }

  // ── Phase 4: achievements + XP + leaderboard ──────────────────────

  /// `GET /user/players/:id/achievements` — newest first, with catalog
  /// metadata joined.
  Future<List<Map<String, dynamic>>> getAchievements(String userId) async {
    try {
      final response = await _dio.get('/user/players/$userId/achievements');
      final data = response.data;
      final list = data is List
          ? data
          : (data is Map ? data['achievements'] as List? : null);
      if (list == null) return const [];
      return list.whereType<Map>().map(Map<String, dynamic>.from).toList();
    } catch (_) {
      return const [];
    }
  }

  /// `GET /user/players/leaderboard?sport=&city=&limit=` — per-sport per-
  /// city ranking. Phase 7 ships a Redis read-through; the response now
  /// includes `source: 'cache' | 'live'`.
  Future<Map<String, dynamic>> getLeaderboard({
    required String sport,
    String? city,
    int limit = 50,
  }) async {
    try {
      final response = await _dio.get(
        '/user/players/leaderboard',
        queryParameters: {
          'sport': sport,
          if (city != null && city.isNotEmpty) 'city': city,
          'limit': limit,
        },
      );
      final data = response.data;
      if (data is Map<String, dynamic>) return data;
      return const {'entries': []};
    } catch (_) {
      return const {'entries': []};
    }
  }

  // ── Phase 5: media gallery + cover ────────────────────────────────

  /// `POST /user/players/me/cover` — 8 MB cap. [filePath] is a local
  /// path picked from gallery; backend writes `User.coverImage`.
  Future<String?> uploadCover(String filePath) async {
    try {
      final form = FormData.fromMap({
        'coverImage': await MultipartFile.fromFile(filePath),
      });
      final response = await _dio.post('/user/players/me/cover', data: form);
      final data = response.data;
      if (data is Map) {
        return (data['coverImage'] ?? data['url'] ?? data['secure_url'])
            ?.toString();
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /// `POST /user/players/me/media` — 5 MB cap, photo only (Phase 5).
  Future<Map<String, dynamic>?> uploadMedia(
    String filePath, {
    String? caption,
    List<String>? tags,
    String? matchId,
  }) async {
    try {
      final form = FormData.fromMap({
        'photo': await MultipartFile.fromFile(filePath),
        if (caption != null) 'caption': caption,
        if (tags != null) 'tags': tags,
        if (matchId != null) 'matchId': matchId,
      });
      final response = await _dio.post('/user/players/me/media', data: form);
      final data = response.data;
      if (data is Map<String, dynamic>) return data;
      return null;
    } catch (_) {
      return null;
    }
  }

  /// `PATCH /user/players/me/media/:mediaId` — caption / tags / pinned.
  /// Pinned cap is MAX_PINNED_PHOTOS = 4 on the server.
  Future<bool> patchMedia(
    String mediaId, {
    String? caption,
    List<String>? tags,
    bool? isPinned,
  }) async {
    try {
      final response = await _dio.patch(
        '/user/players/me/media/$mediaId',
        data: {
          if (caption != null) 'caption': caption,
          if (tags != null) 'tags': tags,
          if (isPinned != null) 'isPinned': isPinned,
        },
      );
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  /// `DELETE /user/players/me/media/:mediaId` — owner only.
  Future<bool> deleteMedia(String mediaId) async {
    try {
      final response = await _dio.delete('/user/players/me/media/$mediaId');
      return response.statusCode == 200 || response.statusCode == 204;
    } catch (_) {
      return false;
    }
  }

  /// `GET /user/players/:id/media?type=photo` — paginated gallery.
  Future<List<Map<String, dynamic>>> getMedia(
    String userId, {
    String type = 'photo',
  }) async {
    try {
      final response = await _dio.get(
        '/user/players/$userId/media',
        queryParameters: {'type': type},
      );
      final data = response.data;
      final list =
          data is List ? data : (data is Map ? data['media'] as List? : null);
      if (list == null) return const [];
      return list.whereType<Map>().map(Map<String, dynamic>.from).toList();
    } catch (_) {
      return const [];
    }
  }

  // ── Phase 6: discovery + moderation ───────────────────────────────

  /// `GET /user/players/discover` — facets: q, sport, city, state,
  /// minRating, skillLevel. Cursor paginated by `id desc`.
  Future<Map<String, dynamic>> discoverPlayers({
    String? q,
    String? sport,
    String? city,
    String? state,
    num? minRating,
    String? skillLevel,
    String? cursor,
    int limit = 20,
  }) async {
    try {
      final response = await _dio.get(
        '/user/players/discover',
        queryParameters: {
          if (q != null && q.isNotEmpty) 'q': q,
          if (sport != null && sport.isNotEmpty) 'sport': sport,
          if (city != null && city.isNotEmpty) 'city': city,
          if (state != null && state.isNotEmpty) 'state': state,
          if (minRating != null) 'minRating': minRating,
          if (skillLevel != null) 'skillLevel': skillLevel,
          if (cursor != null) 'cursor': cursor,
          'limit': limit,
        },
      );
      final data = response.data;
      if (data is Map<String, dynamic>) return data;
      return const {'players': []};
    } catch (_) {
      return const {'players': []};
    }
  }

  /// `POST /user/players/:id/view` — UTC-day-deduped on the server.
  Future<void> recordProfileView(String userId) async {
    try {
      await _dio.post('/user/players/$userId/view');
    } catch (_) {
      // fire-and-forget; no UI failure mode
    }
  }

  /// `GET /user/players/me/viewers` — paginated recent viewers.
  Future<List<Map<String, dynamic>>> getMyViewers({
    String? cursor,
    int limit = 50,
  }) async {
    try {
      final response = await _dio.get(
        '/user/players/me/viewers',
        queryParameters: {
          if (cursor != null) 'cursor': cursor,
          'limit': limit,
        },
      );
      final data = response.data;
      final list =
          data is List ? data : (data is Map ? data['viewers'] as List? : null);
      if (list == null) return const [];
      return list.whereType<Map>().map(Map<String, dynamic>.from).toList();
    } catch (_) {
      return const [];
    }
  }

  /// `POST /user/players/:id/report` — closed reason set:
  /// `inappropriate_content | harassment | spam | impersonation |
  /// underage | safety | other`.
  Future<bool> reportPlayer(
    String userId, {
    required String reason,
    String? details,
  }) async {
    try {
      final response = await _dio.post(
        '/user/players/$userId/report',
        data: {
          'reason': reason,
          if (details != null) 'details': details,
        },
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (_) {
      return false;
    }
  }

  /// `POST /user/players/:id/block`. Idempotent. Backend tears down
  /// follow edges in both directions inside the same transaction.
  Future<bool> blockPlayer(String userId) async {
    try {
      final response = await _dio.post('/user/players/$userId/block');
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (_) {
      return false;
    }
  }

  /// `DELETE /user/players/:id/block`.
  Future<bool> unblockPlayer(String userId) async {
    try {
      final response = await _dio.delete('/user/players/$userId/block');
      return response.statusCode == 200 || response.statusCode == 204;
    } catch (_) {
      return false;
    }
  }

  // ── Phase 7: mutuals + QR ─────────────────────────────────────────

  /// `GET /user/players/:id/mutual` — up to 50 mutual followers.
  Future<List<Map<String, dynamic>>> getMutualConnections(String userId) async {
    try {
      final response = await _dio.get('/user/players/$userId/mutual');
      final data = response.data;
      final list =
          data is List ? data : (data is Map ? data['mutual'] as List? : null);
      if (list == null) return const [];
      return list.whereType<Map>().map(Map<String, dynamic>.from).toList();
    } catch (_) {
      return const [];
    }
  }

  /// `GET /user/players/me/qr?format=png|svg` — returns the raw bytes
  /// (PNG) or SVG string. Cache-Control private 10m on server.
  Future<Response<List<int>>?> getMyQr({String format = 'png'}) async {
    try {
      final response = await _dio.get<List<int>>(
        '/user/players/me/qr',
        queryParameters: {'format': format},
        options: Options(responseType: ResponseType.bytes),
      );
      return response;
    } catch (_) {
      return null;
    }
  }
}
