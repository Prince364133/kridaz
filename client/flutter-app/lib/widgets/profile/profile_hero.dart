import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/constants/app_colors.dart';

/// Whether the hero is showing the signed-in user (self) or another
/// player (viewer). Drives which CTA row renders.
enum ProfileHeroMode { self, viewer }

/// Premium hero block used at the top of full-screen profile pages.
/// Cover image, avatar with lime ring, identity column (name + verified
/// badge + level chip, @username, city, sport·skill chip, bio) and a
/// 3-button CTA row.
///
/// Callers supply explicit callbacks for each CTA so this widget stays
/// free of go_router / navigation assumptions (except the default
/// back button, which falls back to /dashboard).
class ProfileHero extends StatelessWidget {
  final Map<String, dynamic> user;
  final ProfileHeroMode mode;
  final VoidCallback? onBack;
  final VoidCallback? onShare;
  final VoidCallback? onSettings;
  // self-mode CTAs
  final VoidCallback? onEdit;
  final VoidCallback? onQr;
  final VoidCallback? onShareProfile;
  final VoidCallback? onChangeCover;
  // viewer-mode CTAs
  final VoidCallback? onChallenge;
  final VoidCallback? onMessage;
  final VoidCallback? onFollow;
  final bool isFollowing;

  const ProfileHero({
    super.key,
    required this.user,
    required this.mode,
    this.onBack,
    this.onShare,
    this.onSettings,
    this.onEdit,
    this.onQr,
    this.onShareProfile,
    this.onChangeCover,
    this.onChallenge,
    this.onMessage,
    this.onFollow,
    this.isFollowing = false,
  });

  bool get _isSelf => mode == ProfileHeroMode.self;

  String get _fullName {
    final full = (user['fullName'] as String?)?.trim();
    if (full != null && full.isNotEmpty) return full;
    final first = user['firstName']?.toString() ?? '';
    final last = user['lastName']?.toString() ?? '';
    final n = '$first $last'.trim();
    if (n.isNotEmpty) return n;
    return (user['name'] ?? user['display_name'] ?? 'Player').toString();
  }

  String? get _username {
    final raw = (user['username'] ?? user['userName'])?.toString();
    if (raw != null && raw.isNotEmpty) return '@$raw';
    return null;
  }

  String? get _photoUrl => (user['profilePhoto'] ??
          user['photoURL'] ??
          user['photo_url'] ??
          user['avatar'])
      ?.toString();
  String? get _coverUrl => user['coverImage']?.toString();
  String get _city => (user['city'] ?? user['location'] ?? '').toString();
  String? get _bio => user['bio']?.toString();

  int get _level {
    final v = user['level'];
    if (v is num) return v.toInt();
    return int.tryParse('$v') ?? 1;
  }

  String get _primarySport {
    final list =
        (user['sportTypes'] ?? user['sports'] ?? user['interests']) as List?;
    if (list == null || list.isEmpty) return '';
    return list.first.toString();
  }

  String? get _skillForPrimary {
    final levels = user['skillLevels'];
    if (levels is Map && _primarySport.isNotEmpty) {
      return levels[_primarySport.toLowerCase()]?.toString();
    }
    return null;
  }

