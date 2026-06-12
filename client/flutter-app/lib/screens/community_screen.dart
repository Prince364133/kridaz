import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:share_plus/share_plus.dart';

import '../core/constants/app_colors.dart';
import '../models/post_model.dart';
import '../models/story_model.dart';
import '../providers/story_provider.dart';
import '../services/auth_manager.dart';
import '../services/community_service.dart';
import '../widgets/common/bms_toast.dart';
import 'reel_community_view.dart';

const _kFilters = ['All', 'Following', 'Reels', 'Highlights', 'Announcements'];
const _kSports = ['Cricket', 'Football', 'Rugby', 'Baseball', 'Hockey'];

class CommunityScreen extends ConsumerStatefulWidget {
  const CommunityScreen({super.key});

  @override
  ConsumerState<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends ConsumerState<CommunityScreen> {
  final ScrollController _scrollCtrl = ScrollController();
  final CommunityService _svc = CommunityService();

  final List<PostModel> _posts = [];
  int _page = 1;
  bool _loading = false;
  bool _hasMore = true;
  String _activeFilter = 'All';
  String _activeSport = '';

  @override
  void initState() {
    super.initState();
    _scrollCtrl.addListener(_onScroll);
    _fetch(reset: true);
  }

  @override
  void dispose() {
    _scrollCtrl.removeListener(_onScroll);
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_loading || !_hasMore) return;
    if (_scrollCtrl.position.pixels >=
        _scrollCtrl.position.maxScrollExtent - 200) {
      _fetch();
    }
  }

  Future<void> _fetch({bool reset = false}) async {
    if (_loading) return;
    setState(() => _loading = true);
    if (reset) {
      _page = 1;
      _hasMore = true;
    }
    try {
      final fresh = await _svc.getFeed(
        page: _page,
        following: _activeFilter == 'Following' ? true : null,
        sport: _activeSport.isEmpty ? null : _activeSport,
      );
      setState(() {
        if (reset) {
          _posts
            ..clear()
            ..addAll(fresh);
        } else {
          final existing = _posts.map((p) => p.id).toSet();
          _posts.addAll(fresh.where((p) => !existing.contains(p.id)));
        }
        _hasMore = fresh.length >= 10;
        _page += 1;
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _refresh() async {
    ref.invalidate(storyGroupsProvider);
    await _fetch(reset: true);
  }

  void _setFilter(String filter) {
    if (filter == 'Reels') {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const ReelCommunityView()),
      );
      return;
    }
    if (_activeFilter == filter) return;
    setState(() => _activeFilter = filter);
    _fetch(reset: true);
  }

  void _setSport(String sport) {
    if (_activeSport == sport) return;
    setState(() => _activeSport = sport);
    _fetch(reset: true);
  }

  void _onPostChanged(String postId, PostModel Function(PostModel) updater) {
    setState(() {
      final i = _posts.indexWhere((p) => p.id == postId);
      if (i >= 0) _posts[i] = updater(_posts[i]);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceL0,
      appBar: AppBar(
        backgroundColor: AppColors.surfaceL0,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text('Community',
            style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w700,
                fontFamily: 'Poppins')),
        centerTitle: false,
      ),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _refresh,
        child: CustomScrollView(
          controller: _scrollCtrl,
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(child: _StoriesRow()),
            SliverToBoxAdapter(
                child: _FilterChips(
              active: _activeFilter,
              onTap: _setFilter,
            )),
            SliverToBoxAdapter(
                child: _SportChips(
              active: _activeSport,
              onTap: _setSport,
            )),
            if (_loading && _posts.isEmpty)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: CircularProgressIndicator(
                      color: AppColors.primary, strokeWidth: 2),
                ),
              )
            else if (_posts.isEmpty)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Padding(
                    padding: EdgeInsets.all(40),
                    child: Text('No posts yet',
                        style: TextStyle(
                            color: Colors.white38,
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 2)),
                  ),
                ),
              )
            else
              SliverList.builder(
                itemCount: _posts.length + (_hasMore ? 1 : 0),
                itemBuilder: (_, i) {
                  if (i >= _posts.length) {
                    return const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Center(
                        child: SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: AppColors.primary),
                        ),
                      ),
                    );
                  }
                  return _PostCard(
                    post: _posts[i],
                    onChanged: _onPostChanged,
                  );
                },
              ),
            const SliverToBoxAdapter(child: SizedBox(height: 40)),
          ],
        ),
      ),
    );
  }
}

