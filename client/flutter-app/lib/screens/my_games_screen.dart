import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../core/constants/app_colors.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../services/booking_service.dart';
import '../services/game_service.dart';
import '../widgets/common/bms_toast.dart';

// â”€â”€ Sport helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const _kSportGradients = <String, List<Color>>{
  'cricket': [AppColors.gradientStart, AppColors.accentBlueLight],
  'football': [AppColors.primary, AppColors.accentGreen],
  'soccer': [AppColors.primary, AppColors.accentGreen],
  'basketball': [AppColors.accentOrange, AppColors.accentOrangeDeep],
  'tennis': [AppColors.accentYellow, AppColors.accentOrange],
  'badminton': [AppColors.gradientStart, AppColors.accentPurple],
  'volleyball': [AppColors.accentOrangeDeep, AppColors.accentPink],
  'hockey': [AppColors.primary, AppColors.gradientStart],
  'kabaddi': [AppColors.accentGold, AppColors.accentOrangeDeep],
};

const _kSportEmoji = <String, String>{
  'cricket': '🏏',
  'football': '⚽',
  'soccer': '⚽',
  'basketball': '🏀',
  'tennis': '🎾',
  'badminton': '🏸',
  'volleyball': '🏐',
  'hockey': '🏑',
  'kabaddi': '🤼',
};

List<Color> _sportGradient(String? sport) {
  final k = (sport ?? '').toLowerCase();
  return _kSportGradients[k] ??
      [AppColors.gradientStart, AppColors.gradientEnd];
}

String _sportEmoji(String? sport) {
  final k = (sport ?? '').toLowerCase();
  return _kSportEmoji[k] ?? '🎮';
}

// â”€â”€ Main Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class MyGamesScreen extends StatefulWidget {
  const MyGamesScreen({super.key});

  @override
  State<MyGamesScreen> createState() => _MyGamesScreenState();
}

class _MyGamesScreenState extends State<MyGamesScreen> {
  int _selectedTab = 0;
  final _service = BookingService();

