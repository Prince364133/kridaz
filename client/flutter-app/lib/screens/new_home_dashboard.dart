import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../widgets/common/bms_toast.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:video_player/video_player.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../core/constants/app_colors.dart';
import '../providers/user_provider.dart';
import '../providers/navigation_provider.dart';
import '../providers/home_actions_provider.dart';
import '../providers/reels_feed_provider.dart';
import '../providers/story_provider.dart';
import '../providers/notification_provider.dart';
import 'package:geolocator/geolocator.dart';
import '../services/reel_api_service.dart';
import '../services/turf_service.dart';
import '../services/story_service.dart';
import '../services/auth_manager.dart';
import '../services/game_service.dart';
import '../services/match_feed_service.dart';
import '../widgets/scoring/live_match_card.dart';
import '../providers/location_provider.dart';
import '../services/friends_service.dart';
import '../services/chat_service.dart';
import '../models/story_model.dart';
import 'reel_community_view.dart';
import '../widgets/home/quick_action_icons_3d.dart';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DESIGN TOKENS  â† single source of truth, all values from Figma analysis
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// Spacing (8pt grid)
const _pH = 20.0; // horizontal page padding
const _gSec = 36.0; // gap between sections
const _gCard = 14.0; // gap between horizontal-scroll cards

// Border radii
const _r6 = 6.0;
const _r8 = 8.0;
const _r10 = 10.0; // post-card
const _r12 = 12.0; // standard card
const _r14 = 14.0; // game card
const _r20 = 20.0; // pill

// Palette
const _cCard = AppColors.surfaceL3; // card bg
const _cDark = AppColors.surfaceL0; // action / learn-more bars
// Slick translucent black per Players Nearby design — near-black with a
// hint of warmth so it sits distinctly on the page bg.
const _cPlayer = Color(0xFF0E0E10); // player tile bg
const _cSub = AppColors.textDarkGray; // secondary text
const _cMid = AppColors.textLightGray; // mid-grey text
const _cGray = AppColors.textGray; // tertiary text / location

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DATA MODELS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// (Upcoming Events replaced by Feature Cards — see _FeatureCardsGrid below)

class _GroundItem {
  final String name, distance;
  final double rating, pricePerHour;
  final int reviewCount;
  final String? imageUrl, localImagePath;
  final String turfId;
  const _GroundItem(
      {required this.name,
      required this.distance,
      required this.rating,
      required this.pricePerHour,
      this.reviewCount = 0,
      this.imageUrl,
      this.localImagePath,
      this.turfId = ''});
}

/// Returns true if [value] parses as an http(s) URL with a non-empty host.
/// Used to guard CachedNetworkImage against legacy backend responses that
/// return bare filenames like "turf_ Wembley.jpg" in the image field.
bool _isHttpUrl(String? value) {
  if (value == null || value.isEmpty) return false;
  final uri = Uri.tryParse(value);
  return uri != null &&
      (uri.scheme == 'http' || uri.scheme == 'https') &&
      uri.host.isNotEmpty;
}

class _ReelItem {
  final String label, views;
  final List<Color> gradientColors;
  final String? localImagePath;
  final String? videoPath;
  const _ReelItem({
    required this.label,
    required this.views,
    required this.gradientColors,
    this.localImagePath,
    this.videoPath,
  });
}

class _GameItem {
  final String playerName, location, role, sport;
  final List<Color> bgGradient;
  final IconData sportIcon;
  final String? playerImagePath;
  const _GameItem({
    required this.playerName,
    required this.location,
    required this.role,
    required this.sport,
    required this.bgGradient,
    required this.sportIcon,
    this.playerImagePath,
  });
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STATIC DATA
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

final List<_ReelItem> _reels = [
  const _ReelItem(
    label: 'GAME',
    views: '12k',
    gradientColors: [AppColors.surfaceSlateDeep, AppColors.surfaceSlate],
    localImagePath: 'assets/images/home/reel_1.png',
    videoPath: 'assets/videos/reel_sample.mp4',
  ),
  const _ReelItem(
    label: 'HAMILTON',
    views: '8.4k',
    gradientColors: [AppColors.surfaceSlateDeep, AppColors.surfaceSlate],
    localImagePath: 'assets/images/home/reel_2.png',
    videoPath: 'assets/videos/reel_sample.mp4',
  ),
  const _ReelItem(
    label: 'SKILLS',
    views: '21k',
    gradientColors: [AppColors.accentPurple, AppColors.purpleGradientEnd],
    localImagePath: 'assets/images/home/reel_3.png',
    videoPath: 'assets/videos/reel_sample.mp4',
  ),
];

final List<_GameItem> _games = [
  _GameItem(
      playerName: 'Sampad',
      role: 'Host',
      sport: 'Cricket',
      location: 'Malakpet, Hyderabad',
      bgGradient: const [AppColors.accentBlue, AppColors.accentBlueDark],
      sportIcon: Icons.sports_cricket,
      playerImagePath: 'assets/images/home/join_game_cricket.jpg'),
  _GameItem(
      playerName: 'Raj',
      role: 'Player',
      sport: 'Tennis',
      location: 'Banjara Hills, Hyd',
      bgGradient: const [AppColors.surfaceForest, AppColors.surfaceForestDeep],
      sportIcon: Icons.sports_tennis,
      playerImagePath: 'assets/images/home/join_game_tennis.jpg'),
  _GameItem(
      playerName: 'Arjun',
      role: 'Host',
      sport: 'Cricket',
      location: 'Gachibowli, Hyd',
      bgGradient: const [AppColors.accentBlue, AppColors.accentBlueDark],
      sportIcon: Icons.sports_cricket,
      playerImagePath: 'assets/images/home/join_game_cricket.jpg'),
  _GameItem(
      playerName: 'Priya',
      role: 'Player',
      sport: 'Tennis',
      location: 'Kondapur, Hyderabad',
      bgGradient: const [AppColors.surfaceForest, AppColors.surfaceForestDeep],
      sportIcon: Icons.sports_tennis,
      playerImagePath: 'assets/images/home/join_game_tennis.jpg'),
  _GameItem(
      playerName: 'Vikram',
      role: 'Host',
      sport: 'Cricket',
      location: 'Kukatpally, Hyd',
      bgGradient: const [AppColors.accentBlue, AppColors.accentBlueDark],
      sportIcon: Icons.sports_cricket,
      playerImagePath: 'assets/images/home/join_game_cricket.jpg'),
];

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ROOT WIDGET
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

class NewHomeDashboard extends ConsumerStatefulWidget {
  const NewHomeDashboard({Key? key}) : super(key: key);

