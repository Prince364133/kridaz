import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../core/constants/app_colors.dart';
import '../providers/user_provider.dart';
import '../services/player_profile_service.dart';
import '../widgets/profile/profile_hero.dart';
import '../widgets/profile/profile_pieces.dart';
import '../widgets/profile/profile_quick_stats_strip.dart';

/// Self-view of the player profile. Layout follows
/// docs/superpowers/specs/2026-06-10-player-profile-backend.md
/// — hero, quick stats strip, then a 5-tab scaffold. Sections that
/// depend on backend phases not yet shipped render graceful empty
/// states so the screen never looks broken.
class MyProfileScreen extends ConsumerStatefulWidget {
  const MyProfileScreen({super.key});

  @override
  ConsumerState<MyProfileScreen> createState() => _MyProfileScreenState();
}

class _MyProfileScreenState extends ConsumerState<MyProfileScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 5, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(userProfileProvider);
    return Scaffold(
      backgroundColor: Colors.black,
      body: async.when(
        loading: () => const _ProfileSkeleton(),
        error: (e, _) => _ProfileError(
            message: e.toString(),
            onRetry: () {
              ref.read(userProfileNotifierProvider.notifier).refresh();
            }),
        data: (user) => RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async {
            ref.read(userProfileNotifierProvider.notifier).refresh();
          },
          child: _buildBody(user ?? const {}),
        ),
      ),
    );
  }

  Future<void> _pickAndUploadCover() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 2000,
    );
    if (picked == null || !mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    messenger.showSnackBar(const SnackBar(
      backgroundColor: AppColors.surfaceL2,
      content: Text('Uploading cover…', style: TextStyle(color: Colors.white)),
      behavior: SnackBarBehavior.floating,
      duration: Duration(seconds: 2),
    ));
    final service = PlayerProfileService();
    final url = await service.uploadCover(picked.path);
    if (!mounted) return;
    if (url != null && url.isNotEmpty) {
      ref.read(userProfileNotifierProvider.notifier).refresh();
      messenger.showSnackBar(const SnackBar(
        backgroundColor: AppColors.surfaceL2,
        content: Text('Cover updated', style: TextStyle(color: Colors.white)),
        behavior: SnackBarBehavior.floating,
      ));
    } else {
      messenger.showSnackBar(const SnackBar(
        backgroundColor: AppColors.surfaceL2,
        content: Text("Couldn't upload — try a smaller image.",
            style: TextStyle(color: Colors.white)),
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  void _showQrSheet(Map<String, dynamic> user) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _QrSheet(user: user),
    );
  }

  Widget _buildBody(Map<String, dynamic> user) {
    return NestedScrollView(
      physics: const BouncingScrollPhysics(),
      headerSliverBuilder: (_, __) => [
        SliverToBoxAdapter(
          child: ProfileHero(
            user: user,
            mode: ProfileHeroMode.self,
            onQr: () => _showQrSheet(user),
            onChangeCover: _pickAndUploadCover,
          ),
        ),
        SliverToBoxAdapter(child: ProfileQuickStatsStrip(user: user)),
        SliverPersistentHeader(
          pinned: true,
          delegate: _StickyTabBar(controller: _tabs),
        ),
      ],
      body: TabBarView(
        controller: _tabs,
        children: [
          _OverviewTab(user: user),
          _StatsTab(user: user),
          _TeamsTab(user: user),
          _ActivityTab(user: user),
          _ReviewsTab(user: user),
        ],
      ),
    );
  }
}

// ─── Sticky tabs ────────────────────────────────────────────────────────────

class _StickyTabBar extends SliverPersistentHeaderDelegate {
  final TabController controller;
  _StickyTabBar({required this.controller});

  @override
  double get minExtent => 48;
  @override
  double get maxExtent => 48;

  @override
  Widget build(BuildContext context, double shrink, bool overlap) {
    return Container(
      color: Colors.black,
      child: TabBar(
        controller: controller,
        isScrollable: true,
        tabAlignment: TabAlignment.start,
        indicatorColor: AppColors.primary,
        indicatorWeight: 2.5,
        labelColor: Colors.white,
        unselectedLabelColor: Colors.white54,
        labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
        unselectedLabelStyle:
            const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
        labelPadding: const EdgeInsets.symmetric(horizontal: 16),
        tabs: const [
          Tab(text: 'Overview'),
          Tab(text: 'Stats'),
          Tab(text: 'Teams'),
          Tab(text: 'Activity'),
          Tab(text: 'Reviews'),
        ],
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _StickyTabBar oldDelegate) =>
      controller != oldDelegate.controller;
}

// ─── Tabs (skeletons for now; filled by later phases) ───────────────────────

class _OverviewTab extends StatelessWidget {
  final Map<String, dynamic> user;
  const _OverviewTab({required this.user});

  @override
  Widget build(BuildContext context) {
    final interests =
        (user['sportTypes'] ?? user['sports'] ?? user['interests']) as List?;
    return ListView(
      padding: const EdgeInsets.all(16),
      physics: const BouncingScrollPhysics(),
      children: [
        if (interests != null && interests.isNotEmpty)
          ProfileSectionCard(
            title: 'Sports you play',
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: interests
                  .map((s) => ProfileChip(label: s.toString()))
                  .toList(),
            ),
          ),
        ProfileSectionCard(
          title: 'Profile completion',
          child: _CompletionBar(user: user),
        ),
        const ProfileSectionCard(
          title: 'Recent matches',
          child: ProfileEmptyHint(
            icon: LucideIcons.calendar,
            message: 'Play your first match to see it here.',
          ),
        ),
        ProfileSectionCard(
          title: 'Achievements',
          child: _AchievementsGrid(user: user),
        ),
        ProfileSectionCard(
          title: 'Media',
          child: _MediaSection(user: user, isSelf: true),
        ),
      ],
    );
  }
}

class _AchievementsGrid extends StatefulWidget {
  final Map<String, dynamic> user;
  const _AchievementsGrid({required this.user});

  @override
  State<_AchievementsGrid> createState() => _AchievementsGridState();
}

class _AchievementsGridState extends State<_AchievementsGrid> {
  final _service = PlayerProfileService();
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    final id = (widget.user['_id'] ?? widget.user['id'] ?? widget.user['uid'])
        ?.toString();
    _future = id == null || id.isEmpty
        ? Future.value(const [])
        : _service.getAchievements(id);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const SizedBox(
            height: 60,
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
        final items = snap.data ?? const [];
        if (items.isEmpty) {
          return const ProfileEmptyHint(
            icon: LucideIcons.award,
            message: 'Trophies and milestones unlock as you play.',
          );
        }
        return Wrap(
          spacing: 10,
          runSpacing: 10,
          children: items.map((a) => _AchievementBadge(item: a)).toList(),
        );
      },
    );
  }
}

