import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../models/scoring_models.dart';

class InningsSetupResult {
  final String strikerId;
  final String nonStrikerId;
  final String bowlerId;
  final String? wicketKeeperId;
  const InningsSetupResult({
    required this.strikerId,
    required this.nonStrikerId,
    required this.bowlerId,
    this.wicketKeeperId,
  });
}

/// 4-step opening setup — striker → non-striker → bowler → wicket keeper.
/// Port of `InningsSetupModal.jsx`.
class InningsSetupModal extends StatefulWidget {
  final List<RosterPlayer> battingTeam;
  final List<RosterPlayer> bowlingTeam;
  final String battingTeamName;
  final String bowlingTeamName;
  final String inningsLabel;
  final void Function(InningsSetupResult) onConfirm;
  final VoidCallback onClose;

  const InningsSetupModal({
    super.key,
    required this.battingTeam,
    required this.bowlingTeam,
    required this.battingTeamName,
    required this.bowlingTeamName,
    this.inningsLabel = '1st Innings',
    required this.onConfirm,
    required this.onClose,
  });

  @override
  State<InningsSetupModal> createState() => _InningsSetupModalState();
}

class _InningsSetupModalState extends State<InningsSetupModal> {
  int _step = 1; // 1..4
  RosterPlayer? _striker;
  RosterPlayer? _nonStriker;
  RosterPlayer? _bowler;

  static const _stepColors = [
    Color(0xFFEAB308),
    Color(0xFF22D3EE),
    Color(0xFFA78BFA),
    Color(0xFF10B981),
  ];

  String get _stepLabel {
    switch (_step) {
      case 1:
        return 'Choose Opener (Striker)';
      case 2:
        return 'Choose Opener (Non-Striker)';
      case 3:
        return 'Choose Opening Bowler';
      case 4:
        return 'Choose Wicket Keeper';
      default:
        return '';
    }
  }

  List<RosterPlayer> get _pool {
    switch (_step) {
      case 1:
        return widget.battingTeam;
      case 2:
        return widget.battingTeam.where((p) => p.id != _striker?.id).toList();
      case 3:
        return widget.bowlingTeam;
      case 4:
        final keepers = widget.bowlingTeam
            .where((p) => (p.role ?? '').contains('WICKET_KEEPER'))
            .toList();
        final base = keepers.isEmpty ? widget.bowlingTeam : keepers;
        return base.where((p) => p.id != _bowler?.id).toList();
      default:
        return const [];
    }
  }

  String get _teamLabel =>
      (_step <= 2 ? widget.battingTeamName : widget.bowlingTeamName)
          .toUpperCase();

  void _select(RosterPlayer p) {
    HapticFeedback.selectionClick();
    setState(() {
      switch (_step) {
        case 1:
          _striker = p;
          _step = 2;
          break;
        case 2:
          _nonStriker = p;
          _step = 3;
          break;
        case 3:
          _bowler = p;
          _step = 4;
          break;
        case 4:
          widget.onConfirm(InningsSetupResult(
            strikerId: _striker!.id,
            nonStrikerId: _nonStriker!.id,
            bowlerId: _bowler!.id,
            wicketKeeperId: p.id,
          ));
          break;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black.withValues(alpha: 0.9),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
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
                    _header(),
                    Flexible(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(16),
                        child: _playerList(),
                      ),
                    ),
                    if (_striker != null || _nonStriker != null) _footer(),
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
            bottom: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(widget.inningsLabel.toUpperCase(),
                    style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2.4)),
              ),
              GestureDetector(
                onTap: widget.onClose,
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.05),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(LucideIcons.x,
                      color: Colors.white54, size: 16),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(_stepLabel.toUpperCase(),
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  height: 1.1,
                  letterSpacing: -0.5)),
          const SizedBox(height: 16),
          Row(
            children: List.generate(4, (i) {
              final active = _step >= i + 1;
              return Expanded(
                child: Container(
                  margin: EdgeInsets.only(right: i == 3 ? 0 : 8),
                  height: 6,
                  decoration: BoxDecoration(
                    color: active ? _stepColors[i] : const Color(0xFF333333),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _playerList() {
    final pool = _pool;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 8, bottom: 8),
          child: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(LucideIcons.users,
                    color: Colors.white60, size: 14),
              ),
              const SizedBox(width: 12),
              Text(_teamLabel,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.5)),
            ],
          ),
        ),
        if (pool.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 32),
            child: Center(
              child: Text('No players available',
                  style: TextStyle(color: Colors.white54)),
            ),
          )
        else
          ...pool.map(_playerRow),
      ],
    );
  }

  Widget _playerRow(RosterPlayer p) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GestureDetector(
        onTap: () => _select(p),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(8),
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
                      color: Color(0xFFEAB308),
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

  Widget _footer() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border:
            Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
      ),
      child: Row(
        children: [
          if (_striker != null)
            Expanded(
                child:
                    _chip('STRIKER', _striker!.name, const Color(0xFFEAB308))),
          if (_striker != null && _nonStriker != null)
            const SizedBox(width: 12),
          if (_nonStriker != null)
            Expanded(
                child: _chip(
                    'NON-STRIKER', _nonStriker!.name, const Color(0xFF22D3EE))),
        ],
      ),
    );
  }

  Widget _chip(String label, String name, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Text(label,
              style: TextStyle(
                  color: color,
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2)),
          const SizedBox(height: 2),
          Text(name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }
}
