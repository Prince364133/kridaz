import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../core/util/image_url.dart';
import '../models/scoring_models.dart';
import '../services/scoring_service.dart';
import '../services/scoring_socket_service.dart';
import '../widgets/common/bms_toast.dart';
import '../widgets/scoring/scoring_ledger.dart';
import '../widgets/scoring/squads_view.dart';
import '../widgets/scoring/end_match_modal.dart';
import '../widgets/scoring/event_animation.dart';
import '../widgets/scoring/extra_runs_modal.dart';
import '../widgets/scoring/innings_setup_modal.dart';
import '../widgets/scoring/innings_summary_modal.dart';
import '../widgets/scoring/live_cards.dart';
import '../widgets/scoring/match_exit_modal.dart';
import '../widgets/scoring/penalty_modal.dart';
import '../widgets/scoring/select_bowler_modal.dart';
import '../widgets/scoring/house_rules_sheet.dart';
import '../widgets/scoring/settings_panel.dart';
import '../widgets/scoring/toss_modal.dart';
import '../widgets/scoring/visual_wagon_wheel_modal.dart';
import '../widgets/scoring/wicket_modal.dart';

/// Kridaz scoring console — Flutter parity port of the web's `ScoringApp.jsx`.
/// Visual layout mirrors the web: stadium-bg score header, 4-column scoring
/// grid, extras row, and a 3-tab bottom nav (Score / Teams / Ledger).
class ScoringScreen extends StatefulWidget {
  final String matchId;
  final String sport;
  final String teamA;
  final String teamB;
  final String location;

  /// Pre-set toss from the StartScoringModal (optional). When set, the
  /// bootstrap auto-calls `startScoring` with these values so the live toss
  /// modal is skipped.
  final String? presetTossWinner; // 'teamA' | 'teamB'
  final String? presetTossDecision; // 'BAT' | 'BOWL'
  /// Pre-set format / overs from the create-match wizard. Used by the
  /// pre-match view so the FORMAT / OVERS cards reflect what the creator
  /// actually chose instead of defaulting to T20/20 while the session is
  /// still un-started and `/scoring/status` hasn't filled them in.
  final String? presetFormat;
  final int? presetOvers;

  const ScoringScreen({
    super.key,
    required this.matchId,
    required this.sport,
    required this.teamA,
    required this.teamB,
    required this.location,
    this.presetTossWinner,
    this.presetTossDecision,
    this.presetFormat,
    this.presetOvers,
  });

  @override
  State<ScoringScreen> createState() => _ScoringScreenState();
}

enum _Phase {
  loading,
  error,
  unsupported,
  needsMatchStart, // pre-match: matchup card + START MATCH
  needsInningsSetup, // glowing "Setup Next Pair & Bowler"
  scoring,
  complete,
}

const _theme = Color(0xFF00C187);
const _bgDark = Color(0xFF121212);
const _bgPanel = Color(0xFF1E1E1E);
const _bgControlBar = Color(0xFF1A1A1A);
const _bgTabBar = Color(0xFF1C1C1C);
const _accentTeal = Color(0xFF2FD1C6);
const _accentMint = Color(0xFF81FBB8);
const _accentLime = Color(0xFFA1FF00);
const _accentYellow = Color(0xFFFFC403);
const _accentRed = Color(0xFFF40000);

class _ScoringScreenState extends State<ScoringScreen> {
  final _service = ScoringService();

  _Phase _phase = _Phase.loading;
  String? _error;
  bool _busy = false;

  MatchStatus? _status;
  ScoringSession? _session;
  LiveScoreSnapshot? _snap;

  String? _strikerId;
  String? _nonStrikerId;
  String? _bowlerId;

  String _battingTeamKey = 'teamA';
  int _lastOvers = 0;

  // In-flight ball queue. Score taps enqueue here and a single worker drains
  // it serially against the backend. Lets the score grid stay responsive on
  // a live backend — the scorer never has to wait for one ball's round-trip
  // before tapping the next.
  final List<_BallTask> _ballQueue = [];
  bool _ballWorkerRunning = false;
  int _pendingBalls = 0;

  // Bottom nav: scoring | members | history
  String _activeTab = 'scoring';

  // Match controls dropdown
  bool _showMatchActions = false;

  // Wagon-wheel toggle — when on, scoring buttons route through the wagon
  // wheel picker so the position/distance of each shot is recorded.
  bool _wagonEnabled = true;

  // Overlay state: animated event banner (FOUR/SIX/WICKET/FIFTY/CENTURY) and
  // slide-in live cards (end of over / milestone). Cleared after they finish.
  EventKind? _pendingEvent;
  LiveCardData? _pendingCard;

  // Whether the scorer wants the OBS / YouTube broadcast section in Settings.
  // Default OFF — most matches aren't streamed, so the panel stays clean.
  bool _streamingEnabled = false;

  // ── Scoring lock ────────────────────────────────────────────────────────────
  // Prevents two scorers from updating the same match in parallel. Acquired on
  // first connect; the screen renders in read-only mode (`AbsorbPointer`) until
  // the server confirms the lock.
  ScoringSocketService? _socket;
  StreamSubscription<void>? _lockGrantedSub;
  StreamSubscription<void>? _lockDeniedSub;
  StreamSubscription<LiveScoreSnapshot>? _scoreSub;
  // Set to a fresh Completer right before a ball PUT goes out. The socket
  // listener completes it when the post-write snapshot arrives, so
  // _sendBallTask can await the new snapshot without polling. Cleared back
  // to null once consumed (or timed out).
  Completer<LiveScoreSnapshot>? _ballAckCompleter;
  bool _hasLock = false;
  // True once the server has answered the first acquire (grant OR deny). Used
  // to distinguish "still waiting" from "explicitly denied" in the banner.
  bool _lockResolved = false;

  String get _scoringId => _session?.id ?? '';

  /// Overs-per-innings for this match. Resolution order:
  ///   1. Live session raw (most accurate — the engine reflects house-rules
  ///      overrides if applied).
  ///   2. Hosted-game data from `/scoring/status` (populated even before the
  ///      session is started).
  ///   3. Wizard-time preset passed via the route (avoids a "T20 / 20"
  ///      flash on the pre-match view before the status load returns).
  ///   4. 20-over fallback.
  int get _maxOvers {
    final raw = _session?.raw;
    if (raw != null) {
      // For CUSTOM matches the backend often leaves `oversPerInnings` at the
      // default 20 while the host's choice lives in `customOversPerDay`.
      // Mirror the model-side fix: when format=CUSTOM, prefer the custom key.
      final fmt = (raw['format']?.toString() ?? '').toUpperCase();
      final keys = fmt == 'CUSTOM'
          ? const ['customOversPerDay', 'oversPerInnings', 'maxOvers']
          : const ['oversPerInnings', 'maxOvers', 'customOversPerDay'];
      for (final key in keys) {
        final v = raw[key];
        if (v is num) return v.toInt();
        if (v is String) {
          final parsed = int.tryParse(v);
          if (parsed != null) return parsed;
        }
      }
    }
    final statusOvers = _status?.hostedGameOvers;
    if (statusOvers != null) return statusOvers;
    if (widget.presetOvers != null) return widget.presetOvers!;
    return 20;
  }

  /// Backend format string ("T20" / "ODI" / "THE_HUNDRED" / "CUSTOM" / ...).
  /// Used by the pre-match card so the "FORMAT" stat shows the real format
  /// instead of always saying "T20 MATCH". Same resolution order as
  /// [_maxOvers]; the final fallback derives from `_maxOvers`.
  String get _format {
    final sessionFormat = _session?.raw['format']?.toString();
    final statusFormat = _status?.hostedGameFormat;
    final preset = widget.presetFormat;
    final raw = (sessionFormat != null && sessionFormat.isNotEmpty)
        ? sessionFormat
        : (statusFormat != null && statusFormat.isNotEmpty)
            ? statusFormat
            : (preset != null && preset.isNotEmpty)
                ? preset
                : null;
    if (raw != null) {
      // Pretty-print the few formats whose names differ from the backend
      // enum; everything else is already display-ready.
      switch (raw) {
        case 'THE_HUNDRED':
          return 'THE HUNDRED';
        case '5_DAY':
          return '5-DAY TEST';
        case '90_OVERS':
          return '90 OVERS';
        case '1_WEEK':
          return 'ONE WEEK';
        case 'CUSTOM':
          return 'CUSTOM';
        default:
          return raw;
      }
    }
    // Derive a sensible default from the overs when no format string is
    // available anywhere.
    return _maxOvers == 10
        ? 'T10'
        : _maxOvers == 20
            ? 'T20'
            : _maxOvers == 50
                ? 'ODI'
                : 'CUSTOM';
  }

  bool get _isCricket => widget.sport.toLowerCase() == 'cricket';

  /// Players-per-side for this match. Drives the all-out detection so the
  /// 1st-innings summary fires the instant the last wicket falls. Reads the
  /// session payload first; falls back to roster size, then a sane 11.
  int get _maxMembers {
    final raw = _session?.raw;
    if (raw != null) {
      final v = raw['maxMembers'] ?? raw['playersPerSide'];
      if (v is num) return v.toInt();
      if (v is String) {
        final parsed = int.tryParse(v);
        if (parsed != null) return parsed;
      }
    }
    final a = _status?.teamAPlayers.length ?? 0;
    final b = _status?.teamBPlayers.length ?? 0;
    if (a > 0) return a;
    if (b > 0) return b;
    return 11;
  }

  List<RosterPlayer> get _battingRoster => _battingTeamKey == 'teamA'
      ? (_status?.teamAPlayers ?? const [])
      : (_status?.teamBPlayers ?? const []);
  List<RosterPlayer> get _bowlingRoster => _battingTeamKey == 'teamA'
      ? (_status?.teamBPlayers ?? const [])
      : (_status?.teamAPlayers ?? const []);

  @override
  void initState() {
    super.initState();
    _bootstrap();
    _initLockSocket();
  }

  @override
  void dispose() {
    _lockGrantedSub?.cancel();
    _lockDeniedSub?.cancel();
    _scoreSub?.cancel();
    _socket?.leaveCurrentMatch();
    super.dispose();
  }

  /// Connects to the scoring socket and requests exclusive scoring rights.
  /// Listening to both grant + deny streams keeps `_hasLock` in sync as the
  /// server moves the lock between clients (e.g. one scorer closes the screen
  /// and another waiting client gets `lock_released` → auto re-acquire →
  /// `lock_granted` lands here).
  void _initLockSocket() {
    if (!_isCricket) return;
    final s = ScoringSocketService();
    _socket = s;
    s.connect(widget.matchId);
    _lockGrantedSub = s.lockGrantedStream.listen((_) {
      if (!mounted) return;
      setState(() {
        _hasLock = true;
        _lockResolved = true;
      });
    });
    _lockDeniedSub = s.lockDeniedStream.listen((_) {
      if (!mounted) return;
      setState(() {
        _hasLock = false;
        _lockResolved = true;
      });
    });
    // Backend now returns a lite ack from /scoring/update and pushes the
    // full snapshot over the socket after the async snapshot/Redis work
    // finishes. When a ball is in flight (_ballAckCompleter set), feed the
    // snapshot back to the awaiting _sendBallTask; otherwise apply it
    // directly like a spectator would.
    _scoreSub = s.scoreStream.listen((snap) {
      if (!mounted) return;
      final c = _ballAckCompleter;
      if (c != null && !c.isCompleted) {
        c.complete(snap);
      } else {
        setState(() => _snap = snap);
      }
    });
    s.acquireLock();
  }

