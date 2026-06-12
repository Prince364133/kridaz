import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../widgets/common/bms_toast.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../models/pending_match_model.dart';
import '../providers/pending_matches_provider.dart';
import '../services/scoring_service.dart';
import '../widgets/home/quick_action_icons_3d.dart';
import '../widgets/scoring/live_match_card.dart';
import '../widgets/scoring/start_scoring_modal.dart';
import '../services/match_feed_service.dart';
import 'new_home_dashboard.dart' show HomeHeader;

class GamesScreen extends StatelessWidget {
  const GamesScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const HomeHeader(),
              const SizedBox(height: 8),
              // Section title
              const Padding(
                padding: EdgeInsets.fromLTRB(20, 4, 20, 4),
                child: Text(
                  'GAMES',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    fontFamily: 'Poppins',
                    letterSpacing: 1.5,
                  ),
                ),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  'Join · Compete · Score',
                  style: TextStyle(
                    color: AppColors.textGray,
                    fontSize: 13,
                    fontFamily: 'Poppins',
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // ── 2×2 Hero Grid — Saavik 3D compact banner cards (190 × 70)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: QuickActionWideCard3D(
                            kind: QuickIcon3DKind.joinAGame,
                            height: 70,
                            iconSize: 56,
                            onTap: () {
                              HapticFeedback.lightImpact();
                              context.push('/join-games');
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: QuickActionWideCard3D(
                            kind: QuickIcon3DKind.tournaments,
                            // Games-page tournaments uses the design's purple
                            // card gradient, not the home-row gold tile.
                            gradientColors: const [
                              Color(0xFFB44DEA),
                              Color(0xFF8A1FD6),
                            ],
                            height: 70,
                            iconSize: 56,
                            onTap: () {
                              HapticFeedback.lightImpact();
                              context.push('/tournaments');
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: QuickActionWideCard3D(
                            kind: QuickIcon3DKind.myTeams,
                            // Games-page myTeams keeps the purple shield but
                            // sits on a green card per the design.
                            gradientColors: const [
                              Color(0xFF3FB24E),
                              Color(0xFF268A37),
                            ],
                            height: 70,
                            iconSize: 56,
                            onTap: () {
                              HapticFeedback.lightImpact();
                              context.push('/my-teams');
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Consumer(
                            builder: (context, ref, _) => QuickActionWideCard3D(
                              kind: QuickIcon3DKind.scoreAMatch,
                              height: 70,
                              iconSize: 56,
                              onTap: () {
                                HapticFeedback.lightImpact();
                                _showStartScoringSheet(context, ref);
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 28),

              // ── Ready to Start ────────────────────────────────────────
              // Matches the user created via the Start Scoring wizard but
              // hasn't actually started yet. Tapping one opens the review
              // + password screen, which is what finally hands off to the
              // live scorer.
              const _ReadyToStartList(),

              // â”€â”€ Recent Scores â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Recent Scores',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'Poppins',
                      ),
                    ),
                    GestureDetector(
                      onTap: () => context.push('/score-history'),
                      child: const Text(
                        'See all',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          fontFamily: 'Poppins',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              const _RecentScoresList(),
              // Clear the glass nav bar + safe area so nothing is hidden
              SizedBox(height: 80 + MediaQuery.of(context).padding.bottom),
            ],
          ),
        ),
      ),
    );
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Hero Card (2Ã—2 grid tile)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Scoring sheet helpers
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Launches the 5-step `StartScoringModal` (Match Setup → Teams → Playing XIs
// → Add-ons → Review) — the same flow as the kridaz web app.
//
// After the backend creates the match we no longer push directly into the
// live scorer. The match lands in the pending-matches provider; the user
// sees it under "Ready to Start" on this screen, taps it, reviews the
// details and enters the scoring password before the scorer opens. Matches
// the web flow: create → review → password → start.
void _showStartScoringSheet(BuildContext rootContext, WidgetRef ref) {
  Navigator.of(rootContext, rootNavigator: true).push(
    MaterialPageRoute(
      fullscreenDialog: true,
      builder: (ctx) => StartScoringModal(
        onClose: () => Navigator.of(ctx).maybePop(),
        onConfirm: (result) async {
          Map<String, dynamic> playerJson(
              PickedPlayer p, String teamKey, int i) {
            // Real users from the player search keep their id; custom adds get a
            // synthesized client id so the engine can disambiguate them.
            final id = p.id ??
                '${teamKey}_${DateTime.now().microsecondsSinceEpoch}_$i';
            return <String, dynamic>{
              'isCustom': p.isCustom,
              'name': p.name,
              'id': id,
              'role': p.role,
              if (p.phone != null) 'phone': p.phone,
              if (p.avatar != null) 'profilePicture': p.avatar,
            };
          }

          final aPlayers = <Map<String, dynamic>>[
            for (var i = 0; i < result.teamAPlayers.length; i++)
              playerJson(result.teamAPlayers[i], 'a', i),
          ];
          final bPlayers = <Map<String, dynamic>>[
            for (var i = 0; i < result.teamBPlayers.length; i++)
              playerJson(result.teamBPlayers[i], 'b', i),
          ];

          final res = await ScoringService().setupScoringGame(
            matchName: result.matchName.isEmpty
                ? '${result.teamAName} vs ${result.teamBName}'
                : result.matchName,
            teamAName: result.teamAName,
            teamBName: result.teamBName,
            teamAId: result.teamAId,
            teamBId: result.teamBId,
            teamAPlayers: aPlayers,
            teamBPlayers: bPlayers,
            overs: result.overs,
            location: result.venueName,
            venueId: result.venueId,
            venueLat: result.customVenueLat,
            venueLng: result.customVenueLng,
            umpireId: result.umpireId,
            umpireName: result.umpireName,
            ballType: result.ballType,
            groundType: result.groundType,
            pitchType: result.pitchType,
            matchTiming: result.timing,
            youtubeLiveUrl: result.youtubeLiveUrl,
            scoringPassword: result.scoringPassword,
            powerPlayOvers: result.powerPlayOvers,
            maxMembers: result.maxMembers,
            matchDateTime: result.matchDate,
            formatOverride: result.format,
            houseRules: result.houseRules.isEmpty ? null : result.houseRules,
          );
          if (!ctx.mounted) return;
          if (!res.ok || res.data == null) {
            BmsToast.error(ctx, res.error ?? 'Could not create match');
            return;
          }

          final matchId = res.data!['id']!;
          await ref.read(pendingMatchesProvider.notifier).add(
                PendingMatch(
                  matchId: matchId,
                  matchName: result.matchName.isEmpty
                      ? '${result.teamAName} vs ${result.teamBName}'
                      : result.matchName,
                  teamAName: result.teamAName,
                  teamBName: result.teamBName,
                  teamAPlayerCount: result.teamAPlayers.length,
                  teamBPlayerCount: result.teamBPlayers.length,
                  format: result.format,
                  overs: result.overs,
                  powerPlayOvers: result.powerPlayOvers,
                  maxMembers: result.maxMembers,
                  ballType: result.ballType,
                  groundType: result.groundType,
                  pitchType: result.pitchType,
                  timing: result.timing,
                  venueName: result.venueName,
                  matchDate: result.matchDate,
                  umpireName: result.umpireName,
                  scorerName: result.scorerName,
                  streamerName: result.streamerName,
                  youtubeLiveUrl: result.youtubeLiveUrl,
                  hasScoringPassword: result.scoringPassword != null &&
                      result.scoringPassword!.isNotEmpty,
                  tossWinner: result.tossWinner,
                  tossDecision: result.tossDecision,
                  location: result.venueName,
                  createdAt: DateTime.now(),
                ),
              );

          if (!ctx.mounted) return;
          Navigator.of(ctx).pop();
          BmsToast.success(
              rootContext, 'Match created. Tap "Ready to Start" to begin.');
        },
      ),
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────
// Ready to Start
// ─────────────────────────────────────────────────────────────────────
class _ReadyToStartList extends ConsumerStatefulWidget {
  const _ReadyToStartList();

  @override
  ConsumerState<_ReadyToStartList> createState() => _ReadyToStartListState();
}

class _ReadyToStartListState extends ConsumerState<_ReadyToStartList> {
  bool _cleanupRan = false;

  @override
  void initState() {
    super.initState();
    // Schedule a best-effort sweep after first frame — we can't read the
    // provider safely from initState (the framework asserts), and we need
    // the current list to know what to check.
    WidgetsBinding.instance.addPostFrameCallback((_) => _sweepCompleted());
  }

  /// Best-effort cleanup: fetch each pending match's status; if the backend
  /// reports COMPLETED, drop it from the pending list. Failures are
  /// swallowed — the card sticks around so the user can retry next launch.
  Future<void> _sweepCompleted() async {
    if (_cleanupRan) return;
    _cleanupRan = true;
    final pending = ref.read(pendingMatchesProvider);
    if (pending.isEmpty) return;
    final service = ScoringService();
    for (final m in pending) {
      try {
        final res = await service.getMatchStatus(m.matchId);
        if (!mounted) return;
        final session = res.data?.session;
        final status = session?.status.toUpperCase() ?? '';
        if (status == 'COMPLETED') {
          await ref.read(pendingMatchesProvider.notifier).remove(m.matchId);
        }
      } catch (_) {
        // Network errors, 404s on un-started matches, etc. — keep the card.
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final pending = ref.watch(pendingMatchesProvider);
    if (pending.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Ready to Start',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Poppins',
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${pending.length}',
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    fontFamily: 'Poppins',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          for (final m in pending) _PendingMatchCard(match: m),
        ],
      ),
    );
  }
}

class _PendingMatchCard extends StatelessWidget {
  final PendingMatch match;
  const _PendingMatchCard({required this.match});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        context.push('/match-review/${match.matchId}');
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AppColors.primary.withValues(alpha: 0.16),
              AppColors.primary.withValues(alpha: 0.04),
            ],
          ),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.35)),
        ),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(LucideIcons.flagTriangleRight,
                  color: AppColors.primary, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    match.matchName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Poppins',
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${match.teamAName}  vs  ${match.teamBName}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                      fontFamily: 'Poppins',
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      _chip('${match.format} • ${match.overs}o'),
                      const SizedBox(width: 6),
                      if (match.hasScoringPassword)
                        _chip('PWD', icon: LucideIcons.lock)
                      else
                        _chip('OPEN', icon: LucideIcons.unlock),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(LucideIcons.chevronRight,
                color: Colors.white54, size: 18),
          ],
        ),
      ),
    );
  }

  Widget _chip(String label, {IconData? icon}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 10, color: Colors.white70),
            const SizedBox(width: 3),
          ],
          Text(
            label,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 10,
              fontWeight: FontWeight.w700,
              fontFamily: 'Poppins',
              letterSpacing: 0.8,
            ),
          ),
        ],
      ),
    );
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// List Card (used for More section)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _GamesCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String detail;
  final Color accentColor;
  final VoidCallback onTap;

  const _GamesCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.detail,
    required this.accentColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.fromLTRB(20, 0, 20, 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.backgroundCard,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.borderGray),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: accentColor.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: accentColor, size: 24),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'Poppins',
                      )),
                  const SizedBox(height: 2),
                  Text(subtitle,
                      style: const TextStyle(
                        color: AppColors.textLightGray,
                        fontSize: 12,
                        fontFamily: 'Poppins',
                      )),
                  const SizedBox(height: 2),
                  Text(detail,
                      style: TextStyle(
                        color: accentColor.withValues(alpha: 0.8),
                        fontSize: 11,
                        fontFamily: 'Poppins',
                      )),
                ],
              ),
            ),
            Icon(LucideIcons.chevronRight,
                color: Colors.white.withValues(alpha: 0.25), size: 14),
          ],
        ),
      ),
    );
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Recent Scores
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _RecentScoresList extends StatefulWidget {
  const _RecentScoresList();

  @override
  State<_RecentScoresList> createState() => _RecentScoresListState();
}

class _RecentScoresListState extends State<_RecentScoresList> {
  final _feed = MatchFeedService();
  List<Map<String, dynamic>> _live = const [];
  List<Map<String, dynamic>> _recent = const [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final live = await _feed.liveForUser();
    final recent = await _feed.recentForUser(limit: 5);
    if (!mounted) return;
    setState(() {
      _live = live;
      _recent = recent;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 30),
        child: Center(
          child: SizedBox(
            width: 22,
            height: 22,
            child: CircularProgressIndicator(
                strokeWidth: 2, color: Colors.white54),
          ),
        ),
      );
    }
    final combined = <Map<String, dynamic>>[
      ..._live.take(3),
      ..._recent.take(5),
    ];
    if (combined.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        child: Center(
          child: Text(
            'No match scores yet.\nPlay a match and score it!',
            textAlign: TextAlign.center,
            style: TextStyle(
                color: AppColors.textGray, fontSize: 14, fontFamily: 'Poppins'),
          ),
        ),
      );
    }
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: combined.map((g) => LiveMatchCard(item: g)).toList(),
      ),
    );
  }
}
