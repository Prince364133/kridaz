import 'dart:async';
import 'package:flutter/material.dart';
import '../../../services/scoring_service.dart';
import '../widgets/match_not_started_view.dart';

/// SQUADS tab — Playing XI vs Bench per team. Polled every 60s.
class MatchSquadsTab extends StatefulWidget {
  const MatchSquadsTab({super.key, required this.matchId});
  final String matchId;

  @override
  State<MatchSquadsTab> createState() => _MatchSquadsTabState();
}

class _MatchSquadsTabState extends State<MatchSquadsTab>
    with AutomaticKeepAliveClientMixin {
  final _scoring = ScoringService();
  Map<String, dynamic>? _data;
  String? _error;
  bool _notStartedYet = false;
  bool _loading = true;
  Timer? _poll;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _refresh();
    _poll = Timer.periodic(const Duration(seconds: 60), (_) => _refresh());
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _refresh() async {
    final res = await _scoring.getSquads(widget.matchId);
    if (!mounted) return;
    setState(() {
      _loading = false;
      if (res.ok) {
        _data = res.data;
        _error = null;
        _notStartedYet = false;
      } else {
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
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    if (_loading) return const Center(child: CircularProgressIndicator());
    final data = _data;
    if (data == null) {
      if (_notStartedYet) {
        return MatchNotStartedView(
          label: 'Squads appear once the toss is done and openers are picked.',
          onRetry: () async {
            setState(() => _loading = true);
            await _refresh();
          },
        );
      }
      return Center(
        child: Text(_error ?? 'Squads not available yet.',
            style:
                const TextStyle(color: Colors.white70, fontFamily: 'Poppins')),
      );
    }
    final teamA = (data['teamA'] as Map?)?.cast<String, dynamic>();
    final teamB = (data['teamB'] as Map?)?.cast<String, dynamic>();
    return RefreshIndicator(
      onRefresh: _refresh,
      color: Colors.white,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (teamA != null) _TeamBlock(team: teamA),
          if (teamA != null && teamB != null) const SizedBox(height: 24),
          if (teamB != null) _TeamBlock(team: teamB),
        ],
      ),
    );
  }
}

class _TeamBlock extends StatelessWidget {
  const _TeamBlock({required this.team});
  final Map<String, dynamic> team;

  @override
  Widget build(BuildContext context) {
    final playingXi = (team['playingXi'] as List?) ?? const [];
    final bench = (team['bench'] as List?) ?? const [];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(team['name']?.toString() ?? 'Team',
            style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w700,
                fontFamily: 'Poppins')),
        const SizedBox(height: 12),
        _SectionLabel('PLAYING XI'),
        const SizedBox(height: 6),
        ...playingXi
            .map((p) => _PlayerRow(p: (p as Map).cast<String, dynamic>())),
        if (bench.isNotEmpty) ...[
          const SizedBox(height: 14),
          _SectionLabel('BENCH'),
          const SizedBox(height: 6),
          ...bench
              .map((p) => _PlayerRow(p: (p as Map).cast<String, dynamic>())),
        ],
      ],
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Text(text,
      style: const TextStyle(
          color: Colors.white60,
          fontSize: 11,
          fontWeight: FontWeight.w600,
          letterSpacing: 1.2,
          fontFamily: 'Poppins'));
}

class _PlayerRow extends StatelessWidget {
  const _PlayerRow({required this.p});
  final Map<String, dynamic> p;
  @override
  Widget build(BuildContext context) {
    final tags = <String>[];
    if (p['isCaptain'] == true) tags.add('C');
    if (p['isWicketKeeper'] == true) tags.add('WK');
    if (p['isCustom'] == true) tags.add('guest');
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            child: Text(p['name']?.toString() ?? 'Player',
                style: const TextStyle(
                    color: Colors.white, fontSize: 14, fontFamily: 'Poppins')),
          ),
          if (p['role'] != null && p['role'].toString().isNotEmpty)
            Text(p['role'].toString(),
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.5),
                    fontSize: 11,
                    fontFamily: 'Poppins')),
          if (tags.isNotEmpty) ...[
            const SizedBox(width: 8),
            Text('(${tags.join(', ')})',
                style: const TextStyle(
                    color: Color(0xFF7CFE6A),
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Poppins')),
          ],
        ],
      ),
    );
  }
}