  @override
  ConsumerState<NewHomeDashboard> createState() => _NewHomeDashboardState();
}

class _NewHomeDashboardState extends ConsumerState<NewHomeDashboard>
    with WidgetsBindingObserver {
  // The side profile drawer used to live here. It's now lifted to
  // MainContainer so opening it from any tab's HomeHeader works and the
  // overlay covers the entire shell (including the bottom nav).

  /// Pull-to-refresh on the home feed. Invalidates every data provider the
  /// dashboard surfaces so the next watch fires a fresh fetch. The small
  /// delay keeps the spinner visible long enough for the user to register
  /// that the refresh actually happened.
  Future<void> _refreshHome() async {
    ref.invalidate(walletBalanceProvider);
    ref.invalidate(storyGroupsProvider);
    ref.invalidate(nearbyGamesProvider);
    ref.invalidate(unreadNotificationCountProvider);
    ref.invalidate(reelsFeedProvider(ReelFeedType.recommended));
    ref.invalidate(liveMatchesProvider);
    ref.invalidate(recentMatchesProvider);
    await Future<void>.delayed(const Duration(milliseconds: 400));
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Refresh the header coin pill whenever the app returns to the foreground.
    if (state == AppLifecycleState.resumed) {
      ref.invalidate(walletBalanceProvider);
    }
  }

  @override
  Widget build(BuildContext context) {
    // The home screen is kept alive inside an IndexedStack, so its build only
    // re-runs (and the coin pill only refreshes) when something it watches
    // changes. Re-fetch the wallet balance each time the Home tab is selected
    // so the header always shows the up-to-date amount.
    ref.listen<int>(navigationProvider, (prev, next) {
      if (next == 0 && prev != 0) {
        ref.invalidate(walletBalanceProvider);
      }
    });

    return Material(
      color: Colors.black,
      child: Stack(
        children: [
          RefreshIndicator(
            onRefresh: _refreshHome,
            color: AppColors.primary,
            backgroundColor: AppColors.surfaceL1,
            child: SingleChildScrollView(
              // AlwaysScrollable so the pull-down gesture still fires
              // even when the content is shorter than the viewport.
              physics: const AlwaysScrollableScrollPhysics(
                  parent: BouncingScrollPhysics()),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const HomeHeader(),
                  const SizedBox(height: 20),
                  _SportsStoryRow(),
                  const SizedBox(height: 12),

                  // Feature strip — horizontal scroll, 6 shortcuts
                  const _FeatureCardsGrid(),
                  const SizedBox(height: 12),

                  // Live/Result banner — only renders when match is active or just
                  // finished. Sits below the feature strip so the primary nav is
                  // never bumped down by transient live-state content.
                  const _LiveMatchBanner(),
                  const SizedBox(height: _gSec),

                  // PRIORITY 1 — Grounds Near You
                  _SectionHeader(
                    title: 'Grounds Near You',
                    actionLabel: 'View all',
                    onActionTap: () {
                      ref.read(navigationProvider.notifier).setIndex(1);
                    },
                  ),
                  const SizedBox(height: 14),
                  const _GroundsRow(),
                  const SizedBox(height: _gSec),

                  // PRIORITY 2 — Players Nearby
                  _SectionHeader(
                    title: 'Players Nearby',
                    actionLabel: 'Find More',
                    onActionTap: () {
                      ref.read(navigationProvider.notifier).setIndex(3);
                    },
                  ),
                  const SizedBox(height: 14),
                  const _PlayersNearbyList(),
                  const SizedBox(height: _gSec),

                  // PRIORITY 3 — Join a Game
                  _SectionHeader(
                    title: 'Join a Game',
                    actionLabel: 'View all',
                    onActionTap: () {
                      ref.read(navigationProvider.notifier).setIndex(4);
                    },
                  ),
                  const SizedBox(height: 14),
                  const _SportsTray(),
                  const SizedBox(height: _gSec),

                  // Recent Match Scores — "Live Now" jumps to the discovery list
                  _SectionHeader(
                    title: 'Recent Match Scores',
                    actionLabel: 'Live Now',
                    onActionTap: () => context.push('/live-matches'),
                  ),
                  const SizedBox(height: 14),
                  const _RecentScoresSection(),
                  const SizedBox(height: _gSec),

                  // Trending Reels (moved lower)
                  _SectionHeader(
                    title: 'Trending Reels',
                    actionLabel: 'View all',
                    onActionTap: () => Navigator.push(
                      context,
                      PageRouteBuilder(
                        opaque: true,
                        pageBuilder: (_, __, ___) => const ReelCommunityView(),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  _ReelsRow(),
                  const SizedBox(height: _gSec),

                  // Explore Community
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: _pH),
                    child: Text('Explore Community',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Poppins')),
                  ),
                  const SizedBox(height: 14),
                  _CommunityPost(
                      imagePath: 'assets/images/home/community_post_1.png',
                      isAd: true),
                  const SizedBox(height: 14),
                  _CommunityPost(
                      imagePath: 'assets/images/home/community_post_2.png'),
                  const SizedBox(height: 14),
                  _CommunityPost(
                      imagePath: 'assets/images/home/community_post_3.png'),
                  const SizedBox(height: 24),

                  // â”€â”€ Gradient CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                  const _ExploreCommunityBtn(),
                  const SizedBox(height: 40),

                  // â”€â”€ Watermark â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                  Center(
                    child: Text('GAME ON\nALWAYS',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            fontSize: 42,
                            fontWeight: FontWeight.w900,
                            color: Colors.white.withValues(alpha: 0.05),
                            letterSpacing: 6,
                            height: 1.1)),
                  ),
                  const SizedBox(height: 14),
                  Center(
                    child: Text('Made with ❤️  in Hyderabad',
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.45),
                            fontSize: 11,
                            fontFamily: 'Poppins')),
                  ),
                  const SizedBox(height: 110),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// HEADER
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

class HomeHeader extends ConsumerWidget {
  final VoidCallback? onProfileTap;
  const HomeHeader({Key? key, this.onProfileTap}) : super(key: key);
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userName = ref.watch(userDisplayNameProvider);
    final userLocation = ref.watch(userLocationProvider);
    final walletAsync = ref.watch(walletBalanceProvider);

    // First name only — the header row also has to fit a coin pill, chat
    // icon, and bell icon, so a long full name like "Vamshidhar Bayyapu"
    // gets ellipsed mid-word ("Hello Vamsh…"). Greeting by first name is
    // the standard mobile pattern and keeps the row readable.
    final rawName =
        (userName.isEmpty || userName == 'User') ? 'there' : userName;
    final displayName = rawName.split(RegExp(r'\s+')).first;
    final displayLocation = userLocation;

    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 20, 12, 0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Burger — opens the side profile drawer rendered by
          // MainContainer. Falls back to the legacy onProfileTap callback
          // when the header isn't inside the bottom-nav shell (e.g. used
          // standalone in tests / one-off screens).
          GestureDetector(
            onTap: () {
              if (onProfileTap != null) {
                onProfileTap!();
              } else {
                ref.read(profileDrawerOpenProvider.notifier).state = true;
              }
            },
            child: Container(
              width: 32,
              height: 40,
              alignment: Alignment.centerLeft,
              child:
                  const Icon(LucideIcons.menu, color: Colors.white, size: 24),
            ),
          ),
          const SizedBox(width: 4),
          // Name + location
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                RichText(
                  overflow: TextOverflow.ellipsis,
                  text: TextSpan(
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontFamily: 'Poppins'),
                    children: [
                      const TextSpan(
                          text: 'Hello ',
                          style: TextStyle(fontWeight: FontWeight.w400)),
                      TextSpan(
                          text: displayName,
                          style: const TextStyle(fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
                const SizedBox(height: 3),
                if (displayLocation.isNotEmpty)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Image.asset('assets/icons/map_pin_icon.png',
                          width: 12,
                          height: 12,
                          color: _cGray,
                          errorBuilder: (_, __, ___) => const Icon(
                              LucideIcons.mapPin,
                              size: 12,
                              color: _cGray)),
                      const SizedBox(width: 3),
                      Flexible(
                        child: Text(displayLocation,
                            style: const TextStyle(
                                color: _cGray,
                                fontSize: 12,
                                fontWeight: FontWeight.w400,
                                fontFamily: 'Poppins'),
                            overflow: TextOverflow.ellipsis),
                      ),
                    ],
                  ),
              ],
            ),
          ),
          const SizedBox(width: 8),

          // â”€â”€ Coin pill — glass + #55DEE8â†'#BFF367 gradient at 20% opacity â”€â”€
          GestureDetector(
            onTap: () async {
              await context.push('/wallet');
              // Balance may have changed (recharge / spend) — refresh the pill.
              ref.invalidate(walletBalanceProvider);
            },
            child: ClipRRect(
              borderRadius: BorderRadius.circular(_r20),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        AppColors.gradientStart.withValues(alpha: 0.20),
                        AppColors.gradientEnd.withValues(alpha: 0.20),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(_r20),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.18),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Image.asset(
                        'assets/icons/coin_gold.png',
                        width: 24,
                        height: 24,
                      ),
                      const SizedBox(width: 6),
                      Text(
                          walletAsync.when(
                            data: (bal) => bal.toStringAsFixed(0),
                            loading: () => '...',
                            error: (_, __) => '0',
                          ),
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              fontSize: 13,
                              fontFamily: 'Poppins')),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 2),

          // ── Message icon — opens conversations ──
          GestureDetector(
            onTap: () => context.push('/conversations'),
            child: SizedBox(
              width: 38,
              height: 44,
              child: Center(
                child: Image.asset(
                  'assets/images/header/message_icon.png',
                  width: 26,
                  height: 26,
                  errorBuilder: (_, __, ___) => const Icon(
                      LucideIcons.messageCircle,
                      color: Colors.white,
                      size: 22),
                ),
              ),
            ),
          ),
          const SizedBox(width: 2),

          // â”€â”€ Bell icon with unread badge â”€â”€
          GestureDetector(
            onTap: () => context.push('/notification-panel'),
            child: SizedBox(
              width: 38,
              height: 44,
              child: Center(
                child: Consumer(
                  builder: (_, cRef, __) {
                    final unread = cRef.watch(unreadNotificationCountProvider);
                    return Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Image.asset(
                          'assets/icons/bell-alert.png',
                          width: 24,
                          height: 24,
                        ),
                        if (unread > 0)
                          Positioned(
                            top: -4,
                            right: -6,
                            child: Container(
                              constraints: const BoxConstraints(
                                  minWidth: 16, minHeight: 16),
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 3),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [
                                    AppColors.gradientStart,
                                    AppColors.gradientEnd
                                  ],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                shape: unread > 9
                                    ? BoxShape.rectangle
                                    : BoxShape.circle,
                                borderRadius: unread > 9
                                    ? BorderRadius.circular(8)
                                    : null,
                              ),
                              child: Text(
                                unread > 99 ? '99+' : '$unread',
                                style: const TextStyle(
                                  color: Colors.black,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w800,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                      ],
                    );
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// GLASS CARD  — reusable nav-bar-style glass with gradient side borders
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

class _SportsStoryRow extends ConsumerStatefulWidget {
  @override
  ConsumerState<_SportsStoryRow> createState() => _SportsStoryRowState();
}

class _SportsStoryRowState extends ConsumerState<_SportsStoryRow> {
  final Set<String> _watchedGroupIds = {};

  void _markGroupWatched(String authorId) {
    setState(() => _watchedGroupIds.add(authorId));
  }

  @override
  Widget build(BuildContext context) {
    final me = AuthManager().currentUser;
    final myId = (me?['id'] ?? me?['_id'])?.toString() ?? '';
    final storiesAsync = ref.watch(storyGroupsProvider);

    return SizedBox(
      height: 94,
      child: storiesAsync.when(
        loading: () =>
            const Center(child: CircularProgressIndicator(strokeWidth: 2)),
        error: (_, __) => ListView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: _pH),
          children: [
            _YourStoryCircle(myGroup: null, myUserId: ''),
          ],
        ),
        data: (groups) {
          // Separate current user's group so it renders in the "Your Story" slot
          final myGroup = myId.isNotEmpty
              ? groups.where((g) => g.author.id == myId).firstOrNull
              : null;
          final others = groups.where((g) => g.author.id != myId).toList();

          // Sort others: unwatched first
          final sorted = [...others]..sort((a, b) {
              final aWatched =
                  _watchedGroupIds.contains(a.author.id) || a.allViewed(myId);
              final bWatched =
                  _watchedGroupIds.contains(b.author.id) || b.allViewed(myId);
              if (aWatched == bWatched) return 0;
              return aWatched ? 1 : -1;
            });

          return ListView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: _pH),
            children: [
              _YourStoryCircle(myGroup: myGroup, myUserId: myId),
              const SizedBox(width: _gCard),
              ...sorted.map((group) {
                final isWatched = _watchedGroupIds.contains(group.author.id) ||
                    group.allViewed(myId);
                return Padding(
                  padding: const EdgeInsets.only(right: _gCard),
                  child: _RealStoryCircle(
                    group: group,
                    myUserId: myId,
                    isWatched: isWatched,
                    onWatched: () => _markGroupWatched(group.author.id),
                  ),
                );
              }),
            ],
          );
        },
      ),
    );
  }
}

// â”€â”€ Your Story circle — shows existing story or opens upload choice â”€â”€
class _YourStoryCircle extends StatefulWidget {
  final StoryGroup? myGroup;
  final String myUserId;
  const _YourStoryCircle({required this.myGroup, required this.myUserId});

  @override
  State<_YourStoryCircle> createState() => _YourStoryCircleState();
}

class _YourStoryCircleState extends State<_YourStoryCircle> {
  void _showUploadChoice(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceSlate,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'What do you want to add?',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 16),
              _UploadOptionTile(
                icon: LucideIcons.camera,
                title: 'Story',
                subtitle: 'Share a photo moment',
                onTap: () {
                  context.pop();
                  context.push('/story-upload');
                },
              ),
              const SizedBox(height: 12),
              _UploadOptionTile(
                icon: LucideIcons.video,
                title: 'Reel',
                subtitle: 'Upload a short video clip',
                onTap: () {
                  context.pop();
                  context.push('/reel-upload');
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final myGroup = widget.myGroup;
    final hasStory = myGroup != null && myGroup.stories.isNotEmpty;

    return GestureDetector(
      onTap: () {
        if (hasStory) {
          Navigator.push(
            context,
            PageRouteBuilder(
              opaque: true,
              pageBuilder: (_, __, ___) => _RealStoryViewerScreen(
                groups: [myGroup],
                initialGroupIndex: 0,
                myUserId: widget.myUserId,
              ),
            ),
          );
        } else {
          _showUploadChoice(context);
        }
      },
      child: SizedBox(
        width: 70,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 64,
              height: 64,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  // Outer ring — gradient if has story, plain if not
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: hasStory
                          ? const LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                AppColors.accentTeal,
                                AppColors.accentGreen
                              ],
                            )
                          : null,
                      border: hasStory
                          ? null
                          : const Border.fromBorderSide(BorderSide(
                              color: AppColors.surfaceSlate,
                              width: 2.5,
                            )),
                    ),
                    padding: EdgeInsets.all(hasStory ? 2.5 : 3),
                    child: Container(
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.black,
                      ),
                      padding: EdgeInsets.all(hasStory ? 1.5 : 0),
                      child: ClipOval(
                        child: _buildAvatar(myGroup),
                      ),
                    ),
                  ),
                  // “+” badge — always visible so user can add more
                  Positioned(
                    bottom: -1,
                    right: -1,
                    child: Container(
                      width: 18,
                      height: 18,
                      decoration: const BoxDecoration(
                        color: AppColors.accentGreen,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(LucideIcons.plus,
                          size: 12, color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 5),
            const Text(
              'Your Story',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.w400,
                fontFamily: 'Poppins',
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAvatar(StoryGroup? group) {
    final photo = group?.author.profilePicture;
    if (_isHttpUrl(photo)) {
      return CachedNetworkImage(
        imageUrl: photo!,
        fit: BoxFit.cover,
        errorWidget: (_, __, ___) => _placeholderIcon(),
      );
    }
    return _placeholderIcon();
  }

  Widget _placeholderIcon() => Container(
        color: AppColors.surfaceSlate,
        child: const Center(
          child: Icon(LucideIcons.smartphone, color: Colors.white, size: 26),
        ),
      );
}

// â”€â”€ Upload option tile (used in the story/reel bottom sheet) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _UploadOptionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _UploadOptionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.surfaceSlate,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.accentCyan.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: AppColors.accentCyan, size: 22),
            ),
            const SizedBox(width: 14),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                ),
              ],
            ),
            const Spacer(),
            const Icon(LucideIcons.chevronRight, color: Colors.white30),
          ],
        ),
      ),
    );
  }
}

