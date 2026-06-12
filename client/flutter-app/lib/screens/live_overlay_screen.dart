import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../models/scoring_models.dart';
import '../services/scoring_service.dart';
import '../services/scoring_socket_service.dart';
import '../widgets/scoring/event_animation.dart';
import '../widgets/scoring/live_cards.dart';
import '../widgets/scoring/themes/theme_packs.dart';

/// Broadcast-mode live overlay — Flutter parity for the web's `LiveOverlay`.
///
/// The web version is a transparent page loaded into OBS as a Browser Source.
/// That doesn't map to a Flutter widget (OBS can't host Flutter), so this
/// implementation is the alternative: a full-screen broadcast view that can
/// be put on a second phone / tablet for HDMI or screen-mirror capture, or
/// just used by viewers who want a clean cricket-only view of the match.
///
/// Driven by the same socket feed (`scoreUpdated`, `ballEvent`, `matchEnded`)
/// as the web overlay; falls back to an HTTP fetch on mount and on every
/// reconnect to re-sync.
class LiveOverlayScreen extends StatefulWidget {
  final String matchId;
  final String? token;
  final String themeId;

  const LiveOverlayScreen({
    super.key,
    required this.matchId,
    this.token,
    this.themeId = 'neon_classic',
  });

  @override
  State<LiveOverlayScreen> createState() => _LiveOverlayScreenState();
}

class _LiveOverlayScreenState extends State<LiveOverlayScreen> {
  final _service = ScoringService();
  final _socket = ScoringSocketService();

  LiveScoreSnapshot? _score;
  bool _connected = false;
  EventKind? _pendingEvent;
  LiveCardData? _pendingCard;
  bool _matchEnded = false;

  // Event queue — animations and cards don't overlap. Each pulse waits for
  // its own duration before the next is processed.
  final List<_QueuedEvent> _queue = [];
  bool _processing = false;

  // Trackers so we only fire each milestone / end-of-over once.
  final Set<String> _firedMilestones = {};
  int _lastOver = -1;
  String? _lastBallSig;

  late final StreamSubscription _scoreSub;
  late final StreamSubscription _ballSub;
  late final StreamSubscription _endSub;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _scoreSub.cancel();
    _ballSub.cancel();
    _endSub.cancel();
    _socket.leaveCurrentMatch();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    // 1) seed via HTTP so the first frame isn't blank
    final res = await _service.getLiveScore(widget.matchId);
    if (mounted && res.ok && res.data != null) {
      _applySnapshot(res.data!);
    }

    // 2) connect socket and subscribe to all three channels
    _socket.connect(widget.matchId, token: widget.token);

    _scoreSub = _socket.scoreStream.listen((snap) {
      if (!mounted) return;
      setState(() => _connected = true);
      _applySnapshot(snap);
    });

    _ballSub = _socket.ballStream.listen((event) {
      if (!mounted) return;
      final type = event['type']?.toString();
      if (type == null) return;
      final ev = _mapBallEvent(type);
      if (ev != null) _enqueue(_QueuedEvent.animation(ev));
    });

