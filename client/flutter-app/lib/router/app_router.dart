import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/auth_manager.dart';

import '../screens/add_friends_screen.dart';
import '../screens/blogs_screen.dart';
import '../screens/discover_players_screen.dart';
import '../screens/leaderboard_screen.dart';
import '../screens/legal_webview_screen.dart';
import '../screens/raise_dispute_screen.dart';
import '../screens/saved_items_screen.dart';
import '../screens/stream_setup_screen.dart';
import '../screens/address_screen.dart';
import '../screens/application_under_review_screen.dart';
import '../screens/apply_as_academy_screen.dart';
import '../screens/apply_as_coach_screen.dart';
import '../screens/bms_login_screen.dart';
import '../screens/bms_screen_02_fixed.dart';
import '../screens/bms_screen_04_gender.dart';
import '../screens/bms_screen_05_interests.dart';
import '../screens/bms_screen_06_loading.dart';
import '../screens/bms_welcome_screen.dart';
import '../screens/booking_cancellation_screen.dart';
import '../screens/booking_detail_screen.dart';
import '../screens/chat_media_screen.dart';
import '../screens/chat_screen.dart';
import '../screens/chat_user_profile_screen.dart';
import '../screens/community_screen.dart';
import '../screens/conversations_screen.dart';
import '../screens/create_group_screen.dart';
import '../screens/edit_group_screen.dart';
import '../screens/forward_message_screen.dart';
import '../screens/group_info_screen.dart';
import '../screens/select_contacts_screen.dart';
import '../screens/game_details_screen.dart';
import '../screens/ground_booking_checkout_screen.dart';
import '../screens/ground_booking_date_screen.dart';
import '../screens/ground_booking_payment_screen.dart';
import '../screens/ground_booking_success_screen.dart';
import '../screens/ground_booking_timeslot_screen.dart';
import '../screens/ground_detail_screen.dart';
import '../screens/ground_onboarding_screen.dart';
import '../screens/host_game_screen.dart';
import '../screens/join_game_detail_screen.dart';
import '../screens/join_game_host_view_screen.dart';
import '../screens/joined_players_screen.dart';
import '../screens/location_settings_screen.dart';
import '../screens/main_container.dart';
import '../screens/messages_screen.dart';
import '../screens/my_friends_screen.dart';
import '../screens/my_games_screen.dart';
import '../screens/join_games_screen.dart';
import '../screens/tournaments_screen.dart';
import '../screens/tournament_detail_screen.dart';
import '../screens/tournament_create_screen.dart';
import '../screens/match_review_screen.dart';
import '../screens/scoring_screen.dart';
import '../screens/match_details_screen.dart';
import '../screens/match_analytics_screen.dart';
import '../screens/match_view/match_view_screen.dart';
import '../screens/match_view/live_matches_list_screen.dart';
import '../screens/scoring/scorer_auth_screen.dart';
import '../screens/pending_requests_screen.dart';
import '../screens/dev/scoring_smoke_test_screen.dart';
import '../screens/theme_preview_screen.dart';
import '../screens/live_overlay_screen.dart';
import '../screens/scorecard_screen.dart';
import '../screens/score_history_screen.dart';
import '../screens/live_scoreboard_screen.dart';
import '../screens/my_profile_screen.dart';
import '../screens/nearby_players_home_screen.dart';
import '../screens/nearby_players_search_screen.dart';
import '../screens/nearby_players_settings_screen.dart';
import '../screens/new_search_screen.dart';
import '../screens/notification_panel_screen.dart';
import '../screens/otp_verification_screen.dart';
import '../screens/pastupcomingbookings.dart';
import '../screens/payment_screen.dart';
import '../screens/payment_success_screen.dart';
import '../screens/phone_auth_screen.dart';
import '../screens/pick_sports_screen.dart';
import '../screens/player_history_screen.dart';
import '../screens/professional_detail_screen.dart';
import '../screens/professional_payment_screen.dart';
import '../screens/professional_payment_success_screen.dart';
import '../screens/recharge_wallet_screen.dart';
import '../screens/reel_community_view.dart';
import '../screens/reel_upload_screen.dart';
import '../screens/story_upload_screen.dart';
import '../screens/reels_screen.dart';
import '../screens/select_date_screen.dart';
import '../screens/select_location_filter_screen.dart';
import '../screens/select_location_screen.dart';
import '../screens/select_sport_screen.dart';
import '../screens/signature_screen.dart';
import '../screens/sports_interests_screen.dart';
import '../screens/splash_screen.dart';
import '../screens/transaction_history_screen.dart';
import '../screens/user_info_screen.dart';
import '../screens/user_profile_detail_screen.dart';
import '../screens/wallet_screen.dart';
import '../screens/withdraw_money_screen.dart';
import '../screens/write_review_screen.dart';
import '../screens/my_teams_screen.dart';
import '../screens/team_detail_screen.dart';
import '../screens/team_members_screen.dart';
import '../screens/team_pass_screen.dart';
import '../screens/challenge_team_screen.dart';
import '../screens/register_screen.dart';
import '../screens/forgot_password_screen.dart';

