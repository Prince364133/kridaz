import 'dart:async';
import 'package:flutter/material.dart';
import '../../../services/scoring_service.dart';
import '../../../services/scoring_socket_service.dart';
import '../widgets/match_not_started_view.dart';

/// OVERS tab — per-over breakdown, latest-first (Cricinfo convention).
/// Refreshed by the Socket.IO scoreStream: each ball push triggers an
/// `afterBallId` fetch so only over(s) with new balls come over the wire.
/// The Timer.periodic stays as a slow 30s safety net.
class MatchOversTab extends StatefulWidget {
  const MatchOversTab({super.key, required this.matchId});
  final String matchId;

  @override
  State<MatchOversTab> createState() => _MatchOversTabState();
}

class _MatchOversTabState extends State<MatchOversTab>
    with AutomaticKeepAliveClientMixin {
  final _scoring = ScoringService();
  final _socket = ScoringSocketService();
  bool _loading = true;
  String? _error;
  bool _notStartedYet = false;
  String? _cursor;
  // Latest-first.
  List<Map<String, dynamic>> _overs = [];
  Timer? _poll;
  StreamSubscription? _scoreSub;
  StreamSubscription? _reconnectSub;
  // Which innings the user is currently viewing. 1-based: 1 = 1st, 2 = 2nd.
  // Persists across polls; flipping the toggle resets the cursor and reloads.
  int _selectedInnings = 1;
  // Tracks whether the backend has populated a 2nd-innings overs list so the
  // toggle's "2nd INN" chip can be hidden / disabled until the chase starts.
  bool _hasSecondInnings = false;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _refresh(initial: true);
    _socket.connect(widget.matchId);
    _scoreSub = _socket.scoreStream.listen((_) => _refresh());
    _reconnectSub = _socket.reconnectStream.listen((_) => _refresh());
    _poll = Timer.periodic(const Duration(seconds: 30), (_) => _refresh());
  }

  @override
  void dispose() {
    _poll?.cancel();
    _scoreSub?.cancel();
    _reconnectSub?.cancel();
    super.dispose();
  }

  Future<void> _switchInnings(int innings) async {
    if (innings == _selectedInnings) return;
    setState(() {
      _selectedInnings = innings;
      _loading = true;
      _overs = const [];
      _cursor = null;
      _error = null;
    });
    await _refresh(initial: true);
  }

  Future<void> _refresh({bool initial = false}) async {
    final res = await _scoring.getOvers(
      widget.matchId,
      innings: _selectedInnings,
      afterBallId: initial ? null : _cursor,
    );
    if (!mounted) return;
    if (!res.ok) {
      setState(() {
        _loading = false;
        _error = res.error;
        _notStartedYet = isMatchNotStartedCode(
          res.code,
          res.error,
          statusCode: res.statusCode,
        );
        if (_notStartedYet) {
          _poll?.cancel();
          _poll = null;
        }
      });
      return;
    }
    final data = res.data!;
    final innings = (data['innings'] as List?)?.cast<Map<String, dynamic>>() ??
        const <Map<String, dynamic>>[];
    // Find the entry for the innings the user is currently viewing. Backend
    // shape varies — sometimes server-filters by the query param (single
    // entry returned), sometimes returns every innings and lets us pick.
    // `inningsNumber` is reported as 1-indexed by some payloads and 0-indexed
    // by others, so we treat both as equivalent. If the user is on 2nd inn
    // and the backend hasn't started it yet we leave activeInnings null —
    // the empty-state view will say "2nd innings hasn't started yet" rather
    // than silently falling back to the 1st innings.
    Map<String, dynamic>? activeInnings;
    bool sawSecond = false;
    for (int i = 0; i < innings.length; i++) {
      final inn = innings[i];
      final raw = inn['inningsNumber'];
      final n = raw is num ? raw.toInt() : null;
      // Treat n as 1-indexed if it matches selected directly, or 0-indexed
      // if n+1 matches.
      final matches1Idx = n == _selectedInnings;
      final matches0Idx = n != null && (n + 1) == _selectedInnings;
      if (matches1Idx || matches0Idx) activeInnings = inn;
      // Second-innings detector: explicit inningsNumber >= 2 (1-indexed)
      // OR n == 1 (0-indexed) OR a second entry in the list.
      if ((n != null && (n >= 2 || n == 1 && innings.length >= 2)) || i >= 1) {
        sawSecond = true;
      }
    }
    // When backend server-filtered to a single innings, take that one even
    // though the inningsNumber may not have been emitted.
    if (activeInnings == null && innings.length == 1) {
      final only = innings.first;
      final hasNumber = only['inningsNumber'] is num;
      if (!hasNumber) activeInnings = only;
    }
    final newOvers =
        (activeInnings?['overs'] as List?)?.cast<Map<String, dynamic>>() ??
            const <Map<String, dynamic>>[];
    final cursor = data['nextCursor']?.toString();

    setState(() {
      _loading = false;
      _error = null;
      _cursor = cursor;
      _hasSecondInnings = sawSecond || _hasSecondInnings;
      if (initial) {
        _overs = List<Map<String, dynamic>>.from(newOvers);
      } else {
        // Merge: replace any matching overNumber, prepend genuinely new ones.
        for (final fresh in newOvers) {
          final idx =
              _overs.indexWhere((o) => o['overNumber'] == fresh['overNumber']);
          if (idx >= 0) {
            _overs[idx] = fresh;
          } else {
            _overs.insert(0, fresh);
          }
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    if (_loading && _overs.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    return Column(
      children: [
        _inningsSwitcher(),
        Expanded(child: _body()),
      ],
    );
  }

  Widget _body() {
    if (_overs.isEmpty) {
      if (_notStartedYet) {
        return MatchNotStartedView(
          label: 'Over-by-over breakdown shows up once balls are scored.',
          onRetry: () async {
            setState(() => _loading = true);
            await _refresh(initial: true);
          },
        );
      }
      return Center(
        child: Text(
          _error ??
              (_selectedInnings == 2
                  ? '2nd innings hasn\'t started yet.'
                  : 'No overs yet.'),
          style: const TextStyle(color: Colors.white70, fontFamily: 'Poppins'),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () => _refresh(initial: true),
      color: Colors.white,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _overs.length,
        separatorBuilder: (_, __) => const SizedBox(height: 14),
        itemBuilder: (_, i) => _OverBlock(over: _overs[i]),
      ),
    );
  }

  Widget _inningsSwitcher() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Row(
        children: [
          Expanded(
            child: _inningsChip(
              label: '1st INN',
              selected: _selectedInnings == 1,
              onTap: () => _switchInnings(1),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _inningsChip(
              label: '2nd INN',
              selected: _selectedInnings == 2,
              onTap: () => _switchInnings(2),
              dim: !_hasSecondInnings,
            ),
          ),
        ],
      ),
    );
  }

  Widget _inningsChip({
    required String label,
    required bool selected,
    required VoidCallback onTap,
    bool dim = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 10),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected
              ? const Color(0xFF7CFE6A).withValues(alpha: 0.18)
              : Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: selected
                ? const Color(0xFF7CFE6A).withValues(alpha: 0.55)
                : Colors.white12,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected
                ? const Color(0xFF7CFE6A)
                : dim
                    ? Colors.white38
                    : Colors.white70,
            fontSize: 12,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.4,
            fontFamily: 'Poppins',
          ),
        ),
      ),
    );
  }
}

