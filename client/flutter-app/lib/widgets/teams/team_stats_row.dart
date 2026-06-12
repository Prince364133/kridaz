import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class TeamStatsRow extends StatelessWidget {
  final int memberCount;
  final int matchesPlayed;
  final int wins;

  const TeamStatsRow({
    super.key,
    required this.memberCount,
    this.matchesPlayed = 0,
    this.wins = 0,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _StatItem(label: 'Members', value: '$memberCount'),
        _divider(),
        _StatItem(label: 'Matches', value: '$matchesPlayed'),
        _divider(),
        _StatItem(label: 'Wins', value: '$wins'),
      ],
    );
  }

  Widget _divider() => Container(
        width: 1,
        height: 32,
        margin: const EdgeInsets.symmetric(horizontal: 16),
        color: Colors.white12,
      );
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;

  const _StatItem({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            color: AppColors.primary,
            fontSize: 22,
            fontWeight: FontWeight.w700,
            fontFamily: 'Poppins',
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white54,
            fontSize: 12,
            fontFamily: 'Poppins',
          ),
        ),
      ],
    );
  }
}