class _AchievementBadge extends StatelessWidget {
  final Map<String, dynamic> item;
  const _AchievementBadge({required this.item});

  Color _tierColor(String tier) {
    switch (tier.toLowerCase()) {
      case 'bronze':
        return const Color(0xFFCD7F32);
      case 'silver':
        return const Color(0xFFC0C0C0);
      case 'gold':
        return const Color(0xFFFFD700);
      case 'trophy':
        return const Color(0xFFE91E63);
      default:
        return AppColors.primary;
    }
  }

  IconData _tierIcon(String tier) {
    switch (tier.toLowerCase()) {
      case 'trophy':
        return LucideIcons.trophy;
      case 'gold':
        return LucideIcons.medal;
      default:
        return LucideIcons.award;
    }
  }

  @override
  Widget build(BuildContext context) {
    final ach = (item['achievement'] as Map?)?.cast<String, dynamic>() ?? item;
    final title = (ach['title'] ?? ach['name'] ?? ach['code'] ?? '').toString();
    final tier = (ach['tier'] ?? '').toString();
    final color = _tierColor(tier);

    return Container(
      width: 96,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surfaceL2,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Column(
        children: [
          Icon(_tierIcon(tier), color: color, size: 22),
          const SizedBox(height: 8),
          Text(
            title.isNotEmpty ? title : 'Achievement',
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.w700,
                height: 1.2),
          ),
        ],
      ),
    );
  }
}

class _StatsTab extends StatefulWidget {
  final Map<String, dynamic> user;
  const _StatsTab({required this.user});

  @override
  State<_StatsTab> createState() => _StatsTabState();
}

class _StatsTabState extends State<_StatsTab> {
  final _service = PlayerProfileService();
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() {
    final id = (widget.user['_id'] ?? widget.user['id'] ?? widget.user['uid'])
        ?.toString();
    if (id == null || id.isEmpty) {
      return Future.value(const {'stats': []});
    }
    return _service.getStats(id);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: CircularProgressIndicator(color: AppColors.primary),
            ),
          );
        }
        final data = snap.data ?? const {};
        if (data['gated'] == true) {
          return ListView(
            padding: const EdgeInsets.all(16),
            physics: const BouncingScrollPhysics(),
            children: const [
              ProfileEmptyHint(
                icon: LucideIcons.lock,
                message:
                    'Stats are private. The player has hidden their breakdown.',
                tall: true,
              ),
            ],
          );
        }
        final rows = ((data['stats'] as List?) ?? const [])
            .whereType<Map>()
            .map(Map<String, dynamic>.from)
            .toList();
        if (rows.isEmpty) {
          return ListView(
            padding: const EdgeInsets.all(16),
            physics: const BouncingScrollPhysics(),
            children: const [
              ProfileEmptyHint(
                icon: LucideIcons.barChart3,
                message:
                    'Sport-by-sport breakdown — runs, wickets, goals, assists — will appear here once your matches sync.',
                tall: true,
              ),
            ],
          );
        }
        return _StatsPanel(rows: rows);
      },
    );
  }
}

