import 'package:dio/dio.dart';
import '../config/api_config.dart';
import 'api_service.dart';

/// Live-streaming integration (YouTube / Facebook).
///
/// The web frontend uses Google's OAuth in a popup to authorise the YouTube
/// account, then hits backend endpoints to create/end the stream. On mobile
/// the OAuth bit is done via `url_launcher` opening the backend's OAuth
/// initiation URL in the system browser; the backend handles the callback
/// and stores the access token under the user's account.
///
/// Endpoints (matched to the web client):
///   GET    /youtube/accounts                    — list connected YT channels
///   POST   /youtube/stream/create?matchId=<id>  — start a new stream
///   POST   /youtube/stream/end/:matchId         — end the stream
///   GET    /facebook/accounts                   — list connected FB pages
class StreamingService {
  late final Dio _dio;

  StreamingService() {
    _dio = ApiService.createSharedDio();
  }

  /// URL the user opens in the system browser to start OAuth. The backend's
  /// `/auth/youtube/start` route should redirect to Google and back into
  /// `kridaz://oauth/youtube` (a deep-link) when done.
  String youtubeOAuthUrl() =>
      '${ApiConfig.apiUrl}/auth/youtube/start?platform=mobile';

  /// Same idea for Facebook.
  String facebookOAuthUrl() =>
      '${ApiConfig.apiUrl}/auth/facebook/start?platform=mobile';

  Future<List<Map<String, dynamic>>> listYoutubeAccounts() =>
      _list('/youtube/accounts');

  Future<List<Map<String, dynamic>>> listFacebookAccounts() =>
      _list('/facebook/accounts');

  Future<List<Map<String, dynamic>>> _list(String path) async {
    try {
      final response = await _dio.get(path);
      final raw = response.data;
      final list = (raw is List
          ? raw
          : (raw is Map ? (raw['accounts'] ?? raw['data'] ?? []) : [])) as List;
      return list.cast<Map<String, dynamic>>();
    } on DioException {
      return const [];
    }
  }

  /// Create a YouTube live stream tied to the given match.
  /// Returns the stream payload (`{streamUrl, streamKey, embedUrl, ...}`)
  /// or null on failure.
  Future<Map<String, dynamic>?> createYoutubeStream({
    required String matchId,
    required String title,
    String? channelId,
  }) async {
    try {
      final response = await _dio.post(
        '/youtube/stream/create',
        queryParameters: {'matchId': matchId},
        data: {
          'title': title,
          if (channelId != null) 'channelId': channelId,
        },
      );
      return (response.data is Map)
          ? (response.data as Map).cast<String, dynamic>()
          : null;
    } on DioException {
      return null;
    }
  }

  /// End the live stream attached to the given match.
  Future<bool> endYoutubeStream(String matchId) async {
    try {
      final response = await _dio.post('/youtube/stream/end/$matchId');
      return response.statusCode == 200 || response.statusCode == 201;
    } on DioException {
      return false;
    }
  }
}
