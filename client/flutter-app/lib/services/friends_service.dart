import 'package:dio/dio.dart';
import 'api_service.dart';

class FriendsService {
  late final Dio _dio;

  FriendsService() {
    _dio = ApiService.createSharedDio();
  }

  /// Last error from a nearby-players call. Read this after an empty result
  /// to find out why (network/auth/parse problem). Cleared on success.
  String? lastNearbyError;

  Future<List<Map<String, dynamic>>> getNearbyPlayers({
    required double latitude,
    required double longitude,
    int radiusKm = 25,
    // Legacy params kept for call-site compatibility
    String? currentUserId,
    int? ageMin,
    int? ageMax,
    String? gender,
    List<String>? sports,
  }) async {
    lastNearbyError = null;
    try {
      final response = await _dio.get(
        '/user/players/nearby',
        queryParameters: {
          'lat': latitude,
          'lng': longitude,
          'radius': radiusKm * 1000,
          'limit': 50,
        },
      );
      final data = response.data;
      // Accept several response shapes the backend might use
      List? list;
      if (data is List) {
        list = data;
      } else if (data is Map) {
        list = (data['players'] ??
            data['users'] ??
            data['nearby'] ??
            data['data'] ??
            data['result']) as List?;
      }
      if (list == null) {
        lastNearbyError = 'Unexpected response shape: ${data.runtimeType}';
        return [];
      }
      return list
          .whereType<Map>()
          .map((m) => Map<String, dynamic>.from(m))
          .toList();
    } on DioException catch (e) {
      lastNearbyError = _extractMessage(e.response?.data) ??
          'Network error (${e.response?.statusCode ?? e.type.name})';
      return [];
    } catch (e) {
      lastNearbyError = e.toString();
      return [];
    }
  }

  String? _extractMessage(dynamic data) {
    if (data is Map) {
      for (final k in const ['message', 'error', 'msg', 'detail']) {
        final v = data[k];
        if (v is String && v.isNotEmpty) return v;
      }
    }
    if (data is String && data.isNotEmpty) return data;
    return null;
  }

  Future<List<Map<String, dynamic>>> searchPlayers({
    String query = '',
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _dio.get(
        '/user/players/search',
        queryParameters: {
          if (query.isNotEmpty) 'query': query,
          'page': page,
          'limit': limit,
        },
      );
      final data = response.data;
      List<Map<String, dynamic>> raw;
      if (data is Map && data['players'] is List) {
        raw = List<Map<String, dynamic>>.from(data['players'] as List);
      } else if (data is List) {
        raw = List<Map<String, dynamic>>.from(data);
      } else {
        return [];
      }
      return raw;
    } catch (_) {
      return [];
    }
  }

  Future<bool> followPlayer(String playerId) async {
    try {
      final response = await _dio.post('/user/players/$playerId/follow');
      return response.data?['success'] == true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> unfollowPlayer(String playerId) async {
    try {
      final response = await _dio.post('/user/players/$playerId/unfollow');
      return response.data?['success'] == true;
    } catch (_) {
      return false;
    }
  }

  Future<Map<String, List<Map<String, dynamic>>>> getNetwork() async {
    try {
      final response = await _dio.get('/user/players/network');
      final data = response.data;
      if (data is Map) {
        return {
          'following': List<Map<String, dynamic>>.from(data['following'] ?? []),
          'followers': List<Map<String, dynamic>>.from(data['followers'] ?? []),
        };
      }
      return {'following': [], 'followers': []};
    } catch (_) {
      return {'following': [], 'followers': []};
    }
  }

  Future<List<Map<String, dynamic>>> getFollowingList() async {
    final network = await getNetwork();
    return network['following']!;
  }

  Future<Map<String, dynamic>?> getPlayerProfile(String playerId) async {
    try {
      final response = await _dio.get('/user/players/$playerId');
      final data = response.data;
      if (data is Map && data['profile'] != null) {
        return Map<String, dynamic>.from(data['profile'] as Map);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<bool> updateLocation(double lat, double lng,
      {bool sharing = true}) async {
    try {
      await _dio.post(
        '/user/players/location',
        data: {'lat': lat, 'lng': lng, 'sharing': sharing},
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Privacy-only update — clears server-side coords when [sharing] is false.
  /// Falls back to (0,0) so the backend wipes the row instead of persisting
  /// the user's actual fix.
  Future<bool> setLocationSharing(bool sharing,
      {double? lat, double? lng}) async {
    return updateLocation(
      sharing ? (lat ?? 0) : 0,
      sharing ? (lng ?? 0) : 0,
      sharing: sharing,
    );
  }

  // Legacy stubs so screens that haven't been fully migrated still compile
  Future<List<Map<String, dynamic>>> getFriendsList(String uid,
          {String? status}) =>
      getFollowingList();
  Future<Map<String, dynamic>?> sendFriendRequest(
          String uid, String friendId) async =>
      null;
  Future<Map<String, dynamic>?> acceptFriendRequest(String uid, int id) async =>
      null;
  Future<Map<String, dynamic>?> rejectFriendRequest(String uid, int id) async =>
      null;
  Future<Map<String, dynamic>?> removeFriend(
          String uid, String friendId) async =>
      null;
  Future<List<Map<String, dynamic>>> getPendingRequests(String uid) async => [];
  Future<Map<String, dynamic>?> getFriendshipStatus(
          String uid, String friendId) async =>
      null;
}