/// One row per sport in `rows`. If multi-sport, a horizontal chip
/// switcher renders at the top; otherwise the single sport's panel is
/// rendered directly.
class _StatsPanel extends StatefulWidget {
  final List<Map<String, dynamic>> rows;
  const _StatsPanel({required this.rows});

  @override
  State<_StatsPanel> createState() => _StatsPanelState();
}

class _StatsPanelState extends State<_StatsPanel> {
  int _selected = 0;

  @override
  Widget build(BuildContext context) {
    final row = widget.rows[_selected];
    final sport = (row['sport'] ?? '').toString();
    return ListView(
      padding: const EdgeInsets.all(16),
      physics: const BouncingScrollPhysics(),
      children: [
        if (widget.rows.length > 1)
          SizedBox(
            height: 36,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: widget.rows.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final r = widget.rows[i];
                final s = (r['sport'] ?? '').toString();
                final selected = i == _selected;
                return GestureDetector(
                  onTap: () => setState(() => _selected = i),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: selected ? AppColors.primary : AppColors.surfaceL2,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                          color: Colors.white.withValues(alpha: 0.06)),
                    ),
                    child: Text(
                      s,
                      style: TextStyle(
                        color: selected ? Colors.black : Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        if (widget.rows.length > 1) const SizedBox(height: 14),
        ProfileSectionCard(
          title: '$sport · Career',
          child: _StatsGrid(row: row),
        ),
        if (_hasCricket(row))
          ProfileSectionCard(
            title: 'Batting & bowling',
            child: _CricketBreakdown(row: row),
          ),
        if (_hasFootball(row))
          ProfileSectionCard(
            title: 'Goals & assists',
            child: _FootballBreakdown(row: row),
          ),
      ],
    );
  }

  bool _hasCricket(Map<String, dynamic> r) =>
      r['runsScored'] != null ||
      r['wicketsTaken'] != null ||
      r['ballsFaced'] != null;

  bool _hasFootball(Map<String, dynamic> r) =>
      r['goalsScored'] != null ||
      r['assistsCount'] != null ||
      r['cleanSheets'] != null;
}

int _intOf(dynamic v) {
  if (v == null) return 0;
  if (v is num) return v.toInt();
  return int.tryParse('$v') ?? 0;
}

double _doubleOf(dynamic v) {
  if (v == null) return 0;
  if (v is num) return v.toDouble();
  return double.tryParse('$v') ?? 0;
}

class _StatsGrid extends StatelessWidget {
  final Map<String, dynamic> row;
  const _StatsGrid({required this.row});

  @override
  Widget build(BuildContext context) {
    final played = _intOf(row['matchesPlayed']);
    final won = _intOf(row['matchesWon']);
    final lost = _intOf(row['matchesLost']);
    final drawn = _intOf(row['matchesDrawn']);
    final streak = _intOf(row['currentStreak']);
    final longest = _intOf(row['longestStreak']);
    final rating = _intOf(row['playerRating']);
    final hours = _doubleOf(row['hoursPlayed']);
    final mvp = _intOf(row['mvpCount']);
    final motm = _intOf(row['motmCount']);
    final winPct = played > 0 ? (won * 100 / played).round() : 0;

    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        _StatCell(label: 'Matches', value: '$played'),
        _StatCell(label: 'Wins', value: '$won'),
        _StatCell(label: 'Losses', value: '$lost'),
        if (drawn > 0) _StatCell(label: 'Draws', value: '$drawn'),
        _StatCell(label: 'Win %', value: played > 0 ? '$winPct%' : '—'),
        _StatCell(label: 'Rating', value: rating > 0 ? '$rating' : '—'),
        _StatCell(
          label: 'Streak',
          value: streak == 0 ? '—' : (streak > 0 ? 'W$streak' : 'L${-streak}'),
          accent: streak > 0
              ? AppColors.primary
              : (streak < 0 ? AppColors.errorRed : null),
        ),
        if (longest != 0)
          _StatCell(
              label: 'Longest',
              value: longest > 0 ? 'W$longest' : 'L${-longest}'),
        if (hours > 0)
          _StatCell(label: 'Hours', value: hours.toStringAsFixed(0)),
        if (mvp > 0) _StatCell(label: 'MVP', value: '$mvp'),
        if (motm > 0) _StatCell(label: 'MOTM', value: '$motm'),
      ],
    );
  }
}

