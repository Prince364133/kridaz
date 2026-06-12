import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../models/scoring_models.dart';
import 'scoring_theme.dart';

/// Shown when an over completes and a new bowler must be selected.
/// Port of `SelectBowlerModal.jsx`.
class SelectBowlerModal extends StatelessWidget {
  final List<RosterPlayer> pool;
  final String? currentBowlerId;
  final void Function(String bowlerId) onConfirm;
  final VoidCallback onClose;

  const SelectBowlerModal({
    super.key,
    required this.pool,
    required this.currentBowlerId,
    required this.onConfirm,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    final available = pool.where((p) => p.id != currentBowlerId).toList();

    return Material(
      color: Colors.black.withValues(alpha: 0.8),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                constraints: const BoxConstraints(maxWidth: 450),
                decoration: BoxDecoration(
                  color: ScoringTheme.bgSheet,
                  borderRadius: BorderRadius.circular(8),
                  border:
                      Border.all(color: Colors.white.withValues(alpha: 0.1)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
                      decoration: BoxDecoration(
                        border: Border(
                            bottom: BorderSide(
                                color: Colors.white.withValues(alpha: 0.1))),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(LucideIcons.zap,
                              color: ScoringTheme.theme, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: const Text('SELECT NEXT BOWLER',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 20,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: -0.5)),
                          ),
                          GestureDetector(
                            onTap: onClose,
                            child: const Icon(LucideIcons.x,
                                color: Colors.white54, size: 18),
                          ),
                        ],
                      ),
                    ),
                    Flexible(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(16),
                        child: available.isEmpty
                            ? const Padding(
                                padding: EdgeInsets.symmetric(vertical: 32),
                                child: Text(
                                  'No other bowlers available',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: Colors.white54),
                                ),
                              )
                            : Column(
                                children: available.map(_row).toList(),
                              ),
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

  Widget _row(RosterPlayer p) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          onConfirm(p.id);
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.04),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: const Color(0xFF222222),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  p.name.isNotEmpty ? p.name[0].toUpperCase() : '?',
                  style: const TextStyle(
                      color: ScoringTheme.theme,
                      fontSize: 14,
                      fontWeight: FontWeight.w900),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(p.name,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w700)),
              ),
              Icon(LucideIcons.chevronRight,
                  color: Colors.white.withValues(alpha: 0.4), size: 16),
            ],
          ),
        ),
      ),
    );
  }
}
