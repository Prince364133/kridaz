import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../services/scoring_service.dart';
import '../common/bms_toast.dart';

/// House-rules bottom sheet — only enabled for the assigned umpire /
/// scorer / scorer-token holder. Defaults to full MCC; flip a toggle to
/// override per match (e.g. "wides count as legal balls", "balls per
/// over: 4", "last man stands"). Setting a key back to its default sends
/// `null` to remove the override.
///
/// MVP weights are NOT exposed here yet — they're a per-deployment knob
/// the average umpire doesn't touch. Plumb later if a customer asks.
Future<bool?> showHouseRulesSheet(
  BuildContext context, {
  required String scoringId,
  required Map<String, dynamic> currentRules,
}) {
  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: const Color(0xFF0E0E10),
    shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
    builder: (ctx) =>
        _HouseRulesSheet(scoringId: scoringId, current: currentRules),
  );
}

class _HouseRulesSheet extends StatefulWidget {
  const _HouseRulesSheet({required this.scoringId, required this.current});
  final String scoringId;
  final Map<String, dynamic> current;

  @override
  State<_HouseRulesSheet> createState() => _HouseRulesSheetState();
}

class _HouseRulesSheetState extends State<_HouseRulesSheet> {
  final _scoring = ScoringService();
  late Map<String, dynamic> _draft;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _draft = Map<String, dynamic>.from(widget.current);
  }

  Future<void> _save() async {
    HapticFeedback.mediumImpact();
    setState(() {
      _saving = true;
      _error = null;
    });
    final res = await _scoring.setHouseRules(
        scoringId: widget.scoringId, houseRules: _draft);
    if (!mounted) return;
    setState(() => _saving = false);
    if (res.ok) {
      BmsToast.success(context, 'House rules updated');
      Navigator.of(context).pop(true);
    } else {
      // Doc §2.3 — stable codes for out-of-range values + 403 for
      // unauthorised callers.
      final friendly = switch (res.code) {
        'INVALID_BALLS_PER_OVER' => 'Balls per over must be between 1 and 12.',
        'INVALID_PLAYERS_PER_TEAM' =>
          'Players per team must be between 2 and 30.',
        'INVALID_MAX_RUNS_PER_BALL' =>
          'Max runs per ball must be between 1 and 12.',
        'FORBIDDEN_HOUSE_RULES' =>
          'Only the assigned umpire/scorer can set house rules.',
        'MATCH_ALREADY_COMPLETE' =>
          'Match already complete — house rules are locked.',
        _ => res.error ?? 'Could not update house rules',
      };
      setState(() => _error = friendly);
    }
  }

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: viewInsets),
      child: SafeArea(
        top: false,
        child: ConstrainedBox(
          constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.82),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 10),
              Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(2)),
              ),
              const SizedBox(height: 14),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    Text('House Rules',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Poppins')),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: ListView(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  children: [
                    _toggleRow(
                      'Enforce Free Hit after no-ball',
                      'enforceFreeHit',
                      'When off, no-balls don\'t trigger a free hit.',
                    ),
                    _toggleRow(
                      'Block consecutive overs by same bowler',
                      'enforceConsecutiveOverBlock',
                      'Stops a bowler bowling two overs in a row.',
                    ),
                    _toggleRow(
                      'Penalty runs enabled',
                      'penaltyEnabled',
                      'Required for time-wasting / ball-tampering deductions.',
                    ),
                    _toggleRow(
                      'Wide counts as a legal ball',
                      'wideIsLegalBall',
                      'When on, wides do not need to be re-bowled.',
                    ),
                    _toggleRow(
                      'No-ball counts as a legal ball',
                      'noBallIsLegalBall',
                      'When on, no-balls do not need to be re-bowled.',
                    ),
                    _toggleRow(
                      'Last man stands',
                      'lastManStands',
                      'Skip all-out — the last batter bats alone.',
                    ),
                    const SizedBox(height: 10),
                    _intRow('Balls per over', 'ballsPerOver', range: '1..12'),
                    _intRow('Players per team', 'playersPerTeam',
                        range: '2..30'),
                    _intRow('Max runs per ball', 'maxRunsPerBall',
                        range: '1..12'),
                    if (_error != null) ...[
                      const SizedBox(height: 10),
                      Text(_error!,
                          style: const TextStyle(
                              color: Color(0xFFEF4444),
                              fontSize: 12,
                              fontFamily: 'Poppins')),
                    ],
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                child: SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _saving ? null : _save,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF7CFE6A),
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(26)),
                    ),
                    child: _saving
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.black))
                        : const Text('SAVE',
                            style: TextStyle(
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1.2,
                                fontFamily: 'Poppins')),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _toggleRow(String label, String key, String? hint) {
    final raw = _draft[key];
    // Tri-state: null = MCC default. Visually we render as inactive
    // when null; tapping flips to true → false → null.
    final value = raw is bool ? raw : false;
    final overridden = raw is bool;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'Poppins')),
                if (hint != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(hint,
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.5),
                            fontSize: 11,
                            fontFamily: 'Poppins')),
                  ),
                if (!overridden)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text('MCC default',
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.35),
                            fontSize: 10,
                            fontFamily: 'Poppins')),
                  ),
              ],
            ),
          ),
          Switch(
            value: value,
            activeThumbColor: const Color(0xFF7CFE6A),
            onChanged: (v) => setState(() {
              // First tap: enter override (true/false). Long-press
              // resets to MCC default — implemented via a separate UX,
              // for now ignore null transitions.
              _draft[key] = v;
            }),
          ),
          IconButton(
            tooltip: 'Reset to MCC',
            icon: Icon(Icons.refresh,
                size: 18,
                color: overridden
                    ? Colors.white70
                    : Colors.white.withValues(alpha: 0.25)),
            onPressed:
                overridden ? () => setState(() => _draft[key] = null) : null,
          ),
        ],
      ),
    );
  }

  Widget _intRow(String label, String key, {required String range}) {
    final raw = _draft[key];
    final value = raw is num ? raw.toInt() : null;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'Poppins')),
                Text('Range $range  •  blank = MCC',
                    style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.45),
                        fontSize: 11,
                        fontFamily: 'Poppins')),
              ],
            ),
          ),
          SizedBox(
            width: 90,
            child: TextFormField(
              initialValue: value?.toString() ?? '',
              keyboardType: TextInputType.number,
              style:
                  const TextStyle(color: Colors.white, fontFamily: 'Poppins'),
              decoration: InputDecoration(
                isDense: true,
                filled: true,
                fillColor: Colors.white.withValues(alpha: 0.06),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
              ),
              onChanged: (s) => setState(() {
                final n = int.tryParse(s.trim());
                _draft[key] = n;
              }),
            ),
          ),
        ],
      ),
    );
  }
}