  /// Awaits the post-write snapshot that the backend pushes over the socket
  /// after acking a ball. Falls back to a one-shot HTTP fetch if the socket
  /// push is late (or arrives out of order). Always clears the completer so
  /// stale listeners can't fire into the next ball.
  Future<LiveScoreSnapshot?> _awaitSnapshotAfterAck() async {
    final c = _ballAckCompleter;
    if (c == null) return null;
    try {
      return await c.future.timeout(const Duration(seconds: 3));
    } on TimeoutException {
      final fresh = await _service.getLiveScore(widget.matchId);
      return fresh.ok ? fresh.data : null;
    } finally {
      _ballAckCompleter = null;
    }
  }

  Future<void> _bootstrap() async {
    if (!_isCricket) {
      setState(() => _phase = _Phase.unsupported);
      return;
    }
    setState(() {
      _phase = _Phase.loading;
      _error = null;
    });
    final res = await _service.getMatchStatus(widget.matchId);
    if (!mounted) return;
    if (!res.ok || res.data == null) {
      setState(() {
        _phase = _Phase.error;
        _error = res.error ?? 'Could not load match';
      });
      return;
    }
    final status = res.data!;
    _status = status;
    _session = status.session;
    _snap = status.snapshot;

    if (status.session == null) {
      // If the caller pre-set the toss in StartScoringModal step 5, skip the
      // pre-match toss flow and auto-start the session with that result. The
      // batting team derives from the winner+decision: winner→BAT bats first;
      // winner→BOWL means the other team bats.
      final tw = widget.presetTossWinner;
      final td = widget.presetTossDecision;
      if (tw != null && td != null && tw.isNotEmpty) {
        final batting =
            (td == 'BAT') ? tw : (tw == 'teamA' ? 'teamB' : 'teamA');
        await _startMatch(
            battingKey: batting, tossWinner: tw, tossDecision: td);
        return;
      }
      setState(() => _phase = _Phase.needsMatchStart);
      return;
    }

    _battingTeamKey =
        (_session!.currentInningsIndex % 2 == 0) ? 'teamA' : 'teamB';
    _syncFromSnapshot();
    if (_session!.status.toUpperCase() == 'COMPLETED' ||
        (_snap?.isComplete ?? false)) {
      setState(() => _phase = _Phase.complete);
    } else if (!_session!.hasOpeningPlayers &&
        (_strikerId == null || _bowlerId == null)) {
      setState(() => _phase = _Phase.needsInningsSetup);
    } else {
      setState(() => _phase = _Phase.scoring);
    }
  }

  /// Inspects the new snapshot vs. the previous state and queues the right
  /// banner/card overlays (FOUR/SIX/WICKET, fifty/century milestones, and the
  /// end-of-over card).
  void _triggerOverlays({
    required bool isWicket,
    required int runs,
    required int prevOvers,
    required int prevStrikerRuns,
  }) {
    final s = _snap;
    if (s == null) return;

    if (isWicket) {
      setState(() => _pendingEvent = EventKind.wicket);
      return;
    }

    final striker = s.batters.isNotEmpty ? s.batters.first : null;
    if (striker != null) {
      if (striker.runs >= 100 && prevStrikerRuns < 100) {
        setState(() {
          _pendingEvent = EventKind.hundred;
          _pendingCard = LiveCardData(
            kind: LiveCardKind.milestone,
            batterName: striker.name,
            batterRuns: striker.runs,
            batterBalls: striker.balls,
            batterFours: striker.fours,
            batterSixes: striker.sixes,
            strikeRate: striker.strikeRate.toStringAsFixed(2),
          );
        });
        return;
      }
      if (striker.runs >= 50 && prevStrikerRuns < 50) {
        setState(() {
          _pendingEvent = EventKind.fifty;
          _pendingCard = LiveCardData(
            kind: LiveCardKind.milestone,
            batterName: striker.name,
            batterRuns: striker.runs,
            batterBalls: striker.balls,
            batterFours: striker.fours,
            batterSixes: striker.sixes,
            strikeRate: striker.strikeRate.toStringAsFixed(2),
          );
        });
        return;
      }
    }

    if (runs == 6) {
      setState(() => _pendingEvent = EventKind.six);
    } else if (runs == 4) {
      setState(() => _pendingEvent = EventKind.four);
    }

    if (s.overs > prevOvers && s.balls == 0) {
      setState(() {
        _pendingCard = LiveCardData(
          kind: LiveCardKind.endOfOver,
          overs: s.overs,
          totalRuns: s.runs,
          totalWickets: s.wickets,
          crr: s.crr,
          bowlerName: s.bowler?.name,
          bowlerWickets: s.bowler?.wickets ?? 0,
          bowlerRuns: s.bowler?.runs ?? 0,
          last6Balls: s.last6Balls
              .map((b) => (label: b.label, type: b.type, freeHit: b.freeHit))
              .toList(),
        );
      });
    }
  }

  void _syncFromSnapshot() {
    final s = _snap;
    if (s == null) return;
    if (s.batters.isNotEmpty) _strikerId = s.batters[0].id;
    if (s.batters.length > 1) _nonStrikerId = s.batters[1].id;
    if (s.bowler != null) _bowlerId = s.bowler!.id;
    _lastOvers = s.overs;
  }

  void _toast(String msg, {bool error = false}) {
    if (!mounted) return;
    if (error) {
      BmsToast.error(context, msg);
    } else {
      BmsToast.success(context, msg);
    }
  }

  // ── Setup / Toss ───────────────────────────────────────────────────────────