class _StatCell extends StatelessWidget {
  final String label;
  final String value;
  final Color? accent;
  const _StatCell({required this.label, required this.value, this.accent});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 96,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surfaceL2,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: TextStyle(
                color: accent ?? Colors.white,
                fontSize: 17,
                fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
                color: Colors.white.withValues(alpha: 0.55),
                fontSize: 10,
                fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}

class _CricketBreakdown extends StatelessWidget {
  final Map<String, dynamic> row;
  const _CricketBreakdown({required this.row});

  @override
  Widget build(BuildContext context) {
    final runs = _intOf(row['runsScored']);
    final balls = _intOf(row['ballsFaced']);
    final fours = _intOf(row['fours']);
    final sixes = _intOf(row['sixes']);
    final wickets = _intOf(row['wicketsTaken']);
    final overs = _doubleOf(row['oversBowled']);
    final runsConceded = _intOf(row['runsConceded']);
    final sr = balls > 0 ? (runs * 100 / balls).toStringAsFixed(1) : '—';
    final econ = overs > 0 ? (runsConceded / overs).toStringAsFixed(2) : '—';

    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        _StatCell(label: 'Runs', value: '$runs'),
        _StatCell(label: 'Strike rate', value: sr),
        if (fours > 0) _StatCell(label: 'Fours', value: '$fours'),
        if (sixes > 0) _StatCell(label: 'Sixes', value: '$sixes'),
        _StatCell(label: 'Wickets', value: '$wickets'),
        if (overs > 0)
          _StatCell(label: 'Overs', value: overs.toStringAsFixed(1)),
        if (overs > 0) _StatCell(label: 'Econ', value: econ),
      ],
    );
  }
}

class _FootballBreakdown extends StatelessWidget {
  final Map<String, dynamic> row;
  const _FootballBreakdown({required this.row});

  @override
  Widget build(BuildContext context) {
    final goals = _intOf(row['goalsScored']);
    final assists = _intOf(row['assistsCount']);
    final clean = _intOf(row['cleanSheets']);
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        _StatCell(label: 'Goals', value: '$goals'),
        _StatCell(label: 'Assists', value: '$assists'),
        if (clean > 0) _StatCell(label: 'Clean sheets', value: '$clean'),
      ],
    );
  }
}

class _TeamsTab extends StatelessWidget {
  final Map<String, dynamic> user;
  const _TeamsTab({required this.user});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      physics: const BouncingScrollPhysics(),
      children: [
        ProfileEmptyHint(
          icon: LucideIcons.users,
          message: 'You haven\'t joined a team yet.',
          actionLabel: 'Find or create a team',
          onAction: () => context.go('/teams'),
          tall: true,
        ),
      ],
    );
  }
}

class _ActivityTab extends StatefulWidget {
  final Map<String, dynamic> user;
  const _ActivityTab({required this.user});

  @override
  State<_ActivityTab> createState() => _ActivityTabState();
}

class _ActivityTabState extends State<_ActivityTab> {
  final _service = PlayerProfileService();
  String _window = '30d';
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() {
    final id = (widget.user['_id'] ?? widget.user['id'] ?? widget.user['uid'])
        ?.toString();
    if (id == null || id.isEmpty) return Future.value(const {});
    return _service.getActivity(id, window: _window);
  }

  void _setWindow(String w) {
    setState(() {
      _window = w;
      _future = _load();
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: CircularProgressIndicator(color: AppColors.primary),
            ),
          );
        }
        final data = snap.data ?? const {};
        final perDay = ((data['perDay'] as List?) ?? const [])
            .whereType<Map>()
            .map(Map<String, dynamic>.from)
            .toList();
        final histogram = ((data['weekdayHistogram'] as List?) ?? const [])
            .map((v) => _intOf(v))
            .toList();
        final mostActiveDay = (data['mostActiveDay'] ?? '').toString();
        final peakHour = data['peakHour'];

        final totalCount =
            perDay.fold<int>(0, (sum, d) => sum + _intOf(d['count']));

        if (totalCount == 0 && histogram.every((c) => c == 0)) {
          return ListView(
            padding: const EdgeInsets.all(16),
            physics: const BouncingScrollPhysics(),
            children: [
              _windowSwitcher(),
              const SizedBox(height: 12),
              const ProfileEmptyHint(
                icon: LucideIcons.activity,
                message:
                    'Your weekly heatmap and most-active times will populate as you play.',
                tall: true,
              ),
            ],
          );
        }

