import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/app_colors.dart';
import '../core/util/image_url.dart';
import '../models/scoring_models.dart';
import '../services/scoring_service.dart';
import '../services/scoring_socket_service.dart';

/// Read-only live scoreboard. Loads an initial snapshot over HTTP then
/// subscribes to socket updates for real-time score changes.
class LiveScoreboardScreen extends StatefulWidget {
  final String matchId;

  const LiveScoreboardScreen({super.key, required this.matchId});

  @override
  State<LiveScoreboardScreen> createState() => _LiveScoreboardScreenState();
}

class _LiveScoreboardScreenState extends State<LiveScoreboardScreen> {
  final _service = ScoringService();
  final _socket = ScoringSocketService();

  LiveScoreSnapshot? _snap;
  bool _loading = true;
  String? _error;
  bool _ended = false;
  Map<String, dynamic>? _analytics;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final res = await _service.getLiveScore(widget.matchId);
    if (!mounted) return;
    setState(() {
      _loading = false;
      if (res.ok) {
        _snap = res.data;
        _ended = res.data?.isComplete ?? false;
      } else {
        final raw = (res.error ?? '').toLowerCase();
        _error = (raw.contains('not found') || raw.contains('no live'))
            ? "Scoring hasn't started for this match yet.\nCheck back once the match goes live."
            : res.error;
      }
    });
    if (_ended) _loadAnalytics();
    _connectSocket();
  }

  Future<void> _loadAnalytics() async {
    if (_analytics != null) return;
    final res = await _service.getAnalytics(widget.matchId);
    if (!mounted || !res.ok) return;
    final a = res.data?['analytics'];
    if (a is Map) {
      setState(() => _analytics = Map<String, dynamic>.from(a));
    }
  }

  Future<void> _connectSocket() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    _socket.connect(widget.matchId, token: token);
    _socket.scoreStream.listen((snap) {
      if (!mounted) return;
      setState(() {
        _snap = snap;
        if (snap.isComplete) _ended = true;
      });
      if (snap.isComplete) _loadAnalytics();
    });
    _socket.matchEndedStream.listen((_) {
      if (!mounted) return;
      setState(() => _ended = true);
      _loadAnalytics();
    });
  }

  @override
  void dispose() {
    _socket.leaveCurrentMatch();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if ((_snap?.isLive ?? false) && !_ended) ...[
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: AppColors.errorRed,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
            ],
            Text(
              _ended ? 'Result' : 'Live',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w700,
                fontFamily: 'Poppins',
              ),
            ),
          ],
        ),
        centerTitle: true,
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary))
          : _error != null
              ? _ErrorView(message: _error!, onRetry: _bootstrap)
              : _snap == null
                  ? const Center(
                      child: Text('No live score',
                          style: TextStyle(color: Colors.white54)))
                  : _buildBody(_snap!),
    );
  }

  Widget _buildBody(LiveScoreSnapshot s) {
    return RefreshIndicator(
      color: AppColors.primary,
      backgroundColor: Colors.black,
      onRefresh: _bootstrap,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 40),
        children: [
          if (s.matchName != null && s.matchName!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                s.matchName!,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.45),
                  fontSize: 12,
                  fontFamily: 'Poppins',
                ),
              ),
            ),
          _scoreCard(s),
          const SizedBox(height: 16),
          if (s.batters.isNotEmpty) _battersCard(s),
          if (s.bowler != null) ...[
            const SizedBox(height: 12),
            _bowlerCard(s.bowler!),
          ],
          const SizedBox(height: 16),
          _recentBalls(s),
          if (_ended && _analytics != null) ...[
            const SizedBox(height: 20),
            _analyticsCard(_analytics!),
          ],
        ],
      ),
    );
  }

  Widget _analyticsCard(Map<String, dynamic> a) {
    final mvp = a['mvp'];
    final performers =
        (a['topPerformers'] as List?)?.whereType<Map>().toList() ?? const [];
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(LucideIcons.trophy, color: AppColors.accentGold, size: 18),
              SizedBox(width: 8),
              Text('Match awards',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Poppins')),
            ],
          ),
          if (mvp is Map) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Builder(builder: (_) {
                  final mvpPic = mvp['profilePicture']?.toString();
                  final hasPic = isHttpUrl(mvpPic);
                  return CircleAvatar(
                    radius: 18,
                    backgroundColor:
                        AppColors.accentGold.withValues(alpha: 0.15),
                    backgroundImage: hasPic ? NetworkImage(mvpPic!) : null,
                    child: hasPic
                        ? null
                        : const Icon(LucideIcons.star,
                            color: AppColors.accentGold, size: 18),
                  );
                }),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text((mvp['name'] ?? 'Player').toString(),
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              fontFamily: 'Poppins')),
                      const Text('Player of the Match',
                          style: TextStyle(
                              color: AppColors.accentGold,
                              fontSize: 11,
                              fontFamily: 'Poppins')),
                    ],
                  ),
                ),
              ],
            ),
          ],
          if (performers.length > 1) ...[
            const SizedBox(height: 14),
            Text('Top performers',
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.45),
                    fontSize: 12,
                    fontFamily: 'Poppins')),
            const SizedBox(height: 8),
            ...performers.take(3).map((p) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 3),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text((p['name'] ?? 'Player').toString(),
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontFamily: 'Poppins'),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis),
                      ),
                      Text('${p['points'] ?? 0} pts',
                          style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.6),
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              fontFamily: 'Poppins')),
                    ],
                  ),
                )),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              _statBadge('${a['totalFours'] ?? 0}', 'Fours'),
              const SizedBox(width: 10),
              _statBadge('${a['totalSixes'] ?? 0}', 'Sixes'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _statBadge(String value, String label) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            Text(value,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    fontFamily: 'Poppins')),
            const SizedBox(width: 6),
            Text(label,
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.5),
                    fontSize: 12,
                    fontFamily: 'Poppins')),
          ],
        ),
      );

  Widget _scoreCard(LiveScoreSnapshot s) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.backgroundCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            s.battingTeamName,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 15,
              fontWeight: FontWeight.w700,
              fontFamily: 'Poppins',
            ),
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                '${s.runs}-${s.wickets}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 36,
                  fontWeight: FontWeight.w800,
                  fontFamily: 'Poppins',
                ),
              ),
              const SizedBox(width: 10),
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(
                  '(${s.overString})',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.55),
                    fontSize: 16,
                    fontFamily: 'Poppins',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              _chip('CRR ${s.crr}'),
              if (s.rrr != null) ...[
                const SizedBox(width: 8),
                _chip('RRR ${s.rrr}'),
              ],
            ],
          ),
          if (s.runsNeeded != null && s.ballsRemaining != null && !_ended) ...[
            const SizedBox(height: 12),
            Text(
              'Need ${s.runsNeeded} runs in ${s.ballsRemaining} balls',
              style: const TextStyle(
                color: AppColors.accentBlueLight,
                fontSize: 13,
                fontWeight: FontWeight.w600,
                fontFamily: 'Poppins',
              ),
            ),
          ],
          if (_ended && s.result != null) ...[
            const SizedBox(height: 12),
            Text(
              s.result!,
              style: const TextStyle(
                color: AppColors.accentLime,
                fontSize: 14,
                fontWeight: FontWeight.w700,
                fontFamily: 'Poppins',
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _chip(String text) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          text,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.75),
            fontSize: 12,
            fontWeight: FontWeight.w600,
            fontFamily: 'Poppins',
          ),
        ),
      );

  Widget _battersCard(LiveScoreSnapshot s) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              const Expanded(
                child: Text('Batter',
                    style: TextStyle(
                        color: Colors.white38,
                        fontSize: 11,
                        fontFamily: 'Poppins')),
              ),
              _hdr('R'),
              _hdr('B'),
              _hdr('4s'),
              _hdr('6s'),
              _hdr('SR', wide: true),
            ],
          ),
          const SizedBox(height: 8),
          ...s.batters.map((b) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        b.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'Poppins',
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    _cell('${b.runs}', bold: true),
                    _cell('${b.balls}'),
                    _cell('${b.fours}'),
                    _cell('${b.sixes}'),
                    _cell(b.strikeRate.toStringAsFixed(1), wide: true),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Widget _bowlerCard(BowlerStat b) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Row(
        children: [
          const Icon(Icons.sports_cricket,
              color: AppColors.accentBlueLight, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              b.name,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w600,
                fontFamily: 'Poppins',
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Text(
            '${b.wickets}-${b.runs}  (${b.oversString})',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.w700,
              fontFamily: 'Poppins',
            ),
          ),
        ],
      ),
    );
  }

  Widget _recentBalls(LiveScoreSnapshot s) {
    if (s.last6Balls.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'This over',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.45),
            fontSize: 12,
            fontFamily: 'Poppins',
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: s.last6Balls.map(_ballChip).toList(),
        ),
      ],
    );
  }

  Widget _ballChip(TimelineBall b) {
    Color bg;
    Color fg = Colors.white;
    switch (b.type) {
      case 'wicket':
        bg = AppColors.errorRed;
        break;
      case 'boundary':
        bg = AppColors.accentLime;
        fg = Colors.black;
        break;
      default:
        bg = Colors.white.withValues(alpha: 0.10);
    }
    return Container(
      margin: const EdgeInsets.only(right: 8),
      width: 34,
      height: 34,
      decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
      alignment: Alignment.center,
      child: Text(
        b.label,
        style: TextStyle(
          color: fg,
          fontSize: 12,
          fontWeight: FontWeight.w800,
          fontFamily: 'Poppins',
        ),
      ),
    );
  }

  Widget _hdr(String t, {bool wide = false}) => SizedBox(
        width: wide ? 42 : 28,
        child: Text(t,
            textAlign: TextAlign.center,
            style: const TextStyle(
                color: Colors.white38, fontSize: 11, fontFamily: 'Poppins')),
      );

  Widget _cell(String t, {bool bold = false, bool wide = false}) => SizedBox(
        width: wide ? 42 : 28,
        child: Text(
          t,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: bold ? Colors.white : Colors.white70,
            fontSize: 12,
            fontWeight: bold ? FontWeight.w700 : FontWeight.w400,
            fontFamily: 'Poppins',
          ),
        ),
      );
}

class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorView({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // 3D scoreboard illustration — shared with the web frontend.
          Image.asset(
            'assets/images/3d_icons/3d_scoreboard_v2.png',
            height: 140,
            fit: BoxFit.contain,
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white54, fontSize: 13),
            ),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: onRetry,
            child:
                const Text('Retry', style: TextStyle(color: AppColors.primary)),
          ),
        ],
      ),
    );
  }
}
