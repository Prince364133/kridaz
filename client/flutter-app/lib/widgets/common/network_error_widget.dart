import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';

/// Network error widget with retry functionality
class NetworkErrorWidget extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;
  final bool isFullScreen;

  const NetworkErrorWidget({
    super.key,
    this.message =
        'No internet connection. Please check your network settings.',
    this.onRetry,
    this.isFullScreen = true,
  });

  @override
  Widget build(BuildContext context) {
    final content = Column(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: isFullScreen ? MainAxisSize.max : MainAxisSize.min,
      children: [
        Icon(
          LucideIcons.wifiOff,
          size: isFullScreen ? 80 : 48,
          color: Colors.orange.shade400,
        ),
        SizedBox(height: isFullScreen ? 24 : 16),
        Text(
          'No Internet Connection',
          style: TextStyle(
            color: Colors.white,
            fontSize: isFullScreen ? 20 : 16,
            fontWeight: FontWeight.w600,
          ),
          textAlign: TextAlign.center,
        ),
        SizedBox(height: isFullScreen ? 12 : 8),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Text(
            message,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.7),
              fontSize: 14,
            ),
            textAlign: TextAlign.center,
          ),
        ),
        if (onRetry != null) ...[
          SizedBox(height: isFullScreen ? 24 : 16),
          ElevatedButton.icon(
            onPressed: onRetry,
            icon: const Icon(LucideIcons.refreshCw),
            label: const Text('Try Again'),
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
    );

    if (isFullScreen) {
      return Center(child: content);
    }

    return Container(
      padding: const EdgeInsets.all(24),
      child: content,
    );
  }
}