class _RealStoryCircle extends StatelessWidget {
  final StoryGroup group;
  final String myUserId;
  final bool isWatched;
  final VoidCallback onWatched;

  const _RealStoryCircle({
    required this.group,
    required this.myUserId,
    required this.isWatched,
    required this.onWatched,
  });

  @override
  Widget build(BuildContext context) {
    final photo = group.author.profilePicture;
    final name = group.author.username ?? group.author.name.split(' ').first;

    return GestureDetector(
      onTap: () async {
        await Navigator.push(
          context,
          PageRouteBuilder(
            opaque: true,
            pageBuilder: (_, __, ___) => _RealStoryViewerScreen(
              groups: [group],
              initialGroupIndex: 0,
              myUserId: myUserId,
            ),
          ),
        );
        onWatched();
      },
      child: SizedBox(
        width: 70,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: isWatched
                    ? null
                    : const LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [AppColors.accentTeal, AppColors.accentGreen],
                      ),
                color: isWatched ? AppColors.surfaceSlate : null,
              ),
              padding: const EdgeInsets.all(2.5),
              child: Container(
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.black,
                ),
                padding: const EdgeInsets.all(1.5),
                child: ClipOval(
                  child: _isHttpUrl(photo)
                      ? CachedNetworkImage(
                          imageUrl: photo!,
                          fit: BoxFit.cover,
                          errorWidget: (_, __, ___) => _defaultAvatar(),
                        )
                      : _defaultAvatar(),
                ),
              ),
            ),
            const SizedBox(height: 5),
            Text(
              name,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.w400,
                fontFamily: 'Poppins',
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _defaultAvatar() => Container(
        color: AppColors.surfaceL3,
        child: const Icon(LucideIcons.user, color: Colors.white54, size: 28),
      );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STORY VIEWER  — swipeable full-screen viewer with segmented progress bars
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

class _StoryViewerScreen extends StatefulWidget {
  final List<Map<String, dynamic>> stories;
  final int initialIndex;
  const _StoryViewerScreen({required this.stories, required this.initialIndex});

  @override
  State<_StoryViewerScreen> createState() => _StoryViewerScreenState();
}

class _StoryViewerScreenState extends State<_StoryViewerScreen>
    with SingleTickerProviderStateMixin {
  late PageController _pageCtrl;
  late AnimationController _progress;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageCtrl = PageController(initialPage: widget.initialIndex);
    _startProgress();
  }

  void _startProgress() {
    _progress = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 5),
    )..forward();
    _progress.addStatusListener((s) {
      if (s == AnimationStatus.completed && mounted) _goNext();
    });
  }

  void _goNext() {
    if (_currentIndex < widget.stories.length - 1) {
      _pageCtrl.nextPage(
          duration: const Duration(milliseconds: 250), curve: Curves.easeInOut);
    } else {
      if (mounted) context.pop();
    }
  }

  void _goPrev() {
    if (_currentIndex > 0) {
      _pageCtrl.previousPage(
          duration: const Duration(milliseconds: 250), curve: Curves.easeInOut);
    }
  }

  void _onPageChanged(int index) {
    setState(() => _currentIndex = index);
    _progress.reset();
    _progress.forward();
  }

  @override
  void dispose() {
    _progress.dispose();
    _pageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.of(context).padding.top;
    final story = widget.stories[_currentIndex];

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // â”€â”€ Swipeable pages â”€â”€
          PageView.builder(
            controller: _pageCtrl,
            onPageChanged: _onPageChanged,
            itemCount: widget.stories.length,
            itemBuilder: (_, i) {
              final s = widget.stories[i];
              return Stack(
                fit: StackFit.expand,
                children: [
                  Image.asset(s['imagePath'] as String,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) =>
                          Container(color: AppColors.surfaceSlate)),
                  Container(color: Colors.black.withValues(alpha: 0.15)),
                ],
              );
            },
          ),

          // â”€â”€ Tap zones: left = prev, right = next â”€â”€
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  behavior: HitTestBehavior.translucent,
                  onTap: _goPrev,
                ),
              ),
              Expanded(
                child: GestureDetector(
                  behavior: HitTestBehavior.translucent,
                  onTap: _goNext,
                ),
              ),
            ],
          ),

          // â”€â”€ Segmented progress bars â”€â”€
          Positioned(
            top: topPad + 10,
            left: 12,
            right: 12,
            child: Row(
              children: List.generate(widget.stories.length, (i) {
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    child: AnimatedBuilder(
                      animation: _progress,
                      builder: (_, __) {
                        final value = i < _currentIndex
                            ? 1.0
                            : i == _currentIndex
                                ? _progress.value
                                : 0.0;
                        return ClipRRect(
                          borderRadius: BorderRadius.circular(3),
                          child: LinearProgressIndicator(
                            value: value,
                            minHeight: 2.5,
                            backgroundColor:
                                Colors.white.withValues(alpha: 0.35),
                            valueColor: const AlwaysStoppedAnimation<Color>(
                                Colors.white),
                          ),
                        );
                      },
                    ),
                  ),
                );
              }),
            ),
          ),

          // â”€â”€ Label + close â”€â”€
          Positioned(
            top: topPad + 22,
            left: 16,
            right: 16,
            child: Row(
              children: [
                Text(
                  story['label'] as String,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Poppins',
                    shadows: [Shadow(color: Colors.black54, blurRadius: 6)],
                  ),
                ),
                const Spacer(),
                GestureDetector(
                  onTap: () => context.pop(),
                  child:
                      const Icon(LucideIcons.x, color: Colors.white, size: 22),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RealStoryViewerScreen extends StatefulWidget {
  final List<StoryGroup> groups;
  final int initialGroupIndex;
  final String myUserId;

  const _RealStoryViewerScreen({
    required this.groups,
    required this.initialGroupIndex,
    required this.myUserId,
  });

  @override
  State<_RealStoryViewerScreen> createState() => _RealStoryViewerScreenState();
}

class _RealStoryViewerScreenState extends State<_RealStoryViewerScreen>
    with SingleTickerProviderStateMixin {
  late int _groupIndex;
  late int _storyIndex;
  late AnimationController _progress;
  final Set<String> _viewedIds = {};

  StoryGroup get _currentGroup => widget.groups[_groupIndex];
  StoryModel get _currentStory => _currentGroup.stories[_storyIndex];

  @override
  void initState() {
    super.initState();
    _groupIndex = widget.initialGroupIndex;
    _storyIndex = 0;
    _startProgress();
    _recordView();
    // Warm the cache for the next 1-2 stories so taps land instantly. Deferred
    // by one frame so `precacheImage` has a valid context.
    WidgetsBinding.instance.addPostFrameCallback((_) => _precacheUpcoming());
  }

  // Schedules image precache for the next story in the current group and the
  // first story of the next group. Safe to call repeatedly — `precacheImage`
  // is a no-op when the asset is already in the cache.
  void _precacheUpcoming() {
    if (!mounted) return;
    final urls = <String>[];
    if (_storyIndex + 1 < _currentGroup.stories.length) {
      final u = _currentGroup.stories[_storyIndex + 1].mediaUrl;
      if (u != null && u.isNotEmpty) urls.add(u);
    }
    if (_groupIndex + 1 < widget.groups.length) {
      final nextGroup = widget.groups[_groupIndex + 1].stories;
      if (nextGroup.isNotEmpty) {
        final u = nextGroup.first.mediaUrl;
        if (_isHttpUrl(u)) urls.add(u!);
      }
    }
    for (final u in urls) {
      precacheImage(CachedNetworkImageProvider(u), context);
    }
  }

  void _startProgress() {
    _progress = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 5),
    )..forward();
    _progress.addStatusListener((s) {
      if (s == AnimationStatus.completed && mounted) _goNext();
    });
  }

  void _recordView() {
    final id = _currentStory.id;
    if (_viewedIds.contains(id)) return;
    _viewedIds.add(id);
    StoryService().viewStory(id);
  }

  void _showStoryOptions() {
    _progress.stop();
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceSlate,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2)),
            ),
            ListTile(
              leading: const Icon(LucideIcons.trash2, color: Colors.redAccent),
              title: const Text('Delete Story',
                  style: TextStyle(color: Colors.white)),
              onTap: () async {
                Navigator.pop(ctx);
                final id = _currentStory.id;
                final ok = await StoryService().deleteStory(id);
                if (!mounted) return;
                if (ok) {
                  BmsToast.success(context, 'Story deleted');
                  context.pop();
                } else {
                  BmsToast.error(context, 'Could not delete story');
                }
              },
            ),
            ListTile(
              leading: const Icon(LucideIcons.x, color: Colors.white54),
              title:
                  const Text('Cancel', style: TextStyle(color: Colors.white70)),
              onTap: () {
                Navigator.pop(ctx);
                _progress.forward();
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    ).then((_) {
      if (mounted) _progress.forward();
    });
  }

  void _goNext() {
    if (_storyIndex < _currentGroup.stories.length - 1) {
      setState(() => _storyIndex++);
      _progress.reset();
      _progress.forward();
      _recordView();
      _precacheUpcoming();
    } else if (_groupIndex < widget.groups.length - 1) {
      setState(() {
        _groupIndex++;
        _storyIndex = 0;
      });
      _progress.reset();
      _progress.forward();
      _recordView();
      _precacheUpcoming();
    } else {
      if (mounted) context.pop();
    }
  }

  void _goPrev() {
    if (_storyIndex > 0) {
      setState(() => _storyIndex--);
      _progress.reset();
      _progress.forward();
      _recordView();
      _precacheUpcoming();
    } else if (_groupIndex > 0) {
      setState(() {
        _groupIndex--;
        _storyIndex = _currentGroup.stories.length - 1;
      });
      _progress.reset();
      _progress.forward();
      _recordView();
      _precacheUpcoming();
    }
  }

  @override
  void dispose() {
    _progress.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.of(context).padding.top;
    final story = _currentStory;
    final mediaUrl = story.mediaUrl ?? '';
    final totalStories = _currentGroup.stories.length;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // â”€â”€ Media â”€â”€
          _isHttpUrl(mediaUrl)
              ? CachedNetworkImage(
                  imageUrl: mediaUrl,
                  fit: BoxFit.cover,
                  placeholder: (_, __) =>
                      const ColoredBox(color: AppColors.surfaceSlate),
                  errorWidget: (_, __, ___) =>
                      const ColoredBox(color: AppColors.surfaceSlate),
                )
              : const ColoredBox(color: AppColors.surfaceSlate),

          // Dark overlay
          Container(color: Colors.black.withValues(alpha: 0.15)),

          // â”€â”€ Tap zones â”€â”€
          Row(
            children: [
              Expanded(
                  child: GestureDetector(
                      behavior: HitTestBehavior.translucent, onTap: _goPrev)),
              Expanded(
                  child: GestureDetector(
                      behavior: HitTestBehavior.translucent, onTap: _goNext)),
            ],
          ),

          // â”€â”€ Progress bars â”€â”€
          Positioned(
            top: topPad + 10,
            left: 12,
            right: 12,
            child: Row(
              children: List.generate(totalStories, (i) {
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    child: AnimatedBuilder(
                      animation: _progress,
                      builder: (_, __) {
                        final value = i < _storyIndex
                            ? 1.0
                            : i == _storyIndex
                                ? _progress.value
                                : 0.0;
                        return ClipRRect(
                          borderRadius: BorderRadius.circular(3),
                          child: LinearProgressIndicator(
                            value: value,
                            minHeight: 2.5,
                            backgroundColor:
                                Colors.white.withValues(alpha: 0.35),
                            valueColor: const AlwaysStoppedAnimation<Color>(
                                Colors.white),
                          ),
                        );
                      },
                    ),
                  ),
                );
              }),
            ),
          ),

          // â”€â”€ Author header â”€â”€
          Positioned(
            top: topPad + 22,
            left: 16,
            right: 16,
            child: Row(
              children: [
                if (_isHttpUrl(_currentGroup.author.profilePicture))
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ClipOval(
                      child: CachedNetworkImage(
                        imageUrl: _currentGroup.author.profilePicture!,
                        width: 32,
                        height: 32,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => Container(
                          width: 32,
                          height: 32,
                          color: AppColors.backgroundCard,
                          child: const Icon(LucideIcons.user,
                              size: 18, color: Colors.white54),
                        ),
                      ),
                    ),
                  ),
                Text(
                  _currentGroup.author.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Poppins',
                    shadows: [Shadow(color: Colors.black54, blurRadius: 6)],
                  ),
                ),
                const Spacer(),
                if (_currentGroup.author.id ==
                    (AuthManager().currentUser?['id'] ??
                            AuthManager().currentUser?['_id'])
                        ?.toString())
                  GestureDetector(
                    onTap: _showStoryOptions,
                    child: const Padding(
                      padding: EdgeInsets.only(right: 8),
                      child: Icon(LucideIcons.moreVertical,
                          color: Colors.white, size: 22),
                    ),
                  ),
                GestureDetector(
                  onTap: () => context.pop(),
                  child:
                      const Icon(LucideIcons.x, color: Colors.white, size: 22),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SECTION HEADER  (reusable)
// Fix #11 — consistent typography: title Bold, action Medium
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

class _SectionHeader extends StatelessWidget {
  final String title;
  final String? actionLabel;
  final VoidCallback? onActionTap;
  const _SectionHeader(
      {required this.title, this.actionLabel, this.onActionTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: _pH),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(title,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Poppins')),
          if (actionLabel != null)
            GestureDetector(
              onTap: onActionTap,
              child: Text(actionLabel!,
                  style: const TextStyle(
                      color: AppColors.accentGreen,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      fontFamily: 'Poppins')),
            ),
        ],
      ),
    );
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// UPCOMING EVENTS
// Fix #3 — bolder title (w700), lighter subtitle (11px w400), more breathing
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FEATURE CARDS  (2 Ã— 2 grid)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

class _FeatureCardsGrid extends ConsumerWidget {
  const _FeatureCardsGrid();

  static const _quickActions = <(QuickIcon3DKind, HomeAction)>[
    (QuickIcon3DKind.bookGround, HomeAction.bookGround),
    (QuickIcon3DKind.nearbyPlayers, HomeAction.nearbyPlayers),
    (QuickIcon3DKind.joinGame, HomeAction.joinGame),
    (QuickIcon3DKind.myTeams, HomeAction.myTeams),
    (QuickIcon3DKind.tournaments, HomeAction.tournaments),
    (QuickIcon3DKind.hostGame, HomeAction.hostGame),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final actions = ref.read(homeActionProvider);

    return SizedBox(
      height: 112,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        physics: const BouncingScrollPhysics(),
        separatorBuilder: (_, __) => const SizedBox(width: 16),
        itemCount: _quickActions.length,
        itemBuilder: (_, i) {
          final (kind, action) = _quickActions[i];
          return QuickActionTile3D(
            kind: kind,
            onTap: () => actions.handleAction(context, action),
          );
        },
      ),
    );
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ── Horizontal feature strip data ─────────────────────────────────────────────

// ── Legacy 3-D card (kept for reference) ──────────────────────────────────────
// ignore: unused_element
class _FeatureCard3D extends StatelessWidget {
  final String label;
  final String iconPath;
  final Gradient gradient;
  final VoidCallback onTap;
  final double iconSize;
  final double iconTopOverflow;
  final double iconRight;

  const _FeatureCard3D({
    required this.label,
    required this.iconPath,
    required this.gradient,
    required this.onTap,
    // Sized relative to the rendered card height (~59dp at 390dp screen width).
    // Icon occupies ~1.25Ã— the card height; overflows ~0.35Ã— above.
    this.iconSize = 92,
    this.iconTopOverflow = 27,
    this.iconRight = 0,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // â”€â”€ Card body — exact design aspect ratio 181 : 63 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          AspectRatio(
            aspectRatio: 181 / 64.6,
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                gradient: gradient,
              ),
              alignment: Alignment.centerLeft,
              padding: const EdgeInsets.only(left: 12),
              child: Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Poppins',
                  letterSpacing: 0.1,
                ),
              ),
            ),
          ),

          // â”€â”€ 3-D icon — bleeds above the card top â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          Positioned(
            right: iconRight,
            top: -iconTopOverflow,
            child: Image.asset(
              iconPath,
              height: iconSize,
              width: iconSize,
              fit: BoxFit.contain,
            ),
          ),
        ],
      ),
    );
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// GROUNDS NEAR YOU
// Fix #4 — stronger gradient, heart perfectly cornered, baseline-aligned row
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

