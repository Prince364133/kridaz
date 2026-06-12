import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'scoring_theme.dart';

class MatchExitResult {
  final String? statusId; // drinks | timed_out | lunch | stumps | rain | other
  final String? helpId;
  const MatchExitResult({this.statusId, this.helpId});
}

class _ExitOption {
  final String id;
  final String label;
  final IconData icon;
  const _ExitOption(this.id, this.label, this.icon);
}

const _statuses = <_ExitOption>[
  _ExitOption('drinks', 'Drinks', LucideIcons.coffee),
  _ExitOption('timed_out', 'Timed out', LucideIcons.clock),
  _ExitOption('lunch', 'Lunch', LucideIcons.utensils),
  _ExitOption('stumps', 'Stumps', LucideIcons.columns),
  _ExitOption('rain', 'Rain', LucideIcons.cloudRain),
  _ExitOption('other', 'Other', LucideIcons.moreHorizontal),
];

const _helps = <_ExitOption>[
  _ExitOption('scoring_mistake', 'Scoring Mistake', LucideIcons.alertTriangle),
  _ExitOption('change_scorer', 'Change Scorer', LucideIcons.users),
  _ExitOption('facing_problem', 'Facing Problem', LucideIcons.helpCircle),
  _ExitOption('testing', 'Testing', LucideIcons.checkSquare),
];

/// Port of `MatchExitModal.jsx`. Lets the umpire flag a match status reason
/// (drinks, lunch, rain, etc.) or request scorer help on exit.
class MatchExitModal extends StatefulWidget {
  final void Function(MatchExitResult) onConfirm;
  final VoidCallback onClose;

  const MatchExitModal({
    super.key,
    required this.onConfirm,
    required this.onClose,
  });

  @override
  State<MatchExitModal> createState() => _MatchExitModalState();
}

class _MatchExitModalState extends State<MatchExitModal> {
  String? _status;
  String? _help;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black.withValues(alpha: 0.95),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                constraints: const BoxConstraints(maxWidth: 450),
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(12),
                  border:
                      Border.all(color: Colors.white.withValues(alpha: 0.05)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Flexible(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _section(
                              title: 'SET MATCH STATUS',
                              options: _statuses,
                              selected: _status,
                              onSelect: (id) => setState(
                                  () => _status = _status == id ? null : id),
                            ),
                            const SizedBox(height: 32),
                            _section(
                              title: 'NEED HELP?',
                              options: _helps,
                              selected: _help,
                              onSelect: (id) => setState(
                                  () => _help = _help == id ? null : id),
                            ),
                          ],
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0A0A0A),
                        border: Border(
                            top: BorderSide(
                                color: Colors.white.withValues(alpha: 0.05))),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: SizedBox(
                              height: 50,
                              child: OutlinedButton(
                                onPressed: widget.onClose,
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Colors.white54,
                                  backgroundColor:
                                      Colors.white.withValues(alpha: 0.05),
                                  side: BorderSide(
                                      color:
                                          Colors.white.withValues(alpha: 0.1)),
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8)),
                                ),
                                child: const Text('CANCEL',
                                    style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 2.4)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: SizedBox(
                              height: 50,
                              child: ElevatedButton(
                                onPressed: () {
                                  HapticFeedback.mediumImpact();
                                  widget.onConfirm(MatchExitResult(
                                      statusId: _status, helpId: _help));
                                },
                                style: ElevatedButton.styleFrom(
                                  foregroundColor: ScoringTheme.theme,
                                  backgroundColor: const Color(0xFF222222),
                                  side: BorderSide(
                                      color:
                                          Colors.white.withValues(alpha: 0.1)),
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8)),
                                ),
                                child: const Text('OK',
                                    style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 2.4)),
                              ),
                            ),
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

  Widget _section({
    required String title,
    required List<_ExitOption> options,
    required String? selected,
    required void Function(String) onSelect,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title,
            style: const TextStyle(
                color: Colors.white60,
                fontSize: 8,
                fontWeight: FontWeight.w900,
                letterSpacing: 2.4)),
        const SizedBox(height: 16),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 3,
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          childAspectRatio: 1.0,
          children: options
              .map((o) => _cell(o, selected == o.id, () => onSelect(o.id)))
              .toList(),
        ),
      ],
    );
  }

  Widget _cell(_ExitOption opt, bool selected, VoidCallback onTap) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF222222),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
              color: selected
                  ? ScoringTheme.theme.withValues(alpha: 0.5)
                  : Colors.white.withValues(alpha: 0.1)),
          boxShadow: selected
              ? [
                  BoxShadow(
                      color: ScoringTheme.theme.withValues(alpha: 0.15),
                      blurRadius: 15)
                ]
              : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(opt.icon,
                size: 20,
                color: selected ? ScoringTheme.theme : Colors.white54),
            const SizedBox(height: 8),
            Text(opt.label.toUpperCase(),
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: selected ? ScoringTheme.theme : Colors.white60,
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2)),
          ],
        ),
      ),
    );
  }
}