        return ListView(
          padding: const EdgeInsets.all(16),
          physics: const BouncingScrollPhysics(),
          children: [
            _windowSwitcher(),
            const SizedBox(height: 14),
            ProfileSectionCard(
              title: 'When you play',
              child: _PeakRow(
                  mostActiveDay: mostActiveDay,
                  peakHour: peakHour,
                  totalCount: totalCount),
            ),
            if (histogram.length == 7)
              ProfileSectionCard(
                title: 'By weekday',
                child: _WeekdayHistogram(counts: histogram),
              ),
            if (perDay.isNotEmpty)
              ProfileSectionCard(
                title: 'Last ${_window.replaceAll('d', '')} days',
                child: _DailyHeatStrip(perDay: perDay),
              ),
          ],
        );
      },
    );
  }

  Widget _windowSwitcher() {
    return Row(
      children: [
        for (final w in const ['30d', '90d', '365d']) ...[
          GestureDetector(
            onTap: () => _setWindow(w),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              decoration: BoxDecoration(
                color: _window == w ? AppColors.primary : AppColors.surfaceL2,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                w == '30d'
                    ? '30 days'
                    : w == '90d'
                        ? '90 days'
                        : '1 year',
                style: TextStyle(
                    color: _window == w ? Colors.black : Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w700),
              ),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ],
    );
  }
}

class _PeakRow extends StatelessWidget {
  final String mostActiveDay;
  final dynamic peakHour;
  final int totalCount;
  const _PeakRow(
      {required this.mostActiveDay,
      required this.peakHour,
      required this.totalCount});

  String _formatHour(dynamic h) {
    final v = _intOf(h);
    if (v < 0 || v > 23) return '—';
    final hour12 = v % 12 == 0 ? 12 : v % 12;
    final ampm = v < 12 ? 'am' : 'pm';
    return '$hour12 $ampm';
  }

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        _StatCell(
            label: 'Matches', value: totalCount > 0 ? '$totalCount' : '—'),
        _StatCell(
          label: 'Top day',
          value: mostActiveDay.isNotEmpty ? mostActiveDay : '—',
        ),
        _StatCell(label: 'Peak hour', value: _formatHour(peakHour)),
      ],
    );
  }
}

class _WeekdayHistogram extends StatelessWidget {
  final List<int> counts;
  const _WeekdayHistogram({required this.counts});

  static const _labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  @override
  Widget build(BuildContext context) {
    final max = counts.fold<int>(0, (m, c) => c > m ? c : m);
    return SizedBox(
      height: 110,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          for (var i = 0; i < counts.length; i++) ...[
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    counts[i] > 0 ? '${counts[i]}' : '',
                    style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.6),
                        fontSize: 10,
                        fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    height: max == 0 ? 4 : 6 + (counts[i] / max) * 70,
                    decoration: BoxDecoration(
                      color: counts[i] > 0
                          ? AppColors.primary
                          : AppColors.surfaceL3,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _labels[i],
                    style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.5),
                        fontSize: 10),
                  ),
                ],
              ),
            ),
            if (i != counts.length - 1) const SizedBox(width: 6),
          ],
        ],
      ),
    );
  }
}

class _DailyHeatStrip extends StatelessWidget {
  final List<Map<String, dynamic>> perDay;
  const _DailyHeatStrip({required this.perDay});

  @override
  Widget build(BuildContext context) {
    final max = perDay.fold<int>(0, (m, d) {
      final v = _intOf(d['count']);
      return v > m ? v : m;
    });
    return Wrap(
      spacing: 4,
      runSpacing: 4,
      children: [
        for (final d in perDay) _heatDot(_intOf(d['count']), max),
      ],
    );
  }

  Widget _heatDot(int count, int max) {
    final ratio = max == 0 ? 0.0 : count / max;
    final alpha = count == 0 ? 0.06 : (0.2 + ratio * 0.8).clamp(0.2, 1.0);
    return Container(
      width: 14,
      height: 14,
      decoration: BoxDecoration(
        color: count == 0
            ? Colors.white.withValues(alpha: 0.06)
            : AppColors.primary.withValues(alpha: alpha),
        borderRadius: BorderRadius.circular(3),
      ),
    );
  }
}

class _ReviewsTab extends StatefulWidget {
  final Map<String, dynamic> user;
  const _ReviewsTab({required this.user});

  @override
  State<_ReviewsTab> createState() => _ReviewsTabState();
}

