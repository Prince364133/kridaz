// Models for the live cricket scoring engine.
// Field names mirror the backend snapshot shape produced by
// `scoring.utils.js > computeScoreSnapshot` and the scoring session records.

double _toDouble(dynamic v) {
  if (v == null) return 0;
  if (v is num) return v.toDouble();
  return double.tryParse(v.toString()) ?? 0;
}

int _toInt(dynamic v) {
  if (v == null) return 0;
  if (v is num) return v.toInt();
  return int.tryParse(v.toString()) ?? 0;
}

/// One ball recorded by the scorer and POSTed to `/scoring/update`.
class BallData {
  final int runs;
  final bool isExtra;
  final String? extraType; // WIDE | NO_BALL | BYE | LEG_BYE | PENALTY
  final bool isWicket;
  final String? wicketType; // BOWLED | CAUGHT | LBW | RUN_OUT | STUMPED ...
  final String batsmanId;
  final String bowlerId;

  const BallData({
    required this.runs,
    this.isExtra = false,
    this.extraType,
    this.isWicket = false,
    this.wicketType,
    required this.batsmanId,
    required this.bowlerId,
  });

  Map<String, dynamic> toJson() => {
        'runs': runs,
        if (isExtra) 'isExtra': true,
        if (extraType != null) 'extraType': extraType,
        if (isWicket) 'isWicket': true,
        if (wicketType != null) 'wicketType': wicketType,
        'batsmanId': batsmanId,
        'bowlerId': bowlerId,
      };
}

/// A single ball as represented in the snapshot's `last6Balls` list.
class TimelineBall {
  final String type; // wicket | boundary | run
  final String label; // W | 4 | 6 | 0..7 | P2 ...
  final bool isExtra;
  final bool freeHit;

  const TimelineBall({
    required this.type,
    required this.label,
    this.isExtra = false,
    this.freeHit = false,
  });

  factory TimelineBall.fromJson(Map<String, dynamic> j) => TimelineBall(
        type: (j['type'] ?? 'run').toString(),
        label: (j['label'] ?? '').toString(),
        isExtra: j['isExtra'] == true,
        freeHit: j['freeHit'] == true,
      );
}

/// An active batter in the live snapshot.
class BatterStat {
  final String id;
  final String name;
  final String? profilePicture;
  final int runs;
  final int balls;
  final int fours;
  final int sixes;
  final double strikeRate;

  const BatterStat({
    required this.id,
    required this.name,
    this.profilePicture,
    this.runs = 0,
    this.balls = 0,
    this.fours = 0,
    this.sixes = 0,
    this.strikeRate = 0,
  });

  factory BatterStat.fromJson(Map<String, dynamic> j) => BatterStat(
        id: (j['id'] ?? j['userId'] ?? '').toString(),
        name: (j['name'] ?? 'Player').toString(),
        profilePicture: j['profilePicture']?.toString(),
        runs: _toInt(j['runs']),
        balls: _toInt(j['balls']),
        fours: _toInt(j['fours']),
        sixes: _toInt(j['sixes']),
        strikeRate: _toDouble(j['strikeRate']),
      );
}

/// The current bowler in the live snapshot.
class BowlerStat {
  final String id;
  final String name;
  final String? profilePicture;
  final int overs;
  final int balls;
  final int maidens;
  final int runs;
  final int wickets;

  const BowlerStat({
    required this.id,
    required this.name,
    this.profilePicture,
    this.overs = 0,
    this.balls = 0,
    this.maidens = 0,
    this.runs = 0,
    this.wickets = 0,
  });

  String get oversString => '$overs.$balls';

  factory BowlerStat.fromJson(Map<String, dynamic> j) => BowlerStat(
        id: (j['id'] ?? j['userId'] ?? '').toString(),
        name: (j['name'] ?? 'Player').toString(),
        profilePicture: j['profilePicture']?.toString(),
        overs: _toInt(j['overs']),
        balls: _toInt(j['balls']),
        maidens: _toInt(j['maidens']),
        runs: _toInt(j['runs']),
        wickets: _toInt(j['wickets']),
      );
}

