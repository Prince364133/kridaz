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

// â”€â”€â”€ Asset paths â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const _kLike = 'assets/icons/reels/like.png';
const _kLikedRed = 'assets/icons/reels/liked_red.png';
const _kToFollow = 'assets/icons/reels/to_follow.png';
const _kFollowed = 'assets/icons/reels/followed.png';
const _kShare = 'assets/icons/reels/share.png';
const _kComment = 'assets/icons/reels/comment.png';

class ReelCommunityView extends ConsumerStatefulWidget {
  const ReelCommunityView({super.key});

  @override
  ConsumerState<ReelCommunityView> createState() => _ReelCommunityViewState();
}

class _ReelCommunityViewState extends ConsumerState<ReelCommunityView>
    with SingleTickerProviderStateMixin {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final Map<int, VideoPlayerController> _controllers = {};
  final Map<int, bool> _initialized = {};

  // Session-local state — not persisted across sessions.
  final Set<String> _savedReelIds = {};
  final Set<String> _followedUserIds = {};

  Timer? _heartbeatTimer;
  DateTime? _watchStartTime;

  late AnimationController _likeAnimController;
  late Animation<double> _likeScaleAnim;

  @override
  void initState() {
    super.initState();
    _likeAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );
    _likeScaleAnim = Tween<double>(begin: 1.0, end: 1.35).animate(
      CurvedAnimation(parent: _likeAnimController, curve: Curves.elasticOut),
    );
    WidgetsBinding.instance.addPostFrameCallback((_) => _initAndPlayPage(0));
  }

  @override
  void dispose() {
    _heartbeatTimer?.cancel();
    _likeAnimController.dispose();
    for (final c in _controllers.values) {
      c.dispose();
    }
    _pageController.dispose();
    super.dispose();
  }

  // â”€â”€ Video lifecycle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  Future<void> _initAndPlayPage(int index) async {
    final reels = ref
        .read(reelsFeedProvider(ReelFeedType.recommended))
        .valueOrNull
        ?.reels;
    if (reels == null || index >= reels.length) return;

    final reel = reels[index];
    if (!reel.isReady || reel.playableUrl == null) return;

    if (!_controllers.containsKey(index)) {
      final controller =
          VideoPlayerController.networkUrl(Uri.parse(reel.playableUrl!));
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
      ReelApiService().interact(reel.id, 'view');
    }
  }

  Future<void> _preloadPage(int index) async {
    final reels = ref
        .read(reelsFeedProvider(ReelFeedType.recommended))
        .valueOrNull
        ?.reels;
    if (reels == null || index >= reels.length) return;
    if (_controllers.containsKey(index)) return;

    final reel = reels[index];
    if (!reel.isReady || reel.playableUrl == null) return;

    final controller =
        VideoPlayerController.networkUrl(Uri.parse(reel.playableUrl!));
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

    final reels = ref
            .read(reelsFeedProvider(ReelFeedType.recommended))
            .valueOrNull
            ?.reels ??
        [];

    if (reels.isNotEmpty && _currentPage < reels.length) {
      _sendFinalHeartbeat(reels[_currentPage]);
    }
    _controllers[_currentPage]?.pause();
    _currentPage = index;
    setState(() {});

    _disposeStaleControllers(index);
    _initAndPlayPage(index);
    if (index + 1 < reels.length) _preloadPage(index + 1);

    if (reels.isNotEmpty && index >= reels.length - 2) {
      ref.read(reelsFeedProvider(ReelFeedType.recommended).notifier).loadMore();
    }
  }

  // â”€â”€ Heartbeat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  void _startHeartbeat(Reel reel) {
    _heartbeatTimer?.cancel();
    _watchStartTime = DateTime.now();
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      ReelApiService().heartbeat(reel.id, watchTime: _elapsedSeconds());
    });
  }

  void _sendFinalHeartbeat(Reel reel) {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
    if (_watchStartTime == null) return;
    final elapsed = _elapsedSeconds();
    final completed = elapsed >= ((reel.duration ?? 1) * 0.8).round();
    ReelApiService()
        .heartbeat(reel.id, watchTime: elapsed, completed: completed);
    if (completed) ReelApiService().interact(reel.id, 'complete');
    _watchStartTime = null;
  }

  int _elapsedSeconds() => _watchStartTime != null
      ? DateTime.now().difference(_watchStartTime!).inSeconds
      : 0;

  // â”€â”€ Interactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  void _onLike(String reelId) {
    HapticFeedback.mediumImpact();
    ref
        .read(reelsFeedProvider(ReelFeedType.recommended).notifier)
        .toggleLike(reelId);
    _likeAnimController.forward().then((_) => _likeAnimController.reverse());
  }

  void _onSave(String reelId) {
    HapticFeedback.lightImpact();
    final wasSaved = _savedReelIds.contains(reelId);
    setState(() {
      if (wasSaved) {
        _savedReelIds.remove(reelId);
      } else {
        _savedReelIds.add(reelId);
      }
    });
    if (wasSaved) {
      BmsToast.info(context, 'Removed from saved',
          duration: const Duration(milliseconds: 1200));
    } else {
      BmsToast.success(context, 'Reel saved!',
          duration: const Duration(milliseconds: 1200));
    }
  }

  void _onFollow(String userId) {
    HapticFeedback.lightImpact();
    setState(() {
      if (_followedUserIds.contains(userId)) {
        _followedUserIds.remove(userId);
      } else {
        _followedUserIds.add(userId);
      }
    });
  }

  void _onComment(String reelId) {
    _controllers[_currentPage]?.pause();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surfaceSlateDeep,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _CommentSheet(reelId: reelId, ref: ref),
    ).then((_) => _controllers[_currentPage]?.play());
  }

  // â”€â”€ Build â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @override
  Widget build(BuildContext context) {
    final feedAsync = ref.watch(reelsFeedProvider(ReelFeedType.recommended));

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
                    .read(reelsFeedProvider(ReelFeedType.recommended).notifier)
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
              final isLiked = feedState.likedReelIds.contains(reel.id);
              final isSaved = _savedReelIds.contains(reel.id);
              final isFollowed = _followedUserIds.contains(reel.creator.id);
              return _buildReelItem(reel, index, isLiked, isSaved, isFollowed);
            },
          );
        },
      ),
    );
  }

  // â”€â”€ Single reel item â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  Widget _buildReelItem(
    Reel reel,
    int index,
    bool isLiked,
    bool isSaved,
    bool isFollowed,
  ) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Background video / thumbnail
        _buildBackground(reel, index),

        // Bottom-heavy gradient overlay
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.transparent,
                Colors.black.withValues(alpha: 0.10),
                Colors.black.withValues(alpha: 0.75),
              ],
              stops: const [0.40, 0.65, 1.0],
            ),
          ),
        ),

        // Processing / failed state
        if (reel.isPending || reel.isFailed)
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (reel.isFailed)
                    const Icon(LucideIcons.alertCircle,
                        color: Colors.red, size: 22)
                  else
                    const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        color: AppColors.accentCyan,
                        strokeWidth: 2.5,
                      ),
                    ),
                  const SizedBox(width: 10),
                  Text(
                    reel.isFailed
                        ? 'Processing failed'
                        : 'Processing your reel…',
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                  ),
                ],
              ),
            ),
          ),

        // â”€â”€ Right action column â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        Positioned(
          right: 12,
          bottom: 86,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // 1. Avatar (follow / unfollow)
              _buildAvatarButton(reel, isFollowed),
              const SizedBox(height: 26),

              // 2. Like
              _buildLikeButton(reel.id, isLiked),
              const SizedBox(height: 26),

              // 3. Comment
              _buildIconButton(
                asset: _kComment,
                onTap: () => _onComment(reel.id),
              ),
              const SizedBox(height: 26),

              // 4. Save (bookmark)
              _buildSaveButton(reel.id, isSaved),
              const SizedBox(height: 26),

              // 5. Share
              _buildIconButton(
                asset: _kShare,
                onTap: () async {
                  await ref
                      .read(
                          reelsFeedProvider(ReelFeedType.recommended).notifier)
                      .shareReel(reel.id);
                  await Share.share(
                    'Check out this reel on Kridaz! ${reel.caption ?? ''}',
                  );
                },
              ),
            ],
          ),
        ),

        // â”€â”€ Bottom-left user info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        Positioned(
          left: 16,
          right: 76,
          bottom: 86,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                reel.creator.username != null
                    ? '@${reel.creator.username}'
                    : '@${reel.creator.name.toLowerCase().replaceAll(' ', '_')}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  shadows: [
                    Shadow(blurRadius: 6, color: Colors.black54),
                  ],
                ),
              ),
              if (reel.caption != null && reel.caption!.isNotEmpty) ...[
                const SizedBox(height: 6),
                RichText(
                  text: TextSpan(
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      height: 1.45,
                      shadows: [Shadow(blurRadius: 4, color: Colors.black54)],
                    ),
                    children: _buildTextSpans(reel.caption!),
                  ),
                ),
              ],
              if (reel.hashtags.isNotEmpty &&
                  (reel.caption == null || reel.caption!.isEmpty)) ...[
                const SizedBox(height: 6),
                Wrap(
                  spacing: 4,
                  children: reel.hashtags
                      .map((t) => Text(
                            '#$t',
                            style: TextStyle(
                              color: AppColors.accentCyan,
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ))
                      .toList(),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  // â”€â”€ Action button widgets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /// Creator avatar — switches between to_follow and followed PNG assets.
  Widget _buildAvatarButton(Reel reel, bool isFollowed) {
    return GestureDetector(
      onTap: () => _onFollow(reel.creator.id),
      child: SizedBox(
        width: 54,
        height: 62, // extra height for the badge that overflows below
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
            // Circle avatar (profile photo or initial fallback)
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
              ),
              child: ClipOval(
                child: reel.creator.profilePicture != null
                    ? CachedNetworkImage(
                        imageUrl: reel.creator.profilePicture!,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => _avatarFallback(reel),
                      )
                    : _avatarFallback(reel),
              ),
            ),

            // Follow/unfollow badge using the PNG assets
            Positioned(
              bottom: -4,
              child: Image.asset(
                isFollowed ? _kFollowed : _kToFollow,
                width: 28,
                height: 28,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _avatarFallback(Reel reel) => Container(
        color: AppColors.surfaceSlate,
        child: Center(
          child: Text(
            reel.creator.name.isNotEmpty
                ? reel.creator.name[0].toUpperCase()
                : '?',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      );

  /// Like button — animates and swaps between like.png and liked_red.png.
  Widget _buildLikeButton(String reelId, bool isLiked) {
    return GestureDetector(
      onTap: () => _onLike(reelId),
      child: AnimatedBuilder(
        animation: _likeScaleAnim,
        builder: (_, __) => Transform.scale(
          scale: _likeScaleAnim.value,
          child: Image.asset(
            isLiked ? _kLikedRed : _kLike,
            width: 36,
            height: 36,
          ),
        ),
      ),
    );
  }

  /// Save / bookmark button — uses `LucideIcons.bookmark` since no SVG asset provided.
  Widget _buildSaveButton(String reelId, bool isSaved) {
    return GestureDetector(
      onTap: () => _onSave(reelId),
      child: Icon(
        isSaved ? LucideIcons.bookmark : LucideIcons.bookmark,
        color: isSaved ? AppColors.accentCyan : Colors.white,
        size: 34,
        shadows: const [Shadow(blurRadius: 8, color: Colors.black54)],
      ),
    );
  }

  /// Generic PNG icon button (share, comment).
  Widget _buildIconButton({
    required String asset,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Image.asset(
        asset,
        width: 34,
        height: 34,
        // White icons need a white color filter — the PNGs are white on transparent.
        color: Colors.white,
        colorBlendMode: BlendMode.srcIn,
      ),
    );
  }

  // â”€â”€ Background â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  Widget _buildBackground(Reel reel, int index) {
    final controller = _controllers[index];
    final initialized = _initialized[index] ?? false;

    if (reel.isReady && initialized && controller != null) {
      return Stack(
        fit: StackFit.expand,
        children: [
          if (reel.thumbnailUrl != null)
            CachedNetworkImage(
              imageUrl: reel.thumbnailUrl!,
              fit: BoxFit.cover,
            ),
          FittedBox(
            fit: BoxFit.cover,
            child: SizedBox(
              width: controller.value.size.width,
              height: controller.value.size.height,
              child: VideoPlayer(controller),
            ),
          ),
          ValueListenableBuilder<VideoPlayerValue>(
            valueListenable: controller,
            builder: (_, value, __) => value.isBuffering
                ? const Center(
                    child: CircularProgressIndicator(
                      color: Colors.white54,
                      strokeWidth: 2,
                    ),
                  )
                : const SizedBox.shrink(),
          ),
        ],
      );
    }

    if (reel.thumbnailUrl != null) {
      return CachedNetworkImage(
        imageUrl: reel.thumbnailUrl!,
        fit: BoxFit.cover,
      );
    }

    return Container(color: AppColors.surfaceSlateDeep);
  }

  // â”€â”€ Text with highlighted hashtags â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  List<TextSpan> _buildTextSpans(String text) {
    final spans = <TextSpan>[];
    final words = text.split(' ');
    for (int i = 0; i < words.length; i++) {
      final word = words[i];
      spans.add(TextSpan(
        text: i < words.length - 1 ? '$word ' : word,
        style: word.startsWith('#')
            ? TextStyle(
                color: AppColors.accentCyan,
                fontWeight: FontWeight.w600,
              )
            : null,
      ));
    }
    return spans;
  }
}

// â”€â”€â”€ Comment bottom sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _CommentSheet extends ConsumerStatefulWidget {
  final String reelId;
  final WidgetRef ref;
  const _CommentSheet({required this.reelId, required this.ref});

  @override
  ConsumerState<_CommentSheet> createState() => _CommentSheetState();
}

class _CommentSheetState extends ConsumerState<_CommentSheet> {
  final _controller = TextEditingController();
  bool _submitting = false;
  bool _loadingComments = false;
  final List<ReelComment> _comments = [];

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
          _comments
            ..clear()
            ..addAll(result.data!);
        }
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _submitting) return;
    setState(() => _submitting = true);
    _controller.clear();

    final result = await ref
        .read(reelsFeedProvider(ReelFeedType.recommended).notifier)
        .submitComment(widget.reelId, text);

    if (result.isSuccess && result.data != null) {
      setState(() => _comments.insert(0, result.data!));
    }
    setState(() => _submitting = false);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding:
          EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
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
            Expanded(
              child: _loadingComments
                  ? const Center(
                      child: CircularProgressIndicator(
                          color: Colors.white54, strokeWidth: 2))
                  : _comments.isEmpty
                      ? const Center(
                          child: Text(
                            'No comments yet. Be the first!',
                            style: TextStyle(color: Colors.white38),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 8),
                          itemCount: _comments.length,
                          itemBuilder: (_, i) =>
                              _CommentTile(comment: _comments[i]),
                        ),
            ),
            const Divider(color: Colors.white12, height: 1),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
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
                            horizontal: 16, vertical: 10),
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
            backgroundColor: AppColors.surfaceSlate,
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
