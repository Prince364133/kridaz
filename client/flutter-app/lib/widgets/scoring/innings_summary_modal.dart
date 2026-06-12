import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../models/scoring_models.dart';

/// Bottom-sheet that summarises the innings the user just finished — runs,
/// wickets, overs, run rate, extras, top scorers, and powerplay stats when
/// the host enabled the powerplay window. Shown right after the 1st innings
/// ends (auto or manual) and before the 2nd-innings setup so the scorer and
/// captains can review what the chase needs to beat.
class InningsSummaryModal extends StatelessWidget {
  final String battingTeamName;
  final String chasingTeamName;
  final LiveScoreSnapshot snapshot;
  final int maxOvers;
  final int inningsNumber; // 1 or 2 — the innings that just ended
  final VoidCallback onContinue;

  const InningsSummaryModal({
    super.key,
    required this.battingTeamName,
    required this.chasingTeamName,
    required this.snapshot,
    required this.maxOvers,
    required this.onContinue,
    this.inningsNumber = 1,
  });

  static Future<void> show({
    required BuildContext context,
    required String battingTeamName,
    required String chasingTeamName,
    required LiveScoreSnapshot snapshot,
    required int maxOvers,
    int inningsNumber = 1,
  }) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      isDismissible: false,
      enableDrag: false,
      builder: (sheetCtx) => InningsSummaryModal(
        battingTeamName: battingTeamName,
        chasingTeamName: chasingTeamName,
        snapshot: snapshot,
        maxOvers: maxOvers,
        inningsNumber: inningsNumber,
        onContinue: () => Navigator.of(sheetCtx).pop(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = snapshot;
    final overString =
        s.overString.isNotEmpty ? s.overString : '${s.overs}.${s.balls}';
    final target = s.runs + 1;
    // Top scorers — snapshot only carries the two active batters, so we
    // surface those. The full batting card lives behind the SCORECARD tab.
    final topBatters = [...s.batters]..sort((a, b) => b.runs.compareTo(a.runs));
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      expand: false,
      builder: (_, scrollCtrl) => Container(
        decoration: const BoxDecoration(
          color: Color(0xFF121212),
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 10),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: SingleChildScrollView(
                controller: scrollCtrl,
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _headerCard(overString),
                    const SizedBox(height: 16),
                    _statsGrid(),
                    if (s.powerPlayOvers != null ||
                        s.powerPlayRuns != null) ...[
                      const SizedBox(height: 16),
                      _powerPlayCard(),
                    ],
                    if (topBatters.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      _topScorersCard(topBatters),
                    ],
                    if (s.bowler != null) ...[
                      const SizedBox(height: 16),
                      _bowlerCard(),
                    ],
                    if (inningsNumber == 1) ...[
                      const SizedBox(height: 16),
                      _targetCard(target),
                    ],
                  ],
                ),
              ),
            ),
            _continueBar(context),
          ],
        ),
      ),
    );
  }

  Widget _headerCard(String overString) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF00C187).withValues(alpha: 0.18),
            const Color(0xFF00C187).withValues(alpha: 0.04),
          ],
        ),
        borderRadius: BorderRadius.circular(14),
        border:
            Border.all(color: const Color(0xFF00C187).withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.flag, color: Color(0xFF00C187), size: 16),
              const SizedBox(width: 8),
              Text(
                inningsNumber == 1
                    ? '1ST INNINGS COMPLETE'
                    : '2ND INNINGS COMPLETE',
                style: const TextStyle(
                  color: Color(0xFF00C187),
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            battingTeamName.toUpperCase(),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                '${snapshot.runs}/${snapshot.wickets}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 44,
                  height: 1,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                '($overString / $maxOvers ov)',
                style: const TextStyle(
                  color: Colors.white60,
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _statsGrid() {
    return Row(
      children: [
        Expanded(
          child: _statTile(
            icon: LucideIcons.activity,
            label: 'RUN RATE',
            value: snapshot.crr,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _statTile(
            icon: LucideIcons.plus,
            label: 'EXTRAS',
            value: '${snapshot.extras}',
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _statTile(
            icon: LucideIcons.users,
            label: 'WICKETS',
            value: '${snapshot.wickets}',
          ),
        ),
      ],
    );
  }

  Widget _statTile({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: const Color(0xFF2FD1C6), size: 16),
          const SizedBox(height: 10),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white54,
              fontSize: 9,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.4,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }

  Widget _powerPlayCard() {
    final ppRuns = snapshot.powerPlayRuns;
    final ppWkts = snapshot.powerPlayWickets;
    final ppOvers = snapshot.powerPlayOvers;
    final rateText = (ppRuns != null && ppOvers != null && ppOvers > 0)
        ? (ppRuns / ppOvers).toStringAsFixed(2)
        : null;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.zap, color: Color(0xFFFFC403), size: 16),
              const SizedBox(width: 8),
              const Text(
                'POWERPLAY',
                style: TextStyle(
                  color: Color(0xFFFFC403),
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                ),
              ),
              const Spacer(),
              if (ppOvers != null)
                Text(
                  'OVERS 1–$ppOvers',
                  style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.2,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              if (ppRuns != null) _pillStat('RUNS', '$ppRuns'),
              if (ppWkts != null) ...[
                const SizedBox(width: 10),
                _pillStat('WKTS', '$ppWkts'),
              ],
              if (rateText != null) ...[
                const SizedBox(width: 10),
                _pillStat('RR', rateText),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _pillStat(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Colors.white54,
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }

  Widget _topScorersCard(List<BatterStat> batters) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'AT THE CREASE',
            style: TextStyle(
              color: Color(0xFF00C187),
              fontSize: 11,
              fontWeight: FontWeight.w900,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 10),
          for (final b in batters.take(3)) ...[
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      b.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  Text(
                    '${b.runs} (${b.balls})',
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'SR ${b.strikeRate.toStringAsFixed(1)}',
                    style: const TextStyle(
                      color: Colors.white38,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _bowlerCard() {
    final b = snapshot.bowler!;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.circleDot, color: Color(0xFF2FD1C6), size: 18),
          const SizedBox(width: 10),
          const Text(
            'LAST BOWLER',
            style: TextStyle(
              color: Colors.white54,
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.4,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              b.name,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w800,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Text(
            '${b.wickets}/${b.runs}',
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 13,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }

  Widget _targetCard(int target) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFFFFC403).withValues(alpha: 0.18),
            const Color(0xFFFFC403).withValues(alpha: 0.04),
          ],
        ),
        borderRadius: BorderRadius.circular(14),
        border:
            Border.all(color: const Color(0xFFFFC403).withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'TARGET',
            style: TextStyle(
              color: Color(0xFFFFC403),
              fontSize: 11,
              fontWeight: FontWeight.w900,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 6),
          Text.rich(
            TextSpan(
              children: [
                TextSpan(
                  text: chasingTeamName.toUpperCase(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.4,
                  ),
                ),
                const TextSpan(
                  text: '  NEED  ',
                  style: TextStyle(
                    color: Colors.white60,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.2,
                  ),
                ),
                TextSpan(
                  text: '$target',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                TextSpan(
                  text: ' RUNS IN $maxOvers OVERS',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.2,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _continueBar(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
        child: SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: onContinue,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00C187),
              foregroundColor: const Color(0xFF003914),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            child: Text(
              inningsNumber == 1 ? 'START 2ND INNINGS' : 'CONTINUE',
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w900,
                letterSpacing: 2.4,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
