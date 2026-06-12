import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'scoring_theme.dart';

const _quickRuns = [5, 7, 8, 9];

/// Port of `CustomRunsModal.jsx`. Quick-pick uncommon run values plus a free
/// numeric input. Returns the chosen run count.
class CustomRunsModal extends StatefulWidget {
  final void Function(int runs) onConfirm;
  final VoidCallback onClose;

  const CustomRunsModal({
    super.key,
    required this.onConfirm,
    required this.onClose,
  });

  @override
  State<CustomRunsModal> createState() => _CustomRunsModalState();
}

class _CustomRunsModalState extends State<CustomRunsModal> {
  int _runs = 0;
  late final TextEditingController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = TextEditingController(text: '0');
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _setRuns(int r) {
    setState(() {
      _runs = r;
      _ctrl.text = r.toString();
    });
  }

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
                      child: const Text('CUSTOM RUNS',
                          style: TextStyle(
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
                          Row(
                            children: [
                              for (final r in _quickRuns)
                                Expanded(
                                  child: Padding(
                                    padding: EdgeInsets.only(
                                        right: r == _quickRuns.last ? 0 : 12),
                                    child: _quickBtn(r),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 24),
                          const Text('MANUAL INPUT',
                              style: TextStyle(
                                  color: Colors.white54,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 2.4)),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 20, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.03),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.05)),
                            ),
                            child: Row(
                              children: [
                                const Text('RUNS',
                                    style: TextStyle(
                                        color: Colors.white54,
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                        letterSpacing: 1)),
                                Expanded(
                                  child: TextField(
                                    controller: _ctrl,
                                    keyboardType: TextInputType.number,
                                    textAlign: TextAlign.right,
                                    style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 22,
                                        fontWeight: FontWeight.w900),
                                    decoration: const InputDecoration(
                                      border: InputBorder.none,
                                      contentPadding:
                                          EdgeInsets.symmetric(vertical: 12),
                                    ),
                                    onChanged: (v) {
                                      final n = int.tryParse(v);
                                      if (n != null && n >= 0) {
                                        setState(() => _runs = n);
                                      }
                                    },
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),
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
                                    child: const Text('BACK',
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
                                    onPressed: () {
                                      HapticFeedback.mediumImpact();
                                      widget.onConfirm(_runs);
                                    },
                                    style: ElevatedButton.styleFrom(
                                      foregroundColor: Colors.black,
                                      backgroundColor: ScoringTheme.theme,
                                      shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(8)),
                                    ),
                                    child: const Text('CONFIRM SCORE',
                                        style: TextStyle(
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

  Widget _quickBtn(int r) {
    final selected = _runs == r;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        _setRuns(r);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        height: 56,
        decoration: BoxDecoration(
          color: selected
              ? ScoringTheme.theme
              : Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
              color: selected
                  ? ScoringTheme.theme
                  : Colors.white.withValues(alpha: 0.05)),
          boxShadow: selected
              ? [
                  BoxShadow(
                      color: ScoringTheme.theme.withValues(alpha: 0.3),
                      blurRadius: 20)
                ]
              : null,
        ),
        alignment: Alignment.center,
        child: Text('$r',
            style: TextStyle(
                color: selected ? Colors.black : Colors.white54,
                fontSize: 20,
                fontWeight: FontWeight.w900)),
      ),
    );
  }
}
