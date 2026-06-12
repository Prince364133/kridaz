import 'api_service.dart';

/// Lightweight services for the content features that mirror the web's
/// blogs / saved / leaderboard / dispute pages. Each method maps 1:1 to
/// the web client's REST call so backend contracts stay shared.

class BlogService {
  final ApiService _api = ApiService();

  /// GET /user/blogs — list of blog posts.
  Future<List<Map<String, dynamic>>> list() async {
    final response = await _api.get<dynamic>('/user/blogs');
    if (!response.isSuccess) return const [];
    final raw = response.data;
    final list = raw is List
        ? raw
        : (raw is Map ? (raw['blogs'] ?? raw['data'] ?? []) : []) as List;
    return list.cast<Map<String, dynamic>>();
  }

  /// POST /user/blogs/:id/like — toggle like on a blog post.
  Future<bool> toggleLike(String blogId) async {
    final response = await _api.post<dynamic>('/user/blogs/$blogId/like');
    return response.isSuccess;
  }
}

class LeaderboardService {
  final ApiService _api = ApiService();

  /// Backend may expose leaderboard via `/user/leaderboard` or
  /// `/leaderboard`. Try both. Returns an empty list on miss.
  Future<List<Map<String, dynamic>>> top(
      {String? sport, int limit = 50}) async {
    for (final path in ['/user/leaderboard', '/leaderboard']) {
      final response = await _api.get<dynamic>(
        path,
        queryParameters: {
          if (sport != null) 'sport': sport,
          'limit': limit,
        },
      );
      if (response.isSuccess && response.data != null) {
        final raw = response.data;
        final list = raw is List
            ? raw
            : (raw is Map
                ? (raw['leaderboard'] ?? raw['players'] ?? raw['data'] ?? [])
                : []) as List;
        return list.cast<Map<String, dynamic>>();
      }
    }
    return const [];
  }
}

class SavedService {
  final ApiService _api = ApiService();

  /// GET /user/saved — returns the user's saved items (teams, games,
  /// players, turfs). Backend may return a flat list or grouped by type.
  Future<Map<String, List<Map<String, dynamic>>>> list() async {
    final response = await _api.get<dynamic>('/user/saved');
    if (!response.isSuccess) return const {};
    final raw = response.data;
    if (raw is Map) {
      return {
        for (final entry in raw.entries)
          entry.key.toString(): (entry.value is List
              ? (entry.value as List).cast<Map<String, dynamic>>()
              : const <Map<String, dynamic>>[]),
      };
    }
    if (raw is List) {
      // Group by `type` key when backend returns a flat list.
      final out = <String, List<Map<String, dynamic>>>{};
      for (final item in raw.cast<Map<String, dynamic>>()) {
        final type = item['type']?.toString() ?? 'other';
        (out[type] ??= []).add(item);
      }
      return out;
    }
    return const {};
  }
}

class DisputeService {
  final ApiService _api = ApiService();

  /// POST /user/dispute/raise — submit a new dispute.
  Future<bool> raise({
    required String subject,
    required String description,
    String? bookingId,
    String? gameId,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/user/dispute/raise',
      data: {
        'subject': subject,
        'description': description,
        if (bookingId != null) 'bookingId': bookingId,
        if (gameId != null) 'gameId': gameId,
      },
    );
    return response.isSuccess;
  }
}