  Future<void> _openTossModal() async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => TossModal(
          teamAName: widget.teamA,
          teamBName: widget.teamB,
          hasPassword: false,
          onConfirm: (result) async {
            Navigator.of(context).pop();
            if (result.winnerKey == null || result.decision == null) {
              // User skipped toss — start match with default batting side.
              return _startMatch(
                  battingKey: 'teamA', tossWinner: null, tossDecision: null);
            }
            final winnerBats = result.decision == 'BAT';
            final battingKey = (result.winnerKey == 'teamA')
                ? (winnerBats ? 'teamA' : 'teamB')
                : (winnerBats ? 'teamB' : 'teamA');
            return _startMatch(
                battingKey: battingKey,
                tossWinner: result.winnerKey,
                tossDecision: result.decision);
          },
        ),
      ),
    );
  }

  Future<void> _startMatch({
    required String battingKey,
    String? tossWinner,
    String? tossDecision,
  }) async {
    _battingTeamKey = battingKey;
    setState(() => _busy = true);
    final res = await _service.startScoring(
      matchId: widget.matchId,
      battingTeam: battingKey,
      tossWinner: tossWinner,
      tossDecision: tossDecision,
    );
    if (!mounted) return;
    setState(() => _busy = false);
    if (!res.ok || res.data == null) {
      _toast(res.error ?? 'Could not start match', error: true);
      return;
    }
    _session = res.data;
    setState(() => _phase = _Phase.needsInningsSetup);
  }

  // ── Innings setup ──────────────────────────────────────────────────────────

  Future<void> _openInningsSetup() async {
    final battingTeamName =
        _battingTeamKey == 'teamA' ? widget.teamA : widget.teamB;
    final bowlingTeamName =
        _battingTeamKey == 'teamA' ? widget.teamB : widget.teamA;
    await Navigator.of(context).push(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => InningsSetupModal(
          battingTeam: _battingRoster,
          bowlingTeam: _bowlingRoster,
          battingTeamName: battingTeamName,
          bowlingTeamName: bowlingTeamName,
          inningsLabel: (_session?.currentInningsIndex ?? 0) == 0
              ? '1st Innings'
              : '2nd Innings',
          onClose: () => Navigator.of(context).pop(),
          onConfirm: (result) async {
            Navigator.of(context).pop();
            setState(() => _busy = true);
            final res = await _service.setPlayers(
              scoringId: _scoringId,
              strikerId: result.strikerId,
              nonStrikerId: result.nonStrikerId,
              bowlerId: result.bowlerId,
              wicketKeeperId: result.wicketKeeperId,
            );
            if (!mounted) return;
            setState(() => _busy = false);
            if (!res.ok) {
              _toast(res.error ?? 'Could not set players', error: true);
              return;
            }
            _strikerId = result.strikerId;
            _nonStrikerId = result.nonStrikerId;
            _bowlerId = result.bowlerId;
            _session = res.data ?? _session;
            setState(() => _phase = _Phase.scoring);
            // Backend starts the match clock PAUSED after /scoring/start
            // until the scorer toggles the timer — without this, the first
            // ball returns "Match is paused, resume timer to score". The
            // toggle endpoint is fire-and-forget; if the timer was somehow
            // already running, the in-line retry below catches it later.
            await _resumeMatchClock();
          },
        ),
      ),
    );
  }

  /// Tracks the local guess at timer state — flips every time we call
  /// `/scoring/toggle-timer`. Used only by the score-header chip so the
  /// label/icon roughly reflects what the umpire just chose. The backend
  /// remains the source of truth — the retry path in [_recordBall] still
  /// fires on a "paused" error regardless of this flag.
  bool _timerPaused = true;

  /// Frozen 1st-innings snapshot — captured the moment the innings ends so
  /// the match-complete view can show both innings side-by-side instead of
  /// only the chase. Cleared on bootstrap; only set when [_showInningsSummary]
  /// runs for innings 1.
  LiveScoreSnapshot? _firstInningsSnap;

  /// Batting team name during innings 1, kept alongside [_firstInningsSnap]
  /// so the complete view can label the row correctly even after
  /// [_battingTeamKey] flips for the chase.
  String? _firstInningsBattingName;

  /// Badges returned by `/scoring/complete`. Folded into the match summary
  /// view instead of popping as a separate sheet.
  List<Map<String, dynamic>> _earnedBadges = const [];

  /// Resume the match clock after innings setup so the scoring keypad
  /// doesn't bounce on the first ball with "match paused". Tries the timer
  /// toggle first; if the backend doesn't expose that endpoint, falls back
  /// to the broader status flip (LIVE) and finally /go-live. The first one
  /// that succeeds wins; the actual backend error is surfaced if all fail.
  Future<void> _resumeMatchClock() async {
    if (!_timerPaused) return;
    String? lastError;
    final t = await _service.toggleTimer(
        matchId: widget.matchId, scoringId: _scoringId);
    if (!mounted) return;
    if (t.ok) {
      setState(() => _timerPaused = false);
      return;
    }
    lastError = t.error;
    final s =
        await _service.setMatchStatus(scoringId: _scoringId, status: 'LIVE');
    if (!mounted) return;
    if (s.ok) {
      setState(() {
        _timerPaused = false;
        _session = s.data ?? _session;
      });
      return;
    }
    lastError = s.error ?? lastError;
    final g = await _service.goLive(widget.matchId);
    if (!mounted) return;
    if (g.ok) {
      setState(() => _timerPaused = false);
      return;
    }
    lastError = g.error ?? lastError;
    _toast(
      lastError ?? 'Could not resume match — open the timer chip and tap it',
      error: true,
    );
  }

  /// Toggle handler for the pause/play chip in the score header. Round-trips
  /// `/scoring/toggle-timer`, which flips between PAUSED and RUNNING on the
  /// backend. The chip's visible state derives from [_timerPaused], not the
  /// session status (which tracks match-level events like rain delays, not
  /// the umpire's clock).
  Future<void> _togglePauseLive() async {
    HapticFeedback.selectionClick();
    final wasPaused = _timerPaused;
    final res = await _service.toggleTimer(
        matchId: widget.matchId, scoringId: _scoringId);
    if (!mounted) return;
    if (res.ok) {
      setState(() => _timerPaused = !wasPaused);
      _toast(wasPaused ? 'Timer resumed' : 'Timer paused');
    } else {
      _toast(res.error ?? 'Could not toggle the timer', error: true);
    }
  }

  // ── Ball recording ─────────────────────────────────────────────────────────

  /// Entry point from the scoring grid. When wagon wheel is enabled and the
  /// shot earned 1+ runs (and isn't a wicket/extra), prompt for shot direction
  /// before submitting the ball.
  Future<void> _scoreRun(int runs) async {
    if (_wagonEnabled && runs >= 1) {
      final captured = await _captureWagonWheel(runs);
      if (captured == false) return; // user dismissed
    }
    await _recordBall(runs: runs);
  }

  /// Returns `true` when the wagon wheel was completed (skipping counts as
  /// completed), `false` when the user backed out without a decision.
  Future<bool> _captureWagonWheel(int runs) async {
    bool completed = false;
    await Navigator.of(context).push(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => VisualWagonWheelModal(
          runs: runs,
          isBoundary: runs == 4 || runs == 6,
          onClose: () => Navigator.of(context).pop(),
          onConfirm: (_) {
            completed = true;
            Navigator.of(context).pop();
          },
        ),
      ),
    );
    return completed;
  }

  /// Score-grid entry point. Validates, gives the scorer instant haptic +
  /// score-grid responsiveness, and enqueues the ball for the worker to
  /// drain serially against the backend. Returns the moment the tap is
  /// enqueued, so the next tap can land immediately.
  Future<void> _recordBall({
    required int runs,
    bool isExtra = false,
    String? extraType,
    bool isWicket = false,
    String? wicketType,
    String? nextBatterId,
  }) async {
    // Setup / finalize / undo flows still gate the score grid via _busy.
    if (_busy) return;
    final striker = _strikerId;
    final bowler = _bowlerId;
    if (striker == null || bowler == null) {
      _toast('Select batsman and bowler first', error: true);
      setState(() => _phase = _Phase.needsInningsSetup);
      return;
    }
    HapticFeedback.lightImpact();
    setState(() {
      _ballQueue.add(_BallTask(
        runs: runs,
        isExtra: isExtra,
        extraType: extraType,
        isWicket: isWicket,
        wicketType: wicketType,
        nextBatterId: nextBatterId,
        strikerId: striker,
        bowlerId: bowler,
      ));
      _pendingBalls = _ballQueue.length;
    });
    unawaited(_drainBallQueue());
  }

  Future<void> _drainBallQueue() async {
    if (_ballWorkerRunning) return;
    _ballWorkerRunning = true;
    try {
      while (_ballQueue.isNotEmpty && mounted) {
        final task = _ballQueue.removeAt(0);
        final ok = await _sendBallTask(task);
        if (!mounted) break;
        setState(() => _pendingBalls = _ballQueue.length);
        if (!ok) {
          // Server diverged from the queued sequence. Drop the rest and pull
          // a fresh snapshot so the scorer sees server truth before retrying.
          // The toast inside _sendBallTask already explains why the ball
          // failed.
          _ballQueue.clear();
          if (mounted) setState(() => _pendingBalls = 0);
          final fresh = await _service.getLiveScore(widget.matchId);
          if (mounted && fresh.ok && fresh.data != null) {
            setState(() => _snap = fresh.data);
            _syncFromSnapshot();
          }
          break;
        }
      }
    } finally {
      _ballWorkerRunning = false;
    }
  }

  Future<bool> _sendBallTask(_BallTask task) async {
    // Arm the socket completer BEFORE the HTTP call so we don't miss a fast
    // push from the backend's setImmediate work.
    _ballAckCompleter = Completer<LiveScoreSnapshot>();
    final res = await _service.updateScore(
      scoringId: _scoringId,
      ball: BallData(
        runs: task.runs,
        isExtra: task.isExtra,
        extraType: task.extraType,
        isWicket: task.isWicket,
        wicketType: task.wicketType,
        batsmanId: task.strikerId,
        bowlerId: task.bowlerId,
      ),
    );
    if (!mounted) {
      _ballAckCompleter = null;
      return false;
    }
    if (!res.ok) {
      _ballAckCompleter = null;
      // The backend rejects scoring while the match clock is paused with a
      // copy of "match is paused, resume timer to score". Toggle the timer
      // and retry once so the scorer doesn't have to find the chip up top.
      final rawError = (res.error ?? '').toLowerCase();
      if (res.code == 'MATCH_PAUSED' ||
          rawError.contains('paused') ||
          rawError.contains('resume timer')) {
        var resumed = await _service.toggleTimer(
            matchId: widget.matchId, scoringId: _scoringId);
        if (!mounted) return false;
        if (!resumed.ok) {
          final s = await _service.setMatchStatus(
              scoringId: _scoringId, status: 'LIVE');
          if (!mounted) return false;
          if (s.ok) {
            resumed = const ScoringResult.success(null);
            _session = s.data ?? _session;
          } else {
            final g = await _service.goLive(widget.matchId);
            if (!mounted) return false;
            if (g.ok) resumed = const ScoringResult.success(null);
          }
        }
        if (resumed.ok) {
          setState(() => _timerPaused = false);
          _ballAckCompleter = Completer<LiveScoreSnapshot>();
          final retry = await _service.updateScore(
            scoringId: _scoringId,
            ball: BallData(
              runs: task.runs,
              isExtra: task.isExtra,
              extraType: task.extraType,
              isWicket: task.isWicket,
              wicketType: task.wicketType,
              batsmanId: task.strikerId,
              bowlerId: task.bowlerId,
            ),
          );
          if (!mounted) {
            _ballAckCompleter = null;
            return false;
          }
          if (!retry.ok) {
            _ballAckCompleter = null;
          }
          final retrySnap =
              retry.ok ? (retry.data ?? await _awaitSnapshotAfterAck()) : null;
          if (!mounted) return false;
          if (retry.ok && retrySnap != null) {
            _toast('Match resumed');
            final prevOvers = _lastOvers;
            final prevStrikerRuns = _snap?.batters.isNotEmpty == true
                ? _snap!.batters.first.runs
                : 0;
            setState(() => _snap = retrySnap);
            _syncFromSnapshot();
            _triggerOverlays(
              isWicket: task.isWicket,
              runs: task.runs,
              prevOvers: prevOvers,
              prevStrikerRuns: prevStrikerRuns,
            );
            final inFirstInningsR = (_snap?.currentInningsIndex ??
                    _session?.currentInningsIndex ??
                    0) ==
                0;
            final oversDoneR = _snap!.overs >= _maxOvers;
            final allOutR = _snap!.wickets >= (_maxMembers - 1);
            final localInningsEndR = inFirstInningsR && (oversDoneR || allOutR);
            if (_snap!.isMatchComplete || _snap!.isComplete) {
              await _finishMatch();
            } else if (_snap!.isInningsComplete || localInningsEndR) {
              await _showInningsSummary();
              await _startSecondInnings();
            } else if (task.isWicket) {
              await _assignNewBatsman(task.nextBatterId);
            }
            if (_snap!.overs > prevOvers) {
              await _promptNewBowler();
            }
            return true;
          }
        }
      }
      // Branch on the stable backend code first (doc §10) so the toast is
      // helpful rather than the raw server message.
      final friendly = switch (res.code) {
        'FREE_HIT_INVALID_DISMISSAL' =>
          'Free hit — only RUN_OUT is allowed for this ball.',
        'PENALTY_DISABLED' => 'Penalty runs are turned off in House Rules.',
        'SAME_BOWLER_CONSECUTIVE_OVERS' =>
          'Same bowler cannot bowl two overs in a row.',
        'MATCH_ALREADY_COMPLETE' =>
          'Match already complete — no further balls accepted.',
        _ => res.error ?? 'Ball not recorded',
      };
      _toast(friendly, error: true);
      return false;
    }

    final prevOvers = _lastOvers;
    final prevStrikerRuns =
        _snap?.batters.isNotEmpty == true ? _snap!.batters.first.runs : 0;
    // res.data is the legacy inline payload; with the new lite ack the
    // backend returns null inline data and we wait for the socket push
    // (with a 3s HTTP fallback).
    final snap = res.data ?? await _awaitSnapshotAfterAck();
    if (!mounted) return false;
    if (snap == null) {
      _toast('Ball recorded but snapshot delayed', error: true);
      return false;
    }
    setState(() => _snap = snap);
    _syncFromSnapshot();
    _triggerOverlays(
      isWicket: task.isWicket,
      runs: task.runs,
      prevOvers: prevOvers,
      prevStrikerRuns: prevStrikerRuns,
    );

    if (_snap!.isMatchComplete || _snap!.isComplete) {
      await _finishMatch();
      return true;
    }
    // Client-side detection — the backend should set isInningsComplete on
    // the last ball / last wicket, but if it doesn't (race condition, stale
    // flag, edge case), we still fire the summary the moment the local
    // snapshot crosses the end-of-innings threshold. Only does this in the
    // 1st innings; the 2nd innings closes via /complete on the run path.
    final inFirstInnings =
        (_snap?.currentInningsIndex ?? _session?.currentInningsIndex ?? 0) == 0;
    final oversDone = _snap!.overs >= _maxOvers;
    final allOut = _snap!.wickets >= (_maxMembers - 1);
    final localInningsEnd = inFirstInnings && (oversDone || allOut);
    if (_snap!.isInningsComplete || localInningsEnd) {
      await _showInningsSummary();
      await _startSecondInnings();
      return true;
    }
    if (task.isWicket) {
      await _assignNewBatsman(task.nextBatterId);
    }
    if (_snap!.overs > prevOvers) {
      await _promptNewBowler();
    }
    return true;
  }

  /// If the scorer already picked the next batter inside the wicket modal,
  /// just set them as the striker. Otherwise fall back to the dedicated
  /// picker so the user isn't left without a striker.
  Future<void> _assignNewBatsman(String? preselectedId) async {
    if (preselectedId == null || preselectedId.isEmpty) {
      await _promptNewBatsman();
      return;
    }
    setState(() => _busy = true);
    final res = await _service.setPlayers(
      scoringId: _scoringId,
      strikerId: preselectedId,
    );
    if (!mounted) return;
    setState(() => _busy = false);
    if (res.ok) {
      _strikerId = preselectedId;
    } else {
      _toast(res.error ?? 'Could not set batsman', error: true);
      await _promptNewBatsman();
    }
  }

  /// Manual entry point for starting the 2nd innings — wired to the
  /// `2ND INN` button in Match Controls. The auto-trigger above only fires
  /// when the backend sets `isInningsComplete=true` on the snapshot; if it
  /// doesn't (or the scorer wants to declare an early end), this lets them
  /// move to the 2nd innings explicitly after a confirm.
  Future<void> _confirmStartNextInnings() async {
    if (_session?.currentInningsIndex != null &&
        _session!.currentInningsIndex > 0) {
      _toast('Already in the 2nd innings', error: true);
      return;
    }
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: _bgPanel,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: const Text('Start 2nd Innings?',
            style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 18)),
        content: const Text(
          'Move to the 2nd innings now? Use this when the side is all out or '
          'the overs are up. This cannot be undone.',
          style: TextStyle(color: Colors.white70, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child:
                const Text('Cancel', style: TextStyle(color: Colors.white54)),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Start 2nd Innings',
                style: TextStyle(color: _theme, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await _showInningsSummary();
      await _startSecondInnings();
    }
  }

  /// Renders the 1st-innings summary modal (runs/wickets/overs/CRR/extras,
  /// powerplay block when populated, top scorers, target for the chase).
  /// Awaited so the caller pauses until the user taps Continue. Also
  /// caches the frozen snapshot so the match-complete view can show both
  /// innings stacked.
  Future<void> _showInningsSummary() async {
    final snap = _snap;
    if (snap == null) return;
    final battingName =
        _battingTeamKey == 'teamA' ? widget.teamA : widget.teamB;
    final chasingName =
        _battingTeamKey == 'teamA' ? widget.teamB : widget.teamA;
    _firstInningsSnap = snap;
    _firstInningsBattingName = battingName;
    await InningsSummaryModal.show(
      context: context,
      battingTeamName: battingName,
      chasingTeamName: chasingName,
      snapshot: snap,
      maxOvers: _maxOvers,
      inningsNumber: 1,
    );
  }

  Future<void> _startSecondInnings() async {
    final nextBattingKey = _battingTeamKey == 'teamA' ? 'teamB' : 'teamA';
    // /scoring/next-innings rejects the bare 'teamA'/'teamB' alias with
    // "innings 1 batting team must differ from innings 0" because the
    // backend compares against the stored Mongo team _id. Prefer the real id
    // from /scoring/status; only fall back to the alias if it isn't loaded.
    final nextBattingId =
        (nextBattingKey == 'teamA' ? _status?.teamAId : _status?.teamBId) ??
            nextBattingKey;
    setState(() => _busy = true);
    final res = await _service.startNextInnings(
      scoringId: _scoringId,
      battingTeamId: nextBattingId,
    );
    if (!mounted) return;
    if (!res.ok) {
      setState(() => _busy = false);
      // Doc §4 — branch on stable code so toasts make sense to the umpire.
      final friendly = switch (res.code) {
        'INNINGS_NOT_COMPLETE' => 'Current innings is not complete yet.',
        'INNINGS_ALREADY_ADVANCED' => 'Already in the 2nd innings.',
        'NO_FIRST_INNINGS' => 'No first innings on record — restart the match.',
        'SAME_BATTING_TEAM' => 'Pick the other team to bat in the 2nd innings.',
        'MATCH_ALREADY_COMPLETE' =>
          'Match already finalised — no more innings.',
        _ => res.error ?? 'Could not start 2nd innings',
      };
      _toast(friendly, error: true);
      return;
    }
    final live = await _service.getLiveScore(widget.matchId);
    if (!mounted) return;
    _toast('Innings break — 2nd innings');
    setState(() {
      _busy = false;
      _session = res.data ?? _session;
      _battingTeamKey = nextBattingKey;
      _strikerId = null;
      _nonStrikerId = null;
      _bowlerId = null;
      _lastOvers = 0;
      _snap = live.ok ? live.data : null;
      _phase = _Phase.needsInningsSetup;
    });
  }

  Future<void> _finishMatch() async {
    setState(() => _busy = true);
    final res = await _service.completeMatch(_scoringId);
    if (!mounted) return;
    if (!res.ok) {
      setState(() => _busy = false);
      // /complete returns a stable code on failure (doc §5). Branch
      // before falling back to the raw message.
      final friendly = switch (res.code) {
        'MATCH_ALREADY_COMPLETE' => 'Match already finalised.',
        _ => res.error ?? 'Could not finalise match',
      };
      _toast(friendly, error: true);
      return;
    }
    final live = await _service.getLiveScore(widget.matchId);
    if (!mounted) return;
    setState(() {
      _busy = false;
      if (live.ok) _snap = live.data;
      _phase = _Phase.complete;
      // Fold badges into the complete view instead of popping a sheet — the
      // match-summary screen renders them as the last block.
      _earnedBadges = res.data?.earnedBadges ?? const [];
    });
  }

  Future<void> _promptNewBatsman() async {
    final outIds = {_strikerId, _nonStrikerId};
    final available =
        _battingRoster.where((p) => !outIds.contains(p.id)).toList();
    final picked = await showModalBottomSheet<RosterPlayer>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _PlayerPickSheet(
        title: 'New batsman',
        players: available.isEmpty ? _battingRoster : available,
      ),
    );
    if (picked == null) return;
    setState(() => _busy = true);
    final res = await _service.setPlayers(
      scoringId: _scoringId,
      strikerId: picked.id,
    );
    if (!mounted) return;
    setState(() => _busy = false);
    if (res.ok) {
      _strikerId = picked.id;
    } else {
      _toast(res.error ?? 'Could not set batsman', error: true);
    }
  }

  Future<void> _promptNewBowler() async {
    final pickedId = await Navigator.of(context).push<String>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => SelectBowlerModal(
          pool: _bowlingRoster,
          currentBowlerId: _bowlerId,
          onClose: () => Navigator.of(context).pop(),
          onConfirm: (id) => Navigator.of(context).pop(id),
        ),
      ),
    );
    if (pickedId == null) return;
    setState(() => _busy = true);
    final res = await _service.setPlayers(
      scoringId: _scoringId,
      bowlerId: pickedId,
    );
    if (!mounted) return;
    setState(() => _busy = false);
    if (res.ok) {
      _bowlerId = pickedId;
    } else {
      _toast(res.error ?? 'Could not set bowler', error: true);
    }
  }

  Future<void> _undo() async {
    if (_busy) return;
    setState(() => _busy = true);
    final res = await _service.undoLastBall(_scoringId);
    if (!mounted) return;
    setState(() => _busy = false);
    if (!res.ok) {
      _toast(res.error ?? 'Undo failed', error: true);
      return;
    }
    _toast('Last ball undone');
    final live = await _service.getLiveScore(widget.matchId);
    if (mounted && live.ok) {
      setState(() => _snap = live.data);
      _syncFromSnapshot();
    }
  }

  Future<void> _openWicket() async {
    final activeBatters = <RosterPlayer>[
      ..._battingRoster.where((p) => p.id == _strikerId),
      ..._battingRoster.where((p) => p.id == _nonStrikerId),
    ];
    final remaining = _battingRoster
        .where((p) => p.id != _strikerId && p.id != _nonStrikerId)
        .toList();
    await Navigator.of(context).push(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => WicketModal(
          fieldingTeam: _bowlingRoster,
          battingTeam: remaining,
          activeBatters: activeBatters,
          freeHitActive: _snap?.freeHitActive ?? false,
          onClose: () => Navigator.of(context).pop(),
          onConfirm: (result) async {
            Navigator.of(context).pop();
            await _recordBall(
              runs: result.runs,
              isWicket: true,
              wicketType: result.wicketType,
              nextBatterId: result.nextBatterId,
            );
          },
        ),
      ),
    );
  }

  Future<void> _openExtras(String type) async {
    final runs = await Navigator.of(context).push<int>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => ExtraRunsModal(
          extraType: type,
          onClose: () => Navigator.of(context).pop(),
          onConfirm: (r) => Navigator.of(context).pop(r),
        ),
      ),
    );
    if (runs == null) return;
    final total = (type == 'WIDE' || type == 'NO_BALL') ? runs + 1 : runs;
    await _recordBall(runs: total, isExtra: true, extraType: type);
  }

  Future<void> _openCustomRuns() async {
    final runs = await showModalBottomSheet<int>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => const _CustomRunsSheet(),
    );
    if (runs == null) return;
    await _recordBall(runs: runs);
  }

  Future<void> _confirmEndMatch() async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => EndMatchModal(
          hasPassword: false,
          onClose: () => Navigator.of(context).pop(),
          onConfirm: (_) async {
            Navigator.of(context).pop();
            await _finishMatch();
          },
        ),
      ),
    );
  }

  Future<void> _openPenaltyModal() async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => PenaltyModal(
          teamAName: widget.teamA,
          teamBName: widget.teamB,
          onClose: () => Navigator.of(context).pop(),
          onConfirm: (result) async {
            Navigator.of(context).pop();
            setState(() => _busy = true);
            final ok = await _service.awardPenalty(
              matchId: widget.matchId,
              team: result.teamKey,
              runs: result.runs,
            );
            if (!mounted) return;
            setState(() => _busy = false);
            _toast(ok ? 'Penalty awarded' : 'Failed to award penalty',
                error: !ok);
          },
        ),
      ),
    );
  }

  Future<void> _openMatchExit() async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => MatchExitModal(
          onClose: () => Navigator.of(context).pop(),
          onConfirm: (_) {
            Navigator.of(context).pop();
            if (mounted) context.pop();
          },
        ),
      ),
    );
  }

  // ── Score derivations (mirror web's `score` computation) ───────────────────

  ({int runs, int wickets, int overs, int balls, String crr}) get _score {
    final s = _snap;
    if (s == null)
      return (runs: 0, wickets: 0, overs: 0, balls: 0, crr: '0.00');
    final totalBalls = s.overs * 6 + s.balls;
    final crr =
        totalBalls > 0 ? (s.runs / totalBalls * 6).toStringAsFixed(2) : '0.00';
    return (
      runs: s.runs,
      wickets: s.wickets,
      overs: s.overs,
      balls: s.balls,
      crr: crr
    );
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    // Phases that don't represent live scoring work (loading / error /
    // unsupported / complete) don't need the lock — only the active scoring
    // phases mutate match state. This keeps the read-only / post-match views
    // fully interactive for everyone.
    final phaseNeedsLock = _phase == _Phase.scoring ||
        _phase == _Phase.needsInningsSetup ||
        _phase == _Phase.needsMatchStart;
    final lockedOut = phaseNeedsLock && _lockResolved && !_hasLock;

    return Scaffold(
      backgroundColor: _bgDark,
      body: SafeArea(
        top: false,
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 450),
            child: Stack(
              children: [
                Container(
                  color: Colors.black,
                  child: AbsorbPointer(
                    absorbing: lockedOut,
                    child: Opacity(
                      opacity: lockedOut ? 0.55 : 1.0,
                      child: _buildBody(),
                    ),
                  ),
                ),
                if (lockedOut) _lockBanner(),
                if (_pendingBalls > 0) _syncingPill(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Small pill that surfaces the in-flight ball queue depth. Lets the
  /// scorer see that taps are being processed (even when the live backend
  /// round-trip is slow), without blocking the score grid.
  Widget _syncingPill() {
    return Positioned(
      top: MediaQuery.of(context).padding.top + 8,
      right: 12,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.72),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(
              width: 12,
              height: 12,
              child: CircularProgressIndicator(
                strokeWidth: 1.6,
                color: Colors.white70,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'Syncing $_pendingBalls',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.w700,
                fontFamily: 'Poppins',
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Top-aligned banner shown when another scorer holds the lock. Tappable so
  /// the user can manually retry (rare — the service auto-retries on
  /// `lock_released`, but a manual nudge helps if the socket reconnected).
  Widget _lockBanner() {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: Material(
        color: Colors.transparent,
        child: GestureDetector(
          onTap: () {
            HapticFeedback.mediumImpact();
            _socket?.acquireLock();
          },
          child: Container(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12) +
                EdgeInsets.only(top: MediaQuery.of(context).padding.top),
            decoration: BoxDecoration(
              color: _accentYellow.withValues(alpha: 0.95),
              boxShadow: const [
                BoxShadow(
                    color: Color(0x33000000),
                    blurRadius: 12,
                    offset: Offset(0, 4)),
              ],
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.lock, color: Colors.black, size: 18),
                const SizedBox(width: 10),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('ANOTHER SCORER IS CONTROLLING THIS MATCH',
                          style: TextStyle(
                              color: Colors.black,
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.4)),
                      SizedBox(height: 2),
                      Text('You are viewing in read-only mode. Tap to retry.',
                          style: TextStyle(
                              color: Colors.black87,
                              fontSize: 10,
                              fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
                const Icon(LucideIcons.refreshCw,
                    color: Colors.black, size: 14),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    switch (_phase) {
      case _Phase.loading:
        return const Center(
            child: CircularProgressIndicator(color: _theme, strokeWidth: 3));
      case _Phase.unsupported:
        return _centerMsg(
            'Live scoring currently supports Cricket only.\n\nSport: ${widget.sport}');
      case _Phase.error:
        return _errorView();
      case _Phase.needsMatchStart:
        return _preMatchView();
      case _Phase.needsInningsSetup:
      case _Phase.scoring:
        return _mainConsole();
      case _Phase.complete:
        return _completeView();
    }
  }

  Widget _centerMsg(String msg) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Text(msg,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white54, fontSize: 14)),
        ),
      );

  Widget _errorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(LucideIcons.alertCircle, color: _theme, size: 56),
            const SizedBox(height: 24),
            const Text('SYNC INTERRUPTED',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5)),
            const SizedBox(height: 8),
            Text(_error ?? '',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white54, fontSize: 13)),
            const SizedBox(height: 24),
            OutlinedButton(
              onPressed: _bootstrap,
              style: OutlinedButton.styleFrom(
                foregroundColor: _theme,
                side: BorderSide(color: _theme.withValues(alpha: 0.3)),
                backgroundColor: Colors.white.withValues(alpha: 0.05),
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text('ESTABLISH NEW LINK',
                  style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 3)),
            ),
          ],
        ),
      ),
    );
  }

  // ── Pre-match view (web's `needsMatchStart` block) ─────────────────────────

  Widget _preMatchView() {
    final teamA = widget.teamA.isEmpty ? 'TEAM A' : widget.teamA;
    final teamB = widget.teamB.isEmpty ? 'TEAM B' : widget.teamB;
    final venue =
        widget.location.isEmpty ? 'No location provided' : widget.location;

    return Container(
      color: _bgDark,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 8),
            // Matchup card
            _panel(
              padding: const EdgeInsets.all(24),
              child: Row(
                children: [
                  Expanded(
                    flex: 3,
                    child: Column(
                      children: [
                        _teamBadge(teamA, _accentMint, LucideIcons.shield),
                        const SizedBox(height: 12),
                        _teamName(teamA),
                      ],
                    ),
                  ),
                  Expanded(
                    flex: 4,
                    child: Center(
                      child: Text(
                        'VS',
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.1),
                            fontSize: 32,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 2),
                      ),
                    ),
                  ),
                  Expanded(
                    flex: 3,
                    child: Column(
                      children: [
                        _teamBadge(teamB, _accentTeal, LucideIcons.zap),
                        const SizedBox(height: 12),
                        _teamName(teamB),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Format + Overs grid — both pulled from the session so non-T20
            // matches (T10, ODI, custom, ...) display their real values.
            Row(
              children: [
                Expanded(
                    child: _statCard(
                        icon: LucideIcons.timer,
                        label: 'FORMAT',
                        value: _format)),
                const SizedBox(width: 16),
                Expanded(
                    child: _statCard(
                        icon: LucideIcons.hash,
                        label: 'OVERS',
                        value: '$_maxOvers OVERS')),
              ],
            ),
            const SizedBox(height: 16),

            // Venue card
            _panel(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const Icon(LucideIcons.mapPin,
                      color: Colors.white54, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      venue.toUpperCase(),
                      style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.5),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // BACK + START MATCH buttons
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 56,
                    child: OutlinedButton.icon(
                      onPressed: () => context.pop(),
                      icon: const Icon(LucideIcons.chevronLeft, size: 16),
                      label: const Text('BACK',
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 2)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        backgroundColor: _bgPanel,
                        side: BorderSide(
                            color: Colors.white.withValues(alpha: 0.05)),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: SizedBox(
                    height: 56,
                    child: ElevatedButton.icon(
                      onPressed: _busy ? null : _openTossModal,
                      icon: _busy
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                  color: _theme, strokeWidth: 2))
                          : const Icon(LucideIcons.play, size: 14),
                      label: const Text('START MATCH',
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 2)),
                      style: ElevatedButton.styleFrom(
                        foregroundColor: _theme,
                        backgroundColor: _theme.withValues(alpha: 0.1),
                        side: BorderSide(color: _theme.withValues(alpha: 0.3)),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Widget _teamBadge(String name, Color glow, IconData fallback) {
    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: glow,
        boxShadow: [
          BoxShadow(color: glow.withValues(alpha: 0.3), blurRadius: 15),
        ],
      ),
      child: Icon(fallback, color: const Color(0xFF1A1A1A), size: 24),
    );
  }

  Widget _teamName(String name) => Text(
        name.toUpperCase(),
        textAlign: TextAlign.center,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.5),
      );

  Widget _statCard(
      {required IconData icon, required String label, required String value}) {
    return Container(
      height: 100,
      padding: const EdgeInsets.all(20),
      decoration: _panelDecoration,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, color: _accentTeal, size: 18),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(label,
                  style: const TextStyle(
                      color: Color(0xFF777777),
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.5)),
              const SizedBox(height: 4),
              Text(value,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1)),
            ],
          ),
        ],
      ),
    );
  }

  // ── Main console (web's main scoring layout) ───────────────────────────────

  Widget _mainConsole() {
    return Stack(
      children: [
        Column(
          children: [
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                transitionBuilder: (child, anim) => FadeTransition(
                    opacity: anim,
                    child: SlideTransition(
                      position: Tween<Offset>(
                              begin: const Offset(0, 0.05), end: Offset.zero)
                          .animate(anim),
                      child: child,
                    )),
                child: _tabContent(),
              ),
            ),
            _bottomNavTabs(),
          ],
        ),
        // Banner overlay (FOUR/SIX/WICKET/FIFTY/CENTURY)
        IgnorePointer(
          child: EventAnimation(
            kind: _pendingEvent,
            onDone: () {
              if (mounted) setState(() => _pendingEvent = null);
            },
          ),
        ),
        // Slide-in card (end-of-over / milestone)
        LiveCards(
          card: _pendingCard,
          onDismissed: () {
            if (mounted) setState(() => _pendingCard = null);
          },
        ),
      ],
    );
  }

  Widget _tabContent() {
    switch (_activeTab) {
      case 'members':
        return _membersTab();
      case 'history':
        return _historyTab();
      default:
        return SingleChildScrollView(
          key: const ValueKey('scoring'),
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
          child: Column(
            children: [
              _scoreHeader(),
              _matchControlsBar(),
              const SizedBox(height: 16),
              if (_phase == _Phase.needsInningsSetup) ...[
                _setupNextPairButton(),
              ] else ...[
                _scoringGrid(),
              ],
            ],
          ),
        );
    }
  }

  // ── Score header (stadium-bg block) ────────────────────────────────────────

  Widget _scoreHeader() {
    final score = _score;
    final s = _snap;
    final striker = s != null && s.batters.isNotEmpty ? s.batters[0] : null;
    final nonStriker = s != null && s.batters.length > 1 ? s.batters[1] : null;
    final bowler = s?.bowler;
    final lastBalls = s?.last6Balls ?? const <TimelineBall>[];
    // Sourced from the session/snapshot via the `_maxOvers` getter — falls
    // back to 20 only when the backend hasn't populated `oversPerInnings`.
    final maxOvers = _maxOvers;

    return Container(
      margin: const EdgeInsets.fromLTRB(0, 0, 0, 0),
      height: 439,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            _bgDark.withValues(alpha: 0.2),
            _bgDark,
          ],
        ),
        image: const DecorationImage(
          image: AssetImage('assets/images/home/ground.jpg'),
          fit: BoxFit.cover,
          opacity: 0.35,
        ),
      ),
      child: Stack(
        children: [
          // overlay gradient for bottom-anchored content
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, _bgDark.withValues(alpha: 0.85)],
                ),
              ),
            ),
          ),
          // Top-left back button
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            left: 12,
            child: _circleIconButton(
              icon: LucideIcons.chevronLeft,
              onTap: _openMatchExit,
            ),
          ),
          // Top-right buttons
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            right: 12,
            child: Row(
              children: [
                Builder(builder: (_) {
                  // PAUSED shows a play button (tap to resume); any other
                  // state shows a pause button (tap to pause). Tapping calls
                  // _togglePauseLive which round-trips /scoring/toggle-timer
                  // on the backend.
                  final isPaused = _timerPaused;
                  return GestureDetector(
                    onTap: _togglePauseLive,
                    child: Container(
                      height: 40,
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                            color: isPaused
                                ? _accentYellow.withValues(alpha: 0.6)
                                : Colors.white.withValues(alpha: 0.1)),
                      ),
                      child: Row(
                        children: [
                          Text(isPaused ? 'PAUSED' : 'LIVE',
                              style: TextStyle(
                                color: isPaused ? _accentYellow : Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1.2,
                              )),
                          const SizedBox(width: 6),
                          Container(
                            width: 24,
                            height: 24,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isPaused
                                  ? _accentYellow.withValues(alpha: 0.2)
                                  : Colors.white.withValues(alpha: 0.1),
                            ),
                            child: Icon(
                              isPaused ? LucideIcons.play : LucideIcons.pause,
                              size: 10,
                              color: isPaused ? _accentYellow : _theme,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
                const SizedBox(width: 8),
                _circleIconButton(
                    icon: LucideIcons.share2, onTap: _shareScoreLink),
                const SizedBox(width: 8),
                _circleIconButton(
                    icon: LucideIcons.scale, onTap: _openHouseRules),
                const SizedBox(width: 8),
                _circleIconButton(
                    icon: LucideIcons.radio, onTap: _toggleGoLive),
                const SizedBox(width: 8),
                _circleIconButton(
                    icon: LucideIcons.settings, onTap: _openSettings),
              ],
            ),
          ),
          // Bottom content
          Positioned(
            bottom: 24,
            left: 0,
            right: 0,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      // Big score
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text('${score.runs}',
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 96,
                                  height: 0.85,
                                  fontWeight: FontWeight.w900)),
                          Text('/${score.wickets}',
                              style: const TextStyle(
                                  color: Colors.white60,
                                  fontSize: 64,
                                  height: 0.85,
                                  fontWeight: FontWeight.w900)),
                        ],
                      ),
                      const Spacer(),
                      // CRR + OVERS
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          _miniStat('CRR', score.crr),
                          const SizedBox(height: 6),
                          _miniStat('OVERS',
                              '${score.overs}.${score.balls}/$maxOvers'),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Bowler row
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF4C4C4C).withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('BALLING',
                                style: TextStyle(
                                    color: Colors.white60,
                                    fontSize: 9,
                                    letterSpacing: 3)),
                            const SizedBox(height: 4),
                            Text(
                              _firstName(bowler?.name ?? 'NAME').toUpperCase(),
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                        const Spacer(),
                        Expanded(
                          flex: 0,
                          child: ConstrainedBox(
                            constraints: const BoxConstraints(maxWidth: 240),
                            child: SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: Row(
                                children: _buildBallDots(lastBalls),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Striker / Non-striker
                  Row(
                    children: [
                      Expanded(
                        child: _strikeRow(
                          label: 'STRIKER',
                          name: _firstName(striker?.name ?? 'Name'),
                          stat:
                              '${striker?.runs ?? 0} - ${striker?.balls ?? 0}',
                          nameColor: _accentLime,
                          alignEnd: false,
                        ),
                      ),
                      Expanded(
                        child: _strikeRow(
                          label: 'NON STRIKER',
                          name: _firstName(nonStriker?.name ?? 'Name'),
                          stat:
                              '${nonStriker?.runs ?? 0} - ${nonStriker?.balls ?? 0}',
                          nameColor: Colors.white,
                          alignEnd: true,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildBallDots(List<TimelineBall> balls) {
    final dots = <Widget>[];
    final shown = balls.take(6).toList();
    for (final b in shown) {
      dots.add(_ballDot(b));
      dots.add(const SizedBox(width: 8));
    }
    final remaining = (6 - shown.length).clamp(0, 6);
    for (int i = 0; i < remaining; i++) {
      dots.add(_ballDot(null));
      dots.add(const SizedBox(width: 8));
    }
    if (dots.isNotEmpty) dots.removeLast();
    return dots;
  }

  Widget _ballDot(TimelineBall? b) {
    if (b == null) {
      return Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
        ),
      );
    }
    final style =
        _ballDotStyle(label: b.label, type: b.type, isExtra: b.isExtra);
    // A free-hit delivery gets a yellow ring so the scorer can see at a
    // glance which ball was bowled on a free hit (Law 21.18).
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: style.bg,
        border: b.freeHit ? Border.all(color: _accentYellow, width: 2) : null,
      ),
      alignment: Alignment.center,
      child: Text(
        style.text,
        style: TextStyle(
          color: style.fg,
          fontSize: style.fontSize,
          fontWeight: FontWeight.w900,
          letterSpacing: 0,
        ),
      ),
    );
  }

  /// Pick colour + label for a single ball pill so wickets, boundaries,
  /// extras and dot balls are all visually distinct. Shared so the BALLING
  /// strip stays consistent with the End-Of-Over overlay.
  _BallDotStyle _ballDotStyle({
    required String label,
    required String type,
    required bool isExtra,
  }) {
    final isWicket = type == 'wicket';
    final isSix = label.startsWith('6');
    final isFour = label.startsWith('4');
    // Detect the extra kind from the suffix on the engine's label so a
    // "1wd" / "1nb" / "1b" / "1lb" / "5p" ball pills up in the extras
    // colour even if isExtra didn't flow through.
    final lower = label.toLowerCase();
    final isWide = lower.endsWith('wd');
    final isNoBall = lower.endsWith('nb');
    final isLegBye = lower.endsWith('lb');
    final isBye = !isLegBye && lower.endsWith('b');
    final isPenalty = lower.endsWith('p') && !lower.endsWith('wp');
    final extraDetected =
        isWide || isNoBall || isLegBye || isBye || isPenalty || isExtra;
    final isDot = label == '0';

    Color bg;
    Color fg;
    if (isWicket) {
      bg = const Color(0xFFEF4444); // red
      fg = Colors.white;
    } else if (isSix) {
      bg = const Color(0xFF8B5CF6); // purple
      fg = Colors.white;
    } else if (isFour) {
      bg = const Color(0xFF22C55E); // green
      fg = Colors.white;
    } else if (extraDetected) {
      bg = const Color(0xFFF97316); // orange
      fg = Colors.white;
    } else if (isDot) {
      bg = Colors.white.withValues(alpha: 0.10);
      fg = Colors.white60;
    } else {
      bg = _accentYellow; // 1, 2, 3 off the bat
      fg = Colors.black;
    }

    // Dot balls render as a centre dot for instant visual recognition;
    // everything else keeps the textual label (W, 4, 6, 1wd, 2lb, etc.).
    final text = isDot ? '•' : label;
    // Multi-char labels (1wd / 1nb / 1lb) need a smaller font to fit the
    // 32px pill cleanly.
    double fontSize;
    if (isDot) {
      fontSize = 18;
    } else if (label.length >= 3) {
      fontSize = 9;
    } else if (label.length == 2) {
      fontSize = 11;
    } else {
      fontSize = 13;
    }
    return _BallDotStyle(bg: bg, fg: fg, text: text, fontSize: fontSize);
  }

  Widget _miniStat(String label, String value) => Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(label,
              style: const TextStyle(
                  color: Colors.white70, fontSize: 13, letterSpacing: 1.2)),
          const SizedBox(width: 10),
          Text(value,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 21,
                  height: 1,
                  fontWeight: FontWeight.w900)),
        ],
      );

  Widget _strikeRow({
    required String label,
    required String name,
    required String stat,
    required Color nameColor,
    required bool alignEnd,
  }) {
    final children = [
      Text(name.toUpperCase(),
          style: TextStyle(
              color: nameColor, fontSize: 14, fontWeight: FontWeight.w500)),
      const SizedBox(width: 12),
      Text(stat,
          style: const TextStyle(
              color: Colors.white, fontSize: 11, letterSpacing: 3)),
    ];
    return Column(
      crossAxisAlignment:
          alignEnd ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                color: Colors.white60, fontSize: 9, letterSpacing: 3)),
        const SizedBox(height: 6),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: alignEnd ? children.reversed.toList() : children,
        ),
      ],
    );
  }

  Widget _circleIconButton(
      {required IconData icon, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.black.withValues(alpha: 0.4),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }

  // ── Match controls dropdown ───────────────────────────────────────────────

  Widget _matchControlsBar() {
    return Container(
      margin: const EdgeInsets.fromLTRB(0, 0, 0, 0),
      decoration: BoxDecoration(
        color: _bgControlBar,
        border: Border(
          top: BorderSide(color: Colors.white.withValues(alpha: 0.05)),
          bottom: BorderSide(color: Colors.white.withValues(alpha: 0.05)),
        ),
      ),
      child: Column(
        children: [
          GestureDetector(
            onTap: () => setState(() => _showMatchActions = !_showMatchActions),
            child: Container(
              padding: const EdgeInsets.all(12),
              color: Colors.transparent,
              child: Row(
                children: [
                  const Icon(LucideIcons.settings, color: _theme, size: 14),
                  const SizedBox(width: 8),
                  const Text('MATCH CONTROLS',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2)),
                  const Spacer(),
                  AnimatedRotation(
                    duration: const Duration(milliseconds: 220),
                    turns: _showMatchActions ? -0.25 : 0.5,
                    child: const Icon(LucideIcons.chevronLeft,
                        color: Colors.white54, size: 16),
                  ),
                ],
              ),
            ),
          ),
          AnimatedSize(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeInOut,
            alignment: Alignment.topCenter,
            child: _showMatchActions
                ? Padding(
                    padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                    child: Row(
                      children: [
                        Expanded(
                          child: _matchControlButton(
                              icon: LucideIcons.users,
                              label: 'PLAYERS',
                              onTap: _openInningsSetup),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _matchControlButton(
                              icon: LucideIcons.zap,
                              label: 'PENALTY',
                              onTap: _openPenalty),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _matchControlButton(
                              icon: LucideIcons.crosshair,
                              label: 'WAGON',
                              isToggle: true,
                              isOn: _wagonEnabled,
                              onTap: () => setState(
                                  () => _wagonEnabled = !_wagonEnabled)),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _matchControlButton(
                              icon: LucideIcons.skipForward,
                              label: '2ND INN',
                              onTap: _confirmStartNextInnings),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _matchControlButton(
                              icon: LucideIcons.checkCircle2,
                              label: 'END MATCH',
                              isEnd: true,
                              onTap: _confirmEndMatch),
                        ),
                      ],
                    ),
                  )
                : const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }

  Widget _matchControlButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    bool isToggle = false,
    bool isOn = false,
    bool isEnd = false,
  }) {
    Color bg;
    Color borderColor;
    Color fg;
    if (isEnd) {
      bg = Colors.white.withValues(alpha: 0.03);
      borderColor = _theme.withValues(alpha: 0.3);
      fg = _theme;
    } else if (isToggle && isOn) {
      bg = _theme.withValues(alpha: 0.1);
      borderColor = _theme.withValues(alpha: 0.3);
      fg = _theme;
    } else {
      bg = Colors.white.withValues(alpha: 0.05);
      borderColor = Colors.white.withValues(alpha: 0.1);
      fg = Colors.white;
    }
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Container(
        height: 64,
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: fg, size: 16),
            const SizedBox(height: 4),
            Text(label,
                style: TextStyle(
                    color: fg,
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.5)),
          ],
        ),
      ),
    );
  }

  // ── Scoring grid (web's 4-col layout) ─────────────────────────────────────

  Widget _scoringGrid() {
    return Column(
      children: [
        // Run + action grid: 4 cols, ~171px tall
        SizedBox(
          height: 171,
          child: Row(
            children: [
              // Col 1: 0 / 3
              Expanded(
                child: Column(
                  children: [
                    Expanded(child: _runCell('0', onTap: () => _scoreRun(0))),
                    Expanded(child: _runCell('3', onTap: () => _scoreRun(3))),
                  ],
                ),
              ),
              // Col 2: 1 / 4
              Expanded(
                child: Column(
                  children: [
                    Expanded(child: _runCell('1', onTap: () => _scoreRun(1))),
                    Expanded(child: _runCell('4', onTap: () => _scoreRun(4))),
                  ],
                ),
              ),
              // Col 3: 2 / 6
              Expanded(
                child: Column(
                  children: [
                    Expanded(child: _runCell('2', onTap: () => _scoreRun(2))),
                    Expanded(child: _runCell('6', onTap: () => _scoreRun(6))),
                  ],
                ),
              ),
              // Col 4: UNDO(3) / OUT(2) / CUSTOM(2)
              Expanded(
                child: Column(
                  children: [
                    Expanded(
                      flex: 3,
                      child: _labelCell('UNDO', onTap: _undo),
                    ),
                    Expanded(
                      flex: 2,
                      child: _labelCell('OUT',
                          textColor: _accentRed, onTap: _openWicket),
                    ),
                    Expanded(
                      flex: 2,
                      child: _labelCell('CUSTOM',
                          fontSize: 13, onTap: _openCustomRuns),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        // Extras row
        SizedBox(
          height: 46,
          child: Row(
            children: [
              Expanded(
                child: _labelCell('WIDE',
                    textColor: _theme,
                    fontSize: 15,
                    onTap: () => _openExtras('WIDE')),
              ),
              Expanded(
                child: _labelCell('NB',
                    textColor: _theme,
                    fontSize: 16,
                    onTap: () => _openExtras('NO_BALL')),
              ),
              Expanded(
                child: _labelCell('BYE',
                    fontSize: 16, onTap: () => _openExtras('BYE')),
              ),
              Expanded(
                child: _labelCell('LEG BYE',
                    fontSize: 13, onTap: () => _openExtras('LEG_BYE')),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _runCell(String label, {required VoidCallback onTap}) {
    return _gridCell(
      onTap: onTap,
      child: Text(label,
          style: const TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.6)),
    );
  }

  Widget _labelCell(String label,
      {Color textColor = Colors.white,
      double fontSize = 16,
      required VoidCallback onTap}) {
    return _gridCell(
      onTap: onTap,
      child: Text(label,
          style: TextStyle(
              color: textColor,
              fontSize: fontSize,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.5)),
    );
  }

  Widget _gridCell({required Widget child, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: _busy
          ? null
          : () {
              HapticFeedback.selectionClick();
              onTap();
            },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.05),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        alignment: Alignment.center,
        child: child,
      ),
    );
  }

  // ── Setup next pair (glowing button) ──────────────────────────────────────

  Widget _setupNextPairButton() {
    // Drives the label off the current innings index so the CTA reads
    // "START 1ST INNINGS" at the opening pair pick and "START 2ND INNINGS"
    // after the innings summary modal — same button, contextual copy. The
    // snapshot is checked first because /scoring/next-innings refreshes the
    // live-score immediately while the session payload can lag a tick.
    final inningsIdx =
        _snap?.currentInningsIndex ?? _session?.currentInningsIndex ?? 0;
    final isSecond = inningsIdx >= 1;
    final battingName =
        _battingTeamKey == 'teamA' ? widget.teamA : widget.teamB;
    final label = isSecond ? '⚡ START 2ND INNINGS' : '⚡ START 1ST INNINGS';
    final subtitle = battingName.isEmpty
        ? 'Pick the openers and opening bowler'
        : '${battingName.toUpperCase()} TO BAT — PICK STRIKER, NON-STRIKER & BOWLER';
    return Padding(
      padding: const EdgeInsets.fromLTRB(0, 0, 0, 16),
      child: GestureDetector(
        onTap: _busy ? null : _openInningsSetup,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 14),
          decoration: BoxDecoration(
            color: _theme.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: _theme.withValues(alpha: 0.3)),
            boxShadow: [
              BoxShadow(color: _theme.withValues(alpha: 0.2), blurRadius: 20),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(label,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      color: _theme,
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2.4)),
              const SizedBox(height: 6),
              Text(subtitle,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      color: Colors.white60,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.4)),
            ],
          ),
        ),
      ),
    );
  }

  // ── Members tab ────────────────────────────────────────────────────────────

  Widget _membersTab() {
    return SquadsView(
      key: const ValueKey('squads'),
      matchId: widget.matchId,
      teamAName: widget.teamA,
      teamBName: widget.teamB,
      fallbackTeamA: _status?.teamAPlayers ?? const [],
      fallbackTeamB: _status?.teamBPlayers ?? const [],
    );
  }

  // ── History tab ────────────────────────────────────────────────────────────

  Widget _historyTab() {
    return ScoringLedger(
      key: const ValueKey('history'),
      matchId: widget.matchId,
    );
  }

  // ── Bottom nav (Score / Teams / Ledger) ───────────────────────────────────

  Widget _bottomNavTabs() {
    return Container(
      color: Colors.black,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: _bgTabBar,
          border: Border(
              top: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
        ),
        child: SafeArea(
          top: false,
          child: Row(
            children: [
              Expanded(
                  child: _navTab(
                      id: 'scoring', icon: LucideIcons.zap, label: 'SCORE')),
              const SizedBox(width: 4),
              Expanded(
                  child: _navTab(
                      id: 'members', icon: LucideIcons.users, label: 'TEAMS')),
              const SizedBox(width: 4),
              Expanded(
                  child: _navTab(
                      id: 'history',
                      icon: LucideIcons.history,
                      label: 'LEDGER')),
            ],
          ),
        ),
      ),
    );
  }

  Widget _navTab(
      {required String id, required IconData icon, required String label}) {
    final active = _activeTab == id;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => _activeTab = id);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color:
              active ? Colors.white.withValues(alpha: 0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
              color:
                  active ? _theme.withValues(alpha: 0.2) : Colors.transparent),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon,
                size: 16, color: active ? _theme : const Color(0xFF777777)),
            const SizedBox(width: 12),
            Text(label,
                style: TextStyle(
                    color: active ? _theme : const Color(0xFF777777),
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2)),
          ],
        ),
      ),
    );
  }

  // ── Complete view ─────────────────────────────────────────────────────────

  Widget _completeView() {
    final finalSnap = _snap;
    final firstSnap = _firstInningsSnap;
    final secondBattingName =
        _battingTeamKey == 'teamA' ? widget.teamA : widget.teamB;
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Trophy + match result header
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    _theme.withValues(alpha: 0.22),
                    _theme.withValues(alpha: 0.04),
                  ],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: _theme.withValues(alpha: 0.4)),
              ),
              child: Column(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _theme.withValues(alpha: 0.15),
                      border: Border.all(color: _theme.withValues(alpha: 0.5)),
                    ),
                    child:
                        const Icon(LucideIcons.trophy, color: _theme, size: 30),
                  ),
                  const SizedBox(height: 12),
                  const Text('MATCH COMPLETE',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2.4)),
                  if (finalSnap?.result != null &&
                      finalSnap!.result!.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Text(finalSnap.result!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                            color: _accentLime,
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            height: 1.3)),
                  ],
                ],
              ),
            ),
            if (firstSnap != null) ...[
              const SizedBox(height: 16),
              _inningsBlock(
                title: '1ST INNINGS',
                battingName: _firstInningsBattingName ?? widget.teamA,
                snap: firstSnap,
                accent: _accentTeal,
              ),
            ],
            if (finalSnap != null) ...[
              const SizedBox(height: 16),
              _inningsBlock(
                title: '2ND INNINGS',
                battingName: secondBattingName,
                snap: finalSnap,
                accent: _accentMint,
              ),
            ],
            if (_earnedBadges.isNotEmpty) ...[
              const SizedBox(height: 16),
              _badgesBlock(_earnedBadges),
            ],
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: () => context.pop(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _theme,
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('CLOSE',
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2.4)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Per-innings card used by the match-complete summary. Mirrors the
  /// InningsSummaryModal layout but renders inline (no modal chrome).
  Widget _inningsBlock({
    required String title,
    required String battingName,
    required LiveScoreSnapshot snap,
    required Color accent,
  }) {
    final overString = snap.overString.isNotEmpty
        ? snap.overString
        : '${snap.overs}.${snap.balls}';
    final topBatters = [...snap.batters]
      ..sort((a, b) => b.runs.compareTo(a.runs));
    final ppRuns = snap.powerPlayRuns;
    final ppWkts = snap.powerPlayWickets;
    final ppOvers = snap.powerPlayOvers;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(LucideIcons.flag, color: accent, size: 14),
              const SizedBox(width: 8),
              Text(title,
                  style: TextStyle(
                      color: accent,
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2)),
            ],
          ),
          const SizedBox(height: 8),
          Text(battingName.toUpperCase(),
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.3)),
          const SizedBox(height: 4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text('${snap.runs}/${snap.wickets}',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 30,
                      height: 1,
                      fontWeight: FontWeight.w900)),
              const SizedBox(width: 8),
              Text('($overString ov)',
                  style: const TextStyle(
                      color: Colors.white60,
                      fontSize: 13,
                      fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _summaryStat('RUN RATE', snap.crr)),
              const SizedBox(width: 10),
              Expanded(child: _summaryStat('EXTRAS', '${snap.extras}')),
              const SizedBox(width: 10),
              Expanded(child: _summaryStat('WICKETS', '${snap.wickets}')),
            ],
          ),
          if (ppRuns != null || ppOvers != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFFFC403).withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                    color: const Color(0xFFFFC403).withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.zap,
                      color: Color(0xFFFFC403), size: 14),
                  const SizedBox(width: 8),
                  const Text('POWERPLAY',
                      style: TextStyle(
                          color: Color(0xFFFFC403),
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.6)),
                  const Spacer(),
                  if (ppRuns != null)
                    Text('$ppRuns${ppWkts != null ? '/$ppWkts' : ''}',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w800)),
                  if (ppOvers != null) ...[
                    const SizedBox(width: 8),
                    Text('in $ppOvers ov',
                        style: const TextStyle(
                            color: Colors.white60,
                            fontSize: 11,
                            fontWeight: FontWeight.w700)),
                  ],
                ],
              ),
            ),
          ],
          if (topBatters.isNotEmpty) ...[
            const SizedBox(height: 10),
            for (final b in topBatters.take(3))
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 3),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(b.name,
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w700)),
                    ),
                    Text('${b.runs} (${b.balls})',
                        style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                            fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
          ],
        ],
      ),
    );
  }

  Widget _summaryStat(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: const TextStyle(
                  color: Colors.white54,
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.3)),
          const SizedBox(height: 4),
          Text(value,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }

  Widget _badgesBlock(List<Map<String, dynamic>> badges) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFFFFC107).withValues(alpha: 0.16),
            const Color(0xFFFFC107).withValues(alpha: 0.04),
          ],
        ),
        borderRadius: BorderRadius.circular(14),
        border:
            Border.all(color: const Color(0xFFFFC107).withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(LucideIcons.award, color: Color(0xFFFFC107), size: 16),
              SizedBox(width: 8),
              Text('BADGES EARNED',
                  style: TextStyle(
                      color: Color(0xFFFFC107),
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2)),
            ],
          ),
          const SizedBox(height: 10),
          for (final b in badges)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(LucideIcons.medal,
                      color: Color(0xFFFFC107), size: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                            b['title']?.toString() ??
                                b['name']?.toString() ??
                                'Badge',
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w800)),
                        if (b['description'] != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 2),
                            child: Text(b['description'].toString(),
                                style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600)),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  // ── Stubs (full versions ship in the modals task) ─────────────────────────

  void _shareScoreLink() {
    Clipboard.setData(ClipboardData(text: 'kridaz://match/${widget.matchId}'));
    BmsToast.info(context, 'Live score link copied');
  }

  /// Open the House Rules sheet (PATCH /scoring/house-rules). Frozen once
  /// the match completes — scoring engine rejects with MATCH_ALREADY_COMPLETE.
  Future<void> _openHouseRules() async {
    if (_scoringId.isEmpty) {
      BmsToast.info(context, 'Start the match before setting house rules.');
      return;
    }
    await showHouseRulesSheet(
      context,
      scoringId: _scoringId,
      currentRules: const {},
    );
  }

  /// Toggle the match's "Go Live" status (POST /scoring/:matchId/go-live).
  /// Backend flips hostedGame.scoringStatus to LIVE so viewers can find it
  /// on /scoring/live discovery list.
  Future<void> _toggleGoLive() async {
    HapticFeedback.mediumImpact();
    final res = await _service.goLive(widget.matchId);
    if (!mounted) return;
    if (res.ok) {
      BmsToast.success(context, 'Match is now LIVE — viewers can join.');
    } else {
      BmsToast.error(context, res.error ?? 'Could not go live.');
    }
  }

  void _openSettings() {
    Navigator.of(context).push(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => SettingsPanel(
          onClose: () => Navigator.of(context).pop(),
          matchStatus: _session?.status ?? 'LIVE',
          onUpdateMatchStatus: (status) async {
            final res = await _service.setMatchStatus(
              scoringId: _scoringId,
              status: status,
            );
            if (!mounted) return;
            if (res.ok && res.data != null) {
              setState(() => _session = res.data);
              _toast('Match status: $status');
            } else {
              _toast(res.error ?? 'Could not update match status', error: true);
            }
          },
          isLive: true,
          streamingEnabled: _streamingEnabled,
          onToggleStreaming: (v) => setState(() => _streamingEnabled = v),
          obsOverlayUrl: _streamingEnabled
              ? 'https://kridaz.app/live-overlay/${widget.matchId}'
              : null,
          publicScoreboardUrl: 'https://kridaz.app/analytics/${widget.matchId}',
          youtubeVideoId: null,
          onAuthorizeStream: (id) {
            _toast(id.isEmpty ? 'Enter a YouTube ID' : 'Broadcast linked',
                error: id.isEmpty);
          },
          onChangeTickerTheme: () {
            Navigator.of(context).pop();
            _toast('Open theme store from main scoring screen');
          },
          onPreviewTheme: () {
            Navigator.of(context).pop();
            context.push('/scoring/theme-preview?theme=neon_classic');
          },
          aiEnabled: false,
          commentaryLanguage: 'en',
          commentaryVoice: 'alloy',
          commentaryStyle: 'professional',
          onSaveCommentary: ({
            required enabled,
            required language,
            required voice,
            required style,
          }) async {
            await _service.updateCommentarySettings(
              matchId: widget.matchId,
              enabled: enabled,
            );
            if (mounted) _toast('Commentary saved');
          },
          revisedTarget: null,
          revisedOvers: null,
          onReviseTarget: (target, overs) async {
            final ok = await _service.reviseTarget(
                matchId: widget.matchId,
                newTarget: target,
                newOvers: overs.toInt());
            if (mounted) _toast(ok ? 'Target revised' : 'Failed', error: !ok);
          },
          umpire1: '',
          umpire2: '',
          matchReferee: '',
          onSaveOfficials: ({
            required umpire1,
            required umpire2,
            required matchReferee,
          }) {
            _toast('Officials updated');
          },
          powerplayOvers: 0,
          battingReviewsRemaining: 2,
          fieldingReviewsRemaining: 2,
          onSetPowerplay: (overs) async {
            final ok = await _service.setPowerplay(
                matchId: widget.matchId, startOver: 0, endOver: overs);
            if (mounted) {
              _toast(ok ? 'Powerplay set' : 'Failed', error: !ok);
            }
          },
          onUseReview: ({required team, required successful}) async {
            final ok = await _service.recordReview(
                matchId: widget.matchId,
                team: team == 'batting' ? 'teamA' : 'teamB',
                decision: successful ? 'upheld' : 'overturned');
            if (mounted) {
              _toast(
                  ok
                      ? (successful ? 'Review retained' : 'Review lost')
                      : 'Failed',
                  error: !ok);
            }
          },
          onOpenMatchReport: () {
            Navigator.of(context).pop();
            _toast('Open Match Report modal from console');
          },
          onOpenLiveAnalytics: () {
            Navigator.of(context).pop();
            context.push('/analytics/${widget.matchId}');
          },
        ),
      ),
    );
  }

  void _openPenalty() {
    _openPenaltyModal();
  }

  // ── Shared decoration helpers ─────────────────────────────────────────────

  static BoxDecoration get _panelDecoration => BoxDecoration(
        color: _bgPanel,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      );

  Widget _panel({required Widget child, EdgeInsetsGeometry? padding}) {
    return Container(
      padding: padding,
      decoration: _panelDecoration,
      child: child,
    );
  }

  String _firstName(String name) {
    final t = name.trim();
    if (t.isEmpty) return 'NAME';
    final parts = t.split(RegExp(r'\s+'));
    return parts.first;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal sheets (will be redesigned in the modals task; kept functional now)
// ─────────────────────────────────────────────────────────────────────────────

class _TossResult {
  final String winnerKey;
  final String decision;
  const _TossResult(this.winnerKey, this.decision);
}

/// Resolved background colour, foreground colour, display text and font
/// size for a single ball pill in the BALLING strip / End-Of-Over overlay.
class _BallDotStyle {
  final Color bg;
  final Color fg;
  final String text;
  final double fontSize;
  const _BallDotStyle({
    required this.bg,
    required this.fg,
    required this.text,
    required this.fontSize,
  });
}

class _TossSheet extends StatefulWidget {
  final String teamA;
  final String teamB;
  const _TossSheet({required this.teamA, required this.teamB});

  @override
  State<_TossSheet> createState() => _TossSheetState();
}

class _TossSheetState extends State<_TossSheet> {
  String? _winner;
  String? _decision;

  @override
  Widget build(BuildContext context) {
    return _SheetShell(
      title: 'TOSS',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          const _SheetLabel('Won by'),
          Row(children: [
            _pill(widget.teamA, _winner == 'teamA',
                () => setState(() => _winner = 'teamA')),
            const SizedBox(width: 10),
            _pill(widget.teamB, _winner == 'teamB',
                () => setState(() => _winner = 'teamB')),
          ]),
          const SizedBox(height: 18),
          const _SheetLabel('Elected to'),
          Row(children: [
            _pill('Bat', _decision == 'BAT',
                () => setState(() => _decision = 'BAT')),
            const SizedBox(width: 10),
            _pill('Bowl', _decision == 'BOWL',
                () => setState(() => _decision = 'BOWL')),
          ]),
          const SizedBox(height: 24),
          _SheetConfirm(
            enabled: _winner != null && _decision != null,
            onTap: () => context.pop(_TossResult(_winner!, _decision!)),
          ),
        ],
      ),
    );
  }

  Widget _pill(String label, bool sel, VoidCallback onTap) => Expanded(
        child: GestureDetector(
          onTap: onTap,
          child: Container(
            height: 46,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: sel ? _theme : Colors.white.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                  color: sel ? _theme : Colors.white.withValues(alpha: 0.1)),
            ),
            child: Text(label,
                style: TextStyle(
                    color: sel ? Colors.black : Colors.white,
                    fontWeight: FontWeight.w700),
                maxLines: 1,
                overflow: TextOverflow.ellipsis),
          ),
        ),
      );
}

