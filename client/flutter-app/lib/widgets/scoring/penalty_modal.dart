import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'scoring_theme.dart';

class PenaltyResult {
  final String teamKey; // 'teamA' | 'teamB'
  final int runs;
  const PenaltyResult({required this.teamKey, required this.runs});
}

/// Port of `PenaltyModal.jsx`. Awards penalty runs to either team.
class PenaltyModal extends StatefulWidget {
  final String teamAName;
  final String teamBName;
  final void Function(PenaltyResult) onConfirm;
  final VoidCallback onClose;

  const PenaltyModal({
    super.key,
    required this.teamAName,
    required this.teamBName,
    required this.onConfirm,
    required this.onClose,
  });

  @override
  State<PenaltyModal> createState() => _PenaltyModalState();
}

class _PenaltyModalState extends State<PenaltyModal> {
  String _team = 'teamA';
  final _runs = TextEditingController();

  @override
  void dispose() {
    _runs.dispose();
    super.dispose();
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
                      padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
                      decoration: BoxDecoration(
                        border: Border(
                            bottom: BorderSide(
                                color: Colors.white.withValues(alpha: 0.1))),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Expanded(
                                child: Text('AWARD EXTRA RUNS',
                                    style: TextStyle(
                                        color: Colors.white54,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 2.4)),
                              ),
                              GestureDetector(
                                onTap: widget.onClose,
                                child: const Icon(LucideIcons.x,
                                    color: Colors.white54, size: 16),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          const Text('ADD PENALTY',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -0.5)),
                        ],
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('SELECT TEAM TO RECEIVE RUNS',
                              style: TextStyle(
                                  color: Colors.white54,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 2.4)),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Expanded(
                                  child: _teamBtn('teamA', widget.teamAName)),
                              const SizedBox(width: 8),
                              Expanded(
                                  child: _teamBtn('teamB', widget.teamBName)),
                            ],
                          ),
                          const SizedBox(height: 20),
                          const Text('PENALTY RUNS',
                              style: TextStyle(
                                  color: Colors.white54,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 2.4)),
                          const SizedBox(height: 10),
                          TextField(
                            controller: _runs,
                            keyboardType: TextInputType.number,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 22,
                                fontWeight: FontWeight.w900),
                            decoration: InputDecoration(
                              hintText: 'e.g. 5',
                              hintStyle: const TextStyle(color: Colors.white24),
                              filled: true,
                              fillColor: Colors.white.withValues(alpha: 0.05),
                              contentPadding:
                                  const EdgeInsets.symmetric(vertical: 16),
                              border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide: BorderSide(
                                      color:
                                          Colors.white.withValues(alpha: 0.1))),
                              enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide: BorderSide(
                                      color:
                                          Colors.white.withValues(alpha: 0.1))),
                            ),
                            onChanged: (_) => setState(() {}),
                          ),
                          const SizedBox(height: 20),
                          SizedBox(
                            width: double.infinity,
                            height: 56,
                            child: ElevatedButton(
                              onPressed: () {
                                final n = int.tryParse(_runs.text.trim());
                                if (n == null || n <= 0) return;
                                HapticFeedback.mediumImpact();
                                widget.onConfirm(
                                    PenaltyResult(teamKey: _team, runs: n));
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFDC2626),
                                foregroundColor: Colors.white,
                                disabledBackgroundColor:
                                    Colors.white.withValues(alpha: 0.1),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8)),
                              ),
                              child: const Text('APPLY PENALTY',
                                  style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 3.6)),
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

  Widget _teamBtn(String key, String name) {
    final selected = _team == key;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => _team = key);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 14),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected
              ? ScoringTheme.theme.withValues(alpha: 0.2)
              : Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
              color: selected
                  ? ScoringTheme.theme.withValues(alpha: 0.5)
                  : Colors.white.withValues(alpha: 0.05)),
        ),
        child: Text(
          name.toUpperCase(),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
              color: selected ? ScoringTheme.theme : Colors.white54,
              fontSize: 11,
              fontWeight: FontWeight.w900,
              letterSpacing: 2.4),
        ),
      ),
    );
  }
}
