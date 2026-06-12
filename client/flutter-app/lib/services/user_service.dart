import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';
import 'auth_manager.dart';

/// UserService — profile operations backed by Kridaz MongoDB API.
/// All sync calls go to /user/auth/updateProfile (PUT) and
/// /user/auth/getMe (GET). Local SharedPreferences is used as a cache.
class UserService {
  late final Dio _dio;

  static Map<String, dynamic>? _cachedProfile;
  static String? _cachedUserId;
  static DateTime? _cacheTime;
  static const Duration _cacheDuration = Duration(minutes: 5);

  UserService() {
    _dio = ApiService.createSharedDio(
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
    );
  }

  static const String _localProfileKey = 'user_profile_data';

  bool _isCacheValid() {
    if (_cachedProfile == null ||
        _cachedUserId != currentUserId ||
        _cacheTime == null) {
      return false;
    }
    return DateTime.now().difference(_cacheTime!) < _cacheDuration;
  }

  static void clearCache() {
    _cachedProfile = null;
    _cachedUserId = null;
    _cacheTime = null;
  }

  String? get currentUserId =>
      (AuthManager().currentUser?['id'] ?? AuthManager().currentUser?['_id'])
          ?.toString();

  Map<String, dynamic> createUserProfile({
    required String firstName,
    required String lastName,
    required String dateOfBirth,
    required String gender,
    required List<String> interests,
    String? email,
    String? photoURL,
    String? phoneNumber,
    String? location,
    String? role,
    bool isOnline = true,
    Map<String, dynamic>? settings,
  }) {
    return {
      'firstName': firstName,
      'lastName': lastName,
      'fullName': '$firstName $lastName',
      'dateOfBirth': dateOfBirth,
      'gender': gender,
      'interests': interests,
      'favourites': interests,
      'email': email ?? AuthManager().currentUser?['email']?.toString(),
      'phoneNumber':
          phoneNumber ?? AuthManager().currentUser?['phone']?.toString(),
      'profilePhoto':
          photoURL ?? AuthManager().currentUser?['profilePicture']?.toString(),
      'photoURL':
          photoURL ?? AuthManager().currentUser?['profilePicture']?.toString(),
      'location': location ?? 'Hyderabad',
      'Role': role ?? 'Executive member',
      'isOnline': isOnline,
      'year': _calculateBirthYear(dateOfBirth),
      'gamesPlayed': 0,
      'stats': {'totalGames': 0, 'wins': 0, 'losses': 0, 'draws': 0},
      'settings': settings ??
          {
            'locationVisibility': 'friends',
            'onlineStatus': true,
            'notifications': true,
          },
      'uid': currentUserId,
      'createdAt': DateTime.now().toIso8601String(),
      'updatedAt': DateTime.now().toIso8601String(),
    };
  }

  int _calculateBirthYear(String dateOfBirth) {
    try {
      final parts = dateOfBirth.split('/');
      if (parts.length == 3) return int.parse(parts[2]);
    } catch (_) {}
    return DateTime.now().year - 25;
  }

  Future<bool> saveUserProfile({
    required String firstName,
    required String lastName,
    required String dateOfBirth,
    required String gender,
    required List<String> interests,
  }) async {
    try {
      if (currentUserId == null) return false;
      final profile = createUserProfile(
        firstName: firstName,
        lastName: lastName,
        dateOfBirth: dateOfBirth,
        gender: gender,
        interests: interests,
      );
      await _saveProfileLocally(profile);
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<void> _saveProfileLocally(Map<String, dynamic> profile) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final clean = Map<String, dynamic>.from(profile);
      clean['updatedAt'] = DateTime.now().toIso8601String();
      await prefs.setString(_localProfileKey, json.encode(clean));
    } catch (e) {}
  }

  Future<Map<String, dynamic>?> getUserProfile() async {
    try {
      if (currentUserId == null) return null;

      if (_isCacheValid()) return _cachedProfile;

      try {
        final backendProfile = await fetchUserFromBackend();
        if (backendProfile != null) {
          await _saveProfileLocally(backendProfile);
          _cachedProfile = backendProfile;
          _cachedUserId = currentUserId;
          _cacheTime = DateTime.now();
          return backendProfile;
        }
      } catch (e) {}

      try {
        final prefs = await SharedPreferences.getInstance();
        final profileJson = prefs.getString(_localProfileKey);
        if (profileJson != null) {
          final profile = json.decode(profileJson) as Map<String, dynamic>;
          _cachedProfile = profile;
          _cachedUserId = currentUserId;
          _cacheTime = DateTime.now();
          return profile;
        }
      } catch (_) {}

      return null;
    } catch (e) {
      return null;
    }
  }

