import 'dart:async';

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/app_colors.dart';
import '../models/scoring_models.dart';
import '../services/scoring_service.dart';
import '../services/scoring_socket_service.dart';
import '../widgets/common/bms_toast.dart';
import '../widgets/scoring/scoring_password_modal.dart';

class ScorecardScreen extends StatefulWidget {
  final String matchId;
  final String sport;
  final String teamA;
  final String teamB;
  final int scoreA;
  final int scoreB;
  final int wicketsA;
  final int wicketsB;
  final double oversA;
  final double oversB;
  final String? winner;
  final String location;
  final String? matchName;

  const ScorecardScreen({
    Key? key,
    required this.matchId,
    required this.sport,
    required this.teamA,
    required this.teamB,
    required this.scoreA,
    required this.scoreB,
    this.wicketsA = 0,
    this.wicketsB = 0,
    this.oversA = 0,
    this.oversB = 0,
    this.winner,
    required this.location,
    this.matchName,
  }) : super(key: key);

  @override
  State<ScorecardScreen> createState() => _ScorecardScreenState();
}

class _ScorecardScreenState extends State<ScorecardScreen> {
  late String _sport;
  late String _teamA;
  late String _teamB;
  late int _scoreA;
  late int _scoreB;
  late int _wicketsA;
  late int _wicketsB;
  late double _oversA;
  late double _oversB;
  late String _location;
  String? _winner;
  String? _matchName;

  bool _loading = false;
  bool _isLive = false;

  String? _format;
  int? _maxOvers;
  String? _ballType;
  String? _pitchType;
  String? _groundType;
  String? _matchTiming;
  String? _umpireName;
  DateTime? _matchDateTime;
  String? _tossWinner;
  String? _tossDecision;
  int? _powerPlayOvers;
  String? _resultLine;

  // Live snapshot — only populated when the match is live, used to drive
  // the rich live scoreboard block under the result card.
  LiveScoreSnapshot? _liveSnap;

  // Socket subscription. We open it once we know the match is live so the
  // live block updates in real time the same way the old /live-score
  // screen did.
  final ScoringSocketService _socket = ScoringSocketService();
  StreamSubscription<LiveScoreSnapshot>? _scoreSub;
  StreamSubscription<void>? _endedSub;
  bool _socketConnected = false;

  @override
  void initState() {
    super.initState();
    _sport = widget.sport;
    _teamA = widget.teamA;
    _teamB = widget.teamB;
    _scoreA = widget.scoreA;
    _scoreB = widget.scoreB;
    _wicketsA = widget.wicketsA;
    _wicketsB = widget.wicketsB;
    _oversA = widget.oversA;
    _oversB = widget.oversB;
    _location = widget.location;
    _winner = widget.winner;
    _matchName = widget.matchName;

    // Caller (e.g. join_games_screen) often pushes only `matchId` and lets
    // this screen resolve everything else from the backend. Trigger the
    // fetch whenever we have a matchId AND the scoreline looks empty.
    if (widget.matchId.isNotEmpty && _looksEmpty()) {
      _loadFromBackend();
    }
  }

  bool _looksEmpty() =>
      _scoreA == 0 &&
      _scoreB == 0 &&
      _wicketsA == 0 &&
      _wicketsB == 0 &&
      _winner == null;

  bool get _isCricket => _sport.toLowerCase() == 'cricket';

  Future<void> _loadFromBackend() async {
    setState(() => _loading = true);
    final service = ScoringService();
    final statusRes = await service.getMatchStatus(widget.matchId);
    final reportRaw = await service.getMatchReport(widget.matchId);
    if (!mounted) return;

    if (statusRes.ok && statusRes.data != null) {
      _applyStatus(statusRes.data!);
    }
    if (reportRaw != null) {
      _applyReport(reportRaw);
    }
    // Always fetch the live snapshot — for in-progress matches it drives
    // the live banner (target, runs needed, balls remaining); for
    // completed matches it backfills team totals when nothing else had
    // them.
    final liveRes = await service.getLiveScore(widget.matchId);
    if (mounted && liveRes.ok && liveRes.data != null) {
      _applyLiveSnapshot(liveRes.data!);
    }
    if (!mounted) return;
    setState(() => _loading = false);
    if (_isLive) await _connectSocket();
  }

