import 'package:dio/dio.dart';
import '../models/ground_model.dart';
import '../models/official_model.dart';
import 'api_service.dart';
import 'auth_manager.dart';

/// Internal: identifies an OPEN slot by its (team, index) coordinates —
/// matches the body shape the backend's `/hosted-game/join` expects.
class _OpenSlotRef {
  final String team; // 'teamA' | 'teamB'
  final int index; // position within the team's slots array
  final String? role; // optional role hint (batter, bowler, …)
  const _OpenSlotRef({required this.team, required this.index, this.role});
}

class GameService {
  static final GameService _instance = GameService._internal();
  factory GameService() => _instance;

  late final Dio _dio;

  GameService._internal() {
    _dio = ApiService.createSharedDio(
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
    );
  }

  String? get currentUserId =>
      (AuthManager().currentUser?['id'] ?? AuthManager().currentUser?['_id'])
          ?.toString();

  /// POST /api/hosted-game/create
  Future<Map<String, dynamic>?> createHostedGame(
      Map<String, dynamic> payload) async {
    try {
      final response = await _dio.post('/hosted-game/create', data: payload);
      if (response.statusCode == 201 || response.statusCode == 200) {
        return response.data as Map<String, dynamic>;
      }
      return null;
    } on DioException {
      return null;
    }
  }

  /// GET /api/user/turf/all — reuses the working turf endpoint, filters by sport in Dart
  Future<List<GroundModel>> getGrounds({
    String? city,
    String? state,
    String? sportType,
  }) async {
    try {
      final response = await _dio.get('/user/turf/all');
      final raw = response.data;
      final list = (raw is Map
              ? (raw['turfs'] ?? raw['grounds'] ?? raw['data'] ?? raw['result'])
              : raw) as List? ??
          [];

      var grounds = list
          .whereType<Map<String, dynamic>>()
          .map(GroundModel.fromJson)
          .toList();

      // Client-side filter by sport
      if (sportType != null && sportType.isNotEmpty) {
        grounds = grounds
            .where((g) => g.sportTypes
                .any((s) => s.toLowerCase() == sportType.toLowerCase()))
            .toList();
      }
      return grounds;
    } on DioException {
      return [];
    } catch (_) {
      return [];
    }
  }

  /// GET /api/hosted-game/umpires?city=&state=&gameType=
  Future<List<OfficialModel>> getUmpires({
    String? city,
    String? state,
    String? gameType,
  }) async {
    try {
      final params = <String, String>{};
      if (city != null) params['city'] = city;
      if (state != null) params['state'] = state;
      if (gameType != null) params['gameType'] = gameType;

      final response =
          await _dio.get('/hosted-game/umpires', queryParameters: params);
      final list = response.data['umpires'] as List? ?? [];
      return list
          .map((j) => OfficialModel.fromJson(
              j as Map<String, dynamic>, OfficialRole.umpire))
          .toList();
    } on DioException {
      return [];
    }
  }

  /// GET /api/hosted-game/scorers?city=&state=&gameType=
  Future<List<OfficialModel>> getScorers({
    String? city,
    String? state,
    String? gameType,
  }) async {
    try {
      final params = <String, String>{};
      if (city != null) params['city'] = city;
      if (state != null) params['state'] = state;
      if (gameType != null) params['gameType'] = gameType;

      final response =
          await _dio.get('/hosted-game/scorers', queryParameters: params);
      final raw = response.data;
      final list =
          (raw is Map ? (raw['scorers'] ?? raw['data'] ?? []) : []) as List;
      return list
          .map((j) => OfficialModel.fromJson(
              j as Map<String, dynamic>, OfficialRole.scorer))
          .toList();
    } on DioException catch (_) {
      return [];
    }
  }

  /// GET /api/hosted-game/streamers?city=&state=&gameType=
  Future<List<OfficialModel>> getStreamers({
    String? city,
    String? state,
    String? gameType,
  }) async {
    try {
      final params = <String, String>{};
      if (city != null) params['city'] = city;
      if (state != null) params['state'] = state;
      if (gameType != null) params['gameType'] = gameType;

      final response =
          await _dio.get('/hosted-game/streamers', queryParameters: params);
      final list = response.data['streamers'] as List? ?? [];
      return list
          .map((j) => OfficialModel.fromJson(
              j as Map<String, dynamic>, OfficialRole.streamer))
          .toList();
    } on DioException {
      return [];
    }
  }