  late Future<List<Map<String, dynamic>>> _hostedFuture;
  late Future<List<Map<String, dynamic>>> _joinedFuture;
  late Future<List<Map<String, dynamic>>> _bookingsFuture;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    _hostedFuture = _service.getMyHostedGames();
    _joinedFuture = _service.getMyJoinedGames();
    _bookingsFuture = _service.getBookings();
  }

  void _refresh() => setState(_loadData);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceL0,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: 12),
            _buildTabSwitcher(),
            const SizedBox(height: 8),
            Expanded(
              child: IndexedStack(
                index: _selectedTab,
                children: [
                  _GamesTab(
                      hostedFuture: _hostedFuture, joinedFuture: _joinedFuture),
                  _BookingsTab(future: _bookingsFuture),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(
        children: [
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              context.pop();
            },
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.surfaceL3,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.backgroundCard),
              ),
              child: const Icon(LucideIcons.chevronLeft,
                  color: Colors.white, size: 15),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ShaderMask(
                  shaderCallback: (b) => const LinearGradient(
                    colors: [AppColors.gradientStart, AppColors.gradientEnd],
                  ).createShader(b),
                  blendMode: BlendMode.srcIn,
                  child: const Text(
                    'My Activity',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      fontFamily: 'Poppins',
                    ),
                  ),
                ),
                Text(
                  'Games & Ground Bookings',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.35),
                    fontSize: 12,
                    fontFamily: 'Poppins',
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              _refresh();
            },
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.gradientStart, AppColors.gradientEnd],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(LucideIcons.refreshCw,
                  color: Colors.black, size: 20),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabSwitcher() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        height: 50,
        decoration: BoxDecoration(
          color: AppColors.surfaceL2,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.backgroundCard),
        ),
        child: Row(
          children: [
            _TabPill(
              label: 'Games',
              icon: Icons.sports_cricket_rounded,
              selected: _selectedTab == 0,
              onTap: () {
                HapticFeedback.selectionClick();
                setState(() => _selectedTab = 0);
              },
            ),
            _TabPill(
              label: 'Bookings',
              icon: Icons.stadium_outlined,
              selected: _selectedTab == 1,
              onTap: () {
                HapticFeedback.selectionClick();
                setState(() => _selectedTab = 1);
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _TabPill extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _TabPill({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          margin: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            gradient: selected
                ? const LinearGradient(
                    colors: [AppColors.gradientStart, AppColors.gradientEnd],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  )
                : null,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 16,
                color: selected
                    ? Colors.black
                    : Colors.white.withValues(alpha: 0.35),
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  color: selected
                      ? Colors.black
                      : Colors.white.withValues(alpha: 0.35),
                  fontSize: 14,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  fontFamily: 'Poppins',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// â”€â”€ Games Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _GamesTab extends StatefulWidget {
  final Future<List<Map<String, dynamic>>> hostedFuture;
  final Future<List<Map<String, dynamic>>> joinedFuture;
  const _GamesTab({required this.hostedFuture, required this.joinedFuture});

  @override
  State<_GamesTab> createState() => _GamesTabState();
}

class _GamesTabState extends State<_GamesTab> {
  String _filter = 'all';

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 8),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _FilterPill(
                  label: 'All Games',
                  selected: _filter == 'all',
                  onTap: () => setState(() => _filter = 'all'),
                ),
                const SizedBox(width: 8),
                _FilterPill(
                  label: '🏆  Hosting',
                  selected: _filter == 'hosting',
                  onTap: () => setState(() => _filter = 'hosting'),
                ),
                const SizedBox(width: 8),
                _FilterPill(
                  label: '🤝  Joined',
                  selected: _filter == 'joined',
                  onTap: () => setState(() => _filter = 'joined'),
                ),
              ],
            ),
          ),
        ),
        Expanded(
          child: FutureBuilder<List<List<Map<String, dynamic>>>>(
            future: Future.wait([widget.hostedFuture, widget.joinedFuture]),
            builder: (context, snap) {
              if (snap.connectionState == ConnectionState.waiting) {
                return const _LoadingState();
              }
              if (snap.hasError) {
                return _ErrorState(message: snap.error.toString());
              }

              final hostedRaw = snap.data?[0] ?? [];
              final joinedRaw = snap.data?[1] ?? [];

              final hosted = hostedRaw
                  .map((g) =>
                      Map<String, dynamic>.from(g)..['_myRole'] = 'hosting')
                  .toList();
              final joined = joinedRaw
                  .map((g) =>
                      Map<String, dynamic>.from(g)..['_myRole'] = 'joined')
                  .toList();

              List<Map<String, dynamic>> games;
              if (_filter == 'hosting') {
                games = hosted;
              } else if (_filter == 'joined') {
                games = joined;
              } else {
                games = [...hosted, ...joined];
                games.sort((a, b) {
                  final da = DateTime.tryParse(a['date']?.toString() ?? '') ??
                      DateTime(0);
                  final db = DateTime.tryParse(b['date']?.toString() ?? '') ??
                      DateTime(0);
                  return db.compareTo(da);
                });
              }

              if (games.isEmpty) {
                return _EmptyState(
                  emoji: _filter == 'hosting'
                      ? '🏆'
                      : _filter == 'joined'
                          ? '🤝'
                          : '🎮',
                  message: _filter == 'hosting'
                      ? "You haven't hosted\nany games yet."
                      : _filter == 'joined'
                          ? "You haven't joined\nany games yet."
                          : "No games yet.\nHost or join one!",
                );
              }

              return ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                itemCount: games.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, i) => _GameCard(game: games[i]),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _FilterPill extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _FilterPill(
      {required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.gradientStart.withValues(alpha: 0.12)
              : AppColors.surfaceL3,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color:
                selected ? AppColors.gradientStart : AppColors.backgroundCard,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected
                ? AppColors.gradientStart
                : Colors.white.withValues(alpha: 0.45),
            fontSize: 13,
            fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
            fontFamily: 'Poppins',
          ),
        ),
      ),
    );
  }
}

class _GameCard extends StatelessWidget {
  final Map<String, dynamic> game;
  const _GameCard({required this.game});

  String _formatDate(String? raw) {
    if (raw == null) return '—';
    try {
      return DateFormat('dd MMM yyyy').format(DateTime.parse(raw).toLocal());
    } catch (_) {
      return raw;
    }
  }

