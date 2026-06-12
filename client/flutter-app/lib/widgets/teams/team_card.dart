import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/team_model.dart';
import '../../core/constants/app_colors.dart';
import '../../core/util/image_url.dart';

class TeamCard extends StatelessWidget {
  final TeamModel team;

  /// Optional tap handler. When null the card renders but is non-interactive
  /// (used in lists where some rows are disabled, e.g. self-challenge).
  final VoidCallback? onTap;

  const TeamCard({super.key, required this.team, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surfaceL3,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white12),
        ),
        child: Row(
          children: [
            _TeamAvatar(imageUrl: team.imageUrl, name: team.name),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    team.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'Poppins',
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      _SportBadge(sport: team.sportType),
                      const SizedBox(width: 8),
                      if (team.city != null)
                        Text(
                          team.city!,
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 12,
                            fontFamily: 'Poppins',
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${team.members.length}',
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Poppins',
                  ),
                ),
                const Text(
                  'members',
                  style: TextStyle(
                    color: Colors.white38,
                    fontSize: 11,
                    fontFamily: 'Poppins',
                  ),
                ),
              ],
            ),
            const SizedBox(width: 8),
            const Icon(LucideIcons.chevronRight,
                color: Colors.white38, size: 20),
          ],
        ),
      ),
    );
  }
}

class _TeamAvatar extends StatelessWidget {
  final String? imageUrl;
  final String name;

  const _TeamAvatar({this.imageUrl, required this.name});

  @override
  Widget build(BuildContext context) {
    final url = safeAvatarUrl(imageUrl);
    if (url != null) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: CachedNetworkImage(
          imageUrl: url,
          width: 52,
          height: 52,
          fit: BoxFit.cover,
          placeholder: (_, __) => _initials(name),
          errorWidget: (_, __, ___) => _initials(name),
        ),
      );
    }
    return _initials(name);
  }

  Widget _initials(String name) {
    return Container(
      width: 52,
      height: 52,
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.4)),
      ),
      alignment: Alignment.center,
      child: Text(
        name.isNotEmpty ? name[0].toUpperCase() : '?',
        style: const TextStyle(
          color: AppColors.primary,
          fontSize: 22,
          fontWeight: FontWeight.w700,
          fontFamily: 'Poppins',
        ),
      ),
    );
  }
}

class _SportBadge extends StatelessWidget {
  final String sport;
  const _SportBadge({required this.sport});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
      ),
      child: Text(
        sport,
        style: const TextStyle(
          color: AppColors.primary,
          fontSize: 11,
          fontWeight: FontWeight.w600,
          fontFamily: 'Poppins',
        ),
      ),
    );
  }
}
