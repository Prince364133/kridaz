import 'package:dio/dio.dart';
import '../models/team_model.dart';
import '../models/team_opponent_request_model.dart';
import 'api_service.dart';

class TeamService {
  static final TeamService _instance = TeamService._internal();
  factory TeamService() => _instance;

  late final Dio _dio;

  TeamService._internal() {
    // Shared interceptor stack handles auth attach, TOKEN_EXPIRED refresh
    // + retry, 429/409/timeout retry, X-Request-Id correlation, and
    // version-header capture.
    _dio = ApiService.createSharedDio();
  }

  Future<List<TeamModel>> getMyTeams() async {
    final response = await _dio.get('/team');
    final raw = response.data;
    final list = (raw is List ? raw : raw['teams'] ?? raw['data'] ?? [])
        as List<dynamic>;
    return list
        .map((j) => TeamModel.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  Future<TeamModel> getTeamById(String id) async {
    final response = await _dio.get('/team/$id');
    final raw = response.data;
    final map = (raw is Map && raw.containsKey('team')) ? raw['team'] : raw;
    return TeamModel.fromJson(map as Map<String, dynamic>);
  }

  Future<TeamModel> createTeam(Map<String, dynamic> payload) async {
    final response = await _dio.post('/team', data: payload);
    final raw = response.data;
    final map = (raw is Map && raw.containsKey('team')) ? raw['team'] : raw;
    return TeamModel.fromJson(map as Map<String, dynamic>);
  }

  Future<TeamModel> updateTeam(String id, Map<String, dynamic> payload) async {
    final response = await _dio.put('/team/$id', data: payload);
    final raw = response.data;
    final map = (raw is Map && raw.containsKey('team')) ? raw['team'] : raw;
    return TeamModel.fromJson(map as Map<String, dynamic>);
  }

  Future<void> deleteTeam(String id) async {
    await _dio.delete('/team/$id');
  }

  Future<void> inviteMember(String teamId, Map<String, dynamic> payload) async {
    await _dio.post('/team/$teamId/invite', data: payload);
  }

  /// PATCH /team/:teamId/members/:userId/role — owner-only.
  ///
  /// Payload accepts either or both of:
  ///   - `role`: CAPTAIN | VICE_CAPTAIN | PLAYER | GUEST
  ///   - `playingRole`: BATSMAN | BOWLER | ALL_ROUNDER | WICKET_KEEPER | NONE
  ///
  /// Promoting one member to CAPTAIN/VICE_CAPTAIN must demote whoever
  /// currently holds that team role to PLAYER (backend-side, atomically).
  Future<bool> updateMemberRole(
    String teamId,
    String userId, {
    String? role,
    String? playingRole,
  }) async {
    try {
      final response = await _dio.patch(
        '/team/$teamId/members/$userId/role',
        data: {
          if (role != null) 'role': role,
          if (playingRole != null) 'playingRole': playingRole,
        },
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } on DioException {
      return false;
    }
  }

  Future<bool> removeMember(String teamId, String userId) async {
    try {
      final response = await _dio.delete('/team/$teamId/members/$userId');
      return response.statusCode == 200 || response.statusCode == 204;
    } on DioException {
      return false;
    }
  }

  Future<TeamModel> findByCode(String code) async {
    final response = await _dio.get('/team/find-by-code/$code');
    return TeamModel.fromJson(response.data as Map<String, dynamic>);
  }

  /// POST /team/user/join/:token — matches the web client's join path so a
  /// shared deep-link works on both platforms.
  Future<TeamModel> joinByToken(String token) async {
    final response = await _dio.post('/team/user/join/$token');
    return TeamModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> requestOpponent(String teamId, String opponentTeamId) async {
    await _dio.post('/team/$teamId/request-opponent',
        data: {'opponentTeamId': opponentTeamId});
  }

  Future<void> handleOpponentRequest(String requestId, bool accept) async {
    await _dio.post('/team/$requestId/handle-opponent-request',
        data: {'accept': accept});
  }

  Future<List<TeamModel>> getAllPublicTeams(
      {String? sport, String? city}) async {
    final response = await _dio.get('/team/all', queryParameters: {
      if (sport != null) 'sportType': sport,
      if (city != null) 'city': city,
    });
    final raw = response.data;
    final list = (raw is List ? raw : raw['teams'] ?? raw['data'] ?? [])
        as List<dynamic>;
    return list
        .map((j) => TeamModel.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  Future<List<TeamOpponentRequestModel>> getIncomingRequests(
      String teamId) async {
    // Soft-fail the same way `getMemberJoinRequests` does — viewer is a team
    // member but not the owner, the endpoint is missing on this deploy, etc.
    // Without this, every rebuild of the team detail screen logs a
    // bad-response error for an empty section, masking real failures.
    try {
      final response = await _dio.get('/team/$teamId/opponent-requests');
      final raw = response.data;
      final list = (raw is List ? raw : raw['requests'] ?? raw['data'] ?? [])
          as List<dynamic>;
      return list
          .map((j) =>
              TeamOpponentRequestModel.fromJson(j as Map<String, dynamic>))
          .toList();
    } on DioException {
      return [];
    }
  }

  /// GET /team/:teamId/join-requests — pending member join requests (owner only)
  Future<List<Map<String, dynamic>>> getMemberJoinRequests(
      String teamId) async {
    try {
      final response = await _dio.get('/team/$teamId/join-requests');
      final raw = response.data;
      final list = (raw is List
              ? raw
              : raw['requests'] ?? raw['members'] ?? raw['data'] ?? [])
          as List<dynamic>;
      return list.cast<Map<String, dynamic>>();
    } on DioException {
      return [];
    }
  }

  /// POST /team/:teamId/handle-join-request — unified owner action that
  /// accepts or rejects a pending join request, matching the web client.
  Future<bool> _handleJoinRequest(
      String teamId, String userId, String action) async {
    try {
      final response = await _dio.post(
        '/team/$teamId/handle-join-request',
        data: {'userId': userId, 'action': action},
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } on DioException {
      // Fall back to the legacy per-action endpoints if the unified one isn't
      // available on this backend.
      try {
        final legacyPath = action == 'accept'
            ? '/team/$teamId/accept/$userId'
            : '/team/$teamId/reject/$userId';
        final response = await _dio.post(legacyPath);
        return response.statusCode == 200 || response.statusCode == 201;
      } on DioException {
        return false;
      }
    }
  }

  Future<bool> acceptMember(String teamId, String userId) =>
      _handleJoinRequest(teamId, userId, 'accept');

  Future<bool> rejectMember(String teamId, String userId) =>
      _handleJoinRequest(teamId, userId, 'reject');

  /// POST /team/join-request/:teamId — current user asks to join a team
  /// (matches the web's request-to-join flow).
  Future<bool> requestToJoin(String teamId) async {
    try {
      final response = await _dio.post('/team/join-request/$teamId');
      return response.statusCode == 200 || response.statusCode == 201;
    } on DioException {
      return false;
    }
  }
}