/// Full read-only snapshot returned by `/scoring/live-score/:matchId`
/// and broadcast over the `SCORE_UPDATED` socket event.
class LiveScoreSnapshot {
  final String matchId;
  final String battingTeamName;
  final String? battingTeamImage;
  final int runs;
  final int wickets;
  final int overs;
  final int balls;
  final String overString;
  final String crr;
  final int? target;
  final int? runsNeeded;
  final int? ballsRemaining;
  final String? rrr;
  final List<TimelineBall> last6Balls;
  final List<BatterStat> batters;
  final BowlerStat? bowler;
  final String? result;
  final String? status;
  final bool isLive;
  final String? matchName;
  final Map<String, dynamic>? teamA;
  final Map<String, dynamic>? teamB;
  final bool isInningsComplete;
  final bool isMatchComplete;
  final int currentInningsIndex;

  /// Free-hit flag (Law 21.18). UI should grey out illegal wicket
  /// buttons while true. Cleared on the next fair delivery.
  final bool freeHitActive;

  /// True when DLS-lite has revised the target. Pair with
  /// [revisedTarget] / [revisedOvers] for the banner text.
  final bool isRevised;
  final int? revisedTarget;
  final int? revisedOvers;

  /// Total extras (wides + no-balls + byes + leg-byes + penalties) for the
  /// current innings. Used by the innings-summary modal.
  final int extras;

  /// Powerplay-window stats for the current innings (when the host enabled
  /// powerplay during creation). All optional — when the backend doesn't
  /// emit them, the summary modal hides the powerplay section.
  final int? powerPlayRuns;
  final int? powerPlayWickets;
  final int? powerPlayOvers;

  const LiveScoreSnapshot({
    required this.matchId,
    required this.battingTeamName,
    this.battingTeamImage,
    this.runs = 0,
    this.wickets = 0,
    this.overs = 0,
    this.balls = 0,
    this.overString = '0.0',
    this.crr = '0.00',
    this.target,
    this.runsNeeded,
    this.ballsRemaining,
    this.rrr,
    this.last6Balls = const [],
    this.batters = const [],
    this.bowler,
    this.result,
    this.status,
    this.isLive = false,
    this.matchName,
    this.teamA,
    this.teamB,
    this.isInningsComplete = false,
    this.isMatchComplete = false,
    this.currentInningsIndex = 0,
    this.freeHitActive = false,
    this.isRevised = false,
    this.revisedTarget,
    this.revisedOvers,
    this.extras = 0,
    this.powerPlayRuns,
    this.powerPlayWickets,
    this.powerPlayOvers,
  });

  bool get isComplete =>
      (result != null && result!.isNotEmpty) ||
      (status?.toUpperCase() == 'COMPLETED');

  factory LiveScoreSnapshot.fromJson(Map<String, dynamic> j) {
    final batters = (j['batters'] as List?)
            ?.whereType<Map>()
            .map((e) => BatterStat.fromJson(Map<String, dynamic>.from(e)))
            .toList() ??
        const <BatterStat>[];
    final last6 = (j['last6Balls'] as List?)
            ?.whereType<Map>()
            .map((e) => TimelineBall.fromJson(Map<String, dynamic>.from(e)))
            .toList() ??
        const <TimelineBall>[];
    final bowlerRaw = j['bowler'];
    return LiveScoreSnapshot(
      matchId: (j['matchId'] ?? '').toString(),
      battingTeamName: (j['battingTeamName'] ?? 'Team').toString(),
      battingTeamImage: j['battingTeamImage']?.toString(),
      runs: _toInt(j['runs'] ?? j['totalRuns']),
      wickets: _toInt(j['wickets'] ?? j['totalWickets']),
      overs: _toInt(j['overs']),
      balls: _toInt(j['balls']),
      overString: (j['overString'] ?? '0.0').toString(),
      crr: (j['crr'] ?? '0.00').toString(),
      target: j['target'] != null ? _toInt(j['target']) : null,
      runsNeeded: j['runsNeeded'] != null ? _toInt(j['runsNeeded']) : null,
      ballsRemaining:
          j['ballsRemaining'] != null ? _toInt(j['ballsRemaining']) : null,
      rrr: j['rrr']?.toString(),
      last6Balls: last6,
      batters: batters,
      bowler: bowlerRaw is Map
          ? BowlerStat.fromJson(Map<String, dynamic>.from(bowlerRaw))
          : null,
      result: j['result']?.toString(),
      status: j['status']?.toString(),
      isLive: j['isLive'] == true,
      matchName: j['matchName']?.toString(),
      teamA: j['teamA'] is Map
          ? Map<String, dynamic>.from(j['teamA'] as Map)
          : null,
      teamB: j['teamB'] is Map
          ? Map<String, dynamic>.from(j['teamB'] as Map)
          : null,
      isInningsComplete: j['isInningsComplete'] == true,
      isMatchComplete: j['isMatchComplete'] == true,
      currentInningsIndex: _toInt(j['currentInningsIndex']),
      freeHitActive: j['freeHitActive'] == true,
      isRevised: j['isRevised'] == true,
      revisedTarget:
          j['revisedTarget'] != null ? _toInt(j['revisedTarget']) : null,
      revisedOvers:
          j['revisedOvers'] != null ? _toInt(j['revisedOvers']) : null,
      extras: _toInt(j['extras'] ?? j['totalExtras']),
      powerPlayRuns: j['powerPlayRuns'] != null
          ? _toInt(j['powerPlayRuns'])
          : (j['powerplay'] is Map
              ? _toInt((j['powerplay'] as Map)['runs'])
              : null),
      powerPlayWickets: j['powerPlayWickets'] != null
          ? _toInt(j['powerPlayWickets'])
          : (j['powerplay'] is Map
              ? _toInt((j['powerplay'] as Map)['wickets'])
              : null),
      powerPlayOvers: j['powerPlayOvers'] != null
          ? _toInt(j['powerPlayOvers'])
          : (j['powerplay'] is Map
              ? _toInt((j['powerplay'] as Map)['overs'])
              : null),
    );
  }
}

