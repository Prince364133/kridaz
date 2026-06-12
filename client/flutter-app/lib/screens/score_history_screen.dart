import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../services/match_feed_service.dart';
import '../widgets/scoring/live_match_card.dart';

class ScoreHistoryScreen extends StatefulWidget {
  const ScoreHistoryScreen({Key? key}) : super(key: key);

  @override
  State<ScoreHistoryScreen> createState() => _ScoreHistoryScreenState();
}

class _ScoreHistoryScreenState extends State<ScoreHistoryScreen> {
  final _feed = MatchFeedService();
  String _selectedSport = 'All';
  bool _loading = true;
  List<Map<String, dynamic>> _results = const [];

  static const List<String> _sports = [
    'All',
    'Cricket',
    'Football',
    'Tennis',
    'Badminton',
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final recent = await _feed.recentForUser(limit: 50);
    if (!mounted) return;
    setState(() {
      _results = recent;
      _loading = false;
    });
  }

  String _sportOf(Map<String, dynamic> item) {
    final raw = (item['gameType'] ?? item['sport'] ?? '').toString();
    if (raw.isEmpty) return 'Cricket';
    if (raw.toUpperCase() == 'SCORING_MATCH') return 'Cricket';
    return raw;
  }

  List<Map<String, dynamic>> get _filtered => _selectedSport == 'All'
      ? _results
      : _results.where((r) => _sportOf(r) == _selectedSport).toList();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Match Results',
          style: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.w700,
            fontFamily: 'Poppins',
          ),
        ),
      ),
      body: Column(
        children: [
          SizedBox(
            height: 52,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemCount: _sports.length,
              itemBuilder: (_, i) {
                final s = _sports[i];
                final selected = _selectedSport == s;
                return GestureDetector(
                  onTap: () => setState(() => _selectedSport = s),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: selected
                          ? AppColors.primary
                          : AppColors.backgroundCard,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: selected ? AppColors.primary : Colors.white12,
                      ),
                    ),
                    child: Text(
                      s,
                      style: TextStyle(
                        color: selected ? Colors.black : Colors.white70,
                        fontSize: 12,
                        fontWeight:
                            selected ? FontWeight.w700 : FontWeight.w400,
                        fontFamily: 'Poppins',
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          if (!_loading)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Text(
                    '${_filtered.length} results',
                    style: const TextStyle(
                      color: AppColors.textGray,
                      fontSize: 12,
                      fontFamily: 'Poppins',
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 8),
          Expanded(
            child: _loading
                ? const Center(
                    child: SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white54,
                      ),
                    ),
                  )
                : _filtered.isEmpty
                    ? const Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(LucideIcons.trophy,
                                color: Colors.white24, size: 48),
                            SizedBox(height: 12),
                            Text(
                              'No match results yet.',
                              style: TextStyle(
                                color: AppColors.textGray,
                                fontFamily: 'Poppins',
                              ),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        color: AppColors.primary,
                        backgroundColor: Colors.black,
                        onRefresh: _load,
                        child: ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
                          itemCount: _filtered.length,
                          itemBuilder: (_, i) =>
                              LiveMatchCard(item: _filtered[i]),
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