class _OpeningPlayers {
  final String strikerId;
  final String nonStrikerId;
  final String bowlerId;
  const _OpeningPlayers(this.strikerId, this.nonStrikerId, this.bowlerId);
}

class _OpeningPlayersSheet extends StatefulWidget {
  final List<RosterPlayer> batters;
  final List<RosterPlayer> bowlers;
  const _OpeningPlayersSheet({required this.batters, required this.bowlers});

  @override
  State<_OpeningPlayersSheet> createState() => _OpeningPlayersSheetState();
}

class _OpeningPlayersSheetState extends State<_OpeningPlayersSheet> {
  String? _striker;
  String? _nonStriker;
  String? _bowler;

  @override
  Widget build(BuildContext context) {
    return _SheetShell(
      title: 'OPENING PLAYERS',
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SheetLabel('Striker'),
          _dropdown(
              widget.batters, _striker, (v) => setState(() => _striker = v)),
          const SizedBox(height: 14),
          const _SheetLabel('Non-striker'),
          _dropdown(widget.batters.where((p) => p.id != _striker).toList(),
              _nonStriker, (v) => setState(() => _nonStriker = v)),
          const SizedBox(height: 14),
          const _SheetLabel('Bowler'),
          _dropdown(
              widget.bowlers, _bowler, (v) => setState(() => _bowler = v)),
          const SizedBox(height: 24),
          _SheetConfirm(
            enabled: _striker != null && _nonStriker != null && _bowler != null,
            onTap: () => Navigator.pop(
                context, _OpeningPlayers(_striker!, _nonStriker!, _bowler!)),
          ),
        ],
      ),
    );
  }

  Widget _dropdown(List<RosterPlayer> players, String? value,
      ValueChanged<String?> onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          dropdownColor: const Color(0xFF222222),
          hint: const Text('Select player',
              style: TextStyle(color: Colors.white38, fontSize: 14)),
          icon: const Icon(LucideIcons.chevronDown, color: _theme),
          items: players
              .map((p) => DropdownMenuItem(
                    value: p.id,
                    child: Text(p.name,
                        style:
                            const TextStyle(color: Colors.white, fontSize: 14)),
                  ))
              .toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }
}

