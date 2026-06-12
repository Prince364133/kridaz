import 'dart:async';
import 'package:flutter/material.dart';
import '../../../services/scoring_service.dart';
import '../../../services/scoring_socket_service.dart';
import '../widgets/match_not_started_view.dart';

/// SCORECARD tab — batting / bowling tables, FOW, partnerships, extras.
/// Driven by the same Socket.IO scoreStream as the LIVE tab: every ball push
/// re-fetches `/scoring/:id/scorecard`. The Timer.periodic remains as a 60s
/// safety net in case the socket drops without firing a reconnect event.
class MatchScorecardTab extends StatefulWidget {
  const MatchScorecardTab({super.key, required this.matchId});
  final String matchId;

  @override
  State<MatchScorecardTab> createState() => _MatchScorecardTabState();
}

class _MatchScorecardTabState extends State<MatchScorecardTab>
    with AutomaticKeepAliveClientMixin {
  final _scoring = ScoringService();
  final _socket = ScoringSocketService();
  Map<String, dynamic>? _data;
  String? _error;
  String? _errorCode;
  bool _notStartedYet = false;
  bool _loading = true;
  Timer? _poll;
  StreamSubscription? _scoreSub;
  StreamSubscription? _reconnectSub;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _refresh();
    // Socket push → instant refresh. The 60s timer is a slow safety net for
    // the case where the socket silently dies without firing a reconnect.
    _socket.connect(widget.matchId);
    _scoreSub = _socket.scoreStream.listen((_) => _refresh());
    _reconnectSub = _socket.reconnectStream.listen((_) => _refresh());
    _poll = Timer.periodic(const Duration(seconds: 60), (_) => _refresh());
  }

  @override
  void dispose() {
    _poll?.cancel();
    _scoreSub?.cancel();
    _reconnectSub?.cancel();
    super.dispose();
  }

  Future<void> _refresh() async {
    final res = await _scoring.getScorecard(widget.matchId);
    if (!mounted) return;
    setState(() {
      _loading = false;
      if (res.ok) {
        _data = res.data;
        _error = null;
        _errorCode = null;
        _notStartedYet = false;
      } else {
        _error = res.error;
        _errorCode = res.code;
        _notStartedYet = isMatchNotStartedCode(
          res.code,
          res.error,
          statusCode: res.statusCode,
        );
        // Stop hammering the backend with a 404 every 10s. Pull-to-refresh
        // (when scoring eventually starts) or re-opening the tab brings
        // polling back.
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
          label: 'The scorecard appears once the first ball is scored.',
          onRetry: () async {
            setState(() => _loading = true);
            await _refresh();
          },
        );
      }
      return Center(
        child: Text(_error ?? 'Scorecard not available yet.',
            style:
                const TextStyle(color: Colors.white70, fontFamily: 'Poppins')),
      );
    }
    final innings = (data['innings'] as List?) ?? const [];
    return RefreshIndicator(
      onRefresh: _refresh,
      color: Colors.white,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: innings.length,
        separatorBuilder: (_, __) => const SizedBox(height: 24),
        itemBuilder: (_, i) {
          final inn = (innings[i] as Map).cast<String, dynamic>();
          return _InningsBlock(innings: inn);
        },
      ),
    );
  }
}

class _InningsBlock extends StatelessWidget {
  const _InningsBlock({required this.innings});
  final Map<String, dynamic> innings;

