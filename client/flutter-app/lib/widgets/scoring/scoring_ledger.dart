import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../services/scoring_service.dart';

/// In-screen ledger panel for the live scorer. Replaces the old single-list
/// "ball by ball" timeline with two structured tabs:
///   * **SCORECARD** — batters, bowlers, fall of wickets, partnerships,
///     extras, powerplay window. Powered by `/scoring/:matchId/scorecard`.
///   * **OVERS** — per-over ball-by-ball breakdown. Powered by
///     `/scoring/:matchId/overs?innings=N`.
///
/// Both views support 1st / 2nd innings selection at the top.
class ScoringLedger extends StatefulWidget {
  final String matchId;
  const ScoringLedger({super.key, required this.matchId});

  @override
  State<ScoringLedger> createState() => _ScoringLedgerState();
}

class _ScoringLedgerState extends State<ScoringLedger>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  final _service = ScoringService();

  bool _scorecardLoading = true;
  String? _scorecardError;
  Map<String, dynamic>? _scorecard;

  bool _oversLoading = false;
  String? _oversError;
  Map<String, dynamic>? _overs;
  int _oversInnings = 1;

  /// Per-innings expansion state for the SCORECARD tab. The most recent
  /// innings starts expanded; tap the header bar to collapse / expand any
  /// innings panel.
  final Set<int> _expandedInnings = <int>{};
  bool _initialExpansionApplied = false;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _tabs.addListener(_onTabChange);
    _loadScorecard();
  }

  @override
  void dispose() {
    _tabs.removeListener(_onTabChange);
    _tabs.dispose();
    super.dispose();
  }

  void _onTabChange() {
    if (_tabs.indexIsChanging) return;
    if (_tabs.index == 1 && _overs == null && !_oversLoading) {
      _loadOvers(_oversInnings);
    }
  }

  Future<void> _loadScorecard() async {
    setState(() {
      _scorecardLoading = true;
      _scorecardError = null;
    });
    final res = await _service.getScorecard(widget.matchId);
    if (!mounted) return;
    setState(() {
      _scorecardLoading = false;
      if (res.ok && res.data != null) {
        _scorecard = res.data;
      } else {
        _scorecardError = res.error ?? 'Could not load scorecard';
      }
    });
  }

  Future<void> _loadOvers(int innings) async {
    setState(() {
      _oversLoading = true;
      _oversError = null;
      _oversInnings = innings;
    });
    final res = await _service.getOvers(widget.matchId, innings: innings);
    if (!mounted) return;
    setState(() {
      _oversLoading = false;
      if (res.ok && res.data != null) {
        _overs = res.data;
      } else {
        _oversError = res.error ?? 'Could not load overs';
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Colors.white12),
          ),
          child: TabBar(
            controller: _tabs,
            dividerColor: Colors.transparent,
            indicator: BoxDecoration(
              color: const Color(0xFF00C187).withValues(alpha: 0.18),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                  color: const Color(0xFF00C187).withValues(alpha: 0.5)),
            ),
            indicatorSize: TabBarIndicatorSize.tab,
            labelColor: const Color(0xFF00C187),
            unselectedLabelColor: Colors.white60,
            labelStyle: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.6,
            ),
            tabs: const [
              Tab(text: 'SCORECARD'),
              Tab(text: 'OVERS'),
            ],
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tabs,
            children: [
              _buildScorecardTab(),
              _buildOversTab(),
            ],
          ),
        ),
      ],
    );
  }

  // ── SCORECARD tab ──────────────────────────────────────────────────────────

  Widget _buildScorecardTab() {
    if (_scorecardLoading) {
      return const Center(
        child:
            CircularProgressIndicator(color: Color(0xFF00C187), strokeWidth: 2),
      );
    }
    if (_scorecardError != null) {
      return _errorView(_scorecardError!, _loadScorecard);
    }
    final innings = _readInningsList(_scorecard);
    if (innings.isEmpty) {
      return _emptyView('No scorecard data yet — start scoring first.');
    }
    // Auto-expand only the LATEST innings on first load — older innings stay
    // collapsed so the screen opens compact, matching the reference design.
    if (!_initialExpansionApplied) {
      _expandedInnings.add(innings.length);
      _initialExpansionApplied = true;
    }
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (int i = 0; i < innings.length; i++) ...[
            _inningsCollapsible(
              innings[i],
              inningsNumber: i + 1,
              expanded: _expandedInnings.contains(i + 1),
            ),
            if (i < innings.length - 1) const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }

  /// Single collapsible innings card. Header row (always visible) shows the
  /// batting team name + innings ordinal + score + chevron. Body slides in
  /// when expanded, containing the batting table, extras, total, bowling,
  /// FoW, powerplay, and partnerships sections in that order.
  Widget _inningsCollapsible(
    Map<String, dynamic> innings, {
    required int inningsNumber,
    required bool expanded,
  }) {
    final team = innings['battingTeamName']?.toString() ??
        innings['team']?.toString() ??
        'Innings';
    final runs = _readInt(innings['runs']);
    final wkts = _readInt(innings['wickets']);
    final overs = innings['overString']?.toString() ??
        innings['overs']?.toString() ??
        '0.0';
    final ord = _ordinal(inningsNumber).toLowerCase();
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: expanded
              ? const Color(0xFF00C187).withValues(alpha: 0.5)
              : Colors.white12,
        ),
      ),
      child: Column(
        children: [
          GestureDetector(
            onTap: () => setState(() {
              if (expanded) {
                _expandedInnings.remove(inningsNumber);
              } else {
                _expandedInnings.add(inningsNumber);
              }
            }),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                gradient: expanded
                    ? LinearGradient(
                        colors: [
                          const Color(0xFF00C187).withValues(alpha: 0.85),
                          const Color(0xFF00C187).withValues(alpha: 0.55),
                        ],
                      )
                    : null,
                color: expanded ? null : Colors.transparent,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '$team $ord inn',
                          style: TextStyle(
                            color: expanded ? Colors.white : Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '$runs-$wkts',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '($overs)',
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(width: 8),
                  AnimatedRotation(
                    turns: expanded ? 0.5 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: Icon(
                      LucideIcons.chevronDown,
                      color: expanded ? Colors.white : Colors.white54,
                      size: 18,
                    ),
                  ),
                ],
              ),
            ),
          ),
          AnimatedCrossFade(
            duration: const Duration(milliseconds: 200),
            crossFadeState:
                expanded ? CrossFadeState.showFirst : CrossFadeState.showSecond,
            firstChild: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _battingTable(innings),
                  const SizedBox(height: 12),
                  _extrasLine(innings),
                  const SizedBox(height: 8),
                  _totalLine(innings),
                  const SizedBox(height: 14),
                  _bowlingTable(innings),
                  const SizedBox(height: 14),
                  _fallOfWickets(innings),
                  const SizedBox(height: 14),
                  _powerplayBlock(innings),
                  const SizedBox(height: 14),
                  _partnershipsBlock(innings),
                ],
              ),
            ),
            secondChild: const SizedBox(width: double.infinity, height: 0),
          ),
        ],
      ),
    );
  }

  Widget _totalLine(Map<String, dynamic> innings) {
    final runs = _readInt(innings['runs']);
    final wkts = _readInt(innings['wickets']);
    final overs = innings['overString']?.toString() ??
        innings['overs']?.toString() ??
        '0.0';
    final crr =
        innings['crr']?.toString() ?? innings['runRate']?.toString() ?? '';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white12),
      ),
      child: Row(
        children: [
          const Text(
            'TOTAL',
            style: TextStyle(
              color: Colors.white54,
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.5,
            ),
          ),
          const Spacer(),
          Text(
            '$runs-$wkts ($overs)',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w900,
            ),
          ),
          if (crr.isNotEmpty) ...[
            const SizedBox(width: 14),
            Text(
              'CRR $crr',
              style: const TextStyle(
                color: Color(0xFF00C187),
                fontSize: 12,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _battingTable(Map<String, dynamic> innings) {
    final batters = _readList(innings['batters']);
    return _sectionPanel(
      title: 'BATTING',
      child: Column(
        children: [
          _row(const ['BATTER', 'R', 'B', '4S', '6S', 'SR'], isHeader: true),
          for (final b in batters)
            _row([
              b['name']?.toString() ?? '—',
              '${_readInt(b['runs'])}',
              '${_readInt(b['balls'])}',
              '${_readInt(b['fours'])}',
              '${_readInt(b['sixes'])}',
              _fmt(b['strikeRate']),
            ], subtitle: b['dismissal']?.toString()),
        ],
      ),
    );
  }

  Widget _bowlingTable(Map<String, dynamic> innings) {
    final bowlers = _readList(innings['bowlers']);
    return _sectionPanel(
      title: 'BOWLING',
      child: Column(
        children: [
          _row(const ['BOWLER', 'O', 'M', 'R', 'W', 'ER'], isHeader: true),
          for (final b in bowlers)
            _row([
              b['name']?.toString() ?? '—',
              b['overs']?.toString() ?? '0',
              '${_readInt(b['maidens'])}',
              '${_readInt(b['runs'])}',
              '${_readInt(b['wickets'])}',
              _fmt(b['economyRate'] ?? b['economy']),
            ]),
        ],
      ),
    );
  }

  Widget _extrasLine(Map<String, dynamic> innings) {
    final ex = innings['extras'];
    int total = 0;
    String detail = '';
    if (ex is Map) {
      final wides = _readInt(ex['wides']);
      final noBalls = _readInt(ex['noBalls']);
      final byes = _readInt(ex['byes']);
      final legByes = _readInt(ex['legByes']);
      final pen = _readInt(ex['penalty']);
      total = _readInt(ex['total']) == 0
          ? (wides + noBalls + byes + legByes + pen)
          : _readInt(ex['total']);
      final parts = <String>[];
      if (wides > 0) parts.add('wd $wides');
      if (noBalls > 0) parts.add('nb $noBalls');
      if (byes > 0) parts.add('b $byes');
      if (legByes > 0) parts.add('lb $legByes');
      if (pen > 0) parts.add('p $pen');
      detail = parts.join('  •  ');
    } else if (ex is num) {
      total = ex.toInt();
    }
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white12),
      ),
      child: Row(
        children: [
          const Text('EXTRAS',
              style: TextStyle(
                  color: Colors.white54,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.5)),
          const Spacer(),
          if (detail.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(right: 10),
              child: Text(detail,
                  style: const TextStyle(
                      color: Colors.white60,
                      fontSize: 11,
                      fontWeight: FontWeight.w700)),
            ),
          Text('$total',
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }

  Widget _fallOfWickets(Map<String, dynamic> innings) {
    final list = _readList(innings['fallOfWickets'] ??
        innings['fow'] ??
        innings['wicketsTimeline']);
    if (list.isEmpty) return const SizedBox.shrink();
    return _sectionPanel(
      title: 'FALL OF WICKETS',
      child: Column(
        children: [
          _row(const ['', 'SCORE', 'OVER'], isHeader: true),
          for (final w in list)
            _row([
              w['batterName']?.toString() ?? w['player']?.toString() ?? '—',
              '${_readInt(w['score'])} - ${_readInt(w['wicketNumber'] ?? w['wkt'])}',
              w['overs']?.toString() ?? w['over']?.toString() ?? '—',
            ]),
        ],
      ),
    );
  }

  Widget _powerplayBlock(Map<String, dynamic> innings) {
    final list = _readList(innings['powerplays'] ?? innings['powerplay']);
    if (list.isEmpty) return const SizedBox.shrink();
    return _sectionPanel(
      title: 'POWERPLAY',
      child: Column(
        children: [
          _row(const ['TYPE', '', 'OVERS', 'RUNS'], isHeader: true),
          for (final pp in list)
            _row([
              (pp['type']?.toString() ?? 'mandatory').toUpperCase(),
              '',
              '${pp['startOver'] ?? 0}-${pp['endOver'] ?? 0}',
              '${_readInt(pp['runs'])}',
            ]),
        ],
      ),
    );
  }

  Widget _partnershipsBlock(Map<String, dynamic> innings) {
    final list = _readList(innings['partnerships']);
    if (list.isEmpty) return const SizedBox.shrink();
    return _sectionPanel(
      title: 'PARTNERSHIPS',
      child: Column(
        children: [
          for (final p in list)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      '${p['batter1Name'] ?? '—'} '
                      '${_readInt(p['batter1Runs'])}(${_readInt(p['batter1Balls'])})',
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w700),
                    ),
                  ),
                  SizedBox(
                    width: 90,
                    child: Center(
                      child: Text(
                        '${_readInt(p['runs'])}(${_readInt(p['balls'])})',
                        style: const TextStyle(
                            color: Color(0xFF00C187),
                            fontSize: 13,
                            fontWeight: FontWeight.w900),
                      ),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      '${p['batter2Name'] ?? '—'} '
                      '${_readInt(p['batter2Runs'])}(${_readInt(p['batter2Balls'])})',
                      textAlign: TextAlign.end,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  // ── OVERS tab ──────────────────────────────────────────────────────────────

  Widget _buildOversTab() {
    if (_oversLoading && _overs == null) {
      return const Center(
        child:
            CircularProgressIndicator(color: Color(0xFF00C187), strokeWidth: 2),
      );
    }
    if (_oversError != null && _overs == null) {
      return _errorView(_oversError!, () => _loadOvers(_oversInnings));
    }
    final innings = _readList(_overs?['innings']);
    final inningsCount = innings.isNotEmpty ? innings.length : 1;
    // Backend reports inningsNumber as 1-indexed in some payloads and
    // 0-indexed in others. Match against both, AND fall back to positional
    // index so the 2nd-innings tab reads `innings[1]` even when the server
    // returns the list without an inningsNumber field. We do NOT default to
    // innings.first — that's how the 1st-innings data leaked into the
    // 2nd-innings tab.
    Map<String, dynamic> currentInnings = <String, dynamic>{};
    for (int i = 0; i < innings.length; i++) {
      final inn = Map<String, dynamic>.from(innings[i] as Map);
      final raw = inn['inningsNumber'];
      final n = raw is num ? raw.toInt() : null;
      if (n == _oversInnings || (n != null && n + 1 == _oversInnings)) {
        currentInnings = inn;
        break;
      }
    }
    if (currentInnings.isEmpty &&
        _oversInnings - 1 < innings.length &&
        _oversInnings - 1 >= 0) {
      currentInnings =
          Map<String, dynamic>.from(innings[_oversInnings - 1] as Map);
    }
    final overs = _readList(currentInnings['overs']);
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
          child: Row(
            children: [
              for (int i = 0; i < inningsCount.clamp(1, 2); i++) ...[
                if (i > 0) const SizedBox(width: 8),
                Expanded(
                  child: GestureDetector(
                    onTap: () => _loadOvers(i + 1),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: _oversInnings == i + 1
                            ? const Color(0xFF00C187).withValues(alpha: 0.18)
                            : Colors.white.withValues(alpha: 0.04),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: _oversInnings == i + 1
                              ? const Color(0xFF00C187).withValues(alpha: 0.5)
                              : Colors.white12,
                        ),
                      ),
                      child: Text(
                        '${_ordinal(i + 1)} INNINGS',
                        style: TextStyle(
                          color: _oversInnings == i + 1
                              ? const Color(0xFF00C187)
                              : Colors.white70,
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.4,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: overs.isEmpty
              ? _emptyView('No overs yet in this innings.')
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 6, 16, 24),
                  itemCount: overs.length,
                  itemBuilder: (_, i) {
                    // Reverse the list so the most recent over is at the top
                    // — matches the screenshots and the on-field expectation.
                    return _overCard(overs[overs.length - 1 - i]);
                  },
                ),
        ),
      ],
    );
  }

  Widget _overCard(Map<String, dynamic> over) {
    final number = _readInt(over['overNumber'] ?? over['over']);
    final runs = _readInt(over['runs']);
    final wkts = _readInt(over['wickets']);
    final balls = _readList(over['balls'] ?? over['deliveries']);
    final bowlerName = over['bowlerName']?.toString() ??
        (over['bowler'] is Map ? over['bowler']['name']?.toString() : null) ??
        '';
    final battersInOver = balls
        .map((b) =>
            b['batterName']?.toString() ??
            (b['batter'] is Map ? b['batter']['name']?.toString() : null))
        .whereType<String>()
        .toSet()
        .toList();
    final scoreAfter = over['score']?.toString() ??
        '${_readInt(over['totalRuns'])}-${_readInt(over['totalWickets'])}';
    final subtitle = bowlerName.isNotEmpty
        ? 'Ov $number  ·  $bowlerName${battersInOver.isNotEmpty ? ' to ${battersInOver.join(' & ')}' : ''}'
        : 'Ov $number';
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 58,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Ov $number',
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w900)),
                const SizedBox(height: 4),
                Text(scoreAfter,
                    style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 11,
                        fontWeight: FontWeight.w700)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(subtitle,
                    style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                        fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    for (final b in balls) _ballChip(b),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('$runs',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w900)),
              if (wkts > 0)
                Text('$wkts wk${wkts == 1 ? '' : 's'}',
                    style: const TextStyle(
                        color: Color(0xFFEF4444),
                        fontSize: 10,
                        fontWeight: FontWeight.w800)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _ballChip(dynamic raw) {
    final b = raw is Map ? raw : const <String, dynamic>{};
    final isWicket = b['isWicket'] == true;
    final extraType = b['extraType']?.toString();
    final runs = _readInt(b['runs']);
    String label;
    Color bg;
    if (isWicket) {
      // "W" for clean wicket, "W1" / "W4" when the dismissal ball also
      // produced runs (run out off a stroke), matching the screenshot.
      label = runs > 0 ? 'W$runs' : 'W';
      bg = const Color(0xFFEF4444);
    } else if (extraType == 'WIDE') {
      label = runs > 1 ? 'Wd${runs - 1}' : 'Wd';
      bg = const Color(0xFFB45309);
    } else if (extraType == 'NO_BALL') {
      label = runs > 1 ? 'Nb${runs - 1}' : 'Nb';
      bg = const Color(0xFFB45309);
    } else if (extraType == 'BYE') {
      label = 'B$runs';
      bg = const Color(0xFF6B7280);
    } else if (extraType == 'LEG_BYE') {
      label = 'L$runs';
      bg = const Color(0xFF6B7280);
    } else if (runs == 0) {
      label = '·';
      bg = Colors.white.withValues(alpha: 0.08);
    } else if (runs == 4 || runs == 6) {
      label = '$runs';
      bg = const Color(0xFF3B82F6);
    } else {
      label = '$runs';
      bg = Colors.white.withValues(alpha: 0.08);
    }
    return Container(
      width: 28,
      height: 28,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 11,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }

  // ── Shared helpers ─────────────────────────────────────────────────────────

  Widget _sectionPanel({required String title, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                  color: Color(0xFF00C187),
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2)),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }

  Widget _row(List<String> cells, {bool isHeader = false, String? subtitle}) {
    final style = TextStyle(
      color: isHeader ? Colors.white54 : Colors.white,
      fontSize: isHeader ? 10 : 12,
      fontWeight: isHeader ? FontWeight.w800 : FontWeight.w700,
      letterSpacing: isHeader ? 1.2 : 0,
    );
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              for (int i = 0; i < cells.length; i++)
                Expanded(
                  flex: i == 0 ? 4 : 1,
                  child: Text(
                    cells[i],
                    style: style,
                    textAlign: i == 0 ? TextAlign.start : TextAlign.center,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
            ],
          ),
          if (subtitle != null && subtitle.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 2, left: 2),
              child: Text(
                subtitle,
                style: const TextStyle(
                    color: Colors.white38,
                    fontSize: 10,
                    fontStyle: FontStyle.italic),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
        ],
      ),
    );
  }

  Widget _errorView(String msg, VoidCallback onRetry) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(LucideIcons.alertCircle,
                color: Colors.white54, size: 28),
            const SizedBox(height: 12),
            Text(msg,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                    fontWeight: FontWeight.w600)),
            const SizedBox(height: 14),
            OutlinedButton(
              onPressed: onRetry,
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF00C187),
                side: BorderSide(
                    color: const Color(0xFF00C187).withValues(alpha: 0.4)),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text('RETRY',
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.8)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _emptyView(String msg) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Text(msg,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white54, fontSize: 12)),
      ),
    );
  }

  String _ordinal(int n) => switch (n) {
        1 => '1ST',
        2 => '2ND',
        3 => '3RD',
        _ => '${n}TH',
      };

  int _readInt(dynamic v) {
    if (v is num) return v.toInt();
    if (v is String) return int.tryParse(v) ?? 0;
    return 0;
  }

  String _fmt(dynamic v) {
    if (v is num) return v.toStringAsFixed(2);
    if (v is String) {
      final p = double.tryParse(v);
      return p != null ? p.toStringAsFixed(2) : v;
    }
    return '0.00';
  }

  List<Map<String, dynamic>> _readList(dynamic raw) {
    if (raw is! List) return const [];
    return raw
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  List<Map<String, dynamic>> _readInningsList(Map<String, dynamic>? raw) {
    if (raw == null) return const [];
    final innings = raw['innings'];
    if (innings is List) return _readList(innings);
    // Some backend builds nest under `firstInnings` / `secondInnings`.
    final out = <Map<String, dynamic>>[];
    if (raw['firstInnings'] is Map) {
      out.add(Map<String, dynamic>.from(raw['firstInnings'] as Map));
    }
    if (raw['secondInnings'] is Map) {
      out.add(Map<String, dynamic>.from(raw['secondInnings'] as Map));
    }
    return out;
  }
}
