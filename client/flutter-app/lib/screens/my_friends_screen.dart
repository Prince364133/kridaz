import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../services/chat_service.dart';
import '../services/friends_service.dart';
import 'player_profile_screen.dart';

class MyFriendsScreen extends StatefulWidget {
  const MyFriendsScreen({Key? key}) : super(key: key);

  @override
  State<MyFriendsScreen> createState() => _MyFriendsScreenState();
}

class _MyFriendsScreenState extends State<MyFriendsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final FriendsService _friendsService = FriendsService();

  List<Map<String, dynamic>> _following = [];
  List<Map<String, dynamic>> _followers = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final network = await _friendsService.getNetwork();
    setState(() {
      _following = network['following'] ?? [];
      _followers = network['followers'] ?? [];
      _isLoading = false;
    });
  }

  Future<void> _unfollow(String playerId) async {
    final ok = await _friendsService.unfollowPlayer(playerId);
    if (ok && mounted) {
      setState(
          () => _following.removeWhere((p) => p['id'].toString() == playerId));
    }
  }

  Future<void> _followBack(String playerId) async {
    final ok = await _friendsService.followPlayer(playerId);
    if (ok && mounted) {
      setState(() {
        final idx =
            _followers.indexWhere((p) => p['id'].toString() == playerId);
        if (idx != -1) {
          _followers[idx] = {..._followers[idx], 'isFollowing': true};
        }
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
          'Network',
          style: TextStyle(
              color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
        ),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: Colors.grey,
          tabs: [
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Following'),
                  if (_following.isNotEmpty) ...[
                    const SizedBox(width: 6),
                    _countBadge('${_following.length}',
                        color: AppColors.primary),
                  ],
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Followers'),
                  if (_followers.isNotEmpty) ...[
                    const SizedBox(width: 6),
                    _countBadge('${_followers.length}',
                        color: AppColors.primary),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildFollowingList(),
                _buildFollowersList(),
              ],
            ),
    );
  }

  Widget _countBadge(String text, {required Color color}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration:
          BoxDecoration(color: color, borderRadius: BorderRadius.circular(10)),
      child: Text(text,
          style: const TextStyle(
              color: Colors.black, fontSize: 10, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildFollowingList() {
    if (_following.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.users, size: 64, color: Colors.grey[700]),
            const SizedBox(height: 16),
            Text('Not following anyone yet',
                style: TextStyle(color: Colors.grey[500], fontSize: 16)),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _loadData,
      color: AppColors.primary,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _following.length,
        itemBuilder: (context, index) => _buildFollowingCard(_following[index]),
      ),
    );
  }

  Widget _buildFollowersList() {
    if (_followers.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.user, size: 64, color: Colors.grey[700]),
            const SizedBox(height: 16),
            Text('No followers yet',
                style: TextStyle(color: Colors.grey[500], fontSize: 16)),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _loadData,
      color: AppColors.primary,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _followers.length,
        itemBuilder: (context, index) => _buildFollowerCard(_followers[index]),
      ),
    );
  }

  Widget _buildFollowingCard(Map<String, dynamic> player) {
    final name = player['name']?.toString() ?? 'Unknown';
    final profilePic = player['profilePicture']?.toString();
    final playerId = player['id']?.toString() ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
          color: Colors.grey[900], borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          GestureDetector(
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
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.primary, width: 2),
              ),
              child: ClipOval(
                child: profilePic != null && profilePic.isNotEmpty
                    ? Image.network(profilePic,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _defaultAvatar())
                    : _defaultAvatar(),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(name,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600)),
          ),
          Row(
            children: [
              // Message button
              GestureDetector(
                onTap: () async {
                  HapticFeedback.lightImpact();
                  final chat = await ChatService().accessChat(playerId);
                  if (!context.mounted) return;
                  context.push('/chat', extra: {
                    'chatId': chat?.id ?? '',
                    'friendId': playerId,
                    'friendName': name,
                    'friendPhoto': profilePic,
                    'isGroup': false,
                    'members': const <Map<String, dynamic>>[],
                  });
                },
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(8)),
                  child: const Icon(LucideIcons.messageCircle,
                      color: Colors.black, size: 20),
                ),
              ),
              const SizedBox(width: 8),
              // Unfollow button
              GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  _unfollow(playerId);
                },
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey[600]!),
                  ),
                  child: const Icon(Icons.person_remove,
                      color: Colors.grey, size: 20),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFollowerCard(Map<String, dynamic> player) {
    final name = player['name']?.toString() ?? 'Unknown';
    final profilePic = player['profilePicture']?.toString();
    final playerId = player['id']?.toString() ?? '';
    final alreadyFollowing = player['isFollowing'] == true ||
        _following.any((f) => f['id'].toString() == playerId);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
          color: Colors.grey[900], borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          GestureDetector(
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
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.grey[600]!, width: 2),
              ),
              child: ClipOval(
                child: profilePic != null && profilePic.isNotEmpty
                    ? Image.network(profilePic,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _defaultAvatar())
                    : _defaultAvatar(),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(name,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600)),
          ),
          GestureDetector(
            onTap: alreadyFollowing
                ? null
                : () {
                    HapticFeedback.lightImpact();
                    _followBack(playerId);
                  },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color:
                    alreadyFollowing ? Colors.transparent : AppColors.primary,
                borderRadius: BorderRadius.circular(20),
                border: alreadyFollowing
                    ? Border.all(color: AppColors.primary)
                    : null,
              ),
              child: Text(
                alreadyFollowing ? 'Following' : 'Follow Back',
                style: TextStyle(
                  color: alreadyFollowing ? AppColors.primary : Colors.black,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _defaultAvatar() => Container(
        color: Colors.grey[800],
        child: Icon(LucideIcons.user, color: Colors.grey[600], size: 30),
      );

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
}
