import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../services/content_services.dart';

/// Lists items the user has bookmarked (teams, games, players, turfs).
/// Grouped by type in tabs — matches the web's SavedPage IA.
class SavedItemsScreen extends StatefulWidget {
  const SavedItemsScreen({super.key});

  @override
  State<SavedItemsScreen> createState() => _SavedItemsScreenState();
}

class _SavedItemsScreenState extends State<SavedItemsScreen> {
  final _service = SavedService();
  late Future<Map<String, List<Map<String, dynamic>>>> _future;

  @override
  void initState() {
    super.initState();
    _future = _service.list();
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
        title: const Text('Saved', style: TextStyle(color: Colors.white)),
      ),
      body: FutureBuilder<Map<String, List<Map<String, dynamic>>>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(
                child: CircularProgressIndicator(color: AppColors.primary));
          }
          final grouped = snap.data ?? const {};
          if (grouped.isEmpty) {
            return const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(LucideIcons.bookmark, color: Colors.white24, size: 64),
                  SizedBox(height: 12),
                  Text('Nothing saved yet',
                      style: TextStyle(color: Colors.white54)),
                ],
              ),
            );
          }
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              for (final entry in grouped.entries) ...[
                _sectionHeader(entry.key),
                const SizedBox(height: 8),
                ...entry.value.map(_tile),
                const SizedBox(height: 16),
              ],
            ],
          );
        },
      ),
    );
  }

  Widget _sectionHeader(String type) {
    return Text(
      type[0].toUpperCase() + type.substring(1),
      style: const TextStyle(
          color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700),
    );
  }

  Widget _tile(Map<String, dynamic> item) {
    final title = item['name']?.toString() ??
        item['title']?.toString() ??
        item['username']?.toString() ??
        'Untitled';
    final subtitle = item['city']?.toString() ??
        item['location']?.toString() ??
        item['sportType']?.toString() ??
        '';
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceL1,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderSoft),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.bookmark, color: AppColors.primary, size: 18),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        color: Colors.white, fontWeight: FontWeight.w600)),
                if (subtitle.isNotEmpty)
                  Text(subtitle,
                      style:
                          const TextStyle(color: Colors.white54, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
