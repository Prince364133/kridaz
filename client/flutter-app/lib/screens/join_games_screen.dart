import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../widgets/common/bms_toast.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../core/clock/server_clock.dart';
import '../core/constants/app_colors.dart';
import '../services/game_service.dart';
import '../services/match_feed_service.dart';
import 'join_game_info_screen.dart';

/// Live & recent matches that the user has played in or near them.
/// Lives here (not in new_home_dashboard) so this file is self-contained.
final joinGamesLiveProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  return MatchFeedService().liveForUser();
});

final joinGamesRecentProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  return MatchFeedService().recentForUser(limit: 5);
});

class JoinGamesScreen extends ConsumerStatefulWidget {
  final String? initialSport;
  const JoinGamesScreen({Key? key, this.initialSport}) : super(key: key);

  @override
  ConsumerState<JoinGamesScreen> createState() => _JoinGamesScreenState();
}

class _JoinGamesScreenState extends ConsumerState<JoinGamesScreen> {
  final _service = GameService();

  late String _selectedSport;
  List<Map<String, dynamic>> _games = [];
  bool _isLoading = true;
  final Set<String> _joiningIds = {};

  static const List<String> _sports = [
    'All',
    'Cricket',
    'Football',
    'Basketball',
    'Tennis',
    'Badminton',
    'Volleyball'
  ];

  /// True when the signed-in user is the host of [game].
  bool _isMyHostedGame(Map<String, dynamic> game) {
    final me = _service.currentUserId;
    if (me == null || me.isEmpty) return false;
    final host = game['host'];
    final hostId = (host is Map
            ? (host['id'] ?? host['_id'])
            : (game['hostId'] ?? game['host_id']))
        ?.toString();
    return hostId != null && hostId == me;
  }

  @override
  void initState() {
    super.initState();
    _selectedSport = widget.initialSport ?? 'All';
    _loadGames();
  }

  Future<void> _loadGames() async {
    setState(() => _isLoading = true);
    final games = await _service.listGames(
      sport: _selectedSport == 'All' ? null : _selectedSport,
    );
    // Hide games scheduled before today (00:00 local time). Past games
    // can't be joined and just clutter the list.
    // Server-aligned "today" — past-game filter must match server time.
    final today = DateUtils.dateOnly(ServerClock.now());
    final upcoming = games.where((g) {
      final raw = g['date']?.toString();
      if (raw == null || raw.isEmpty) return true; // keep when date is unknown
      try {
        final d = DateUtils.dateOnly(DateTime.parse(raw).toLocal());
        return !d.isBefore(today);
      } catch (_) {
        return true; // unparseable — keep rather than silently drop
      }
    }).toList();
    if (mounted)
      setState(() {
        _games = upcoming;
        _isLoading = false;
      });
  }

  Future<void> _joinGame(Map<String, dynamic> game) async {
    final id = (game['id'] ?? game['_id'])?.toString() ?? '';
    if (id.isEmpty) return;
    HapticFeedback.mediumImpact();
    setState(() => _joiningIds.add(id));
    final result = await _service.joinGame(id);
    if (!mounted) return;
    setState(() => _joiningIds.remove(id));
    if (result.ok) {
      final idx =
          _games.indexWhere((g) => (g['id'] ?? g['_id'])?.toString() == id);
      if (idx != -1) {
        // Mark joined or pending immediately so the CTA flips without
        // waiting on the network. Private games leave `_joined` false and
        // surface `_pendingApproval` instead — the card decides which copy
        // to show ("Joined" vs "Request sent").
        setState(() {
          _games[idx] = result.autoJoined
              ? {..._games[idx], '_joined': true}
              : {..._games[idx], '_pendingApproval': true};
        });
        // Refetch the single game so the slot statuses (which drive the
        // "X/Y players" counter) reflect the new JOINED / PENDING slot.
        final detail = await _service.getGame(id);
        if (mounted && detail != null) {
          final fresh = (detail['game'] is Map)
              ? (detail['game'] as Map).cast<String, dynamic>()
              : detail;
          setState(() {
            _games[idx] = result.autoJoined
                ? {...fresh, '_joined': true}
                : {...fresh, '_pendingApproval': true};
          });
        }
      }
      BmsToast.success(
        context,
        result.autoJoined
            ? 'Successfully joined the game!'
            : 'Request sent. The host will review and approve your join.',
      );
    } else {
      BmsToast.error(context, result.message ?? 'Could not join the game.');
    }
  }

