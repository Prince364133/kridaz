import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'scoring_theme.dart';

const _accentSky = ScoringTheme.accentSky; // #55DEE8 (web's THEME_COLOR here)

/// Port of `ExtraRunsModal.jsx`. Lets the umpire choose how many runs were
/// scored off the extra delivery. Returns the run count (penalty added by
/// caller).
class ExtraRunsModal extends StatefulWidget {
  final String extraType; // WIDE | NO_BALL | BYE | LEG_BYE
  final void Function(int runs) onConfirm;
  final VoidCallback onClose;

  const ExtraRunsModal({
    super.key,
    required this.extraType,
    required this.onConfirm,
    required this.onClose,
  });

  @override
  State<ExtraRunsModal> createState() => _ExtraRunsModalState();
}

class _ExtraRunsModalState extends State<ExtraRunsModal> {
  int _runs = 0;

  String get _label {
    switch (widget.extraType) {
      case 'WIDE':
        return 'Wide';
      case 'NO_BALL':
        return 'No-Ball';
      case 'BYE':
        return 'Bye';
      case 'LEG_BYE':
        return 'Leg Bye';
      default:
        return widget.extraType;
    }
  }

  bool get _hasPenalty =>
      widget.extraType == 'WIDE' || widget.extraType == 'NO_BALL';

  // Byes / leg-byes can legitimately be > 4 (overthrows after a boundary,
  // running 5 etc.). For these, expose a +/- stepper so the umpire can dial
  // in any value. Wides / no-balls cap at 4 — anything more is implausible
  // since the batter still has to either run or the ball goes to the rope,
  // and overthrows on a wide/no-ball are scored as runs off the bat instead.
  bool get _allowsHighRuns =>
      widget.extraType == 'BYE' || widget.extraType == 'LEG_BYE';

  String get _totalDisplay => _hasPenalty
      ? '${_runs + 1} (${_runs} runs + 1 penalty)'
      : '${_runs} runs';

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black.withValues(alpha: 0.9),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                constraints: const BoxConstraints(maxWidth: 380),
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(12),
                  border:
                      Border.all(color: Colors.white.withValues(alpha: 0.05)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.fromLTRB(24, 24, 24, 20),
                      decoration: BoxDecoration(
                        border: Border(
                            bottom: BorderSide(
                                color: Colors.white.withValues(alpha: 0.05))),
                      ),
                      child: Text(_label.toUpperCase(),
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 26,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.5)),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Quick run selectors 0..4
                          Row(
                            children: [
                              for (int r = 0; r <= 4; r++)
                                Expanded(
                                  child: Padding(
                                    padding:
                                        EdgeInsets.only(right: r == 4 ? 0 : 12),
                                    child: _quickButton(r),
                                  ),
                                ),
                            ],
                          ),
                          // For byes / leg-byes only: a -/+ stepper to enter
                          // values above 4 (overthrows, running 5, etc.).
                          if (_allowsHighRuns) ...[
                            const SizedBox(height: 12),
                            _highRunsStepper(),
                          ],
                          const SizedBox(height: 20),
                          // Total impact
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 20, vertical: 16),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.05),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.05)),
                            ),
                            child: Row(
                              children: [
                                const Text('TOTAL IMPACT',
                                    style: TextStyle(
                                        color: Colors.white54,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 2)),
                                const Spacer(),
                                Text(_totalDisplay,
                                    style: const TextStyle(
                                        color: _accentSky,
                                        fontSize: 16,
                                        fontWeight: FontWeight.w900)),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),
                          Row(
                            children: [
                              Expanded(
                                child: SizedBox(
                                  height: 56,
                                  child: OutlinedButton(
                                    onPressed: widget.onClose,
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: Colors.white54,
                                      backgroundColor:
                                          ScoringTheme.bgControlBar,
                                      side: BorderSide(
                                          color: Colors.white
                                              .withValues(alpha: 0.05)),
                                      shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(8)),
                                    ),
                                    child: const Text('CANCEL',
                                        style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w900,
                                            letterSpacing: 2.4)),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                flex: 2,
                                child: SizedBox(
                                  height: 56,
                                  child: ElevatedButton(
                                    onPressed: () => widget.onConfirm(_runs),
                                    style: ElevatedButton.styleFrom(
                                      foregroundColor: Colors.black,
                                      backgroundColor: _accentSky,
                                      shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(8)),
                                    ),
                                    child: Text(
                                        'CONFIRM ${_label.toUpperCase()}',
                                        style: const TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w900,
                                            letterSpacing: 2.4)),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
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

  Widget _highRunsStepper() {
    final overFour = _runs > 4;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
            color: overFour
                ? _accentSky.withValues(alpha: 0.5)
                : Colors.white.withValues(alpha: 0.05)),
      ),
      child: Row(
        children: [
          const Text('MORE THAN 4',
              style: TextStyle(
                  color: Colors.white54,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2)),
          const Spacer(),
          _stepperButton(
            icon: Icons.remove,
            enabled: _runs > 0,
            onTap: () {
              HapticFeedback.selectionClick();
              setState(() => _runs = (_runs - 1).clamp(0, 99));
            },
          ),
          const SizedBox(width: 12),
          SizedBox(
            width: 36,
            child: Text(
              '$_runs',
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: overFour ? _accentSky : Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w900),
            ),
          ),
          const SizedBox(width: 12),
          _stepperButton(
            icon: Icons.add,
            enabled: true,
            onTap: () {
              HapticFeedback.selectionClick();
              setState(() => _runs = (_runs + 1).clamp(0, 99));
            },
          ),
        ],
      ),
    );
  }

  Widget _stepperButton({
    required IconData icon,
    required bool enabled,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: enabled
              ? Colors.white.withValues(alpha: 0.08)
              : Colors.white.withValues(alpha: 0.03),
          shape: BoxShape.circle,
        ),
        alignment: Alignment.center,
        child: Icon(icon,
            color: enabled ? Colors.white : Colors.white24, size: 18),
      ),
    );
  }

  Widget _quickButton(int r) {
    final selected = _runs == r;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => _runs = r);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        height: 56,
        decoration: BoxDecoration(
          color: selected ? _accentSky : Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
              color:
                  selected ? _accentSky : Colors.white.withValues(alpha: 0.05)),
          boxShadow: selected
              ? [
                  BoxShadow(
                      color: _accentSky.withValues(alpha: 0.3), blurRadius: 20)
                ]
              : null,
        ),
        alignment: Alignment.center,
        child: Text('$r',
            style: TextStyle(
                color: selected ? Colors.black : Colors.white54,
                fontSize: 22,
                fontWeight: FontWeight.w900)),
      ),
    );
  }
}