  @override
  Widget build(BuildContext context) {
    final turf = game['turf'] as Map<String, dynamic>?;
    final turfName = turf?['name']?.toString() ?? 'Unknown Venue';
    final city = turf?['city']?.toString() ?? game['city']?.toString() ?? '';
    final state = turf?['state']?.toString() ?? game['state']?.toString() ?? '';
    final location = [city, state].where((s) => s.isNotEmpty).join(', ');
    final sport =
        game['sport']?.toString() ?? game['gameType']?.toString() ?? 'Game';
    final date = _formatDate(game['date']?.toString());
    final start =
        game['startTime']?.toString() ?? game['time']?.toString() ?? '';
    final end = game['endTime']?.toString() ?? '';
    final timeRange =
        start.isNotEmpty ? (end.isNotEmpty ? '$start – $end' : start) : '';
    final status = game['status']?.toString() ?? '';
    final isHosting = (game['_myRole']?.toString() ?? 'hosting') == 'hosting';
    final gradColors = _sportGradient(sport);
    final emoji = _sportEmoji(sport);

    return GestureDetector(
      onTap: () => _GameDetailSheet.show(context, game),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surfaceL2,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.surfaceL4),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Left gradient bar
                Container(
                  width: 4,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: gradColors,
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                ),

                // Sport icon column
                Container(
                  width: 72,
                  color: gradColors[0].withValues(alpha: 0.06),
                  child: Center(
                    child: Text(
                      emoji,
                      style: const TextStyle(fontSize: 30),
                    ),
                  ),
                ),

                // Content
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(children: [
                          Expanded(
                            child: Text(
                              sport,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                fontFamily: 'Poppins',
                              ),
                            ),
                          ),
                          if (status.isNotEmpty) _StatusChip(status: status),
                        ]),
                        const SizedBox(height: 4),
                        Text(
                          turfName,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.7),
                            fontSize: 13,
                            fontFamily: 'Poppins',
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (location.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Row(children: [
                            Icon(LucideIcons.mapPin,
                                size: 11,
                                color: Colors.white.withValues(alpha: 0.38)),
                            const SizedBox(width: 3),
                            Text(
                              location,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.38),
                                fontSize: 11,
                                fontFamily: 'Poppins',
                              ),
                            ),
                          ]),
                        ],
                        const SizedBox(height: 6),
                        Row(children: [
                          Icon(LucideIcons.calendar,
                              size: 11,
                              color: Colors.white.withValues(alpha: 0.38)),
                          const SizedBox(width: 3),
                          Text(
                            date,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.38),
                              fontSize: 11,
                              fontFamily: 'Poppins',
                            ),
                          ),
                          if (timeRange.isNotEmpty) ...[
                            Text(
                              '  ·  ',
                              style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.2),
                                  fontSize: 11),
                            ),
                            Icon(LucideIcons.clock,
                                size: 11,
                                color: Colors.white.withValues(alpha: 0.38)),
                            const SizedBox(width: 3),
                            Flexible(
                              child: Text(
                                timeRange,
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.38),
                                  fontSize: 11,
                                  fontFamily: 'Poppins',
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                          const Spacer(),
                          _RoleBadge(
                              isHosting: isHosting, gradColors: gradColors),
                        ]),

                        // Watch Live CTA — only renders when the backend
                        // says the game is currently being scored.
                        if (status.toUpperCase() == 'LIVE' ||
                            game['isLive'] == true) ...[
                          const SizedBox(height: 10),
                          _WatchLiveButton(
                            gameId:
                                (game['id'] ?? game['_id'])?.toString() ?? '',
                          ),
                        ],
                        // Host-only inbox CTA — surfaces when the user is
                        // hosting AND the game still accepts join requests.
                        if (isHosting &&
                            (status.toUpperCase() == 'ACTIVE' ||
                                status.toUpperCase() == 'SCHEDULED')) ...[
                          const SizedBox(height: 10),
                          _ManageRequestsButton(
                            gameId:
                                (game['id'] ?? game['_id'])?.toString() ?? '',
                          ),
                        ],
                      ],
                    ),
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