/// A player on a team roster (from hostedGame.teamX.slots).
class RosterPlayer {
  final String id;
  final String name;
  final String? profilePicture;
  final String? role;

  const RosterPlayer({
    required this.id,
    required this.name,
    this.profilePicture,
    this.role,
  });

  /// Parses a slot: prefers the real `user`, falls back to `customPlayer`.
  static RosterPlayer? fromSlot(Map<String, dynamic> slot) {
    final user = slot['user'];
    if (user is Map) {
      final id = (user['id'] ?? user['_id'] ?? '').toString();
      if (id.isEmpty) return null;
      return RosterPlayer(
        id: id,
        name: (user['name'] ?? 'Player').toString(),
        profilePicture: user['profilePicture']?.toString(),
        role: slot['role']?.toString(),
      );
    }
    final custom = slot['customPlayer'];
    if (custom is Map) {
      final id = (custom['id'] ?? custom['_id'] ?? '').toString();
      if (id.isEmpty) return null;
      return RosterPlayer(
        id: id,
        name: (custom['name'] ?? 'Player').toString(),
        role: slot['role']?.toString(),
      );
    }
    return null;
  }

  static List<RosterPlayer> listFromTeam(dynamic team) {
    if (team is! Map) return const [];
    final slots = team['slots'];
    if (slots is! List) return const [];
    return slots
        .whereType<Map>()
        .map((s) => RosterPlayer.fromSlot(Map<String, dynamic>.from(s)))
        .whereType<RosterPlayer>()
        .toList();
  }
}

/// Combined result of `/scoring/status/:matchId` — the session (if the match
/// has been started) plus the hosted-game team rosters for player pickers.
class MatchStatus {
  final ScoringSession? session;
  final LiveScoreSnapshot? snapshot;
  final String teamAName;
  final String teamBName;

  /// Backend Mongo `_id` for teamA / teamB on the hosted game. Required by
  /// /scoring/next-innings — the alias `'teamA'`/`'teamB'` is rejected with
  /// "innings 1 batting team must differ from innings 0" because the backend
  /// stores the actual team id internally.
  final String? teamAId;
  final String? teamBId;
  final List<RosterPlayer> teamAPlayers;
  final List<RosterPlayer> teamBPlayers;

  /// Backend format string from `hostedGame.format` (T20 / T10 / ODI /
  /// THE_HUNDRED / CUSTOM / ...). Populated even before the live session
  /// is started so the pre-match view can render the real format.
  final String? hostedGameFormat;

  /// Overs-per-innings derived from `hostedGame` — falls back across the
  /// `oversPerInnings` / `maxOvers` / `customOversPerDay` keys.
  final int? hostedGameOvers;

  /// Raw `hostedGame` payload from the status response. Kept whole so
  /// completion-time scorecards can surface everything captured during
  /// match creation (venue, ball type, ground type, umpire name, scheduled
  /// time, house rules, …) without needing a typed field per attribute.
  final Map<String, dynamic>? hostedGame;

