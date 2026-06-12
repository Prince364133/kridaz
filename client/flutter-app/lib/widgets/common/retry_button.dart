import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';

/// Reusable retry button widget
class RetryButton extends StatelessWidget {
  final VoidCallback onRetry;
  final String label;
  final bool isLoading;
  final IconData icon;

  const RetryButton({
    super.key,
    required this.onRetry,
    this.label = 'Retry',
    this.isLoading = false,
    this.icon = LucideIcons.refreshCw,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      onPressed: isLoading ? null : onRetry,
      icon: isLoading
          ? const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.black),
              ),
            )
          : Icon(icon),
      label: Text(isLoading ? 'Retrying...' : label),
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.black,
        padding: const EdgeInsets.symmetric(
          horizontal: 24,
          vertical: 12,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        disabledBackgroundColor: AppColors.primary.withValues(alpha: 0.5),
      ),
    );
  }
}

/// Compact retry button for inline use
class CompactRetryButton extends StatelessWidget {
  final VoidCallback onRetry;
  final bool isLoading;

  const CompactRetryButton({
    super.key,
    required this.onRetry,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return TextButton.icon(
      onPressed: isLoading ? null : onRetry,
      icon: isLoading
          ? const SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
              ),
            )
          : const Icon(
              LucideIcons.refreshCw,
              size: 16,
            ),
      label: Text(isLoading ? 'Retrying...' : 'Retry'),
      style: TextButton.styleFrom(
        foregroundColor: AppColors.primary,
        padding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 6,
        ),
      ),
    );
  }
}