class _GroundsRow extends StatefulWidget {
  const _GroundsRow();

  @override
  State<_GroundsRow> createState() => _GroundsRowState();
}

class _GroundsRowState extends State<_GroundsRow> {
  List<_GroundItem> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final turfs = await TurfService().getAllTurfs();
      if (mounted) {
        setState(() {
          _items = turfs.map((t) {
            // Backend returns avgRating=0 when no reviews exist (not null), so
            // the previous `?? 4.5` fallback never triggered. Treat 0 the same
            // as "no rating yet" so the card can render a "New" badge instead
            // of a misleading "0.0 (0)".
            final hasRating = (t.avgRating ?? 0) > 0;
            return _GroundItem(
              turfId: t.id,
              name: t.name,
              distance: t.location,
              rating: hasRating ? t.avgRating! : 0,
              reviewCount: t.reviewCount,
              pricePerHour: t.pricePerHour,
              imageUrl: _isHttpUrl(t.image) ? t.image : null,
            );
          }).toList();
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted)
        setState(() {
          _loading = false;
        });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const SizedBox(
        height: 240,
        child: Center(
            child: CircularProgressIndicator(
                color: AppColors.primary, strokeWidth: 2)),
      );
    }
    if (_items.isEmpty) {
      return SizedBox(
        height: 240,
        child: Center(
          child: Text('No venues available',
              style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.4), fontSize: 14)),
        ),
      );
    }
    return SizedBox(
      height: 240,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: _pH),
        itemCount: _items.length,
        separatorBuilder: (_, __) => const SizedBox(width: _gCard),
        itemBuilder: (_, i) => _GroundCard(
          ground: _items[i],
          onReturned: _load,
        ),
      ),
    );
  }
}