class _OverBlock extends StatelessWidget {
  const _OverBlock({required this.over});
  final Map<String, dynamic> over;

  @override
  Widget build(BuildContext context) {
    final balls = (over['balls'] as List?) ?? const [];
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF0E0E10),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(over['label']?.toString() ?? 'Over',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Poppins')),
              const Spacer(),
              Text(over['scoreAtEnd']?.toString() ?? '',
                  style: const TextStyle(
                      color: Color(0xFF7CFE6A),
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Poppins')),
            ],
          ),
          if (over['header'] != null)
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(over['header'].toString(),
                  style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.55),
                      fontSize: 11,
                      fontFamily: 'Poppins')),
            ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: balls.map((b) {
              final m = (b as Map).cast<String, dynamic>();
              return _BallChip(b: m);
            }).toList(),
          ),
          const SizedBox(height: 8),
          Text('${over['runs'] ?? 0} runs in over',
              style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.55),
                  fontSize: 11,
                  fontFamily: 'Poppins')),
        ],
      ),
    );
  }
}

class _BallChip extends StatelessWidget {
  const _BallChip({required this.b});
  final Map<String, dynamic> b;
  @override
  Widget build(BuildContext context) {
    final label = (b['label'] ?? '•').toString();
    final isWicket = b['isWicket'] == true;
    final isBoundary = b['isFour'] == true || b['isSix'] == true;
    return Container(
      width: 32,
      height: 32,
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
        label,
        style: TextStyle(
          color: isWicket || isBoundary ? Colors.black : Colors.white,
          fontWeight: FontWeight.w700,
          fontFamily: 'Poppins',
          fontSize: 11,
        ),
      ),
    );
  }
}
