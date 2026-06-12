import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../services/content_services.dart';

class BlogsScreen extends StatefulWidget {
  const BlogsScreen({super.key});

  @override
  State<BlogsScreen> createState() => _BlogsScreenState();
}

class _BlogsScreenState extends State<BlogsScreen> {
  final _service = BlogService();
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = _service.list();
  }

  Future<void> _refresh() async {
    setState(() => _future = _service.list());
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text('Blogs', style: TextStyle(color: Colors.white)),
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        color: AppColors.primary,
        child: FutureBuilder<List<Map<String, dynamic>>>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState != ConnectionState.done) {
              return const Center(
                  child: CircularProgressIndicator(color: AppColors.primary));
            }
            final blogs = snap.data ?? const [];
            if (blogs.isEmpty) {
              return ListView(children: const [
                SizedBox(height: 200),
                Center(
                    child: Text('No posts yet',
                        style: TextStyle(color: Colors.white54))),
              ]);
            }
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: blogs.length,
              itemBuilder: (_, i) => _card(blogs[i]),
            );
          },
        ),
      ),
    );
  }

  Widget _card(Map<String, dynamic> blog) {
    final id = (blog['_id'] ?? blog['id'])?.toString() ?? '';
    final title = blog['title']?.toString() ?? 'Untitled';
    final excerpt = blog['excerpt']?.toString() ??
        blog['summary']?.toString() ??
        blog['content']?.toString() ??
        '';
    final cover = blog['cover']?.toString() ??
        blog['image']?.toString() ??
        blog['coverImage']?.toString();
    final likes = blog['likeCount'] ?? blog['likes'] ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: AppColors.surfaceL1,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSoft),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (cover != null && cover.isNotEmpty)
            ClipRRect(
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(14)),
              child: CachedNetworkImage(
                imageUrl: cover,
                fit: BoxFit.cover,
                width: double.infinity,
                height: 160,
                errorWidget: (_, __, ___) => Container(
                    color: AppColors.surfaceL3,
                    height: 160,
                    child: const Icon(LucideIcons.image,
                        color: Colors.white24, size: 48)),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w700)),
                if (excerpt.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(excerpt,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.65),
                          fontSize: 13)),
                ],
                const SizedBox(height: 12),
                Row(
                  children: [
                    InkWell(
                      onTap: () async {
                        if (id.isNotEmpty) await _service.toggleLike(id);
                        _refresh();
                      },
                      child: Row(children: [
                        const Icon(LucideIcons.heart,
                            color: AppColors.errorRed, size: 16),
                        const SizedBox(width: 6),
                        Text('$likes',
                            style: const TextStyle(color: Colors.white70)),
                      ]),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