// ---------------------------------------------------------------------------
// GoRouterRefreshStream
// Wraps a Stream into a ChangeNotifier so GoRouter can listen for auth changes
// and re-evaluate the redirect guard whenever the auth state changes.
// ---------------------------------------------------------------------------
class GoRouterRefreshStream extends ChangeNotifier {
  late final StreamSubscription<dynamic> _subscription;

  GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    _subscription = stream.asBroadcastStream().listen((_) => notifyListeners());
  }

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}

// ---------------------------------------------------------------------------
// Protected route prefixes — any route NOT starting with one of these
// prefixes requires the user to be logged in.
// ---------------------------------------------------------------------------
const _publicPaths = {
  '/splash',
  '/welcome',
  '/login',
  '/register',
  '/forgot-password',
  '/phone-auth',
  '/otp-verify',
  '/onboarding',
};

bool _isPublic(String location) =>
    _publicPaths.any((p) => location == p || location.startsWith('$p/'));

// ---------------------------------------------------------------------------
// routerProvider
// ---------------------------------------------------------------------------
final routerProvider = Provider<GoRouter>((ref) {
  final refreshListenable = GoRouterRefreshStream(
    AuthManager().authStateChanges,
  );

  return GoRouter(
    initialLocation: '/splash',
    debugLogDiagnostics: true,
    refreshListenable: refreshListenable,

    // ------------------------------------------------------------------
    // Auth redirect guard
    // ------------------------------------------------------------------
    redirect: (context, state) {
      final loggedIn = AuthManager().isLoggedIn;
      final location = state.uri.toString();

      if (!loggedIn && !_isPublic(location)) {
        return '/welcome';
      }
      if (loggedIn &&
          (location == '/welcome' ||
              location == '/login' ||
              location == '/register')) {
        return '/dashboard';
      }
      return null;
    },

    routes: [
      // ----------------------------------------------------------------
      // Splash
      // ----------------------------------------------------------------
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreenRouter(),
      ),

      // ----------------------------------------------------------------
      // Auth
      // ----------------------------------------------------------------
      GoRoute(
        path: '/welcome',
        builder: (context, state) => const BMSWelcomeScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const BmsLoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/phone-auth',
        builder: (context, state) => const PhoneAuthScreen(),
      ),
      GoRoute(
        path: '/otp-verify',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return OTPVerificationScreen(
            phoneNumber: extra['phoneNumber'] as String? ?? '',
            verificationId: extra['verificationId'] as String?,
          );
        },
      ),

      // ----------------------------------------------------------------
      // Onboarding
      // ----------------------------------------------------------------
      GoRoute(
        path: '/onboarding/info',
        builder: (context, state) => const UserInfoScreen(),
      ),
      GoRoute(
        path: '/onboarding/screen-02',
        builder: (context, state) => const BmsScreen02Fixed(),
      ),
      GoRoute(
        path: '/onboarding/gender',
        builder: (context, state) => const BmsScreen04Gender(),
      ),
      GoRoute(
        path: '/onboarding/interests',
        builder: (context, state) => const BmsScreen05Interests(),
      ),
      GoRoute(
        path: '/onboarding/sports-interests',
        builder: (context, state) => const SportsInterestsScreen(),
      ),
      GoRoute(
        path: '/onboarding/loading',
        builder: (context, state) => const BmsScreen06Loading(),
      ),

      // ----------------------------------------------------------------
      // Dashboard
      // ----------------------------------------------------------------
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const MainContainer(),
      ),

      // ----------------------------------------------------------------
      // Home sub-screens
      // ----------------------------------------------------------------
      GoRoute(
        path: '/home/messages',
        builder: (context, state) => const MessagesScreen(),
      ),
      GoRoute(
        path: '/home/notifications',
        builder: (context, state) => const NotificationPanelScreen(),
      ),
      GoRoute(
        path: '/home/profile',
        builder: (context, state) => const UserProfileDetailScreen(),
      ),
      GoRoute(
        path: '/home/ground-detail',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return GroundDetailScreen(
            turfId: extra['turfId'] as String? ?? '',
            groundName: extra['groundName'] as String? ?? '',
            location: extra['location'] as String? ?? '',
            distance: extra['distance'] as String? ?? '',
            rating: (extra['rating'] as num?)?.toDouble() ?? 0.0,
            reviewCount: extra['reviewCount'] as int? ?? 0,
            images: List<String>.from(extra['images'] as List? ?? []),
            pricePerHour: (extra['pricePerHour'] as num?)?.toDouble() ?? 0.0,
          );
        },
      ),
      GoRoute(
        path: '/home/join-game-detail',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          // If a full game map is passed (from live list), use it directly
          final gameMap = extra['game'] as Map<String, dynamic>?;
          return JoinGameDetailScreen(
            gameTitle: extra['gameTitle'] as String? ?? 'Weekend Cricket Match',
            sport: extra['sport'] as String? ?? 'Cricket',
            date: extra['date'] as String? ?? 'Saturday, July 20',
            time: extra['time'] as String? ?? '10:00 AM - 1:00 PM',
            location: extra['location'] as String? ?? 'Central Park, New York',
            game: gameMap,
          );
        },
      ),
      GoRoute(
        path: '/home/game-details',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return GameDetailsScreen(
            gameId: extra['gameId'] as String?,
            sport: extra['sport'] as String?,
            location: extra['location'] as String?,
            date: extra['date'] as DateTime?,
            startTime: extra['startTime'] as TimeOfDay?,
            endTime: extra['endTime'] as TimeOfDay?,
            playerCount: extra['playerCount'] as int?,
            playerShare: (extra['playerShare'] as num?)?.toDouble(),
            isFreeGame: extra['isFreeGame'] as bool? ?? false,
            isFriendly: extra['isFriendly'] as bool? ?? true,
            isPublic: extra['isPublic'] as bool? ?? true,
          );
        },
      ),

      // ----------------------------------------------------------------
      // Bookings
      // ----------------------------------------------------------------
      GoRoute(
        path: '/bookings',
        builder: (context, state) => const BookingsHome(),
      ),

      GoRoute(
        path: '/bookings/detail',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return BookingDetailScreen(
            bookingId: extra['bookingId'] as String? ?? '',
            groundName: extra['groundName'] as String? ?? '',
            address: extra['address'] as String? ?? '',
            selectedDate: extra['selectedDate'] as String? ?? '',
            selectedTimeSlot: extra['selectedTimeSlot'] as String? ?? '',
            duration: extra['duration'] as String? ?? '',
            status: extra['status'] as String? ?? '',
            price: (extra['price'] as num?)?.toDouble() ?? 0.0,
            isPastBooking: extra['isPastBooking'] as bool? ?? false,
            latitude: (extra['latitude'] as num?)?.toDouble() ?? 17.3725929,
            longitude: (extra['longitude'] as num?)?.toDouble() ?? 78.5035713,
          );
        },
      ),
      GoRoute(
        path: '/bookings/cancellation',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return BookingCancellationScreen(
            bookingId: extra['bookingId'] as String? ?? '',
            groundName: extra['groundName'] as String? ?? '',
            selectedDate: extra['selectedDate'] as String? ?? '',
            refundAmount: (extra['refundAmount'] as num?)?.toDouble() ?? 0.0,
          );
        },
      ),

      // ----------------------------------------------------------------
      // Ground Booking Flow
      // ----------------------------------------------------------------
      GoRoute(
        path: '/ground-booking/date',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return GroundBookingDateScreen(
            turfId: extra['turfId'] as String? ?? '',
            groundName: extra['groundName'] as String? ?? '',
            turfImageUrl: extra['turfImageUrl'] as String? ?? '',
            pricePerHour: (extra['pricePerHour'] as num?)?.toDouble() ?? 0.0,
          );
        },
      ),
      GoRoute(
        path: '/ground-booking/timeslot',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return GroundBookingTimeslotScreen(
            groundName: extra['groundName'] as String? ?? '',
            selectedDate: extra['selectedDate'] as String? ?? '',
            selectedTimeSlot: extra['selectedTimeSlot'] as String? ?? '',
            price: (extra['price'] as num?)?.toDouble() ?? 0.0,
          );
        },
      ),
      GoRoute(
        path: '/ground-booking/checkout',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return GroundBookingCheckoutScreen(
            turfId: extra['turfId'] as String? ?? '',
            groundName: extra['groundName'] as String? ?? '',
            selectedDate: extra['selectedDate'] as String? ?? '',
            selectedTimeSlot: extra['selectedTimeSlot'] as String? ?? '',
            startTime: extra['startTime'] as String? ?? '',
            endTime: extra['endTime'] as String? ?? '',
            totalPrice: (extra['totalPrice'] as num?)?.toDouble() ??
                (extra['price'] as num?)?.toDouble() ??
                0.0,
            cancellationPolicy: extra['cancellationPolicy'] as String? ?? '',
          );
        },
      ),
      GoRoute(
        path: '/ground-booking/payment',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return GroundBookingPaymentScreen(
            turfId: extra['turfId'] as String? ?? '',
            groundName: extra['groundName'] as String? ?? '',
            selectedDate: extra['selectedDate'] as String? ?? '',
            selectedTimeSlot: extra['selectedTimeSlot'] as String? ?? '',
            startTime: extra['startTime'] as String? ?? '',
            endTime: extra['endTime'] as String? ?? '',
            totalPrice: (extra['totalPrice'] as num?)?.toDouble() ??
                (extra['advanceAmount'] as num?)?.toDouble() ??
                0.0,
            advanceAmount: (extra['advanceAmount'] as num?)?.toDouble() ?? 0.0,
            balanceAmount: (extra['balanceAmount'] as num?)?.toDouble() ?? 0.0,
            advancePercent: (extra['advancePercent'] as num?)?.toInt() ?? 50,
          );
        },
      ),
      GoRoute(
        path: '/ground-booking/success',
        builder: (context, state) {
          final extra = (state.extra as Map<String, dynamic>?) ?? {};
          return GroundBookingSuccessScreen(
            bookingId: extra['bookingId'] as String? ?? '',
            groundName: extra['groundName'] as String? ?? '',
            selectedDate: extra['selectedDate'] as String? ?? '',
            selectedTimeSlot: extra['selectedTimeSlot'] as String? ?? '',
            totalPrice: (extra['totalPrice'] as num?)?.toDouble() ?? 0.0,
          );
        },
      ),

      // ----------------------------------------------------------------
      // Scoring
      // ----------------------------------------------------------------
      GoRoute(
        path: '/match/:matchId',
        builder: (context, state) {
          final extra = state.extra is Map
              ? Map<String, dynamic>.from(state.extra as Map)
              : <String, dynamic>{};
          final matchId = state.pathParameters['matchId'];
          final game = extra['game'] is Map
              ? Map<String, dynamic>.from(extra['game'] as Map)
              : null;
          // Treat hosts AND officials (umpire/scorer assignments) as eligible
          // to launch the scoring console. Backend `decorateViewerFlags`
          // stamps these onto every hosted-game payload.
          final isHost =
              (game?['isHost'] == true) || extra['canLaunchScoring'] == true;
          return MatchDetailsScreen(
            matchId: matchId,
            game: game,
            canLaunchScoring: isHost,
            onLaunchScoring: matchId == null
                ? null
                : () => context.push('/scorer-auth/$matchId'),
            // Failover entry — same destination as the host's launch
            // button, but exposed to non-hosts. The scorer-auth screen
            // requires the scoring password, so authorization is enforced
            // there, not by hiding the button.
            onTakeOverScoring: matchId == null
                ? null
                : () => context.push('/scorer-auth/$matchId'),
            onViewAnalytics: matchId == null
                ? null
                : () => context.push('/match-view/$matchId'),
          );
        },
      ),
      GoRoute(
        path: '/match-view/:matchId',
        builder: (context, state) =>
            MatchViewScreen(matchId: state.pathParameters['matchId']!),
      ),
      GoRoute(
        path: '/live-matches',
        builder: (context, state) => const LiveMatchesListScreen(),
      ),
      GoRoute(
        path: '/scorer-auth/:gameId',
        builder: (context, state) =>
            ScorerAuthScreen(gameId: state.pathParameters['gameId']!),
      ),
      GoRoute(
        path: '/pending-requests/:gameId',
        builder: (context, state) => PendingRequestsScreen(
          gameId: state.pathParameters['gameId']!,
        ),
      ),
      // Dev-only smoke harness — drives the scoring contract end-to-end
      // against the live backend so we can verify every endpoint without
      // hand-stepping through the wizard. Open from profile drawer in
      // debug builds.
      GoRoute(
        path: '/dev/scoring-smoke',
        builder: (context, state) => const ScoringSmokeTestScreen(),
      ),
      GoRoute(
        path: '/analytics/:matchId',
        builder: (context, state) {
          final extra = state.extra is Map
              ? Map<String, dynamic>.from(state.extra as Map)
              : <String, dynamic>{};
          return MatchAnalyticsScreen(
            matchId: state.pathParameters['matchId'],
            analytics: extra['analytics'] is Map
                ? Map<String, dynamic>.from(extra['analytics'] as Map)
                : null,
          );
        },
      ),
      GoRoute(
        path: '/scoring/theme-preview',
        builder: (context, state) {
          final themeId = state.uri.queryParameters['theme'] ?? 'neon_classic';
          return ThemePreviewScreen(themeId: themeId);
        },
      ),
      GoRoute(
        path: '/live-overlay/:matchId',
        builder: (context, state) {
          final themeId = state.uri.queryParameters['theme'] ?? 'neon_classic';
          return LiveOverlayScreen(
            matchId: state.pathParameters['matchId']!,
            token: state.uri.queryParameters['token'],
            themeId: themeId,
          );
        },
      ),

      // ----------------------------------------------------------------
      // Host / Join Game
      // ----------------------------------------------------------------
      GoRoute(
        path: '/host-game',
        builder: (context, state) => const HostGameScreen(),
      ),
      GoRoute(
        path: '/join-game/host-view',
        builder: (context, state) => const JoinGameHostViewScreen(),
      ),
      GoRoute(
        path: '/join-game/joined-players',
        builder: (context, state) {
          final extra = (state.extra as Map?) ?? const {};
          return JoinedPlayersScreen(
            gameId: extra['gameId']?.toString() ?? '',
            initialGame: extra['game'] is Map<String, dynamic>
                ? extra['game'] as Map<String, dynamic>
                : null,
          );
        },
      ),
      GoRoute(
        path: '/my-games',
        builder: (context, state) => const MyGamesScreen(),
      ),
      GoRoute(
        path: '/join-games',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return JoinGamesScreen(
            initialSport: extra['sport'] as String?,
          );
        },
      ),

      // ----------------------------------------------------------------
      // Tournaments
      // ----------------------------------------------------------------
      GoRoute(
        path: '/tournaments',
        builder: (context, state) => const TournamentsScreen(),
      ),
      GoRoute(
        path: '/tournaments/detail',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return TournamentDetailScreen(tournament: extra);
        },
      ),
      GoRoute(
        path: '/tournaments/create',
        builder: (context, state) => const TournamentCreateScreen(),
      ),

      // ----------------------------------------------------------------
      // Scoring
      // ----------------------------------------------------------------
      GoRoute(
        path: '/match-review/:matchId',
        builder: (context, state) => MatchReviewScreen(
          matchId: state.pathParameters['matchId'] ?? '',
        ),
      ),
      GoRoute(
        path: '/scoring',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return ScoringScreen(
            matchId: extra['matchId'] as String? ?? '',
            sport: extra['sport'] as String? ?? 'Cricket',
            teamA: extra['teamA'] as String? ?? 'Team A',
            teamB: extra['teamB'] as String? ?? 'Team B',
            location: extra['location'] as String? ?? '',
            // Optional pre-set toss from StartScoringModal step 5.
            presetTossWinner: extra['tossWinner'] as String?,
            presetTossDecision: extra['tossDecision'] as String?,
            // Format / overs the creator entered in the wizard — used by the
            // pre-match view so it doesn't fall back to T20/20 when the
            // backend session hasn't been started yet.
            presetFormat: extra['format'] as String?,
            presetOvers: (extra['overs'] as num?)?.toInt(),
          );
        },
      ),
      GoRoute(
        path: '/scorecard',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return ScorecardScreen(
            matchId: extra['matchId'] as String? ?? '',
            sport: extra['sport'] as String? ?? 'Cricket',
            teamA: extra['teamA'] as String? ?? 'Team A',
            teamB: extra['teamB'] as String? ?? 'Team B',
            scoreA: extra['scoreA'] as int? ?? 0,
            scoreB: extra['scoreB'] as int? ?? 0,
            wicketsA: extra['wicketsA'] as int? ?? 0,
            wicketsB: extra['wicketsB'] as int? ?? 0,
            oversA: (extra['oversA'] as num?)?.toDouble() ?? 0.0,
            oversB: (extra['oversB'] as num?)?.toDouble() ?? 0.0,
            winner: extra['winner'] as String?,
            location: extra['location'] as String? ?? '',
            matchName: extra['matchName'] as String?,
          );
        },
      ),
      GoRoute(
        path: '/score-history',
        builder: (context, state) => const ScoreHistoryScreen(),
      ),
      GoRoute(
        path: '/live-score',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return LiveScoreboardScreen(
            matchId: extra['matchId'] as String? ?? '',
          );
        },
      ),

      // ----------------------------------------------------------------
      // Pickers (result-returning)
      // ----------------------------------------------------------------
      GoRoute(
        path: '/pick-sports',
        builder: (context, state) => const PickSportsScreen(),
      ),
      GoRoute(
        path: '/select-sport',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return SelectSportScreen(
            selectedSport: extra['selectedSport'] as String?,
          );
        },
      ),
      GoRoute(
        path: '/select-location',
        builder: (context, state) => const SelectLocationScreen(),
      ),
      GoRoute(
        path: '/select-location-filter',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return SelectLocationFilterScreen(
            selectedLocation: extra['selectedLocation'] as String?,
          );
        },
      ),
      GoRoute(
        path: '/select-date',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return SelectDateScreen(
            selectedDate: extra['selectedDate'] as DateTime?,
          );
        },
      ),

      GoRoute(
        path: '/address',
        builder: (context, state) => const AddressScreen(),
      ),
      GoRoute(
        path: '/payment',
        builder: (context, state) => const PaymentScreen(),
      ),
      GoRoute(
        path: '/success',
        builder: (context, state) => const PaymentSuccessScreen(),
      ),

      // ----------------------------------------------------------------
      // Professional services
      // ----------------------------------------------------------------
      GoRoute(
        path: '/professional/detail',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? const {};
          return ProfessionalDetailScreen(
            professionalId:
                extra['professionalId'] as String? ?? extra['id'] as String?,
          );
        },
      ),
      GoRoute(
        path: '/professional/payment',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return ProfessionalPaymentScreen(
            amount: (extra['amount'] as num?)?.toDouble() ?? 0.0,
            date: extra['date'] as String? ?? '',
            timeSlot: extra['timeSlot'] as String? ?? '',
            professionalName:
                extra['professionalName'] as String? ?? 'B.M Sportz',
          );
        },
      ),
      GoRoute(
        path: '/professional/success',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return ProfessionalPaymentSuccessScreen(
            amount: (extra['amount'] as num?)?.toDouble() ?? 0.0,
            paymentMethod: extra['paymentMethod'] as String? ?? 'UPI',
            date: extra['date'] as String? ?? '',
            transactionId: extra['transactionId'] as String? ?? '',
            professionalName:
                extra['professionalName'] as String? ?? 'B.M Sportz',
          );
        },
      ),

      // ----------------------------------------------------------------
      // Nearby players
      // ----------------------------------------------------------------
      GoRoute(
        path: '/nearby-players',
        builder: (context, state) => const NearbyPlayersHomeScreen(),
      ),
      GoRoute(
        path: '/nearby-players/search',
        builder: (context, state) => const NearbyPlayersSearchScreen(),
      ),
      GoRoute(
        path: '/nearby-players/settings',
        builder: (context, state) => const NearbyPlayersSettingsScreen(),
      ),

      // ----------------------------------------------------------------
      // Community
      // ----------------------------------------------------------------
      GoRoute(
        path: '/community',
        builder: (context, state) => const CommunityScreen(),
      ),

      // ----------------------------------------------------------------
      // Conversations / Chat
      // ----------------------------------------------------------------
      GoRoute(
        path: '/conversations',
        builder: (context, state) => const ConversationsScreen(),
      ),
      GoRoute(
        path: '/messages',
        builder: (context, state) => const MessagesScreen(),
      ),
      GoRoute(
        path: '/chat',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return ChatScreen(
            chatId: extra['chatId'] as String? ?? '',
            friendId: extra['friendId'] as String? ?? '',
            friendName: extra['friendName'] as String? ?? '',
            friendPhoto: extra['friendPhoto'] as String?,
            isGroup: extra['isGroup'] as bool? ?? false,
            members: List<Map<String, dynamic>>.from(
                extra['members'] as List? ?? []),
          );
        },
      ),
      GoRoute(
        path: '/select-contacts',
        builder: (context, state) => const SelectContactsScreen(),
      ),
      GoRoute(
        path: '/create-group',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          final selected =
              List<Map<String, dynamic>>.from(extra['selected'] as List? ?? []);
          return CreateGroupScreen(selectedContacts: selected);
        },
      ),
      GoRoute(
        path: '/group-info',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return GroupInfoScreen(
            groupId: extra['groupId'] as String? ?? '',
            groupName: extra['groupName'] as String? ?? 'Group',
            groupPhoto: extra['groupPhoto'] as String?,
            description: extra['description'] as String?,
            members: List<Map<String, dynamic>>.from(
                extra['members'] as List? ?? []),
            currentUserId: extra['currentUserId'] as String? ?? '',
          );
        },
      ),
      GoRoute(
        path: '/edit-group',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return EditGroupScreen(
            groupId: extra['groupId'] as String? ?? '',
            initialName: extra['initialName'] as String? ?? '',
            initialDescription: extra['initialDescription'] as String?,
            initialPhoto: extra['initialPhoto'] as String?,
          );
        },
      ),
      GoRoute(
        path: '/forward-message',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return ForwardMessageScreen(
            messageId: extra['messageId'] as String? ?? '',
          );
        },
      ),
      GoRoute(
        path: '/chat-media',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return ChatMediaScreen(
            chatId: extra['chatId'] as String? ?? '',
            chatName: extra['chatName'] as String? ?? '',
          );
        },
      ),
      GoRoute(
        path: '/chat-profile',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return ChatUserProfileScreen(
            friendId: extra['friendId'] as String? ?? '',
            friendName: extra['friendName'] as String? ?? '',
            friendPhoto: extra['friendPhoto'] as String?,
          );
        },
      ),
      GoRoute(
        path: '/my-friends',
        builder: (context, state) => const MyFriendsScreen(),
      ),
      GoRoute(
        path: '/add-friends',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return AddFriendsScreen(
            latitude: (extra['latitude'] as num?)?.toDouble() ?? 0.0,
            longitude: (extra['longitude'] as num?)?.toDouble() ?? 0.0,
            radiusKm: extra['radiusKm'] as int? ?? 25,
          );
        },
      ),

      // ----------------------------------------------------------------
      // Profile
      // ----------------------------------------------------------------
      GoRoute(
        path: '/profile',
        builder: (context, state) => const MyProfileScreen(),
      ),
      GoRoute(
        path: '/user-profile',
        builder: (context, state) => const UserProfileDetailScreen(),
      ),
      GoRoute(
        path: '/player-history',
        builder: (context, state) => const PlayerHistoryScreen(),
      ),
      GoRoute(
        path: '/apply-coach',
        builder: (context, state) => const ApplyAsCoachScreen(),
      ),
      GoRoute(
        path: '/apply-academy',
        builder: (context, state) => const ApplyAsAcademyScreen(),
      ),
      GoRoute(
        path: '/application-review',
        builder: (context, state) => const ApplicationUnderReviewScreen(),
      ),

      // ----------------------------------------------------------------
      // Ground onboarding / Signature
      // ----------------------------------------------------------------
      GoRoute(
        path: '/ground-onboarding',
        builder: (context, state) => const GroundOnboardingScreen(),
      ),
      GoRoute(
        path: '/signature',
        builder: (context, state) => const SignatureScreen(),
      ),
      GoRoute(
        path: '/sports-interests',
        builder: (context, state) => const SportsInterestsScreen(),
      ),

      // ----------------------------------------------------------------
      // Reels
      // ----------------------------------------------------------------
      GoRoute(
        path: '/reels',
        builder: (context, state) => const ReelsScreen(),
      ),
      GoRoute(
        path: '/reel-community',
        builder: (context, state) => const ReelCommunityView(),
      ),
      GoRoute(
        path: '/reel-upload',
        builder: (context, state) => const ReelUploadScreen(),
      ),
      GoRoute(
        path: '/story-upload',
        builder: (context, state) => const StoryUploadScreen(),
      ),

      // ----------------------------------------------------------------
      // Wallet
      // ----------------------------------------------------------------
      GoRoute(
        path: '/wallet',
        builder: (context, state) => const WalletScreen(),
      ),
      GoRoute(
        path: '/wallet/recharge',
        builder: (context, state) => const RechargeWalletScreen(),
      ),
      GoRoute(
        path: '/wallet/withdraw',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return WithdrawMoneyScreen(
            currentBalance:
                (extra['currentBalance'] as num?)?.toDouble() ?? 0.0,
            transactions: List<Map<String, dynamic>>.from(
                extra['transactions'] as List? ?? []),
          );
        },
      ),
      GoRoute(
        path: '/wallet/transactions',
        builder: (context, state) => const TransactionHistoryScreen(),
      ),

      // ----------------------------------------------------------------
      // Utility
      // ----------------------------------------------------------------
      GoRoute(
        path: '/search',
        builder: (context, state) => const NewSearchScreen(),
      ),
      GoRoute(
        path: '/location-settings',
        builder: (context, state) => const LocationSettingsScreen(),
      ),
      GoRoute(
        path: '/notification-panel',
        builder: (context, state) => const NotificationPanelScreen(),
      ),
      GoRoute(
        path: '/write-review',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return WriteReviewScreen(
            groundName: extra['groundName'] as String?,
          );
        },
      ),

      // ----------------------------------------------------------------
      // My Teams
      // ----------------------------------------------------------------
      GoRoute(
        path: '/my-teams',
        builder: (context, state) => const MyTeamsScreen(),
      ),
      GoRoute(
        path: '/my-teams/:id',
        builder: (context, state) =>
            TeamDetailScreen(teamId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/my-teams/:id/members',
        builder: (context, state) =>
            TeamMembersScreen(teamId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/my-teams/:id/pass',
        builder: (context, state) =>
            TeamPassScreen(teamId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/my-teams/:id/challenge',
        builder: (context, state) =>
            ChallengeTeamScreen(teamId: state.pathParameters['id']!),
      ),

      // Content features (parity with web frontend)
      GoRoute(
        path: '/leaderboard',
        builder: (context, state) => const LeaderboardScreen(),
      ),
      GoRoute(
        path: '/discover-players',
        builder: (context, state) => const DiscoverPlayersScreen(),
      ),
      GoRoute(
        path: '/blogs',
        builder: (context, state) => const BlogsScreen(),
      ),
      GoRoute(
        path: '/saved',
        builder: (context, state) => const SavedItemsScreen(),
      ),
      GoRoute(
        path: '/dispute',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? const {};
          return RaiseDisputeScreen(
            bookingId: extra['bookingId'] as String?,
            gameId: extra['gameId'] as String?,
          );
        },
      ),

      // Legal pages — WebView-loaded from the kridaz.com site so copy
      // stays canonical across web + mobile.
      GoRoute(
        path: '/legal/:slug',
        builder: (context, state) => LegalWebViewScreen(
          slug: state.pathParameters['slug'] ?? 'terms',
        ),
      ),

      // Stream setup — YouTube / Facebook live streaming for a match.
      GoRoute(
        path: '/stream-setup',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? const {};
          return StreamSetupScreen(matchId: extra['matchId']?.toString() ?? '');
        },
      ),
    ],
  );
});