/// Pulse-red "Watch Live" pill placed inside `/my-games` cards whose
/// status is LIVE. Routes to /live-score for that matchId.
class _WatchLiveButton extends StatelessWidget {
  final String gameId;
  const _WatchLiveButton({required this.gameId});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: gameId.isEmpty
          ? null
          : () => context.push('/live-score', extra: {'matchId': gameId}),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.errorRed.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
              color: AppColors.errorRed.withValues(alpha: 0.5), width: 1),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Icon(LucideIcons.video, size: 12, color: AppColors.errorRed),
            SizedBox(width: 6),
            Text(
              'Watch Live',
              style: TextStyle(
                color: AppColors.errorRed,
                fontSize: 11,
                fontWeight: FontWeight.w700,
                fontFamily: 'Poppins',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Host-only manage-requests pill. Routes to /pending-requests/:gameId
/// where the host can approve/reject incoming joins for private games.
class _ManageRequestsButton extends StatelessWidget {
  final String gameId;
  const _ManageRequestsButton({required this.gameId});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: gameId.isEmpty
          ? null
          : () => context.push('/pending-requests/$gameId'),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: const Color(0xFF7CFE6A).withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
              color: const Color(0xFF7CFE6A).withValues(alpha: 0.5), width: 1),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Icon(LucideIcons.userPlus, size: 12, color: Color(0xFF7CFE6A)),
            SizedBox(width: 6),
            Text(
              'Manage Requests',
              style: TextStyle(
                color: Color(0xFF7CFE6A),
                fontSize: 11,
                fontWeight: FontWeight.w700,
                fontFamily: 'Poppins',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip({required this.status});

  Color _color() {
    switch (status.toUpperCase()) {
      case 'UPCOMING':
      case 'ACTIVE':
        return AppColors.accentGreen;
      case 'LIVE':
        return AppColors.accentOrangeDeep;
      case 'COMPLETED':
        return AppColors.textGray;
      case 'CANCELLED':
        return AppColors.accentRed;
      default:
        return AppColors.gradientStart;
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = _color();
    final label = status[0].toUpperCase() + status.substring(1).toLowerCase();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: c.withValues(alpha: 0.4)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: c,
          fontSize: 10,
          fontWeight: FontWeight.w700,
          fontFamily: 'Poppins',
        ),
      ),
    );
  }
}

class _RoleBadge extends StatelessWidget {
  final bool isHosting;
  final List<Color> gradColors;
  const _RoleBadge({required this.isHosting, required this.gradColors});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isHosting
              ? gradColors
              : [AppColors.gradientStart, AppColors.accentBlueLight],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        isHosting ? '🏆 Host' : '🤝 Joined',
        style: const TextStyle(
          color: Colors.black,
          fontSize: 10,
          fontWeight: FontWeight.w700,
          fontFamily: 'Poppins',
        ),
      ),
    );
  }
}

// â”€â”€ Bookings Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _BookingsTab extends StatelessWidget {
  final Future<List<Map<String, dynamic>>> future;
  const _BookingsTab({required this.future});

  bool _isUpcoming(Map<String, dynamic> b) {
    final ts = b['timeSlot'] as Map?;
    final end = DateTime.tryParse(ts?['endTime']?.toString() ?? '')?.toLocal();
    return end != null && end.isAfter(DateTime.now());
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: future,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const _LoadingState();
        }
        if (snap.hasError) return _ErrorState(message: snap.error.toString());

        final bookings = snap.data ?? [];
        if (bookings.isEmpty) {
          return const _EmptyState(
            emoji: '🏟ï¸',
            message: 'No ground bookings yet.\nBook a turf to play!',
          );
        }

        final upcoming = bookings.where(_isUpcoming).toList();
        final past = bookings.where((b) => !_isUpcoming(b)).toList();

        final items = <dynamic>[];
        if (upcoming.isNotEmpty) {
          items.add('UPCOMING');
          items.addAll(upcoming);
        }
        if (past.isNotEmpty) {
          items.add('PAST');
          items.addAll(past);
        }

        return ListView.builder(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
          itemCount: items.length,
          itemBuilder: (context, i) {
            final item = items[i];
            if (item is String) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 10, top: 8),
                child: Row(children: [
                  ShaderMask(
                    shaderCallback: (b) => const LinearGradient(
                      colors: [AppColors.gradientStart, AppColors.gradientEnd],
                    ).createShader(b),
                    blendMode: BlendMode.srcIn,
                    child: Text(
                      item,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.5,
                        fontFamily: 'Poppins',
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Container(
                      height: 1,
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [AppColors.gradientStart, Colors.transparent],
                        ),
                      ),
                    ),
                  ),
                ]),
              );
            }
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _BookingCard(booking: item as Map<String, dynamic>),
            );
          },
        );
      },
    );
  }
}

class _BookingCard extends StatelessWidget {
  final Map<String, dynamic> booking;
  const _BookingCard({required this.booking});

  String _fmtTime(String? raw) {
    if (raw == null) return '—';
    try {
      return DateFormat('hh:mm a').format(DateTime.parse(raw).toLocal());
    } catch (_) {
      return raw;
    }
  }

  String _fmtDate(String? raw) {
    if (raw == null) return '—';
    try {
      return DateFormat('dd MMM yyyy').format(DateTime.parse(raw).toLocal());
    } catch (_) {
      return raw;
    }
  }

  String _fmtDateTime(String? raw) {
    if (raw == null) return '—';
    try {
      return DateFormat('dd MMM, hh:mm a')
          .format(DateTime.parse(raw).toLocal());
    } catch (_) {
      return raw;
    }
  }

