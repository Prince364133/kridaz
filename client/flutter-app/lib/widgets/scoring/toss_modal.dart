import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'scoring_theme.dart';

/// Result returned when the user finishes the toss flow.
/// `winnerKey` is `teamA` / `teamB` (or `null` when the user chose Skip).
class TossResult {
  final String? winnerKey;
  final String? decision; // BAT | BOWL
  final String? password;
  const TossResult({this.winnerKey, this.decision, this.password});
}

/// Full-screen toss flow.
///
/// Simplified two-step flow: one captain calls BAT or BOWL up-front, the coin
/// is flipped, and the result directly determines who does what — winner of
/// the flip gets the call, loser is automatically assigned the opposite.
///
/// Steps: CALL_SELECT → FLIPPING → FLIP_RESULT → WINNER_REVEAL (final).
class TossModal extends StatefulWidget {
  final String teamAName;
  final String teamBName;
  final bool hasPassword;
  final Future<void> Function(TossResult result) onConfirm;

  const TossModal({
    super.key,
    required this.teamAName,
    required this.teamBName,
    this.hasPassword = false,
    required this.onConfirm,
  });

  @override
  State<TossModal> createState() => _TossModalState();
}

enum _TossStep {
  callSelect,
  flipping,
  flipResult,
  winnerReveal,
}

