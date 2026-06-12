import 'package:flutter/material.dart';
import '../../../services/scoring_service.dart';
import '../widgets/match_not_started_view.dart';

/// ANALYTICS tab — MVP, top performers, total fours/sixes. Post-match.
class MatchAnalyticsTab extends StatefulWidget {
  const MatchAnalyticsTab({super.key, required this.matchId});
  final String matchId;

  @override
  State<MatchAnalyticsTab> createState() => _MatchAnalyticsTabState();
}

class _MatchAnalyticsTabState extends State<MatchAnalyticsTab>
    with AutomaticKeepAliveClientMixin {
  final _scoring = ScoringService();
  Map<String, dynamic>? _analytics;
  String? _error;
  bool _notStartedYet = false;
  bool _loading = true;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    final res = await _scoring.getAnalytics(widget.matchId);
    if (!mounted) return;
    setState(() {
      _loading = false;
      if (res.ok) {
        _analytics = (res.data?['analytics'] as Map?)?.cast<String, dynamic>();
        _error = null;
        _notStartedYet = false;
      } else {
        _error = res.error;
        _notStartedYet = isMatchNotStartedCode(
          res.code,
          res.error,
          statusCode: res.statusCode,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    if (_loading) return const Center(child: CircularProgressIndicator());
    final a = _analytics;
    if (a == null) {
      if (_notStartedYet) {
        return MatchNotStartedView(
          label: 'MVP, top performers and totals show up after the match ends.',
          onRetry: () async {
            setState(() => _loading = true);
            await _refresh();
          },
        );
      }
      return Center(
        child: Text(_error ?? 'Analytics available after the match.',
            style:
                const TextStyle(color: Colors.white70, fontFamily: 'Poppins')),
      );
    }
    final mvp = (a['mvp'] as Map?)?.cast<String, dynamic>();
    final top = (a['topPerformers'] as List?) ?? const [];
    final fours = a['totalFours'];
    final sixes = a['totalSixes'];

    return RefreshIndicator(
      onRefresh: _refresh,
      color: Colors.white,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (mvp != null) ...[
            const Text('MVP',
                style: TextStyle(
                    color: Colors.white60,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1.2,
                    fontFamily: 'Poppins')),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFFFC107).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                    color: const Color(0xFFFFC107).withValues(alpha: 0.5)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(mvp['name']?.toString() ?? 'Player',
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                fontFamily: 'Poppins')),
                        const SizedBox(height: 4),
                        Text('${mvp['points'] ?? 0} pts',
                            style: const TextStyle(
                                color: Color(0xFFFFC107),
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                fontFamily: 'Poppins')),
                      ],
                    ),
                  ),
                  const Icon(Icons.emoji_events,
                      color: Color(0xFFFFC107), size: 40),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
          if (top.isNotEmpty) ...[
            const Text('TOP PERFORMERS',
                style: TextStyle(
                    color: Colors.white60,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1.2,
                    fontFamily: 'Poppins')),
            const SizedBox(height: 8),
            for (final t in top)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Expanded(
                      child: Text((t as Map)['name']?.toString() ?? 'Player',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontFamily: 'Poppins')),
                    ),
                    Text('${t['points'] ?? 0} pts',
                        style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 13,
                            fontFamily: 'Poppins')),
                  ],
                ),
              ),
            const SizedBox(height: 20),
          ],
          Row(
            children: [
              Expanded(child: _StatCard(label: 'Fours', value: fours)),
              const SizedBox(width: 12),
              Expanded(child: _StatCard(label: 'Sixes', value: sixes)),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value});
  final String label;
  final Object? value;
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF0E0E10),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.6),
                    fontSize: 12,
                    fontFamily: 'Poppins')),
            const SizedBox(height: 6),
            Text('${value ?? 0}',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    fontFamily: 'Poppins')),
          ],
        ),
      );
}