class _GroundCard extends StatefulWidget {
  final _GroundItem ground;
  final VoidCallback? onReturned;
  const _GroundCard({required this.ground, this.onReturned});

  @override
  State<_GroundCard> createState() => _GroundCardState();
}

class _GroundCardState extends State<_GroundCard> {
  bool _liked = false;

  @override
  Widget build(BuildContext context) {
    final ground = widget.ground;
    return GestureDetector(
      onTap: () async {
        await context.push('/home/ground-detail', extra: {
          'turfId': ground.turfId,
          'groundName': ground.name,
          'location': ground.distance,
          'distance': ground.distance,
          'rating': ground.rating,
          'reviewCount': ground.reviewCount,
          'pricePerHour': ground.pricePerHour,
          'images': ground.imageUrl != null
              ? [ground.imageUrl!]
              : (ground.localImagePath != null
                  ? [ground.localImagePath!]
                  : <String>[]),
        });
        if (mounted) widget.onReturned?.call();
      },
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(_r12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.55),
              blurRadius: 16,
              spreadRadius: 2,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(_r12),
          child: SizedBox(
            height: 240,
            width: 225,
            child: Stack(
              fit: StackFit.expand,
              children: [
                // â”€â”€ Background image â”€â”€
                _buildImage(ground),

                // â”€â”€ Bottom gradient so text is readable â”€â”€
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.50),
                          Colors.black.withValues(alpha: 0.92),
                        ],
                        stops: const [0.0, 0.30, 0.58, 1.0],
                      ),
                    ),
                  ),
                ),

                // â”€â”€ Heart button — all cards, functional â”€â”€
                Positioned(
                  top: 8,
                  right: 8,
                  child: GestureDetector(
                    onTap: () => setState(() => _liked = !_liked),
                    child: Container(
                      width: 30,
                      height: 30,
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.40),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.favorite,
                        color: _liked ? Colors.redAccent : Colors.white,
                        size: 16,
                      ),
                    ),
                  ),
                ),

                // â”€â”€ Name + distance â”€â”€
                Positioned(
                  left: 10,
                  right: 10,
                  bottom: 36,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(ground.name,
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                              fontFamily: 'Poppins'),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 2),
                      Text(ground.distance,
                          style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.75),
                              fontSize: 10,
                              fontFamily: 'Poppins')),
                    ],
                  ),
                ),

                // ── Price (left) + Rating (right) — inside image ──
                // Price digits + ₹ render in mint→lime gradient; the unit suffix
                // ("/ hr" or "/ hr onwards") stays plain white so the two read
                // as a single composed price line like the design mock.
                Positioned(
                  left: 10,
                  right: 10,
                  bottom: 10,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      if (ground.pricePerHour > 0)
                        Flexible(
                          // FittedBox scales the price block down rather than
                          // overflowing — high-price grounds (e.g. ₹2000+) plus
                          // a rating cluster on the right used to push past the
                          // card width by ~38px and trigger a RenderFlex error.
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.centerLeft,
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                ShaderMask(
                                  shaderCallback: (bounds) =>
                                      const LinearGradient(
                                    begin: Alignment.centerLeft,
                                    end: Alignment.centerRight,
                                    colors: [
                                      AppColors.gradientStart,
                                      AppColors.gradientEnd,
                                    ],
                                  ).createShader(bounds),
                                  child: Text(
                                    '₹${ground.pricePerHour.toStringAsFixed(0)}',
                                    style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 17,
                                        fontWeight: FontWeight.w700,
                                        fontFamily: 'Poppins'),
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Padding(
                                  padding: EdgeInsets.only(bottom: 2),
                                  child: Text(
                                    '/ hr onwards',
                                    style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                        fontFamily: 'Poppins'),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        )
                      else
                        const Text('—',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontFamily: 'Poppins')),
                      const Spacer(),
                      if (ground.reviewCount > 0) ...[
                        SvgPicture.asset(
                          'assets/icons/rating_symbol.svg',
                          width: 13,
                          height: 13,
                        ),
                        const SizedBox(width: 3),
                        Text(ground.rating.toStringAsFixed(1),
                            style: const TextStyle(
                                color: Color(0xFF7CFE6A),
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                fontFamily: 'Poppins')),
                      ] else ...[
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.accentLime.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text('NEW',
                              style: TextStyle(
                                  color: AppColors.accentLime,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w700,
                                  fontFamily: 'Poppins',
                                  letterSpacing: 0.5)),
                        ),
                      ],
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

  Widget _buildImage(_GroundItem ground) {
    if (ground.localImagePath != null) {
      return Image.asset(ground.localImagePath!,
          fit: BoxFit.cover,
          alignment: Alignment.topCenter,
          errorBuilder: (_, __, ___) => _placeholder());
    }
    // Defensive: the backend sometimes returns a bare filename (e.g.
    // "turf_ Wembley.jpg") in `t.image` for legacy turfs. Without a scheme
    // CachedNetworkImage throws "No host specified in URI" repeatedly.
    if (_isHttpUrl(ground.imageUrl)) {
      return CachedNetworkImage(
          imageUrl: ground.imageUrl!,
          fit: BoxFit.cover,
          alignment: Alignment.topCenter,
          errorWidget: (_, __, ___) => _placeholder());
    }
    return _placeholder();
  }

  Widget _placeholder() => Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [AppColors.surfaceSlate, AppColors.surfaceSlateDeep]),
        ),
        child: const Center(
            child: Icon(Icons.stadium, color: Colors.white24, size: 44)),
      );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TRENDING REELS
// Fix #5 — compact width (120px), smaller play icon, semi-transparent badge
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

