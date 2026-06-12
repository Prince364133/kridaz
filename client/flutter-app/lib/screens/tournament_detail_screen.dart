import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../widgets/common/bms_toast.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';

class TournamentDetailScreen extends StatefulWidget {
  final Map<String, dynamic> tournament;
  const TournamentDetailScreen({Key? key, required this.tournament})
      : super(key: key);

  @override
  State<TournamentDetailScreen> createState() => _TournamentDetailScreenState();
}

class _TournamentDetailScreenState extends State<TournamentDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  static const List<String> _teamStubs = [
    'Team Alpha',
    'FC Hyderabad',
    'Red Warriors',
    'City Strikers',
    'Bolt FC',
    'Thunder 11',
    'Eagles',
    'Rising Stars',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Color get _statusColor {
    switch (widget.tournament['status'] as String? ?? '') {
      case 'open':
        return AppColors.primary;
      case 'ongoing':
        return Colors.orange;
      default:
        return Colors.white38;
    }
  }

  String get _statusLabel {
    switch (widget.tournament['status'] as String? ?? '') {
      case 'open':
        return 'OPEN';
      case 'ongoing':
        return 'LIVE';
      default:
        return 'ENDED';
    }
  }

  bool get _isOpen => widget.tournament['status'] == 'open';

  @override
  Widget build(BuildContext context) {
    final t = widget.tournament;
    final joined = t['teamsJoined'] as int? ?? 0;
    final total = t['teamsTotal'] as int? ?? 1;

    return Scaffold(
      backgroundColor: Colors.black,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxScrolled) => [
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: Colors.black,
            leading: IconButton(
              icon: const Icon(LucideIcons.chevronLeft, color: Colors.white),
              onPressed: () => context.pop(),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Image.asset(
                    t['image'] as String? ?? '',
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) =>
                        Container(color: AppColors.backgroundDark),
                  ),
                  DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withValues(alpha: 0.3),
                          Colors.black.withValues(alpha: 0.85),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    left: 16,
                    right: 16,
                    bottom: 16,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: _statusColor,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                _statusLabel,
                                style: TextStyle(
                                  color: _isOpen ? Colors.black : Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  fontFamily: 'Poppins',
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: Colors.black54,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                t['format'] as String? ?? '',
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 10,
                                  fontFamily: 'Poppins',
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          t['name'] as String? ?? '',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Poppins',
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            bottom: TabBar(
              controller: _tabController,
              indicatorColor: AppColors.accentYellow,
              indicatorWeight: 2,
              labelColor: AppColors.accentYellow,
              unselectedLabelColor: Colors.white54,
              labelStyle: const TextStyle(
                fontFamily: 'Poppins',
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
              tabs: const [
                Tab(text: 'Overview'),
                Tab(text: 'Teams'),
                Tab(text: 'Bracket'),
              ],
            ),
          ),
        ],
        body: TabBarView(
          controller: _tabController,
          children: [
            _OverviewTab(tournament: t),
            _TeamsTab(teams: _teamStubs.take(joined).toList(), total: total),
            _BracketTab(status: t['status'] as String? ?? ''),
          ],
        ),
      ),
      bottomNavigationBar: _isOpen
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: ElevatedButton(
                  onPressed: () =>
                      BmsToast.info(context, 'Registration coming soon!'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accentYellow,
                    foregroundColor: Colors.black,
                    minimumSize: const Size.fromHeight(50),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  child: Text(
                    'Register Team  ·  ₹${t['entryFee']}',
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Poppins',
                      fontSize: 15,
                    ),
                  ),
                ),
              ),
            )
          : null,
    );
  }
}

// â”€â”€ Overview Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _OverviewTab extends StatelessWidget {
  final Map<String, dynamic> tournament;
  const _OverviewTab({required this.tournament});

  Widget _row(IconData icon, Color iconColor, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(icon, color: iconColor, size: 16),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 13,
                fontFamily: 'Poppins',
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = tournament;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Prize / Entry row
          Row(
            children: [
              Expanded(
                child: _InfoTile(
                  label: 'Prize Pool',
                  value: '₹${t['prizePool']}',
                  color: AppColors.accentYellow,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _InfoTile(
                  label: 'Entry Fee',
                  value: '₹${t['entryFee']}',
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _InfoTile(
                  label: 'Teams',
                  value: '${t['teamsJoined']}/${t['teamsTotal']}',
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Text(
            'Tournament Details',
            style: TextStyle(
              color: Colors.white,
              fontSize: 15,
              fontWeight: FontWeight.w700,
              fontFamily: 'Poppins',
            ),
          ),
          const SizedBox(height: 12),
          _row(Icons.sports, AppColors.primary, t['sport'] as String? ?? ''),
          _row(LucideIcons.trophy, AppColors.accentYellow,
              '${t['format']} format'),
          _row(LucideIcons.calendar, Colors.white54,
              '${t['startDate']}  –  ${t['endDate']}'),
          _row(LucideIcons.mapPin, AppColors.primary,
              t['location'] as String? ?? ''),
          _row(LucideIcons.user, Colors.white54,
              'Organized by ${t['organizer']}'),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final String label, value;
  final Color color;
  const _InfoTile(
      {required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
      decoration: BoxDecoration(
        color: AppColors.backgroundCard,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 14,
              fontWeight: FontWeight.w700,
              fontFamily: 'Poppins',
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textGray,
              fontSize: 10,
              fontFamily: 'Poppins',
            ),
          ),
        ],
      ),
    );
  }
}

// â”€â”€ Teams Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _TeamsTab extends StatelessWidget {
  final List<String> teams;
  final int total;
  const _TeamsTab({required this.teams, required this.total});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemCount: total,
      itemBuilder: (_, i) {
        final registered = i < teams.length;
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.backgroundCard,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: registered
                      ? AppColors.primary.withValues(alpha: 0.15)
                      : Colors.white.withValues(alpha: 0.05),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  registered ? LucideIcons.users : LucideIcons.plus,
                  color: registered ? AppColors.primary : Colors.white24,
                  size: 18,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  registered ? teams[i] : 'Slot ${i + 1} — Open',
                  style: TextStyle(
                    color: registered ? Colors.white : Colors.white38,
                    fontSize: 13,
                    fontWeight: registered ? FontWeight.w600 : FontWeight.w400,
                    fontFamily: 'Poppins',
                  ),
                ),
              ),
              if (registered)
                const Icon(LucideIcons.checkCircle,
                    color: AppColors.primary, size: 16),
            ],
          ),
        );
      },
    );
  }
}

// â”€â”€ Bracket Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _BracketTab extends StatelessWidget {
  final String status;
  const _BracketTab({required this.status});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              status == 'open'
                  ? LucideIcons.hourglass
                  : Icons.account_tree_outlined,
              color: Colors.white24,
              size: 56,
            ),
            const SizedBox(height: 16),
            Text(
              status == 'open'
                  ? 'Bracket will be generated\nonce registration closes.'
                  : 'Bracket coming soon.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.textGray,
                fontSize: 14,
                fontFamily: 'Poppins',
              ),
            ),
          ],
        ),
      ),
    );
  }
}
