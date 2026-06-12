import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';

/// Card with a small all-caps title and a child body. Used by every
/// section on the player profile (Sports, Recent matches, Achievements…).
class ProfileSectionCard extends StatelessWidget {
  final String title;
  final Widget child;
  final EdgeInsetsGeometry margin;
  const ProfileSectionCard({
    super.key,
    required this.title,
    required this.child,
    this.margin = const EdgeInsets.only(bottom: 14),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceL1,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.3),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

/// Small pill chip used for sport tags etc.
class ProfileChip extends StatelessWidget {
  final String label;
  const ProfileChip({super.key, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.surfaceL3,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Text(
        label,
        style: const TextStyle(
            color: Colors.white, fontSize: 12, fontWeight: FontWeight.w500),
      ),
    );
  }
}

/// Empty-state hint with optional action button. Used inside section
/// cards before backend wiring lands.
class ProfileEmptyHint extends StatelessWidget {
  final IconData icon;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;
  final bool tall;
  const ProfileEmptyHint({
    super.key,
    required this.icon,
    required this.message,
    this.actionLabel,
    this.onAction,
    this.tall = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(vertical: tall ? 40 : 16, horizontal: 12),
      child: Column(
        children: [
          Icon(icon, color: Colors.white.withValues(alpha: 0.35), size: 28),
          const SizedBox(height: 10),
          Text(
            message,
            textAlign: TextAlign.center,
            style: TextStyle(
                color: Colors.white.withValues(alpha: 0.55),
                fontSize: 12,
                height: 1.4),
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 14),
            GestureDetector(
              onTap: onAction,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.surfaceL3,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.4)),
                ),
                child: Text(
                  actionLabel!,
                  style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 12,
                      fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