class _ReviewsTabState extends State<_ReviewsTab> {
  final _service = PlayerProfileService();
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() {
    final id = (widget.user['_id'] ?? widget.user['id'] ?? widget.user['uid'])
        ?.toString();
    if (id == null || id.isEmpty) return Future.value(const {});
    return _service.getReviews(id);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: CircularProgressIndicator(color: AppColors.primary),
            ),
          );
        }
        final data = snap.data ?? const {};
        final reviews = ((data['reviews'] as List?) ?? const [])
            .whereType<Map>()
            .map(Map<String, dynamic>.from)
            .toList();
        final aggregate =
            (data['aggregate'] as Map?)?.cast<String, dynamic>() ??
                const <String, dynamic>{};

        if (reviews.isEmpty &&
            _doubleOf(aggregate['averageSportsmanship']) == 0 &&
            _doubleOf(aggregate['averageSkill']) == 0) {
          return ListView(
            padding: const EdgeInsets.all(16),
            physics: const BouncingScrollPhysics(),
            children: const [
              ProfileEmptyHint(
                icon: LucideIcons.star,
                message:
                    'Teammates can rate your sportsmanship, punctuality, and skill after each match.',
                tall: true,
              ),
            ],
          );
        }

        return ListView(
          padding: const EdgeInsets.all(16),
          physics: const BouncingScrollPhysics(),
          children: [
            ProfileSectionCard(
              title: 'Player rating',
              child: _ReviewAggregate(agg: aggregate),
            ),
            for (final r in reviews) _ReviewCard(review: r),
          ],
        );
      },
    );
  }
}

class _ReviewAggregate extends StatelessWidget {
  final Map<String, dynamic> agg;
  const _ReviewAggregate({required this.agg});

  @override
  Widget build(BuildContext context) {
    final sports = _doubleOf(agg['averageSportsmanship']);
    final punct = _doubleOf(agg['averagePunctuality']);
    final skill = _doubleOf(agg['averageSkill']);
    final tags = ((agg['topTags'] as List?) ?? const [])
        .whereType<Map>()
        .map(Map<String, dynamic>.from)
        .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(child: _RatingBar(label: 'Sportsmanship', value: sports)),
            const SizedBox(width: 8),
            Expanded(child: _RatingBar(label: 'Punctuality', value: punct)),
            const SizedBox(width: 8),
            Expanded(child: _RatingBar(label: 'Skill', value: skill)),
          ],
        ),
        if (tags.isNotEmpty) ...[
          const SizedBox(height: 14),
          Text(
            'Most-used tags',
            style: TextStyle(
                color: Colors.white.withValues(alpha: 0.55),
                fontSize: 10,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.3),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final t in tags)
                ProfileChip(
                  label: '${t['tag'] ?? t['name'] ?? ''} · ${t['count'] ?? 0}',
                ),
            ],
          ),
        ],
      ],
    );
  }
}

class _RatingBar extends StatelessWidget {
  final String label;
  final double value;
  const _RatingBar({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final v = value.clamp(0.0, 5.0);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          v > 0 ? v.toStringAsFixed(1) : '—',
          style: const TextStyle(
              color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: v / 5,
            minHeight: 4,
            backgroundColor: Colors.white.withValues(alpha: 0.08),
            valueColor: const AlwaysStoppedAnimation(AppColors.primary),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
              color: Colors.white.withValues(alpha: 0.55),
              fontSize: 10,
              fontWeight: FontWeight.w500),
        ),
      ],
    );
  }
}

class _ReviewCard extends StatelessWidget {
  final Map<String, dynamic> review;
  const _ReviewCard({required this.review});

  @override
  Widget build(BuildContext context) {
    final reviewer = (review['reviewer'] as Map?)?.cast<String, dynamic>() ??
        const <String, dynamic>{};
    final name =
        (reviewer['name'] ?? reviewer['username'] ?? 'Anonymous').toString();
    final photo =
        (reviewer['photoURL'] ?? reviewer['profilePicture'])?.toString();
    final note = (review['note'] ?? '').toString();
    final tags = ((review['tags'] as List?) ?? const [])
        .map((t) => t.toString())
        .toList();
    final sports = _doubleOf(review['sportsmanship']);
    final punct = _doubleOf(review['punctuality']);
    final skill = _doubleOf(review['skill']);
    final overall = (sports + punct + skill) / 3;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceL1,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AppColors.surfaceL3,
                backgroundImage: photo != null && photo.isNotEmpty
                    ? NetworkImage(photo)
                    : null,
                child: photo == null || photo.isEmpty
                    ? const Icon(LucideIcons.user,
                        size: 16, color: Colors.white54)
                    : null,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w700)),
                    Row(
                      children: [
                        const Icon(LucideIcons.star,
                            size: 12, color: AppColors.primary),
                        const SizedBox(width: 4),
                        Text(
                          overall.toStringAsFixed(1),
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'S ${sports.toStringAsFixed(1)} · P ${punct.toStringAsFixed(1)} · Sk ${skill.toStringAsFixed(1)}',
                          style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.5),
                              fontSize: 10),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (note.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              note,
              style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.8),
                  fontSize: 12,
                  height: 1.4),
            ),
          ],
          if (tags.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: tags.map((t) => ProfileChip(label: t)).toList(),
            ),
          ],
        ],
      ),
    );
  }
}

