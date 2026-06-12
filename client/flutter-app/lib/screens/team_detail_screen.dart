import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../widgets/common/bms_toast.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../core/constants/app_colors.dart';
import '../core/util/image_url.dart';
import '../models/team_opponent_request_model.dart';
import '../providers/team_provider.dart';
import '../services/auth_manager.dart';
import '../services/team_service.dart';
import '../widgets/teams/team_code_chip.dart';
import '../widgets/teams/team_stats_row.dart';
import '../models/team_model.dart';
import '../widgets/teams/member_card.dart';
import '../widgets/teams/invite_member_modal.dart';
import '../widgets/teams/create_team_modal.dart';
import '../widgets/teams/opponent_request_modal.dart';

class TeamDetailScreen extends ConsumerWidget {
  final String teamId;

  const TeamDetailScreen({super.key, required this.teamId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final teamAsync = ref.watch(teamDetailProvider(teamId));
    final currentUserId =
        (AuthManager().currentUser?['id'] ?? AuthManager().currentUser?['_id'])
            ?.toString();

    return Scaffold(
      backgroundColor: Colors.black,
      body: teamAsync.when(
        loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(LucideIcons.alertCircle,
                  color: Colors.white38, size: 48),
              const SizedBox(height: 12),
              Text('$e',
                  style: const TextStyle(
                      color: Colors.white54, fontFamily: 'Poppins')),
              TextButton(
                onPressed: () => ref.invalidate(teamDetailProvider(teamId)),
                child: const Text('Retry',
                    style: TextStyle(color: AppColors.primary)),
              ),
            ],
          ),
        ),
        data: (team) {
          final isOwner = team.ownerId == currentUserId;
          final previewMembers = team.members.take(4).toList();

          return CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 220,
                backgroundColor: Colors.black,
                leading: IconButton(
                  icon:
                      const Icon(LucideIcons.chevronLeft, color: Colors.white),
                  onPressed: () => context.pop(),
                ),
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      team.imageUrl != null
                          ? CachedNetworkImage(
                              imageUrl: team.imageUrl!,
                              fit: BoxFit.cover,
                              errorWidget: (_, __, ___) =>
                                  Container(color: AppColors.surfaceL3),
                            )
                          : Container(color: AppColors.surfaceL3),
                      Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              Colors.black,
                            ],
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 16,
                        left: 20,
                        right: isOwner ? 60 : 20,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              team.name,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.w700,
                                fontFamily: 'Poppins',
                              ),
                            ),
                            Row(
                              children: [
                                _SportBadge(sport: team.sportType),
                                if (team.city != null) ...[
                                  const SizedBox(width: 8),
                                  const Icon(LucideIcons.mapPin,
                                      color: Colors.white38, size: 14),
                                  Text(
                                    team.city!,
                                    style: const TextStyle(
                                        color: Colors.white54,
                                        fontSize: 13,
                                        fontFamily: 'Poppins'),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                      if (isOwner)
                        Positioned(
                          bottom: 16,
                          right: 16,
                          child: GestureDetector(
                            onTap: () => showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (_) => CreateTeamModal(
                                teamId: team.id,
                                initialValues: {
                                  'name': team.name,
                                  'description': team.description,
                                  'sportType': team.sportType,
                                  'city': team.city,
                                },
                                onSuccess: () =>
                                    ref.invalidate(teamDetailProvider(teamId)),
                              ),
                            ),
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.black54,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(LucideIcons.pencil,
                                  color: Colors.white70, size: 20),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (team.description != null) ...[
                        Text(
                          team.description!,
                          style: const TextStyle(
                              color: Colors.white70,
                              fontFamily: 'Poppins',
                              fontSize: 14),
                        ),
                        const SizedBox(height: 20),
                      ],
                      TeamCodeChip(code: team.teamCode),
                      const SizedBox(height: 24),
                      TeamStatsRow(memberCount: team.members.length),
                      const SizedBox(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Members',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              fontFamily: 'Poppins',
                            ),
                          ),
                          GestureDetector(
                            onTap: () =>
                                context.push('/my-teams/$teamId/members'),
                            child: const Text(
                              'View All',
                              style: TextStyle(
                                  color: AppColors.primary,
                                  fontFamily: 'Poppins'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      ...previewMembers.map(
                        (m) => MemberCard(
                          member: m,
                          isOwner: isOwner,
                          onSetTeamRole: isOwner
                              ? (role) => _setTeamRole(context, ref, m, role)
                              : null,
                          onSetPlayingRole: isOwner
                              ? (role) => _setPlayingRole(context, ref, m, role)
                              : null,
                          onRemove: isOwner && m.role != TeamRole.captain
                              ? () => _removeMember(context, ref, m)
                              : null,
                        ),
                      ),
                      const SizedBox(height: 24),
                      _ActionGrid(
                        teamId: teamId,
                        isOwner: isOwner,
                        onInvite: () => showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => InviteMemberModal(
                            teamId: teamId,
                            onSuccess: () =>
                                ref.invalidate(teamDetailProvider(teamId)),
                          ),
                        ),
                        onDelete:
                            isOwner ? () => _confirmDelete(context, ref) : null,
                      ),
                      const SizedBox(height: 24),
                      // Pending member join requests (owner only)
                      if (isOwner)
                        _MemberJoinRequestsSection(
                          teamId: teamId,
                          onHandled: () =>
                              ref.invalidate(teamDetailProvider(teamId)),
                        ),

                      // Incoming challenge requests
                      _IncomingChallengesSection(
                        teamId: teamId,
                        onHandled: () =>
                            ref.invalidate(teamDetailProvider(teamId)),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _setTeamRole(BuildContext context, WidgetRef ref,
      TeamMemberModel m, TeamRole role) async {
    final ok = await TeamService().updateMemberRole(
      teamId,
      m.userId,
      role: role.apiValue,
    );
    if (!context.mounted) return;
    if (ok) {
      ref.invalidate(teamDetailProvider(teamId));
    } else {
      BmsToast.error(context, 'Could not update team role');
    }
  }

  Future<void> _setPlayingRole(BuildContext context, WidgetRef ref,
      TeamMemberModel m, PlayingRole role) async {
    final ok = await TeamService().updateMemberRole(
      teamId,
      m.userId,
      playingRole: role.apiValue,
    );
    if (!context.mounted) return;
    if (ok) {
      ref.invalidate(teamDetailProvider(teamId));
    } else {
      BmsToast.error(context, 'Could not update playing role');
    }
  }

  Future<void> _removeMember(
      BuildContext context, WidgetRef ref, TeamMemberModel m) async {
    final ok = await TeamService().removeMember(teamId, m.userId);
    if (!context.mounted) return;
    if (ok) {
      ref.invalidate(teamDetailProvider(teamId));
    } else {
      BmsToast.error(context, 'Could not remove member');
    }
  }

  void _confirmDelete(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.surfaceL3,
        title: const Text('Delete Team',
            style: TextStyle(color: Colors.white, fontFamily: 'Poppins')),
        content: const Text(
          'This will permanently delete the team and remove all members. Are you sure?',
          style: TextStyle(color: Colors.white70, fontFamily: 'Poppins'),
        ),
        actions: [
          TextButton(
            onPressed: () => context.pop(),
            child:
                const Text('Cancel', style: TextStyle(color: Colors.white54)),
          ),
          TextButton(
            onPressed: () async {
              context.pop();
              await TeamService().deleteTeam(teamId);
              ref.invalidate(myTeamsProvider);
              if (context.mounted) context.pop();
            },
            child:
                const Text('Delete', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );
  }
}

class _ActionGrid extends StatelessWidget {
  final String teamId;
  final bool isOwner;
  final VoidCallback onInvite;
  final VoidCallback? onDelete;

  const _ActionGrid({
    required this.teamId,
    required this.isOwner,
    required this.onInvite,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            _ActionBtn(
                icon: LucideIcons.userPlus, label: 'Invite', onTap: onInvite),
            const SizedBox(width: 12),
            _ActionBtn(
              icon: Icons.card_membership_outlined,
              label: 'Team Pass',
              onTap: () => context.push('/my-teams/$teamId/pass'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            _ActionBtn(
              icon: Icons.sports_kabaddi_outlined,
              label: 'Challenge',
              onTap: () => context.push('/my-teams/$teamId/challenge'),
            ),
            const SizedBox(width: 12),
            if (isOwner && onDelete != null)
              _ActionBtn(
                icon: LucideIcons.trash2,
                label: 'Delete',
                onTap: onDelete!,
                danger: true,
              )
            else
              const Expanded(child: SizedBox()),
          ],
        ),
      ],
    );
  }
}

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool danger;

  const _ActionBtn({
    required this.icon,
    required this.label,
    required this.onTap,
    this.danger = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = danger ? Colors.redAccent : AppColors.primary;
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: color.withValues(alpha: 0.3)),
          ),
          child: Column(
            children: [
              Icon(icon, color: color, size: 26),
              const SizedBox(height: 6),
              Text(
                label,
                style: TextStyle(
                  color: color,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Poppins',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// â”€â”€ Member join requests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _MemberJoinRequestsSection extends StatefulWidget {
  final String teamId;
  final VoidCallback onHandled;
  const _MemberJoinRequestsSection(
      {required this.teamId, required this.onHandled});

  @override
  State<_MemberJoinRequestsSection> createState() =>
      _MemberJoinRequestsSectionState();
}

class _MemberJoinRequestsSectionState
    extends State<_MemberJoinRequestsSection> {
  late Future<List<Map<String, dynamic>>> _future;
  final Set<String> _acting = {};

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() =>
      _future = TeamService().getMemberJoinRequests(widget.teamId);

  Future<void> _handle(String userId, bool accept) async {
    setState(() => _acting.add(userId));
    final ok = accept
        ? await TeamService().acceptMember(widget.teamId, userId)
        : await TeamService().rejectMember(widget.teamId, userId);
    if (!mounted) return;
    setState(() {
      _acting.remove(userId);
      _reload();
    });
    if (ok) {
      widget.onHandled();
    } else {
      BmsToast.error(context, accept ? 'Could not accept' : 'Could not reject');
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _future,
      builder: (context, snap) {
        if (!snap.hasData || snap.data!.isEmpty) return const SizedBox();
        final requests = snap.data!;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.only(bottom: 12),
              child: Text(
                'Join Requests',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Poppins',
                ),
              ),
            ),
            ...requests.map((req) {
              final user = req['user'] as Map<String, dynamic>? ?? req;
              final userId = (req['userId'] ?? req['_id'] ?? '').toString();
              final name = user['firstName']?.toString() ??
                  user['name']?.toString() ??
                  'Unknown';
              final avatarUrl = safeAvatarUrl(
                  user['profilePhoto']?.toString() ??
                      user['profilePicture']?.toString());
              final isActing = _acting.contains(userId);
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surfaceL3,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.25)),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 22,
                      backgroundColor: Colors.white10,
                      backgroundImage:
                          avatarUrl != null ? NetworkImage(avatarUrl) : null,
                      child: avatarUrl == null
                          ? Text(name.isNotEmpty ? name[0].toUpperCase() : '?',
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700))
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        name,
                        style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontFamily: 'Poppins'),
                      ),
                    ),
                    if (isActing)
                      const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: AppColors.primary),
                      )
                    else ...[
                      GestureDetector(
                        onTap: () => _handle(userId, false),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.red.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                                color: Colors.red.withValues(alpha: 0.4)),
                          ),
                          child: const Text('Reject',
                              style: TextStyle(
                                  color: Colors.redAccent,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  fontFamily: 'Poppins')),
                        ),
                      ),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: () => _handle(userId, true),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                                color:
                                    AppColors.primary.withValues(alpha: 0.5)),
                          ),
                          child: const Text('Accept',
                              style: TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  fontFamily: 'Poppins')),
                        ),
                      ),
                    ],
                  ],
                ),
              );
            }),
            const SizedBox(height: 8),
          ],
        );
      },
    );
  }
}

