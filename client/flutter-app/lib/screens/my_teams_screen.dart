import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../widgets/common/bms_toast.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../models/team_model.dart';
import '../providers/team_provider.dart';
import '../services/team_service.dart';
import '../widgets/teams/team_card.dart';
import '../widgets/teams/create_team_modal.dart';

class MyTeamsScreen extends ConsumerWidget {
  const MyTeamsScreen({super.key});

  void _openCreate(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CreateTeamModal(
        onSuccess: () => ref.invalidate(myTeamsProvider),
      ),
    );
  }

  void _openJoinByCode(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surfaceL0,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _JoinByCodeSheet(
        onJoined: () => ref.invalidate(myTeamsProvider),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final teamsAsync = ref.watch(myTeamsProvider);

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
                    'My Teams',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Poppins',
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => _openJoinByCode(context, ref),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                            color: AppColors.primary.withValues(alpha: 0.4)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(LucideIcons.tag,
                              color: AppColors.primary, size: 15),
                          SizedBox(width: 4),
                          Text('Join by Code',
                              style: TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  fontFamily: 'Poppins')),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  teamsAsync.whenOrNull(
                        data: (teams) => Text(
                          '${teams.length} team${teams.length == 1 ? '' : 's'}',
                          style: const TextStyle(
                              color: Colors.white38, fontFamily: 'Poppins'),
                        ),
                      ) ??
                      const SizedBox(),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: teamsAsync.when(
                loading: () => const Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
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
                      const SizedBox(height: 12),
                      TextButton(
                        onPressed: () => ref.invalidate(myTeamsProvider),
                        child: const Text('Retry',
                            style: TextStyle(color: AppColors.primary)),
                      ),
                    ],
                  ),
                ),
                data: (teams) => teams.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(LucideIcons.users,
                                color: Colors.white24, size: 72),
                            const SizedBox(height: 16),
                            const Text(
                              'No teams yet',
                              style: TextStyle(
                                color: Colors.white54,
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                fontFamily: 'Poppins',
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Create your first team and start\nplaying with friends!',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                  color: Colors.white38, fontFamily: 'Poppins'),
                            ),
                            const SizedBox(height: 24),
                            ElevatedButton.icon(
                              onPressed: () => _openCreate(context, ref),
                              icon: const Icon(LucideIcons.plus,
                                  color: Colors.black),
                              label: const Text(
                                'Create Team',
                                style: TextStyle(
                                  color: Colors.black,
                                  fontWeight: FontWeight.w700,
                                  fontFamily: 'Poppins',
                                ),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 24, vertical: 12),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14)),
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        itemCount: teams.length,
                        itemBuilder: (_, i) => TeamCard(
                          team: teams[i],
                          onTap: () => context.push('/my-teams/${teams[i].id}'),
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: teamsAsync.whenOrNull(
        data: (teams) => teams.isEmpty
            ? null
            : FloatingActionButton(
                onPressed: () => _openCreate(context, ref),
                backgroundColor: AppColors.primary,
                child: const Icon(LucideIcons.plus, color: Colors.black),
              ),
      ),
    );
  }
}

// â”€â”€ Join by Code bottom sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _JoinByCodeSheet extends StatefulWidget {
  final VoidCallback onJoined;
  const _JoinByCodeSheet({required this.onJoined});

  @override
  State<_JoinByCodeSheet> createState() => _JoinByCodeSheetState();
}

class _JoinByCodeSheetState extends State<_JoinByCodeSheet> {
  final _codeCtrl = TextEditingController();
  bool _searching = false;
  bool _joining = false;
  TeamModel? _found;
  String? _error;

  @override
  void dispose() {
    _codeCtrl.dispose();
    super.dispose();
  }

  Future<void> _findTeam() async {
    final code = _codeCtrl.text.trim().toUpperCase();
    if (code.isEmpty) return;
    setState(() {
      _searching = true;
      _found = null;
      _error = null;
    });
    try {
      final team = await TeamService().findByCode(code);
      if (mounted)
        setState(() {
          _found = team;
          _searching = false;
        });
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = 'No team found for that code';
          _searching = false;
        });
      }
    }
  }

  Future<void> _joinTeam() async {
    if (_found == null) return;
    setState(() => _joining = true);
    try {
      await TeamService().joinByToken(_found!.teamCode);
      if (mounted) {
        widget.onJoined();
        context.pop();
        BmsToast.success(context, 'Joined ${_found!.name}!');
      }
    } catch (_) {
      if (mounted) {
        setState(() => _joining = false);
        BmsToast.error(context,
            'Could not join — you may already be a member or the code is invalid');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding:
          EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2)),
              ),
              const SizedBox(height: 16),
              const Text(
                'Join by Code',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Poppins'),
              ),
              const SizedBox(height: 4),
              const Text(
                'Enter the team code shared by the captain',
                style: TextStyle(
                    color: Colors.white38, fontSize: 13, fontFamily: 'Poppins'),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.surfaceL4,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color: Colors.white.withValues(alpha: 0.1)),
                      ),
                      child: TextField(
                        controller: _codeCtrl,
                        textCapitalization: TextCapitalization.characters,
                        style: const TextStyle(
                            color: Colors.white,
                            fontFamily: 'Poppins',
                            letterSpacing: 2,
                            fontWeight: FontWeight.w700),
                        decoration: const InputDecoration(
                          hintText: 'e.g. ABC123',
                          hintStyle: TextStyle(
                              color: Colors.white24, letterSpacing: 1),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(
                              horizontal: 16, vertical: 14),
                        ),
                        onSubmitted: (_) => _findTeam(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  GestureDetector(
                    onTap: _searching ? null : _findTeam,
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: _searching
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                  color: Colors.black, strokeWidth: 2))
                          : const Icon(LucideIcons.search,
                              color: Colors.black, size: 22),
                    ),
                  ),
                ],
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!,
                    style: const TextStyle(
                        color: Colors.redAccent,
                        fontFamily: 'Poppins',
                        fontSize: 13)),
              ],
              if (_found != null) ...[
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceL3,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                        color: AppColors.primary.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(LucideIcons.shield,
                            color: AppColors.primary, size: 26),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _found!.name,
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                  fontFamily: 'Poppins',
                                  fontSize: 15),
                            ),
                            Text(
                              [_found!.sportType, _found!.city]
                                  .where((s) => s != null && s.isNotEmpty)
                                  .join(' · '),
                              style: const TextStyle(
                                  color: Colors.white54,
                                  fontSize: 12,
                                  fontFamily: 'Poppins'),
                            ),
                            Text(
                              '${_found!.members.length} member${_found!.members.length == 1 ? '' : 's'}',
                              style: const TextStyle(
                                  color: Colors.white38,
                                  fontSize: 12,
                                  fontFamily: 'Poppins'),
                            ),
                          ],
                        ),
                      ),
                      const Icon(LucideIcons.checkCircle,
                          color: AppColors.primary, size: 22),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _joining ? null : _joinTeam,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      disabledBackgroundColor:
                          AppColors.primary.withValues(alpha: 0.5),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _joining
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                color: Colors.black, strokeWidth: 2))
                        : Text(
                            'Join ${_found!.name}',
                            style: const TextStyle(
                                color: Colors.black,
                                fontWeight: FontWeight.w800,
                                fontFamily: 'Poppins'),
                          ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
