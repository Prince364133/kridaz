import 'dart:async';
import 'package:flutter/material.dart';
import '../../../models/scoring_models.dart';
import '../../../services/scoring_service.dart';
import '../../../services/scoring_socket_service.dart';

/// LIVE tab — initial paint via HTTP, then live updates over Socket.IO.
/// Reconnect → HTTP resync (no events were buffered while we were down).
class MatchLiveTab extends StatefulWidget {
  const MatchLiveTab({super.key, required this.matchId});
  final String matchId;

  @override
  State<MatchLiveTab> createState() => _MatchLiveTabState();
}

class _MatchLiveTabState extends State<MatchLiveTab>
    with AutomaticKeepAliveClientMixin {
  final _scoring = ScoringService();
  final _socket = ScoringSocketService();

  LiveScoreSnapshot? _snap;
  String? _error;
  StreamSubscription? _scoreSub;
  StreamSubscription? _reconnectSub;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final initial = await _scoring.getLiveScore(widget.matchId);
    if (!mounted) return;
    if (initial.ok) {
      setState(() => _snap = initial.data);
    } else {
      setState(() => _error = initial.error);
    }

    _socket.connect(widget.matchId);
    _scoreSub = _socket.scoreStream.listen((s) {
      if (!mounted) return;
      setState(() {
        _snap = s;
        _error = null;
      });
    });
    _reconnectSub = _socket.reconnectStream.listen((_) async {
      final fresh = await _scoring.getLiveScore(widget.matchId);
      if (mounted && fresh.ok) setState(() => _snap = fresh.data);
    });
  }

  @override
  void dispose() {
    _scoreSub?.cancel();
    _reconnectSub?.cancel();
    _socket.leaveCurrentMatch();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final snap = _snap;
    if (snap == null) {
      return Center(
        child: _error != null
            ? Text(_error!,
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.7),
                    fontFamily: 'Poppins'))
            : const CircularProgressIndicator(),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (snap.freeHitActive) const _FreeHitBadge(),
        if (snap.isRevised && snap.revisedTarget != null)
          _Banner(
            text:
                'Revised target: ${snap.revisedTarget} in ${snap.revisedOvers ?? '?'} overs (DLS)',
            color: const Color(0xFFFFC107),
          ),
        const SizedBox(height: 6),
        _ScoreHeader(snap: snap),
        const SizedBox(height: 16),
        if (snap.last6Balls.isNotEmpty) _LastSixBalls(balls: snap.last6Balls),
        const SizedBox(height: 20),
        if (snap.batters.isNotEmpty) _BattersBlock(batters: snap.batters),
        const SizedBox(height: 20),
        if (snap.bowler != null) _BowlerBlock(bowler: snap.bowler!),
        if (snap.result != null && snap.result!.isNotEmpty) ...[
          const SizedBox(height: 24),
          Center(
            child: Text(snap.result!,
                style: const TextStyle(
                    color: Color(0xFFFFC107),
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Poppins')),
          ),
        ],
      ],
    );
  }
}

class _FreeHitBadge extends StatelessWidget {
  const _FreeHitBadge();
  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: const Color(0xFFFFC107),
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Text('FREE HIT',
            textAlign: TextAlign.center,
            style: TextStyle(
                color: Colors.black,
                fontWeight: FontWeight.w800,
                fontFamily: 'Poppins')),
      );
}

class _Banner extends StatelessWidget {
  const _Banner({required this.text, required this.color});
  final String text;
  final Color color;
  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.5)),
        ),
        child: Text(text,
            style: TextStyle(
                color: color,
                fontWeight: FontWeight.w600,
                fontFamily: 'Poppins')),
      );
}

class _ScoreHeader extends StatelessWidget {
  const _ScoreHeader({required this.snap});
  final LiveScoreSnapshot snap;
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          snap.battingTeamName,
          style: TextStyle(
              color: Colors.white.withValues(alpha: 0.7),
              fontSize: 13,
              fontFamily: 'Poppins'),
        ),
        Text(
          '${snap.runs}-${snap.wickets}',
          style: const TextStyle(
              color: Colors.white,
              fontSize: 42,
              fontWeight: FontWeight.w800,
              fontFamily: 'Poppins'),
        ),
        Text(
          '${snap.overString} overs   •   CRR ${snap.crr}',
          style: TextStyle(
              color: Colors.white.withValues(alpha: 0.7),
              fontSize: 14,
              fontFamily: 'Poppins'),
        ),
        if (snap.target != null && snap.runsNeeded != null) ...[
          const SizedBox(height: 6),
          Text(
            'Need ${snap.runsNeeded} from ${snap.ballsRemaining ?? '?'} balls  •  RRR ${snap.rrr ?? '—'}',
            style: const TextStyle(
                color: Color(0xFF7CFE6A), fontSize: 13, fontFamily: 'Poppins'),
          ),
        ],
      ],
    );
  }
}

class _LastSixBalls extends StatelessWidget {
  const _LastSixBalls({required this.balls});
  final List<TimelineBall> balls;
  @override
  Widget build(BuildContext context) {
    return Row(
      children: balls.map((b) {
        final isWicket = b.type == 'wicket';
        final isBoundary =
            b.type == 'boundary' || b.label == '4' || b.label == '6';
        return Padding(
          padding: const EdgeInsets.only(right: 8),
          child: Container(
            width: 36,
            height: 36,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: isWicket
                  ? const Color(0xFFEF4444)
                  : isBoundary
                      ? const Color(0xFF7CFE6A)
                      : Colors.white.withValues(alpha: 0.10),
              shape: BoxShape.circle,
            ),
            child: Text(
              b.label,
              style: TextStyle(
                color: isWicket || isBoundary ? Colors.black : Colors.white,
                fontWeight: FontWeight.w700,
                fontFamily: 'Poppins',
                fontSize: 13,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _BattersBlock extends StatelessWidget {
  const _BattersBlock({required this.batters});
  final List<BatterStat> batters;
  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('BATTERS',
              style: TextStyle(
                  color: Colors.white60,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.2,
                  fontFamily: 'Poppins')),
          const SizedBox(height: 8),
          for (final b in batters)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  Expanded(
                    child: Text(b.name,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontFamily: 'Poppins')),
                  ),
                  Text(
                      '${b.runs} (${b.balls})  •  SR ${b.strikeRate.toStringAsFixed(1)}',
                      style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 13,
                          fontFamily: 'Poppins')),
                ],
              ),
            ),
        ],
      );
}

class _BowlerBlock extends StatelessWidget {
  const _BowlerBlock({required this.bowler});
  final BowlerStat bowler;
  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('BOWLER',
              style: TextStyle(
                  color: Colors.white60,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.2,
                  fontFamily: 'Poppins')),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Text(bowler.name,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontFamily: 'Poppins')),
              ),
              Text(
                  '${bowler.oversString}  •  ${bowler.runs}/${bowler.wickets}  •  ${bowler.maidens}M',
                  style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 13,
                      fontFamily: 'Poppins')),
            ],
          ),
        ],
      );
}
