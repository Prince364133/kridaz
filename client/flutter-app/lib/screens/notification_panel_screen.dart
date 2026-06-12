import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/constants/app_colors.dart';
import '../providers/notification_provider.dart';

class NotificationPanelScreen extends ConsumerStatefulWidget {
  const NotificationPanelScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<NotificationPanelScreen> createState() =>
      _NotificationPanelScreenState();
}

class _NotificationPanelScreenState
    extends ConsumerState<NotificationPanelScreen> {
  String _selectedTab = 'All';

  @override
  void initState() {
    super.initState();
    // Mark all as read when this screen opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(notificationsProvider.notifier).markAllRead();
    });
  }

  String _formatTime(String? timestamp) {
    if (timestamp == null) return '';
    try {
      final date = DateTime.parse(timestamp);
      final diff = DateTime.now().difference(date);
      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays == 1) return 'Yesterday';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return '${date.day}/${date.month}';
    } catch (_) {
      return '';
    }
  }

  IconData _iconForType(String? type) {
    switch (type) {
      case 'friend_request':
      case 'follow':
        return LucideIcons.userPlus;
      case 'friend_accepted':
        return LucideIcons.users;
      case 'new_message':
        return LucideIcons.messageCircle;
      case 'booking':
        return LucideIcons.calendar;
      case 'order':
        return Icons.local_shipping_outlined;
      case 'promotion':
        return LucideIcons.tag;
      case 'game':
        return Icons.sports_cricket_rounded;
      case 'team':
        return Icons.groups_outlined;
      default:
        return LucideIcons.bell;
    }
  }

  String _categoryForType(String? type) {
    switch (type) {
      case 'friend_request':
      case 'friend_accepted':
      case 'follow':
        return 'Social';
      case 'new_message':
        return 'Social';
      case 'booking':
        return 'Bookings';
      case 'order':
        return 'Orders';
      case 'promotion':
        return 'Promotions';
      case 'game':
      case 'team':
        return 'Games';
      default:
        return 'Other';
    }
  }

  List<Map<String, dynamic>> _filtered(List<Map<String, dynamic>> all) {
    if (_selectedTab == 'All') return all;
    return all
        .where((n) => _categoryForType(n['type']) == _selectedTab)
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificationsProvider);
    final filtered = _filtered(state.items);

    return Scaffold(
      backgroundColor: AppColors.surfaceL0,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(context, state.items),
            _buildTabBar(),
            Expanded(
              child: state.isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                          color: AppColors.gradientStart, strokeWidth: 2))
                  : filtered.isEmpty
                      ? _buildEmpty()
                      : RefreshIndicator(
                          onRefresh: () =>
                              ref.read(notificationsProvider.notifier).load(),
                          color: AppColors.gradientStart,
                          child: ListView.builder(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                            itemCount: filtered.length,
                            itemBuilder: (_, i) => _buildCard(filtered[i]),
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, List<Map<String, dynamic>> all) {
    final unreadCount =
        all.where((n) => n['isRead'] != true && n['is_read'] != true).length;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      child: Row(
        children: [
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              context.pop();
            },
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.surfaceL3,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.backgroundCard),
              ),
              child: const Icon(LucideIcons.chevronLeft,
                  color: Colors.white, size: 15),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Notifications',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Poppins',
                  ),
                ),
                if (unreadCount > 0)
                  Text(
                    '$unreadCount unread',
                    style: const TextStyle(
                      color: AppColors.gradientStart,
                      fontSize: 12,
                      fontFamily: 'Poppins',
                    ),
                  ),
              ],
            ),
          ),
          if (all.isNotEmpty)
            GestureDetector(
              onTap: () {
                HapticFeedback.lightImpact();
                ref.read(notificationsProvider.notifier).markAllRead();
              },
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                decoration: BoxDecoration(
                  color: AppColors.gradientStart.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                      color: AppColors.gradientStart.withValues(alpha: 0.3)),
                ),
                child: const Text(
                  'Mark all read',
                  style: TextStyle(
                    color: AppColors.gradientStart,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Poppins',
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    const tabs = ['All', 'Social', 'Games', 'Bookings', 'Promotions'];
    return SizedBox(
      height: 52,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemCount: tabs.length,
        itemBuilder: (_, i) {
          final tab = tabs[i];
          final selected = _selectedTab == tab;
          return GestureDetector(
            onTap: () {
              HapticFeedback.selectionClick();
              setState(() => _selectedTab = tab);
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 160),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
              decoration: BoxDecoration(
                gradient: selected
                    ? const LinearGradient(
                        colors: [
                          AppColors.gradientStart,
                          AppColors.gradientEnd
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                color: selected ? null : AppColors.surfaceL3,
                borderRadius: BorderRadius.circular(20),
                border: selected
                    ? null
                    : Border.all(color: AppColors.backgroundCard),
              ),
              child: Text(
                tab,
                style: TextStyle(
                  color: selected ? Colors.black : Colors.white54,
                  fontSize: 13,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w400,
                  fontFamily: 'Poppins',
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildCard(Map<String, dynamic> n) {
    final type = n['type'] as String?;
    final title = n['title'] as String? ?? '';
    // Contract uses `message`; older endpoints used `body` — accept either.
    final body = (n['message'] ?? n['body'])?.toString() ?? '';
    final createdAt = (n['createdAt'] ?? n['created_at'])?.toString();
    final isRead = n['isRead'] == true || n['is_read'] == true;
    final rawId = (n['id'] ?? n['_id']);
    final notifId = rawId?.toString();

    return Dismissible(
      key: Key(notifId ?? UniqueKey().toString()),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: AppColors.accentRed.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.accentRed.withValues(alpha: 0.3)),
        ),
        child: const Icon(LucideIcons.trash2, color: AppColors.accentRed),
      ),
      onDismissed: (_) {
        if (notifId != null && notifId.isNotEmpty) {
          ref.read(notificationsProvider.notifier).deleteOne(notifId);
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isRead ? AppColors.surfaceL2 : AppColors.surfaceL3,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isRead
                ? AppColors.surfaceL4
                : AppColors.gradientStart.withValues(alpha: 0.3),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                gradient: isRead
                    ? null
                    : const LinearGradient(
                        colors: [
                          AppColors.gradientStart,
                          AppColors.gradientEnd
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                color: isRead ? AppColors.surfaceL4 : null,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                _iconForType(type),
                color: isRead ? Colors.white38 : Colors.black,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight:
                                isRead ? FontWeight.w500 : FontWeight.w700,
                            fontFamily: 'Poppins',
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _formatTime(createdAt),
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.35),
                          fontSize: 11,
                          fontFamily: 'Poppins',
                        ),
                      ),
                    ],
                  ),
                  if (body.isNotEmpty) ...[
                    const SizedBox(height: 3),
                    Text(
                      body,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.5),
                        fontSize: 13,
                        fontFamily: 'Poppins',
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),

            // Unread dot
            if (!isRead) ...[
              const SizedBox(width: 8),
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.gradientStart, AppColors.gradientEnd],
                  ),
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: AppColors.surfaceL3,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.backgroundCard),
            ),
            child: Icon(Icons.notifications_off_outlined,
                color: Colors.white.withValues(alpha: 0.2), size: 32),
          ),
          const SizedBox(height: 16),
          const Text(
            "You're all caught up!",
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w600,
              fontFamily: 'Poppins',
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'No notifications for this category',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.35),
              fontSize: 13,
              fontFamily: 'Poppins',
            ),
          ),
        ],
      ),
    );
  }
}
