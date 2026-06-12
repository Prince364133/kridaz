import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'scoring_theme.dart';

/// A single ball in the match timeline (shape mirrors the web's `timeline`
/// entries returned by `/scoring/status` and `/scoring/live-score`).
class TimelineEntry {
  final int over;
  final int ball;
  final int runs;
  final bool isWicket;
  final bool isExtra;
  final String? extraType;
  final String? wicketType;
  final String? batterId;
  final String? batterName;
  final String? bowlerId;
  final String? bowlerName;

  const TimelineEntry({
    required this.over,
    required this.ball,
    required this.runs,
    this.isWicket = false,
    this.isExtra = false,
    this.extraType,
    this.wicketType,
    this.batterId,
    this.batterName,
    this.bowlerId,
    this.bowlerName,
  });

  String get label {
    if (isWicket) return 'W';
    if (extraType == 'WIDE') return 'Wd';
    if (extraType == 'NO_BALL') return 'Nb';
    return '$runs';
  }

  factory TimelineEntry.fromJson(Map<String, dynamic> j) => TimelineEntry(
        over: (j['over'] as num?)?.toInt() ?? 0,
        ball: (j['ball'] as num?)?.toInt() ?? 0,
        runs: (j['runs'] as num?)?.toInt() ?? 0,
        isWicket: j['isWicket'] == true,
        isExtra: j['isExtra'] == true,
        extraType: j['extraType']?.toString(),
        wicketType: j['wicketType']?.toString(),
        batterId: (j['batter'] is Map)
            ? (j['batter']['_id'] ?? j['batter']['id'])?.toString()
            : null,
        batterName:
            (j['batter'] is Map) ? j['batter']['name']?.toString() : null,
        bowlerId: (j['bowler'] is Map)
            ? (j['bowler']['_id'] ?? j['bowler']['id'])?.toString()
            : null,
        bowlerName:
            (j['bowler'] is Map) ? j['bowler']['name']?.toString() : null,
      );
}

/// Ball-by-ball ledger with type/player/over filters, grouped by over.
/// Port of `BallByBallHistory.jsx`.
class BallByBallHistory extends StatefulWidget {
  final List<TimelineEntry> timeline;

  const BallByBallHistory({super.key, required this.timeline});

  @override
  State<BallByBallHistory> createState() => _BallByBallHistoryState();
}

class _BallByBallHistoryState extends State<BallByBallHistory> {
  String _filterType = 'all'; // all | wicket | boundary | extra | dot
  String _filterPlayer = 'all'; // userId
  String _filterOver = 'all'; // index or 'all'

  static const _typeOptions = [
    ('all', 'All'),
    ('wicket', 'Wickets'),
    ('boundary', 'Boundaries'),
    ('extra', 'Extras'),
    ('dot', 'Dots'),
  ];

  List<TimelineEntry> get _filtered {
    return widget.timeline.where((b) {
      final typeMatch = switch (_filterType) {
        'wicket' => b.isWicket,
        'boundary' => b.runs == 4 || b.runs == 6,
        'extra' => b.isExtra,
        'dot' => !b.isExtra && b.runs == 0,
        _ => true,
      };
      final playerMatch = _filterPlayer == 'all' ||
          b.batterId == _filterPlayer ||
          b.bowlerId == _filterPlayer;
      final overMatch =
          _filterOver == 'all' || b.over == int.tryParse(_filterOver);
      return typeMatch && playerMatch && overMatch;
    }).toList();
  }

  List<({String id, String name})> get _players {
    final map = <String, String>{};
    for (final b in widget.timeline) {
      if (b.batterId != null && b.batterName != null) {
        map[b.batterId!] = b.batterName!;
      }
      if (b.bowlerId != null && b.bowlerName != null) {
        map[b.bowlerId!] = b.bowlerName!;
      }
    }
    return map.entries.map((e) => (id: e.key, name: e.value)).toList();
  }