  /// Get all games for current user (hosted + joined combined)
  Future<List<Map<String, dynamic>>> getMyGames(
      {bool includePast = false}) async {
    try {
      final results = await Future.wait([
        _dio.get('/hosted-game/my-hosted'),
        _dio.get('/hosted-game/my-joined'),
      ]);

      final hosted = results[0].statusCode == 200
          ? _extractGameList(results[0].data)
          : <Map<String, dynamic>>[];
      final joined = results[1].statusCode == 200
          ? _extractGameList(results[1].data)
          : <Map<String, dynamic>>[];

      final seen = <String>{};
      final all = <Map<String, dynamic>>[];
      for (final g in [...hosted, ...joined]) {
        final id = g['id']?.toString() ?? g['_id']?.toString() ?? '';
        if (id.isNotEmpty && seen.add(id)) all.add(g);
      }
      return all;
    } on DioException {
      return [];
    } catch (_) {
      return [];
    }
  }

  List<Map<String, dynamic>> _extractGameList(dynamic data) {
    if (data is List) return data.cast<Map<String, dynamic>>();
    if (data is Map) {
      final list = data['games'] ?? data['hostedGames'] ?? data['data'];
      if (list is List) return list.cast<Map<String, dynamic>>();
    }
    return [];
  }

  /// Get game details by ID
  Future<Map<String, dynamic>?> getGame(String gameId) async {
    try {
      final response = await _dio.get('/hosted-game/$gameId');
      if (response.statusCode == 200) {
        return response.data as Map<String, dynamic>;
      }
      return null;
    } on DioException {
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Join a game. Returns `(ok, autoJoined, message)`.
  ///
  /// `autoJoined` mirrors `data.autoJoined` from the backend: PUBLIC games
  /// flip the slot straight to JOINED (true); PRIVATE games leave it
  /// PENDING until the host approves (false). Callers branch on this to
  /// show "Joined!" vs "Request sent" copy.
  ///
  /// On failure, `message` contains the reason from the server (or a
  /// network-level description).
  ///
  /// Mirrors the web client exactly: posts `{gameId, team, slotIndex, role}`
  /// — the backend identifies the slot by (team, slotIndex), not by a raw
  /// slot id. Passing a stale or missing slot reference yields "Slot not
  /// found". If the caller doesn't supply [team]/[slotIndex] we resolve
  /// the first OPEN slot from the game detail and derive both.
  Future<({bool ok, bool autoJoined, String? message})> joinGame(
    String gameId, {
    String? team,
    int? slotIndex,
    String? role,
    @Deprecated('Use team+slotIndex; kept for legacy callers') String? slotId,
  }) async {
    try {
      // Resolve a concrete (team, slotIndex, role) if missing.
      String? resolvedTeam = team;
      int? resolvedIndex = slotIndex;
      String? resolvedRole = role;
      if (resolvedTeam == null || resolvedIndex == null) {
        final slot = await _findOpenSlot(gameId);
        resolvedTeam ??= slot?.team;
        resolvedIndex ??= slot?.index;
        resolvedRole ??= slot?.role;
      }

      final body = <String, dynamic>{'gameId': gameId};
      if (resolvedTeam != null) body['team'] = resolvedTeam;
      if (resolvedIndex != null) body['slotIndex'] = resolvedIndex;
      if (resolvedRole != null) body['role'] = resolvedRole;
      // Send slotId too if we have one — some legacy backends accept either.
      if (slotId != null) body['slotId'] = slotId;

      final response = await _dio.post('/hosted-game/join', data: body);
      final ok = response.statusCode == 200 || response.statusCode == 201;
      if (ok) {
        return (
          ok: true,
          autoJoined: _readAutoJoined(response.data),
          message: null,
        );
      }
      return (
        ok: false,
        autoJoined: false,
        message: _extractMessage(response.data) ??
            'Server returned ${response.statusCode}',
      );
    } on DioException catch (e) {
      return (
        ok: false,
        autoJoined: false,
        message:
            _extractMessage(e.response?.data) ?? e.message ?? 'Network error',
      );
    } catch (e) {
      return (ok: false, autoJoined: false, message: e.toString());
    }
  }

  /// Backend returns `data.autoJoined: true` for public games, `false` for
  /// private games that need host approval. Default to `true` so legacy
  /// responses without the flag don't fall into the "request sent" UX.
  bool _readAutoJoined(dynamic body) {
    if (body is! Map) return true;
    final data = body['data'];
    if (data is Map && data['autoJoined'] is bool) {
      return data['autoJoined'] as bool;
    }
    if (body['autoJoined'] is bool) return body['autoJoined'] as bool;
    return true;
  }

  /// Walks the game detail and returns the first OPEN slot's coordinates
  /// (team / index / role) so [joinGame] can post the web-compatible body.
  Future<_OpenSlotRef?> _findOpenSlot(String gameId) async {
    try {
      final detail = await getGame(gameId);
      if (detail == null) return null;
      final game = (detail['game'] is Map) ? detail['game'] as Map : detail;

      // Quick / flat slots — treat as team "teamA" by convention since the
      // web treats single-pool games the same way.
      final flat = _firstOpenSlot(game['slots'] ?? game['quickSlots'], 'teamA');
      if (flat != null) return flat;

      final teams = game['teams'];
      if (teams is Map) {
        for (final key in const ['teamA', 'teamB']) {
          final t = teams[key];
          if (t is Map) {
            final s = _firstOpenSlot(t['slots'], key);
            if (s != null) return s;
          }
        }
      } else if (teams is List) {
        for (var i = 0; i < teams.length; i++) {
          final t = teams[i];
          if (t is Map) {
            final key = i == 0 ? 'teamA' : 'teamB';
            final s = _firstOpenSlot(t['slots'], key);
            if (s != null) return s;
          }
        }
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  _OpenSlotRef? _firstOpenSlot(dynamic slots, String team) {
    if (slots is! List) return null;
    for (var i = 0; i < slots.length; i++) {
      final s = slots[i];
      if (s is Map && s['status']?.toString().toUpperCase() == 'OPEN') {
        // Backend may carry an explicit slot index or use list position.
        final index = (s['index'] is int)
            ? s['index'] as int
            : int.tryParse(s['index']?.toString() ?? '') ?? i;
        final role = s['role']?.toString();
        return _OpenSlotRef(team: team, index: index, role: role);
      }
    }
    return null;
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

  /// Leave a game
  Future<bool> leaveGame(String gameId) async {
    try {
      final response = await _dio.post(
        '/hosted-game/leave',
        data: {'gameId': gameId},
      );
      return response.statusCode == 200;
    } on DioException {
      return false;
    } catch (_) {
      return false;
    }
  }

  /// Cancel a game (host only)
  Future<bool> cancelGame(String gameId) async {
    try {
      final response = await _dio.post(
        '/hosted-game/cancel',
        data: {'gameId': gameId},
      );
      return response.statusCode == 200;
    } on DioException {
      return false;
    } catch (_) {
      return false;
    }
  }

  /// List all public games with optional filters.
  ///
  /// Backend `/hosted-game/list` orders by `date asc` and caps each page at
  /// 50. Without an explicit `limit` it defaults to 20, which is why the
  /// "All" filter on the join-games screen used to silently drop newer
  /// games — the first 20 records by date often include past matches that
  /// the client then hides. We request the full page (50) by default; if
  /// the user needs more we'll add page iteration later.
  Future<List<Map<String, dynamic>>> listGames({
    String? sport,
    String? status,
    String? city,
    String? state,
    int limit = 50,
  }) async {
    try {
      final queryParams = <String, dynamic>{'limit': limit};
      if (sport != null) queryParams['gameType'] = sport;
      if (city != null) queryParams['city'] = city;
      if (state != null) queryParams['state'] = state;

      final response = await _dio.get(
        '/hosted-game/list',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        return _extractGameList(response.data);
      }
      return [];
    } on DioException {
      return [];
    } catch (_) {
      return [];
    }
  }

  // ── Officials / slot management / coupons (web-parity additions) ─────────

  /// GET /hosted-game/search-officials?query= — search across scorers,
  /// streamers, umpires by name.
  Future<List<Map<String, dynamic>>> searchOfficials(String query) async {
    try {
      final response = await _dio.get('/hosted-game/search-officials',
          queryParameters: {'query': query});
      final raw = response.data;
      final list = (raw is List
              ? raw
              : (raw is Map ? (raw['officials'] ?? raw['data'] ?? []) : []))
          as List;
      return list.cast<Map<String, dynamic>>();
    } on DioException {
      return const [];
    }
  }

  /// POST /hosted-game/invite-official — invite a scorer / streamer / umpire
  /// to the game by id.
  Future<bool> inviteOfficial({
    required String gameId,
    required String officialId,
    required String role, // scorer | streamer | umpire
  }) async {
    try {
      final response = await _dio.post('/hosted-game/invite-official',
          data: {'gameId': gameId, 'officialId': officialId, 'role': role});
      return response.statusCode == 200 || response.statusCode == 201;
    } on DioException {
      return false;
    }
  }

  /// POST /hosted-game/invite-custom-player — invite a non-Kridaz player
  /// to the game by email or phone.
  Future<bool> inviteCustomPlayer({
    required String gameId,
    String? email,
    String? phone,
    String? name,
  }) async {
    try {
      final response =
          await _dio.post('/hosted-game/invite-custom-player', data: {
        'gameId': gameId,
        if (email != null) 'email': email,
        if (phone != null) 'phone': phone,
        if (name != null) 'name': name,
      });
      return response.statusCode == 200 || response.statusCode == 201;
    } on DioException {
      return false;
    }
  }

  /// POST /hosted-game/request-scorer | /request-streamer | /request-umpire
  /// — host asks the platform to assign one (broadcast to nearby officials).
  Future<bool> requestOfficial({
    required String gameId,
    required String role, // scorer | streamer | umpire
  }) async {
    try {
      final endpoint = switch (role) {
        'scorer' => '/hosted-game/request-scorer',
        'streamer' => '/hosted-game/request-streamer',
        'umpire' => '/hosted-game/request-umpire',
        _ => '/hosted-game/request-scorer',
      };
      final response = await _dio.post(endpoint, data: {'gameId': gameId});
      return response.statusCode == 200 || response.statusCode == 201;
    } on DioException {
      return false;
    }
  }

  /// POST /hosted-game/approve — accept a pending join request.
  Future<bool> approveJoinRequest({
    required String gameId,
    required String userId,
    String? slotId,
  }) async {
    try {
      final response = await _dio.post('/hosted-game/approve', data: {
        'gameId': gameId,
        'userId': userId,
        if (slotId != null) 'slotId': slotId,
      });
      return response.statusCode == 200 || response.statusCode == 201;
    } on DioException {
      return false;
    }
  }

  /// POST /hosted-game/reject — reject a pending join request.
  Future<bool> rejectJoinRequest({
    required String gameId,
    required String userId,
  }) async {
    try {
      final response = await _dio.post('/hosted-game/reject',
          data: {'gameId': gameId, 'userId': userId});
      return response.statusCode == 200 || response.statusCode == 201;
    } on DioException {
      return false;
    }
  }

  /// POST /hosted-game/assign-slot — host assigns a player to a specific
  /// slot index.
  Future<bool> assignSlot({
    required String gameId,
    required String slotId,
    required String userId,
  }) async {
    try {
      final response = await _dio.post('/hosted-game/assign-slot', data: {
        'gameId': gameId,
        'slotId': slotId,
        'userId': userId,
      });
      return response.statusCode == 200 || response.statusCode == 201;
    } on DioException {
      return false;
    }
  }

  /// POST /hosted-game/claim-slot — a player claims an open slot.
  Future<bool> claimSlot({
    required String gameId,
    required String slotId,
  }) async {
    try {
      final response = await _dio.post('/hosted-game/claim-slot',
          data: {'gameId': gameId, 'slotId': slotId});
      return response.statusCode == 200 || response.statusCode == 201;
    } on DioException {
      return false;
    }
  }

  /// POST /hosted-game/validate-coupon — validate a host-set coupon code.
  /// Returns `{discount, isValid, …}` or null on failure.
  Future<Map<String, dynamic>?> validateGameCoupon({
    required String gameId,
    required String code,
  }) async {
    try {
      final response = await _dio.post('/hosted-game/validate-coupon',
          data: {'gameId': gameId, 'code': code});
      return (response.data is Map)
          ? (response.data as Map).cast<String, dynamic>()
          : null;
    } on DioException {
      return null;
    }
  }

  /// GET /hosted-game/verify-invite?token=… — resolve an invite token from
  /// a deep link.
  Future<Map<String, dynamic>?> verifyInvite(String token) async {
    try {
      final response = await _dio
          .get('/hosted-game/verify-invite', queryParameters: {'token': token});
      return (response.data is Map)
          ? (response.data as Map).cast<String, dynamic>()
          : null;
    } on DioException {
      return null;
    }
  }

  /// POST /hosted-game/update-venue — host changes the booked venue / time.
  Future<bool> updateVenue({
    required String gameId,
    String? turfId,
    String? date,
    String? slot,
  }) async {
    try {
      final response = await _dio.post('/hosted-game/update-venue', data: {
        'gameId': gameId,
        if (turfId != null) 'turfId': turfId,
        if (date != null) 'date': date,
        if (slot != null) 'slot': slot,
      });
      return response.statusCode == 200 || response.statusCode == 201;
    } on DioException {
      return false;
    }
  }
}
