import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'scoring_theme.dart';

/// Full-screen detailed match report — venue, officials, totals, per-player
/// stats (batting/bowling/time active). Port of `MatchReportModal.jsx`.
class MatchReportModal extends StatefulWidget {
  final Future<Map<String, dynamic>?> Function() loadReport;
  final VoidCallback onClose;

  const MatchReportModal({
    super.key,
    required this.loadReport,
    required this.onClose,
  });

  @override
  State<MatchReportModal> createState() => _MatchReportModalState();
}

class _MatchReportModalState extends State<MatchReportModal> {
  Map<String, dynamic>? _report;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final r = await widget.loadReport();
    if (!mounted) return;
    setState(() {
      _report = r;
      _loading = false;
    });
  }

  String _formatTimer(num? secs) {
    if (secs == null || secs <= 0) return '00:00:00';
    final s = secs.toInt();
    final h = (s ~/ 3600).toString().padLeft(2, '0');
    final m = ((s % 3600) ~/ 60).toString().padLeft(2, '0');
    final ss = (s % 60).toString().padLeft(2, '0');
    return '$h:$m:$ss';
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black.withValues(alpha: 0.8),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                constraints:
                    const BoxConstraints(maxWidth: 720, maxHeight: 800),
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFF0A0A0A),
                  borderRadius: BorderRadius.circular(8),
                  border:
                      Border.all(color: Colors.white.withValues(alpha: 0.1)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                                color: Colors.white.withValues(alpha: 0.1)),
                          ),
                          child: const Icon(LucideIcons.fileText,
                              color: Colors.white, size: 22),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('MATCH REPORT',
                                  style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 18,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 2.4)),
                              const SizedBox(height: 4),
                              Text('DETAILED METRICS & TIMERS',
                                  style: TextStyle(
                                      color: ScoringTheme.theme,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 2.4)),
                            ],
                          ),
                        ),
                        GestureDetector(
                          onTap: widget.onClose,
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.05),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.05)),
                            ),
                            child: const Icon(LucideIcons.x,
                                color: Colors.white54, size: 18),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Flexible(
                      child: _loading
                          ? const Padding(
                              padding: EdgeInsets.symmetric(vertical: 80),
                              child: Center(
                                child: SizedBox(
                                  width: 32,
                                  height: 32,
                                  child: CircularProgressIndicator(
                                      color: ScoringTheme.theme,
                                      strokeWidth: 3),
                                ),
                              ),
                            )
                          : _content(),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _content() {
    final report = _report;
    if (report == null) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 60),
        child: Text('No report available',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white54)),
      );
    }
    final game = report['game'] as Map<String, dynamic>?;
    final match = report['match'] as Map<String, dynamic>?;
    final players = (report['players'] as List?) ?? const [];
    final penaltyA = match?['penaltyRuns']?['teamA'] ?? 0;
    final penaltyB = match?['penaltyRuns']?['teamB'] ?? 0;

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (game != null) _matchDetailsCard(game),
          if (game != null) const SizedBox(height: 16),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 4,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.0,
            children: [
              _statTile(LucideIcons.clock, 'TOTAL TIME',
                  _formatTimer(match?['totalDurationSeconds']),
                  iconColor: Colors.white60, valueColor: Colors.white),
              _statTile(LucideIcons.shieldAlert, 'STATUS',
                  (match?['status'] ?? '-').toString(),
                  iconColor: Colors.white60,
                  valueColor: ScoringTheme.theme,
                  small: true),
              _statTile(LucideIcons.zap, 'TEAM A PENALTIES', '$penaltyA',
                  iconColor: const Color(0xFFEF4444),
                  valueColor: const Color(0xFFEF4444)),
              _statTile(LucideIcons.zap, 'TEAM B PENALTIES', '$penaltyB',
                  iconColor: const Color(0xFFEF4444),
                  valueColor: const Color(0xFFEF4444)),
            ],
          ),
          const SizedBox(height: 24),
          const Text('PLAYER STATISTICS',
              style: TextStyle(
                  color: Colors.white54,
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2.4)),
          const SizedBox(height: 12),
          if (players.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: Center(
                child: Text('NO PLAYER STATISTICS AVAILABLE',
                    style: TextStyle(
                        color: Colors.white54,
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2.4)),
              ),
            )
          else
            ...players
                .whereType<Map>()
                .map((p) => _playerRow(Map<String, dynamic>.from(p))),
        ],
      ),
    );
  }

  Widget _matchDetailsCard(Map<String, dynamic> game) {
    final venue = game['customVenue']?.toString();
    final officials =
        (game['customProfessionals'] as List?)?.whereType<Map>().toList() ??
            const [];
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.02),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('MATCH DETAILS',
              style: TextStyle(
                  color: Colors.white54,
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2.4)),
          const SizedBox(height: 12),
          if (venue != null && venue.isNotEmpty) ...[
            const Text('VENUE',
                style: TextStyle(
                    color: Colors.white54,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2)),
            const SizedBox(height: 4),
            Text(venue,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w900)),
          ],
          if (officials.isNotEmpty) ...[
            const SizedBox(height: 12),
            const Text('MATCH OFFICIALS',
                style: TextStyle(
                    color: Colors.white54,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: officials
                  .map((m) => Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                              color: Colors.white.withValues(alpha: 0.1)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text((m['role'] ?? '').toString().toUpperCase(),
                                style: TextStyle(
                                    color: ScoringTheme.theme,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900)),
                            const SizedBox(width: 6),
                            Text((m['name'] ?? '').toString(),
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ))
                  .toList(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _statTile(IconData icon, String label, String value,
      {required Color iconColor,
      required Color valueColor,
      bool small = false}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.02),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: iconColor, size: 18),
          const SizedBox(height: 6),
          Text(label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                  color: Colors.white54,
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.5)),
          const SizedBox(height: 4),
          FittedBox(
            child: Text(value,
                style: TextStyle(
                    color: valueColor,
                    fontSize: small ? 13 : 18,
                    fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    );
  }

  Widget _playerRow(Map<String, dynamic> p) {
    final batting = (p['batting'] as Map?)?.cast<String, dynamic>() ?? const {};
    final bowling = (p['bowling'] as Map?)?.cast<String, dynamic>() ?? const {};
    final status = batting['status']?.toString() ?? '';
    final isOut = status == 'OUT';
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
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
              color: Colors.white.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child:
                const Icon(LucideIcons.user, color: Colors.white54, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text((p['name'] ?? 'Unknown').toString(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w900)),
                const SizedBox(height: 2),
                Text((p['role'] ?? 'PLAYER').toString().toUpperCase(),
                    style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2)),
              ],
            ),
          ),
          Expanded(
            flex: 3,
            child: Row(
              children: [
                Expanded(
                    child:
                        _miniStat('TIME', _formatTimer(p['timeSpentSeconds']))),
                Expanded(
                    child: _miniStat('BAT',
                        '${batting['runs'] ?? 0} (${batting['balls'] ?? 0})')),
                Expanded(
                    child: _miniStat('BWL',
                        '${bowling['wickets'] ?? 0} - ${bowling['runs'] ?? 0}')),
                Expanded(
                  child: _miniStat(
                      'STATUS',
                      isOut
                          ? (batting['outType'] ?? 'OUT')
                              .toString()
                              .toUpperCase()
                          : status.toUpperCase(),
                      valueColor:
                          isOut ? const Color(0xFFEF4444) : Colors.white54),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _miniStat(String label, String value,
      {Color valueColor = Colors.white}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                color: Colors.white54,
                fontSize: 9,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.5)),
        const SizedBox(height: 2),
        Text(value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
                color: valueColor, fontSize: 12, fontWeight: FontWeight.w900)),
      ],
    );
  }
}