  String _formatDate(String? raw) {
    if (raw == null) return '—';
    try {
      return DateFormat('EEE, dd MMM').format(DateTime.parse(raw).toLocal());
    } catch (_) {
      return raw;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceL0,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(context),
            _buildSportFilter(),
            const SizedBox(height: 6),
            _buildCount(),
            const SizedBox(height: 4),
            Expanded(child: _buildBody()),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => context.pop(),
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
                    'Join a Game',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      fontFamily: 'Poppins',
                    ),
                  ),
                ),
                Text(
                  'Find open games near you',
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
            onTap: () => context.push('/host-game'),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.gradientStart, AppColors.gradientEnd],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(LucideIcons.plus, color: Colors.black, size: 16),
                  SizedBox(width: 4),
                  Text('Host',
                      style: TextStyle(
                        color: Colors.black,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        fontFamily: 'Poppins',
                      )),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSportFilter() {
    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemCount: _sports.length,
        itemBuilder: (_, i) {
          final s = _sports[i];
          final selected = _selectedSport == s;
          return GestureDetector(
            onTap: () {
              HapticFeedback.selectionClick();
              setState(() => _selectedSport = s);
              _loadGames();
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 160),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                gradient: selected
                    ? const LinearGradient(
                        colors: [
                          AppColors.gradientStart,
                          AppColors.gradientEnd
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                color: selected ? null : AppColors.surfaceL3,
                borderRadius: BorderRadius.circular(20),
                border: selected
                    ? null
                    : Border.all(color: AppColors.backgroundCard),
              ),
              child: Text(
                s,
                style: TextStyle(
                  color: selected ? Colors.black : Colors.white54,
                  fontSize: 13,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w400,
                  fontFamily: 'Poppins',
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildCount() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(children: [
        ShaderMask(
          shaderCallback: (b) => const LinearGradient(
            colors: [AppColors.gradientStart, AppColors.gradientEnd],
          ).createShader(b),
          blendMode: BlendMode.srcIn,
          child: Text(
            _isLoading ? 'Loading...' : '${_games.length} games available',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w600,
              fontFamily: 'Poppins',
            ),
          ),
        ),
      ]),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(
            color: AppColors.gradientStart, strokeWidth: 2),
      );
    }
    if (_games.isEmpty) {
      // Show live/recent section even when there are no open games, so the
      // page never looks completely empty for users who already follow some.
      return SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
        child: Column(
          children: [
            const _LiveAndRecentSection(),
            const SizedBox(height: 32),
            const Text('⚽', style: TextStyle(fontSize: 48)),
            const SizedBox(height: 14),
            ShaderMask(
              shaderCallback: (b) => const LinearGradient(
                colors: [AppColors.gradientStart, AppColors.gradientEnd],
              ).createShader(b),
              blendMode: BlendMode.srcIn,
              child: const Text(
                'No games available\nBe the first to host one!',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Poppins',
                ),
              ),
            ),
            const SizedBox(height: 20),
            GestureDetector(
              onTap: () => context.push('/host-game'),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.gradientStart, AppColors.gradientEnd],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text('Host a Game',
                    style: TextStyle(
                      color: Colors.black,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Poppins',
                    )),
              ),
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(joinGamesLiveProvider);
        ref.invalidate(joinGamesRecentProvider);
        await _loadGames();
      },
      color: AppColors.gradientStart,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
        separatorBuilder: (_, i) =>
            // No gap between the header (index 0) and first card.
            SizedBox(height: i == 0 ? 0 : 12),
        // +1 for the live/recent header row at index 0.
        itemCount: _games.length + 1,
        itemBuilder: (_, i) {
          if (i == 0) {
            return const _LiveAndRecentSection();
          }
          final idx = i - 1;
          return _GameCard(
            game: _games[idx],
            isJoining: _joiningIds.contains(
                (_games[idx]['id'] ?? _games[idx]['_id'])?.toString()),
            isMine: _isMyHostedGame(_games[idx]),
            onJoin: () => _joinGame(_games[idx]),
            onTap: () => _showDetail(_games[idx]),
            formatDate: _formatDate,
          );
        },
      ),
    );
  }

  void _showDetail(Map<String, dynamic> game) {
    HapticFeedback.lightImpact();
    final id = (game['id'] ?? game['_id'])?.toString();
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (routeCtx) => JoinGameInfoScreen(
          initialGame: game,
          isJoining: id != null && _joiningIds.contains(id),
          // Details screen owns the join action now; this callback fires
          // AFTER a successful join so the underlying list updates without
          // popping the details screen.
          onJoin: () {
            final id = (game['id'] ?? game['_id'])?.toString();
            if (id == null || id.isEmpty) return;
            final idx = _games
                .indexWhere((g) => (g['id'] ?? g['_id'])?.toString() == id);
            if (idx == -1) return;
            setState(() {
              _games[idx] = {..._games[idx], 'youJoined': true};
            });
          },
        ),
      ),
    );
  }
}

