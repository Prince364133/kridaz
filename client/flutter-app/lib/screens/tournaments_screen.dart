import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';

class TournamentsScreen extends StatefulWidget {
  const TournamentsScreen({Key? key}) : super(key: key);

  @override
  State<TournamentsScreen> createState() => _TournamentsScreenState();
}

class _TournamentsScreenState extends State<TournamentsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedSport = 'All';

  static const List<String> _sports = [
    'All',
    'Cricket',
    'Football',
    'Tennis',
    'Badminton'
  ];

  static const List<Map<String, dynamic>> _tournaments = [
    {
      'id': 't1',
      'name': 'City Cricket League 2026',
      'sport': 'Cricket',
      'format': 'League',
      'startDate': 'Jun 10, 2026',
      'endDate': 'Jun 30, 2026',
      'location': 'Malakpet, Hyderabad',
      'teamsJoined': 8,
      'teamsTotal': 12,
      'prizePool': '10,000',
      'entryFee': '500',
      'status': 'open',
      'image': 'assets/images/home/join_game_cricket.jpg',
      'organizer': 'BMS Sports Club',
    },
    {
      'id': 't2',
      'name': 'City Football Cup',
      'sport': 'Football',
      'format': 'Knockout',
      'startDate': 'Jun 15, 2026',
      'endDate': 'Jun 22, 2026',
      'location': 'Gachibowli, Hyderabad',
      'teamsJoined': 14,
      'teamsTotal': 16,
      'prizePool': '15,000',
      'entryFee': '800',
      'status': 'open',
      'image': 'assets/images/home/join_game_tennis.jpg',
      'organizer': 'FC Hyderabad',
    },
    {
      'id': 't3',
      'name': 'Badminton Open Singles',
      'sport': 'Badminton',
      'format': 'Round Robin',
      'startDate': 'May 28, 2026',
      'endDate': 'Jun 5, 2026',
      'location': 'Kondapur, Hyderabad',
      'teamsJoined': 16,
      'teamsTotal': 16,
      'prizePool': '5,000',
      'entryFee': '200',
      'status': 'ongoing',
      'image': 'assets/images/home/join_game_tennis.jpg',
      'organizer': 'Smash Club',
    },
    {
      'id': 't4',
      'name': 'Tennis Doubles Championship',
      'sport': 'Tennis',
      'format': 'Knockout',
      'startDate': 'Apr 20, 2026',
      'endDate': 'Apr 28, 2026',
      'location': 'Banjara Hills, Hyderabad',
      'teamsJoined': 8,
      'teamsTotal': 8,
      'prizePool': '8,000',
      'entryFee': '600',
      'status': 'completed',
      'image': 'assets/images/home/join_game_tennis.jpg',
      'organizer': 'Ace Tennis Academy',
    },
  ];

  List<Map<String, dynamic>> _filtered(String tab) {
    final sportFiltered = _selectedSport == 'All'
        ? _tournaments
        : _tournaments.where((t) => t['sport'] == _selectedSport).toList();

    if (tab == 'Open') {
      return sportFiltered.where((t) => t['status'] == 'open').toList();
    } else if (tab == 'Live') {
      return sportFiltered.where((t) => t['status'] == 'ongoing').toList();
    } else if (tab == 'Completed') {
      return sportFiltered.where((t) => t['status'] == 'completed').toList();
    }
    return sportFiltered;
  }

  static const List<String> _tabs = ['All', 'Open', 'Live', 'Completed'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

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
          'Tournaments',
          style: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.w700,
            fontFamily: 'Poppins',
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
          unselectedLabelStyle: const TextStyle(
            fontFamily: 'Poppins',
            fontWeight: FontWeight.w400,
            fontSize: 13,
          ),
          tabs: _tabs.map((t) => Tab(text: t)).toList(),
        ),
      ),
      body: Column(
        children: [
          // Sport filter chips
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
                          ? AppColors.accentYellow
                          : AppColors.backgroundCard,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color:
                            selected ? AppColors.accentYellow : Colors.white12,
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

          // Tab content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: _tabs.map((tab) {
                final list = _filtered(tab);
                return list.isEmpty
                    ? Center(
                        child: Text(
                          'No tournaments here.',
                          style: const TextStyle(
                            color: AppColors.textGray,
                            fontFamily: 'Poppins',
                          ),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemCount: list.length,
                        itemBuilder: (_, i) =>
                            _TournamentCard(tournament: list[i]),
                      );
              }).toList(),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.accentYellow,
        icon: const Icon(LucideIcons.plus, color: Colors.black),
        label: const Text(
          'Create Tournament',
          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.w700,
            fontFamily: 'Poppins',
          ),
        ),
        onPressed: () => context.push('/tournaments/create'),
      ),
    );
  }
}

