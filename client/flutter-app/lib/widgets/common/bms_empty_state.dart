import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import 'primary_gradient_button.dart';

/// Canonical empty / error / not-found state. Use anywhere a list is empty
/// or a request failed, instead of bespoke "No data" centered Text widgets.
///
///   BmsEmptyState(
///     icon: Icons.sports_cricket_outlined,
///     title: 'No live matches',
///     subtitle: 'Check back when the first match goes live.',
///   )
///
///   BmsEmptyState.error(
///     title: 'Couldn't load teams',
///     subtitle: 'Network error — try again.',
///     actionLabel: 'Retry',
///     onAction: _retry,
///   )
class BmsEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;
  final Color iconColor;

  const BmsEmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.actionLabel,
    this.onAction,
    this.iconColor = Colors.white24,
  });

  /// Error-flavoured preset (red icon, suggested "Retry" wording).
  factory BmsEmptyState.error({
    Key? key,
    IconData icon = LucideIcons.alertCircle,
    String title = 'Something went wrong',
    String? subtitle,
    String? actionLabel = 'Retry',
    VoidCallback? onAction,
  }) =>
      BmsEmptyState(
        key: key,
        icon: icon,
        title: title,
        subtitle: subtitle,
        actionLabel: actionLabel,
        onAction: onAction,
        iconColor: AppColors.accentRed,
      );

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: iconColor, size: 48),
            const SizedBox(height: 14),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w700,
                fontFamily: 'Poppins',
              ),
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 6),
              Text(
                subtitle!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppColors.dimText,
                  fontSize: 13,
                  height: 1.4,
                  fontFamily: 'Poppins',
                ),
              ),
            ],
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 20),
              PrimaryGradientButton(
                label: actionLabel!,
                onPressed: onAction,
                fullWidth: false,
                height: 44,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