  Future<void> _connectSocket() async {
    if (_socketConnected || widget.matchId.isEmpty) return;
    _socketConnected = true;
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    _socket.connect(widget.matchId, token: token);
    _scoreSub = _socket.scoreStream.listen((snap) {
      if (!mounted) return;
      setState(() => _applyLiveSnapshot(snap));
    });
    _endedSub = _socket.matchEndedStream.listen((_) {
      if (!mounted) return;
      setState(() => _isLive = false);
    });
  }

  @override
  void dispose() {
    _scoreSub?.cancel();
    _endedSub?.cancel();
    if (_socketConnected) _socket.leaveCurrentMatch();
    super.dispose();
  }

  void _applyStatus(MatchStatus status) {
    if (_teamA == 'Team A' || _teamA.isEmpty) _teamA = status.teamAName;
    if (_teamB == 'Team B' || _teamB.isEmpty) _teamB = status.teamBName;
    _format ??= status.hostedGameFormat;
    _maxOvers ??= status.hostedGameOvers;

    final hg = status.hostedGame;
    if (hg != null) {
      _matchName =
          _firstString(_matchName, [hg['matchName'], hg['name'], hg['title']]);
      _location = _firstString(_location.isNotEmpty ? _location : null,
              [hg['location'], hg['venue'], hg['city']]) ??
          _location;
      _ballType = _firstString(_ballType, [hg['ballType']]);
      _pitchType = _firstString(_pitchType, [hg['pitchType']]);
      _groundType = _firstString(_groundType, [hg['groundType']]);
      _matchTiming = _firstString(_matchTiming, [hg['matchTiming']]);
      _umpireName = _firstString(_umpireName, [hg['umpireName'], hg['umpire']]);
      _powerPlayOvers ??= _numOrNull(hg['powerPlayOvers'])?.toInt();
      final dt = hg['matchDateTime'] ?? hg['scheduledTime'] ?? hg['startTime'];
      if (_matchDateTime == null && dt is String) {
        _matchDateTime = DateTime.tryParse(dt);
      }
      _format ??= hg['format']?.toString();
    }

    final session = status.session;
    if (session != null) {
      final raw = session.raw;
      _tossWinner =
          _firstString(_tossWinner, [raw['tossWinnerName'], raw['tossWinner']]);
      _tossDecision = _firstString(_tossDecision, [raw['tossDecision']]);
      final status0 = raw['status']?.toString().toUpperCase();
      if (status0 == 'COMPLETED') {
        _isLive = false;
      } else if (status0 == 'LIVE' || status0 == 'IN_PROGRESS') {
        _isLive = true;
      }
      _resultLine = _firstString(_resultLine, [raw['result']]);
    }

    final snap = status.snapshot;
    if (snap != null) {
      if (_matchName == null || _matchName!.isEmpty) {
        _matchName = snap.matchName;
      }
      _applyTeamMap(snap.teamA, isTeamA: true);
      _applyTeamMap(snap.teamB, isTeamA: false);
      if (snap.result != null && snap.result!.isNotEmpty) {
        _resultLine ??= snap.result;
        _winner ??= _deriveWinnerFromResult(snap.result!);
      }
      if (snap.isLive) _isLive = true;
      if (snap.isMatchComplete) _isLive = false;
    }
  }

  String? _firstString(String? current, List<dynamic> candidates) {
    if (current != null && current.isNotEmpty) return current;
    for (final c in candidates) {
      if (c is String && c.trim().isNotEmpty) return c.trim();
    }
    return current;
  }

  void _applyTeamMap(Map<String, dynamic>? team, {required bool isTeamA}) {
    if (team == null) return;
    final runs = _numOrNull(team['runs'] ?? team['totalRuns'] ?? team['score']);
    final wkts = _numOrNull(team['wickets'] ?? team['totalWickets']);
    final overs = _numOrNull(team['overs']);
    if (runs != null) {
      if (isTeamA) {
        _scoreA = runs.toInt();
      } else {
        _scoreB = runs.toInt();
      }
    }
    if (wkts != null) {
      if (isTeamA) {
        _wicketsA = wkts.toInt();
      } else {
        _wicketsB = wkts.toInt();
      }
    }
    if (overs != null) {
      if (isTeamA) {
        _oversA = overs.toDouble();
      } else {
        _oversB = overs.toDouble();
      }
    }
  }

