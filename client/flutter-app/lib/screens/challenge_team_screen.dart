import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../models/team_model.dart';
import '../providers/team_provider.dart';
import '../services/team_service.dart';
import '../widgets/teams/team_card.dart';

class ChallengeTeamScreen extends ConsumerStatefulWidget {
  final String teamId;

  const ChallengeTeamScreen({super.key, required this.teamId});

  @override
  ConsumerState<ChallengeTeamScreen> createState() =>
      _ChallengeTeamScreenState();
}

class _ChallengeTeamScreenState extends ConsumerState<ChallengeTeamScreen> {
  String _query = '';
  String? _sportFilter;
  bool _sending = false;

  void _confirmChallenge(BuildContext context, TeamModel opponent) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceL1,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Challenge ${opponent.name}?',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w700,
                fontFamily: 'Poppins',
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '${opponent.sportType}'
              '${opponent.city != null ? ' · ${opponent.city}' : ''}'
              '  •  ${opponent.members.length} members',
              style:
                  const TextStyle(color: Colors.white54, fontFamily: 'Poppins'),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => context.pop(),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white54,
                      side: const BorderSide(color: Colors.white24),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Cancel',
                        style: TextStyle(fontFamily: 'Poppins')),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _sending
                        ? null
                        : () async {
                            setState(() => _sending = true);
                            context.pop();
                            try {
                              await TeamService()
                                  .requestOpponent(widget.teamId, opponent.id);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                        'Challenge sent to ${opponent.name}!'),
                                    backgroundColor: AppColors.primary
                                        .withValues(alpha: 0.85),
                                  ),
                                );
                              }
                            } catch (_) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content: Text(
                                          'Failed to send challenge. Try again.')),
                                );
                              }
                            } finally {
                              setState(() => _sending = false);
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text(
                      'Send Challenge!',
                      style: TextStyle(
                          color: Colors.black,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'Poppins'),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Pass the sport filter directly — String? has value equality so the
    // provider doesn't refetch on every search-field keystroke.
    final teamsAsync = ref.watch(publicTeamsProvider(_sportFilter));

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => context.pop(),
                    child: const Icon(LucideIcons.chevronLeft,
                        color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'Challenge a Team',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Poppins',
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: TextField(
                onChanged: (v) => setState(() => _query = v.toLowerCase()),
                style:
                    const TextStyle(color: Colors.white, fontFamily: 'Poppins'),
                decoration: InputDecoration(
                  hintText: 'Search teams by name or city...',
                  hintStyle: const TextStyle(
                      color: Colors.white38, fontFamily: 'Poppins'),
                  prefixIcon:
                      const Icon(LucideIcons.search, color: Colors.white38),
                  filled: true,
                  fillColor: AppColors.surfaceL3,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Colors.white12),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Colors.white12),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    'All',
                    'Cricket',
                    'Football',
                    'Badminton',
                    'Volleyball',
                    'Basketball',
                  ]
                      .map((s) => GestureDetector(
                            onTap: () => setState(
                                () => _sportFilter = s == 'All' ? null : s),
                            child: Container(
                              margin: const EdgeInsets.only(right: 8),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 6),
                              decoration: BoxDecoration(
                                color: (_sportFilter == s ||
                                        (s == 'All' && _sportFilter == null))
                                    ? AppColors.primary
                                    : const Color(0xFF1A1A1A),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: (_sportFilter == s ||
                                          (s == 'All' && _sportFilter == null))
                                      ? AppColors.primary
                                      : Colors.white24,
                                ),
                              ),
                              child: Text(
                                s,
                                style: TextStyle(
                                  color: (_sportFilter == s ||
                                          (s == 'All' && _sportFilter == null))
                                      ? Colors.black
                                      : Colors.white70,
                                  fontFamily: 'Poppins',
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ))
                      .toList(),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: teamsAsync.when(
                loading: () => const Center(
                    child: CircularProgressIndicator(color: AppColors.primary)),
                error: (e, _) => Center(
                  child: Text('$e',
                      style: const TextStyle(
                          color: Colors.white54, fontFamily: 'Poppins')),
                ),
                data: (teams) {
                  // Search across name, city, sportType, captain, team code
                  // so any of those finds a match — matches the web client.
                  bool match(TeamModel t) {
                    if (_query.isEmpty) return true;
                    final q = _query;
                    return t.name.toLowerCase().contains(q) ||
                        (t.city?.toLowerCase().contains(q) ?? false) ||
                        t.sportType.toLowerCase().contains(q) ||
                        (t.captainName?.toLowerCase().contains(q) ?? false) ||
                        t.teamCode.toLowerCase().contains(q);
                  }

                  final filtered = teams.where(match).toList();
                  if (filtered.isEmpty) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(LucideIcons.users,
                                color: Colors.white24, size: 48),
                            const SizedBox(height: 12),
                            const Text('No teams found.',
                                style: TextStyle(
                                    color: Colors.white70,
                                    fontFamily: 'Poppins')),
                            if (_query.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Text(
                                'No public team matches "${_query}"${_sportFilter != null ? " in $_sportFilter" : ""}.',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.45),
                                    fontSize: 12,
                                    fontFamily: 'Poppins'),
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  }
                  return ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: filtered.length,
                    itemBuilder: (_, i) {
                      final t = filtered[i];
                      // Mark the team that's doing the challenging so the
                      // user knows why they can't tap it. Self-challenge
                      // is rejected by the backend anyway.
                      final isSelf = t.id == widget.teamId;
                      return Opacity(
                        opacity: isSelf ? 0.5 : 1.0,
                        child: TeamCard(
                          team: t,
                          onTap: isSelf
                              ? null
                              : () => _confirmChallenge(context, t),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