// â”€â”€ Game Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _GameCard extends StatelessWidget {
  final Map<String, dynamic> game;
  final bool isJoining;
  final bool isMine;
  final VoidCallback onJoin;
  final VoidCallback onTap;
  final String Function(String?) formatDate;

  const _GameCard({
    required this.game,
    required this.isJoining,
    required this.isMine,
    required this.onJoin,
    required this.onTap,
    required this.formatDate,
  });

  @override
  Widget build(BuildContext context) {
    final sport =
        game['sport']?.toString() ?? game['gameType']?.toString() ?? 'Game';
    final turf = game['turf'] as Map<String, dynamic>?;
    final venueName = turf?['name']?.toString() ?? 'Venue TBD';
    final city = turf?['city']?.toString() ?? game['city']?.toString() ?? '';
    final date = formatDate(game['date']?.toString());
    final time =
        game['startTime']?.toString() ?? game['time']?.toString() ?? '';
    int _toInt(dynamic v) {
      if (v is num) return v.toInt();
      if (v == null) return 0;
      return int.tryParse(v.toString()) ?? 0;
    }

    // Backend returns slot arrays (with per-slot status: OPEN / JOINED /
    // HELD / PENDING / CONFIRMED / CANCELLED) — never a precomputed count.
    // Mirror the web client (`slot.status !== 'OPEN'`) so PENDING approvals
    // and CONFIRMED slots count alongside JOINED/HELD.
    List<Map> _slotsFromTeam(dynamic team) {
      if (team is! Map) return const [];
      final raw = team['slots'];
      if (raw is! List) return const [];
      return raw.whereType<Map>().toList();
    }

    final teams = game['teams'];
    final quickSlots = (game['quickSlots'] is List)
        ? (game['quickSlots'] as List).whereType<Map>().toList()
        : <Map>[];
    final teamSlots = <Map>[
      ..._slotsFromTeam(teams is Map ? teams['teamA'] : null),
      ..._slotsFromTeam(teams is Map ? teams['teamB'] : null),
    ];
    final allSlots = teamSlots.isNotEmpty ? teamSlots : quickSlots;
    bool _filled(Map s) {
      final st = s['status']?.toString().toUpperCase() ?? '';
      return st.isNotEmpty && st != 'OPEN' && st != 'CANCELLED';
    }

    final filledFromSlots = allSlots.where(_filled).length;
    // Backend stores the per-game player cap under `playerCount` (set by the
    // host-game form). Older payloads also surfaced it as `maxMembers` /
    // `maxPlayers`. Try all three before falling back to slot count — which
    // is the same for every game of a given sport and was why every card
    // showed the same denominator.
    final declaredMax = _toInt(game['playerCount']) > 0
        ? _toInt(game['playerCount'])
        : (_toInt(game['maxMembers']) > 0
            ? _toInt(game['maxMembers'])
            : _toInt(game['maxPlayers']));
    final maxMembers = declaredMax > 0 ? declaredMax : allSlots.length;
    final currentMembers = allSlots.isNotEmpty
        ? filledFromSlots
        : (game['currentMembers'] != null
            ? _toInt(game['currentMembers'])
            : (game['members'] as List?)?.length ?? 0);
    final spotsLeft = maxMembers > 0 ? maxMembers - currentMembers : -1;
    final isFull = spotsLeft == 0;
    final isFree = game['isFree'] == true ||
        (double.tryParse(game['perPlayerCharge']?.toString() ?? '') ?? 0) == 0;
    final alreadyJoined = game['youJoined'] == true ||
        game['_joined'] == true ||
        game['isJoined'] == true;
    final charge = game['perPlayerCharge'];
    final priceStr = (charge != null && !isFree)
        ? '₹${double.tryParse(charge.toString())?.toStringAsFixed(0) ?? charge}'
        : 'Free';

    final gradColors = _sportGradient(sport);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surfaceL2,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            // Distinct gold accent for games hosted by the current user so
            // they're easy to spot at a glance in the list.
            color: isMine
                ? AppColors.accentGoldWarm.withValues(alpha: 0.55)
                : AppColors.surfaceL4,
            width: isMine ? 1.4 : 1,
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Gradient header band
              Container(
                height: 5,
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: gradColors),
                ),
              ),

              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Text(_sportEmoji(sport),
                          style: const TextStyle(fontSize: 22)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          sport,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Poppins',
                          ),
                        ),
                      ),
                      if (isMine) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.accentGoldWarm
                                .withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                                color: AppColors.accentGoldWarm
                                    .withValues(alpha: 0.45)),
                          ),
                          child: const Text(
                            'HOSTED BY YOU',
                            style: TextStyle(
                              color: AppColors.accentGoldWarm,
                              fontSize: 9.5,
                              fontWeight: FontWeight.w800,
                              fontFamily: 'Poppins',
                              letterSpacing: 0.4,
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                      ],
                      // Price / Free badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          gradient: isFree
                              ? const LinearGradient(
                                  colors: [
                                    AppColors.gradientStart,
                                    AppColors.gradientEnd
                                  ],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                )
                              : null,
                          color: isFree ? null : AppColors.surfaceL4,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          isFree ? 'FREE' : priceStr,
                          style: TextStyle(
                            color: isFree ? Colors.black : Colors.white70,
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            fontFamily: 'Poppins',
                          ),
                        ),
                      ),
                    ]),
                    const SizedBox(height: 8),
                    Row(children: [
                      Icon(Icons.stadium_outlined,
                          size: 13,
                          color: Colors.white.withValues(alpha: 0.45)),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          city.isNotEmpty ? '$venueName · $city' : venueName,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.55),
                            fontSize: 12,
                            fontFamily: 'Poppins',
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ]),
                    const SizedBox(height: 4),
                    Row(children: [
                      Icon(LucideIcons.calendar,
                          size: 12,
                          color: Colors.white.withValues(alpha: 0.45)),
                      const SizedBox(width: 4),
                      Text(
                        date,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.45),
                          fontSize: 12,
                          fontFamily: 'Poppins',
                        ),
                      ),
                      if (time.isNotEmpty) ...[
                        Text(
                          '  ·  ',
                          style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.2),
                              fontSize: 12),
                        ),
                        Icon(LucideIcons.clock,
                            size: 12,
                            color: Colors.white.withValues(alpha: 0.45)),
                        const SizedBox(width: 4),
                        Text(
                          time,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.45),
                            fontSize: 12,
                            fontFamily: 'Poppins',
                          ),
                        ),
                      ],
                    ]),
                    const SizedBox(height: 12),
                    Row(children: [
                      // Player fill bar
                      if (maxMembers > 0) ...[
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '$currentMembers/$maxMembers players',
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.45),
                                  fontSize: 11,
                                  fontFamily: 'Poppins',
                                ),
                              ),
                              const SizedBox(height: 5),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: LinearProgressIndicator(
                                  value: maxMembers > 0
                                      ? currentMembers / maxMembers
                                      : 0,
                                  minHeight: 4,
                                  backgroundColor: Colors.white12,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    gradColors[0],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                      ] else
                        const Spacer(),

                      // Join button (or "Your Game" indicator for own hosts)
                      _JoinButton(
                        alreadyJoined: alreadyJoined,
                        isFull: isFull,
                        isJoining: isJoining,
                        isMine: isMine,
                        onJoin: onJoin,
                      ),
                    ]),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _JoinButton extends StatelessWidget {
  final bool alreadyJoined;
  final bool isFull;
  final bool isJoining;
  final bool isMine;
  final VoidCallback onJoin;

  const _JoinButton({
    required this.alreadyJoined,
    required this.isFull,
    required this.isJoining,
    required this.isMine,
    required this.onJoin,
  });

  @override
  Widget build(BuildContext context) {
    if (isMine) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
        decoration: BoxDecoration(
          color: AppColors.accentGoldWarm.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
              color: AppColors.accentGoldWarm.withValues(alpha: 0.5)),
        ),
        child: const Text(
          'Your Game',
          style: TextStyle(
            color: AppColors.accentGoldWarm,
            fontSize: 13,
            fontWeight: FontWeight.w700,
            fontFamily: 'Poppins',
          ),
        ),
      );
    }
    if (alreadyJoined) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
        decoration: BoxDecoration(
          color: AppColors.accentGreen.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(10),
          border:
              Border.all(color: AppColors.accentGreen.withValues(alpha: 0.4)),
        ),
        child: const Text(
          '✓ Joined',
          style: TextStyle(
            color: AppColors.accentGreen,
            fontSize: 13,
            fontWeight: FontWeight.w700,
            fontFamily: 'Poppins',
          ),
        ),
      );
    }
    if (isFull) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
        decoration: BoxDecoration(
          color: AppColors.surfaceL4,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          'Full',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.3),
            fontSize: 13,
            fontWeight: FontWeight.w700,
            fontFamily: 'Poppins',
          ),
        ),
      );
    }
    return GestureDetector(
      onTap: isJoining ? null : onJoin,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 9),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.gradientStart, AppColors.gradientEnd],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(10),
        ),
        child: isJoining
            ? const SizedBox(
                width: 14,
                height: 14,
                child: CircularProgressIndicator(
                    color: Colors.black, strokeWidth: 2))
            : const Text(
                'Join',
                style: TextStyle(
                  color: Colors.black,
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  fontFamily: 'Poppins',
                ),
              ),
      ),
    );
  }
}

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const _kSportGradients = <String, List<Color>>{
  'cricket': [AppColors.gradientStart, AppColors.accentBlueLight],
  'football': [AppColors.primary, AppColors.accentGreen],
  'basketball': [AppColors.accentOrange, AppColors.accentOrangeDeep],
  'tennis': [AppColors.accentYellow, AppColors.accentOrange],
  'badminton': [AppColors.gradientStart, AppColors.accentPurple],
  'volleyball': [AppColors.accentOrangeDeep, AppColors.accentPink],
};