class _ReelsRow extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feedAsync = ref.watch(reelsFeedProvider(ReelFeedType.recommended));

    return feedAsync.when(
      loading: () => _shimmer(),
      error: (_, __) => _placeholderRow(context),
      data: (feedState) {
        final live = feedState.reels
            .where((r) => !r.isFailed && !r.isPending)
            .take(5)
            .toList();
        if (live.isEmpty) return _placeholderRow(context);
        return SizedBox(
          height: 255,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: _pH),
            itemCount: live.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (_, i) => _LiveReelCard(reel: live[i]),
          ),
        );
      },
    );
  }

  Widget _shimmer() {
    return SizedBox(
      height: 255,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: _pH),
        itemCount: 3,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, __) => ClipRRect(
          borderRadius: BorderRadius.circular(_r10),
          child: Container(width: 160, height: 255, color: Colors.white12),
        ),
      ),
    );
  }

  Widget _placeholderRow(BuildContext context) {
    return SizedBox(
      height: 255,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: _pH),
        itemCount: _reels.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, i) => _ReelCard(reel: _reels[i], index: i),
      ),
    );
  }
}

// â”€â”€â”€ Live reel card (uses real API data) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _LiveReelCard extends StatelessWidget {
  final Reel reel;
  const _LiveReelCard({required this.reel});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          PageRouteBuilder(
            opaque: true,
            pageBuilder: (_, __, ___) => const ReelCommunityView(),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(_r10),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.55),
              blurRadius: 16,
              spreadRadius: 2,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(_r10),
          child: SizedBox(
            width: 160,
            height: 255,
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Thumbnail
                _isHttpUrl(reel.thumbnailUrl)
                    ? CachedNetworkImage(
                        imageUrl: reel.thumbnailUrl!,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) =>
                            Container(color: AppColors.surfaceSlate),
                      )
                    : Container(color: AppColors.surfaceSlate),

                // Overlay gradient
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black.withValues(alpha: 0.20),
                        Colors.transparent,
                        Colors.transparent,
                        Colors.black.withValues(alpha: 0.88),
                      ],
                      stops: const [0.0, 0.22, 0.50, 1.0],
                    ),
                  ),
                ),

                // Play icon
                Center(
                  child: Icon(
                    LucideIcons.playCircle,
                    color: Colors.white.withValues(alpha: 0.40),
                    size: 36,
                  ),
                ),

                // Caption label
                if (reel.caption != null && reel.caption!.isNotEmpty)
                  Positioned(
                    left: 6,
                    right: 6,
                    bottom: 28,
                    child: Text(
                      reel.caption!.toUpperCase(),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.4,
                        fontFamily: 'Poppins',
                      ),
                    ),
                  ),

                // Views count badge
                Positioned(
                  bottom: 8,
                  left: 7,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 4, sigmaY: 4),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 3,
                        ),
                        color: Colors.black.withValues(alpha: 0.50),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(LucideIcons.eye,
                                color: Colors.white, size: 10),
                            const SizedBox(width: 3),
                            Text(
                              _formatViews(reel.stats.views),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                                fontFamily: 'Poppins',
                              ),
                            ),
                          ],
                        ),
                      ),
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

  String _formatViews(int n) {
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}k';
    return n > 0 ? n.toString() : '0';
  }
}

// â”€â”€â”€ Hardcoded placeholder card (shown when no live reels yet) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _ReelCard extends StatelessWidget {
  final _ReelItem reel;
  final int index;
  const _ReelCard({required this.reel, required this.index});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          PageRouteBuilder(
            opaque: true,
            pageBuilder: (_, __, ___) => _ReelsFeedScreen(initialIndex: index),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(_r10),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.55),
              blurRadius: 16,
              spreadRadius: 2,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(_r10),
          child: SizedBox(
            width: 160,
            height: 255,
            child: Stack(
              fit: StackFit.expand,
              children: [
                // â”€â”€ Thumbnail â”€â”€
                if (reel.localImagePath != null)
                  Image.asset(reel.localImagePath!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _gradientBg())
                else
                  _gradientBg(),

                // â”€â”€ Overlay gradient â”€â”€
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        reel.gradientColors[0].withValues(alpha: 0.40),
                        Colors.transparent,
                        Colors.transparent,
                        Colors.black.withValues(alpha: 0.88),
                      ],
                      stops: const [0.0, 0.22, 0.50, 1.0],
                    ),
                  ),
                ),

                // â”€â”€ Play icon â”€â”€
                Center(
                    child: Icon(LucideIcons.playCircle,
                        color: Colors.white.withValues(alpha: 0.40), size: 36)),

                // â”€â”€ Label â”€â”€
                Positioned(
                  left: 6,
                  right: 6,
                  bottom: 28,
                  child: Text(reel.label,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.4,
                          fontFamily: 'Poppins')),
                ),

                // â”€â”€ Views count — bottom left with eye icon â”€â”€
                Positioned(
                  bottom: 8,
                  left: 7,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 4, sigmaY: 4),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 3),
                        color: Colors.black.withValues(alpha: 0.50),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Image.asset('assets/icons/eye.png',
                                width: 10, height: 10),
                            const SizedBox(width: 3),
                            Text(reel.views,
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w700,
                                    fontFamily: 'Poppins')),
                          ],
                        ),
                      ),
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

  Widget _gradientBg() => DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: reel.gradientColors),
        ),
      );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// REELS FEED  — vertical PageView that starts at the tapped reel index
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

class _ReelsFeedScreen extends StatefulWidget {
  final int initialIndex;
  const _ReelsFeedScreen({this.initialIndex = 0});

  @override
  State<_ReelsFeedScreen> createState() => _ReelsFeedScreenState();
}

class _ReelsFeedScreenState extends State<_ReelsFeedScreen> {
  late final PageController _pageCtrl;

  @override
  void initState() {
    super.initState();
    _pageCtrl = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: PageView.builder(
        controller: _pageCtrl,
        scrollDirection: Axis.vertical,
        itemCount: _reels.length,
        itemBuilder: (_, i) => _ReelPlayerScreen(reel: _reels[i]),
      ),
    );
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// REEL PLAYER  — Instagram-style full-screen reels viewer
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

class _ReelPlayerScreen extends StatefulWidget {
  final _ReelItem reel;
  const _ReelPlayerScreen({required this.reel});

  @override
  State<_ReelPlayerScreen> createState() => _ReelPlayerScreenState();
}

class _ReelPlayerScreenState extends State<_ReelPlayerScreen> {
  late VideoPlayerController _ctrl;
  bool _initialized = false;
  bool _liked = false;
  int _likeCount = 2847;

  @override
  void initState() {
    super.initState();
    _ctrl = VideoPlayerController.asset(widget.reel.videoPath!)
      ..initialize().then((_) {
        if (mounted) setState(() => _initialized = true);
        _ctrl.setLooping(true);
        _ctrl.play();
      });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _togglePlay() {
    setState(() {
      _ctrl.value.isPlaying ? _ctrl.pause() : _ctrl.play();
    });
  }

  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.of(context).padding.top;
    final botPad = MediaQuery.of(context).padding.bottom;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // â”€â”€ Tappable video layer (play/pause) â”€â”€
          GestureDetector(
            onTap: _togglePlay,
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Video
                _initialized
                    ? SizedBox.expand(
                        child: FittedBox(
                          fit: BoxFit.cover,
                          child: SizedBox(
                            width: _ctrl.value.size.width,
                            height: _ctrl.value.size.height,
                            child: VideoPlayer(_ctrl),
                          ),
                        ),
                      )
                    : const Center(
                        child: CircularProgressIndicator(color: Colors.white)),

                // Vignette
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.70),
                        ],
                        stops: const [0.0, 0.50, 1.0],
                      ),
                    ),
                  ),
                ),

                // Pause indicator
                if (_initialized && !_ctrl.value.isPlaying)
                  Center(
                    child: Container(
                      width: 68,
                      height: 68,
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.45),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.play_arrow_rounded,
                          color: Colors.white, size: 40),
                    ),
                  ),

                // Right side actions
                Positioned(
                  right: 14,
                  bottom: botPad + 110,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Stack(
                        clipBehavior: Clip.none,
                        alignment: Alignment.center,
                        children: [
                          Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                              image: const DecorationImage(
                                image: AssetImage('assets/images/profile1.png'),
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: -10,
                            child: Container(
                              width: 22,
                              height: 22,
                              decoration: const BoxDecoration(
                                color: AppColors.accentLime,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(LucideIcons.plus,
                                  color: Colors.black, size: 14),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 32),
                      _ReelActionBtn(
                        imagePath: _liked
                            ? 'assets/icons/reel_liked.png'
                            : 'assets/icons/reel_like.png',
                        onTap: () => setState(() {
                          _liked = !_liked;
                          _likeCount += _liked ? 1 : -1;
                        }),
                      ),
                      const SizedBox(height: 28),
                      _ReelActionBtn(
                        imagePath: 'assets/icons/reel_comment.png',
                        onTap: () {},
                      ),
                      const SizedBox(height: 28),
                      _ReelActionBtn(
                        imagePath: 'assets/icons/reel_share.png',
                        onTap: () {},
                      ),
                    ],
                  ),
                ),

                // Bottom-left: username + caption
                Positioned(
                  left: 16,
                  right: 80,
                  bottom: botPad + 40,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '@${widget.reel.label.toLowerCase()}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                          fontFamily: 'Poppins',
                          shadows: [
                            Shadow(color: Colors.black54, blurRadius: 6)
                          ],
                        ),
                      ),
                      const SizedBox(height: 6),
                      RichText(
                        text: TextSpan(
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontFamily: 'Poppins',
                            shadows: [
                              Shadow(color: Colors.black54, blurRadius: 6)
                            ],
                          ),
                          children: _buildCaptionSpans(
                              '${widget.reel.label} trending sports reel #sports #bms #fyp'),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Back button — outside play/pause GestureDetector
          Positioned(
            top: topPad + 8,
            left: 8,
            child: GestureDetector(
              onTap: () => context.pop(),
              child: Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.35),
                  shape: BoxShape.circle,
                ),
                child: const Icon(LucideIcons.chevronLeft,
                    color: Colors.white, size: 18),
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<TextSpan> _buildCaptionSpans(String text) {
    final spans = <TextSpan>[];
    for (final word in text.split(' ')) {
      spans.add(TextSpan(
        text: '$word ',
        style: word.startsWith('#')
            ? const TextStyle(fontWeight: FontWeight.w700)
            : null,
      ));
    }
    return spans;
  }
}

// â”€â”€ Reusable right-side action button â”€â”€
class _ReelActionBtn extends StatelessWidget {
  final String? imagePath;
  final String? label;
  final VoidCallback onTap;

  const _ReelActionBtn({
    required this.onTap,
    this.imagePath,
    this.label,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (imagePath != null)
            Image.asset(imagePath!, width: 48, height: 48)
          else
            const SizedBox(width: 48, height: 48),
          if (label != null) ...[
            const SizedBox(height: 4),
            Text(label!,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Poppins',
                    shadows: [Shadow(color: Colors.black45, blurRadius: 4)])),
          ],
        ],
      ),
    );
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PLAYERS NEARBY
// Fix #6 — compact tile (10px vertical), softer buttons, balanced avatar (42px)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

