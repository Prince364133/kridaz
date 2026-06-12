import 'dart:async';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../widgets/common/bms_toast.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:share_plus/share_plus.dart';
import 'package:video_player/video_player.dart';
import '../providers/reels_feed_provider.dart';
import '../services/reel_api_service.dart';
import '../core/constants/app_colors.dart';

class ReelsScreen extends ConsumerStatefulWidget {
  const ReelsScreen({super.key});

  @override
  ConsumerState<ReelsScreen> createState() => _ReelsScreenState();
}

class _ReelsScreenState extends ConsumerState<ReelsScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  // Keyed by page index. Disposed as user scrolls away.
  final Map<int, VideoPlayerController> _controllers = {};
  final Map<int, bool> _initialized = {};

  Timer? _heartbeatTimer;
  DateTime? _watchStartTime;

  // True once the feed's first data arrival has triggered initial preloads,
  // so we don't re-prime on every subsequent rebuild.
  bool _primedFirstFrame = false;

  @override
  void initState() {
    super.initState();
    // Don't prime here — the feed is still loading at initState. The first
    // data arrival is caught by `ref.listen` in `build`, which fires the
    // initial init + preload of reels 0 & 1 + thumbnail precache of reel 2.
  }

  @override
  void dispose() {
    _heartbeatTimer?.cancel();
    for (final c in _controllers.values) {
      c.dispose();
    }
    _pageController.dispose();
    super.dispose();
  }

  // â”€â”€ Video lifecycle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  Future<void> _initAndPlayPage(int index) async {
    final reels =
        ref.read(reelsFeedProvider(ReelFeedType.feed)).valueOrNull?.reels;
    if (reels == null || index >= reels.length) return;

    final reel = reels[index];
    if (!reel.isReady || reel.playableUrl == null) return;

    if (!_controllers.containsKey(index)) {
      final controller = VideoPlayerController.networkUrl(
        Uri.parse(reel.playableUrl!),
      );
      _controllers[index] = controller;

      try {
        await controller.initialize();
        controller.setLooping(true);
        _initialized[index] = true;
        if (mounted) setState(() {});
      } catch (_) {
        _controllers.remove(index);
        _initialized.remove(index);
        return;
      }
    }

    if (_initialized[index] == true && mounted) {
      _controllers[index]?.play();
      _startHeartbeat(reel);
      // Fire view interaction once per reel visit.
      ReelApiService().interact(reel.id, 'view');
    }
  }

  Future<void> _preloadPage(int index) async {
    final reels =
        ref.read(reelsFeedProvider(ReelFeedType.feed)).valueOrNull?.reels;
    if (reels == null || index >= reels.length) return;
    if (_controllers.containsKey(index)) return;

    final reel = reels[index];
    if (!reel.isReady || reel.playableUrl == null) return;

    final controller = VideoPlayerController.networkUrl(
      Uri.parse(reel.playableUrl!),
    );
    _controllers[index] = controller;
    try {
      await controller.initialize();
      controller.setLooping(true);
      _initialized[index] = true;
      if (mounted) setState(() {});
    } catch (_) {
      _controllers.remove(index);
      _initialized.remove(index);
    }
  }

  // Warm the image cache for a reel's thumbnail so the cover renders the
  // instant the user swipes onto it. Cheap — just an HTTP GET decoded to a
  // ui.Image; the in-flight init for that reel's video happens in parallel.
  void _precacheThumb(int index) {
    final reels =
        ref.read(reelsFeedProvider(ReelFeedType.feed)).valueOrNull?.reels;
    if (reels == null || index < 0 || index >= reels.length) return;
    final url = reels[index].thumbnailUrl;
    if (url == null || url.isEmpty) return;
    precacheImage(CachedNetworkImageProvider(url), context);
  }

  void _disposeStaleControllers(int activeIndex) {
    final stale = _controllers.keys
        .where((i) => i < activeIndex - 1 || i > activeIndex + 2)
        .toList();
    for (final i in stale) {
      _controllers[i]?.dispose();
      _controllers.remove(i);
      _initialized.remove(i);
    }
  }

  void _onPageChanged(int index) {
    HapticFeedback.lightImpact();

    final reels =
        ref.read(reelsFeedProvider(ReelFeedType.feed)).valueOrNull?.reels ?? [];

    // Send final heartbeat for the leaving reel.
    if (reels.isNotEmpty && _currentPage < reels.length) {
      _sendFinalHeartbeat(reels[_currentPage]);
    }

    // Pause the leaving page.
    _controllers[_currentPage]?.pause();
    _currentPage = index;

    setState(() {});

    _disposeStaleControllers(index);
    _initAndPlayPage(index);
    if (index + 1 < reels.length) _preloadPage(index + 1);
    // One thumbnail beyond the preloaded video so the user sees the cover
    // the instant they swipe two pages ahead.
    _precacheThumb(index + 2);

    // Trigger pagination when near the end.
    if (reels.isNotEmpty && index >= reels.length - 2) {
      ref.read(reelsFeedProvider(ReelFeedType.feed).notifier).loadMore();
    }
  }

  // â”€â”€ Heartbeat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  void _startHeartbeat(Reel reel) {
    _heartbeatTimer?.cancel();
    _watchStartTime = DateTime.now();

    _heartbeatTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      final elapsed = _elapsedSeconds();
      ReelApiService().heartbeat(reel.id, watchTime: elapsed);
    });
  }

  void _sendFinalHeartbeat(Reel reel) {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;

    if (_watchStartTime == null) return;
    final elapsed = _elapsedSeconds();
    final duration = reel.duration ?? 1;
    final completed = elapsed >= (duration * 0.8).round();

    ReelApiService()
        .heartbeat(reel.id, watchTime: elapsed, completed: completed);
    if (completed) ReelApiService().interact(reel.id, 'complete');
    _watchStartTime = null;
  }

  int _elapsedSeconds() => _watchStartTime != null
      ? DateTime.now().difference(_watchStartTime!).inSeconds
      : 0;

  // â”€â”€ Comment sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  void _showCommentSheet(String reelId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surfaceSlate,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _CommentSheet(reelId: reelId),
    );
  }

  void _showReportSheet(BuildContext context, String reelId) {
    const reasons = [
      'Inappropriate content',
      'Spam or misleading',
      'Harassment or bullying',
      'Violence',
      'Other',
    ];
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceSlate,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const Text('Report Reel',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            ...reasons.map((r) => ListTile(
                  title: Text(r, style: const TextStyle(color: Colors.white70)),
                  onTap: () async {
                    Navigator.pop(ctx);
                    await ReelApiService().reportReel(reelId, r);
                    if (context.mounted) {
                      BmsToast.success(context, 'Report submitted. Thank you.');
                    }
                  },
                )),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  // â”€â”€ Build â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @override
  Widget build(BuildContext context) {
    final feedAsync = ref.watch(reelsFeedProvider(ReelFeedType.feed));

    // Prime reel 0 + 1 + thumbnail of reel 2 the moment the feed's first page
    // arrives. Guarded by `_primedFirstFrame` so subsequent rebuilds (e.g. on
    // like/comment) don't re-trigger.
    ref.listen<AsyncValue<ReelsFeedState>>(
      reelsFeedProvider(ReelFeedType.feed),
      (prev, next) {
        if (_primedFirstFrame) return;
        final reels = next.valueOrNull?.reels;
        if (reels == null || reels.isEmpty) return;
        _primedFirstFrame = true;
        // Defer one frame so the PageView is mounted and `precacheImage` has
        // a valid context.
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _initAndPlayPage(0);
          _preloadPage(1);
          _precacheThumb(2);
        });
      },
    );

    return Scaffold(
      backgroundColor: Colors.black,
      extendBodyBehindAppBar: true,
      body: feedAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.accentCyan),
        ),
        error: (err, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(LucideIcons.wifiOff, color: Colors.white54, size: 48),
              const SizedBox(height: 16),
              Text(
                err.toString(),
                style: const TextStyle(color: Colors.white70),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              TextButton(
                onPressed: () => ref
                    .read(reelsFeedProvider(ReelFeedType.feed).notifier)
                    .refresh(),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (feedState) {
          final reels = feedState.reels;
          if (reels.isEmpty) {
            return const Center(
              child: Text(
                'No reels yet.',
                style: TextStyle(color: Colors.white54),
              ),
            );
          }

          return PageView.builder(
            controller: _pageController,
            scrollDirection: Axis.vertical,
            itemCount: reels.length,
            onPageChanged: _onPageChanged,
            itemBuilder: (context, index) {
              final reel = reels[index];
              return _ReelPage(
                reel: reel,
                controller: _controllers[index],
                isInitialized: _initialized[index] ?? false,
                isLiked: feedState.likedReelIds.contains(reel.id),
                isActive: index == _currentPage,
                onLike: () => ref
                    .read(reelsFeedProvider(ReelFeedType.feed).notifier)
                    .toggleLike(reel.id),
                onComment: () => _showCommentSheet(reel.id),
                onShare: () async {
                  await ref
                      .read(reelsFeedProvider(ReelFeedType.feed).notifier)
                      .shareReel(reel.id);
                  await Share.share(
                    'Check out this reel on Kridaz! ${reel.caption ?? ''}',
                  );
                },
                onMore: () => _showReportSheet(context, reel.id),
                onBack: () => Navigator.of(context).pop(),
              );
            },
          );
        },
      ),
    );
  }
}