// Holds the future for `getIncomingRequests` in state so it only fires once
// per screen mount. Previously this lived in the screen's build() as a
// FutureBuilder fed by `TeamService().getIncomingRequests(teamId)`, which
// created a new future every rebuild (IME show/hide, navigation pop,
// router rebuilds, etc.) — that hammered the endpoint dozens of times per
// session and spammed the log with bad-response errors when the route 4xx'd.
class _IncomingChallengesSection extends StatefulWidget {
  final String teamId;
  final VoidCallback onHandled;
  const _IncomingChallengesSection(
      {required this.teamId, required this.onHandled});

  @override
  State<_IncomingChallengesSection> createState() =>
      _IncomingChallengesSectionState();
}

class _IncomingChallengesSectionState
    extends State<_IncomingChallengesSection> {
  late Future<List<TeamOpponentRequestModel>> _future;

  @override
  void initState() {
    super.initState();
    _future = TeamService().getIncomingRequests(widget.teamId);
  }

  void _reload() {
    setState(() {
      _future = TeamService().getIncomingRequests(widget.teamId);
    });
    widget.onHandled();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<TeamOpponentRequestModel>>(
      future: _future,
      builder: (context, snap) {
        if (!snap.hasData || snap.data!.isEmpty) {
          return const SizedBox();
        }
        final pending = snap.data!.where((r) => r.status == 'PENDING').toList();
        if (pending.isEmpty) return const SizedBox();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Incoming Challenges',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w600,
                fontFamily: 'Poppins',
              ),
            ),
            const SizedBox(height: 12),
            ...pending.map(
              (req) => GestureDetector(
                onTap: () => showModalBottomSheet(
                  context: context,
                  backgroundColor: Colors.transparent,
                  builder: (_) => OpponentRequestModal(
                    request: req,
                    onHandled: _reload,
                  ),
                ),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceL3,
                    borderRadius: BorderRadius.circular(14),
                    border:
                        Border.all(color: Colors.orange.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.sports_kabaddi,
                          color: Colors.orange, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          req.teamA?.name ?? 'Unknown Team',
                          style: const TextStyle(
                              color: Colors.white, fontFamily: 'Poppins'),
                        ),
                      ),
                      const Text(
                        'Tap to respond',
                        style: TextStyle(
                            color: Colors.white38,
                            fontSize: 12,
                            fontFamily: 'Poppins'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _SportBadge extends StatelessWidget {
  final String sport;
  const _SportBadge({required this.sport});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
      ),
      child: Text(
        sport,
        style: const TextStyle(
          color: AppColors.primary,
          fontSize: 12,
          fontWeight: FontWeight.w600,
          fontFamily: 'Poppins',
        ),
      ),
    );
  }
}
