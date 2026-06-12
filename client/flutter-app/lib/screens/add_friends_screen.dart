import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/services.dart';
import '../core/constants/app_colors.dart';
import '../core/util/image_url.dart';
import '../services/friends_service.dart';
import 'player_profile_screen.dart';

class AddFriendsScreen extends StatefulWidget {
  final double latitude;
  final double longitude;
  final int radiusKm;

  const AddFriendsScreen({
    Key? key,
    required this.latitude,
    required this.longitude,
    this.radiusKm = 25,
  }) : super(key: key);

  @override
  State<AddFriendsScreen> createState() => _AddFriendsScreenState();
}

class _AddFriendsScreenState extends State<AddFriendsScreen> {
  final FriendsService _friendsService = FriendsService();
  final TextEditingController _searchController = TextEditingController();

  List<Map<String, dynamic>> _nearbyPlayers = [];
  List<Map<String, dynamic>> _filteredPlayers = [];
  bool _isLoading = true;

  // Filters
  String? _selectedGender;
  List<String> _selectedSports = [];

  final List<String> _genderOptions = ['Male', 'Female', 'Other'];
  final List<String> _sportsOptions = [
    'Cricket',
    'Football',
    'Basketball',
    'Tennis',
    'Badminton',
    'Swimming',
    'Hockey',
    'Volleyball'
  ];

  @override
  void initState() {
    super.initState();
    _loadNearbyPlayers();
  }

  Future<void> _loadNearbyPlayers() async {
    setState(() => _isLoading = true);
    final players = await _friendsService.getNearbyPlayers(
      latitude: widget.latitude,
      longitude: widget.longitude,
      radiusKm: widget.radiusKm,
    );
    setState(() {
      _nearbyPlayers = players;
      _filteredPlayers = players;
      _isLoading = false;
    });
  }

  void _filterPlayers(String query) {
    if (query.isEmpty) {
      setState(() => _filteredPlayers = _nearbyPlayers);
      return;
    }
    setState(() {
      _filteredPlayers = _nearbyPlayers.where((player) {
        final name = (player['name'] ?? '').toString().toLowerCase();
        final username = (player['username'] ?? '').toString().toLowerCase();
        return name.contains(query.toLowerCase()) ||
            username.contains(query.toLowerCase());
      }).toList();
    });
  }

  Future<void> _toggleFollow(Map<String, dynamic> player) async {
    final playerId = player['id']?.toString() ?? '';
    if (playerId.isEmpty) return;

    final wasFollowing = player['isFollowing'] == true;

    // Optimistic update
    setState(() {
      final idx = _filteredPlayers.indexWhere((p) => p['id'] == player['id']);
      if (idx != -1)
        _filteredPlayers[idx] = {
          ..._filteredPlayers[idx],
          'isFollowing': !wasFollowing
        };
      final ni = _nearbyPlayers.indexWhere((p) => p['id'] == player['id']);
      if (ni != -1)
        _nearbyPlayers[ni] = {
          ..._nearbyPlayers[ni],
          'isFollowing': !wasFollowing
        };
    });

    final ok = wasFollowing
        ? await _friendsService.unfollowPlayer(playerId)
        : await _friendsService.followPlayer(playerId);

    if (!ok && mounted) {
      setState(() {
        final idx = _filteredPlayers.indexWhere((p) => p['id'] == player['id']);
        if (idx != -1)
          _filteredPlayers[idx] = {
            ..._filteredPlayers[idx],
            'isFollowing': wasFollowing
          };
        final ni = _nearbyPlayers.indexWhere((p) => p['id'] == player['id']);
        if (ni != -1)
          _nearbyPlayers[ni] = {
            ..._nearbyPlayers[ni],
            'isFollowing': wasFollowing
          };
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Nearby Players',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.sliders, color: Colors.white),
            onPressed: _showFilterSheet,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.grey[900],
                borderRadius: BorderRadius.circular(12),
              ),
              child: TextField(
                controller: _searchController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Search players...',
                  hintStyle: TextStyle(color: Colors.grey[500]),
                  prefixIcon:
                      const Icon(LucideIcons.search, color: Colors.grey),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                ),
                onChanged: _filterPlayers,
              ),
            ),
          ),

