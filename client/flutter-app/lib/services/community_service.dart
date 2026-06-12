import '../models/post_model.dart';
import 'api_service.dart';

/// Community/social feed — posts, likes, comments, reports.
/// Mirrors the kridaz web's /user/community/* endpoints.
class CommunityService {
  static final CommunityService _instance = CommunityService._internal();
  factory CommunityService() => _instance;
  CommunityService._internal();

  final ApiService _api = ApiService();

  /// GET /user/community — paginated feed.
  /// Optional filters: page, limit, search, following, sport, lat, lng.
  Future<List<PostModel>> getFeed({
    int page = 1,
    int limit = 10,
    String? search,
    bool? following,
    String? sport,
    double? lat,
    double? lng,
  }) async {
    final params = <String, dynamic>{'page': page, 'limit': limit};
    if (search != null && search.trim().isNotEmpty) {
      params['search'] = search.trim();
    }
    if (following == true) params['following'] = 'true';
    if (sport != null && sport.isNotEmpty) params['sport'] = sport;
    if (lat != null) params['lat'] = lat;
    if (lng != null) params['lng'] = lng;

    final response = await _api.get<dynamic>(
      '/user/community',
      queryParameters: params,
    );
    if (!response.isSuccess || response.data == null) return [];

    final raw = response.data;
    List<dynamic> list;
    if (raw is List) {
      list = raw;
    } else if (raw is Map) {
      list = (raw['posts'] ?? raw['data'] ?? []) as List;
    } else {
      return [];
    }

    final posts = <PostModel>[];
    for (final item in list) {
      if (item is Map<String, dynamic>) {
        try {
          posts.add(PostModel.fromJson(item));
        } catch (_) {}
      }
    }
    return posts;
  }

  /// POST /user/community/:postId/like — toggle like.
  /// Returns the updated like-user-ids list, or null on failure.
  Future<List<String>?> toggleLike(String postId) async {
    final response = await _api.post<dynamic>(
      '/user/community/$postId/like',
      data: {},
    );
    if (!response.isSuccess || response.data == null) return null;
    final raw = response.data;
    final likesRaw =
        raw is Map ? (raw['likes'] ?? raw['data']?['likes']) : null;
    if (likesRaw is! List) return null;
    final ids = <String>[];
    for (final l in likesRaw) {
      if (l is Map) {
        final id = (l['_id'] ?? l['id'] ?? '').toString();
        if (id.isNotEmpty) ids.add(id);
      } else if (l != null) {
        ids.add(l.toString());
      }
    }
    return ids;
  }

  /// POST /user/community/:postId/comment — add a comment.
  /// Returns the created comment, or null on failure.
  Future<PostComment?> addComment(String postId, String text) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return null;
    final response = await _api.post<dynamic>(
      '/user/community/$postId/comment',
      data: {'text': trimmed},
    );
    if (!response.isSuccess || response.data == null) return null;
    final raw = response.data;
    if (raw is Map && raw['comment'] is Map<String, dynamic>) {
      return PostComment.fromJson(raw['comment'] as Map<String, dynamic>);
    }
    return null;
  }

  /// POST /user/community/:postId/report — flag a post.
  Future<bool> reportPost(String postId, String reason) async {
    final response = await _api.post<dynamic>(
      '/user/community/$postId/report',
      data: {'reason': reason},
    );
    return response.isSuccess;
  }

  /// DELETE /user/community/:postId — remove your own post (or admin).
  Future<bool> deletePost(String postId) async {
    final response = await _api.delete<dynamic>('/user/community/$postId');
    return response.isSuccess;
  }
}
