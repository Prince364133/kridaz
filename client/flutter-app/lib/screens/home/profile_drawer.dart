import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import 'package:go_router/go_router.dart';
import '../../services/auth_manager.dart';

/// Side-drawer used on the home dashboard — avatar + menu + logout.
/// Extracted from `new_home_dashboard.dart` to keep that file under control.
class ProfileDrawer extends StatelessWidget {
  final VoidCallback onClose;
  const ProfileDrawer({super.key, required this.onClose});

  @override
  Widget build(BuildContext context) {
    final user = AuthManager().currentUser;
    final name = (user?['name'] as String?)?.isNotEmpty == true
        ? user!['name'] as String
        : (user?['displayName'] as String? ?? 'User');
    final email = user?['email'] as String? ?? '';
    final avatar =
        user?['profilePicture'] as String? ?? user?['avatar'] as String?;

    return Material(
      color: Colors.transparent,
      child: Container(
        decoration: const BoxDecoration(
          color: AppColors.surfaceL1,
          borderRadius: BorderRadius.only(
            topRight: Radius.circular(20),
            bottomRight: Radius.circular(20),
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withValues(alpha: 0.10),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.18),
                            width: 1.5,
                          ),
                        ),
                        child: avatar != null
                            ? ClipOval(
                                child: CachedNetworkImage(
                                  imageUrl: avatar,
                                  fit: BoxFit.cover,
                                  errorWidget: (_, __, ___) => const Icon(
                                      LucideIcons.user,
                                      color: Colors.white70,
                                      size: 26),
                                ),
                              )
                            : const Icon(LucideIcons.user,
                                color: Colors.white70, size: 26),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              name,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                fontFamily: 'Poppins',
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            if (email.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                email,
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.50),
                                  fontSize: 12,
                                  fontFamily: 'Poppins',
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              Divider(
                color: Colors.white.withValues(alpha: 0.08),
                height: 1,
                indent: 20,
                endIndent: 20,
              ),
              const SizedBox(height: 8),

              // â”€â”€ Menu items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  children: [
                    _DrawerItem(
                      icon: LucideIcons.messageCircle,
                      label: 'Messages',
                      onTap: () {
                        onClose();
                        context.push('/conversations');
                      },
                    ),
                    _DrawerItem(
                      icon: LucideIcons.users,
                      label: 'My Teams',
                      onTap: () {
                        onClose();
                        context.push('/my-teams');
                      },
                    ),
                    _DrawerItem(
                      icon: LucideIcons.calendar,
                      label: 'My Bookings',
                      onTap: () {
                        onClose();
                        context.push('/bookings');
                      },
                    ),
                    _DrawerItem(
                      icon: Icons.sports_outlined,
                      label: 'My Hosted Games',
                      onTap: () {
                        onClose();
                        context.push('/my-games');
                      },
                    ),
                    _DrawerItem(
                      icon: LucideIcons.trophy,
                      label: 'My Joined Matches',
                      onTap: () {
                        onClose();
                        context.push('/my-games');
                      },
                    ),
                    _DrawerItem(
                      icon: LucideIcons.radio,
                      label: 'Live Matches',
                      highlight: true,
                      onTap: () {
                        onClose();
                        context.push('/live-matches');
                      },
                    ),
                    _DrawerItem(
                      icon: Icons.leaderboard_outlined,
                      label: 'Global Leaderboard',
                      highlight: true,
                      onTap: () {
                        onClose();
                        context.push('/leaderboard');
                      },
                    ),
                    _DrawerItem(
                      icon: LucideIcons.wallet,
                      label: 'My Wallet',
                      onTap: () {
                        onClose();
                        context.push('/wallet');
                      },
                    ),
                    _DrawerItem(
                      icon: LucideIcons.bookmark,
                      label: 'Saved',
                      onTap: () {
                        onClose();
                        context.push('/saved');
                      },
                    ),
                    _DrawerItem(
                      icon: LucideIcons.bookOpen,
                      label: 'Blogs',
                      onTap: () {
                        onClose();
                        context.push('/blogs');
                      },
                    ),
                    _DrawerItem(
                      icon: LucideIcons.alertCircle,
                      label: 'Raise a Dispute',
                      onTap: () {
                        onClose();
                        context.push('/dispute');
                      },
                    ),
                    // Dev-only smoke harness — hidden in release builds.
                    if (kDebugMode)
                      _DrawerItem(
                        icon: LucideIcons.terminal,
                        label: 'Scoring Smoke Test',
                        onTap: () {
                          onClose();
                          context.push('/dev/scoring-smoke');
                        },
                      ),

                    // Legal / about
                    const SizedBox(height: 8),
                    Divider(
                        color: Colors.white.withValues(alpha: 0.06),
                        indent: 12,
                        endIndent: 12),
                    const SizedBox(height: 4),
                    _DrawerItem(
                      icon: LucideIcons.fileText,
                      label: 'Terms of Service',
                      onTap: () {
                        onClose();
                        context.push('/legal/terms');
                      },
                    ),
                    _DrawerItem(
                      icon: LucideIcons.shield,
                      label: 'Privacy Policy',
                      onTap: () {
                        onClose();
                        context.push('/legal/privacy');
                      },
                    ),
                    _DrawerItem(
                      icon: LucideIcons.helpCircle,
                      label: 'FAQ',
                      onTap: () {
                        onClose();
                        context.push('/legal/faq');
                      },
                    ),
                    _DrawerItem(
                      icon: LucideIcons.mail,
                      label: 'Contact Us',
                      onTap: () {
                        onClose();
                        context.push('/legal/contact');
                      },
                    ),
                  ],
                ),
              ),

              Divider(
                color: Colors.white.withValues(alpha: 0.08),
                height: 1,
                indent: 20,
                endIndent: 20,
              ),
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                child: Column(
                  children: [
                    _DrawerItem(
                      icon: Icons.logout_rounded,
                      label: 'Logout',
                      danger: true,
                      onTap: () async {
                        onClose();
                        await AuthManager().signOut();
                      },
                    ),
                    _DrawerItem(
                      icon: LucideIcons.shieldOff,
                      label: 'Sign out of all devices',
                      danger: true,
                      onTap: () async {
                        final confirm = await _confirmLogoutAll(context);
                        if (confirm != true) return;
                        onClose();
                        await AuthManager().signOutAll();
                      },
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}

Future<bool?> _confirmLogoutAll(BuildContext context) {
  return showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: AppColors.surfaceL2,
      title: const Text(
        'Sign out everywhere?',
        style: TextStyle(color: Colors.white, fontFamily: 'Poppins'),
      ),
      content: const Text(
        'Every device currently signed in to your account will be logged out. '
        'Use this if your account may have been compromised.',
        style: TextStyle(color: Colors.white70, fontFamily: 'Poppins'),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(false),
          child: const Text('Cancel',
              style: TextStyle(color: Colors.white70, fontFamily: 'Poppins')),
        ),
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(true),
          child: const Text('Sign out everywhere',
              style:
                  TextStyle(color: AppColors.errorRed, fontFamily: 'Poppins')),
        ),
      ],
    ),
  );
}

class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool highlight;
  final bool danger;

  const _DrawerItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.highlight = false,
    this.danger = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = danger
        ? AppColors.errorRed
        : highlight
            ? AppColors.accentTeal
            : Colors.white;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 2),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
          decoration: highlight
              ? BoxDecoration(
                  color: AppColors.accentTeal.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(10),
                )
              : null,
          child: Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 14),
              Text(
                label,
                style: TextStyle(
                  color: color,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  fontFamily: 'Poppins',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
