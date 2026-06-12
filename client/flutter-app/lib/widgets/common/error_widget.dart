import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';

/// Reusable error widget for displaying errors with retry functionality
class ErrorStateWidget extends StatelessWidget {
  final String title;
  final String message;
  final IconData icon;
  final String? actionLabel;
  final VoidCallback? onRetry;
  final bool showStackTrace;
  final String? stackTrace;

  const ErrorStateWidget({
    super.key,
    this.title = 'Something Went Wrong',
    required this.message,
    this.icon = LucideIcons.alertCircle,
    this.actionLabel = 'Retry',
    this.onRetry,
    this.showStackTrace = false,
    this.stackTrace,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: Colors.red.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 60,
                color: Colors.red.shade400,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              message,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.7),
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
            if (showStackTrace && stackTrace != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  stackTrace!,
                  style: const TextStyle(
                    color: Colors.red,
                    fontSize: 10,
                    fontFamily: 'monospace',
                  ),
                  maxLines: 5,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
            if (onRetry != null) ...[
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: onRetry,
                icon: const Icon(LucideIcons.refreshCw),
                label: Text(actionLabel ?? 'Retry'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                    vertical: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Predefined error states for common scenarios
class ErrorStates {
  static Widget networkError({VoidCallback? onRetry}) => ErrorStateWidget(
        icon: LucideIcons.wifiOff,
        title: 'Connection Error',
        message:
            'Unable to connect to the server. Please check your internet connection and try again.',
        onRetry: onRetry,
      );

  static Widget serverError({VoidCallback? onRetry}) => ErrorStateWidget(
        icon: LucideIcons.cloudOff,
        title: 'Server Error',
        message: 'Our servers are experiencing issues. Please try again later.',
        onRetry: onRetry,
      );

  static Widget notFound() => const ErrorStateWidget(
        icon: LucideIcons.searchX,
        title: 'Not Found',
        message: 'The requested resource could not be found.',
      );

  static Widget unauthorized({VoidCallback? onLogin}) => ErrorStateWidget(
        icon: LucideIcons.lock,
        title: 'Unauthorized',
        message: 'You need to be logged in to access this content.',
        actionLabel: 'Login',
        onRetry: onLogin,
      );

  static Widget permissionDenied() => const ErrorStateWidget(
        icon: LucideIcons.ban,
        title: 'Permission Denied',
        message: 'You don\'t have permission to access this resource.',
      );

  static Widget timeout({VoidCallback? onRetry}) => ErrorStateWidget(
        icon: LucideIcons.clock,
        title: 'Request Timeout',
        message: 'The request took too long to complete. Please try again.',
        onRetry: onRetry,
      );

  static Widget generic({
    required String message,
    VoidCallback? onRetry,
    String? stackTrace,
  }) =>
      ErrorStateWidget(
        message: message,
        onRetry: onRetry,
        stackTrace: stackTrace,
      );
}