// ── Filter chips row ────────────────────────────────────────────────────────
class _FilterChips extends StatelessWidget {
  final String active;
  final ValueChanged<String> onTap;
  const _FilterChips({required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: _kFilters.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final f = _kFilters[i];
          final isActive = active == f;
          return GestureDetector(
            onTap: () => onTap(f),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              decoration: BoxDecoration(
                color: isActive ? AppColors.primary : Colors.transparent,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                    color: isActive
                        ? Colors.transparent
                        : Colors.white.withValues(alpha: 0.10)),
              ),
              child: Text(f,
                  style: TextStyle(
                      color: isActive ? Colors.black : Colors.white70,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      fontFamily: 'Poppins')),
            ),
          );
        },
      ),
    );
  }
}

// ── Sport chips row ─────────────────────────────────────────────────────────
class _SportChips extends StatelessWidget {
  final String active;
  final ValueChanged<String> onTap;
  const _SportChips({required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final items = ['', ..._kSports];
    return SizedBox(
      height: 36,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final s = items[i];
          final label = s.isEmpty ? 'All sports' : s;
          final isActive = active == s;
          return GestureDetector(
            onTap: () => onTap(s),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: isActive
                    ? AppColors.accentTeal.withValues(alpha: 0.18)
                    : AppColors.surfaceL1,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                    color: isActive
                        ? AppColors.accentTeal
                        : Colors.white.withValues(alpha: 0.08)),
              ),
              child: Text(label,
                  style: TextStyle(
                      color: isActive ? AppColors.accentTeal : Colors.white70,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Poppins')),
            ),
          );
        },
      ),
    );
  }
}

// ── Stories row ─────────────────────────────────────────────────────────────
class _StoriesRow extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final me = AuthManager().currentUser;
    final myId = (me?['id'] ?? me?['_id'])?.toString() ?? '';
    final asyncStories = ref.watch(storyGroupsProvider);

    return Container(
      height: 96,
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: asyncStories.when(
        loading: () => const Center(
          child: SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
                strokeWidth: 2, color: AppColors.primary),
          ),
        ),
        error: (_, __) => const SizedBox.shrink(),
        data: (groups) {
          if (groups.isEmpty) return const SizedBox.shrink();
          return ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: groups.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, i) {
              final group = groups[i];
              final viewed = group.allViewed(myId);
              return _StoryCircle(group: group, viewed: viewed);
            },
          );
        },
      ),
    );
  }
}

class _StoryCircle extends StatelessWidget {
  final StoryGroup group;
  final bool viewed;
  const _StoryCircle({required this.group, required this.viewed});

  @override
  Widget build(BuildContext context) {
    final photo = group.author.profilePicture;
    return SizedBox(
      width: 64,
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: viewed
                  ? null
                  : const LinearGradient(
                      colors: [AppColors.accentTeal, AppColors.accentLime],
                    ),
              border:
                  viewed ? Border.all(color: Colors.white24, width: 2) : null,
            ),
            padding: const EdgeInsets.all(2),
            child: ClipOval(
              child: Container(
                color: AppColors.surfaceL2,
                child: photo != null && photo.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: photo,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) =>
                            const Icon(Icons.person, color: Colors.white38),
                      )
                    : const Icon(Icons.person, color: Colors.white38),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            group.author.name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
                color: Colors.white70,
                fontSize: 10,
                fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

// ── Post card ───────────────────────────────────────────────────────────────
class _PostCard extends StatefulWidget {
  final PostModel post;
  final void Function(String postId, PostModel Function(PostModel)) onChanged;
  const _PostCard({required this.post, required this.onChanged});

  @override
  State<_PostCard> createState() => _PostCardState();
}

class _PostCardState extends State<_PostCard> {
  final _commentCtrl = TextEditingController();
  bool _commentsOpen = false;
  bool _liking = false;
  bool _posting = false;
  final CommunityService _svc = CommunityService();

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  String _formatTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.day}/${dt.month}/${dt.year}';
  }

  String get _myId {
    final me = AuthManager().currentUser;
    return (me?['id'] ?? me?['_id'])?.toString() ?? '';
  }

