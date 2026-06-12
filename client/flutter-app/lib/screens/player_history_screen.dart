import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/services.dart';
import '../core/constants/app_colors.dart';

class PlayerHistoryScreen extends StatefulWidget {
  const PlayerHistoryScreen({Key? key}) : super(key: key);

  @override
  State<PlayerHistoryScreen> createState() => _PlayerHistoryScreenState();
}

class _PlayerHistoryScreenState extends State<PlayerHistoryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
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
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
          onPressed: () {
            HapticFeedback.lightImpact();
            context.pop();
          },
        ),
        title: const Text(
          'My Games',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          indicatorWeight: 2,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white.withValues(alpha: 0.5),
          labelStyle: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
          unselectedLabelStyle: const TextStyle(
            fontWeight: FontWeight.w400,
            fontSize: 14,
          ),
          tabs: const [
            Tab(text: 'Hosted Games'),
            Tab(text: 'Played Games'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildHostedGames(),
          _buildPlayedGames(),
        ],
      ),
    );
  }

  Widget _buildHostedGames() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Today Section
          Text(
            'Today',
            style: TextStyle(
              color: AppColors.primary,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          _buildGameCard(
            title: 'Cricket Match',
            time: '10:00 AM - 1:00 PM',
            location: 'Central Park',
            isToday: true,
          ),

          const SizedBox(height: 24),

          // Completed Section
          const Text(
            'Completed',
            style: TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          _buildGameCard(
            title: 'Cricket Match',
            time: '10:00 AM - 1:00 PM',
            location: 'Central Park',
          ),
          const SizedBox(height: 12),
          _buildGameCard(
            title: 'Cricket Match',
            time: '10:00 AM - 1:00 PM',
            location: 'Central Park',
          ),
        ],
      ),
    );
  }

  Widget _buildPlayedGames() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildGameCard(
            title: 'Cricket Match',
            time: '10:00 AM - 1:00 PM',
            location: 'Central Park',
          ),
          const SizedBox(height: 12),
          _buildGameCard(
            title: 'Cricket Match',
            time: '10:00 AM - 1:00 PM',
            location: 'Central Park',
          ),
          const SizedBox(height: 12),
          _buildGameCard(
            title: 'Cricket Match',
            time: '10:00 AM - 1:00 PM',
            location: 'Central Park',
          ),
          const SizedBox(height: 12),
          _buildGameCard(
            title: 'Cricket Match',
            time: '10:00 AM - 1:00 PM',
            location: 'Central Park',
          ),
          const SizedBox(height: 12),
          _buildGameCard(
            title: 'Cricket Match',
            time: '10:00 AM - 1:00 PM',
            location: 'Central Park',
          ),
        ],
      ),
    );
  }

  Widget _buildGameCard({
    required String title,
    required String time,
    required String location,
    bool isToday = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceL3,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          // Game details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  time,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.6),
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  location,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.6),
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                  ),
                ),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: () {
                    // Navigate to game details
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: BorderSide(
                      color: Colors.white.withValues(alpha: 0.3),
                      width: 1,
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    minimumSize: const Size(0, 0),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'View Details',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(width: 12),

          // Game image
          Container(
            width: 120,
            height: 100,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              image: const DecorationImage(
                image: NetworkImage(
                  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400',
                ),
                fit: BoxFit.cover,
                onError: null,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