// â”€â”€â”€ Single reel page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _ReelPage extends StatelessWidget {
  final Reel reel;
  final VideoPlayerController? controller;
  final bool isInitialized;
  final bool isLiked;
  final bool isActive;
  final VoidCallback onLike;
  final VoidCallback onComment;
  final VoidCallback onShare;
  final VoidCallback onMore;
  final VoidCallback onBack;

  const _ReelPage({
    required this.reel,
    required this.controller,
    required this.isInitialized,
    required this.isLiked,
    required this.isActive,
    required this.onLike,
    required this.onComment,
    required this.onShare,
    required this.onMore,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // â”€â”€ Background: video or thumbnail â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        _Background(
          reel: reel,
          controller: controller,
          isInitialized: isInitialized,
        ),

        // â”€â”€ Gradient overlay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withValues(alpha: 0.35),
                Colors.transparent,
                Colors.black.withValues(alpha: 0.85),
              ],
              stops: const [0.0, 0.4, 0.95],
            ),
          ),
        ),

        // â”€â”€ Top bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  _IconButton(icon: LucideIcons.arrowLeft, onTap: onBack),
                  const Spacer(),
                  _IconButton(icon: LucideIcons.search, onTap: () {}),
                  const SizedBox(width: 10),
                  _IconButton(icon: LucideIcons.moreVertical, onTap: () {}),
                ],
              ),
            ),
          ),
        ),

        // â”€â”€ Status overlay for pending/failed reels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        if (reel.isPending || reel.isFailed) _StatusOverlay(reel: reel),

        // â”€â”€ Bottom content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 28),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(child: _ReelInfo(reel: reel)),
                const SizedBox(width: 16),
                _ActionColumn(
                  reel: reel,
                  isLiked: isLiked,
                  onLike: onLike,
                  onComment: onComment,
                  onShare: onShare,
                  onMore: onMore,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// â”€â”€â”€ Background â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _Background extends StatelessWidget {
  final Reel reel;
  final VideoPlayerController? controller;
  final bool isInitialized;

  const _Background({
    required this.reel,
    required this.controller,
    required this.isInitialized,
  });

  @override
  Widget build(BuildContext context) {
    // Show video when ready and initialized.
    if (reel.isReady && isInitialized && controller != null) {
      return Stack(
        fit: StackFit.expand,
        children: [
          if (reel.thumbnailUrl != null)
            CachedNetworkImage(
              imageUrl: reel.thumbnailUrl!,
              fit: BoxFit.cover,
              color: AppColors.accentBlueDark.withValues(alpha: 0.2),
              colorBlendMode: BlendMode.color,
            ),
          FittedBox(
            fit: BoxFit.cover,
            child: SizedBox(
              width: controller!.value.size.width,
              height: controller!.value.size.height,
              child: VideoPlayer(controller!),
            ),
          ),
          // Buffering indicator.
          ValueListenableBuilder<VideoPlayerValue>(
            valueListenable: controller!,
            builder: (_, value, __) {
              if (value.isBuffering) {
                return const Center(
                  child: CircularProgressIndicator(
                    color: Colors.white54,
                    strokeWidth: 2,
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      );
    }

    // Fallback: thumbnail or solid background while loading.
    if (reel.thumbnailUrl != null) {
      return CachedNetworkImage(
        imageUrl: reel.thumbnailUrl!,
        fit: BoxFit.cover,
        color: AppColors.accentBlueDark.withValues(alpha: 0.3),
        colorBlendMode: BlendMode.color,
      );
    }

    return Container(color: AppColors.surfaceSlateDeep);
  }
}

// â”€â”€â”€ Status overlays â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _StatusOverlay extends StatelessWidget {
  final Reel reel;
  const _StatusOverlay({required this.reel});

  @override
  Widget build(BuildContext context) {
    final isFailed = reel.isFailed;
    return Center(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.black54,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isFailed)
              const Icon(LucideIcons.alertCircle, color: Colors.red, size: 36)
            else
              const SizedBox(
                width: 36,
                height: 36,
                child: CircularProgressIndicator(
                  color: AppColors.accentCyan,
                  strokeWidth: 3,
                ),
              ),
            const SizedBox(height: 12),
            Text(
              isFailed ? 'Processing failed' : 'Processing your reel…',
              style: const TextStyle(color: Colors.white, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}

// â”€â”€â”€ Reel info (left column) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _ReelInfo extends StatelessWidget {
  final Reel reel;
  const _ReelInfo({required this.reel});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            CircleAvatar(
              radius: 20,
              backgroundColor: Colors.white12,
              backgroundImage: reel.creator.profilePicture != null
                  ? CachedNetworkImageProvider(reel.creator.profilePicture!)
                  : null,
              child: reel.creator.profilePicture == null
                  ? Text(
                      reel.creator.name.isNotEmpty
                          ? reel.creator.name[0].toUpperCase()
                          : '?',
                      style: const TextStyle(color: Colors.white),
                    )
                  : null,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                reel.creator.name,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.accentCyan, width: 1.5),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'Follow',
                style: TextStyle(
                  color: AppColors.accentCyan,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        if (reel.caption != null && reel.caption!.isNotEmpty) ...[
          const SizedBox(height: 10),
          Text(
            reel.caption!,
            style: const TextStyle(color: Colors.white, fontSize: 14),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
        if (reel.hashtags.isNotEmpty) ...[
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            children: reel.hashtags.take(3).map((tag) {
              return Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '#$tag',
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
              );
            }).toList(),
          ),
        ],
      ],
    );
  }
}

// â”€â”€â”€ Action column (right side) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _ActionColumn extends StatelessWidget {
  final Reel reel;
  final bool isLiked;
  final VoidCallback onLike;
  final VoidCallback onComment;
  final VoidCallback onShare;
  final VoidCallback onMore;

  const _ActionColumn({
    required this.reel,
    required this.isLiked,
    required this.onLike,
    required this.onComment,
    required this.onShare,
    required this.onMore,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _ActionBtn(
          icon: isLiked ? LucideIcons.heart : LucideIcons.heart,
          iconColor: isLiked ? Colors.red : Colors.white,
          count: _format(reel.stats.likes),
          onTap: () {
            HapticFeedback.lightImpact();
            onLike();
          },
        ),
        const SizedBox(height: 20),
        _ActionBtn(
          icon: LucideIcons.messageCircle,
          count: _format(reel.stats.comments),
          onTap: () {
            HapticFeedback.lightImpact();
            onComment();
          },
        ),
        const SizedBox(height: 20),
        _ActionBtn(
          icon: LucideIcons.share2,
          count: _format(reel.stats.shares),
          onTap: () {
            HapticFeedback.lightImpact();
            onShare();
          },
        ),
        const SizedBox(height: 20),
        _ActionBtn(
          icon: LucideIcons.moreHorizontal,
          count: '',
          onTap: () {
            HapticFeedback.lightImpact();
            onMore();
          },
        ),
      ],
    );
  }

  String _format(int n) {
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}k';
    return n > 0 ? n.toString() : '';
  }
}

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String count;
  final VoidCallback onTap;

  const _ActionBtn({
    required this.icon,
    required this.count,
    required this.onTap,
    this.iconColor = Colors.white,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          if (count.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              count,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// â”€â”€â”€ Icon button (top bar) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _IconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _IconButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.3),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white, size: 24),
      ),
    );
  }
}

// â”€â”€â”€ Comment bottom sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _CommentSheet extends ConsumerStatefulWidget {
  final String reelId;
  const _CommentSheet({required this.reelId});

  @override
  ConsumerState<_CommentSheet> createState() => _CommentSheetState();
}

