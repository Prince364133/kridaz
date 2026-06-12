import '../models/story_model.dart';
import 'api_service.dart';
import 'auth_manager.dart';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';

class StoryService {
  static final StoryService _instance = StoryService._internal();
  factory StoryService() => _instance;
  StoryService._internal();

  final ApiService _api = ApiService();
  final Logger _log = Logger();

  // GET /story/feed — returns [{author, stories:[]}]
  Future<List<StoryGroup>> getStories() async {
    final response = await _api.get<dynamic>('/story/feed');
    if (!response.isSuccess || response.data == null) {
      _log.w('getStories: failed or null — ${response.data}');
      return [];
    }

    List<dynamic> raw;
    if (response.data is Map && response.data['stories'] is List) {
      raw = response.data['stories'] as List;
    } else if (response.data is List) {
      raw = response.data as List;
    } else {
      _log.w('getStories: unexpected shape — ${response.data.runtimeType}');
      return [];
    }

    _log.d('getStories: ${raw.length} raw groups');

    final groups = <StoryGroup>[];
    for (final item in raw) {
      if (item is! Map<String, dynamic>) continue;
      try {
        groups.add(StoryGroup.fromJson(item));
      } catch (e) {
        _log.w('getStories: skipped malformed group — $e\n$item');
      }
    }
    return groups;
  }

  /// The logged-in user's own active stories.
  ///
  /// There is no `/story/me` endpoint on the backend — we derive this by
  /// filtering `/story/feed` for the group whose author id matches the
  /// current user. The story page calls [getStories] anyway, so in
  /// practice this is two paths reading the same response; both are
  /// served from the same Dio client and benefit from any HTTP cache.
  Future<StoryGroup?> getMyStories() async {
    final me = AuthManager().currentUser;
    final myId = (me?['id'] ?? me?['_id'])?.toString();
    if (myId == null || myId.isEmpty) return null;

    final groups = await getStories();
    for (final g in groups) {
      if (g.author.id == myId) return g;
    }
    return null;
  }

  // POST /story/:storyId/view
  Future<void> viewStory(String storyId) async {
    await _api.post<dynamic>('/story/$storyId/view', data: {});
  }

  // DELETE /story/:storyId
  Future<bool> deleteStory(String storyId) async {
    final response = await _api.delete<dynamic>('/story/$storyId');
    return response.isSuccess;
  }

  // Step 1: request presigned upload URL
  // GET /story/upload-url?contentType=image/jpeg
  // Returns {uploadUrl, storyId, key}
  Future<Map<String, String>?> requestUploadUrl({
    required String mediaType,
    required String ext,
  }) async {
    final contentType = mediaType == 'video' ? 'video/mp4' : 'image/jpeg';
    final response = await _api.get<Map<String, dynamic>>(
      '/story/upload-url',
      queryParameters: {'contentType': contentType, 'fileName': 'story.$ext'},
    );
    if (!response.isSuccess || response.data == null) return null;
    final data = response.data as Map<String, dynamic>;
    final url = data['uploadUrl']?.toString();
    final id = data['storyId']?.toString();
    final key = data['key']?.toString();
    if (url == null || id == null || key == null) return null;
    return {'uploadUrl': url, 'storyId': id, 'key': key};
  }

  // Step 2: upload file directly to R2 (presigned PUT)
  Future<bool> uploadToR2(String uploadUrl, File file, String mimeType) async {
    try {
      final bytes = await file.readAsBytes();
      final res = await http.put(
        Uri.parse(uploadUrl),
        headers: {'Content-Type': mimeType},
        body: bytes,
      );
      return res.statusCode >= 200 && res.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  // Step 3: confirm story (triggers processing/HLS)
  // POST /story/confirm-upload with {storyId, key, mediaType, durationDays}
  Future<bool> confirmStory(String storyId, String key,
      {String mediaType = 'image'}) async {
    final response = await _api.post<dynamic>(
      '/story/confirm-upload',
      data: {
        'storyId': storyId,
        'key': key,
        'mediaType': mediaType,
        'durationDays': 1
      },
    );
    return response.isSuccess;
  }
}