          // Active filter chips
          if (_selectedGender != null || _selectedSports.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    if (_selectedGender != null)
                      _buildFilterChip(_selectedGender!, () {
                        setState(() => _selectedGender = null);
                        _loadNearbyPlayers();
                      }),
                    ..._selectedSports
                        .map((sport) => _buildFilterChip(sport, () {
                              setState(() => _selectedSports.remove(sport));
                              _loadNearbyPlayers();
                            })),
                  ],
                ),
              ),
            ),

          const SizedBox(height: 8),

          // Players list
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: AppColors.primary))
                : _filteredPlayers.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.person_search,
                                size: 64, color: Colors.grey[700]),
                            const SizedBox(height: 16),
                            Text(
                              'No players found nearby',
                              style: TextStyle(
                                  color: Colors.grey[500], fontSize: 16),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _filteredPlayers.length,
                        itemBuilder: (context, index) =>
                            _buildPlayerCard(_filteredPlayers[index]),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, VoidCallback onRemove) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primary),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label,
              style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 12,
                  fontWeight: FontWeight.w500)),
          const SizedBox(width: 4),
          GestureDetector(
            onTap: onRemove,
            child: Icon(LucideIcons.x, size: 14, color: AppColors.primary),
          ),
        ],
      ),
    );
  }

  Widget _buildPlayerCard(Map<String, dynamic> player) {
    final name = player['name']?.toString() ?? 'Unknown';
    final profilePic = player['profilePicture']?.toString();
    final isFollowing = player['isFollowing'] == true;
    final sports = player['sportTypes'];
    final sport = (sports is List && sports.isNotEmpty)
        ? (sports as List).take(2).join(', ')
        : (player['sport']?.toString() ?? '');
    final distanceKm = player['distanceKm'];
    final distNum = distanceKm is num
        ? distanceKm.toDouble()
        : (distanceKm == null ? null : double.tryParse(distanceKm.toString()));
    final distance =
        distNum == null ? null : '${distNum.toStringAsFixed(1)} km away';

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (_) => PlayerProfileScreen(playerData: player),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.grey[900],
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            // Avatar
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.primary, width: 2),
              ),
              child: ClipOval(
                child: isHttpUrl(profilePic)
                    ? Image.network(profilePic!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _defaultAvatar())
                    : _defaultAvatar(),
              ),
            ),
            const SizedBox(width: 12),

            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      if (distance != null)
                        Text(distance,
                            style: TextStyle(
                                color: Colors.grey[500], fontSize: 12)),
                      if (distance != null && sport.isNotEmpty)
                        Text(' • ', style: TextStyle(color: Colors.grey[500])),
                      if (sport.isNotEmpty)
                        Text(sport,
                            style: TextStyle(
                                color: Colors.grey[500], fontSize: 12)),
                    ],
                  ),
                ],
              ),
            ),

            // Follow / Following button
            GestureDetector(
              onTap: () {
                HapticFeedback.lightImpact();
                _toggleFollow(player);
              },
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: isFollowing ? Colors.transparent : AppColors.primary,
                  borderRadius: BorderRadius.circular(20),
                  border:
                      isFollowing ? Border.all(color: AppColors.primary) : null,
                ),
                child: Text(
                  isFollowing ? 'Following' : 'Follow',
                  style: TextStyle(
                    color: isFollowing ? AppColors.primary : Colors.black,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _defaultAvatar() => Container(
        color: Colors.grey[800],
        child: Icon(LucideIcons.user, color: Colors.grey[600], size: 30),
      );

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding: const EdgeInsets.all(24),
          decoration: const BoxDecoration(
            color: AppColors.surfaceL3,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[600],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Filters',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold)),
                  TextButton(
                    onPressed: () {
                      setModalState(() {
                        _selectedGender = null;
                        _selectedSports.clear();
                      });
                    },
                    child: Text('Clear All',
                        style: TextStyle(color: AppColors.primary)),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              const Text('Gender',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                children: _genderOptions.map((gender) {
                  final isSelected = _selectedGender == gender;
                  return GestureDetector(
                    onTap: () => setModalState(() {
                      _selectedGender = isSelected ? null : gender;
                    }),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color:
                            isSelected ? AppColors.primary : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                            color: isSelected
                                ? AppColors.primary
                                : Colors.grey[700]!),
                      ),
                      child: Text(gender,
                          style: TextStyle(
                              color: isSelected ? Colors.black : Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w500)),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),
              const Text('Sports',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _sportsOptions.map((sport) {
                  final isSelected = _selectedSports.contains(sport);
                  return GestureDetector(
                    onTap: () => setModalState(() {
                      if (isSelected) {
                        _selectedSports.remove(sport);
                      } else {
                        _selectedSports.add(sport);
                      }
                    }),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color:
                            isSelected ? AppColors.primary : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                            color: isSelected
                                ? AppColors.primary
                                : Colors.grey[700]!),
                      ),
                      child: Text(sport,
                          style: TextStyle(
                              color: isSelected ? Colors.black : Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w500)),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    context.pop();
                    setState(() {});
                    _loadNearbyPlayers();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Apply Filters',
                      style: TextStyle(
                          color: Colors.black,
                          fontSize: 16,
                          fontWeight: FontWeight.w600)),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}