  void _applyReport(Map<String, dynamic> report) {
    // Backend report payload commonly nests data under `data` or `report`.
    final root = report['data'] is Map
        ? Map<String, dynamic>.from(report['data'] as Map)
        : (report['report'] is Map
            ? Map<String, dynamic>.from(report['report'] as Map)
            : report);

    _matchName = _firstString(_matchName, [root['matchName'], root['title']]);

    final sport = root['sport'] ?? root['sportType'];
    if (sport is String &&
        sport.isNotEmpty &&
        (_sport.isEmpty || _sport.toLowerCase() == 'cricket')) {
      _sport = sport;
    }

    final loc = root['location'] ?? root['venue'] ?? root['city'];
    if (loc is String && loc.isNotEmpty && _location.isEmpty) {
      _location = loc;
    }

    _format ??= root['format']?.toString();
    _ballType = _firstString(_ballType, [root['ballType']]);
    _pitchType = _firstString(_pitchType, [root['pitchType']]);
    _groundType = _firstString(_groundType, [root['groundType']]);
    _matchTiming = _firstString(_matchTiming, [root['matchTiming']]);
    _umpireName =
        _firstString(_umpireName, [root['umpireName'], root['umpire']]);
    _tossWinner =
        _firstString(_tossWinner, [root['tossWinnerName'], root['tossWinner']]);
    _tossDecision = _firstString(_tossDecision, [root['tossDecision']]);
    final dt = root['matchDateTime'] ?? root['startTime'] ?? root['date'];
    if (_matchDateTime == null && dt is String) {
      _matchDateTime = DateTime.tryParse(dt);
    }
    _powerPlayOvers ??= _numOrNull(root['powerPlayOvers'])?.toInt();
    _maxOvers ??= _numOrNull(root['oversPerInnings'] ??
            root['maxOvers'] ??
            root['customOversPerDay'])
        ?.toInt();

    final result = root['result'];
    if (result is String && result.isNotEmpty) {
      _resultLine ??= result;
      _winner ??= _deriveWinnerFromResult(result);
    }
    final winnerName = root['winner'] ?? root['winningTeam'];
    if (winnerName is String && winnerName.isNotEmpty && _winner == null) {
      _winner = winnerName;
    }

    final status = root['status']?.toString().toUpperCase();
    if (status == 'COMPLETED') _isLive = false;
    if (status == 'LIVE' || status == 'IN_PROGRESS') _isLive = true;

    _applyTeamMap(_asMap(root['teamA']), isTeamA: true);
    _applyTeamMap(_asMap(root['teamB']), isTeamA: false);

    // Flat keys (teamARuns, teamAWickets, teamAOvers …) used by the
    // `/scoring/live` legacy shape.
    final flatRunsA = _numOrNull(root['teamARuns']);
    final flatRunsB = _numOrNull(root['teamBRuns']);
    final flatWktsA = _numOrNull(root['teamAWickets']);
    final flatWktsB = _numOrNull(root['teamBWickets']);
    final flatOversA = _numOrNull(root['teamAOvers']);
    final flatOversB = _numOrNull(root['teamBOvers']);
    if (flatRunsA != null) _scoreA = flatRunsA.toInt();
    if (flatRunsB != null) _scoreB = flatRunsB.toInt();
    if (flatWktsA != null) _wicketsA = flatWktsA.toInt();
    if (flatWktsB != null) _wicketsB = flatWktsB.toInt();
    if (flatOversA != null) _oversA = flatOversA.toDouble();
    if (flatOversB != null) _oversB = flatOversB.toDouble();
  }

  void _applyLiveSnapshot(LiveScoreSnapshot snap) {
    _liveSnap = snap;
    if (snap.isLive && !snap.isMatchComplete) {
      _isLive = true;
    }
    if (snap.isMatchComplete) _isLive = false;

    if (_matchName == null || _matchName!.isEmpty) {
      _matchName = snap.matchName;
    }
    _applyTeamMap(snap.teamA, isTeamA: true);
    _applyTeamMap(snap.teamB, isTeamA: false);

    final battingIsA = _teamA.isNotEmpty &&
        snap.battingTeamName.toLowerCase() == _teamA.toLowerCase();
    if (battingIsA) {
      if (_scoreA == 0) _scoreA = snap.runs;
      if (_wicketsA == 0) _wicketsA = snap.wickets;
      if (_oversA == 0) _oversA = snap.overs.toDouble();
    } else {
      if (_scoreB == 0) _scoreB = snap.runs;
      if (_wicketsB == 0) _wicketsB = snap.wickets;
      if (_oversB == 0) _oversB = snap.overs.toDouble();
    }
    if (snap.target != null && snap.currentInningsIndex >= 1) {
      if (battingIsA && _scoreB == 0) _scoreB = snap.target! - 1;
      if (!battingIsA && _scoreA == 0) _scoreA = snap.target! - 1;
    }
  }