class _PlayerPickSheet extends StatelessWidget {
  final String title;
  final List<RosterPlayer> players;
  const _PlayerPickSheet({required this.title, required this.players});

  @override
  Widget build(BuildContext context) {
    return _SheetShell(
      title: title.toUpperCase(),
      child: players.isEmpty
          ? const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Text('No players available',
                  style: TextStyle(color: Colors.white54)),
            )
          : Column(
              mainAxisSize: MainAxisSize.min,
              children: players
                  .map((p) => ListTile(
                        onTap: () => context.pop(p),
                        leading: Builder(builder: (_) {
                          final hasPic = isHttpUrl(p.profilePicture);
                          return CircleAvatar(
                            backgroundColor: _theme.withValues(alpha: 0.15),
                            backgroundImage:
                                hasPic ? NetworkImage(p.profilePicture!) : null,
                            child: hasPic
                                ? null
                                : Text(
                                    p.name.isNotEmpty ? p.name[0] : '?',
                                    style: const TextStyle(
                                        color: _theme,
                                        fontWeight: FontWeight.w700),
                                  ),
                          );
                        }),
                        title: Text(p.name,
                            style: const TextStyle(color: Colors.white)),
                        subtitle: p.role != null
                            ? Text(p.role!,
                                style: const TextStyle(color: Colors.white38))
                            : null,
                      ))
                  .toList(),
            ),
    );
  }
}

