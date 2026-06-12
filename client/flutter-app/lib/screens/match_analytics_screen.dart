import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../services/scoring_service.dart';
import '../services/scoring_socket_service.dart';
import '../widgets/scoring/scoring_theme.dart';

/// Match analytics — 6-tab page (Overview / Live Score / Scorecard /
/// Wagon Wheel / Worm Chart / Timeline). Consumes the analytics payload
/// returned by `/scoring/analytics/:matchId`. Visualizations use
/// `CustomPainter` to avoid pulling in a chart dependency.
class MatchAnalyticsScreen extends StatefulWidget {
  final String? matchId;
  final Map<String, dynamic>? analytics;

  const MatchAnalyticsScreen({
    super.key,
    this.matchId,
    this.analytics,
  });

  @override
  State<MatchAnalyticsScreen> createState() => _MatchAnalyticsScreenState();
}

enum _Tab {
  overview('OVERVIEW', LucideIcons.activity),
  liveScore('LIVE SCORE', LucideIcons.radio),
  scorecard('SCORECARD', LucideIcons.fileText),
  wagonWheel('WAGON WHEEL', LucideIcons.crosshair),
  wormChart('WORM CHART', LucideIcons.trendingUp),
  timeline('TIMELINE', LucideIcons.history);

  final String label;
  final IconData icon;
  const _Tab(this.label, this.icon);
}

class _MatchAnalyticsScreenState extends State<MatchAnalyticsScreen> {
  _Tab _tab = _Tab.overview;
  String _runFilter = 'all'; // all | boundaries | wickets

  // Live state. Initialised from the widget prop (if the caller pre-fetched)
  // and kept fresh by either an explicit refresh or a socket push.
  Map<String, dynamic>? _analytics;
  bool _refreshing = false;
  bool _liveConnected = false;
  bool _matchEnded = false;

  ScoringSocketService? _socket;
  StreamSubscription<void>? _scoreSub;
  StreamSubscription<void>? _endSub;

  @override
  void initState() {
    super.initState();
    _analytics = widget.analytics;
    // If we have an id but no payload yet, kick off the fetch.
    if (_analytics == null && widget.matchId != null) {
      _refresh();
    }
    // Subscribe to score / match-ended events so the charts stay live without
    // user intervention. Each scoreUpdated triggers a fresh /analytics fetch
    // (cheapest reliable way to keep all 6 tabs consistent without merging
    // partial snapshots into the full payload shape).
    if (widget.matchId != null) {
      final socket = ScoringSocketService();
      _socket = socket;
      socket.connect(widget.matchId!);
      _scoreSub = socket.scoreStream.listen((_) {
        _refresh();
      });
      _endSub = socket.matchEndedStream.listen((_) {
        if (!mounted) return;
        setState(() => _matchEnded = true);
        _refresh();
      });
      // Toggle the LIVE pill once the first event lands. We don't get a
      // direct connect callback from the service today; assume connected as
      // soon as we subscribe, and let the disconnect path flip it back if a
      // future iteration adds an explicit connection-state stream.
      _liveConnected = true;
    }
  }

  @override
  void dispose() {
    _scoreSub?.cancel();
    _endSub?.cancel();
    _socket?.disconnect();
    super.dispose();
  }

  Future<void> _refresh() async {
    final id = widget.matchId;
    if (id == null || id.isEmpty || _refreshing) return;
    setState(() => _refreshing = true);
    final res = await ScoringService().getAnalytics(id);
    if (!mounted) return;
    setState(() {
      if (res.ok && res.data != null) {
        _analytics = res.data;
      }
      _refreshing = false;
    });
  }

  Map<String, dynamic>? get _scoring => _analytics?['scoring'] is Map
      ? Map<String, dynamic>.from(_analytics!['scoring'] as Map)
      : null;

  List<Map<String, dynamic>> get _innings {
    final list = _scoring?['innings'];
    if (list is List) {
      return list
          .whereType<Map>()
          .map((m) => Map<String, dynamic>.from(m))
          .toList();
    }
    return const [];
  }

  Map<String, dynamic> get _innings0 =>
      _innings.isNotEmpty ? _innings.first : const {};

  List<Map<String, dynamic>> get _playerStats {
    final list = _scoring?['playerStats'];
    if (list is List) {
      return list
          .whereType<Map>()
          .map((m) => Map<String, dynamic>.from(m))
          .toList();
    }
    return const [];
  }