class _TossModalState extends State<TossModal>
    with SingleTickerProviderStateMixin {
  _TossStep _step = _TossStep.callSelect;
  String? _callingTeam; // 'teamA' | 'teamB' — who's calling
  String? _callValue; // 'BAT' | 'BOWL' — what they called pre-flip
  String? _winnerKey; // 'teamA' | 'teamB' — derived after flip
  String? _decision; // 'BAT' | 'BOWL' — auto-assigned from call + flip outcome
  bool _callerWonFlip = false; // result of the 50/50 — drives the reveal copy
  final _passwordCtrl = TextEditingController();
  bool _submitting = false;

  late final AnimationController _flipCtrl;
  late Animation<double> _flipAnim;
  double _coinRotation = 0;

  @override
  void initState() {
    super.initState();
    _flipCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 2000));
    _flipAnim = AlwaysStoppedAnimation<double>(0);
  }

  @override
  void dispose() {
    _flipCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  void _flip() {
    // Guard — only triggered from the call-select step's CTA, which itself
    // is only enabled once a caller and a call value have been chosen.
    if (_step != _TossStep.callSelect) return;
    if (_callingTeam == null || _callValue == null) return;
    HapticFeedback.mediumImpact();
    // 50/50 — does the caller win the toss? Coin face is now purely cosmetic,
    // so we just bind "heads up" to "caller won" and rotate accordingly.
    final callerWon = Random().nextBool();
    final landAngle = callerWon ? 0.0 : pi;
    final target = _coinRotation + (10 * pi) + landAngle;
    _flipAnim = Tween<double>(begin: _coinRotation, end: target)
        .chain(CurveTween(curve: Curves.easeInOut))
        .animate(_flipCtrl);
    setState(() => _step = _TossStep.flipping);
    _flipCtrl.forward(from: 0).then((_) {
      _coinRotation = target % (2 * pi);
      if (!mounted) return;
      // Caller wins → they get exactly what they called for.
      // Caller loses → other team gets the opposite of the call.
      final winnerKey = callerWon
          ? _callingTeam!
          : (_callingTeam == 'teamA' ? 'teamB' : 'teamA');
      final decision =
          callerWon ? _callValue! : (_callValue == 'BAT' ? 'BOWL' : 'BAT');
      setState(() {
        _callerWonFlip = callerWon;
        _winnerKey = winnerKey;
        _decision = decision;
        _step = _TossStep.flipResult;
      });
      Future.delayed(const Duration(milliseconds: 1600), () {
        if (!mounted) return;
        setState(() => _step = _TossStep.winnerReveal);
      });
    });
  }

  Future<void> _start() async {
    if (widget.hasPassword && _passwordCtrl.text.isEmpty) return;
    setState(() => _submitting = true);
    await widget.onConfirm(TossResult(
      winnerKey: _winnerKey,
      decision: _decision,
      password: widget.hasPassword ? _passwordCtrl.text : null,
    ));
    if (mounted) setState(() => _submitting = false);
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: switch (_step) {
            _TossStep.callSelect => _callSelectView(),
            _TossStep.flipping || _TossStep.flipResult => _coinView(),
            _TossStep.winnerReveal => _winnerRevealView(),
          },
        ),
      ),
    );
  }

  // ── Coin step ──────────────────────────────────────────────────────────────

  Widget _coinView() {
    return Column(
      children: [
        Expanded(
          child: Center(
            // No longer tap-to-flip — the flip is kicked off from the
            // call-select step's CTA once a caller + call value are chosen.
            child: AnimatedBuilder(
              animation: _flipAnim,
              builder: (_, __) {
                final angle = _step == _TossStep.flipping
                    ? _flipAnim.value
                    : _coinRotation;
                // Show heads when angle ~ 0 (within ±pi/2), tails when flipped
                final showTails = (angle % (2 * pi)) > (pi / 2) &&
                    (angle % (2 * pi)) < (3 * pi / 2);
                return Transform(
                  alignment: Alignment.center,
                  transform: Matrix4.identity()
                    ..setEntry(3, 2, 0.001)
                    ..rotateY(angle),
                  child: showTails
                      ? Transform(
                          alignment: Alignment.center,
                          transform: Matrix4.identity()..rotateY(pi),
                          child: _coinFace(
                            gradientStart: const Color(0xFFA8E8E8),
                            gradientEnd: const Color(0xFF004F50),
                            border: ScoringTheme.tossAccent,
                            icon: LucideIcons.swords,
                            label: 'TAILS',
                          ),
                        )
                      : _coinFace(
                          gradientStart: const Color(0xFFA8F5B0),
                          gradientEnd: const Color(0xFF006D2D),
                          border: ScoringTheme.tossPrimary,
                          icon: LucideIcons.shield,
                          label: 'HEADS',
                        ),
                );
              },
            ),
          ),
        ),
        if (_step == _TossStep.flipping)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Text('FLIPPING...',
                style: TextStyle(
                    color: ScoringTheme.textSubtle,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 3)),
          )
        else if (_step == _TossStep.flipResult)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Builder(builder: (_) {
              final winnerName =
                  _winnerKey == 'teamA' ? widget.teamAName : widget.teamBName;
              return Column(
                children: [
                  Text(
                    '${winnerName.toUpperCase()} WIN THE TOSS',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'AND WILL ${(_decision ?? '').toUpperCase()}',
                    style: const TextStyle(
                      color: ScoringTheme.tossPrimary,
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2,
                    ),
                  ),
                ],
              );
            }),
          ),
      ],
    );
  }

  Widget _coinFace({
    required Color gradientStart,
    required Color gradientEnd,
    required Color border,
    required IconData icon,
    required String label,
  }) {
    return Container(
      width: 208,
      height: 208,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          center: const Alignment(-0.35, -0.35),
          radius: 0.9,
          colors: [gradientStart, gradientEnd],
        ),
        border: Border.all(color: border, width: 4),
        boxShadow: [
          BoxShadow(color: border.withValues(alpha: 0.35), blurRadius: 40),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: const Color(0xFF003914), size: 56),
          const SizedBox(height: 8),
          Text(label,
              style: const TextStyle(
                  color: Color(0xFF003914),
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 3)),
        ],
      ),
    );
  }

  // ── Call select (caller + Heads/Tails before the flip) ──────────────────

  Widget _callSelectView() {
    final ready = _callingTeam != null && _callValue != null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 16),
        const Text('STEP 1 OF 2',
            style: TextStyle(
                color: ScoringTheme.tossAccent,
                fontSize: 12,
                fontWeight: FontWeight.w700,
                letterSpacing: 1)),
        const SizedBox(height: 8),
        const Text("WHO'S CALLING?",
            style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.w900,
                letterSpacing: 2)),
        const SizedBox(height: 4),
        const Text(
          'Pick the calling captain and what they want — bat or bowl. The flip will decide if they get it.',
          style: TextStyle(
              color: ScoringTheme.textMuted,
              fontSize: 12,
              fontWeight: FontWeight.w600,
              height: 1.4),
        ),
        const SizedBox(height: 24),
        _teamButton('teamA', widget.teamAName, 'A',
            selected: _callingTeam == 'teamA',
            onTap: () => setState(() => _callingTeam = 'teamA')),
        const SizedBox(height: 12),
        _teamButton('teamB', widget.teamBName, 'B',
            selected: _callingTeam == 'teamB',
            onTap: () => setState(() => _callingTeam = 'teamB')),
        const SizedBox(height: 28),
        const Text("THE CALL",
            style: TextStyle(
                color: ScoringTheme.tossAccent,
                fontSize: 12,
                fontWeight: FontWeight.w700,
                letterSpacing: 1)),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _callChip(
                value: 'BAT',
                label: 'BAT',
                icon: LucideIcons.activity,
                tint: ScoringTheme.tossPrimary,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _callChip(
                value: 'BOWL',
                label: 'BOWL',
                icon: LucideIcons.circleDot,
                tint: ScoringTheme.tossAccent,
              ),
            ),
          ],
        ),
        const Spacer(),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: ready ? _flip : null,
            style: ElevatedButton.styleFrom(
              foregroundColor: const Color(0xFF003914),
              backgroundColor: ScoringTheme.tossPrimary,
              disabledBackgroundColor: const Color(0xFF2A2A2A),
              disabledForegroundColor: Colors.white.withValues(alpha: 0.5),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('FLIP THE COIN',
                style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 3)),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: OutlinedButton(
            onPressed: () => widget.onConfirm(const TossResult()),
            style: OutlinedButton.styleFrom(
              foregroundColor: ScoringTheme.textSubtle,
              backgroundColor: ScoringTheme.bgPanelDeep,
              side: const BorderSide(color: ScoringTheme.borderSubtle),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('SKIP TO MATCH',
                style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 3)),
          ),
        ),
      ],
    );
  }

  Widget _callChip({
    required String value,
    required String label,
    required IconData icon,
    required Color tint,
  }) {
    final selected = _callValue == value;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => _callValue = value);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
        decoration: BoxDecoration(
          color: selected
              ? tint.withValues(alpha: 0.18)
              : ScoringTheme.bgPanelDeep,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
              color: selected ? tint : ScoringTheme.borderSubtle,
              width: selected ? 2 : 1),
          boxShadow: selected
              ? [
                  BoxShadow(
                      color: tint.withValues(alpha: 0.25), blurRadius: 16),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: tint, size: 20),
            const SizedBox(width: 10),
            Text(label,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                )),
          ],
        ),
      ),
    );
  }

  Widget _teamButton(
    String key,
    String name,
    String letter, {
    required bool selected,
    required VoidCallback onTap,
  }) {
    final isA = key == 'teamA';
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: selected ? ScoringTheme.bgPanelSoft : ScoringTheme.bgPanelDeep,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
              color: selected
                  ? ScoringTheme.tossPrimary
                  : ScoringTheme.borderSubtle,
              width: selected ? 2 : 1),
          boxShadow: selected
              ? [
                  BoxShadow(
                      color: ScoringTheme.tossPrimary.withValues(alpha: 0.3),
                      blurRadius: 15),
                ]
              : null,
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: isA
                    ? ScoringTheme.tossPrimary
                    : ScoringTheme.accentTealDeep,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(letter,
                  style: TextStyle(
                      color: isA
                          ? const Color(0xFF006D2D)
                          : const Color(0xFF004545),
                      fontSize: 28,
                      fontWeight: FontWeight.w900)),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('TEAM ${isA ? 'ALPHA' : 'BRAVO'}',
                      style: const TextStyle(
                          color: ScoringTheme.textSubtle,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1)),
                  const SizedBox(height: 2),
                  Text(name.toUpperCase(),
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w700)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Winner reveal (final step) ────────────────────────────────────────────
  //
  // Single confirmation page. The caller already declared bat/bowl up-front
  // and the flip happened in the previous step, so this view just states the
  // final outcome (who won + what they do) and starts the match. There is no
  // separate decision step anymore.

  Widget _winnerRevealView() {
    final winnerName =
        _winnerKey == 'teamA' ? widget.teamAName : widget.teamBName;
    final loserName =
        _winnerKey == 'teamA' ? widget.teamBName : widget.teamAName;
    final callerName =
        _callingTeam == 'teamA' ? widget.teamAName : widget.teamBName;
    final call = (_callValue ?? '').toUpperCase();
    final decision = (_decision ?? '').toUpperCase();
    final opposite = decision == 'BAT' ? 'BOWL' : 'BAT';
    final callerWon = _callerWonFlip;
    final tint = ScoringTheme.tossPrimary;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 16),
        Text('STEP 2 OF 2',
            style: TextStyle(
              color: tint,
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 1,
            )),
        const SizedBox(height: 8),
        const Text(
          'TOSS RESULT',
          style: TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.w900,
            letterSpacing: 2,
          ),
        ),
        const SizedBox(height: 24),
        Expanded(
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'WON THE TOSS',
                  style: TextStyle(
                    color: ScoringTheme.textMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2.4,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  winnerName.toUpperCase(),
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    height: 1.1,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.5,
                    shadows: [
                      Shadow(
                        color: tint.withValues(alpha: 0.6),
                        blurRadius: 24,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        tint.withValues(alpha: 0.18),
                        tint.withValues(alpha: 0.04),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: tint.withValues(alpha: 0.45)),
                  ),
                  child: Column(
                    children: [
                      Text(
                        '${winnerName.toUpperCase()} WILL $decision',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${loserName.toUpperCase()} WILL $opposite',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: ScoringTheme.textMuted,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  callerWon
                      ? '${callerName.toUpperCase()} CALLED $call — CALL WON'
                      : '${callerName.toUpperCase()} CALLED $call — CALL LOST',
                  style: const TextStyle(
                    color: ScoringTheme.textMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: _submitting ? null : _start,
            style: ElevatedButton.styleFrom(
              foregroundColor: const Color(0xFF003914),
              backgroundColor: tint,
              disabledBackgroundColor: const Color(0xFF2A2A2A),
              disabledForegroundColor: Colors.white.withValues(alpha: 0.5),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            child: Text(
              _submitting ? 'STARTING...' : 'START MATCH',
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w900,
                letterSpacing: 3,
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: OutlinedButton(
            onPressed: _submitting
                ? null
                : () => setState(() {
                      _winnerKey = null;
                      _decision = null;
                      _callingTeam = null;
                      _callValue = null;
                      _callerWonFlip = false;
                      _step = _TossStep.callSelect;
                    }),
            style: OutlinedButton.styleFrom(
              foregroundColor: ScoringTheme.textSubtle,
              backgroundColor: ScoringTheme.bgPanelDeep,
              side: const BorderSide(color: ScoringTheme.borderSubtle),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text(
              'RE-TOSS',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                letterSpacing: 2.4,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