    _endSub = _socket.matchEndedStream.listen((_) {
      if (mounted) setState(() => _matchEnded = true);
    });
  }

  // ── Snapshot application ──────────────────────────────────────────────────

  void _applySnapshot(LiveScoreSnapshot snap) {
    final prev = _score;
    setState(() => _score = snap);

    // Derive a badge from the most recent ball when it changes — covers the
    // case where the server only pushes `scoreUpdated` without a separate
    // `ballEvent`.
    if (snap.last6Balls.isNotEmpty) {
      final last = snap.last6Balls.first;
      final sig =
          '${snap.runs}-${snap.wickets}-${snap.overs}.${snap.balls}-${last.label}';
      if (sig != _lastBallSig) {
        _lastBallSig = sig;
        final ev = _badgeFromLast(last);
        if (ev != null) _enqueue(_QueuedEvent.animation(ev));
      }
    }

    // Milestone — striker crosses 50 or 100 (fire once per batter+threshold)
    if (snap.batters.isNotEmpty) {
      final striker = snap.batters.first;
      _maybeFireMilestone(striker, 100);
      _maybeFireMilestone(striker, 50);
    }

    // End of over — ball counter resets to 0 and we've advanced
    if (snap.balls == 0 && snap.overs > 0 && snap.overs != _lastOver) {
      final prevOver = _lastOver;
      _lastOver = snap.overs;
      if (prevOver != -1) {
        _enqueue(_QueuedEvent.card(_eooCard(snap)));
      }
    }
    // ignore prev — only used for breakpoint debugging
    if (prev == null) _lastOver = snap.overs;
  }

  void _maybeFireMilestone(BatterStat b, int threshold) {
    if (b.runs < threshold) return;
    final key = '${b.id}_$threshold';
    if (_firedMilestones.contains(key)) return;
    _firedMilestones.add(key);
    _enqueue(_QueuedEvent.animation(
        threshold == 100 ? EventKind.hundred : EventKind.fifty));
    _enqueue(_QueuedEvent.card(LiveCardData(
      kind: LiveCardKind.milestone,
      batterName: b.name,
      batterRuns: b.runs,
      batterBalls: b.balls,
      batterFours: b.fours,
      batterSixes: b.sixes,
      strikeRate: b.strikeRate.toStringAsFixed(2),
    )));
  }

  LiveCardData _eooCard(LiveScoreSnapshot s) {
    return LiveCardData(
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
  }

  EventKind? _badgeFromLast(TimelineBall b) {
    if (b.type == 'wicket') return EventKind.wicket;
    if (b.label == '6') return EventKind.six;
    if (b.label == '4') return EventKind.four;
    return null;
  }

  EventKind? _mapBallEvent(String type) {
    switch (type) {
      case 'six':
        return EventKind.six;
      case 'four':
        return EventKind.four;
      case 'wicket':
        return EventKind.wicket;
      case 'fifty':
        return EventKind.fifty;
      case 'hundred':
      case 'century':
        return EventKind.hundred;
      default:
        return null;
    }
  }

  // ── Queue ─────────────────────────────────────────────────────────────────

  void _enqueue(_QueuedEvent e) {
    _queue.add(e);
    _drain();
  }

  Future<void> _drain() async {
    if (_processing || _queue.isEmpty) return;
    _processing = true;
    while (_queue.isNotEmpty && mounted) {
      final next = _queue.removeAt(0);
      if (next.kind == _QueuedKind.animation) {
        setState(() => _pendingEvent = next.event);
        await _waitForDismissal(() => _pendingEvent == null,
            timeout: const Duration(milliseconds: 2400));
      } else {
        setState(() => _pendingCard = next.card);
        await _waitForDismissal(() => _pendingCard == null,
            timeout: const Duration(seconds: 9));
      }
      await Future<void>.delayed(const Duration(milliseconds: 400));
    }
    _processing = false;
  }

  Future<void> _waitForDismissal(bool Function() done,
      {required Duration timeout}) async {
    final deadline = DateTime.now().add(timeout);
    while (mounted && !done() && DateTime.now().isBefore(deadline)) {
      await Future<void>.delayed(const Duration(milliseconds: 80));
    }
  }

  // ── Theme pack ─────────────────────────────────────────────────────────────

  /// The active broadcast pack — chosen via the `?theme=…` query param on the
  /// route. Falls back to NeonClassic for unknown ids.
  ScoringThemePack get _pack => resolveThemePack(widget.themeId);

  /// Tuple used by the legacy chrome helpers (`_batterRow`, `_ballDot`, etc.)
  /// that still want a primary/secondary/bg trio. New code should reach for
  /// `_pack.palette` directly so it can use the font hint too.
  ({Color primary, Color secondary, Color bg}) get _palette {
    final p = _pack.palette;
    return (primary: p.primary, secondary: p.secondary, bg: p.bg);
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Faint stadium backdrop (kept dark so the ticker pops)
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                image: const DecorationImage(
                  image: AssetImage('assets/images/home/ground.jpg'),
                  fit: BoxFit.cover,
                  opacity: 0.35,
                ),
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.6),
                    Colors.black.withValues(alpha: 0.9),
                  ],
                ),
              ),
            ),
          ),

          // Score waiting state
          if (_score == null) ...[
            const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 32,
                    height: 32,
                    child: CircularProgressIndicator(
                        color: Color(0xFFA3E635), strokeWidth: 2),
                  ),
                  SizedBox(height: 16),
                  Text('CONNECTING TO MATCH...',
                      style: TextStyle(
                          color: Colors.white54,
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2.4)),
                ],
              ),
            ),
          ] else if (_isPreMatch) ...[
            _preMatchBar(),
          ] else ...[
            // Bottom score strip — delegated to the active theme pack so each
            // theme can render its own shape (stacked card vs horizontal
            // chyron, etc.). `_tickerBar()` is the NeonClassic fallback we
            // kept for the score-waiting / pre-match states above.
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: SafeArea(
                top: false,
                child: _pack.buildTicker(snap: _score!),
              ),
            ),
          ],

          // Card overlay (EOO / milestone) — themed.
          _pack.buildLiveCard(
            card: _pendingCard,
            onDismissed: () {
              if (mounted) setState(() => _pendingCard = null);
            },
          ),

          // Big banner (six / four / wicket / fifty / century) — themed.
          IgnorePointer(
            child: _pack.buildEventAnimation(
              kind: _pendingEvent,
              onDone: () {
                if (mounted) setState(() => _pendingEvent = null);
              },
            ),
          ),

          // Top chrome — close button + status pill + match-on-break chip
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(child: _topBar()),
          ),

          // Match complete overlay
          if (_matchEnded) _matchCompleteBanner(),
        ],
      ),
    );
  }

  bool get _isPreMatch {
    final s = _score;
    if (s == null) return false;
    final status = (s.status ?? '').toUpperCase();
    return status == 'NOT_STARTED' || (!s.isLive && status != 'COMPLETED');
  }

  Widget _topBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              if (context.canPop()) context.pop();
            },
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.5),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
              ),
              child: const Icon(LucideIcons.x, color: Colors.white, size: 16),
            ),
          ),
          const Spacer(),
          if (_score?.status?.toUpperCase() == 'RAIN_DELAY' ||
              _score?.status?.toUpperCase() == 'BAD_LIGHT' ||
              _score?.status?.toUpperCase() == 'PAUSED')
            _breakChip()
          else
            _connectionPill(),
        ],
      ),
    );
  }

  Widget _connectionPill() {
    final on = _connected;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: on ? const Color(0xFFA3E635) : const Color(0xFFEF4444),
              boxShadow: [
                BoxShadow(
                    color:
                        (on ? const Color(0xFFA3E635) : const Color(0xFFEF4444))
                            .withValues(alpha: 0.5),
                    blurRadius: 8),
              ],
            ),
          ),
          const SizedBox(width: 6),
          Text(on ? 'LIVE' : 'OFFLINE',
              style: TextStyle(
                  color: on ? const Color(0xFFA3E635) : const Color(0xFFEF4444),
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2)),
        ],
      ),
    );
  }

  Widget _breakChip() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFEF4444).withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border:
            Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: const [
          Icon(LucideIcons.pause, color: Color(0xFFEF4444), size: 12),
          SizedBox(width: 6),
          Text('MATCH ON BREAK',
              style: TextStyle(
                  color: Color(0xFFEF4444),
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2)),
        ],
      ),
    );
  }

  // ── Pre-match bottom bar ─────────────────────────────────────────────────

  Widget _preMatchBar() {
    final p = _palette;
    final s = _score!;
    final teamA = s.teamA?['name']?.toString() ?? 'TBD';
    final teamB = s.teamB?['name']?.toString() ?? 'TBD';
    return Positioned(
      left: 0,
      right: 0,
      bottom: 0,
      child: SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          decoration: BoxDecoration(
            color: const Color(0xFF050505).withValues(alpha: 0.95),
            border: Border(top: BorderSide(color: p.primary, width: 2)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Flexible(
                    child: Text(teamA.toUpperCase(),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                            color: p.primary,
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 2)),
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: Text('VS',
                        style: TextStyle(
                            color: Colors.white54,
                            fontSize: 14,
                            fontWeight: FontWeight.w900)),
                  ),
                  Flexible(
                    child: Text(teamB.toUpperCase(),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                            color: p.primary,
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 2)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text('MATCH STARTS SOON',
                    style: TextStyle(
                        color: Colors.white70,
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Live ticker ───────────────────────────────────────────────────────────
  // The ticker now lives inside each theme pack — see
  // `ScoringThemePack.buildTicker`. The NeonClassic pack ships the
  // stacked-card layout that used to live here; SportsNetwork ships a
  // horizontal TV-chyron variant.

  Widget _matchCompleteBanner() {
    final s = _score;
    return Positioned.fill(
      child: IgnorePointer(
        child: Container(
          color: Colors.black.withValues(alpha: 0.6),
          child: Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 20),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.9),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                      color: Colors.black.withValues(alpha: 0.5),
                      blurRadius: 50,
                      offset: const Offset(0, 20)),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('MATCH COMPLETE',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 36,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -1)),
                  if (s?.result != null && s!.result!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(s.result!,
                        style: const TextStyle(
                            color: Color(0xFFA3E635),
                            fontSize: 16,
                            fontWeight: FontWeight.w700)),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Queue plumbing ──────────────────────────────────────────────────────────

enum _QueuedKind { animation, card }

class _QueuedEvent {
  final _QueuedKind kind;
  final EventKind? event;
  final LiveCardData? card;
  _QueuedEvent._(this.kind, {this.event, this.card});
  factory _QueuedEvent.animation(EventKind e) =>
      _QueuedEvent._(_QueuedKind.animation, event: e);
  factory _QueuedEvent.card(LiveCardData c) =>
      _QueuedEvent._(_QueuedKind.card, card: c);
}
