import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../models/scoring_models.dart';
import 'scoring_theme.dart';

class WicketResult {
  final String wicketType;
  final String? fielderId;
  final String? nextBatterId;
  final String? playerOutId;
  final int runs;
  const WicketResult({
    required this.wicketType,
    this.fielderId,
    this.nextBatterId,
    this.playerOutId,
    this.runs = 0,
  });
}

class _WicketType {
  final String key;
  final String label;
  final bool needsFielder;
  final bool needsWhoOut;
  final bool needsRuns;
  const _WicketType(
    this.key,
    this.label, {
    this.needsFielder = false,
    this.needsWhoOut = false,
    this.needsRuns = false,
  });
}

const _wicketTypes = <_WicketType>[
  _WicketType('BOWLED', 'Bowled'),
  _WicketType('CAUGHT', 'Caught', needsFielder: true),
  _WicketType('LBW', 'LBW'),
  _WicketType('RUN_OUT', 'Run Out',
      needsFielder: true, needsWhoOut: true, needsRuns: true),
  _WicketType('STUMPED', 'Stumped', needsFielder: true),
  _WicketType('HIT_WICKET', 'Hit Wicket'),
  _WicketType('OBSTRUCTING', 'Obstructing Field', needsWhoOut: true),
  _WicketType('RETIRED_HURT', 'Retired Hurt', needsWhoOut: true),
  _WicketType('RETIRED_OUT', 'Retired Out', needsWhoOut: true),
  _WicketType('TIMED_OUT', 'Timed Out'),
];

enum _Step { type, whoOut, runs, fielder, nextBatter }

/// Multi-step wicket flow — Flutter port of `WicketModal.jsx`.
class WicketModal extends StatefulWidget {
  final List<RosterPlayer> fieldingTeam;
  final List<RosterPlayer> battingTeam; // remaining batters
  final List<RosterPlayer> activeBatters; // striker + non-striker
  final void Function(WicketResult) onConfirm;
  final VoidCallback onClose;

  /// Free Hit (Law 21.18) — when true, BOWLED/LBW/CAUGHT/STUMPED/HIT_WICKET
  /// are disabled because the backend will reject them with
  /// FREE_HIT_INVALID_DISMISSAL. Only RUN_OUT (and the rare obstructing
  /// / retired / timed-out variants) are allowed.
  final bool freeHitActive;

  const WicketModal({
    super.key,
    required this.fieldingTeam,
    required this.battingTeam,
    required this.activeBatters,
    required this.onConfirm,
    required this.onClose,
    this.freeHitActive = false,
  });

  @override
  State<WicketModal> createState() => _WicketModalState();
}

class _WicketModalState extends State<WicketModal> {
  _Step _step = _Step.type;
  _WicketType? _type;
  String? _fielderId;
  String? _playerOutId;
  int _runs = 0;

  void _advance(_Step from) {
    final t = _type!;
    if (from == _Step.type) {
      if (t.needsWhoOut && widget.activeBatters.isNotEmpty) {
        setState(() => _step = _Step.whoOut);
        return;
      }
      _advance(_Step.whoOut);
      return;
    }
    if (from == _Step.whoOut) {
      if (t.needsRuns) {
        setState(() => _step = _Step.runs);
        return;
      }
      _advance(_Step.runs);
      return;
    }
    if (from == _Step.runs) {
      if (t.needsFielder && widget.fieldingTeam.isNotEmpty) {
        setState(() => _step = _Step.fielder);
        return;
      }
      setState(() => _step = _Step.nextBatter);
      return;
    }
    setState(() => _step = _Step.nextBatter);
  }

  void _stepBack() {
    final t = _type;
    if (t == null) return;
    if (_step == _Step.nextBatter) {
      if (t.needsFielder) {
        setState(() => _step = _Step.fielder);
        return;
      }
      if (t.needsRuns) {
        setState(() => _step = _Step.runs);
        return;
      }
      if (t.needsWhoOut) {
        setState(() => _step = _Step.whoOut);
        return;
      }
      setState(() => _step = _Step.type);
      return;
    }
    if (_step == _Step.fielder) {
      if (t.needsRuns) {
        setState(() => _step = _Step.runs);
        return;
      }
      if (t.needsWhoOut) {
        setState(() => _step = _Step.whoOut);
        return;
      }
      setState(() => _step = _Step.type);
      return;
    }
    if (_step == _Step.runs) {
      if (t.needsWhoOut) {
        setState(() => _step = _Step.whoOut);
        return;
      }
      setState(() => _step = _Step.type);
      return;
    }
    setState(() => _step = _Step.type);
  }

