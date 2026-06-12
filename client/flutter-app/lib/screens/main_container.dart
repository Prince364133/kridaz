import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/constants/app_colors.dart';
import '../providers/navigation_provider.dart';
import '../widgets/navigation/glass_bottom_navigation.dart';
import 'home/profile_drawer.dart';
import 'new_home_dashboard.dart';
import 'nearby_players_home_screen.dart';
import 'professionals_screen.dart';
import 'new_search_screen.dart';
import 'games_screen.dart';

class MainContainer extends ConsumerStatefulWidget {
  const MainContainer({Key? key}) : super(key: key);

  @override
  ConsumerState<MainContainer> createState() => _MainContainerState();
}

class _MainContainerState extends ConsumerState<MainContainer> {
  // Keep screens as instance variables to prevent recreation on rebuild
  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      const NewHomeDashboard(), // 0 — Home
      const NewSearchScreen(), // 1 — Arena (Book Ground)
      const ProfessionalsScreen(), // 2 — Pros
      const NearbyPlayersHomeScreen(), // 3 — Nearby Players
      const GamesScreen(), // 4 — Games (Join/Tournaments/Teams)
    ];
  }

  @override
  Widget build(BuildContext context) {
    final currentIndex = ref.watch(navigationProvider);
    final drawerOpen = ref.watch(profileDrawerOpenProvider);
    final drawerWidth = MediaQuery.of(context).size.width * 0.82;

    return PopScope(
      // Only allow the route to actually pop (exit the app) when we're on
      // the Home tab AND the drawer isn't open. The drawer intercepts back
      // first; pressing back on a non-home tab switches to Home rather than
      // exiting.
      canPop: currentIndex == 0 && !drawerOpen,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        if (drawerOpen) {
          ref.read(profileDrawerOpenProvider.notifier).state = false;
          return;
        }
        if (currentIndex != 0) {
          ref.read(navigationProvider.notifier).setIndex(0);
        }
      },
      child: Scaffold(
        backgroundColor: AppColors.backgroundBlack,
        extendBody: true,
        body: SafeArea(
          top: true,
          bottom: false, // Don't apply to bottom to allow glass nav to work
          child: Stack(
            children: [
              RepaintBoundary(
                child: IndexedStack(
                  index: currentIndex,
                  children: _screens,
                ),
              ),

              // Backdrop — taps anywhere outside the drawer to close it.
              if (drawerOpen)
                Positioned.fill(
                  child: GestureDetector(
                    onTap: () => ref
                        .read(profileDrawerOpenProvider.notifier)
                        .state = false,
                    child: Container(
                      color: Colors.black.withValues(alpha: 0.55),
                    ),
                  ),
                ),

              // Left-side profile drawer — slides in from the burger icon.
              // Mounted at the shell level so the burger in any tab's
              // HomeHeader can open it.
              AnimatedPositioned(
                top: 0,
                bottom: 0,
                left: drawerOpen ? 0 : -drawerWidth,
                width: drawerWidth,
                duration: const Duration(milliseconds: 280),
                curve: Curves.easeInOut,
                child: ProfileDrawer(
                  onClose: () => ref
                      .read(profileDrawerOpenProvider.notifier)
                      .state = false,
                ),
              ),
            ],
          ),
        ),
        bottomNavigationBar: const RepaintBoundary(
          child: GlassBottomNavigation(
            iconPaths: [
              'assets/icons/nav_home.png',
              'assets/icons/nav_arena.png',
              'assets/icons/nav_shop.png',
              'assets/icons/nav_community.png',
              'assets/icons/nav_profile.png',
            ],
            labels: ['HOME', 'ARENA', 'PROS', 'NEARBY', 'GAMES'],
          ),
        ),
      ),
    );
  }

  // ignore: unused_element
  Widget _buildComingSoonScreen(String title) {
    return Scaffold(
      backgroundColor: AppColors.backgroundBlack,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.construction,
                size: 80, color: Colors.white.withValues(alpha: 0.3)),
            const SizedBox(height: 24),
            Text('$title Coming Soon',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            Text('This feature is under development',
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.6), fontSize: 14)),
          ],
        ),
      ),
    );
  }
}