  /// Update profile on Kridaz backend via PUT /user/auth/updateProfile
  Future<bool> updateUserProfile(Map<String, dynamic> updates) async {
    try {
      if (currentUserId == null) return false;

      final payload = <String, dynamic>{};
      if (updates['firstName'] != null || updates['lastName'] != null) {
        final fn = updates['firstName'] ?? '';
        final ln = updates['lastName'] ?? '';
        payload['name'] = '$fn $ln'.trim();
      }
      if (updates['name'] != null) payload['name'] = updates['name'];
      if (updates['username'] != null)
        payload['username'] = updates['username'];
      if (updates['gender'] != null) payload['gender'] = updates['gender'];
      if (updates['interests'] != null) {
        payload['sportTypes'] = updates['interests'];
        payload['interests'] = updates['interests'];
      }
      if (updates['sportTypes'] != null) {
        payload['sportTypes'] = updates['sportTypes'];
      }
      if (updates['phone'] != null) payload['phone'] = updates['phone'];
      if (updates['location'] != null)
        payload['location'] = updates['location'];
      if (updates['city'] != null) payload['city'] = updates['city'];
      if (updates['state'] != null) payload['state'] = updates['state'];
      if (updates['bio'] != null) payload['bio'] = updates['bio'];
      if (updates['dob'] != null) payload['dob'] = updates['dob'];
      if (updates['dateOfBirth'] != null)
        payload['dob'] = updates['dateOfBirth'];
      if (updates['profilePicture'] != null) {
        payload['profilePicture'] = updates['profilePicture'];
      }
      // Phase 1 — gameplay fields (whitelisted server-side via
      // EDITABLE_PROFILE_FIELDS; anything else is dropped by backend)
      for (final k in const [
        'coverImage',
        'preferredFoot',
        'preferredHand',
        'languages',
        'travelRadiusKm',
        'lookingFor',
        'skillLevels',
        'preferredPositions',
        'availability',
        'privacyFlags',
        'notificationPreferences',
        'locationSharingEnabled',
      ]) {
        if (updates[k] != null) payload[k] = updates[k];
      }

      final response =
          await _dio.put('/user/auth/updateProfile', data: payload);

      if (response.statusCode == 200) {
        clearCache();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<bool> userProfileExists() async {
    try {
      if (currentUserId == null) return false;
      final profile = await fetchUserFromBackend();
      return profile != null;
    } catch (e) {
      return false;
    }
  }

  Future<bool> deleteUserProfile() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_localProfileKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> updateFirstName(String firstName) =>
      updateUserProfile({'firstName': firstName});
  Future<bool> updateLastName(String lastName) =>
      updateUserProfile({'lastName': lastName});
  Future<bool> updateDateOfBirth(String dateOfBirth) =>
      updateUserProfile({'dateOfBirth': dateOfBirth});
  Future<bool> updateGender(String gender) =>
      updateUserProfile({'gender': gender});
  Future<bool> updateInterests(List<String> interests) =>
      updateUserProfile({'interests': interests});

  Future<bool> updatePhoneNumber(String phoneNumber) =>
      updateUserProfile({'phone': phoneNumber});

  /// GET /user/auth/check-username?username=... — returns true if the
  /// requested handle is still available. Mirrors the web client's
  /// availability check.
  Future<bool> isUsernameAvailable(String username) async {
    if (username.trim().isEmpty) return false;
    try {
      final token = AuthManager().token;
      final response = await _dio.get<dynamic>(
        '/user/auth/check-username',
        queryParameters: {'username': username.trim()},
        options: Options(headers: {
          if (token != null) 'Authorization': 'Bearer $token',
        }),
      );
      final data = response.data;
      if (data is Map) {
        return data['available'] == true ||
            data['isAvailable'] == true ||
            data['success'] == true;
      }
      return response.statusCode == 200;
    } on DioException {
      return false;
    }
  }

  Future<bool> updatePhotoUrl(String photoUrl) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_photo_url', photoUrl);
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> updateLocation({
    required String location,
    required double latitude,
    required double longitude,
  }) async {
    if (location == 'Current Location' ||
        location.isEmpty ||
        location == 'Unknown') {
      return false;
    }
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_location', location);
      await prefs.setString('user_latitude', latitude.toString());
      await prefs.setString('user_longitude', longitude.toString());
      return await updateUserProfile({'location': location});
    } catch (e) {
      return false;
    }
  }

  Future<Map<String, String?>> getSavedLocation() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'location': prefs.getString('user_location'),
      'latitude': prefs.getString('user_latitude'),
      'longitude': prefs.getString('user_longitude'),
    };
  }