// ─── Completion bar (specific to self-view) ─────────────────────────────────

class _CompletionBar extends StatelessWidget {
  final Map<String, dynamic> user;
  const _CompletionBar({required this.user});

  double get _ratio {
    final checks = [
      (user['firstName'] ?? user['name'])?.toString().isNotEmpty == true,
      (user['dateOfBirth'] ?? user['dob'])?.toString().isNotEmpty == true,
      (user['location'] ?? user['city'])?.toString().isNotEmpty == true,
      user['gender'] != null && '${user['gender']}'.isNotEmpty,
      ((user['sportTypes'] ?? user['sports'] ?? user['interests']) as List?)
              ?.isNotEmpty ==
          true,
      (user['bio'] as String?)?.isNotEmpty == true,
      (user['profilePhoto'] ?? user['photoURL']) != null,
    ];
    final filled = checks.where((c) => c).length;
    return filled / checks.length;
  }

  @override
  Widget build(BuildContext context) {
    final pct = (_ratio * 100).round();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: LinearProgressIndicator(
                  value: _ratio,
                  minHeight: 8,
                  backgroundColor: Colors.white.withValues(alpha: 0.08),
                  valueColor: const AlwaysStoppedAnimation(AppColors.primary),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Text(
              '$pct%',
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w700),
            ),
          ],
        ),
        if (_ratio < 1.0) ...[
          const SizedBox(height: 8),
          Text(
            'Add a bio and photo so other players can find and trust you.',
            style: TextStyle(
                color: Colors.white.withValues(alpha: 0.55), fontSize: 11),
          ),
        ],
      ],
    );
  }
}

// ─── Media gallery (Overview tab) ───────────────────────────────────────────

class _MediaSection extends StatefulWidget {
  final Map<String, dynamic> user;
  final bool isSelf;
  const _MediaSection({required this.user, required this.isSelf});

  @override
  State<_MediaSection> createState() => _MediaSectionState();
}

class _MediaSectionState extends State<_MediaSection> {
  final _service = PlayerProfileService();
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Map<String, dynamic>>> _load() {
    final id = (widget.user['_id'] ?? widget.user['id'] ?? widget.user['uid'])
        ?.toString();
    if (id == null || id.isEmpty) return Future.value(const []);
    return _service.getMedia(id);
  }