  List<Map<String, dynamic>> get _timeline {
    final list = _scoring?['timeline'];
    if (list is List) {
      return list
          .whereType<Map>()
          .map((m) => Map<String, dynamic>.from(m))
          .toList();
    }
    return const [];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF050505),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _header(context),
            _tabBar(),
            Expanded(
              child: _analytics == null
                  ? const Center(
                      child:
                          CircularProgressIndicator(color: ScoringTheme.theme),
                    )
                  : _body(),
            ),
          ],
        ),
      ),
    );
  }

  // ── Chrome ─────────────────────────────────────────────────────────────────

  Widget _header(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.6),
        border: Border(
            bottom: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
      ),
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
                color: Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(LucideIcons.arrowLeft,
                  color: Colors.white, size: 18),
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('MATCH ANALYTICS',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.3)),
                SizedBox(height: 2),
                Text('REAL-TIME INSIGHTS',
                    style: TextStyle(
                        color: ScoringTheme.theme,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2.4)),
              ],
            ),
          ),
          _liveBadge(),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              Clipboard.setData(ClipboardData(
                  text: 'kridaz://analytics/${widget.matchId ?? ''}'));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                    content: Text('Analytics link copied'),
                    duration: Duration(seconds: 2)),
              );
            },
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(LucideIcons.share2,
                  color: Colors.white54, size: 16),
            ),
          ),
        ],
      ),
    );
  }

  // Small connection-state pill shown next to the title:
  //   FINAL  → match has ended (locked)
  //   LIVE   → socket subscribed, will refresh on each ball
  //   STATIC → no socket (no matchId, or load-from-extra mode)
  Widget _liveBadge() {
    late final String label;
    late final Color colour;
    if (_matchEnded) {
      label = 'FINAL';
      colour = Colors.white60;
    } else if (_liveConnected) {
      label = 'LIVE';
      colour = ScoringTheme.theme;
    } else {
      label = 'STATIC';
      colour = Colors.white24;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: colour.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: colour.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_liveConnected && !_matchEnded) ...[
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(color: colour, shape: BoxShape.circle),
            ),
            const SizedBox(width: 5),
          ],
          Text(label,
              style: TextStyle(
                  color: colour,
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.4)),
        ],
      ),
    );
  }

  Widget _tabBar() {
    return Container(
      height: 56,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      color: Colors.black,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _Tab.values.length,
        separatorBuilder: (_, __) => const SizedBox(width: 6),
        itemBuilder: (_, i) {
          final t = _Tab.values[i];
          final active = _tab == t;
          return GestureDetector(
            onTap: () {
              HapticFeedback.selectionClick();
              setState(() => _tab = t);
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: const EdgeInsets.symmetric(horizontal: 14),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: active
                    ? ScoringTheme.theme.withValues(alpha: 0.1)
                    : Colors.white.withValues(alpha: 0.03),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                    color: active
                        ? ScoringTheme.theme.withValues(alpha: 0.4)
                        : Colors.white.withValues(alpha: 0.05)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(t.icon,
                      size: 14,
                      color: active
                          ? ScoringTheme.theme
                          : const Color(0xFF888888)),
                  const SizedBox(width: 6),
                  Text(t.label,
                      style: TextStyle(
                          color: active
                              ? ScoringTheme.theme
                              : const Color(0xFF888888),
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.5)),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _body() {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 200),
      child: SingleChildScrollView(
        key: ValueKey(_tab),
        padding: const EdgeInsets.all(16),
        child: switch (_tab) {
          _Tab.overview => _overviewTab(),
          _Tab.liveScore => _liveScoreTab(),
          _Tab.scorecard => _scorecardTab(),
          _Tab.wagonWheel => _wagonWheelTab(),
          _Tab.wormChart => _wormChartTab(),
          _Tab.timeline => _timelineTab(),
        },
      ),
    );
  }

  // ── Tab: Overview ─────────────────────────────────────────────────────────

  Widget _overviewTab() {
    final i0 = _innings0;
    final legalBalls = (i0['legalBalls'] as num?)?.toInt() ?? 0;
    final totalRuns = (i0['totalRuns'] as num?)?.toInt() ?? 0;
    final totalWickets = (i0['totalWickets'] as num?)?.toInt() ?? 0;
    final crr = legalBalls > 0
        ? (totalRuns / legalBalls * 6).toStringAsFixed(2)
        : '0.00';
    final overs = '${legalBalls ~/ 6}.${legalBalls % 6}';
    final fours = _playerStats.fold<int>(
        0, (a, p) => a + ((p['battingFours'] as num?)?.toInt() ?? 0));
    final sixes = _playerStats.fold<int>(
        0, (a, p) => a + ((p['battingSixes'] as num?)?.toInt() ?? 0));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _heroScoreCard(totalRuns, totalWickets, overs, crr),
        const SizedBox(height: 16),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.6,
          children: [
            _statCard(LucideIcons.target, 'RUN RATE', crr, ScoringTheme.theme),
            _statCard(
                LucideIcons.clock, 'OVERS', overs, ScoringTheme.accentSky),
            _statCard(
                LucideIcons.zap, 'FOURS', '$fours', const Color(0xFF3B82F6)),
            _statCard(
                LucideIcons.flame, 'SIXES', '$sixes', const Color(0xFFA855F7)),
          ],
        ),
        const SizedBox(height: 16),
        _topPerformers(),
      ],
    );
  }

  Widget _heroScoreCard(
      int totalRuns, int totalWickets, String overs, String crr) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            ScoringTheme.theme.withValues(alpha: 0.08),
            Colors.transparent,
          ],
        ),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('1ST INNINGS',
              style: TextStyle(
                  color: ScoringTheme.theme,
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2.4)),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('$totalRuns',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 56,
                      fontWeight: FontWeight.w900,
                      height: 0.9)),
              Text('/$totalWickets',
                  style: const TextStyle(
                      color: Colors.white54,
                      fontSize: 38,
                      fontWeight: FontWeight.w900,
                      height: 1)),
              const Spacer(),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(overs,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w900)),
                  Text('OVERS • CRR $crr',
                      style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 2)),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _statCard(IconData icon, String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, color: color, size: 18),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(label,
                  style: const TextStyle(
                      color: Colors.white54,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.5)),
              const SizedBox(height: 2),
              Text(value,
                  style: TextStyle(
                      color: color,
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.3)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _topPerformers() {
    final batters = _playerStats
        .where((p) =>
            ((p['battingBalls'] as num?)?.toInt() ?? 0) > 0 ||
            ((p['battingRuns'] as num?)?.toInt() ?? 0) > 0)
        .toList()
      ..sort((a, b) => ((b['battingRuns'] as num?)?.toInt() ?? 0)
          .compareTo((a['battingRuns'] as num?)?.toInt() ?? 0));

    final bowlers = _playerStats
        .where((p) => ((p['bowlingBalls'] as num?)?.toInt() ?? 0) > 0)
        .toList()
      ..sort((a, b) => ((b['bowlingWickets'] as num?)?.toInt() ?? 0)
          .compareTo((a['bowlingWickets'] as num?)?.toInt() ?? 0));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('TOP BATTERS',
            style: TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w900,
                letterSpacing: 2)),
        const SizedBox(height: 8),
        if (batters.isEmpty)
          _emptyState('NO BATTING YET')
        else
          ...batters.take(3).map((b) {
            final runs = (b['battingRuns'] as num?)?.toInt() ?? 0;
            final balls = (b['battingBalls'] as num?)?.toInt() ?? 0;
            final sr =
                balls > 0 ? (runs / balls * 100).toStringAsFixed(2) : '0.00';
            return _perfRow(
                name: (b['name'] ?? 'Unknown').toString(),
                primary: '$runs',
                secondary: '($balls) • SR $sr',
                color: ScoringTheme.theme);
          }),
        const SizedBox(height: 20),
        const Text('TOP BOWLERS',
            style: TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w900,
                letterSpacing: 2)),
        const SizedBox(height: 8),
        if (bowlers.isEmpty)
          _emptyState('NO BOWLING YET')
        else
          ...bowlers.take(3).map((b) {
            final wkts = (b['bowlingWickets'] as num?)?.toInt() ?? 0;
            final runs = (b['bowlingRuns'] as num?)?.toInt() ?? 0;
            final balls = (b['bowlingBalls'] as num?)?.toInt() ?? 0;
            final overs = '${balls ~/ 6}.${balls % 6}';
            return _perfRow(
                name: (b['name'] ?? 'Unknown').toString(),
                primary: '$wkts-$runs',
                secondary: '$overs OVERS',
                color: const Color(0xFF3B82F6));
          }),
      ],
    );
  }

  Widget _perfRow({
    required String name,
    required String primary,
    required String secondary,
    required Color color,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.02),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?',
                style: TextStyle(
                    color: color, fontSize: 14, fontWeight: FontWeight.w900)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(name.toUpperCase(),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w900)),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(primary,
                  style: TextStyle(
                      color: color, fontSize: 16, fontWeight: FontWeight.w900)),
              Text(secondary,
                  style: const TextStyle(
                      color: Colors.white54,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1)),
            ],
          ),
        ],
      ),
    );
  }

  // ── Tab: Live Score ───────────────────────────────────────────────────────

  Widget _liveScoreTab() {
    final i0 = _innings0;
    final totalRuns = (i0['totalRuns'] as num?)?.toInt() ?? 0;
    final totalWickets = (i0['totalWickets'] as num?)?.toInt() ?? 0;
    final legalBalls = (i0['legalBalls'] as num?)?.toInt() ?? 0;
    final overs = '${legalBalls ~/ 6}.${legalBalls % 6}';
    final crr = legalBalls > 0
        ? (totalRuns / legalBalls * 6).toStringAsFixed(2)
        : '0.00';
    final maxOvers = (_scoring?['oversPerInnings'] as num?)?.toInt() ?? 20;

    // Striker / non-striker / bowler from playerStats by ID
    final strikerId = _scoring?['strikerId']?.toString();
    final nonStrikerId = _scoring?['nonStrikerId']?.toString();
    final bowlerId = _scoring?['bowlerId']?.toString();
    final striker = _playerStats.firstWhere(
        (p) => p['userId']?.toString() == strikerId,
        orElse: () => const {});
    final nonStriker = _playerStats.firstWhere(
        (p) => p['userId']?.toString() == nonStrikerId,
        orElse: () => const {});
    final bowler = _playerStats.firstWhere(
        (p) => p['userId']?.toString() == bowlerId,
        orElse: () => const {});

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                ScoringTheme.theme.withValues(alpha: 0.15),
                Colors.transparent,
              ],
            ),
            borderRadius: BorderRadius.circular(8),
            border:
                Border.all(color: ScoringTheme.theme.withValues(alpha: 0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: Color(0xFFEF4444),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Text('LIVE',
                      style: TextStyle(
                          color: Color(0xFFEF4444),
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2)),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('$totalRuns/$totalWickets',
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 56,
                          fontWeight: FontWeight.w900,
                          height: 0.9)),
                  const Spacer(),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('CRR $crr',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w900)),
                      Text('$overs / $maxOvers OVERS',
                          style: const TextStyle(
                              color: Colors.white54,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1)),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
                child: _activeBatter('STRIKER', striker,
                    accent: ScoringTheme.theme, isStriker: true)),
            const SizedBox(width: 8),
            Expanded(
                child: _activeBatter('NON-STRIKER', nonStriker,
                    accent: Colors.white60)),
          ],
        ),
        const SizedBox(height: 16),
        _activeBowler(bowler),
      ],
    );
  }

  Widget _activeBatter(String label, Map<String, dynamic> stat,
      {required Color accent, bool isStriker = false}) {
    final name = (stat['name'] ?? '—').toString();
    final runs = (stat['battingRuns'] as num?)?.toInt() ?? 0;
    final balls = (stat['battingBalls'] as num?)?.toInt() ?? 0;
    final fours = (stat['battingFours'] as num?)?.toInt() ?? 0;
    final sixes = (stat['battingSixes'] as num?)?.toInt() ?? 0;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: accent.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: accent.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (isStriker)
                const Padding(
                  padding: EdgeInsets.only(right: 4),
                  child: Text('🏏', style: TextStyle(fontSize: 12)),
                ),
              Text(label,
                  style: TextStyle(
                      color: accent,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.8)),
            ],
          ),
          const SizedBox(height: 8),
          Text(name.toUpperCase(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w900)),
          const SizedBox(height: 6),
          Text('$runs ($balls)',
              style: TextStyle(
                  color: accent, fontSize: 22, fontWeight: FontWeight.w900)),
          const SizedBox(height: 4),
          Text('4s: $fours • 6s: $sixes',
              style: const TextStyle(
                  color: Colors.white54,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1)),
        ],
      ),
    );
  }

  Widget _activeBowler(Map<String, dynamic> stat) {
    final name = (stat['name'] ?? '—').toString();
    final wkts = (stat['bowlingWickets'] as num?)?.toInt() ?? 0;
    final runs = (stat['bowlingRuns'] as num?)?.toInt() ?? 0;
    final balls = (stat['bowlingBalls'] as num?)?.toInt() ?? 0;
    final overs = '${balls ~/ 6}.${balls % 6}';
    final econ = balls > 0 ? (runs / balls * 6).toStringAsFixed(2) : '0.00';
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF3B82F6).withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(8),
        border:
            Border.all(color: const Color(0xFF3B82F6).withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('BOWLING',
                    style: TextStyle(
                        color: Color(0xFF60A5FA),
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.8)),
                const SizedBox(height: 8),
                Text(name.toUpperCase(),
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w900)),
                const SizedBox(height: 4),
                Text('$overs overs • ECON $econ',
                    style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1)),
              ],
            ),
          ),
          Text('$wkts/$runs',
              style: const TextStyle(
                  color: Color(0xFF60A5FA),
                  fontSize: 28,
                  fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }

  // ── Tab: Scorecard ────────────────────────────────────────────────────────

  Widget _scorecardTab() {
    final batters = _playerStats
        .where((p) =>
            ((p['battingBalls'] as num?)?.toInt() ?? 0) > 0 ||
            ((p['battingRuns'] as num?)?.toInt() ?? 0) > 0)
        .toList()
      ..sort((a, b) => ((b['battingRuns'] as num?)?.toInt() ?? 0)
          .compareTo((a['battingRuns'] as num?)?.toInt() ?? 0));
    final bowlers = _playerStats
        .where((p) => ((p['bowlingBalls'] as num?)?.toInt() ?? 0) > 0)
        .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _scorecardTable(
          title: 'BATTING',
          headers: const ['BATTER', 'R', 'B', '4s', '6s', 'SR'],
          rows: batters.map((b) {
            final runs = (b['battingRuns'] as num?)?.toInt() ?? 0;
            final balls = (b['battingBalls'] as num?)?.toInt() ?? 0;
            final fours = (b['battingFours'] as num?)?.toInt() ?? 0;
            final sixes = (b['battingSixes'] as num?)?.toInt() ?? 0;
            final sr =
                balls > 0 ? (runs / balls * 100).toStringAsFixed(1) : '0.0';
            return [
              (b['name'] ?? 'Unknown').toString(),
              '$runs',
              '$balls',
              '$fours',
              '$sixes',
              sr,
            ];
          }).toList(),
        ),
        const SizedBox(height: 20),
        _scorecardTable(
          title: 'BOWLING',
          headers: const ['BOWLER', 'O', 'R', 'W', 'ECON'],
          rows: bowlers.map((b) {
            final wkts = (b['bowlingWickets'] as num?)?.toInt() ?? 0;
            final runs = (b['bowlingRuns'] as num?)?.toInt() ?? 0;
            final balls = (b['bowlingBalls'] as num?)?.toInt() ?? 0;
            final overs = '${balls ~/ 6}.${balls % 6}';
            final econ =
                balls > 0 ? (runs / balls * 6).toStringAsFixed(2) : '0.00';
            return [
              (b['name'] ?? 'Unknown').toString(),
              overs,
              '$runs',
              '$wkts',
              econ,
            ];
          }).toList(),
        ),
      ],
    );
  }

  Widget _scorecardTable({
    required String title,
    required List<String> headers,
    required List<List<String>> rows,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.02),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                  color: ScoringTheme.theme,
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2.4)),
          const SizedBox(height: 12),
          if (rows.isEmpty)
            _emptyState('NO DATA YET')
          else ...[
            _tableHeader(headers),
            const SizedBox(height: 8),
            ...rows.map(_tableRow),
          ],
        ],
      ),
    );
  }

  Widget _tableHeader(List<String> headers) {
    return Row(
      children: headers.asMap().entries.map((e) {
        final isName = e.key == 0;
        return Expanded(
          flex: isName ? 3 : 1,
          child: Align(
            alignment: isName ? Alignment.centerLeft : Alignment.centerRight,
            child: Text(e.value,
                style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.5)),
          ),
        );
      }).toList(),
    );
  }

  Widget _tableRow(List<String> cells) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: cells.asMap().entries.map((e) {
          final isName = e.key == 0;
          return Expanded(
            flex: isName ? 3 : 1,
            child: Align(
              alignment: isName ? Alignment.centerLeft : Alignment.centerRight,
              child: Text(e.value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                      color: isName ? Colors.white : Colors.white70,
                      fontSize: 12,
                      fontWeight: isName ? FontWeight.w900 : FontWeight.w700)),
            ),
          );
        }).toList(),
      ),
    );
  }

  // ── Tab: Wagon Wheel ──────────────────────────────────────────────────────

  Widget _wagonWheelTab() {
    final shots = _timeline
        .where((b) {
          if (_runFilter == 'boundaries') {
            final r = (b['runs'] as num?)?.toInt() ?? 0;
            return r == 4 || r == 6;
          }
          if (_runFilter == 'wickets') return b['isWicket'] == true;
          return true;
        })
        .map((b) => (
              runs: (b['runs'] as num?)?.toInt() ?? 0,
              isWicket: b['isWicket'] == true,
              position:
                  (b['fieldingPosition'] ?? b['shotPosition'] ?? '').toString(),
            ))
        .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _filterChips(
          [
            ('all', 'All'),
            ('boundaries', 'Boundaries'),
            ('wickets', 'Wickets'),
          ],
          _runFilter,
          (v) => setState(() => _runFilter = v),
        ),
        const SizedBox(height: 16),
        AspectRatio(
          aspectRatio: 1,
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
            ),
            child: CustomPaint(
              painter: _WagonWheelStatsPainter(shots),
            ),
          ),
        ),
        const SizedBox(height: 16),
        _wagonStats(shots),
      ],
    );
  }

  Widget _wagonStats(List<({int runs, bool isWicket, String position})> shots) {
    final boundaries = shots.where((s) => s.runs == 4 || s.runs == 6).length;
    final wickets = shots.where((s) => s.isWicket).length;
    final dots = shots.where((s) => s.runs == 0 && !s.isWicket).length;
    return Row(
      children: [
        Expanded(
            child: _statCard(LucideIcons.zap, 'BOUNDARIES', '$boundaries',
                ScoringTheme.theme)),
        const SizedBox(width: 8),
        Expanded(
            child: _statCard(LucideIcons.target, 'WICKETS', '$wickets',
                const Color(0xFFEF4444))),
        const SizedBox(width: 8),
        Expanded(
            child:
                _statCard(LucideIcons.circle, 'DOTS', '$dots', Colors.white70)),
      ],
    );
  }

  // ── Tab: Worm Chart ───────────────────────────────────────────────────────

  Widget _wormChartTab() {
    // Cumulative runs per over.
    final overRuns = <int, int>{};
    for (final ball in _timeline) {
      final over = (ball['over'] as num?)?.toInt() ?? 0;
      final r = (ball['runs'] as num?)?.toInt() ?? 0;
      overRuns[over] = (overRuns[over] ?? 0) + r;
    }
    final entries = overRuns.entries.toList()
      ..sort((a, b) => a.key.compareTo(b.key));
    int cumulative = 0;
    final points = entries.map((e) {
      cumulative += e.value;
      return (over: e.key, total: cumulative);
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.02),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('CUMULATIVE RUNS / OVER',
                  style: TextStyle(
                      color: ScoringTheme.theme,
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2.4)),
              const SizedBox(height: 12),
              SizedBox(
                height: 220,
                child: points.isEmpty
                    ? _emptyState('NO OVERS BOWLED YET')
                    : CustomPaint(
                        painter: _WormChartPainter(points),
                        size: Size.infinite,
                      ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _runsPerOverBars(entries),
      ],
    );
  }

  Widget _runsPerOverBars(List<MapEntry<int, int>> entries) {
    final maxRuns = entries.fold<int>(0, (m, e) => e.value > m ? e.value : m);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.02),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('RUNS PER OVER',
              style: TextStyle(
                  color: ScoringTheme.accentSky,
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2.4)),
          const SizedBox(height: 12),
          if (entries.isEmpty)
            _emptyState('NO DATA YET')
          else
            ...entries.map((e) {
              final w = maxRuns > 0 ? e.value / maxRuns : 0.0;
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    SizedBox(
                      width: 36,
                      child: Text('OV ${e.key + 1}',
                          style: const TextStyle(
                              color: Colors.white54,
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1)),
                    ),
                    Expanded(
                      child: Stack(
                        children: [
                          Container(
                            height: 18,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.04),
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                          FractionallySizedBox(
                            widthFactor: w,
                            child: Container(
                              height: 18,
                              decoration: BoxDecoration(
                                color: ScoringTheme.accentSky
                                    .withValues(alpha: 0.6),
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(
                      width: 30,
                      child: Text('${e.value}',
                          textAlign: TextAlign.end,
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w900)),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  // ── Tab: Timeline ─────────────────────────────────────────────────────────

  Widget _timelineTab() {
    final reversed = _timeline.reversed.toList();
    if (reversed.isEmpty) {
      return _emptyState('NO DELIVERIES YET');
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: reversed.map(_timelineRow).toList(),
    );
  }

  Widget _timelineRow(Map<String, dynamic> b) {
    final isWicket = b['isWicket'] == true;
    final isExtra = b['isExtra'] == true;
    final runs = (b['runs'] as num?)?.toInt() ?? 0;
    final over = (b['over'] as num?)?.toInt() ?? 0;
    final ball = (b['ball'] as num?)?.toInt() ?? 0;
    final extraType = (b['extraType'] ?? '').toString();
    final wicketType = (b['wicketType'] ?? '').toString();
    final batter = (b['batter'] is Map)
        ? (b['batter']['name'] ?? 'Batter').toString()
        : '—';
    final bowler = (b['bowler'] is Map)
        ? (b['bowler']['name'] ?? 'Bowler').toString()
        : '—';

    Color bg;
    String label;
    if (isWicket) {
      bg = const Color(0xFFDC2626);
      label = 'W';
    } else if (isExtra) {
      bg = const Color(0xFFEAB308);
      label = extraType == 'WIDE'
          ? 'Wd'
          : (extraType == 'NO_BALL' ? 'Nb' : '$runs');
    } else if (runs == 6) {
      bg = const Color(0xFFA855F7);
      label = '6';
    } else if (runs == 4) {
      bg = const Color(0xFF3B82F6);
      label = '4';
    } else {
      bg = Colors.white.withValues(alpha: 0.1);
      label = '$runs';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
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
            decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
            child: Text(label,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w900)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(batter.toUpperCase(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w900)),
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 6),
                      child: Text('VS',
                          style: TextStyle(
                              color: Color(0xFF666666),
                              fontSize: 8,
                              fontWeight: FontWeight.w900)),
                    ),
                    Flexible(
                      child: Text(bowler.toUpperCase(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              color: Colors.white54,
                              fontSize: 11,
                              fontWeight: FontWeight.w900)),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                    isWicket
                        ? 'OUT — $wicketType'
                        : isExtra
                            ? '$extraType + $runs RUNS'
                            : '$runs RUNS',
                    style: const TextStyle(
                        color: Color(0xFF888888),
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1)),
              ],
            ),
          ),
          Text('$over.$ball',
              style: const TextStyle(
                  color: Colors.white38,
                  fontSize: 11,
                  fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }

  // ── Shared ────────────────────────────────────────────────────────────────

  Widget _filterChips(List<(String, String)> options, String selected,
      void Function(String) onSelect) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: options.map((o) {
          final active = selected == o.$1;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () {
                HapticFeedback.selectionClick();
                onSelect(o.$1);
              },
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: active
                      ? ScoringTheme.theme
                      : Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(o.$2.toUpperCase(),
                    style: TextStyle(
                        color: active ? Colors.black : Colors.white54,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2)),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _emptyState(String label) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 40),
      alignment: Alignment.center,
      child: Text(label,
          style: const TextStyle(
              color: Colors.white38,
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 2.4)),
    );
  }
}

// ─── Painters ────────────────────────────────────────────────────────────────

class _WagonWheelStatsPainter extends CustomPainter {
  final List<({int runs, bool isWicket, String position})> shots;

  _WagonWheelStatsPainter(this.shots);

  static const _bg = Color(0xFF141E18);
  static const _ring = Color(0xFF1F3325);
  static const _outer = Color(0xFF165133);
  static const _pitchFill = Color(0xFF2E4A35);
  static const _pitchStroke = Color(0xFF417351);

  @override
  void paint(Canvas canvas, Size size) {
    final c = Offset(size.width / 2, size.height / 2);
    final r = size.width / 2 - 6;

    canvas.drawCircle(c, r, Paint()..color = _bg);
    canvas.drawCircle(
        c,
        r,
        Paint()
          ..style = PaintingStyle.stroke
          ..color = _outer
          ..strokeWidth = 3);
    canvas.drawCircle(
        c,
        r * 0.66,
        Paint()
          ..style = PaintingStyle.stroke
          ..color = _ring
          ..strokeWidth = 1);
    canvas.drawCircle(
        c,
        r * 0.33,
        Paint()
          ..style = PaintingStyle.stroke
          ..color = _ring
          ..strokeWidth = 1);

    final sectorPaint = Paint()
      ..color = _ring
      ..strokeWidth = 1;
    for (int i = 0; i < 8; i++) {
      final angle = (i * 45) * pi / 180 - pi / 2;
      canvas.drawLine(
          c, c + Offset(cos(angle) * r, sin(angle) * r), sectorPaint);
    }

    // Pitch
    final pitchRect =
        Rect.fromCenter(center: c, width: r * 0.16, height: r * 0.4);
    canvas.drawRRect(
        RRect.fromRectAndRadius(pitchRect, const Radius.circular(3)),
        Paint()..color = _pitchFill);
    canvas.drawRRect(
        RRect.fromRectAndRadius(pitchRect, const Radius.circular(3)),
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.5
          ..color = _pitchStroke);

    // Plot each shot as a line from pitch centre to its computed coordinate.
    for (final s in shots) {
      final coord = _coordFromPosition(c, r, s.position);
      Color colour;
      if (s.isWicket) {
        colour = const Color(0xFFEF4444);
      } else if (s.runs == 6) {
        colour = const Color(0xFFA855F7);
      } else if (s.runs == 4) {
        colour = const Color(0xFF3B82F6);
      } else {
        colour = Colors.white.withValues(alpha: 0.5);
      }
      final paint = Paint()
        ..color = colour
        ..strokeWidth = 2
        ..strokeCap = StrokeCap.round;
      canvas.drawLine(c, coord, paint);
      canvas.drawCircle(coord, 4, Paint()..color = colour);
    }
  }

  Offset _coordFromPosition(Offset c, double r, String pos) {
    final n = pos.trim().toUpperCase();
    double angleDeg;
    double rFrac;
    if (n.contains('LONG_OFF') || n == 'LONG_OFF') {
      (angleDeg, rFrac) = (315, 0.85);
    } else if (n.contains('LONG_ON')) {
      (angleDeg, rFrac) = (0, 0.85);
    } else if (n.contains('DEEP_COVER')) {
      (angleDeg, rFrac) = (285, 0.85);
    } else if (n.contains('DEEP_POINT')) {
      (angleDeg, rFrac) = (255, 0.85);
    } else if (n.contains('THIRD_MAN')) {
      (angleDeg, rFrac) = (210, 0.85);
    } else if (n.contains('DEEP_FINE_LEG')) {
      (angleDeg, rFrac) = (150, 0.85);
    } else if (n.contains('DEEP_SQUARE_LEG')) {
      (angleDeg, rFrac) = (105, 0.85);
    } else if (n.contains('DEEP_MID_WICKET')) {
      (angleDeg, rFrac) = (60, 0.85);
    } else {
      // Spread unplotted shots in a stable but varied ring so dots
      // don't all stack at the same spot.
      final salt = pos.hashCode;
      angleDeg = (salt % 360).toDouble();
      rFrac = 0.4;
    }
    final angle = angleDeg * pi / 180 - pi / 2;
    return c + Offset(cos(angle) * r * rFrac, sin(angle) * r * rFrac);
  }

  @override
  bool shouldRepaint(_WagonWheelStatsPainter old) =>
      old.shots.length != shots.length;
}

class _WormChartPainter extends CustomPainter {
  final List<({int over, int total})> points;
  _WormChartPainter(this.points);

  @override
  void paint(Canvas canvas, Size size) {
    if (points.isEmpty) return;
    final maxOver = points.last.over.toDouble();
    final maxTotal = points.last.total.toDouble();
    if (maxOver == 0 || maxTotal == 0) return;

    // Grid lines
    final gridPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.05)
      ..strokeWidth = 1;
    for (int i = 1; i < 4; i++) {
      final y = size.height * i / 4;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    // Path
    final path = Path();
    final fill = Path();
    for (int i = 0; i < points.length; i++) {
      final p = points[i];
      final x = (p.over / maxOver) * size.width;
      final y = size.height - (p.total / maxTotal) * size.height;
      if (i == 0) {
        path.moveTo(x, y);
        fill.moveTo(x, size.height);
        fill.lineTo(x, y);
      } else {
        path.lineTo(x, y);
        fill.lineTo(x, y);
      }
    }
    fill.lineTo(size.width, size.height);
    fill.close();

    canvas.drawPath(
      fill,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            ScoringTheme.theme.withValues(alpha: 0.3),
            ScoringTheme.theme.withValues(alpha: 0.0),
          ],
        ).createShader(Offset.zero & size),
    );

    canvas.drawPath(
      path,
      Paint()
        ..color = ScoringTheme.theme
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5
        ..strokeJoin = StrokeJoin.round,
    );

    // Dots
    final dotPaint = Paint()..color = ScoringTheme.theme;
    for (final p in points) {
      final x = (p.over / maxOver) * size.width;
      final y = size.height - (p.total / maxTotal) * size.height;
      canvas.drawCircle(Offset(x, y), 3, dotPaint);
    }
  }

  @override
  bool shouldRepaint(_WormChartPainter old) =>
      old.points.length != points.length;
}