class _CommentSheetState extends ConsumerState<_CommentSheet> {
  final _textController = TextEditingController();
  bool _submitting = false;
  bool _loadingComments = false;
  final List<ReelComment> _localComments = [];

  @override
  void initState() {
    super.initState();
    _loadComments();
  }

  Future<void> _loadComments() async {
    setState(() => _loadingComments = true);
    final result = await ReelApiService().getComments(widget.reelId);
    if (mounted) {
      setState(() {
        _loadingComments = false;
        if (result.isSuccess && result.data != null) {
          _localComments
            ..clear()
            ..addAll(result.data!);
        }
      });
    }
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final text = _textController.text.trim();
    if (text.isEmpty || _submitting) return;

    setState(() => _submitting = true);
    _textController.clear();

    final result = await ref
        .read(reelsFeedProvider(ReelFeedType.feed).notifier)
        .submitComment(widget.reelId, text);

    if (result.isSuccess && result.data != null) {
      setState(() => _localComments.insert(0, result.data!));
    }

    setState(() => _submitting = false);
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.6,
        child: Column(
          children: [
            // Handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const Text(
              'Comments',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            const Divider(color: Colors.white12, height: 1),
            // Comment list.
            Expanded(
              child: _loadingComments
                  ? const Center(
                      child: CircularProgressIndicator(
                          color: Colors.white54, strokeWidth: 2))
                  : _localComments.isEmpty
                      ? const Center(
                          child: Text(
                            'No comments yet. Be the first!',
                            style: TextStyle(color: Colors.white38),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          itemCount: _localComments.length,
                          itemBuilder: (_, i) => _CommentTile(
                            comment: _localComments[i],
                          ),
                        ),
            ),
            const Divider(color: Colors.white12, height: 1),
            // Input row.
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'Add a comment…',
                        hintStyle: const TextStyle(color: Colors.white38),
                        filled: true,
                        fillColor: AppColors.surfaceSlate,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 10,
                        ),
                      ),
                      onSubmitted: (_) => _submit(),
                    ),
                  ),
                  const SizedBox(width: 10),
                  GestureDetector(
                    onTap: _submit,
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: AppColors.accentCyan,
                        shape: BoxShape.circle,
                      ),
                      child: _submitting
                          ? const Padding(
                              padding: EdgeInsets.all(12),
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.black,
                              ),
                            )
                          : const Icon(LucideIcons.send,
                              color: Colors.black, size: 20),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CommentTile extends StatelessWidget {
  final ReelComment comment;
  const _CommentTile({required this.comment});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const CircleAvatar(
            radius: 16,
            backgroundColor: Colors.white12,
            child: Icon(LucideIcons.user, color: Colors.white54, size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  comment.userId,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  comment.text,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
