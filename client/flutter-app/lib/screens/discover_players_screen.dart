import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../core/constants/app_colors.dart';
import '../services/player_profile_service.dart';
import 'player_profile_screen.dart';

/// Phase 6 player discovery — facet search backed by
/// `GET /user/players/discover`. Cursor paginated by `id desc`.
/// Honors `privacyFlags.discoverable` and bidirectional block on the
/// server, so this client just renders whatever comes back.
class DiscoverPlayersScreen extends StatefulWidget {
  const DiscoverPlayersScreen({super.key});

  @override
  State<DiscoverPlayersScreen> createState() => _DiscoverPlayersScreenState();
}

class _DiscoverPlayersScreenState extends State<DiscoverPlayersScreen> {
  final _service = PlayerProfileService();
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();
  Timer? _debounce;

  String? _q;
  String? _sport;
  String? _city;
  String? _skillLevel;
  num? _minRating;

  final List<Map<String, dynamic>> _players = [];
  String? _cursor;
  bool _loading = false;
  bool _exhausted = false;
  bool _initialDone = false;

  static const _sports = [
    'CRICKET',
    'FOOTBALL',
    'BADMINTON',
    'BASKETBALL',
    'TENNIS',
  ];
  static const _skillLevels = ['beginner', 'intermediate', 'advanced', 'pro'];

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_maybeLoadMore);
    _reload();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _maybeLoadMore() {
    if (_loading || _exhausted) return;
    if (_scrollController.position.pixels >
        _scrollController.position.maxScrollExtent - 300) {
      _loadMore();
    }
  }

  Future<void> _reload() async {
    setState(() {
      _players.clear();
      _cursor = null;
      _exhausted = false;
      _initialDone = false;
    });
    await _loadMore();
  }

  Future<void> _loadMore() async {
    if (_loading || _exhausted) return;
    setState(() => _loading = true);
    final data = await _service.discoverPlayers(
      q: _q,
      sport: _sport,
      city: _city,
      skillLevel: _skillLevel,
      minRating: _minRating,
      cursor: _cursor,
    );
    if (!mounted) return;
    final batch =
        ((data['players'] as List?) ?? (data['users'] as List?) ?? const [])
            .whereType<Map>()
            .map(Map<String, dynamic>.from)
            .toList();
    final next = data['nextCursor']?.toString();
    setState(() {
      _players.addAll(batch);
      _cursor = next;
      _exhausted = batch.isEmpty || next == null || next.isEmpty;
      _loading = false;
      _initialDone = true;
    });
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      _q = value.trim().isEmpty ? null : value.trim();
      _reload();
    });
  }

  void _openPlayer(Map<String, dynamic> user) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => PlayerProfileScreen(playerData: user),
    );
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
        title: const Text('Discover players',
            style: TextStyle(color: Colors.white)),
      ),
      body: Column(
        children: [
          _searchBar(),
          _facetChips(),
          const Divider(height: 1, color: Colors.white12),
          Expanded(child: _list()),
        ],
      ),
    );
  }

  Widget _searchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: TextField(
        controller: _searchController,
        onChanged: _onSearchChanged,
        style: const TextStyle(color: Colors.white, fontSize: 14),
        decoration: InputDecoration(
          filled: true,
          fillColor: AppColors.surfaceL2,
          hintText: 'Search by name or @handle',
          hintStyle: TextStyle(
              color: Colors.white.withValues(alpha: 0.45), fontSize: 13),
          prefixIcon:
              const Icon(LucideIcons.search, color: Colors.white54, size: 18),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
          contentPadding: const EdgeInsets.symmetric(vertical: 12),
        ),
      ),
    );
  }

  Widget _facetChips() {
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        children: [
          _facetChip(
            label: _sport ?? 'Sport',
            active: _sport != null,
            onTap: () => _pickFromList(
              title: 'Sport',
              options: _sports,
              selected: _sport,
              onSelected: (v) {
                _sport = v;
                _reload();
              },
            ),
          ),
          _facetChip(
            label: _skillLevel == null
                ? 'Skill'
                : _skillLevel![0].toUpperCase() + _skillLevel!.substring(1),
            active: _skillLevel != null,
            onTap: () => _pickFromList(
              title: 'Skill level',
              options: _skillLevels,
              selected: _skillLevel,
              onSelected: (v) {
                _skillLevel = v;
                _reload();
              },
            ),
          ),
          _facetChip(
            label: _minRating == null ? 'Min rating' : '${_minRating}+',
            active: _minRating != null,
            onTap: () => _pickFromList(
              title: 'Minimum rating',
              options: const ['1000', '1200', '1400', '1600', '1800'],
              selected: _minRating?.toString(),
              onSelected: (v) {
                _minRating = v == null ? null : num.tryParse(v);
                _reload();
              },
            ),
          ),
          _facetChip(
            label: _city ?? 'City',
            active: _city != null,
            onTap: _editCity,
          ),
          if (_sport != null ||
              _skillLevel != null ||
              _minRating != null ||
              _city != null)
            _facetChip(
              label: 'Clear',
              active: false,
              icon: LucideIcons.x,
              onTap: () {
                setState(() {
                  _sport = null;
                  _skillLevel = null;
                  _minRating = null;
                  _city = null;
                });
                _reload();
              },
            ),
        ],
      ),
    );
  }

  Widget _facetChip({
    required String label,
    required bool active,
    required VoidCallback onTap,
    IconData? icon,
  }) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: active ? AppColors.primary : AppColors.surfaceL2,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon,
                    color: active ? Colors.black : Colors.white, size: 12),
                const SizedBox(width: 4),
              ],
              Text(
                label,
                style: TextStyle(
                    color: active ? Colors.black : Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w700),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickFromList({
    required String title,
    required List<String> options,
    required String? selected,
    required ValueChanged<String?> onSelected,
  }) async {
    final result = await showModalBottomSheet<String?>(
      context: context,
      backgroundColor: AppColors.surfaceL1,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (sheet) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 10),
            Text(title,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w700)),
            const SizedBox(height: 10),
            if (selected != null)
              ListTile(
                dense: true,
                leading:
                    const Icon(LucideIcons.x, color: Colors.white54, size: 16),
                title: const Text('Clear filter',
                    style: TextStyle(color: Colors.white54, fontSize: 13)),
                onTap: () => Navigator.of(sheet).pop(null),
              ),
            for (final opt in options)
              ListTile(
                dense: true,
                title: Text(
                  opt[0].toUpperCase() + opt.substring(1).toLowerCase(),
                  style: TextStyle(
                    color: opt == selected ? AppColors.primary : Colors.white,
                    fontSize: 13,
                    fontWeight:
                        opt == selected ? FontWeight.w700 : FontWeight.w500,
                  ),
                ),
                trailing: opt == selected
                    ? const Icon(LucideIcons.check,
                        color: AppColors.primary, size: 16)
                    : null,
                onTap: () => Navigator.of(sheet).pop(opt),
              ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
    if (!mounted) return;
    onSelected(result);
  }

  Future<void> _editCity() async {
    final controller = TextEditingController(text: _city ?? '');
    final result = await showDialog<String?>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceL2,
        title: const Text('Filter by city',
            style: TextStyle(color: Colors.white, fontSize: 15)),
        content: TextField(
          controller: controller,
          autofocus: true,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'e.g. Hyderabad',
            hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.4)),
            border: const OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(''),
            child: const Text('Clear', style: TextStyle(color: Colors.white54)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(controller.text.trim()),
            child:
                const Text('Apply', style: TextStyle(color: AppColors.primary)),
          ),
        ],
      ),
    );
    if (result == null || !mounted) return;
    setState(() => _city = result.isEmpty ? null : result);
    _reload();
  }

  Widget _list() {
    if (!_initialDone && _players.isEmpty && _loading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      );
    }
    if (_players.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'No players match these filters.\nTry widening the search.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white54, height: 1.4),
          ),
        ),
      );
    }
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _reload,
      child: ListView.separated(
        controller: _scrollController,
        padding: const EdgeInsets.symmetric(vertical: 12),
        itemCount: _players.length + (_loading ? 1 : 0),
        separatorBuilder: (_, __) => const SizedBox(height: 4),
        itemBuilder: (_, i) {
          if (i >= _players.length) {
            return const Padding(
              padding: EdgeInsets.all(16),
              child: Center(
                child: SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: AppColors.primary),
                ),
              ),
            );
          }
          return _playerRow(_players[i]);
        },
      ),
    );
  }

  Widget _playerRow(Map<String, dynamic> p) {
    final name = (p['name'] ?? p['username'] ?? 'Player').toString();
    final username = p['username']?.toString();
    final photo =
        (p['photoURL'] ?? p['profilePicture'] ?? p['photo_url'])?.toString();
    final city = p['city']?.toString();
    final rating = p['playerRating'];
    final sports = ((p['sportTypes'] as List?) ?? const [])
        .map((s) => s.toString())
        .toList();

    return GestureDetector(
      onTap: () => _openPlayer(p),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.surfaceL1,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: AppColors.surfaceL3,
              backgroundImage: photo != null && photo.isNotEmpty
                  ? CachedNetworkImageProvider(photo)
                  : null,
              child: photo == null || photo.isEmpty
                  ? const Icon(LucideIcons.user,
                      size: 18, color: Colors.white54)
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w700)),
                  if (username != null && username.isNotEmpty)
                    Text(
                      '@$username',
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.5),
                          fontSize: 11),
                    ),
                  if (sports.isNotEmpty || (city != null && city.isNotEmpty))
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        [
                          if (city != null && city.isNotEmpty) city,
                          if (sports.isNotEmpty) sports.take(3).join(' · '),
                        ].join(' · '),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.55),
                            fontSize: 11),
                      ),
                    ),
                ],
              ),
            ),
            if (rating != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.4)),
                ),
                child: Text(
                  '$rating',
                  style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 11,
                      fontWeight: FontWeight.w700),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