class _ExtrasSheet extends StatefulWidget {
  final String type;
  const _ExtrasSheet({required this.type});

  @override
  State<_ExtrasSheet> createState() => _ExtrasSheetState();
}

class _ExtrasSheetState extends State<_ExtrasSheet> {
  int _runs = 0;

  String get _label {
    switch (widget.type) {
      case 'WIDE':
        return 'WIDE';
      case 'NO_BALL':
        return 'NO BALL';
      case 'BYE':
        return 'BYE';
      case 'LEG_BYE':
        return 'LEG BYE';
      default:
        return widget.type;
    }
  }

  @override
  Widget build(BuildContext context) {
    return _SheetShell(
      title: _label,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SheetLabel('Additional runs from this delivery'),
          Row(
            children: List.generate(5, (i) {
              final r = i;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () => setState(() => _runs = r),
                  child: Container(
                    width: 44,
                    height: 44,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: _runs == r
                          ? _theme
                          : Colors.white.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                          color: Colors.white.withValues(alpha: 0.1)),
                    ),
                    child: Text('$r',
                        style: TextStyle(
                            color: _runs == r ? Colors.black : Colors.white,
                            fontWeight: FontWeight.w700)),
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 24),
          _SheetConfirm(enabled: true, onTap: () => context.pop(_runs)),
        ],
      ),
    );
  }
}

