import 'package:dio/dio.dart';
import '../models/scoring_models.dart';
import 'api_service.dart';

/// Generic result wrapper so callers can surface real errors instead of
/// silently swallowing them. `code` mirrors the backend's stable error
/// code (FREE_HIT_INVALID_DISMISSAL, PENALTY_DISABLED, ...) so the keypad
/// UI can branch on it rather than parsing the human-readable message.
class ScoringResult<T> {
  final bool ok;
  final T? data;
  final String? error;
  final String? code;

  /// HTTP status code on the response that produced this result. Lets
  /// scoring tabs treat 404 (match exists but session not set up yet)
  /// distinctly from 5xx (backend broken) without having to peek at the
  /// raw Dio exception.
  final int? statusCode;

  const ScoringResult.success(this.data)
      : ok = true,
        error = null,
        code = null,
        statusCode = null;
  const ScoringResult.failure(this.error, {this.code, this.statusCode})
      : ok = false,
        data = null;
}

/// Result of `POST /scoring/complete`. `session` may be null if the
/// backend body only carries `earnedBadges`. UI should render the badges
/// in a celebration sheet when the list is non-empty.
class MatchCompletion {
  const MatchCompletion({this.session, this.earnedBadges = const []});
  final ScoringSession? session;
  final List<Map<String, dynamic>> earnedBadges;
}

/// Thin client over the backend cricket scoring engine (`/scoring/*`).
class ScoringService {
  static final ScoringService _instance = ScoringService._internal();
  factory ScoringService() => _instance;

  late final Dio _dio;