  bool get _verifiedPhone => user['verifiedPhone'] == true;
  bool get _verifiedEmail => user['verifiedEmail'] == true;
  bool get _verifiedId => user['verifiedId'] == true;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        _coverImage(),
        if (_isSelf && onChangeCover != null)
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            right: 60, // sits to the left of the settings/share button
            child: GestureDetector(
              onTap: onChangeCover,
              child: Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.55),
                  shape: BoxShape.circle,
                  border:
                      Border.all(color: Colors.white.withValues(alpha: 0.12)),
                ),
                child: const Icon(LucideIcons.camera,
                    color: Colors.white, size: 16),
              ),
            ),
          ),
        Positioned(
          top: MediaQuery.of(context).padding.top + 8,
          left: 12,
          right: 12,
          child: _topBar(context),
        ),
        Padding(
          padding: const EdgeInsets.only(top: 140),
          child: Container(
            decoration: const BoxDecoration(
              color: Colors.black,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 56),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _identityBlock(),
                ),
                const SizedBox(height: 14),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _ctaRow(context),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
        Positioned(
          top: 100,
          left: 20,
          child: _avatar(),
        ),
      ],
    );
  }

  Widget _coverImage() {
    return Container(
      height: 180,
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.surfaceForestDeep, AppColors.surfaceForest],
        ),
      ),
      child: _coverUrl != null && _coverUrl!.isNotEmpty
          ? CachedNetworkImage(
              imageUrl: _coverUrl!,
              fit: BoxFit.cover,
              errorWidget: (_, __, ___) => const SizedBox.shrink(),
            )
          : null,
    );
  }

  Widget _topBar(BuildContext context) {
    return Row(
      children: [
        _circleBtn(
          icon: LucideIcons.chevronLeft,
          onTap: onBack ??
              () => context.canPop() ? context.pop() : context.go('/dashboard'),
        ),
        const Spacer(),
        _circleBtn(
          icon: LucideIcons.share2,
          onTap: onShare ?? () => HapticFeedback.selectionClick(),
        ),
        if (_isSelf) ...[
          const SizedBox(width: 8),
          _circleBtn(
            icon: LucideIcons.settings,
            onTap: onSettings ?? () => context.push('/settings'),
          ),
        ] else ...[
          const SizedBox(width: 8),
          _circleBtn(
            icon: LucideIcons.moreHorizontal,
            onTap: () => HapticFeedback.selectionClick(),
          ),
        ],
      ],
    );
  }

  Widget _circleBtn({required IconData icon, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.55),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white, size: 18),
      ),
    );
  }

  Widget _avatar() {
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: const BoxDecoration(
        color: Colors.black,
        shape: BoxShape.circle,
      ),
      child: Container(
        width: 90,
        height: 90,
        decoration: BoxDecoration(
          color: AppColors.surfaceL3,
          shape: BoxShape.circle,
          border: Border.all(color: AppColors.primary, width: 2),
        ),
        clipBehavior: Clip.antiAlias,
        child: _photoUrl != null && _photoUrl!.isNotEmpty
            ? CachedNetworkImage(
                imageUrl: _photoUrl!,
                fit: BoxFit.cover,
                errorWidget: (_, __, ___) => const Icon(LucideIcons.user,
                    color: Colors.white54, size: 36),
              )
            : const Icon(LucideIcons.user, color: Colors.white54, size: 36),
      ),
    );
  }

  Widget _identityBlock() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Flexible(
              child: Text(
                _fullName,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 6),
            if (_verifiedId)
              const Icon(Icons.verified, color: AppColors.primary, size: 18)
            else if (_verifiedPhone || _verifiedEmail)
              Icon(Icons.verified,
                  color: Colors.white.withValues(alpha: 0.45), size: 16),
            const Spacer(),
            _levelBadge(),
          ],
        ),
        if (_username != null) ...[
          const SizedBox(height: 2),
          Text(
            _username!,
            style: TextStyle(
                color: Colors.white.withValues(alpha: 0.55), fontSize: 13),
          ),
        ],
        if (_city.isNotEmpty) ...[
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(LucideIcons.mapPin,
                  color: AppColors.primary, size: 13),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  _city,
                  style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.7), fontSize: 12),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
        if (_primarySport.isNotEmpty) ...[
          const SizedBox(height: 10),
          _sportSkillChip(),
        ],
        if (_bio != null && _bio!.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text(
            _bio!,
            style: TextStyle(
                color: Colors.white.withValues(alpha: 0.8),
                fontSize: 13,
                height: 1.4),
          ),
        ],
      ],
    );
  }

  Widget _levelBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surfaceL3,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(LucideIcons.shield, color: AppColors.primary, size: 12),
          const SizedBox(width: 4),
          Text(
            'LV $_level',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _sportSkillChip() {
    final skill = _skillForPrimary;
    final label = skill == null
        ? _primarySport
        : '$_primarySport · ${skill[0].toUpperCase()}${skill.substring(1)}';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.gradientStart, AppColors.gradientEnd],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: const TextStyle(
            color: Colors.black, fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }

  Widget _ctaRow(BuildContext context) {
    if (_isSelf) {
      return Row(
        children: [
          Expanded(
            child: _primaryCta(
              label: 'Edit Profile',
              icon: LucideIcons.userCog,
              onTap: onEdit ?? () => context.push('/profile/edit'),
            ),
          ),
          const SizedBox(width: 10),
          _secondaryCta(
            icon: LucideIcons.qrCode,
            onTap: onQr ?? () => HapticFeedback.selectionClick(),
          ),
          const SizedBox(width: 10),
          _secondaryCta(
            icon: LucideIcons.share2,
            onTap: onShareProfile ?? () => HapticFeedback.selectionClick(),
          ),
        ],
      );
    }
    return Row(
      children: [
        Expanded(
          child: _primaryCta(
            label: 'Challenge',
            icon: LucideIcons.swords,
            onTap: onChallenge ?? () => HapticFeedback.selectionClick(),
          ),
        ),
        const SizedBox(width: 10),
        _secondaryCta(
          icon: LucideIcons.messageCircle,
          onTap: onMessage ?? () => HapticFeedback.selectionClick(),
        ),
        const SizedBox(width: 10),
        _secondaryCta(
          icon: isFollowing ? LucideIcons.userCheck : LucideIcons.userPlus,
          onTap: onFollow ?? () => HapticFeedback.selectionClick(),
        ),
      ],
    );
  }

  Widget _primaryCta({
    required String label,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 46,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.gradientStart, AppColors.gradientEnd],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.black, size: 16),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(
                  color: Colors.black,
                  fontSize: 14,
                  fontWeight: FontWeight.w700),
            ),
          ],
        ),
      ),
    );
  }

  Widget _secondaryCta({required IconData icon, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 46,
        height: 46,
        decoration: BoxDecoration(
          color: AppColors.surfaceL2,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Icon(icon, color: Colors.white, size: 18),
      ),
    );
  }
}