  Future<void> _toggleLike() async {
    if (_liking) return;
    setState(() => _liking = true);
    final myId = _myId;
    final wasLiked = widget.post.isLikedBy(myId);
    final optimistic = wasLiked
        ? widget.post.likeUserIds.where((id) => id != myId).toList()
        : [...widget.post.likeUserIds, myId];
    widget.onChanged(
        widget.post.id, (p) => p.copyWith(likeUserIds: optimistic));

    final result = await _svc.toggleLike(widget.post.id);
    if (!mounted) return;
    if (result != null) {
      widget.onChanged(widget.post.id, (p) => p.copyWith(likeUserIds: result));
    } else {
      widget.onChanged(widget.post.id,
          (p) => p.copyWith(likeUserIds: widget.post.likeUserIds));
      BmsToast.error(context, 'Could not update like');
    }
    setState(() => _liking = false);
  }

  Future<void> _postComment() async {
    final text = _commentCtrl.text.trim();
    if (text.isEmpty || _posting) return;
    setState(() => _posting = true);
    final created = await _svc.addComment(widget.post.id, text);
    if (!mounted) return;
    if (created != null) {
      widget.onChanged(
        widget.post.id,
        (p) => p.copyWith(comments: [...p.comments, created]),
      );
      _commentCtrl.clear();
    } else {
      BmsToast.error(context, 'Could not post comment');
    }
    setState(() => _posting = false);
  }

  Future<void> _share() async {
    final caption = widget.post.content.isNotEmpty
        ? widget.post.content
        : 'Check out this post on Kridaz';
    await Share.share(caption);
  }