  const MatchStatus({
    this.session,
    this.snapshot,
    this.teamAName = 'Team A',
    this.teamBName = 'Team B',
    this.teamAId,
    this.teamBId,
    this.teamAPlayers = const [],
    this.teamBPlayers = const [],
    this.hostedGameFormat,
    this.hostedGameOvers,
    this.hostedGame,
  });

  bool get isStarted => session != null;

  factory MatchStatus.fromJson(Map<String, dynamic> j) {
    final hostedGame = (j['hostedGame'] is Map)
        ? Map<String, dynamic>.from(j['hostedGame'] as Map)
        : const <String, dynamic>{};
    final teamA = hostedGame['teamA'];
    final teamB = hostedGame['teamB'];
    final scoring = j['scoring'];
    final snap = j['scoringSnapshot'];

    final format = hostedGame['format']?.toString();
    // For CUSTOM matches the backend often populates both `oversPerInnings`
    // (defaulted to 20) AND `customOversPerDay` (the value the host actually
    // chose). Check the custom key first when format=CUSTOM so the UI shows
    // the host's choice instead of the default.
    final isCustom = (format ?? '').toUpperCase() == 'CUSTOM';
    final keys = isCustom
        ? const ['customOversPerDay', 'oversPerInnings', 'maxOvers']
        : const ['oversPerInnings', 'maxOvers', 'customOversPerDay'];
    int? overs;
    for (final key in keys) {
      final v = hostedGame[key];
      if (v is num) {
        overs = v.toInt();
        break;
      }
      if (v is String) {
        final parsed = int.tryParse(v);
        if (parsed != null) {
          overs = parsed;
          break;
        }
      }
    }

    return MatchStatus(
      session: scoring is Map
          ? ScoringSession.fromJson(Map<String, dynamic>.from(scoring))
          : null,
      snapshot: snap is Map
          ? LiveScoreSnapshot.fromJson(Map<String, dynamic>.from(snap))
          : null,
      teamAName: (teamA is Map ? teamA['name'] : null)?.toString() ?? 'Team A',
      teamBName: (teamB is Map ? teamB['name'] : null)?.toString() ?? 'Team B',
      teamAId: teamA is Map
          ? (teamA['id'] ?? teamA['_id'] ?? teamA['teamId'])?.toString()
          : null,
      teamBId: teamB is Map
          ? (teamB['id'] ?? teamB['_id'] ?? teamB['teamId'])?.toString()
          : null,
      teamAPlayers: RosterPlayer.listFromTeam(teamA),
      teamBPlayers: RosterPlayer.listFromTeam(teamB),
      hostedGameFormat: (format != null && format.isNotEmpty) ? format : null,
      hostedGameOvers: overs,
      hostedGame: hostedGame.isEmpty ? null : hostedGame,
    );
  }
}

/// Minimal view of the scoring session record (the persisted match state).
/// `id` here is the `scoringId` used by all write endpoints.
class ScoringSession {
  final String id; // scoringId
  final String gameId;
  final String status; // IN_PROGRESS | COMPLETED ...
  final int currentInningsIndex;
  final String? strikerId;
  final String? nonStrikerId;
  final String? bowlerId;
  final Map<String, dynamic> raw;

  const ScoringSession({
    required this.id,
    required this.gameId,
    required this.status,
    this.currentInningsIndex = 0,
    this.strikerId,
    this.nonStrikerId,
    this.bowlerId,
    this.raw = const {},
  });

  bool get hasOpeningPlayers =>
      (strikerId?.isNotEmpty ?? false) &&
      (nonStrikerId?.isNotEmpty ?? false) &&
      (bowlerId?.isNotEmpty ?? false);

  factory ScoringSession.fromJson(Map<String, dynamic> j) => ScoringSession(
        id: (j['id'] ?? j['_id'] ?? j['scoringId'] ?? '').toString(),
        gameId: (j['gameId'] ?? j['matchId'] ?? '').toString(),
        status: (j['status'] ?? 'IN_PROGRESS').toString(),
        currentInningsIndex: _toInt(j['currentInningsIndex']),
        strikerId: j['strikerId']?.toString(),
        nonStrikerId: j['nonStrikerId']?.toString(),
        bowlerId: j['bowlerId']?.toString(),
        raw: j,
      );
}
