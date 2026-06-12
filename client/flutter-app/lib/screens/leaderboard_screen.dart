import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../core/constants/app_colors.dart';
import '../services/player_profile_service.dart';
import 'player_profile_screen.dart';

/// Phase 4/7 leaderboard surface. Reads from
/// `GET /user/players/leaderboard` — Redis-cached on the global
/// (no-city) and exact-city paths, live fallback elsewhere. The
/// response includes `source: 'cache' | 'live'` which we surface as
/// a small tag at the top.
class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen>
    with SingleTickerProviderStateMixin {
  // Sport codes match the backend's SPORT_LIST (uppercased on the wire).
  static const _sports = <_SportTab>[
    _SportTab(code: 'CRICKET', label: 'Cricket'),
    _SportTab(code: 'FOOTBALL', label: 'Football'),
    _SportTab(code: 'BADMINTON', label: 'Badminton'),
    _SportTab(code: 'BASKETBALL', label: 'Basketball'),
    _SportTab(code: 'TENNIS', label: 'Tennis'),
  ];

  late final TabController _tabs;
  final _service = PlayerProfileService();
  final Map<String, Future<Map<String, dynamic>>> _cache = {};

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: _sports.length, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<Map<String, dynamic>> _load(String sport) {
    return _cache.putIfAbsent(
        sport, () => _service.getLeaderboard(sport: sport, limit: 50));
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
        title: const Text('Global Leaderboard',
            style: TextStyle(color: Colors.white)),
        bottom: TabBar(
          controller: _tabs,
          isScrollable: true,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: Colors.white60,
          tabs: _sports.map((s) => Tab(text: s.label)).toList(),
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: _sports.map((s) => _buildList(s.code)).toList(),
      ),
    );
  }

  Widget _buildList(String sport) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _load(sport),
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Center(
              child: CircularProgressIndicator(color: AppColors.primary));
        }
        final data = snap.data ?? const {};
        final entries = ((data['entries'] as List?) ??
                (data['leaderboard'] as List?) ??
                const [])
            .whereType<Map>()
            .map(Map<String, dynamic>.from)
            .toList();
        if (entries.isEmpty) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Text(
                'No players ranked yet for this sport.\nPlay a match to get on the board.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white54, height: 1.4),
              ),
            ),
          );
        }
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async {
            _cache.remove(sport);
            await _load(sport);
            if (mounted) setState(() {});
          },
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 12),
            itemCount: entries.length + 1,
            itemBuilder: (_, i) {
              if (i == 0) {
                final source = (data['source'] ?? 'live').toString();
                return Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                  child: Row(
                    children: [
                      Icon(
                        source == 'cache'
                            ? LucideIcons.zap
                            : LucideIcons.activity,
                        color: AppColors.primary,
                        size: 12,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        source == 'cache'
                            ? 'Cached snapshot · updated hourly'
                            : 'Live ranking',
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.55),
                            fontSize: 11,
                            fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                );
              }
              return _row(i, entries[i - 1]);
            },
          ),
        );
      },
    );
  }

  Widget _row(int rank, Map<String, dynamic> player) {
    final user = (player['user'] as Map?)?.cast<String, dynamic>() ?? player;
    final name =
        (user['name'] ?? user['username'] ?? user['display_name'] ?? 'Player')
            .toString();
    final photo =
        (user['photoURL'] ?? user['profilePicture'] ?? user['photo_url'])
            ?.toString();
    final rating = player['playerRating'] ?? user['playerRating'] ?? 0;
    final matches = player['matchesPlayed'] ?? player['matches'] ?? 0;
    final city = user['city']?.toString();

    Color rankColor;
    if (rank == 1) {
      rankColor = AppColors.accentGold;
    } else if (rank == 2) {
      rankColor = AppColors.textLightGray;
    } else if (rank == 3) {
      rankColor = AppColors.accentOrange;
    } else {
      rankColor = Colors.white54;
    }

    return GestureDetector(
      onTap: () => _openPlayer(user),
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 4, 16, 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.surfaceL1,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.borderSoft),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 36,
              child: Text('#$rank',
                  style: TextStyle(
                      color: rankColor,
                      fontWeight: FontWeight.w700,
                      fontSize: 15)),
            ),
            CircleAvatar(
              radius: 18,
              backgroundColor: AppColors.surfaceL3,
              backgroundImage: photo != null && photo.isNotEmpty
                  ? CachedNetworkImageProvider(photo)
                  : null,
              child: photo == null || photo.isEmpty
                  ? const Icon(LucideIcons.user,
                      size: 18, color: Colors.white70)
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name,
                      style: const TextStyle(
                          color: Colors.white, fontWeight: FontWeight.w600)),
                  if (city != null && city.isNotEmpty)
                    Text(
                      '$city · $matches matches',
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.5),
                          fontSize: 10),
                    )
                  else
                    Text(
                      '$matches matches',
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.5),
                          fontSize: 10),
                    ),
                ],
              ),
            ),
            Text('$rating',
                style: const TextStyle(
                    color: AppColors.primary, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }

  void _openPlayer(Map<String, dynamic> user) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => PlayerProfileScreen(playerData: user),
    );
  }
}

class _SportTab {
  final String code;
  final String label;
  const _SportTab({required this.code, required this.label});
}