class _PlayersNearbyList extends StatefulWidget {
  const _PlayersNearbyList();

  @override
  State<_PlayersNearbyList> createState() => _PlayersNearbyListState();
}

class _PlayersNearbyListState extends State<_PlayersNearbyList> {
  final FriendsService _service = FriendsService();
  List<Map<String, dynamic>> _players = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      Position? pos;
      try {
        pos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.low,
          timeLimit: const Duration(seconds: 8),
        );
      } catch (_) {
        pos = await Geolocator.getLastKnownPosition();
      }
      final lat = pos?.latitude ?? 17.385044;
      final lng = pos?.longitude ?? 78.486671;
      final players = await _service.getNearbyPlayers(
        latitude: lat,
        longitude: lng,
        radiusKm: 25,
      );
      if (mounted) {
        setState(() {
          _players = players.take(5).toList();
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _onFollowChanged(String id, bool isNowFollowing) {
    setState(() {
      final idx = _players.indexWhere((p) => p['id']?.toString() == id);
      if (idx != -1)
        _players[idx] = {..._players[idx], 'isFollowing': isNowFollowing};
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const SizedBox(
        height: 80,
        child: Center(
          child: CircularProgressIndicator(
              strokeWidth: 2, color: AppColors.primary),
        ),
      );
    }
    if (_players.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: _pH, vertical: 16),
        child: Center(
          child: Text(
            'No players found nearby',
            style: TextStyle(
                color: Colors.white.withValues(alpha: 0.4), fontSize: 14),
          ),
        ),
      );
    }
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: _pH),
      child: Column(
        children: _players
            .map((p) => _PlayerTile(
                  player: p,
                  onFollowChanged: _onFollowChanged,
                ))
            .toList(),
      ),
    );
  }
}

class _PlayerTile extends StatefulWidget {
  final Map<String, dynamic> player;
  final void Function(String id, bool isNowFollowing) onFollowChanged;
  const _PlayerTile({required this.player, required this.onFollowChanged});

  @override
  State<_PlayerTile> createState() => _PlayerTileState();
}

class _PlayerTileState extends State<_PlayerTile> {
  final FriendsService _service = FriendsService();
  bool _loading = false;

  static const _mint = AppColors.accentNeonGreen;

  String get _id => widget.player['id']?.toString() ?? '';
  bool get _isFollowing => widget.player['isFollowing'] == true;

  Future<void> _toggleFollow() async {
    if (_loading) return;
    setState(() => _loading = true);
    final wasFollowing = _isFollowing;
    widget.onFollowChanged(_id, !wasFollowing);
    final ok = wasFollowing
        ? await _service.unfollowPlayer(_id)
        : await _service.followPlayer(_id);
    if (!ok) widget.onFollowChanged(_id, wasFollowing);
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _openChat(String name, String? profilePic) async {
    if (_id.isEmpty) return;
    final chat = await ChatService().accessChat(_id);
    if (!mounted) return;
    context.push('/chat', extra: {
      'chatId': chat?.id ?? '',
      'friendId': _id,
      'friendName': name,
      'friendPhoto': profilePic,
      'isGroup': false,
      'members': const <Map<String, dynamic>>[],
    });
  }

  @override
  Widget build(BuildContext context) {
    final name = widget.player['name']?.toString() ?? 'Player';
    final profilePic = widget.player['profilePicture']?.toString();
    final sports = widget.player['sportTypes'];
    final sportLabel = (sports is List && sports.isNotEmpty)
        ? 'Plays ${(sports as List).take(2).join(', ')}'
        : (widget.player['sport']?.toString() ?? '');
    final distKm = widget.player['distanceKm'];
    final distNum = distKm is num
        ? distKm.toDouble()
        : (distKm == null ? null : double.tryParse(distKm.toString()));
    final distance = distNum == null ? '' : '${distNum.toStringAsFixed(1)} km';

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Container(
        decoration: BoxDecoration(
          color: _cPlayer,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.07),
            width: 1,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          child: Row(
            children: [
              // Plain circular avatar — the story-ring belongs on the
              // Stories row only; here the photo sits clean on the card.
              ClipOval(
                child: SizedBox(
                    width: 52,
                    height: 52,
                    child: _buildAvatar(name, profilePic)),
              ),
              const SizedBox(width: 14),

              // Name on line 1, sports on line 2, distance on line 3. Each
              // line is hard-capped at one row with ellipsis so a long name
              // can never push the card taller than its neighbours.
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                          fontFamily: 'Poppins'),
                    ),
                    if (sportLabel.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        sportLabel,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.50),
                            fontSize: 12,
                            fontWeight: FontWeight.w400,
                            fontFamily: 'Poppins'),
                      ),
                    ],
                    if (distance.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        distance,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.45),
                            fontSize: 12,
                            fontWeight: FontWeight.w400,
                            fontFamily: 'Poppins'),
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(width: 8),
              // Fixed-width action area — keeps the text column the same
              // width whether the player is followed (chat + Following) or
              // not (Follow only), so card geometry stays uniform.
              SizedBox(
                width: 116,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    if (_isFollowing) ...[
                      GestureDetector(
                        onTap: () => _openChat(name, profilePic),
                        child: Image.asset(
                          'assets/images/home/btn_chat.png',
                          height: 30,
                          fit: BoxFit.contain,
                        ),
                      ),
                      const SizedBox(width: 6),
                      GestureDetector(
                        onTap: _toggleFollow,
                        child: Image.asset(
                          'assets/images/home/btn_following.png',
                          height: 30,
                          fit: BoxFit.contain,
                        ),
                      ),
                    ] else
                      GestureDetector(
                        onTap: _loading ? null : _toggleFollow,
                        child: _loading
                            ? const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: _mint),
                              )
                            : Image.asset(
                                'assets/images/home/btn_follow.png',
                                height: 30,
                                fit: BoxFit.contain,
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

  Widget _buildAvatar(String name, String? profilePic) {
    if (_isHttpUrl(profilePic)) {
      return CachedNetworkImage(
        imageUrl: profilePic!,
        fit: BoxFit.cover,
        errorWidget: (_, __, ___) => _initials(name),
      );
    }
    return _initials(name);
  }

  Widget _initials(String name) {
    const colors = [
      AppColors.accentNeonGreen,
      AppColors.primary,
      AppColors.accentYellow,
      AppColors.gradientStart,
    ];
    final color = colors[name.codeUnitAt(0) % colors.length];
    return Container(
      color: color.withValues(alpha: 0.2),
      child: Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : '?',
          style: TextStyle(
              color: color,
              fontSize: 20,
              fontWeight: FontWeight.bold,
              fontFamily: 'Poppins'),
        ),
      ),
    );
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// JOIN GAMES NEAR YOU
// Fix #7 — squarer (148px), stronger gradient, more legible overlay text
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

/// Live matches relevant to the signed-in player — their hosted/joined
/// games currently being scored, plus nearby live matches as fallback.
final liveMatchesProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final loc = ref.watch(locationProvider);
  String? city;
  final name = loc.locationName;
  if (name.isNotEmpty && name != 'Current Location') {
    city = name.split(',').first.trim();
  }
  return MatchFeedService().liveForUser(nearbyCity: city);
});

/// Recently completed matches the user was involved in. Drives the home
/// "Recent Match Scores" section.
final recentMatchesProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  return MatchFeedService().recentForUser(limit: 5);
});

// Live games near user — re-fetches when the home-screen city changes.
// Filters out games scheduled before today so the home tray only shows
// matches a player can still join.
final nearbyGamesProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final loc = ref.watch(locationProvider);
  String? city;
  final name = loc.locationName;
  if (name.isNotEmpty && name != 'Current Location') {
    city = name.split(',').first.trim();
  }
  final games = await GameService().listGames(city: city);
  final today = DateUtils.dateOnly(DateTime.now());
  return games.where((g) {
    final raw = g['date']?.toString();
    if (raw == null || raw.isEmpty) return true;
    try {
      final d = DateUtils.dateOnly(DateTime.parse(raw).toLocal());
      return !d.isBefore(today);
    } catch (_) {
      return true;
    }
  }).toList();
});