  Future<void> _pickAndUpload() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 2000,
    );
    if (picked == null || !mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    messenger.showSnackBar(const SnackBar(
      backgroundColor: AppColors.surfaceL2,
      content: Text('Uploading photo…', style: TextStyle(color: Colors.white)),
      behavior: SnackBarBehavior.floating,
      duration: Duration(seconds: 2),
    ));
    final uploaded = await _service.uploadMedia(picked.path);
    if (!mounted) return;
    if (uploaded != null) {
      setState(() => _future = _load());
      messenger.showSnackBar(const SnackBar(
        backgroundColor: AppColors.surfaceL2,
        content: Text('Photo added', style: TextStyle(color: Colors.white)),
        behavior: SnackBarBehavior.floating,
      ));
    } else {
      messenger.showSnackBar(const SnackBar(
        backgroundColor: AppColors.surfaceL2,
        content: Text("Couldn't upload — try a smaller image.",
            style: TextStyle(color: Colors.white)),
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const SizedBox(
            height: 80,
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
        final all = snap.data ?? const [];
        // Pinned first, then by createdAt desc (best-effort).
        final items = [...all]..sort((a, b) {
            final ap = a['isPinned'] == true ? 1 : 0;
            final bp = b['isPinned'] == true ? 1 : 0;
            return bp - ap;
          });
        if (items.isEmpty) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ProfileEmptyHint(
                icon: LucideIcons.image,
                message: widget.isSelf
                    ? 'Add photos from matches and training to make your profile pop.'
                    : 'No photos yet.',
                actionLabel: widget.isSelf ? 'Upload a photo' : null,
                onAction: widget.isSelf ? _pickAndUpload : null,
              ),
            ],
          );
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SizedBox(
              height: 110,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: items.length + (widget.isSelf ? 1 : 0),
                separatorBuilder: (_, __) => const SizedBox(width: 10),
                itemBuilder: (_, i) {
                  if (widget.isSelf && i == items.length) {
                    return _uploadTile();
                  }
                  return _photoTile(items[i]);
                },
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _photoTile(Map<String, dynamic> m) {
    final url = (m['url'] ?? m['secureUrl'] ?? m['photoUrl'])?.toString();
    final pinned = m['isPinned'] == true;
    return Stack(
      children: [
        Container(
          width: 110,
          height: 110,
          decoration: BoxDecoration(
            color: AppColors.surfaceL2,
            borderRadius: BorderRadius.circular(12),
          ),
          clipBehavior: Clip.antiAlias,
          child: url != null && url.isNotEmpty
              ? Image.network(url, fit: BoxFit.cover)
              : const Icon(LucideIcons.image, color: Colors.white24, size: 32),
        ),
        if (pinned)
          Positioned(
            top: 6,
            right: 6,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(LucideIcons.pin, color: AppColors.primary, size: 10),
                  SizedBox(width: 3),
                  Text('Pinned',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w700)),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _uploadTile() {
    return GestureDetector(
      onTap: _pickAndUpload,
      child: Container(
        width: 110,
        height: 110,
        decoration: BoxDecoration(
          color: AppColors.surfaceL1,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AppColors.primary.withValues(alpha: 0.4),
            style: BorderStyle.solid,
          ),
        ),
        child: const Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.plus, color: AppColors.primary, size: 20),
            SizedBox(height: 6),
            Text('Add',
                style: TextStyle(
                    color: AppColors.primary,
                    fontSize: 11,
                    fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}

// ─── QR sheet ───────────────────────────────────────────────────────────────

class _QrSheet extends StatefulWidget {
  final Map<String, dynamic> user;
  const _QrSheet({required this.user});

  @override
  State<_QrSheet> createState() => _QrSheetState();
}

class _QrSheetState extends State<_QrSheet> {
  final _service = PlayerProfileService();
  late Future<List<int>?> _future;

  @override
  void initState() {
    super.initState();
    _future = _service.getMyQr(format: 'png').then((r) => r?.data);
  }

  String get _handle {
    final u =
        (widget.user['username'] ?? widget.user['id'] ?? widget.user['_id'])
            ?.toString();
    return u != null && u.isNotEmpty ? '@$u' : 'Scan to add';
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.65,
      minChildSize: 0.5,
      maxChildSize: 0.9,
      builder: (_, controller) => Container(
        decoration: const BoxDecoration(
          color: Colors.black,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: SingleChildScrollView(
          controller: controller,
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 18),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Text(_handle,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(
                  'Show this code so others can follow you instantly',
                  style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.55),
                      fontSize: 11),
                ),
                const SizedBox(height: 20),
                FutureBuilder<List<int>?>(
                  future: _future,
                  builder: (_, snap) {
                    if (snap.connectionState != ConnectionState.done) {
                      return const SizedBox(
                        width: 256,
                        height: 256,
                        child: Center(
                          child: CircularProgressIndicator(
                              color: AppColors.primary),
                        ),
                      );
                    }
                    final bytes = snap.data;
                    if (bytes == null || bytes.isEmpty) {
                      return Container(
                        width: 256,
                        height: 256,
                        decoration: BoxDecoration(
                          color: AppColors.surfaceL2,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Center(
                          child: Text(
                            "Couldn't load QR\nTry again later",
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.white54),
                          ),
                        ),
                      );
                    }
                    return Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Image.memory(
                        Uint8List.fromList(bytes),
                        width: 232,
                        height: 232,
                        gaplessPlayback: true,
                      ),
                    );
                  },
                ),
                const SizedBox(height: 20),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceL2,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(LucideIcons.qrCode,
                          color: AppColors.primary, size: 14),
                      SizedBox(width: 6),
                      Text(
                        'Open camera and point at the code',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Loading / error placeholders ───────────────────────────────────────────

class _ProfileSkeleton extends StatelessWidget {
  const _ProfileSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
            height: 180,
            decoration: BoxDecoration(
                color: AppColors.surfaceL2,
                borderRadius: BorderRadius.circular(14))),
        const SizedBox(height: 60),
        Container(
            height: 22,
            width: 160,
            decoration: BoxDecoration(
                color: AppColors.surfaceL2,
                borderRadius: BorderRadius.circular(6))),
        const SizedBox(height: 8),
        Container(
            height: 12,
            width: 100,
            decoration: BoxDecoration(
                color: AppColors.surfaceL2,
                borderRadius: BorderRadius.circular(6))),
        const SizedBox(height: 24),
        SizedBox(
          height: 76,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: 6,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (_, __) => Container(
              width: 96,
              decoration: BoxDecoration(
                  color: AppColors.surfaceL2,
                  borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
      ],
    );
  }
}

class _ProfileError extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ProfileError({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(LucideIcons.alertCircle,
                color: AppColors.errorRed, size: 32),
            const SizedBox(height: 10),
            const Text(
              'Couldn\'t load your profile',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.5), fontSize: 12),
            ),
            const SizedBox(height: 16),
            GestureDetector(
              onTap: onRetry,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                      colors: [AppColors.gradientStart, AppColors.gradientEnd]),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'Retry',
                  style: TextStyle(
                      color: Colors.black,
                      fontSize: 13,
                      fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