  String get _title {
    switch (_step) {
      case _Step.type:
        return 'How was the wicket?';
      case _Step.whoOut:
        return 'Who got out?';
      case _Step.runs:
        return 'Runs completed before run out?';
      case _Step.fielder:
        final k = _type?.key;
        if (k == 'STUMPED') return 'Who stumped?';
        if (k == 'RUN_OUT') return 'Who ran them out?';
        return 'Who caught it?';
      case _Step.nextBatter:
        return 'Who bats next?';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black.withValues(alpha: 0.85),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Container(
                constraints: const BoxConstraints(maxWidth: 450),
                decoration: const BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _header(),
                    Flexible(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(16),
                        child: _body(),
                      ),
                    ),
                    if (_step != _Step.type) _bottom(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _header() {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_title.toUpperCase(),
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        height: 1.1,
                        letterSpacing: -0.5)),
                if (_type != null) ...[
                  const SizedBox(height: 6),
                  Text(_type!.label.toUpperCase(),
                      style: const TextStyle(
                          color: Color(0xFFFCA5A5),
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 2.4)),
                ],
              ],
            ),
          ),
          GestureDetector(
            onTap: widget.onClose,
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                shape: BoxShape.circle,
              ),
              child: const Icon(LucideIcons.x, color: Colors.white54, size: 16),
            ),
          ),
        ],
      ),
    );
  }

  Widget _body() {
    switch (_step) {
      case _Step.type:
        return GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          childAspectRatio: 2.6,
          children: _wicketTypes.map((t) => _wicketTypeCell(t)).toList(),
        );
      case _Step.whoOut:
        return Column(
          children: widget.activeBatters
              .map((p) =>
                  _playerCell(p, accent: ScoringTheme.accentRed, onTap: () {
                    setState(() => _playerOutId = p.id);
                    _advance(_Step.whoOut);
                  }))
              .toList(),
        );
      case _Step.runs:
        return GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 4,
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          childAspectRatio: 1.5,
          children:
              [for (var r = 0; r <= 6; r++) r].map((r) => _runCell(r)).toList(),
        );
      case _Step.fielder:
        return Column(
          children: widget.fieldingTeam
              .map((p) =>
                  _playerCell(p, accent: ScoringTheme.accentRed, onTap: () {
                    setState(() => _fielderId = p.id);
                    setState(() => _step = _Step.nextBatter);
                  }))
              .toList(),
        );
      case _Step.nextBatter:
        if (widget.battingTeam.isEmpty) {
          return Column(
            children: [
              const Icon(LucideIcons.users, color: Colors.white24, size: 32),
              const SizedBox(height: 12),
              const Text('All wickets fallen — innings over!',
                  style: TextStyle(color: Colors.white60, fontSize: 13)),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => widget.onConfirm(WicketResult(
                    wicketType: _type!.key,
                    fielderId: _fielderId,
                    nextBatterId: null,
                    playerOutId: _playerOutId,
                    runs: _runs,
                  )),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ScoringTheme.accentRed,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8)),
                  ),
                  child: const Text('END INNINGS',
                      style: TextStyle(
                          fontWeight: FontWeight.w900, letterSpacing: 2.4)),
                ),
              ),
            ],
          );
        }
        return Column(
          children: widget.battingTeam
              .map((p) =>
                  _playerCell(p, accent: const Color(0xFFFACC15), onTap: () {
                    widget.onConfirm(WicketResult(
                      wicketType: _type!.key,
                      fielderId: _fielderId,
                      nextBatterId: p.id,
                      playerOutId: _playerOutId,
                      runs: _runs,
                    ));
                  }))
              .toList(),
        );
    }
  }

  Widget _wicketTypeCell(_WicketType t) {
    final disabled = widget.freeHitActive &&
        const {'BOWLED', 'LBW', 'CAUGHT', 'STUMPED', 'HIT_WICKET'}
            .contains(t.key);
    return GestureDetector(
      onTap: disabled
          ? null
          : () {
              HapticFeedback.selectionClick();
              setState(() => _type = t);
              _advance(_Step.type);
            },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: disabled
              ? ScoringTheme.bgPanelSoft.withValues(alpha: 0.35)
              : ScoringTheme.bgPanelSoft,
          borderRadius: BorderRadius.circular(8),
          border: disabled
              ? Border.all(color: Colors.white.withValues(alpha: 0.05))
              : null,
        ),
        alignment: Alignment.centerLeft,
        child: Row(
          children: [
            Expanded(
              child: Text(t.label,
                  style: TextStyle(
                      color: disabled ? Colors.white24 : Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w900)),
            ),
            if (disabled)
              const Text('FREE HIT',
                  style: TextStyle(
                      color: Color(0xFFFFC107),
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.2)),
          ],
        ),
      ),
    );
  }

  Widget _runCell(int run) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => _runs = run);
        _advance(_Step.runs);
      },
      child: Container(
        decoration: BoxDecoration(
          color: ScoringTheme.bgPanelSoft,
          borderRadius: BorderRadius.circular(8),
        ),
        alignment: Alignment.center,
        child: Text('$run',
            style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w900)),
      ),
    );
  }

  Widget _playerCell(RosterPlayer p,
      {required Color accent, required VoidCallback onTap}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: ScoringTheme.bgPanelSoft,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  p.name.isNotEmpty ? p.name[0].toUpperCase() : '?',
                  style: TextStyle(
                      color: accent, fontSize: 14, fontWeight: FontWeight.w900),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(p.name,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w700)),
                    if (p.role != null && p.role!.isNotEmpty)
                      Text(p.role!.toUpperCase(),
                          style: const TextStyle(
                              color: Colors.white54,
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 2)),
                  ],
                ),
              ),
              Icon(LucideIcons.chevronRight,
                  color: Colors.white.withValues(alpha: 0.4), size: 14),
            ],
          ),
        ),
      ),
    );
  }

  Widget _bottom() {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
      decoration: BoxDecoration(
        border:
            Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
      ),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: _stepBack,
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white70,
                backgroundColor: ScoringTheme.bgControlBar,
                side: BorderSide(color: Colors.white.withValues(alpha: 0.05)),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text('BACK',
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2.4)),
            ),
          ),
          if (_step == _Step.fielder) ...[
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: () => setState(() => _step = _Step.nextBatter),
                style: ElevatedButton.styleFrom(
                  backgroundColor: ScoringTheme.bgPanelSoft,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('SKIP FIELDER',
                    style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2.4)),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
