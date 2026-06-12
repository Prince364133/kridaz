import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/team_model.dart';
import '../../core/constants/app_colors.dart';
import '../../core/util/image_url.dart';

class MemberCard extends StatelessWidget {
  final TeamMemberModel member;
  final bool isOwner;
  final Future<void> Function()? onRemove;
  final Future<void> Function(TeamRole)? onSetTeamRole;
  final Future<void> Function(PlayingRole)? onSetPlayingRole;

  const MemberCard({
    super.key,
    required this.member,
    this.isOwner = false,
    this.onRemove,
    this.onSetTeamRole,
    this.onSetPlayingRole,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isOwner ? () => _showActions(context) : null,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.surfaceL3,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white12),
        ),
        child: Row(
          children: [
            _avatar(),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    member.userName ?? 'Player',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'Poppins',
                    ),
                  ),
                  const SizedBox(height: 4),
                  Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    children: [
                      RoleBadge(role: member.role),
                      if (member.playingRole != PlayingRole.none)
                        PlayingRoleBadge(role: member.playingRole),
                      StatusBadge(status: member.status),
                    ],
                  ),
                ],
              ),
            ),
            if (isOwner)
              const Icon(LucideIcons.moreVertical,
                  color: Colors.white38, size: 20),
          ],
        ),
      ),
    );
  }

  Widget _avatar() {
    final url = safeAvatarUrl(member.avatarUrl);
    if (url != null) {
      return CircleAvatar(
        radius: 22,
        backgroundImage: CachedNetworkImageProvider(url),
      );
    }
    return CircleAvatar(
      radius: 22,
      backgroundColor: AppColors.primary.withValues(alpha: 0.15),
      child: Text(
        (member.userName?.isNotEmpty == true)
            ? member.userName![0].toUpperCase()
            : '?',
        style: const TextStyle(
          color: AppColors.primary,
          fontWeight: FontWeight.w700,
          fontFamily: 'Poppins',
        ),
      ),
    );
  }

  void _showActions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceL3,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetCtx) => SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                child: Text(
                  member.userName ?? 'Player',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Poppins',
                  ),
                ),
              ),
              const Divider(color: Colors.white12, height: 1),
              const SizedBox(height: 8),
              _sectionTitle('Team role'),
              if (member.role == TeamRole.captain)
                _actionTile(
                  context: sheetCtx,
                  icon: LucideIcons.crown,
                  iconColor: AppColors.primary,
                  label: 'Remove as Captain',
                  enabled: onSetTeamRole != null,
                  onTap: () => onSetTeamRole?.call(TeamRole.player),
                )
              else
                _actionTile(
                  context: sheetCtx,
                  icon: LucideIcons.crown,
                  iconColor: AppColors.primary,
                  label: 'Make Captain',
                  enabled: onSetTeamRole != null,
                  onTap: () => onSetTeamRole?.call(TeamRole.captain),
                ),
              if (member.role == TeamRole.viceCaptain)
                _actionTile(
                  context: sheetCtx,
                  icon: LucideIcons.shield,
                  iconColor: AppColors.accentCyan,
                  label: 'Remove as Vice Captain',
                  enabled: onSetTeamRole != null,
                  onTap: () => onSetTeamRole?.call(TeamRole.player),
                )
              else
                _actionTile(
                  context: sheetCtx,
                  icon: LucideIcons.shield,
                  iconColor: AppColors.accentCyan,
                  label: 'Make Vice Captain',
                  enabled: onSetTeamRole != null,
                  onTap: () => onSetTeamRole?.call(TeamRole.viceCaptain),
                ),
              const SizedBox(height: 12),
              _sectionTitle('Playing role'),
              _playingRoleTile(
                  sheetCtx, PlayingRole.batsman, LucideIcons.swords),
              _playingRoleTile(
                  sheetCtx, PlayingRole.bowler, LucideIcons.target),
              _playingRoleTile(
                  sheetCtx, PlayingRole.allRounder, LucideIcons.zap),
              _playingRoleTile(
                  sheetCtx, PlayingRole.wicketKeeper, LucideIcons.shieldCheck),
              if (onRemove != null && member.role != TeamRole.captain) ...[
                const SizedBox(height: 12),
                const Divider(color: Colors.white12, height: 1),
                const SizedBox(height: 4),
                _actionTile(
                  context: sheetCtx,
                  icon: LucideIcons.minusCircle,
                  iconColor: Colors.redAccent,
                  label: 'Remove from Team',
                  textColor: Colors.redAccent,
                  enabled: onRemove != null,
                  onTap: () => onRemove?.call(),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _sectionTitle(String text) => Padding(
        padding: const EdgeInsets.fromLTRB(8, 4, 8, 4),
        child: Text(
          text.toUpperCase(),
          style: const TextStyle(
            color: Colors.white38,
            fontSize: 11,
            letterSpacing: 1.1,
            fontWeight: FontWeight.w600,
            fontFamily: 'Poppins',
          ),
        ),
      );

  Widget _playingRoleTile(
      BuildContext sheetCtx, PlayingRole role, IconData icon) {
    final selected = member.playingRole == role;
    return _actionTile(
      context: sheetCtx,
      icon: icon,
      iconColor: selected ? AppColors.primary : Colors.white70,
      label: selected ? '${role.label} (current)' : role.label,
      enabled: onSetPlayingRole != null && !selected,
      onTap: () => onSetPlayingRole?.call(role),
    );
  }

  Widget _actionTile({
    required BuildContext context,
    required IconData icon,
    required Color iconColor,
    required String label,
    required bool enabled,
    required void Function() onTap,
    Color textColor = Colors.white,
  }) {
    return ListTile(
      dense: true,
      enabled: enabled,
      leading: Icon(icon, color: enabled ? iconColor : Colors.white24),
      title: Text(
        label,
        style: TextStyle(
          color: enabled ? textColor : Colors.white24,
          fontFamily: 'Poppins',
        ),
      ),
      onTap: () {
        context.pop();
        onTap();
      },
    );
  }
}

class RoleBadge extends StatelessWidget {
  final TeamRole role;
  const RoleBadge({super.key, required this.role});

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (role) {
      TeamRole.captain => ('Captain', AppColors.primary),
      TeamRole.viceCaptain => ('Vice Captain', AppColors.accentCyan),
      TeamRole.guest => ('Guest', Colors.white38),
      _ => ('Player', Colors.white54),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w600,
          fontFamily: 'Poppins',
        ),
      ),
    );
  }
}

class PlayingRoleBadge extends StatelessWidget {
  final PlayingRole role;
  const PlayingRoleBadge({super.key, required this.role});

  @override
  Widget build(BuildContext context) {
    final color = switch (role) {
      PlayingRole.batsman => Colors.amber,
      PlayingRole.bowler => Colors.lightBlueAccent,
      PlayingRole.allRounder => Colors.purpleAccent,
      PlayingRole.wicketKeeper => Colors.greenAccent,
      PlayingRole.none => Colors.white38,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Text(
        role.label,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w600,
          fontFamily: 'Poppins',
        ),
      ),
    );
  }
}

class StatusBadge extends StatelessWidget {
  final TeamMemberStatus status;
  const StatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      TeamMemberStatus.joined => ('Joined', Colors.green),
      TeamMemberStatus.pending => ('Pending', Colors.orange),
      TeamMemberStatus.declined => ('Declined', Colors.redAccent),
      _ => ('Accepted', Colors.green),
    };
    return Text(
      label,
      style: TextStyle(color: color, fontSize: 11, fontFamily: 'Poppins'),
    );
  }
}