class _TournamentCard extends StatelessWidget {
  final Map<String, dynamic> tournament;
  const _TournamentCard({required this.tournament});

  Color get _statusColor {
    switch (tournament['status'] as String) {
      case 'open':
        return AppColors.primary;
      case 'ongoing':
        return Colors.orange;
      case 'completed':
        return Colors.white38;
      default:
        return Colors.white38;
    }
  }

  String get _statusLabel {
    switch (tournament['status'] as String) {
      case 'open':
        return 'OPEN';
      case 'ongoing':
        return 'LIVE';
      case 'completed':
        return 'ENDED';
      default:
        return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final joined = tournament['teamsJoined'] as int;
    final total = tournament['teamsTotal'] as int;
    final pct = joined / total;
    final isOpen = tournament['status'] == 'open';

    return GestureDetector(
      onTap: () => context.push('/tournaments/detail', extra: tournament),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.backgroundCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.borderGray),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image header
            ClipRRect(
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(16)),
              child: SizedBox(
                height: 120,
                width: double.infinity,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Image.asset(
                      tournament['image'] as String,
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
                            Colors.transparent,
                            Colors.black.withValues(alpha: 0.75),
                          ],
                        ),
                      ),
                    ),
                    // Sport badge
                    Positioned(
                      top: 10,
                      left: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          tournament['sport'] as String,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            fontFamily: 'Poppins',
                          ),
                        ),
                      ),
                    ),
                    // Status badge
                    Positioned(
                      top: 10,
                      right: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: _statusColor,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          _statusLabel,
                          style: TextStyle(
                            color: isOpen ? Colors.black : Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            fontFamily: 'Poppins',
                          ),
                        ),
                      ),
                    ),
                    // Title at bottom
                    Positioned(
                      left: 12,
                      right: 12,
                      bottom: 10,
                      child: Text(
                        tournament['name'] as String,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'Poppins',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Details
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Format + Organizer
                  Row(
                    children: [
                      const Icon(LucideIcons.trophy,
                          color: AppColors.accentYellow, size: 14),
                      const SizedBox(width: 4),
                      Text(
                        '${tournament['format']}  ·  ${tournament['organizer']}',
                        style: const TextStyle(
                          color: AppColors.textGray,
                          fontSize: 12,
                          fontFamily: 'Poppins',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 5),
                  // Date range
                  Row(
                    children: [
                      const Icon(LucideIcons.calendar,
                          color: AppColors.textGray, size: 13),
                      const SizedBox(width: 4),
                      Text(
                        '${tournament['startDate']}  –  ${tournament['endDate']}',
                        style: const TextStyle(
                          color: AppColors.textGray,
                          fontSize: 12,
                          fontFamily: 'Poppins',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 5),
                  // Location
                  Row(
                    children: [
                      const Icon(LucideIcons.mapPin,
                          color: AppColors.primary, size: 14),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          tournament['location'] as String,
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                            fontFamily: 'Poppins',
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Teams fill bar + prize/entry
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '$joined/$total teams registered',
                              style: const TextStyle(
                                color: AppColors.textGray,
                                fontSize: 11,
                                fontFamily: 'Poppins',
                              ),
                            ),
                            const SizedBox(height: 5),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: pct,
                                minHeight: 5,
                                backgroundColor: Colors.white12,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  pct >= 1.0
                                      ? Colors.orange
                                      : AppColors.accentYellow,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 14),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'Prize: ₹${tournament['prizePool']}',
                            style: const TextStyle(
                              color: AppColors.accentYellow,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              fontFamily: 'Poppins',
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Entry: ₹${tournament['entryFee']}',
                            style: const TextStyle(
                              color: AppColors.textGray,
                              fontSize: 11,
                              fontFamily: 'Poppins',
                            ),
                          ),
                        ],
                      ),
                    ],
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