class _SportsTray extends StatelessWidget {
  const _SportsTray();

  static const _sports = [
    _SportTile(
      name: 'Cricket',
      emoji: '🏏',
      gradient: [AppColors.accentBlue, AppColors.accentBlueLight],
    ),
    _SportTile(
      name: 'Football',
      emoji: '⚽',
      gradient: [AppColors.accentGreen, AppColors.accentGreen],
    ),
    _SportTile(
      name: 'Basketball',
      emoji: '🏀',
      gradient: [AppColors.accentOrangeDeep, AppColors.accentOrange],
    ),
    _SportTile(
      name: 'Tennis',
      emoji: '🎾',
      gradient: [AppColors.accentTeal, AppColors.accentTeal],
    ),
    _SportTile(
      name: 'Badminton',
      emoji: '🏸',
      gradient: [AppColors.accentPurple, AppColors.accentPurple],
    ),
    _SportTile(
      name: 'Volleyball',
      emoji: '🏐',
      gradient: [AppColors.accentPink, AppColors.accentPink],
    ),
    _SportTile(
      name: 'Swimming',
      emoji: '🏊',
      gradient: [AppColors.accentTeal, AppColors.accentTeal],
    ),
    _SportTile(
      name: 'Hockey',
      emoji: '🏑',
      gradient: [Color(0xFF4E342E), Color(0xFFA1887F)],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 130,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: _pH),
        itemCount: _sports.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, i) {
          final sport = _sports[i];
          return GestureDetector(
            onTap: () {
              context.push('/join-games', extra: {'sport': sport.name});
            },
            child: Container(
              width: 100,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: sport.gradient,
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(_r14),
                boxShadow: [
                  BoxShadow(
                    color: sport.gradient.last.withValues(alpha: 0.4),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    sport.emoji,
                    style: const TextStyle(fontSize: 38),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    sport.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Poppins',
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _SportTile {
  final String name, emoji;
  final List<Color> gradient;
  const _SportTile({
    required this.name,
    required this.emoji,
    required this.gradient,
  });
}

class _CommunityPost extends StatelessWidget {
  final String imagePath;
  final bool isAd;
  const _CommunityPost({required this.imagePath, this.isAd = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: _pH),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(_r10),
        border:
            Border.all(color: Colors.white.withValues(alpha: 0.09), width: 0.8),
      ),
      clipBehavior: Clip.hardEdge,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // â”€â”€ Post image â”€â”€
          Image.asset(imagePath,
              width: double.infinity,
              fit: BoxFit.fitWidth,
              errorBuilder: (_, __, ___) => Container(
                    height: 200,
                    color: AppColors.surfaceSlateDeep,
                    child: const Center(
                        child: Icon(Icons.image_not_supported,
                            color: Colors.white24, size: 44)),
                  )),

          // â”€â”€ Ad: Learn More bar only â”€â”€
          if (isAd) const _LearnMoreBar(),

          // â”€â”€ Post: Like/Comment/Share only â”€â”€
          if (!isAd) ...[
            Container(height: 0.5, color: Colors.white.withValues(alpha: 0.07)),
            const _PostActionBar(),
          ],
        ],
      ),
    );
  }
}

// â”€â”€ Learn More bar — light blue matching the ad design â”€â”€
class _LearnMoreBar extends StatelessWidget {
  const _LearnMoreBar();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 46,
      // Light sky-blue from the reference design
      color: AppColors.accentBlueLight,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          const Text('Learn More',
              style: TextStyle(
                  color: AppColors.blueGradientEnd,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Poppins')),
          const Spacer(),
          const Icon(LucideIcons.chevronRight,
              color: AppColors.blueGradientEnd, size: 20),
        ],
      ),
    );
  }
}

// â”€â”€ Post action bar — Like / Comment / Share with custom PNG icons â”€â”€
class _PostActionBar extends StatelessWidget {
  const _PostActionBar();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 44,
      color: AppColors.surfaceL3,
      child: Row(
        children: [
          _PostActionBtn(iconPath: 'assets/icons/like.png', label: 'Like'),
          _VertDivider(),
          _PostActionBtn(
              iconPath: 'assets/icons/comment.png', label: 'Comment'),
          _VertDivider(),
          _PostActionBtn(iconPath: 'assets/icons/share.png', label: 'Share'),
        ],
      ),
    );
  }
}

class _PostActionBtn extends StatelessWidget {
  final String iconPath;
  final String label;
  const _PostActionBtn({required this.iconPath, required this.label});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Image.asset(iconPath,
              width: 18,
              height: 18,
              errorBuilder: (_, __, ___) => const Icon(LucideIcons.thumbsUp,
                  color: Colors.white, size: 16)),
          const SizedBox(width: 6),
          Text(label,
              style: const TextStyle(
                  color: Colors.white, fontSize: 12, fontFamily: 'Poppins')),
        ],
      ),
    );
  }
}

class _VertDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) =>
      Container(width: 0.5, height: 22, color: Colors.white12);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// EXPLORE COMMUNITY CTA
// Fix #9 — gradient (accentCyan â†' accentCyanLight), glow, rounder corners
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// ─────────────────────────────────────────────────────────────────────────────
// LIVE MATCH BANNER
// Shows at top of home only when user has a live/recently finished match.
// Stub data — replace with real provider when scoring backend is ready.
// ─────────────────────────────────────────────────────────────────────────────

/// Compact red banner shown on the home feed whenever there is a match
/// the user might want to watch live. Pulls from [liveMatchesProvider]
/// (hosted + joined + nearby in priority order). Hides cleanly when there
/// is no live match.
class _LiveMatchBanner extends ConsumerWidget {
  const _LiveMatchBanner();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(liveMatchesProvider);
    return async.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (matches) {
        if (matches.isEmpty) return const SizedBox.shrink();
        final m = matches.first;
        final id = (m['id'] ?? m['_id'])?.toString() ?? '';
        final sport = m['gameType']?.toString() ?? 'Match';
        final turfName = (m['turf'] is Map
                ? (m['turf'] as Map)['name']?.toString()
                : null) ??
            m['ground']?.toString() ??
            m['venue']?.toString() ??
            'Live match';
        final hostName = (m['host'] is Map
                ? (m['host'] as Map)['name']?.toString()
                : null) ??
            'Live now';

        return Padding(
          padding: const EdgeInsets.fromLTRB(_pH, 0, _pH, _gSec),
          child: GestureDetector(
            onTap: id.isEmpty
                ? null
                : () => context.push('/scorecard', extra: {'matchId': id}),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(_r12),
                gradient: const LinearGradient(
                  colors: [AppColors.surfaceL0, AppColors.accentRed],
                ),
                border: Border.all(
                    color: Colors.red.withValues(alpha: 0.5), width: 1),
              ),
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  // Red pulse dot for the live indicator.
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(LucideIcons.dot, color: Colors.white, size: 10),
                      SizedBox(width: 2),
                      Text(
                        'LIVE',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            fontFamily: 'Poppins'),
                      ),
                    ]),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '$sport · $turfName',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 11,
                              fontFamily: 'Poppins'),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          'Tap to watch · hosted by $hostName',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              fontFamily: 'Poppins'),
                        ),
                      ],
                    ),
                  ),
                  const Icon(LucideIcons.chevronRight,
                      color: Colors.white38, size: 14),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MY TEAMS SECTION  (HOME priority 4)
// ─────────────────────────────────────────────────────────────────────────────

/// Mixes LIVE matches (top) with recently-COMPLETED matches (below) into
/// one feed. Real backend data — pulls from [liveMatchesProvider] and
/// [recentMatchesProvider]. Tap a live row → /live-score; tap a finished
/// row → /score-history (per-match scorecard route uses the same path
/// today since the screen reads game id from extras).
class _RecentScoresSection extends ConsumerWidget {
  const _RecentScoresSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final live = ref.watch(liveMatchesProvider).valueOrNull ?? const [];
    final recent = ref.watch(recentMatchesProvider).valueOrNull ?? const [];

    if (live.isEmpty && recent.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: _pH),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: _cCard,
            borderRadius: BorderRadius.circular(_r12),
            border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
          ),
          child: Row(children: [
            const Icon(LucideIcons.trophy, color: Colors.white24, size: 28),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Your match scores will appear here once you host or join '
                'a game that gets scored.',
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.45),
                    fontSize: 12,
                    fontFamily: 'Poppins'),
              ),
            ),
          ]),
        ),
      );
    }

    final combined = <Map<String, dynamic>>[
      // Live matches first, up to 3
      ...live.take(3),
      // Then completed
      ...recent.take(5),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: _pH),
      child: Column(
        children: combined.map((g) => LiveMatchCard(item: g)).toList(),
      ),
    );
  }
}

class _ExploreCommunityBtn extends StatelessWidget {
  const _ExploreCommunityBtn();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 44,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: [AppColors.accentTeal, AppColors.accentLime],
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.push('/community'),
          child: const Center(
            child: Text('EXPLORE COMMUNITY',
                style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 2.0,
                    color: Colors.black,
                    fontFamily: 'Poppins')),
          ),
        ),
      ),
    );
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PROFILE DRAWER  — slides in from the right
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