class _CustomRunsSheet extends StatefulWidget {
  const _CustomRunsSheet();

  @override
  State<_CustomRunsSheet> createState() => _CustomRunsSheetState();
}

class _CustomRunsSheetState extends State<_CustomRunsSheet> {
  final _ctrl = TextEditingController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _SheetShell(
      title: 'CUSTOM RUNS',
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SheetLabel('Runs scored off this ball'),
          TextField(
            controller: _ctrl,
            keyboardType: TextInputType.number,
            autofocus: true,
            style: const TextStyle(
                color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900),
            textAlign: TextAlign.center,
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white.withValues(alpha: 0.05),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.symmetric(vertical: 16),
              hintText: '0',
              hintStyle: const TextStyle(color: Colors.white24, fontSize: 32),
            ),
          ),
          const SizedBox(height: 24),
          _SheetConfirm(
            enabled: true,
            onTap: () {
              final v = int.tryParse(_ctrl.text.trim());
              if (v == null) {
                BmsToast.error(context, 'Enter a valid number');
                return;
              }
              context.pop(v);
            },
          ),
        ],
      ),
    );
  }
}

class _SheetShell extends StatelessWidget {
  final String title;
  final Widget child;
  const _SheetShell({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
          20, 12, 20, MediaQuery.of(context).viewInsets.bottom + 24),
      decoration: const BoxDecoration(
        color: Color(0xFF111111),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(title,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.5)),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}

class _SheetLabel extends StatelessWidget {
  final String text;
  const _SheetLabel(this.text);
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(text.toUpperCase(),
            style: const TextStyle(
                color: Colors.white54,
                fontSize: 10,
                fontWeight: FontWeight.w900,
                letterSpacing: 2)),
      );
}

/// One queued tap from the score grid. Snapshots the striker / bowler at
/// enqueue time so the worker doesn't drift if the IDs change between
/// queueing and sending.
class _BallTask {
  final int runs;
  final bool isExtra;
  final String? extraType;
  final bool isWicket;
  final String? wicketType;
  final String? nextBatterId;
  final String strikerId;
  final String bowlerId;
  const _BallTask({
    required this.runs,
    required this.isExtra,
    required this.extraType,
    required this.isWicket,
    required this.wicketType,
    required this.nextBatterId,
    required this.strikerId,
    required this.bowlerId,
  });
}

class _SheetConfirm extends StatelessWidget {
  final bool enabled;
  final VoidCallback onTap;
  const _SheetConfirm({required this.enabled, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: enabled ? onTap : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: _theme,
          foregroundColor: Colors.black,
          disabledBackgroundColor: Colors.white.withValues(alpha: 0.05),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
        child: const Text('CONFIRM',
            style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 2)),
      ),
    );
  }
}
