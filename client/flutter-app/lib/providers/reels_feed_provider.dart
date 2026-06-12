import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../services/reel_api_service.dart';

// ─── Feed type ────────────────────────────────────────────────────────────────

enum ReelFeedType { feed, recommended }

// ─── State ───────────────────────────────────────────────────────────────────

class ReelsFeedState {
  final List<Reel> reels;
  final String? nextCursor;
  final bool isLoadingMore;
  final bool hasMore;
  // Tracks liked reel IDs for optimistic UI — not persisted across sessions.
  final Set<String> likedReelIds;

  const ReelsFeedState({
    required this.reels,
    this.nextCursor,
    this.isLoadingMore = false,
    this.hasMore = true,
    this.likedReelIds = const {},
  });

  ReelsFeedState copyWith({
    List<Reel>? reels,
    String? nextCursor,
    bool? clearCursor,
    bool? isLoadingMore,
    bool? hasMore,
    Set<String>? likedReelIds,
  }) =>
      ReelsFeedState(
        reels: reels ?? this.reels,
        nextCursor:
            clearCursor == true ? null : (nextCursor ?? this.nextCursor),
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        hasMore: hasMore ?? this.hasMore,
        likedReelIds: likedReelIds ?? this.likedReelIds,
      );
}

// ─── Notifier ─────────────────────────────────────────────────────────────────

class ReelsFeedNotifier
    extends FamilyAsyncNotifier<ReelsFeedState, ReelFeedType> {
  ReelApiService get _service => ReelApiService();

  @override
  Future<ReelsFeedState> build(ReelFeedType arg) => _loadFirstPage();

  Future<ReelsFeedState> _loadFirstPage() async {
    final result = arg == ReelFeedType.recommended
        ? await _service.getRecommendedReels()
        : await _service.getReelsFeed();

    if (!result.isSuccess || result.data == null) {
      throw Exception(result.error ?? 'Failed to load reels');
    }

    final page = result.data!;
    return ReelsFeedState(
      reels: page.reels,
      nextCursor: page.nextCursor,
      hasMore: page.nextCursor != null,
    );
  }

  /// Appends the next page of reels to the current list.
  Future<void> loadMore() async {
    final current = state.valueOrNull;
    if (current == null || current.isLoadingMore || !current.hasMore) return;

    state = AsyncData(current.copyWith(isLoadingMore: true));

    final result = arg == ReelFeedType.recommended
        ? await _service.getRecommendedReels(cursor: current.nextCursor)
        : await _service.getReelsFeed(cursor: current.nextCursor);

    if (!result.isSuccess || result.data == null) {
      // Revert loading flag on error; don't blow up the feed.
      state = AsyncData(current.copyWith(isLoadingMore: false));
      return;
    }

    final page = result.data!;
    state = AsyncData(current.copyWith(
      reels: [...current.reels, ...page.reels],
      nextCursor: page.nextCursor,
      isLoadingMore: false,
      hasMore: page.nextCursor != null,
    ));
  }

  /// Optimistic like toggle. Sends the interact call in the background.
  Future<void> toggleLike(String reelId) async {
    final current = state.valueOrNull;
    if (current == null) return;

    final isLiked = current.likedReelIds.contains(reelId);
    final newLikedIds = Set<String>.from(current.likedReelIds);
    final delta = isLiked ? -1 : 1;

    if (isLiked) {
      newLikedIds.remove(reelId);
    } else {
      newLikedIds.add(reelId);
    }

    // Optimistically update the local count.
    final updatedReels = current.reels.map((r) {
      if (r.id != reelId) return r;
      return r.copyWith(
        stats: r.stats.copyWith(likes: r.stats.likes + delta),
      );
    }).toList();

    state = AsyncData(current.copyWith(
      reels: updatedReels,
      likedReelIds: newLikedIds,
    ));

    // Fire-and-forget: only send 'like' (server deduplicates).
    if (!isLiked) {
      final result = await _service.interact(reelId, 'like');
      if (!result.isSuccess) {
        // Revert on failure.
        state = AsyncData(current);
      }
    }
  }

  /// Posts a comment and increments the local comment count.
  Future<ApiResponse<ReelComment>> submitComment(
    String reelId,
    String text,
  ) async {
    final result = await _service.addComment(reelId, text);

    if (result.isSuccess) {
      final current = state.valueOrNull;
      if (current != null) {
        final updatedReels = current.reels.map((r) {
          if (r.id != reelId) return r;
          return r.copyWith(
            stats: r.stats.copyWith(comments: r.stats.comments + 1),
          );
        }).toList();
        state = AsyncData(current.copyWith(reels: updatedReels));
      }
    }

    return result;
  }

  /// Increments share count locally and fires the server call.
  Future<void> shareReel(String reelId) async {
    final current = state.valueOrNull;
    if (current == null) return;

    final updatedReels = current.reels.map((r) {
      if (r.id != reelId) return r;
      return r.copyWith(stats: r.stats.copyWith(shares: r.stats.shares + 1));
    }).toList();

    state = AsyncData(current.copyWith(reels: updatedReels));

    await _service.interact(reelId, 'share');
  }

  /// Refreshes the entire feed from the first page.
  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_loadFirstPage);
  }
}

// ─── Providers ────────────────────────────────────────────────────────────────

final reelsFeedProvider = AsyncNotifierProvider.family<ReelsFeedNotifier,
    ReelsFeedState, ReelFeedType>(
  ReelsFeedNotifier.new,
);