  void _showMenu() {
    final isMine = widget.post.author?.id == _myId;
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceL2,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (isMine)
                ListTile(
                  leading:
                      const Icon(LucideIcons.trash2, color: AppColors.errorRed),
                  title: const Text('Delete post',
                      style: TextStyle(
                          color: AppColors.errorRed,
                          fontWeight: FontWeight.w600)),
                  onTap: () async {
                    Navigator.of(context).pop();
                    final ok = await _svc.deletePost(widget.post.id);
                    if (!mounted) return;
                    if (ok) {
                      widget.onChanged(widget.post.id,
                          (p) => p.copyWith(status: '__deleted__'));
                      BmsToast.success(context, 'Post deleted');
                    } else {
                      BmsToast.error(context, 'Could not delete');
                    }
                  },
                )
              else
                ListTile(
                  leading: const Icon(LucideIcons.flag, color: Colors.white70),
                  title: const Text('Report post',
                      style: TextStyle(
                          color: Colors.white, fontWeight: FontWeight.w600)),
                  onTap: () {
                    Navigator.of(context).pop();
                    _openReportSheet();
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _openReportSheet() {
    final reasonCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceL2,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => Padding(
        padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 18,
            bottom: MediaQuery.of(context).viewInsets.bottom + 18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Report this post',
                style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 16)),
            const SizedBox(height: 12),
            TextField(
              controller: reasonCtrl,
              maxLines: 3,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Why are you reporting this?',
                hintStyle: const TextStyle(color: Colors.white38, fontSize: 13),
                filled: true,
                fillColor: AppColors.surfaceL3,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                ),
                onPressed: () async {
                  final reason = reasonCtrl.text.trim();
                  if (reason.isEmpty) return;
                  Navigator.of(context).pop();
                  final ok = await _svc.reportPost(widget.post.id, reason);
                  if (!mounted) return;
                  BmsToast.success(
                      context, ok ? 'Report submitted' : 'Failed to report');
                },
                child: const Text('Submit',
                    style:
                        TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final post = widget.post;
    if (post.status == '__deleted__') return const SizedBox.shrink();

    final liked = post.isLikedBy(_myId);
    final author = post.author;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.surfaceL0,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AppColors.surfaceL2,
                backgroundImage: (author?.profilePicture != null &&
                        author!.profilePicture!.isNotEmpty)
                    ? CachedNetworkImageProvider(author.profilePicture!)
                    : null,
                child: (author?.profilePicture == null ||
                        author!.profilePicture!.isEmpty)
                    ? const Icon(Icons.person, color: Colors.white38, size: 18)
                    : null,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(author?.name ?? 'Player',
                        style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 13)),
                    const SizedBox(height: 2),
                    Text(_formatTime(post.createdAt),
                        style: const TextStyle(
                            color: Colors.white38,
                            fontSize: 11,
                            fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(LucideIcons.moreVertical,
                    color: Colors.white54, size: 18),
                onPressed: _showMenu,
              ),
            ],
          ),
          if (post.title != null && post.title!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(post.title!,
                style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 13)),
          ],
          if (post.content.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(post.content,
                style: const TextStyle(
                    color: Colors.white70, fontSize: 13, height: 1.4)),
          ],
          if (post.mediaUrl != null && post.mediaUrl!.isNotEmpty) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: AspectRatio(
                aspectRatio: 1,
                child: CachedNetworkImage(
                  imageUrl: post.thumbnailUrl ?? post.mediaUrl!,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(
                    color: AppColors.surfaceL2,
                    child: const Center(
                      child: SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: AppColors.primary),
                      ),
                    ),
                  ),
                  errorWidget: (_, __, ___) => Container(
                    color: AppColors.surfaceL2,
                    child: const Center(
                      child: Icon(LucideIcons.imageOff, color: Colors.white24),
                    ),
                  ),
                ),
              ),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              _ActionBtn(
                icon: LucideIcons.thumbsUp,
                count: post.likeCount,
                active: liked,
                onTap: _liking ? null : _toggleLike,
              ),
              const SizedBox(width: 18),
              _ActionBtn(
                icon: LucideIcons.messageCircle,
                count: post.commentCount,
                active: _commentsOpen,
                onTap: () => setState(() => _commentsOpen = !_commentsOpen),
              ),
              const SizedBox(width: 18),
              _ActionBtn(
                icon: LucideIcons.send,
                count: null,
                label: 'Share',
                active: false,
                onTap: _share,
              ),
            ],
          ),
          if (_commentsOpen) ...[
            const SizedBox(height: 12),
            const Divider(color: Colors.white12, height: 1),
            const SizedBox(height: 10),
            if (post.comments.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 6),
                child: Text('No comments yet. Be the first!',
                    style: TextStyle(
                        color: Colors.white38,
                        fontSize: 12,
                        fontStyle: FontStyle.italic)),
              )
            else
              ...post.comments.take(4).map(_commentTile),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _commentCtrl,
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                    decoration: const InputDecoration(
                      hintText: 'Add a comment...',
                      hintStyle: TextStyle(color: Colors.white38, fontSize: 12),
                      isDense: true,
                      border: InputBorder.none,
                    ),
                    onSubmitted: (_) => _postComment(),
                  ),
                ),
                GestureDetector(
                  onTap: _postComment,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: _commentCtrl.text.trim().isEmpty
                          ? Colors.white12
                          : AppColors.primary,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: _posting
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.black),
                          )
                        : Text('Post',
                            style: TextStyle(
                                color: _commentCtrl.text.trim().isEmpty
                                    ? Colors.white38
                                    : Colors.black,
                                fontSize: 12,
                                fontWeight: FontWeight.w800)),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _commentTile(PostComment c) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: RichText(
        text: TextSpan(
          children: [
            TextSpan(
                text: '${c.user?.name ?? 'Player'}  ',
                style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 12)),
            TextSpan(
                text: c.text,
                style: const TextStyle(
                    color: Colors.white70, fontSize: 12, height: 1.4)),
          ],
        ),
      ),
    );
  }
}

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final int? count;
  final String? label;
  final bool active;
  final VoidCallback? onTap;
  const _ActionBtn({
    required this.icon,
    required this.count,
    this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = active ? AppColors.primary : Colors.white70;
    return GestureDetector(
      onTap: onTap,
      // Make the whole bounding box hit-testable — without this the bare
      // GestureDetector only catches taps on the painted icon+text glyphs
      // (~40x20 px), so the gaps and padding around them eat every tap.
      // That's why like/comment/share appear unresponsive.
      behavior: HitTestBehavior.opaque,
      child: Padding(
        // A bit of internal padding so the hit-box is a comfortable thumb
        // target, not just the row's intrinsic size.
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
        child: Row(
          children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(width: 6),
            Text(
              label ?? (count ?? 0).toString(),
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w700),
            ),
          ],
        ),
      ),
    );
  }
}
