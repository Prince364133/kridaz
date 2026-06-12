import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/services.dart';
import '../core/constants/app_colors.dart';
import '../core/util/image_url.dart';
import '../models/media_item_model.dart';
import '../services/chat_service.dart';

class ChatMediaScreen extends StatefulWidget {
  final String chatId;
  final String chatName;

  const ChatMediaScreen({
    Key? key,
    required this.chatId,
    required this.chatName,
  }) : super(key: key);

  @override
  State<ChatMediaScreen> createState() => _ChatMediaScreenState();
}

class _ChatMediaScreenState extends State<ChatMediaScreen> {
  List<MediaItem> _media = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadMedia();
  }

  Future<void> _loadMedia() async {
    final items = await ChatService().getChatMedia(widget.chatId);
    if (!mounted) return;
    setState(() {
      _media = items;
      _isLoading = false;
    });
  }

  /// Groups media by "Month Year" (e.g. "May 2026").
  Map<String, List<MediaItem>> get _grouped {
    final map = <String, List<MediaItem>>{};
    for (final item in _media) {
      final key = _monthLabel(item.createdAt);
      map.putIfAbsent(key, () => []).add(item);
    }
    return map;
  }

  String _monthLabel(DateTime dt) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${months[dt.month - 1]} ${dt.year}';
  }

  void _openFullscreen(MediaItem item) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => _FullscreenMedia(item: item),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceL0,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      context.pop();
                    },
                    child: const Icon(LucideIcons.chevronLeft,
                        color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Media',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.w700)),
                        Text(widget.chatName,
                            style: const TextStyle(
                                color: AppColors.textDarkGray, fontSize: 12)),
                      ],
                    ),
                  ),
                  if (!_isLoading && _media.isNotEmpty)
                    Text('${_media.length} files',
                        style: const TextStyle(
                            color: AppColors.textDarkGray, fontSize: 13)),
                ],
              ),
            ),

            // Content
            Expanded(
              child: _isLoading
                  ? const Center(
                      child:
                          CircularProgressIndicator(color: AppColors.primary))
                  : _media.isEmpty
                      ? _buildEmpty()
                      : _buildGrid(),
            ),
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
          Icon(LucideIcons.image,
              size: 72, color: Colors.white.withValues(alpha: 0.15)),
          const SizedBox(height: 16),
          const Text('No media shared yet',
              style: TextStyle(color: Color(0x4DFFFFFF), fontSize: 16)),
        ],
      ),
    );
  }

  Widget _buildGrid() {
    final groups = _grouped;
    final keys = groups.keys.toList();

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      itemCount: keys.length,
      itemBuilder: (ctx, i) {
        final label = keys[i];
        final items = groups[label]!;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text(
                label,
                style: const TextStyle(
                    color: AppColors.textDarkGray,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.3),
              ),
            ),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 3,
                mainAxisSpacing: 3,
              ),
              itemCount: items.length,
              itemBuilder: (_, j) => _MediaCell(
                item: items[j],
                onTap: () => _openFullscreen(items[j]),
              ),
            ),
          ],
        );
      },
    );
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Media Grid Cell
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _MediaCell extends StatelessWidget {
  final MediaItem item;
  final VoidCallback onTap;

  const _MediaCell({required this.item, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if ((item.isImage || item.isVideo) && isHttpUrl(item.url))
            Image.network(
              item.url,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => _placeholder(),
            )
          else
            _placeholder(icon: Icons.insert_drive_file_outlined),
          if (item.isVideo)
            const Center(
              child: Icon(Icons.play_circle_fill_rounded,
                  color: Colors.white, size: 32),
            ),
        ],
      ),
    );
  }

  Widget _placeholder({IconData icon = LucideIcons.imageOff}) {
    return Container(
      color: AppColors.surfaceL4,
      child: Center(child: Icon(icon, color: AppColors.textGray, size: 28)),
    );
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Fullscreen Media Viewer
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _FullscreenMedia extends StatelessWidget {
  final MediaItem item;

  const _FullscreenMedia({required this.item});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTap: () => context.pop(),
        child: Stack(
          children: [
            Center(
              child: InteractiveViewer(
                child: Image.network(
                  item.url,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => const Icon(
                    LucideIcons.imageOff,
                    color: Colors.white38,
                    size: 80,
                  ),
                ),
              ),
            ),
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: GestureDetector(
                  onTap: () => context.pop(),
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: Colors.black45,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Icon(LucideIcons.x,
                        color: Colors.white, size: 20),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