  Map<String, dynamic>? _asMap(dynamic v) =>
      v is Map ? Map<String, dynamic>.from(v) : null;

  num? _numOrNull(dynamic v) {
    if (v == null) return null;
    if (v is num) return v;
    return num.tryParse(v.toString());
  }

  String? _deriveWinnerFromResult(String result) {
    final lower = result.toLowerCase();
    if (lower.contains('draw') || lower.contains('tie')) return 'Draw';
    if (_teamA.isNotEmpty &&
        lower.contains(_teamA.toLowerCase()) &&
        lower.contains('won')) {
      return _teamA;
    }
    if (_teamB.isNotEmpty &&
        lower.contains(_teamB.toLowerCase()) &&
        lower.contains('won')) {
      return _teamB;
    }
    return null;
  }

  String get _resultText {
    if (_isLive) return 'Match in progress';
    if (_resultLine != null && _resultLine!.isNotEmpty) return _resultLine!;
    if (_winner == null || _winner == 'Draw') return 'Match Drawn';
    if (_winner == _teamA) {
      if (_isCricket) {
        final runsWon = _scoreA - _scoreB;
        return '$_teamA won by $runsWon runs';
      }
      return '$_teamA won';
    }
    if (_isCricket) {
      final wicketsLeft = 10 - _wicketsB;
      return '$_teamB won by $wicketsLeft wickets';
    }
    return '$_teamB won';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Scorecard',
          style: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.w700,
            fontFamily: 'Poppins',
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.share2, color: Colors.white70),
            onPressed: () => BmsToast.info(context, 'Share coming soon!'),
          ),
        ],
      ),
      body: _loading && _looksEmpty()
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Result card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          AppColors.surfaceForest,
                          AppColors.backgroundCard
                        ],
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                          color: AppColors.primary.withValues(alpha: 0.3)),
                    ),
                    child: Column(
                      children: [
                        if (_isLive)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.errorRed.withValues(alpha: 0.18),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                  color: AppColors.errorRed
                                      .withValues(alpha: 0.6)),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(LucideIcons.radio,
                                    color: AppColors.errorRed, size: 12),
                                SizedBox(width: 6),
                                Text(
                                  'LIVE',
                                  style: TextStyle(
                                    color: AppColors.errorRed,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1.5,
                                    fontFamily: 'Poppins',
                                  ),
                                ),
                              ],
                            ),
                          )
                        else
                          const Icon(LucideIcons.trophy,
                              color: AppColors.accentYellow, size: 36),
                        const SizedBox(height: 8),
                        Text(
                          _resultText,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Poppins',
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Score row
                        Row(
                          children: [
                            Expanded(
                              child: _TeamBlock(
                                name: _teamA,
                                score: _isCricket
                                    ? '$_scoreA/$_wicketsA'
                                    : '$_scoreA',
                                sub: _isCricket
                                    ? '${_oversA.toStringAsFixed(0)} overs'
                                    : _sport,
                                isWinner: _winner == _teamA,
                              ),
                            ),
                            const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 10),
                              child: Text(
                                'VS',
                                style: TextStyle(
                                    color: Colors.white24,
                                    fontSize: 13,
                                    fontFamily: 'Poppins'),
                              ),
                            ),
                            Expanded(
                              child: _TeamBlock(
                                name: _teamB,
                                score: _isCricket
                                    ? '$_scoreB/$_wicketsB'
                                    : '$_scoreB',
                                sub: _isCricket
                                    ? '${_oversB.toStringAsFixed(0)} overs'
                                    : _sport,
                                isWinner: _winner == _teamB,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  if (_isLive && _liveSnap != null) ...[
                    const SizedBox(height: 14),
                    _liveBanner(_liveSnap!),
                  ],

                  const SizedBox(height: 20),

                  // Match info
                  const Text(
                    'Match Info',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Poppins',
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (_matchName != null && _matchName!.isNotEmpty)
                    _infoRow(LucideIcons.trophy, 'Match', _matchName!),
                  _infoRow(Icons.sports, 'Sport', _sport),
                  if (_formatLabel().isNotEmpty)
                    _infoRow(LucideIcons.layers, 'Format', _formatLabel()),
                  _infoRow(LucideIcons.mapPin, 'Venue', _location),
                  _infoRow(
                    LucideIcons.calendar,
                    'Date',
                    _formattedDate(_matchDateTime ?? DateTime.now()),
                  ),
                  if (_matchDateTime != null)
                    _infoRow(LucideIcons.clock, 'Time',
                        _formattedTime(_matchDateTime!)),
                  if (_matchTiming != null && _matchTiming!.isNotEmpty)
                    _infoRow(LucideIcons.timer, 'Timing', _matchTiming!),
                  if (_ballType != null && _ballType!.isNotEmpty)
                    _infoRow(LucideIcons.circle, 'Ball', _prettify(_ballType!)),
                  if (_pitchType != null && _pitchType!.isNotEmpty)
                    _infoRow(
                        LucideIcons.layers, 'Pitch', _prettify(_pitchType!)),
                  if (_groundType != null && _groundType!.isNotEmpty)
                    _infoRow(
                        LucideIcons.trees, 'Ground', _prettify(_groundType!)),
                  if (_umpireName != null && _umpireName!.isNotEmpty)
                    _infoRow(LucideIcons.userCheck, 'Umpire', _umpireName!),
                  if (_powerPlayOvers != null && _powerPlayOvers! > 0)
                    _infoRow(LucideIcons.zap, 'Powerplay',
                        '${_powerPlayOvers!} overs'),
                  if (_tossSummary().isNotEmpty)
                    _infoRow(LucideIcons.coins, 'Toss', _tossSummary()),

                  const SizedBox(height: 20),

                  // Stats section
                  const Text(
                    'Match Stats',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Poppins',
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (_isCricket) ...[
                    _statRow(_teamA, '$_scoreA runs', _teamB, '$_scoreB runs',
                        'Total Runs'),
                    _statRow(_teamA, '$_wicketsA', _teamB, '$_wicketsB',
                        'Wickets Lost'),
                    _statRow(_teamA, '${_oversA.toStringAsFixed(0)} ov', _teamB,
                        '${_oversB.toStringAsFixed(0)} ov', 'Overs Played'),
                  ] else ...[
                    _statRow(_teamA, '$_scoreA', _teamB, '$_scoreB', 'Score'),
                  ],

                  if (_isLive) ...[
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: _promptContinueScoring,
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(
                              color:
                                  AppColors.errorRed.withValues(alpha: 0.55)),
                          minimumSize: const Size.fromHeight(44),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                        ),
                        icon: const Icon(LucideIcons.lock,
                            color: AppColors.errorRed, size: 16),
                        label: const Text(
                          'Continue scoring on this device',
                          style: TextStyle(
                            color: AppColors.errorRed,
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Poppins',
                          ),
                        ),
                      ),
                    ),
                  ],

                  const SizedBox(height: 24),

                  // Actions
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => context.go('/dashboard'),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Colors.white24),
                            minimumSize: const Size.fromHeight(48),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                          icon: const Icon(LucideIcons.home,
                              color: Colors.white70, size: 18),
                          label: const Text(
                            'Home',
                            style: TextStyle(
                                color: Colors.white70, fontFamily: 'Poppins'),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => context.push('/score-history'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.black,
                            minimumSize: const Size.fromHeight(48),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                          icon: const Icon(LucideIcons.history, size: 18),
                          label: const Text(
                            'All Results',
                            style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontFamily: 'Poppins'),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(icon, color: AppColors.primary, size: 16),
          const SizedBox(width: 10),
          Text(
            '$label: ',
            style: const TextStyle(
              color: AppColors.textGray,
              fontSize: 13,
              fontFamily: 'Poppins',
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 13,
                fontFamily: 'Poppins',
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _statRow(
      String nameA, String valA, String nameB, String valB, String stat) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.backgroundCard,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              valA,
              textAlign: TextAlign.left,
              style: const TextStyle(
                color: AppColors.primary,
                fontSize: 14,
                fontWeight: FontWeight.w700,
                fontFamily: 'Poppins',
              ),
            ),
          ),
          Text(
            stat,
            style: const TextStyle(
              color: AppColors.textGray,
              fontSize: 11,
              fontFamily: 'Poppins',
            ),
          ),
          Expanded(
            child: Text(
              valB,
              textAlign: TextAlign.right,
              style: const TextStyle(
                color: Colors.white54,
                fontSize: 14,
                fontWeight: FontWeight.w700,
                fontFamily: 'Poppins',
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formattedDate(DateTime d) => '${d.day}/${d.month}/${d.year}';

  String _formattedTime(DateTime d) {
    final h = d.hour % 12 == 0 ? 12 : d.hour % 12;
    final m = d.minute.toString().padLeft(2, '0');
    final ampm = d.hour >= 12 ? 'PM' : 'AM';
    return '$h:$m $ampm';
  }

  String _formatLabel() {
    final parts = <String>[];
    if (_format != null && _format!.isNotEmpty) {
      parts.add(_format!.toUpperCase());
    }
    if (_maxOvers != null && _maxOvers! > 0) {
      parts.add('${_maxOvers!} overs');
    }
    return parts.join(' • ');
  }

  String _tossSummary() {
    if (_tossWinner == null || _tossWinner!.isEmpty) return '';
    final decision = (_tossDecision ?? '').toLowerCase();
    if (decision.isEmpty) return _tossWinner!;
    final pretty = decision == 'bat'
        ? 'chose to bat'
        : decision == 'bowl'
            ? 'chose to bowl'
            : decision;
    return '$_tossWinner $pretty';
  }

  String _prettify(String token) {
    final cleaned = token.replaceAll('_', ' ').toLowerCase();
    if (cleaned.isEmpty) return token;
    return cleaned[0].toUpperCase() + cleaned.substring(1);
  }

  void _promptContinueScoring() {
    if (widget.matchId.isEmpty) {
      BmsToast.info(context, 'Match id missing');
      return;
    }
    Navigator.of(context).push(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => ScoringPasswordModal(
          actionLabel: 'Continue scoring',
          onVerify: (pw) async {
            final res = await ScoringService().authenticateScorer(
              gameId: widget.matchId,
              password: pw,
            );
            return res.ok ? res.data : null;
          },
          onSuccess: (_) {
            Navigator.of(context).pop();
            context.push('/scoring', extra: {
              'matchId': widget.matchId,
              'sport': _sport,
              'teamA': _teamA,
              'teamB': _teamB,
              'location': _location,
              if (_format != null) 'format': _format,
              if (_maxOvers != null) 'overs': _maxOvers,
            });
          },
        ),
      ),
    );
  }

  Widget _liveBanner(LiveScoreSnapshot snap) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _liveScoreCard(snap),
        if (snap.batters.isNotEmpty) ...[
          const SizedBox(height: 12),
          _battersCard(snap),
        ],
        if (snap.bowler != null) ...[
          const SizedBox(height: 10),
          _bowlerCard(snap.bowler!),
        ],
        if (snap.last6Balls.isNotEmpty) ...[
          const SizedBox(height: 12),
          _recentBallsRow(snap),
        ],
      ],
    );
  }

  Widget _liveScoreCard(LiveScoreSnapshot snap) {
    final overString = snap.overString.isNotEmpty
        ? snap.overString
        : '${snap.overs}.${snap.balls}';
    final isSecondInnings = snap.currentInningsIndex >= 1;
    final ballsRem = snap.ballsRemaining;
    final oversRem =
        ballsRem != null ? '${ballsRem ~/ 6}.${ballsRem % 6}' : null;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.backgroundCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            snap.battingTeamName,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 15,
              fontWeight: FontWeight.w700,
              fontFamily: 'Poppins',
            ),
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                '${snap.runs}-${snap.wickets}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 36,
                  fontWeight: FontWeight.w800,
                  fontFamily: 'Poppins',
                ),
              ),
              const SizedBox(width: 10),
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(
                  '($overString)',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.55),
                    fontSize: 16,
                    fontFamily: 'Poppins',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              _liveChip('CRR ${snap.crr}'),
              if (snap.rrr != null && snap.rrr!.isNotEmpty) ...[
                const SizedBox(width: 8),
                _liveChip('RRR ${snap.rrr}'),
              ],
            ],
          ),
          if (isSecondInnings && snap.runsNeeded != null) ...[
            const SizedBox(height: 12),
            Text(
              oversRem != null
                  ? 'Need ${snap.runsNeeded} runs in $oversRem overs'
                  : 'Need ${snap.runsNeeded} runs',
              style: const TextStyle(
                color: AppColors.accentBlueLight,
                fontSize: 13,
                fontWeight: FontWeight.w600,
                fontFamily: 'Poppins',
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _liveChip(String text) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          text,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.75),
            fontSize: 12,
            fontWeight: FontWeight.w600,
            fontFamily: 'Poppins',
          ),
        ),
      );

  Widget _battersCard(LiveScoreSnapshot snap) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Batter',
                  style: TextStyle(
                    color: Colors.white38,
                    fontSize: 11,
                    fontFamily: 'Poppins',
                  ),
                ),
              ),
              _battersHdr('R'),
              _battersHdr('B'),
              _battersHdr('4s'),
              _battersHdr('6s'),
              _battersHdr('SR', wide: true),
            ],
          ),
          const SizedBox(height: 8),
          ...snap.batters.map((b) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        b.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'Poppins',
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    _battersCell('${b.runs}', bold: true),
                    _battersCell('${b.balls}'),
                    _battersCell('${b.fours}'),
                    _battersCell('${b.sixes}'),
                    _battersCell(b.strikeRate.toStringAsFixed(1), wide: true),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Widget _battersHdr(String t, {bool wide = false}) => SizedBox(
        width: wide ? 42 : 28,
        child: Text(
          t,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.white38,
            fontSize: 11,
            fontFamily: 'Poppins',
          ),
        ),
      );

  Widget _battersCell(String t, {bool bold = false, bool wide = false}) =>
      SizedBox(
        width: wide ? 42 : 28,
        child: Text(
          t,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: bold ? Colors.white : Colors.white70,
            fontSize: 12,
            fontWeight: bold ? FontWeight.w700 : FontWeight.w400,
            fontFamily: 'Poppins',
          ),
        ),
      );

  Widget _bowlerCard(BowlerStat b) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Row(
        children: [
          const Icon(Icons.sports_cricket,
              color: AppColors.accentBlueLight, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              b.name,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w600,
                fontFamily: 'Poppins',
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Text(
            '${b.wickets}-${b.runs}  (${b.oversString})',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.w700,
              fontFamily: 'Poppins',
            ),
          ),
        ],
      ),
    );
  }

  Widget _recentBallsRow(LiveScoreSnapshot snap) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'This over',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.45),
            fontSize: 12,
            fontFamily: 'Poppins',
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: snap.last6Balls.map(_recentBallChip).toList(),
        ),
      ],
    );
  }

  Widget _recentBallChip(TimelineBall b) {
    Color bg;
    Color fg = Colors.white;
    switch (b.type) {
      case 'wicket':
        bg = AppColors.errorRed;
        break;
      case 'boundary':
        bg = AppColors.accentLime;
        fg = Colors.black;
        break;
      default:
        bg = Colors.white.withValues(alpha: 0.10);
    }
    return Container(
      width: 34,
      height: 34,
      decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
      alignment: Alignment.center,
      child: Text(
        b.label,
        style: TextStyle(
          color: fg,
          fontSize: 12,
          fontWeight: FontWeight.w800,
          fontFamily: 'Poppins',
        ),
      ),
    );
  }
}

class _TeamBlock extends StatelessWidget {
  final String name, score, sub;
  final bool isWinner;

  const _TeamBlock({
    required this.name,
    required this.score,
    required this.sub,
    required this.isWinner,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (isWinner)
          const Icon(LucideIcons.trophy,
              color: AppColors.accentYellow, size: 18),
        const SizedBox(height: 4),
        Text(
          name,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: isWinner ? Colors.white : Colors.white54,
            fontSize: 13,
            fontWeight: FontWeight.w600,
            fontFamily: 'Poppins',
          ),
        ),
        const SizedBox(height: 6),
        Text(
          score,
          style: TextStyle(
            color: isWinner ? AppColors.primary : Colors.white38,
            fontSize: 26,
            fontWeight: FontWeight.w800,
            fontFamily: 'Poppins',
          ),
        ),
        Text(
          sub,
          style: const TextStyle(
            color: AppColors.textGray,
            fontSize: 11,
            fontFamily: 'Poppins',
          ),
        ),
      ],
    );
  }
}