  @override
  Widget build(BuildContext context) {
    final turf = booking['turf'] as Map<String, dynamic>?;
    final ts = booking['timeSlot'] as Map<String, dynamic>?;

    final turfName = turf?['name']?.toString() ?? 'Unknown Venue';
    final location = turf?['location']?.toString() ?? '';
    final imgSingle = turf?['image']?.toString();
    final imgList = turf?['images'] as List?;
    final imageUrl = imgSingle?.isNotEmpty == true
        ? imgSingle
        : (imgList?.isNotEmpty == true ? imgList!.first.toString() : null);

    final startRaw = ts?['startTime']?.toString();
    final endRaw = ts?['endTime']?.toString();
    final dateStr = _fmtDate(startRaw);
    final timeRange = '${_fmtTime(startRaw)} – ${_fmtTime(endRaw)}';

    final status = booking['status']?.toString();
    final price = booking['totalPrice'];
    final priceStr = price != null
        ? '₹${double.tryParse(price.toString())?.toStringAsFixed(0) ?? price}'
        : '';
    final bookedOn = _fmtDateTime(booking['createdAt']?.toString());

    return GestureDetector(
      onTap: () => _BookingDetailSheet.show(context, booking),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surfaceL2,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.surfaceL4),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image with overlay
              Stack(
                children: [
                  SizedBox(
                    height: 110,
                    width: double.infinity,
                    child: imageUrl != null
                        ? Image.network(
                            imageUrl,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => _imagePlaceholder(),
                          )
                        : _imagePlaceholder(),
                  ),
                  Positioned.fill(
                    child: Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Colors.transparent, Color(0xDD141414)],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          stops: [0.3, 1.0],
                        ),
                      ),
                    ),
                  ),
                  if (status != null)
                    Positioned(
                      top: 10,
                      left: 10,
                      child: _StatusChip(status: status),
                    ),
                  if (priceStr.isNotEmpty)
                    Positioned(
                      top: 10,
                      right: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [
                              AppColors.gradientStart,
                              AppColors.gradientEnd
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          priceStr,
                          style: const TextStyle(
                            color: Colors.black,
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            fontFamily: 'Poppins',
                          ),
                        ),
                      ),
                    ),
                ],
              ),

              // Info section
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      turfName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'Poppins',
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (location.isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Row(children: [
                        Icon(LucideIcons.mapPin,
                            size: 12,
                            color: Colors.white.withValues(alpha: 0.38)),
                        const SizedBox(width: 3),
                        Expanded(
                          child: Text(
                            location,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.38),
                              fontSize: 12,
                              fontFamily: 'Poppins',
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ]),
                    ],
                    const SizedBox(height: 6),
                    Row(children: [
                      Icon(LucideIcons.calendar,
                          size: 12,
                          color: Colors.white.withValues(alpha: 0.38)),
                      const SizedBox(width: 3),
                      Text(
                        dateStr,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.38),
                          fontSize: 12,
                          fontFamily: 'Poppins',
                        ),
                      ),
                      Text(
                        '  ·  ',
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.2),
                            fontSize: 12),
                      ),
                      Icon(LucideIcons.clock,
                          size: 12,
                          color: Colors.white.withValues(alpha: 0.38)),
                      const SizedBox(width: 3),
                      Expanded(
                        child: Text(
                          timeRange,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.38),
                            fontSize: 12,
                            fontFamily: 'Poppins',
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ]),
                    const SizedBox(height: 3),
                    Text(
                      'Booked $bookedOn',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.22),
                        fontSize: 11,
                        fontFamily: 'Poppins',
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _imagePlaceholder() {
    return Container(
      height: 110,
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.surfaceL3, AppColors.surfaceL4],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.stadium_outlined,
              color: Colors.white.withValues(alpha: 0.15), size: 36),
          const SizedBox(height: 4),
          Text(
            'Ground Booking',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.15),
              fontSize: 12,
              fontFamily: 'Poppins',
            ),
          ),
        ],
      ),
    );
  }
}

// â”€â”€ Detail bottom sheets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _GameDetailSheet {
  static void show(BuildContext context, Map<String, dynamic> game) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _GameDetailContent(game: game),
    );
  }
}

class _GameDetailContent extends StatefulWidget {
  final Map<String, dynamic> game;
  const _GameDetailContent({required this.game});

  @override
  State<_GameDetailContent> createState() => _GameDetailContentState();
}

class _GameDetailContentState extends State<_GameDetailContent> {
  bool _cancelling = false;

  String _fmt(String? raw, {bool timeOnly = false}) {
    if (raw == null || raw.isEmpty) return '—';
    try {
      final dt = DateTime.parse(raw).toLocal();
      return timeOnly
          ? DateFormat('hh:mm a').format(dt)
          : DateFormat('dd MMM yyyy').format(dt);
    } catch (_) {
      return raw;
    }
  }