const _kSportEmoji = <String, String>{
  'cricket': '🏏',
  'football': '⚽',
  'basketball': '🏀',
  'tennis': '🎾',
  'badminton': '🏸',
  'volleyball': '🏐',
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

/// Top-of-list section showing matches the user can watch right now (LIVE)
/// and their most recently completed matches. Hides completely when both
/// lists are empty.
class _LiveAndRecentSection extends ConsumerWidget {
  const _LiveAndRecentSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final live = ref.watch(joinGamesLiveProvider).valueOrNull ?? const [];
    final recent = ref.watch(joinGamesRecentProvider).valueOrNull ?? const [];
    if (live.isEmpty && recent.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (live.isNotEmpty) ...[
          const _SectionLabel(
              label: 'Live Now',
              icon: LucideIcons.video,
              color: AppColors.errorRed),
          const SizedBox(height: 8),
          SizedBox(
            height: 110,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: EdgeInsets.zero,
              itemCount: live.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (_, i) => _MatchFeedCard(
                game: live[i],
                isLive: true,
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],
        if (recent.isNotEmpty) ...[
          const _SectionLabel(
              label: 'Recent Scores',
              icon: LucideIcons.trophy,
              color: AppColors.accentGold),
          const SizedBox(height: 8),
          SizedBox(
            height: 110,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: EdgeInsets.zero,
              itemCount: recent.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (_, i) => _MatchFeedCard(
                game: recent[i],
                isLive: false,
              ),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ],
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  const _SectionLabel(
      {required this.label, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Icon(icon, size: 14, color: color),
      const SizedBox(width: 6),
      Text(label,
          style: TextStyle(
            color: color,
            fontSize: 13,
            fontWeight: FontWeight.w700,
            fontFamily: 'Poppins',
            letterSpacing: 0.2,
          )),
    ]);
  }
}

class _MatchFeedCard extends StatelessWidget {
  final Map<String, dynamic> game;
  final bool isLive;
  const _MatchFeedCard({required this.game, required this.isLive});

  @override
  Widget build(BuildContext context) {
    final id = (game['id'] ?? game['_id'])?.toString() ?? '';
    final sport = game['gameType']?.toString() ?? 'Match';
    final location = (game['turf'] is Map
            ? (game['turf'] as Map)['name']?.toString()
            : null) ??
        game['venue']?.toString() ??
        game['city']?.toString() ??
        '';
    final snap = game['scoring'] is Map
        ? (game['scoring'] as Map).cast<String, dynamic>()
        : null;
    final scoreLine = snap != null
        ? '${snap['teamARuns'] ?? '—'}/${snap['teamAWickets'] ?? '0'} vs ${snap['teamBRuns'] ?? '—'}/${snap['teamBWickets'] ?? '0'}'
        : 'View match';

    return GestureDetector(
      onTap: () {
        if (id.isEmpty) return;
        if (isLive) {
          context.push('/live-score', extra: {'matchId': id});
        } else {
          context.push('/scorecard', extra: {'matchId': id});
        }
      },
      child: Container(
        width: 230,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surfaceL2,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
              color: isLive
                  ? AppColors.errorRed.withValues(alpha: 0.4)
                  : AppColors.borderSoft),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              if (isLive)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.errorRed,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text('LIVE',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          fontFamily: 'Poppins')),
                ),
              if (isLive) const SizedBox(width: 6),
              Expanded(
                child: Text(sport,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Poppins',
                    )),
              ),
            ]),
            const SizedBox(height: 6),
            Text(location,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.5),
                    fontSize: 11,
                    fontFamily: 'Poppins')),
            const Spacer(),
            Text(scoreLine,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                    color:
                        isLive ? AppColors.errorRed : AppColors.accentBlueLight,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Poppins')),
          ],
        ),
      ),
    );
  }
}
