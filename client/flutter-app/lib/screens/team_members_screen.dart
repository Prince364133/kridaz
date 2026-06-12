import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../models/team_model.dart';
import '../providers/team_provider.dart';
import '../services/auth_manager.dart';
import '../services/team_service.dart';
import '../widgets/common/bms_toast.dart';
import '../widgets/teams/member_card.dart';
import '../widgets/teams/invite_member_modal.dart';

class TeamMembersScreen extends ConsumerStatefulWidget {
  final String teamId;

  const TeamMembersScreen({super.key, required this.teamId});

  @override
  ConsumerState<TeamMembersScreen> createState() => _TeamMembersScreenState();
}

class _TeamMembersScreenState extends ConsumerState<TeamMembersScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  void _openInvite(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => InviteMemberModal(
        teamId: widget.teamId,
        onSuccess: () => ref.invalidate(teamDetailProvider(widget.teamId)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final teamAsync = ref.watch(teamDetailProvider(widget.teamId));
    final currentUserId =
        (AuthManager().currentUser?['id'] ?? AuthManager().currentUser?['_id'])
            ?.toString();

    return Scaffold(
      backgroundColor: Colors.black,
      floatingActionButton: FloatingActionButton(
        onPressed: () => _openInvite(context),
        backgroundColor: AppColors.primary,
        child: const Icon(LucideIcons.userPlus, color: Colors.black),
      ),
      body: SafeArea(
        child: Column(
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
                    'Members',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Poppins',
                    ),
                  ),
                  const Spacer(),
                  teamAsync.whenOrNull(
                        data: (t) => Text(
                          '${t.members.length + t.customMembers.length}',
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Poppins',
                          ),
                        ),
                      ) ??
                      const SizedBox(),
                ],
              ),
            ),
            const SizedBox(height: 12),
            TabBar(
              controller: _tabs,
              indicatorColor: AppColors.primary,
              labelColor: AppColors.primary,
              unselectedLabelColor: Colors.white38,
              labelStyle: const TextStyle(
                  fontFamily: 'Poppins', fontWeight: FontWeight.w600),
              tabs: const [
                Tab(text: 'Registered'),
                Tab(text: 'Custom'),
              ],
            ),
            Expanded(
              child: teamAsync.when(
                loading: () => const Center(
                    child: CircularProgressIndicator(color: AppColors.primary)),
                error: (e, _) => Center(
                  child: Text('$e',
                      style: const TextStyle(
                          color: Colors.white54, fontFamily: 'Poppins')),
                ),
                data: (team) {
                  final isOwner = team.ownerId == currentUserId;
                  return TabBarView(
                    controller: _tabs,
                    children: [
                      _memberList(team.members, isOwner),
                      _customList(team.customMembers),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _memberList(List<TeamMemberModel> members, bool isOwner) {
    if (members.isEmpty) {
      return const Center(
        child: Text('No registered members yet.',
            style: TextStyle(color: Colors.white38, fontFamily: 'Poppins')),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: members.length,
      itemBuilder: (_, i) {
        final m = members[i];
        return MemberCard(
          member: m,
          isOwner: isOwner,
          onSetTeamRole: isOwner ? (role) => _setTeamRole(m, role) : null,
          onSetPlayingRole: isOwner ? (role) => _setPlayingRole(m, role) : null,
          onRemove:
              isOwner && m.role != TeamRole.captain ? () => _remove(m) : null,
        );
      },
    );
  }

  Future<void> _setTeamRole(TeamMemberModel m, TeamRole role) async {
    final ok = await TeamService().updateMemberRole(
      widget.teamId,
      m.userId,
      role: role.apiValue,
    );
    if (!mounted) return;
    if (ok) {
      ref.invalidate(teamDetailProvider(widget.teamId));
    } else {
      BmsToast.error(context, 'Could not update team role');
    }
  }

  Future<void> _setPlayingRole(TeamMemberModel m, PlayingRole role) async {
    final ok = await TeamService().updateMemberRole(
      widget.teamId,
      m.userId,
      playingRole: role.apiValue,
    );
    if (!mounted) return;
    if (ok) {
      ref.invalidate(teamDetailProvider(widget.teamId));
    } else {
      BmsToast.error(context, 'Could not update playing role');
    }
  }

  Future<void> _remove(TeamMemberModel m) async {
    final ok = await TeamService().removeMember(widget.teamId, m.userId);
    if (!mounted) return;
    if (ok) {
      ref.invalidate(teamDetailProvider(widget.teamId));
    } else {
      BmsToast.error(context, 'Could not remove member');
    }
  }

  Widget _customList(List<TeamCustomMemberModel> members) {
    if (members.isEmpty) {
      return const Center(
        child: Text('No custom players added yet.',
            style: TextStyle(color: Colors.white38, fontFamily: 'Poppins')),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: members.length,
      itemBuilder: (_, i) {
        final m = members[i];
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.surfaceL3,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white12),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                child: Text(
                  m.name.isNotEmpty ? m.name[0].toUpperCase() : '?',
                  style: const TextStyle(
                      color: AppColors.primary, fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(m.name,
                        style: const TextStyle(
                            color: Colors.white, fontFamily: 'Poppins')),
                    if (m.phone != null)
                      Text(m.phone!,
                          style: const TextStyle(
                              color: Colors.white38,
                              fontSize: 12,
                              fontFamily: 'Poppins')),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  m.status,
                  style: const TextStyle(
                      color: Colors.orange,
                      fontSize: 11,
                      fontFamily: 'Poppins'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