  Future<void> _cancelGame(BuildContext context, String gameId) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        backgroundColor: AppColors.surfaceL4,
        title: const Text('Cancel Game', style: TextStyle(color: Colors.white)),
        content: const Text(
            'Are you sure you want to cancel this game? All players will be notified.',
            style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(c, false),
              child: const Text('No')),
          TextButton(
              onPressed: () => Navigator.pop(c, true),
              child: const Text('Yes, Cancel',
                  style: TextStyle(color: Colors.redAccent))),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    setState(() => _cancelling = true);
    final success = await GameService().cancelGame(gameId);
    if (!mounted) return;
    setState(() => _cancelling = false);
    if (success) {
      BmsToast.success(context, 'Game cancelled');
      context.pop();
    } else {
      BmsToast.error(context, 'Could not cancel — try again');
    }
  }

  @override
  Widget build(BuildContext context) {
    final game = widget.game;
    final turf = game['turf'] as Map<String, dynamic>?;
    final sport =
        game['sport']?.toString() ?? game['gameType']?.toString() ?? 'Game';
    final gameMode = game['gameMode']?.toString() ?? '';
    final status = game['status']?.toString();
    final date = _fmt(game['date']?.toString());
    final time =
        game['startTime']?.toString() ?? game['time']?.toString() ?? '—';
    final shortId = game['shortId']?.toString() ?? '';
    final isHosting = (game['_myRole']?.toString() ?? 'hosting') == 'hosting';

    final turfName = turf?['name']?.toString() ?? 'Venue not selected';
    final city = turf?['city']?.toString() ?? game['city']?.toString() ?? '';
    final state = turf?['state']?.toString() ?? game['state']?.toString() ?? '';
    final location = [city, state].where((s) => s.isNotEmpty).join(', ');

    final charge = game['perPlayerCharge'];
    final chargeStr =
        charge != null && double.tryParse(charge.toString()) != null
            ? '₹${double.tryParse(charge.toString())!.toStringAsFixed(0)}'
            : null;
    final isFree = game['isFree'] == true ||
        (charge != null && double.tryParse(charge.toString()) == 0);
    final maxMembers = game['maxMembers']?.toString() ?? '';
    final images = turf?['images'] as List?;
    final imageUrl =
        images?.isNotEmpty == true ? images!.first.toString() : null;
    final gradColors = _sportGradient(sport);

    return DraggableScrollableSheet(
      initialChildSize: 0.65,
      minChildSize: 0.4,
      maxChildSize: 0.92,
      builder: (_, controller) => Container(
        decoration: const BoxDecoration(
          color: AppColors.surfaceL0,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 10),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(height: 4),
            Expanded(
              child: ListView(
                controller: controller,
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
                children: [
                  if (imageUrl != null) ...[
                    ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: Stack(
                        children: [
                          Image.network(
                            imageUrl,
                            height: 160,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) =>
                                const SizedBox.shrink(),
                          ),
                          Positioned.fill(
                            child: Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    Colors.transparent,
                                    gradColors[0].withValues(alpha: 0.3),
                                  ],
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                  Row(children: [
                    Text(
                      _sportEmoji(sport),
                      style: const TextStyle(fontSize: 26),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        sport,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Poppins',
                        ),
                      ),
                    ),
                    if (status != null) _StatusChip(status: status),
                  ]),
                  const SizedBox(height: 8),
                  Row(children: [
                    _RoleBadge(isHosting: isHosting, gradColors: gradColors),
                    if (gameMode.isNotEmpty) ...[
                      const SizedBox(width: 8),
                      _Badge(
                        label:
                            gameMode[0] + gameMode.substring(1).toLowerCase(),
                        color: Colors.purple,
                      ),
                    ],
                  ]),
                  const SizedBox(height: 20),
                  _DetailTile(
                      icon: LucideIcons.calendar, label: 'Date', value: date),
                  _DetailTile(
                      icon: LucideIcons.clock, label: 'Time', value: time),
                  _DetailTile(
                    icon: Icons.stadium,
                    label: 'Venue',
                    value: turfName,
                    sub: location.isNotEmpty ? location : null,
                  ),
                  if (chargeStr != null)
                    _DetailTile(
                      icon: LucideIcons.indianRupee,
                      label: 'Per Player',
                      value: isFree ? 'Free' : chargeStr,
                    ),
                  if (maxMembers.isNotEmpty)
                    _DetailTile(
                        icon: LucideIcons.users,
                        label: 'Max Players',
                        value: maxMembers),
                  if (shortId.isNotEmpty)
                    _DetailTile(
                        icon: LucideIcons.tag,
                        label: 'Game ID',
                        value: shortId),
                  if (isHosting &&
                      status != 'cancelled' &&
                      status != 'completed') ...[
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: _cancelling
                            ? null
                            : () {
                                final id = game['_id']?.toString() ??
                                    game['id']?.toString() ??
                                    '';
                                if (id.isNotEmpty) _cancelGame(context, id);
                              },
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                          side: const BorderSide(color: Colors.redAccent),
                        ),
                        child: _cancelling
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                    color: Colors.redAccent, strokeWidth: 2))
                            : const Text('CANCEL GAME',
                                style: TextStyle(
                                    color: Colors.redAccent,
                                    letterSpacing: 1.1)),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BookingDetailSheet {
  static void show(BuildContext context, Map<String, dynamic> booking) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _BookingDetailContent(booking: booking),
    );
  }
}

class _BookingDetailContent extends StatelessWidget {
  final Map<String, dynamic> booking;
  const _BookingDetailContent({required this.booking});

  String _fmtDate(String? raw) {
    if (raw == null || raw.isEmpty) return '—';
    try {
      return DateFormat('dd MMM yyyy').format(DateTime.parse(raw).toLocal());
    } catch (_) {
      return raw;
    }
  }

  String _fmtTime(String? raw) {
    if (raw == null || raw.isEmpty) return '—';
    try {
      return DateFormat('hh:mm a').format(DateTime.parse(raw).toLocal());
    } catch (_) {
      return raw;
    }
  }

  String _fmtDateTime(String? raw) {
    if (raw == null || raw.isEmpty) return '—';
    try {
      return DateFormat('dd MMM yyyy, hh:mm a')
          .format(DateTime.parse(raw).toLocal());
    } catch (_) {
      return raw;
    }
  }

  String _amt(dynamic v) {
    if (v == null) return '—';
    final d = v is num ? v.toDouble() : double.tryParse(v.toString());
    return d != null ? '₹${d.toStringAsFixed(0)}' : v.toString();
  }

  Color _statusColor(String? s) {
    switch ((s ?? '').toLowerCase()) {
      case 'confirmed':
        return AppColors.accentGreen;
      case 'pending':
        return AppColors.accentOrange;
      case 'cancelled':
        return AppColors.accentRed;
      case 'completed':
        return AppColors.textGray;
      default:
        return AppColors.gradientStart;
    }
  }

  @override
  Widget build(BuildContext context) {
    final turf = booking['turf'] as Map<String, dynamic>?;
    final ts = booking['timeSlot'] as Map<String, dynamic>?;

    final turfName = turf?['name']?.toString() ?? 'Ground Booking';
    final location = turf?['location']?.toString() ??
        [turf?['city'], turf?['state']].whereType<String>().join(', ');
    final imgList = turf?['images'] as List?;
    final imgSingle = turf?['image']?.toString();
    final imageUrl = (imgList?.isNotEmpty == true)
        ? imgList!.first.toString()
        : (imgSingle?.isNotEmpty == true ? imgSingle : null);

    final startRaw =
        ts?['startTime']?.toString() ?? booking['playStartTime']?.toString();
    final endRaw =
        ts?['endTime']?.toString() ?? booking['playEndTime']?.toString();

    final status = booking['status']?.toString();
    final payMethod = booking['paymentMethod']?.toString() ?? '';
    final payType = booking['paymentType']?.toString() ?? '';
    final payId = booking['paymentId']?.toString() ?? '';
    final qrCode = booking['qrCode']?.toString();

    final totalAmt = _amt(booking['totalPrice']);
    final paidAmt = _amt(booking['paidAmount']);
    final balanceRaw = booking['balanceAmount'];
    final balance = balanceRaw != null
        ? (balanceRaw is num
                ? balanceRaw.toDouble()
                : double.tryParse(balanceRaw.toString())) ??
            0.0
        : 0.0;

    final methodLabel = payMethod.isNotEmpty
        ? '${payMethod[0]}${payMethod.substring(1).toLowerCase()}'
            '${payType.isNotEmpty ? " · ${payType[0]}${payType.substring(1).toLowerCase()}" : ""}'
        : '—';

    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, controller) => Container(
        decoration: const BoxDecoration(
          color: AppColors.surfaceL0,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 10),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2)),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [
                          AppColors.gradientStart,
                          AppColors.gradientEnd
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.stadium_outlined,
                        color: Colors.black, size: 22),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          turfName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Poppins',
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (status != null)
                          Text(
                            '${status[0]}${status.substring(1).toLowerCase()}',
                            style: TextStyle(
                              color: _statusColor(status),
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              fontFamily: 'Poppins',
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: ListView(
                controller: controller,
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
                children: [
                  if (imageUrl != null) ...[
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(
                        imageUrl,
                        height: 150,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                  _InfoCard(
                    title: 'Booking Details',
                    rows: [
                      _InfoRow('Date', _fmtDate(startRaw)),
                      _InfoRow('Time',
                          '${_fmtTime(startRaw)} – ${_fmtTime(endRaw)}'),
                      if (location.isNotEmpty) _InfoRow('Location', location),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _InfoCard(
                    title: 'Payment Details',
                    rows: [
                      _InfoRow('Total Amount', totalAmt,
                          valueColor: AppColors.gradientStart),
                      _InfoRow('Paid', paidAmt),
                      if (balance > 0)
                        _InfoRow('Balance Due', _amt(balanceRaw),
                            valueColor: Colors.orange),
                      _InfoRow('Payment Method', methodLabel),
                      if (payId.isNotEmpty) _InfoRow('Transaction ID', payId),
                      _InfoRow('Booked On',
                          _fmtDateTime(booking['createdAt']?.toString())),
                    ],
                  ),
                  if (qrCode != null && qrCode.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    _InfoCard(
                      title: 'Entry QR Code',
                      rows: const [],
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.only(top: 12, bottom: 4),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Image.network(
                              qrCode,
                              width: 160,
                              height: 160,
                              fit: BoxFit.contain,
                              errorBuilder: (_, __, ___) =>
                                  const SizedBox.shrink(),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// â”€â”€ Reusable sheet widgets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _InfoRow {
  final String label;
  final String value;
  final Color? valueColor;
  const _InfoRow(this.label, this.value, {this.valueColor});
}

class _InfoCard extends StatelessWidget {
  final String title;
  final List<_InfoRow> rows;
  final Widget? child;
  const _InfoCard({required this.title, required this.rows, this.child});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 15,
            fontWeight: FontWeight.w700,
            fontFamily: 'Poppins',
          ),
        ),
        const SizedBox(height: 10),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surfaceL3,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.backgroundCard),
          ),
          child: Column(
            children: [
              ...rows.asMap().entries.map((e) {
                final i = e.key;
                final row = e.value;
                return Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          row.label,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.45),
                            fontSize: 13,
                            fontFamily: 'Poppins',
                          ),
                        ),
                        Flexible(
                          child: Text(
                            row.value,
                            textAlign: TextAlign.right,
                            style: TextStyle(
                              color: row.valueColor ?? Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              fontFamily: 'Poppins',
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (i < rows.length - 1 || child != null)
                      Divider(
                          color: Colors.white.withValues(alpha: 0.06),
                          height: 24),
                  ],
                );
              }),
              if (child != null) child!,
            ],
          ),
        ),
      ],
    );
  }
}

class _DetailTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final String? sub;

  const _DetailTile({
    required this.icon,
    required this.label,
    required this.value,
    this.sub,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.gradientStart.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                  color: AppColors.gradientStart.withValues(alpha: 0.2)),
            ),
            child: Icon(icon, size: 17, color: AppColors.gradientStart),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.38),
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Poppins',
                    letterSpacing: 0.3,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Poppins',
                  ),
                ),
                if (sub != null)
                  Text(
                    sub!,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.38),
                      fontSize: 12,
                      fontFamily: 'Poppins',
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final String label;
  final Color color;
  const _Badge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          fontFamily: 'Poppins',
        ),
      ),
    );
  }
}

// â”€â”€ Shared state widgets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _LoadingState extends StatelessWidget {
  const _LoadingState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: CircularProgressIndicator(
        color: AppColors.gradientStart,
        strokeWidth: 2,
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final String emoji;
  final String message;
  const _EmptyState({required this.emoji, required this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.gradientStart, AppColors.gradientEnd],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(emoji, style: const TextStyle(fontSize: 34)),
            ),
          ),
          const SizedBox(height: 16),
          ShaderMask(
            shaderCallback: (b) => const LinearGradient(
              colors: [AppColors.gradientStart, AppColors.gradientEnd],
            ).createShader(b),
            blendMode: BlendMode.srcIn,
            child: Text(
              message,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontFamily: 'Poppins',
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  const _ErrorState({required this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('⚠️', style: TextStyle(fontSize: 40)),
            const SizedBox(height: 12),
            Text(
              'Failed to load\n$message',
              style: const TextStyle(
                color: AppColors.accentRed,
                fontSize: 14,
                fontFamily: 'Poppins',
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