  int get _maxOver =>
      widget.timeline.fold<int>(0, (acc, b) => b.over > acc ? b.over : acc);

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;
    final grouped = <int, List<TimelineEntry>>{};
    for (final b in filtered) {
      grouped.putIfAbsent(b.over, () => []).add(b);
    }
    final overs = grouped.keys.toList()..sort((a, b) => b.compareTo(a));

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _filterRow(
              _typeOptions, _filterType, (v) => setState(() => _filterType = v),
              highlightTheme: true),
          const SizedBox(height: 8),
          _filterRow([
            ('all', 'All Players'),
            ..._players.map((p) => (p.id, p.name)),
          ], _filterPlayer, (v) => setState(() => _filterPlayer = v)),
          const SizedBox(height: 8),
          _filterRow([
            ('all', 'All Overs'),
            for (int i = 0; i <= _maxOver; i++) ('$i', 'Over ${i + 1}'),
          ], _filterOver, (v) => setState(() => _filterOver = v)),
          const SizedBox(height: 24),
          if (overs.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 60),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.02),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                    color: Colors.white.withValues(alpha: 0.1),
                    style: BorderStyle.solid),
              ),
              child: Column(
                children: [
                  Icon(LucideIcons.shield,
                      color: Colors.white.withValues(alpha: 0.2), size: 32),
                  const SizedBox(height: 16),
                  Text('NO RECORDS MATCH YOUR FILTERS',
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.4),
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2.4)),
                ],
              ),
            )
          else
            ...overs.map((ov) => _overGroup(ov, grouped[ov]!)),
        ],
      ),
    );
  }

  Widget _filterRow(List<(String, String)> options, String selected,
      void Function(String) onSelect,
      {bool highlightTheme = false}) {
    return SizedBox(
      height: 36,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: options.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final (value, label) = options[i];
          final isSelected = selected == value;
          Color bg;
          Color fg;
          if (isSelected && highlightTheme) {
            bg = ScoringTheme.theme;
            fg = Colors.black;
          } else if (isSelected) {
            bg = Colors.white.withValues(alpha: 0.2);
            fg = Colors.white;
          } else {
            bg = Colors.white.withValues(alpha: 0.05);
            fg = const Color(0xFF888888);
          }
          return GestureDetector(
            onTap: () {
              HapticFeedback.selectionClick();
              onSelect(value);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: bg,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                    color: isSelected
                        ? Colors.transparent
                        : Colors.white.withValues(alpha: 0.1)),
              ),
              alignment: Alignment.center,
              child: Text(label.toUpperCase(),
                  style: TextStyle(
                      color: fg,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2.4)),
            ),
          );
        },
      ),
    );
  }

  Widget _overGroup(int over, List<TimelineEntry> balls) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                  child: Container(
                      height: 1, color: Colors.white.withValues(alpha: 0.05))),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text('OVER ${over + 1}',
                    style: const TextStyle(
                        color: Color(0xFF666666),
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 3)),
              ),
              Expanded(
                  child: Container(
                      height: 1, color: Colors.white.withValues(alpha: 0.05))),
            ],
          ),
          const SizedBox(height: 16),
          ...balls.reversed.map(_ballRow),
        ],
      ),
    );
  }

  Color _ballBg(TimelineEntry b) {
    if (b.isWicket) return const Color(0xFFDC2626);
    if (b.isExtra) return const Color(0xFFEAB308);
    if (b.runs == 6) return ScoringTheme.theme;
    if (b.runs == 4) return const Color(0xFF22C55E);
    if (b.runs == 0) return Colors.white.withValues(alpha: 0.1);
    return Colors.white.withValues(alpha: 0.2);
  }

  Color _ballFg(TimelineEntry b) {
    if (b.isWicket) return Colors.white;
    if (b.isExtra) return Colors.black;
    if (b.runs == 6 || b.runs == 4) return Colors.black;
    if (b.runs == 0) return const Color(0xFF888888);
    return Colors.white;
  }

  Widget _ballRow(TimelineEntry b) {
    final summary = b.isWicket
        ? 'OUT - ${b.wicketType ?? ''}'
        : b.isExtra
            ? '${b.extraType ?? ''} + ${b.runs} RUNS'
            : '${b.runs} RUNS';
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.02),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: _ballBg(b),
              shape: BoxShape.circle,
            ),
            child: Text(b.label,
                style: TextStyle(
                    color: _ballFg(b),
                    fontSize: 12,
                    fontWeight: FontWeight.w900)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text((b.batterName ?? 'Unknown').toUpperCase(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w900)),
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 8),
                      child: Text('VS',
                          style: TextStyle(
                              color: Color(0xFF666666),
                              fontSize: 8,
                              fontWeight: FontWeight.w900)),
                    ),
                    Flexible(
                      child: Text((b.bowlerName ?? 'Unknown').toUpperCase(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              color: Colors.white54,
                              fontSize: 10,
                              fontWeight: FontWeight.w900)),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(summary,
                    style: const TextStyle(
                        color: Color(0xFF888888),
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1)),
              ],
            ),
          ),
          Text('${b.over}.${b.ball}',
              style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.4),
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.2)),
        ],
      ),
    );
  }
}
