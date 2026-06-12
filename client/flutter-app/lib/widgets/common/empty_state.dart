import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';

/// Reusable empty state widget for when lists or data are empty
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
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
                color: AppColors.backgroundCard,
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 60,
                color: AppColors.textGray,
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
                color: Colors.white.withValues(alpha: 0.6),
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: onAction,
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
                child: Text(
                  actionLabel!,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
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

/// Predefined empty states for common scenarios
class EmptyStates {
  static Widget noBookings({VoidCallback? onExplore}) => EmptyState(
        icon: LucideIcons.calendarX,
        title: 'No Bookings Yet',
        message:
            'You haven\'t made any bookings. Start exploring venues and games!',
        actionLabel: 'Explore',
        onAction: onExplore,
      );

  static Widget noGames({VoidCallback? onHost}) => EmptyState(
        icon: Icons.sports_soccer,
        title: 'No Games Found',
        message: 'There are no games available right now. Why not host one?',
        actionLabel: 'Host a Game',
        onAction: onHost,
      );

  static Widget noSearchResults({VoidCallback? onClear}) => EmptyState(
        icon: LucideIcons.searchX,
        title: 'No Results Found',
        message: 'Try adjusting your search filters or search terms.',
        actionLabel: 'Clear Filters',
        onAction: onClear,
      );

  static Widget emptyCart({VoidCallback? onShop}) => EmptyState(
        icon: LucideIcons.shoppingCart,
        title: 'Your Cart is Empty',
        message: 'Add some items to your cart to get started!',
        actionLabel: 'Start Shopping',
        onAction: onShop,
      );

  static Widget noNotifications() => const EmptyState(
        icon: LucideIcons.bell,
        title: 'No Notifications',
        message: 'You\'re all caught up! Check back later for updates.',
      );

  static Widget noTransactions() => const EmptyState(
        icon: LucideIcons.receipt,
        title: 'No Transactions',
        message: 'Your transaction history will appear here.',
      );

  static Widget noPlayers({VoidCallback? onInvite}) => EmptyState(
        icon: LucideIcons.users,
        title: 'No Players Nearby',
        message:
            'No players found in your area. Try expanding your search radius.',
        actionLabel: 'Invite Friends',
        onAction: onInvite,
      );
}