  Future<String?> getSavedPhotoUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('user_photo_url');
  }

  /// Sync onboarding data to Kridaz via PUT /user/auth/updateProfile
  Future<bool> syncUserToBackend({
    required String firstName,
    required String lastName,
    required String dateOfBirth,
    required String gender,
    required List<String> interests,
    String? photoUrl,
    String? location,
  }) async {
    try {
      if (currentUserId == null) return false;

      final payload = <String, dynamic>{
        'name': '$firstName $lastName'.trim(),
        'gender': gender,
        'sportTypes': interests,
        'interests': interests,
        'dob': dateOfBirth,
        if (location != null && location.isNotEmpty) 'location': location,
      };

      final response =
          await _dio.put('/user/auth/updateProfile', data: payload);

      if (response.statusCode == 200) {
        clearCache();
        return true;
      }
      return false;
    } on DioException {
      return false;
    } catch (e) {
      return false;
    }
  }

  /// Fetch current user profile from GET /user/auth/getMe
  Future<Map<String, dynamic>?> fetchUserFromBackend() async {
    try {
      if (currentUserId == null) return null;

      final response = await _dio.get('/user/auth/getMe');

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final u = (data['user'] as Map<String, dynamic>?) ?? data;

        final nameParts = (u['name'] as String? ?? '').split(' ');
        final firstName = nameParts.isNotEmpty ? nameParts.first : '';
        final lastName =
            nameParts.length > 1 ? nameParts.sublist(1).join(' ') : '';

        // _count.followers/following is surfaced at top level by
        // buildAuthUserPayload (sanitizeUser.js). Older payloads ship
        // them as `followersCount/followingCount` directly.
        final followers = u['followersCount'] ?? u['_count']?['followers'] ?? 0;
        final following = u['followingCount'] ?? u['_count']?['following'] ?? 0;

        return {
          'firstName': firstName,
          'lastName': lastName,
          'fullName': u['name'] ?? '',
          'name': u['name'] ?? '',
          'username': u['username'],
          'dateOfBirth': u['dob'] ?? '',
          'dob': u['dob'],
          'gender': u['gender'] ?? '',
          'bio': u['bio'] ?? '',
          'interests':
              List<String>.from(u['sportTypes'] ?? u['interests'] ?? []),
          'favourites': List<String>.from(u['sportTypes'] ?? []),
          'sportTypes': List<String>.from(u['sportTypes'] ?? []),
          'email': u['email'],
          'phoneNumber': u['phone'],
          'phone': u['phone'],
          'profilePhoto': u['profilePicture'],
          'photoURL': u['profilePicture'],
          'profilePicture': u['profilePicture'],
          'coverImage': u['coverImage'],
          'location': u['city'] ?? u['location'] ?? '',
          'city': u['city'],
          'state': u['state'],
          'uid': u['_id'] ?? u['id'],
          'id': u['_id'] ?? u['id'],
          // Phase 1 — gameplay profile fields
          'preferredFoot': u['preferredFoot'],
          'preferredHand': u['preferredHand'],
          'languages': List<String>.from(u['languages'] ?? const []),
          'travelRadiusKm': u['travelRadiusKm'],
          'lookingFor': List<String>.from(u['lookingFor'] ?? const []),
          'skillLevels': u['skillLevels'] ?? const {},
          'preferredPositions': u['preferredPositions'] ?? const {},
          'availability': u['availability'] ?? const {},
          'privacyFlags': u['privacyFlags'] ?? const {},
          // Phase 1 — XP + verification + counters
          'xp': u['xp'] ?? 0,
          'level': u['level'] ?? 1,
          'verifiedPhone': u['verifiedPhone'] == true,
          'verifiedEmail': u['verifiedEmail'] == true,
          'verifiedId': u['verifiedId'] == true,
          'profileViewsCount': u['profileViewsCount'] ?? 0,
          'followersCount': followers,
          'followingCount': following,
          'profileShapeVersion':
              u['profileShapeVersion'] ?? data['profileShapeVersion'],
          'onboardingComplete':
              (u['phone'] != null && (u['phone'] as String).isNotEmpty),
        };
      }
      return null;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return null;
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<bool> hasCompletedOnboarding() async {
    try {
      final profile = await getUserProfile();
      return profile?['onboardingComplete'] == true;
    } catch (_) {
      return false;
    }
  }

  Future<Map<String, dynamic>?> syncOnLogin() async {
    try {
      if (currentUserId == null) return null;
      final existing = await fetchUserFromBackend();
      if (existing != null) {
        await _saveProfileLocally(existing);
        return existing;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Search players by name/username for team invite flow.
  /// Calls GET /user/players/search?query=<query>
  Future<List<Map<String, dynamic>>> searchPlayers(String query) async {
    try {
      final response = await _dio.get(
        '/user/players/search',
        queryParameters: {'query': query},
      );
      if (response.statusCode == 200) {
        final data = response.data;
        final list = (data is List
            ? data
            : data['players'] ?? data['users'] ?? []) as List;
        return list.cast<Map<String, dynamic>>();
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}