  ScoringService._internal() {
    _dio = ApiService.createSharedDio(
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 20),
    );
  }

  String _msg(DioException e) =>
      _extract(e.response?.data) ??
      e.message ??
      'Network error (${e.response?.statusCode ?? e.type.name})';

  /// Pull a stable backend error code out of the response body if the
  /// server attached one (post-§4 envelope: `{ code: 'STABLE_CODE', ... }`).
  /// Returns null when the response is legacy or lacks a code.
  String? _code(DioException e) {
    final body = e.response?.data;
    if (body is Map) {
      final c = body['code'];
      if (c is String && c.isNotEmpty) return c;
    }
    return null;
  }

  /// Sugar for `ScoringResult.failure(_msg(e), code: _code(e))` so each
  /// service method stays one-liner-y.
  ScoringResult<T> _fail<T>(DioException e) => ScoringResult.failure(
        _msg(e),
        code: _code(e),
        statusCode: e.response?.statusCode,
      );

  String? _extract(dynamic data) {
    if (data is Map) {
      for (final k in const ['message', 'error', 'msg', 'detail']) {
        final v = data[k];
        if (v is String && v.isNotEmpty) return v;
      }
    }
    if (data is String && data.isNotEmpty) return data;
    return null;
  }

  // ── Reads ────────────────────────────────────────────────────────────────

  /// Resolve current match state: the scoring session (if started), the latest
  /// snapshot, and the team rosters for player pickers.
  Future<ScoringResult<MatchStatus>> getMatchStatus(String matchId) async {
    try {
      final res = await _dio.get('/scoring/status/$matchId');
      if (res.data is Map) {
        return ScoringResult.success(
            MatchStatus.fromJson(Map<String, dynamic>.from(res.data)));
      }
      return const ScoringResult.failure('Unexpected status response');
    } on DioException catch (e) {
      return _fail(e);
    } catch (e) {
      return ScoringResult.failure(e.toString());
    }
  }

  Future<ScoringResult<LiveScoreSnapshot>> getLiveScore(String matchId) async {
    try {
      final res = await _dio.get('/scoring/live-score/$matchId');
      final data = (res.data is Map) ? res.data['data'] : null;
      if (data is Map) {
        return ScoringResult.success(
            LiveScoreSnapshot.fromJson(Map<String, dynamic>.from(data)));
      }
      return const ScoringResult.failure('No live score available');
    } on DioException catch (e) {
      return _fail(e);
    } catch (e) {
      return ScoringResult.failure(e.toString());
    }
  }

  /// Discovery list — every match currently LIVE. Backed by ETag on the
  /// server, cached transparently by [EtagInterceptor]. Caller polls every
  /// 10s.
  Future<ScoringResult<List<Map<String, dynamic>>>> getLiveMatches(
      {int limit = 20}) async {
    try {
      final res =
          await _dio.get('/scoring/live', queryParameters: {'limit': limit});
      final data = (res.data is Map) ? res.data['data'] : null;
      final items = (data is Map ? data['items'] : null) as List? ?? const [];
      return ScoringResult.success(items
          .whereType<Map>()
          .map((m) => Map<String, dynamic>.from(m))
          .toList());
    } on DioException catch (e) {
      return _fail(e);
    } catch (e) {
      return ScoringResult.failure(e.toString());
    }
  }

  /// SCORECARD tab — batting/bowling tables, FOW, partnerships, extras.
  /// Server returns it pre-shaped; we forward `data.*` verbatim so the
  /// widget can read `batters[i].dismissal`, `bowlers[i].economyRate`,
  /// etc. straight off the map.
  Future<ScoringResult<Map<String, dynamic>>> getScorecard(
      String matchId) async {
    try {
      final res = await _dio.get('/scoring/$matchId/scorecard');
      final data = (res.data is Map) ? res.data['data'] : null;
      if (data is Map) {
        return ScoringResult.success(Map<String, dynamic>.from(data));
      }
      return const ScoringResult.failure('No scorecard available');
    } on DioException catch (e) {
      return _fail(e);
    } catch (e) {
      return ScoringResult.failure(e.toString());
    }
  }

  /// SQUADS tab — Playing XI + Bench per team, with custom/captain/keeper
  /// flags.
  Future<ScoringResult<Map<String, dynamic>>> getSquads(String matchId) async {
    try {
      final res = await _dio.get('/scoring/$matchId/squads');
      final data = (res.data is Map) ? res.data['data'] : null;
      if (data is Map) {
        return ScoringResult.success(Map<String, dynamic>.from(data));
      }
      return const ScoringResult.failure('No squads available');
    } on DioException catch (e) {
      return _fail(e);
    } catch (e) {
      return ScoringResult.failure(e.toString());
    }
  }

  /// OVERS tab — per-over breakdown (latest-first). Pass [afterBallId] (the
  /// previous response's `nextCursor`) to get only the overs that have new
  /// balls since the last poll. First call: omit the cursor.
  ///
  /// Returns `{ innings: [...], nextCursor: '...' }` shaped as the server
  /// sends — callers merge by overNumber into local state.
  Future<ScoringResult<Map<String, dynamic>>> getOvers(
    String matchId, {
    required int innings,
    String? afterBallId,
  }) async {
    try {
      final res = await _dio.get('/scoring/$matchId/overs', queryParameters: {
        'innings': innings,
        if (afterBallId != null) 'afterBallId': afterBallId,
      });
      final data = (res.data is Map) ? res.data['data'] : null;
      if (data is Map) {
        return ScoringResult.success(Map<String, dynamic>.from(data));
      }
      return const ScoringResult.failure('No overs available');
    } on DioException catch (e) {
      return _fail(e);
    } catch (e) {
      return ScoringResult.failure(e.toString());
    }
  }

  Future<ScoringResult<Map<String, dynamic>>> getAnalytics(
      String matchId) async {
    try {
      final res = await _dio.get('/scoring/analytics/$matchId');
      if (res.data is Map) {
        return ScoringResult.success(Map<String, dynamic>.from(res.data));
      }
      return const ScoringResult.failure('No analytics available');
    } on DioException catch (e) {
      return _fail(e);
    } catch (e) {
      return ScoringResult.failure(e.toString());
    }
  }

  // ── Writes ───────────────────────────────────────────────────────────────

  /// Create a backend scoring match (a `SCORING_MATCH` HostedGame) and return
  /// its real `id` + `shortId`. This must run before opening the scorer: the
  /// scoring engine resolves rosters, authorization and overs from this record,
  /// so an ad-hoc match has to exist server-side first.
  ///
  /// [teamAPlayers] / [teamBPlayers] are guest players: each is
  /// `{ 'isCustom': true, 'name': ..., 'id': ..., 'role': 'PLAYER' }`.
  Future<ScoringResult<Map<String, String>>> setupScoringGame({
    required String matchName,
    required String teamAName,
    required String teamBName,
    required List<Map<String, dynamic>> teamAPlayers,
    required List<Map<String, dynamic>> teamBPlayers,
    int overs = 20,
    String? location,
    String? teamAId,
    String? teamBId,
    String? venueId,
    double? venueLat,
    double? venueLng,
    String? umpireId,
    String? umpireName,
    String? ballType,
    String? groundType,
    String? pitchType,
    String? matchTiming,
    String? youtubeLiveUrl,
    String? scoringPassword,
    int? powerPlayOvers,
    int? maxMembers,
    DateTime? matchDateTime,
    String? formatOverride,
    Map<String, dynamic>? houseRules,
  }) async {
    try {
      // Map the chosen overs onto a backend format. Standard lengths get their
      // named format; anything else uses CUSTOM with an explicit overs/day so
      // the engine sets `oversPerInnings` to exactly what the user picked.
      final String format = formatOverride ??
          (overs == 10
              ? 'T10'
              : overs == 20
                  ? 'T20'
                  : overs == 50
                      ? 'ODI'
                      : 'CUSTOM');
      final res = await _dio.post('/scoring/setup', data: {
        'matchName': matchName,
        'format': format,
        'customOversPerDay': overs,
        'teamAData': {
          'name': teamAName,
          if (teamAId != null) 'teamId': teamAId,
        },
        'teamBData': {
          'name': teamBName,
          if (teamBId != null) 'teamId': teamBId,
        },
        'teamAPlayers': teamAPlayers,
        'teamBPlayers': teamBPlayers,
        if (location != null && location.isNotEmpty) 'location': location,
        if (venueId != null) 'venueId': venueId,
        // Custom-venue GPS coords — sent in the canonical Mongo shape
        // (GeoJSON-style `{coordinates: [lng, lat]}`) since the backend's
        // `locationData` field uses that order. The web modal sends it the
        // same way (`mapCoordinates`).
        if (venueLat != null && venueLng != null)
          'customVenue': {
            'name': location ?? '',
            'coordinates': [venueLng, venueLat],
          },
        if (umpireId != null) 'umpireId': umpireId,
        if (umpireName != null && umpireName.isNotEmpty)
          'umpireName': umpireName,
        if (ballType != null) 'ballType': ballType,
        if (groundType != null) 'groundType': groundType,
        if (pitchType != null) 'pitchType': pitchType,
        if (matchTiming != null) 'matchTiming': matchTiming,
        if (youtubeLiveUrl != null && youtubeLiveUrl.isNotEmpty)
          'youtubeLiveUrl': youtubeLiveUrl,
        if (scoringPassword != null && scoringPassword.isNotEmpty)
          'scoringPassword': scoringPassword,
        if (powerPlayOvers != null) 'powerPlayOvers': powerPlayOvers,
        if (maxMembers != null) 'maxMembers': maxMembers,
        if (matchDateTime != null)
          'matchDateTime': matchDateTime.toIso8601String(),
        // Initial house-rules overrides. Sent in the same shape the
        // PATCH /scoring/house-rules endpoint accepts so the backend can
        // reuse its validation; only includes keys the user actually
        // overrode (missing = MCC default).
        if (houseRules != null && houseRules.isNotEmpty)
          'houseRules': houseRules,
      });
      final game = (res.data is Map) ? res.data['game'] : null;
      if (game is Map) {
        final id = (game['id'] ?? '').toString();
        if (id.isEmpty) {
          return const ScoringResult.failure(
              'Match created but no id returned');
        }
        return ScoringResult.success({
          'id': id,
          'shortId': (game['shortId'] ?? '').toString(),
        });
      }
      return const ScoringResult.failure('Could not create match');
    } on DioException catch (e) {
      return _fail(e);
    } catch (e) {
      return ScoringResult.failure(e.toString());
    }
  }

  /// Initialise a scoring session for a hosted game. Returns the session.
  Future<ScoringResult<ScoringSession>> startScoring({
    required String matchId,
    String battingTeam = 'teamA',
    String? tossWinner,
    String? tossDecision,
  }) async {
    try {
      final res = await _dio.post('/scoring/start', data: {
        'matchId': matchId,
        'battingTeam': battingTeam,
        if (tossWinner != null) 'tossWinner': tossWinner,
        if (tossDecision != null) 'tossDecision': tossDecision,
      });
      final scoring = (res.data is Map) ? res.data['scoring'] : null;
      if (scoring is Map) {
        return ScoringResult.success(
            ScoringSession.fromJson(Map<String, dynamic>.from(scoring)));
      }
      return const ScoringResult.failure('Could not start scoring');
    } on DioException catch (e) {
      return _fail(e);
    } catch (e) {
      return ScoringResult.failure(e.toString());
    }
  }

  /// Set toss result. [wonByTeamId] is "teamA"/"teamB"; decision is BAT|BOWL.
  Future<ScoringResult<ScoringSession>> setToss({
    required String scoringId,
    required String wonByTeamId,
    required String decision,
  }) async {
    try {
      final res = await _dio.post('/scoring/toss', data: {
        'scoringId': scoringId,
        'wonByTeamId': wonByTeamId,
        'decision': decision,
      });
      return _sessionFrom(res.data);
    } on DioException catch (e) {
      return _fail(e);
    } catch (e) {
      return ScoringResult.failure(e.toString());
    }
  }

  /// Assign the active striker, non-striker and bowler.
  Future<ScoringResult<ScoringSession>> setPlayers({
    required String scoringId,
    String? strikerId,
    String? nonStrikerId,
    String? bowlerId,
    String? wicketKeeperId,
  }) async {
    try {
      final res = await _dio.post('/scoring/set-players', data: {
        'scoringId': scoringId,
        if (strikerId != null) 'strikerId': strikerId,
        if (nonStrikerId != null) 'nonStrikerId': nonStrikerId,
        if (bowlerId != null) 'bowlerId': bowlerId,
        if (wicketKeeperId != null) 'wicketKeeperId': wicketKeeperId,
      });
      return _sessionFrom(res.data);
    } on DioException catch (e) {
      return _fail(e);
    } catch (e) {
      return ScoringResult.failure(e.toString());
    }
  }

  /// Record a ball.
  ///
  /// Two response shapes are tolerated:
  ///
  /// - **Lite ack** (post-§latency-refactor): `liveData: { ack: true, ... }`.
  ///   The server has committed the ball and will push the new snapshot
  ///   over the socket. Returns `success(null)` so the caller can await
  ///   the socket push (or fall back to `getLiveScore`).
  ///
  /// - **Full snapshot** (legacy backend / wait mode): `liveData` carries
  ///   the full `LiveScoreSnapshot`. Returned inline.
  Future<ScoringResult<LiveScoreSnapshot>> updateScore({
    required String scoringId,
    required BallData ball,
  }) async {
    try {
      final res = await _dio.put('/scoring/update', data: {
        'scoringId': scoringId,
        'ballData': ball.toJson(),
      });
      final live = (res.data is Map) ? res.data['liveData'] : null;
      if (live is Map) {
        final map = Map<String, dynamic>.from(live);
        // Lite ack — no snapshot in the body. The caller waits for the
        // SOCKET.SCORE_UPDATED push instead. `ok == true` and `data ==
        // null` is the signal.
        if (map['ack'] == true) {
          return const ScoringResult.success(null);
        }
        return ScoringResult.success(LiveScoreSnapshot.fromJson(map));
      }
      // No liveData at all — treat as a soft success so the caller can
      // resync from the socket / HTTP fallback rather than hard-fail.
      return const ScoringResult.success(null);
    } on DioException catch (e) {
      return _fail(e);
    } catch (e) {
      return ScoringResult.failure(e.toString());
    }
  }

  Future<ScoringResult<ScoringSession>> undoLastBall(String scoringId) async {
    try {
      final res =
          await _dio.delete('/scoring/undo', data: {'scoringId': scoringId});
      return _sessionFrom(res.data);
    } on DioException catch (e) {
      return _fail(e);
    } catch (e) {
      return ScoringResult.failure(e.toString());
    }
  }

  Future<ScoringResult<ScoringSession>> startNextInnings({
    required String scoringId,
    required String battingTeamId,
  }) async {
    try {
      final res = await _dio.post('/scoring/next-innings', data: {
        'scoringId': scoringId,
        'battingTeamId': battingTeamId,
      });
      return _sessionFrom(res.data);
    } on DioException catch (e) {
      return _fail(e);
    } catch (e) {
      return ScoringResult.failure(e.toString());
    }
  }

  /// Finalise the match — locks scoring, persists `cricketMatch.result`,
  /// archives temp Team rows, returns any badges this player earned in
  /// this match. UI should render a celebration sheet if the list is
  /// non-empty.
  Future<ScoringResult<MatchCompletion>> completeMatch(String scoringId) async {
    try {
      final res =
          await _dio.post('/scoring/complete', data: {'scoringId': scoringId});
      final body = res.data;
      final scoring = (body is Map) ? body['scoring'] : null;
      final session = scoring is Map
          ? ScoringSession.fromJson(Map<String, dynamic>.from(scoring))
          : null;
      // Server is "additive" — earnedBadges sits at the top level
      // alongside the legacy `scoring` field (or under data.* on the
      // newer envelope).
      final rawBadges = (body is Map)
          ? (body['earnedBadges'] ??
              ((body['data'] is Map ? body['data']['earnedBadges'] : null)))
          : null;
      final badges = (rawBadges is List)
          ? rawBadges
              .whereType<Map>()
              .map((m) => Map<String, dynamic>.from(m))
              .toList()
          : const <Map<String, dynamic>>[];
      return ScoringResult.success(
          MatchCompletion(session: session, earnedBadges: badges));
    } on DioException catch (e) {
      return _fail(e);
    } catch (e) {
      return ScoringResult.failure(e.toString());
    }
  }

  Future<ScoringResult<void>> goLive(String matchId) async {
    try {
      await _dio.post('/scoring/$matchId/go-live');
      return const ScoringResult.success(null);
    } on DioException catch (e) {
      return _fail(e);
    } catch (e) {
      return ScoringResult.failure(e.toString());
    }
  }

  ScoringResult<ScoringSession> _sessionFrom(dynamic data) {
    final scoring = (data is Map) ? data['scoring'] : null;
    if (scoring is Map) {
      return ScoringResult.success(
          ScoringSession.fromJson(Map<String, dynamic>.from(scoring)));
    }
    return const ScoringResult.failure('Unexpected server response');
  }

  /// POST /scoring/auth/:gameId — exchange the host-set scoring password
  /// for an 8h JWT that authenticates the umpire/scorer for the writes
  /// below. The returned token carries `role: SCORER` — store it
  /// separately from the user's regular access token.
  Future<ScoringResult<String>> authenticateScorer({
    required String gameId,
    required String password,
  }) async {
    try {
      final res = await _dio
          .post('/scoring/auth/$gameId', data: {'password': password});
      final data = (res.data is Map) ? res.data['data'] : null;
      final token = (data is Map ? data['token'] : null) ??
          (res.data is Map ? res.data['token'] : null);
      if (token is String && token.isNotEmpty) {
        return ScoringResult.success(token);
      }
      return const ScoringResult.failure('Missing scorer token in response');
    } on DioException catch (e) {
      return _fail(e);
    } catch (e) {
      return ScoringResult.failure(e.toString());
    }
  }

  /// PATCH /scoring/house-rules — flip the per-match toggles (free hit,
  /// consecutive-over block, wide-is-legal, penalty enabled, balls per
  /// over, players per team, last-man-stands, MVP weights, ...).
  ///
  /// Setting a key to `null` removes the override (reverts to MCC). Out
  /// of range values reject with INVALID_BALLS_PER_OVER /
  /// INVALID_PLAYERS_PER_TEAM / INVALID_MAX_RUNS_PER_BALL. Frozen after
  /// the match completes (MATCH_ALREADY_COMPLETE).
  Future<ScoringResult<Map<String, dynamic>>> setHouseRules({
    required String scoringId,
    required Map<String, dynamic> houseRules,
  }) async {
    try {
      final res = await _dio.patch('/scoring/house-rules', data: {
        'scoringId': scoringId,
        'houseRules': houseRules,
      });
      final data = (res.data is Map) ? res.data['data'] : null;
      if (data is Map) {
        return ScoringResult.success(Map<String, dynamic>.from(data));
      }
      return const ScoringResult.failure('No house rules returned');
    } on DioException catch (e) {
      return _fail(e);
    } catch (e) {
      return ScoringResult.failure(e.toString());
    }
  }

  // ── Advanced scoring (web-parity additions) ──────────────────────────────

  /// POST /scoring/powerplay — set the powerplay overs window.
  Future<bool> setPowerplay({
    required String matchId,
    required int startOver,
    required int endOver,
    String type = 'mandatory', // mandatory | batting | bowling
  }) async {
    final r = await _post('/scoring/powerplay', {
      'matchId': matchId,
      'startOver': startOver,
      'endOver': endOver,
      'type': type,
    });
    return r != null;
  }

  /// POST /scoring/review — record a DRS / umpire review outcome.
  Future<bool> recordReview({
    required String matchId,
    required String team, // teamA | teamB
    required String decision, // upheld | overturned
  }) async {
    final r = await _post('/scoring/review', {
      'matchId': matchId,
      'team': team,
      'decision': decision,
    });
    return r != null;
  }

  /// POST /scoring/substitute — bring a substitute on for an active player.
  Future<bool> substitute({
    required String matchId,
    required String outPlayerId,
    required String inPlayerId,
  }) async {
    final r = await _post('/scoring/substitute', {
      'matchId': matchId,
      'outPlayerId': outPlayerId,
      'inPlayerId': inPlayerId,
    });
    return r != null;
  }

  /// POST /scoring/penalty — award penalty runs (used for ball-tampering /
  /// time-wasting infractions).
  Future<bool> awardPenalty({
    required String matchId,
    required String team,
    required int runs,
    String? reason,
  }) async {
    final r = await _post('/scoring/penalty', {
      'matchId': matchId,
      'team': team,
      'runs': runs,
      if (reason != null) 'reason': reason,
    });
    return r != null;
  }

  /// POST /scoring/revise-target — Duckworth-Lewis / weather-affected target.
  Future<bool> reviseTarget({
    required String matchId,
    required int newTarget,
    required int newOvers,
  }) async {
    final r = await _post('/scoring/revise-target', {
      'matchId': matchId,
      'newTarget': newTarget,
      'newOvers': newOvers,
    });
    return r != null;
  }

  /// POST /scoring/toggle-timer — pause / resume the match clock.
  /// Surfaces the actual backend error (`res.error` / `res.code`) instead of
  /// swallowing it so the UI can show a useful toast. Sends both `matchId`
  /// and `scoringId` in the body — different deployments of the engine have
  /// keyed off one or the other; including both is harmless.
  Future<ScoringResult<void>> toggleTimer({
    required String matchId,
    String? scoringId,
  }) async {
    try {
      await _dio.post('/scoring/toggle-timer', data: {
        'matchId': matchId,
        if (scoringId != null && scoringId.isNotEmpty) 'scoringId': scoringId,
      });
      return const ScoringResult.success(null);
    } on DioException catch (e) {
      return _fail(e);
    } catch (e) {
      return ScoringResult.failure(e.toString());
    }
  }

  /// GET /scoring/officials — list officials available for assignment.
  Future<List<Map<String, dynamic>>> listOfficials() async {
    try {
      final response = await _dio.get('/scoring/officials');
      final raw = response.data;
      final list = (raw is List
          ? raw
          : (raw is Map ? (raw['officials'] ?? []) : [])) as List;
      return list.cast<Map<String, dynamic>>();
    } catch (_) {
      return const [];
    }
  }

  /// PUT /scoring/:matchId/commentary-settings — toggle commentary on/off,
  /// pick commentator IDs.
  Future<bool> updateCommentarySettings({
    required String matchId,
    required bool enabled,
    List<String>? commentatorIds,
  }) async {
    final r = await _post('/scoring/$matchId/commentary-settings', {
      'enabled': enabled,
      if (commentatorIds != null) 'commentatorIds': commentatorIds,
    });
    return r != null;
  }

  /// PUT /scoring/:matchId/stream-config — set the live-stream embed URL /
  /// platform (used by overlays + viewers).
  Future<bool> updateStreamConfig({
    required String matchId,
    required String platform, // youtube | facebook
    String? streamUrl,
    String? streamKey,
  }) async {
    final r = await _post('/scoring/$matchId/stream-config', {
      'platform': platform,
      if (streamUrl != null) 'streamUrl': streamUrl,
      if (streamKey != null) 'streamKey': streamKey,
    });
    return r != null;
  }

  /// GET /scoring/report/:matchId — full post-match report payload.
  Future<Map<String, dynamic>?> getMatchReport(String matchId) async {
    try {
      final response = await _dio.get('/scoring/report/$matchId');
      return (response.data is Map)
          ? (response.data as Map).cast<String, dynamic>()
          : null;
    } catch (_) {
      return null;
    }
  }

  /// POST /scoring/update-status — change the live match state, e.g. when the
  /// scorer marks the match paused for rain or bad light. Returns the updated
  /// session so the UI can re-sync without a separate GET.
  ///
  /// `status` is one of: `LIVE` | `PAUSED` | `RAIN_DELAY` | `BAD_LIGHT` |
  /// `COMPLETED` | `CANCELLED`.
  Future<ScoringResult<ScoringSession>> setMatchStatus({
    required String scoringId,
    required String status,
  }) async {
    try {
      final res = await _dio.post('/scoring/update-status', data: {
        'scoringId': scoringId,
        'status': status,
      });
      return _sessionFrom(res.data);
    } on DioException catch (e) {
      return _fail(e);
    } catch (e) {
      return ScoringResult.failure(e.toString());
    }
  }

  /// POST /scoring/officials — assign or update umpires/scorers/streamers
  /// during a live match. The backend stores `officials` as an opaque JSON
  /// blob on `CricketMatch.matchOfficials`, so the caller controls the shape
  /// (current convention: `{umpires: [...], scorers: [...], streamers: [...]}`).
  Future<ScoringResult<ScoringSession>> setMatchOfficials({
    required String scoringId,
    required Map<String, dynamic> officials,
  }) async {
    try {
      final res = await _dio.post('/scoring/officials', data: {
        'scoringId': scoringId,
        'officials': officials,
      });
      return _sessionFrom(res.data);
    } on DioException catch (e) {
      return _fail(e);
    } catch (e) {
      return ScoringResult.failure(e.toString());
    }
  }

  /// Shared POST helper — returns the raw response body on success, null on
  /// failure. Used by the simple boolean-result actions above.
  Future<dynamic> _post(String path, Map<String, dynamic> body) async {
    try {
      final response = await _dio.post(path, data: body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return response.data;
      }
      return null;
    } catch (_) {
      return null;
    }
  }
}