  @override
  Widget build(BuildContext context) {
    final batting = (innings['battingTeam'] as Map?)?.cast<String, dynamic>();
    final batters = (innings['batters'] as List?) ?? const [];
    final bowlers = (innings['bowlers'] as List?) ?? const [];
    final fow = (innings['fallOfWickets'] as List?) ?? const [];
    final extras = (innings['extras'] as Map?)?.cast<String, dynamic>();
    final totalRuns = innings['totalRuns'] ?? 0;
    final totalWickets = innings['totalWickets'] ?? 0;
    final overs = innings['overs']?.toString() ?? '0.0';
    final crr = innings['crr']?.toString() ?? '0.00';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(batting?['name']?.toString() ?? 'Innings',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Poppins')),
            ),
            Text('$totalRuns-$totalWickets ($overs)',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Poppins')),
          ],
        ),
        Text('CRR $crr',
            style: TextStyle(
                color: Colors.white.withValues(alpha: 0.6),
                fontSize: 12,
                fontFamily: 'Poppins')),
        const SizedBox(height: 12),
        _SectionLabel('BATTING'),
        const SizedBox(height: 6),
        const _BattingHeader(),
        const _RowDivider(),
        ...batters
            .map((b) => _BatterRow(b: (b as Map).cast<String, dynamic>())),
        const SizedBox(height: 14),
        _SectionLabel('BOWLING'),
        const SizedBox(height: 6),
        const _BowlingHeader(),
        const _RowDivider(),
        ...bowlers
            .map((b) => _BowlerRow(b: (b as Map).cast<String, dynamic>())),
        if (fow.isNotEmpty) ...[
          const SizedBox(height: 14),
          _SectionLabel('FALL OF WICKETS'),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: fow.map((w) {
              final m = (w as Map).cast<String, dynamic>();
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text('${m['score']}  ${m['playerName']}  (${m['over']})',
                    style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                        fontFamily: 'Poppins')),
              );
            }).toList(),
          ),
        ],
        if (extras != null) ...[
          const SizedBox(height: 14),
          _SectionLabel('EXTRAS'),
          const SizedBox(height: 6),
          Text(
              'b ${extras['byes'] ?? 0}  •  lb ${extras['legByes'] ?? 0}  •  w ${extras['wides'] ?? 0}  •  nb ${extras['noBalls'] ?? 0}  •  p ${extras['penalty'] ?? 0}  •  Total ${extras['total'] ?? 0}',
              style: const TextStyle(
                  color: Colors.white70, fontSize: 12, fontFamily: 'Poppins')),
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

/// Column widths shared between table headers and rows so the data lines up
/// vertically. Keep these in lock-step or the header will drift away from
/// the columns it labels.
const double _wRuns = 40;
const double _wBalls = 40;
const double _wFours = 34;
const double _wSixes = 34;
const double _wSR = 60;

const double _wOvers = 44;
const double _wMaidens = 32;
const double _wRunsBowl = 40;
const double _wWickets = 32;
const double _wEcon = 52;

class _BattingHeader extends StatelessWidget {
  const _BattingHeader();
  @override
  Widget build(BuildContext context) => const _StatHeaderRow(
        nameLabel: 'Batter',
        columns: [
          _StatHead('R', _wRuns),
          _StatHead('B', _wBalls),
          _StatHead('4s', _wFours),
          _StatHead('6s', _wSixes),
          _StatHead('SR', _wSR),
        ],
      );
}

class _BowlingHeader extends StatelessWidget {
  const _BowlingHeader();
  @override
  Widget build(BuildContext context) => const _StatHeaderRow(
        nameLabel: 'Bowler',
        columns: [
          _StatHead('O', _wOvers),
          _StatHead('M', _wMaidens),
          _StatHead('R', _wRunsBowl),
          _StatHead('W', _wWickets),
          _StatHead('Econ', _wEcon),
        ],
      );
}

class _StatHead {
  final String label;
  final double width;
  const _StatHead(this.label, this.width);
}

class _StatHeaderRow extends StatelessWidget {
  const _StatHeaderRow({required this.nameLabel, required this.columns});
  final String nameLabel;
  final List<_StatHead> columns;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Expanded(
            child: Text(
              nameLabel,
              style: const TextStyle(
                color: Colors.white54,
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.6,
                fontFamily: 'Poppins',
              ),
            ),
          ),
          for (final c in columns)
            SizedBox(
              width: c.width,
              child: Text(
                c.label,
                textAlign: TextAlign.end,
                style: const TextStyle(
                  color: Colors.white54,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.6,
                  fontFamily: 'Poppins',
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _RowDivider extends StatelessWidget {
  const _RowDivider();
  @override
  Widget build(BuildContext context) => Container(
        height: 1,
        margin: const EdgeInsets.only(bottom: 4),
        color: Colors.white.withValues(alpha: 0.06),
      );
}

class _BatterRow extends StatelessWidget {
  const _BatterRow({required this.b});
  final Map<String, dynamic> b;
  @override
  Widget build(BuildContext context) {
    final isStriker = b['isStriker'] == true;
    final isNonStriker = b['isNonStriker'] == true;
    final marker = isStriker ? '*' : (isNonStriker ? '†' : '');
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  '${b['name']}$marker',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Poppins',
                  ),
                ),
              ),
              _statCell('${b['runs'] ?? 0}', _wRuns, bold: true),
              _statCell('${b['balls'] ?? 0}', _wBalls),
              _statCell('${b['fours'] ?? 0}', _wFours),
              _statCell('${b['sixes'] ?? 0}', _wSixes),
              _statCell(_fmtSr(b['strikeRate']), _wSR),
            ],
          ),
          if (b['dismissal'] != null && b['dismissal'].toString().isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(
                b['dismissal'].toString(),
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.45),
                  fontSize: 11,
                  fontStyle: FontStyle.italic,
                  fontFamily: 'Poppins',
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _fmtSr(dynamic v) {
    if (v is num) return v.toStringAsFixed(2);
    if (v is String) {
      final p = double.tryParse(v);
      return p != null ? p.toStringAsFixed(2) : v;
    }
    return '—';
  }
}

class _BowlerRow extends StatelessWidget {
  const _BowlerRow({required this.b});
  final Map<String, dynamic> b;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: Row(
          children: [
            Expanded(
              child: Text(
                b['name']?.toString() ?? 'Bowler',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Poppins',
                ),
              ),
            ),
            _statCell('${b['overs'] ?? '—'}', _wOvers),
            _statCell('${b['maidens'] ?? 0}', _wMaidens),
            _statCell('${b['runs'] ?? 0}', _wRunsBowl),
            _statCell('${b['wickets'] ?? 0}', _wWickets, bold: true),
            _statCell(_fmtEcon(b['economyRate']), _wEcon),
          ],
        ),
      );

  String _fmtEcon(dynamic v) {
    if (v is num) return v.toStringAsFixed(2);
    if (v is String) {
      final p = double.tryParse(v);
      return p != null ? p.toStringAsFixed(2) : v;
    }
    return '—';
  }
}

/// Right-aligned cell with tabular figures so digits sit on a vertical
/// rhythm regardless of value. Used by both batter and bowler rows.
Widget _statCell(String text, double width, {bool bold = false}) {
  return SizedBox(
    width: width,
    child: Text(
      text,
      textAlign: TextAlign.end,
      style: TextStyle(
        color: bold ? Colors.white : Colors.white70,
        fontSize: 13,
        fontWeight: bold ? FontWeight.w800 : FontWeight.w500,
        fontFamily: 'Poppins',
        fontFeatures: const [FontFeature.tabularFigures()],
      ),
    ),
  );
}
