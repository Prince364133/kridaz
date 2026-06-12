import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/constants/app_colors.dart';

/// Horizontal strip of 6 quick-glance stat tiles shown on player profile
/// hero screens. Accepts the raw user map (self-profile shape from
/// `/user/auth/getMe`) or a `stats:` sub-map. Renders `—` for any field
/// the backend hasn't shipped yet so the strip is never broken.
class ProfileQuickStatsStrip extends StatelessWidget {
  final Map<String, dynamic> user;
  const ProfileQuickStatsStrip({super.key, required this.user});

  Map<String, dynamic> get _stats =>
      (user['stats'] as Map<String, dynamic>?) ?? const {};

  int _i(dynamic v) {
    if (v == null) return 0;
    if (v is num) return v.toInt();
    return int.tryParse('$v') ?? 0;
  }

  double _d(dynamic v) {
    if (v == null) return 0;
    if (v is num) return v.toDouble();
    return double.tryParse('$v') ?? 0;
  }

  @override
  Widget build(BuildContext context) {
    final matches = _i(_stats['totalGames'] ??
        _stats['matches'] ??
        user['total_games_played']);

    double? winRate;
    final rawWinRate = _stats['winRate'];
    if (rawWinRate is num) {
      winRate = rawWinRate.toDouble();
    } else {
      final wins = _i(_stats['wins']);
      if (matches > 0) winRate = wins / matches;
    }

    final rating = _i(_stats['playerRating'] ?? user['playerRating']);
    final streak = _i(_stats['currentStreak']);
    final hours = _d(_stats['hoursPlayed']);
    final followers = _i(user['followersCount'] ??
        (user['_count'] as Map?)?['followers'] ??
        _stats['followers']);

    final tiles = <ProfileStatTile>[
      ProfileStatTile(
        label: 'Games',
        value: matches > 0 ? '$matches' : '—',
        icon: LucideIcons.trophy,
      ),
      ProfileStatTile(
        label: 'Win Rate',
        value: winRate == null ? '—' : '${(winRate * 100).toStringAsFixed(0)}%',
        icon: LucideIcons.target,
      ),
      ProfileStatTile(
        label: 'Rating',
        value: rating > 0 ? '$rating' : '—',
        icon: LucideIcons.barChart3,
      ),
      ProfileStatTile(
        label: 'Streak',
        value: streak == 0 ? '—' : (streak > 0 ? 'W$streak' : 'L${-streak}'),
        icon: LucideIcons.flame,
        accent: streak > 0
            ? AppColors.primary
            : (streak < 0 ? AppColors.errorRed : null),
      ),
      ProfileStatTile(
        label: 'Hours',
        value: hours > 0 ? hours.toStringAsFixed(0) : '—',
        icon: LucideIcons.clock,
      ),
      ProfileStatTile(
        label: 'Followers',
        value: '$followers',
        icon: LucideIcons.users,
      ),
    ];

    return Container(
      color: Colors.black,
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
      child: SizedBox(
        height: 76,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: tiles.length,
          separatorBuilder: (_, __) => const SizedBox(width: 10),
          itemBuilder: (_, i) => tiles[i],
        ),
      ),
    );
  }
}

class ProfileStatTile extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color? accent;
  const ProfileStatTile({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.accent,
  });

  @override
  Widget build(BuildContext context) {
    final color = accent ?? Colors.white;
    return Container(
      width: 96,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surfaceL2,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.primary, size: 14),
          const Spacer(),
          Text(
            value,
            style: TextStyle(
                color: color, fontSize: 17, fontWeight: FontWeight.w800),
          ),
          Text(
            label,
            style: TextStyle(
                color: Colors.white.withValues(alpha: 0.55),
                fontSize: 10,
                fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}
