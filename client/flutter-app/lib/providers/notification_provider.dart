import 'dart:async' show unawaited;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/notifications_service.dart';

// ── Unread badge count ────────────────────────────────────────────────────────

final unreadNotificationCountProvider =
    StateNotifierProvider<_UnreadCountNotifier, int>(
  (_) => _UnreadCountNotifier(),
);

class _UnreadCountNotifier extends StateNotifier<int> {
  _UnreadCountNotifier() : super(0) {
    refresh();
  }

  final _service = NotificationsService();

  Future<void> refresh() async {
    final count = await _service.getUnreadCount();
    if (mounted) state = count;
  }

  void clear() {
    if (mounted) state = 0;
  }

  void decrement() {
    if (mounted && state > 0) state--;
  }
}

// ── Notifications list ────────────────────────────────────────────────────────

class NotificationsState {
  final List<Map<String, dynamic>> items;
  final bool isLoading;
  final bool isLoadingMore;
  final String? nextCursor;
  final bool hasMore;

  const NotificationsState({
    this.items = const [],
    this.isLoading = true,
    this.isLoadingMore = false,
    this.nextCursor,
    this.hasMore = false,
  });

  NotificationsState copyWith({
    List<Map<String, dynamic>>? items,
    bool? isLoading,
    bool? isLoadingMore,
    String? nextCursor,
    bool? hasMore,
  }) =>
      NotificationsState(
        items: items ?? this.items,
        isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        nextCursor: nextCursor ?? this.nextCursor,
        hasMore: hasMore ?? this.hasMore,
      );
}

final notificationsProvider =
    StateNotifierProvider<NotificationsNotifier, NotificationsState>(
  (ref) => NotificationsNotifier(ref),
);

class NotificationsNotifier extends StateNotifier<NotificationsState> {
  NotificationsNotifier(this._ref) : super(const NotificationsState()) {
    load();
  }

  final Ref _ref;
  final _service = NotificationsService();

  /// Fetch the first page. Replaces any existing items.
  Future<void> load() async {
    state = state.copyWith(isLoading: true);
    final page = await _service.getNotifications();
    state = NotificationsState(
      items: page.items,
      isLoading: false,
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    );
  }

  /// Fetch the next page using `nextCursor`. No-op when there isn't one
  /// or when a load is already in flight.
  Future<void> loadMore() async {
    final cursor = state.nextCursor;
    if (cursor == null || !state.hasMore || state.isLoadingMore) return;
    state = state.copyWith(isLoadingMore: true);
    final page = await _service.getNotifications(cursor: cursor);
    state = state.copyWith(
      items: [...state.items, ...page.items],
      isLoadingMore: false,
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    );
  }

  Future<void> markAllRead() async {
    await _service.markAllNotificationsRead();
    final updated = state.items
        .map((n) => {...n, 'isRead': true, 'is_read': true})
        .toList();
    state = state.copyWith(items: updated);
    _ref.read(unreadNotificationCountProvider.notifier).clear();
  }

  Future<void> markOneRead(String notificationId) async {
    await _service.markNotificationRead(notificationId);
    final updated = state.items.map((n) {
      if ((n['id'] ?? n['_id'])?.toString() == notificationId) {
        return {...n, 'isRead': true, 'is_read': true};
      }
      return n;
    }).toList();
    state = state.copyWith(items: updated);
    _ref.read(unreadNotificationCountProvider.notifier).decrement();
  }

  /// Swipe-to-dismiss handler. The contract doesn't expose a per-id
  /// delete, so we mark the notification read on the server (best-effort)
  /// and remove it from local state. Next cold start it'll be back from
  /// the server, but read — matches what users expect from "dismiss".
  Future<void> deleteOne(String notificationId) async {
    final wasUnread = state.items.any((n) =>
        (n['id'] ?? n['_id'])?.toString() == notificationId &&
        (n['isRead'] != true && n['is_read'] != true));
    // Best-effort mark-as-read on the server — don't block the UI on it.
    unawaited(_service.markNotificationRead(notificationId));
    state = state.copyWith(
      items: state.items
          .where((n) => (n['id'] ?? n['_id'])?.toString() != notificationId)
          .toList(),
    );
    if (wasUnread) {
      _ref.read(unreadNotificationCountProvider.notifier).decrement();
    }
  }

  /// Drops every notification on the server side. The contract doesn't
  /// expose a per-id delete, so callers wanting to "hide one" should
  /// use [deleteOne] which marks-as-read + filters locally.
  Future<void> clearAll() async {
    await _service.clearAllNotifications();
    state = state.copyWith(items: const [], nextCursor: null, hasMore: false);
    _ref.read(unreadNotificationCountProvider.notifier).clear();
  }
}
