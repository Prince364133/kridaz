import 'dart:ui';
import '../core/constants/app_colors.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/services.dart';
import '../services/friends_service.dart';
import 'player_profile_screen.dart';

class NearbyPlayersSearchScreen extends StatefulWidget {
  const NearbyPlayersSearchScreen({Key? key}) : super(key: key);

  @override
  State<NearbyPlayersSearchScreen> createState() =>
      _NearbyPlayersSearchScreenState();
}

class _NearbyPlayersSearchScreenState extends State<NearbyPlayersSearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FriendsService _service = FriendsService();

  List<Map<String, dynamic>> _players = [];
  bool _isLoading = false;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadPlayers();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    final q = _searchController.text.trim().toLowerCase();
    if (q == _searchQuery) return;
    _searchQuery = q;
    _loadPlayers();
  }

  Future<void> _loadPlayers() async {
    setState(() => _isLoading = true);
    final results = await _service.searchPlayers(query: _searchQuery);
    if (mounted)
      setState(() {
        _players = results;
        _isLoading = false;
      });
  }

  Future<void> _toggleFollow(int index) async {
    final player = Map<String, dynamic>.from(_players[index]);
    final wasFollowing = player['isFollowing'] == true;
    // Optimistic update
    setState(() => _players[index] = {...player, 'isFollowing': !wasFollowing});

    final ok = wasFollowing
        ? await _service.unfollowPlayer(player['id'].toString())
        : await _service.followPlayer(player['id'].toString());

    if (!ok && mounted) {
      setState(() =>
          _players[index] = {..._players[index], 'isFollowing': wasFollowing});
    }
  }

  void _openProfile(Map<String, dynamic> player) {
    final profileData = {
      'name': player['name'] ?? '',
      'display_name': player['name'] ?? '',
      'photo_url': player['profilePicture'],
      'avatar': player['profilePicture'],
      'total_games_played': player['gamesPlayed'] ?? 0,
      'bio': player['bio'] ?? '',
    };
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => PlayerProfileScreen(playerData: profileData),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 12, 16, 4),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => context.pop(),
                    icon: const Icon(LucideIcons.arrowLeft,
                        color: Colors.white, size: 22),
                  ),
                  const Text(
                    'People',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Poppins',
                    ),
                  ),
                  const Spacer(),
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceL3,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(LucideIcons.sliders,
                        color: Colors.white, size: 18),
                  ),
                ],
              ),
            ),

            // Search bar (functional)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Container(
                height: 44,
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: AppColors.surfaceL3,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(LucideIcons.search,
                        size: 18, color: Colors.white.withValues(alpha: 0.40)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: _searchController,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontFamily: 'Poppins',
                        ),
                        decoration: InputDecoration(
                          hintText: 'Search players, handles...',
                          hintStyle: TextStyle(
                            fontSize: 14,
                            color: Colors.white.withValues(alpha: 0.40),
                            fontFamily: 'Poppins',
                          ),
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    ),
                    if (_searchQuery.isNotEmpty)
                      GestureDetector(
                        onTap: () => _searchController.clear(),
                        child: Icon(LucideIcons.x,
                            size: 16,
                            color: Colors.white.withValues(alpha: 0.40)),
                      ),
                  ],
                ),
              ),
            ),

            // Count chip
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                decoration: BoxDecoration(
                  color: AppColors.backgroundCard,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: ShaderMask(
                  shaderCallback: (bounds) => const LinearGradient(
                    colors: [AppColors.gradientStart, AppColors.gradientEnd],
                  ).createShader(bounds),
                  blendMode: BlendMode.srcIn,
                  child: Text(
                    _isLoading ? 'Searching...' : 'Players ${_players.length}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'Poppins',
                    ),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 4),

            // Player list
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        color: AppColors.gradientStart,
                        strokeWidth: 2,
                      ),
                    )
                  : _players.isEmpty
                      ? Center(
                          child: Text(
                            _searchQuery.isEmpty
                                ? 'No players found nearby'
                                : 'No results for "$_searchQuery"',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.4),
                              fontSize: 14,
                              fontFamily: 'Poppins',
                            ),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.only(
                              left: 16, right: 16, bottom: 20),
                          itemCount: _players.length,
                          itemBuilder: (context, index) =>
                              _buildPlayerTile(index),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlayerTile(int index) {
    final player = _players[index];
    final name = player['name']?.toString() ?? 'Player';
    final username = player['username']?.toString() ?? '';
    final profilePic = player['profilePicture']?.toString();
    final isOnline = player['isOnline'] == true;
    final isFollowing = player['isFollowing'] == true;
    final distRaw = player['distanceKm'];
    final distNum = distRaw is num
        ? distRaw.toDouble()
        : (distRaw == null ? null : double.tryParse(distRaw.toString()));
    final distance = distNum == null ? '' : '${distNum.toStringAsFixed(1)}km';
    final sports = player['sportTypes'];
    final sport = (sports is List && sports.isNotEmpty)
        ? sports.first.toString()
        : (player['sport']?.toString() ?? '');

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => _openProfile(player),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        child: Row(
          children: [
            // Avatar
            Stack(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isOnline
                          ? AppColors.gradientStart
                          : Colors.transparent,
                      width: 2,
                    ),
                  ),
                  child: ClipOval(
                    child: profilePic != null && profilePic.isNotEmpty
                        ? Image.network(
                            profilePic,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => _avatarFallback(name),
                          )
                        : _avatarFallback(name),
                  ),
                ),
                if (isOnline)
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 16,
                      height: 16,
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
                        border: Border.all(color: Colors.black, width: 2),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),

            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'Poppins',
                    ),
                  ),
                  const SizedBox(height: 2),
                  ShaderMask(
                    shaderCallback: (bounds) => const LinearGradient(
                      colors: [AppColors.gradientStart, AppColors.gradientEnd],
                    ).createShader(bounds),
                    blendMode: BlendMode.srcIn,
                    child: Text(
                      [
                        if (username.isNotEmpty) '@$username',
                        if (distance.isNotEmpty) distance,
                      ].join(' · '),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontFamily: 'Poppins',
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      if (isOnline) ...[
                        ShaderMask(
                          shaderCallback: (bounds) => const LinearGradient(
                            colors: [
                              AppColors.gradientStart,
                              AppColors.gradientEnd
                            ],
                          ).createShader(bounds),
                          blendMode: BlendMode.srcIn,
                          child: const Text(
                            'Online',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              fontFamily: 'Poppins',
                            ),
                          ),
                        ),
                        if (sport.isNotEmpty)
                          ShaderMask(
                            shaderCallback: (bounds) => const LinearGradient(
                              colors: [
                                AppColors.gradientStart,
                                AppColors.gradientEnd
                              ],
                            ).createShader(bounds),
                            blendMode: BlendMode.srcIn,
                            child: const Text(
                              ' · ',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontFamily: 'Poppins'),
                            ),
                          ),
                      ],
                      if (sport.isNotEmpty)
                        ShaderMask(
                          shaderCallback: (bounds) => const LinearGradient(
                            colors: [
                              AppColors.gradientStart,
                              AppColors.gradientEnd
                            ],
                          ).createShader(bounds),
                          blendMode: BlendMode.srcIn,
                          child: Text(
                            sport,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              fontFamily: 'Poppins',
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),

            // Follow button — absorbs tap so profile doesn't open
            GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () {
                HapticFeedback.lightImpact();
                _toggleFollow(index);
              },
              child:
                  isFollowing ? _buildFollowingButton() : _buildFollowButton(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFollowButton() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: [AppColors.gradientStart, AppColors.primary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      padding: const EdgeInsets.all(1.2),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(19),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.55),
              borderRadius: BorderRadius.circular(19),
            ),
            child: const Text(
              'Follow',
              style: TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w600,
                fontFamily: 'Poppins',
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFollowingButton() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: [AppColors.gradientStart, AppColors.textLightGray],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      padding: const EdgeInsets.all(1.2),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(19),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.55),
              borderRadius: BorderRadius.circular(19),
            ),
            child: const Text(
              'Following',
              style: TextStyle(
                color: AppColors.gradientStart,
                fontSize: 12,
                fontWeight: FontWeight.w600,
                fontFamily: 'Poppins',
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _avatarFallback(String name) {
    const colors = [
      AppColors.gradientStart,
      AppColors.primary,
      AppColors.accentYellow,
      AppColors.errorRed,
      AppColors.accentPurple,
    ];
    final color = colors[name.codeUnitAt(0) % colors.length];
    return Container(
      color: color.withValues(alpha: 0.3),
      child: Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : '?',
          style: TextStyle(
            color: color,
            fontSize: 22,
            fontWeight: FontWeight.bold,
            fontFamily: 'Poppins',
          ),
        ),
      ),
    );
  }
}
