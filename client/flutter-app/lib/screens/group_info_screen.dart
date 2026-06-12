import 'dart:async';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../widgets/common/bms_toast.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../models/chat_model.dart';
import '../services/auth_manager.dart';
import '../services/chat_service.dart';
import '../services/chat_socket_service.dart';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GroupInfoScreen
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class GroupInfoScreen extends StatefulWidget {
  final String groupId;
  final String groupName;
  final String? groupPhoto;
  final String? description;
  final List<Map<String, dynamic>> members;
  final String currentUserId;

  const GroupInfoScreen({
    Key? key,
    required this.groupId,
    required this.groupName,
    required this.members,
    this.groupPhoto,
    this.description,
    this.currentUserId = '',
  }) : super(key: key);

  @override
  State<GroupInfoScreen> createState() => _GroupInfoScreenState();
}

class _GroupInfoScreenState extends State<GroupInfoScreen> {
  bool _notificationsOn = true;
  bool _isLeaving = false;
  late String _groupName;
  late String? _groupPhoto;
  late String? _description;
  late List<Map<String, dynamic>> _members;
  late String _currentUserId;
  bool _isCurrentUserAdmin = false;

  StreamSubscription<Map<String, dynamic>>? _chatUpdatedSub;

  @override
  void initState() {
    super.initState();
    _groupName = widget.groupName;
    _groupPhoto = widget.groupPhoto;
    _description = widget.description;
    _members = List<Map<String, dynamic>>.from(widget.members);
    final me = AuthManager().currentUser;
    _currentUserId = widget.currentUserId.isNotEmpty
        ? widget.currentUserId
        : ((me?['id'] ?? me?['_id'])?.toString() ?? '');
    _updateAdminStatus();

    _chatUpdatedSub = ChatSocketService().chatUpdatedStream.listen((data) {
      if (data['id'] == widget.groupId || data['_id'] == widget.groupId) {
        _applyUpdate(data);
      }
    });
  }

  void _updateAdminStatus() {
    _isCurrentUserAdmin = _members.any((m) {
      final id = (m['_id'] ?? m['id'] ?? '').toString();
      return id == _currentUserId && m['isAdmin'] == true;
    });
  }

  void _applyUpdate(Map<String, dynamic> data) {
    if (!mounted) return;
    final updated = ChatModel.fromJson(data);
    setState(() {
      _groupName = updated.chatName;
      _groupPhoto = updated.groupImage;
      _description = updated.description;
      _members = updated.users
          .map((u) => {
                '_id': u.id,
                'name': u.name,
                'photo': u.profilePicture,
                'isAdmin': u.isAdmin,
                'isPending': u.isPending,
              })
          .toList();
      _updateAdminStatus();
    });
  }

  @override
  void dispose() {
    _chatUpdatedSub?.cancel();
    super.dispose();
  }

  // â”€â”€ Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  void _showLeaveSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _LeaveGroupSheet(
        groupName: _groupName,
        onConfirm: () async {
          context.pop();
          setState(() => _isLeaving = true);
          try {
            final ok = await ChatService().leaveGroup(widget.groupId);
            if (!mounted) return;
            setState(() => _isLeaving = false);
            if (ok) {
              Navigator.of(context).popUntil((r) => r.isFirst);
            } else {
              _showError('Failed to leave group. Please try again.');
            }
          } catch (e) {
            if (!mounted) return;
            setState(() => _isLeaving = false);
            _showError('Error leaving group: $e');
          }
        },
      ),
    );
  }

  void _showReportSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _ReportGroupSheet(
        groupName: _groupName,
        memberCount: _members.length,
        onReported: () {
          context.pop();
          _showReportSubmittedSheet();
        },
      ),
    );
  }

  void _showReportSubmittedSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => const _ReportSubmittedSheet(),
    );
  }

  void _openEditGroup() async {
    final result = await context.push('/edit-group', extra: {
      'groupId': widget.groupId,
      'initialName': _groupName,
      'initialDescription': _description,
      'initialPhoto': _groupPhoto,
    });
    if (result is ChatModel) {
      setState(() {
        _groupName = result.chatName;
        _groupPhoto = result.groupImage;
        _description = result.description;
      });
    }
  }

  void _showAddMemberSheet() {
    final TextEditingController ctrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: Container(
          decoration: const BoxDecoration(
            color: AppColors.surfaceL2,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.borderGray,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const Text('Add Member',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w700)),
              const SizedBox(height: 16),
              Container(
                decoration: BoxDecoration(
                  color: AppColors.surfaceL4,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.backgroundCard),
                ),
                child: TextField(
                  controller: ctrl,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    hintText: 'Paste user ID',
                    hintStyle: TextStyle(color: AppColors.textGray),
                    border: InputBorder.none,
                    contentPadding:
                        EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              GestureDetector(
                onTap: () async {
                  final userId = ctrl.text.trim();
                  if (userId.isEmpty) return;
                  Navigator.pop(ctx);
                  final result =
                      await ChatService().addToGroup(widget.groupId, userId);
                  if (!mounted) return;
                  if (result != null) {
                    BmsToast.success(context, 'Invite sent');
                  } else {
                    _showError(
                        'Failed to add member. Check the user ID and try again.');
                  }
                },
                child: Container(
                  width: double.infinity,
                  height: 52,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Center(
                    child: Text('Send Invite',
                        style: TextStyle(
                            color: Colors.black,
                            fontSize: 15,
                            fontWeight: FontWeight.w700)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showMemberOptions(Map<String, dynamic> member) {
    final memberId = (member['_id'] ?? member['id'] ?? '').toString();
    final memberName = (member['name'] ?? 'Unknown').toString();
    final isMemberAdmin = member['isAdmin'] == true;
    final isYou = memberId == _currentUserId;

    if (isYou) return; // no actions on yourself

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        decoration: const BoxDecoration(
          color: AppColors.surfaceL2,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.borderGray,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(memberName,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            if (!isMemberAdmin)
              _AdminOptionTile(
                icon: Icons.admin_panel_settings_outlined,
                label: 'Make Admin',
                onTap: () async {
                  context.pop();
                  final result =
                      await ChatService().makeAdmin(widget.groupId, memberId);
                  if (!mounted) return;
                  if (result != null) {
                    setState(() {
                      final idx = _members.indexWhere((m) =>
                          (m['_id'] ?? m['id'] ?? '').toString() == memberId);
                      if (idx >= 0)
                        _members[idx] = {..._members[idx], 'isAdmin': true};
                      _updateAdminStatus();
                    });
                  }
                },
              ),
            if (isMemberAdmin)
              _AdminOptionTile(
                icon: LucideIcons.shieldOff,
                label: 'Dismiss Admin',
                onTap: () async {
                  context.pop();
                  final result = await ChatService()
                      .dismissAdmin(widget.groupId, memberId);
                  if (!mounted) return;
                  if (result != null) {
                    setState(() {
                      final idx = _members.indexWhere((m) =>
                          (m['_id'] ?? m['id'] ?? '').toString() == memberId);
                      if (idx >= 0)
                        _members[idx] = {..._members[idx], 'isAdmin': false};
                      _updateAdminStatus();
                    });
                  }
                },
              ),
            _AdminOptionTile(
              icon: Icons.person_remove_outlined,
              label: 'Remove from Group',
              color: AppColors.errorRed,
              onTap: () async {
                context.pop();
                final ok = await ChatService()
                    .removeFromGroup(widget.groupId, memberId);
                if (!mounted) return;
                if (ok) {
                  setState(() => _members.removeWhere((m) =>
                      (m['_id'] ?? m['id'] ?? '').toString() == memberId));
                } else {
                  _showError('Failed to remove member.');
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showError(String msg) => BmsToast.error(context, msg);

  // â”€â”€ Build â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @override
  Widget build(BuildContext context) {
    final activeMembers =
        _members.where((m) => m['isPending'] != true).toList();

    return Scaffold(
      backgroundColor: AppColors.surfaceL0,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            backgroundColor: AppColors.surfaceL0,
            leading: GestureDetector(
              onTap: () {
                HapticFeedback.lightImpact();
                context.pop();
              },
              child: const Padding(
                padding: EdgeInsets.all(10),
                child: Icon(LucideIcons.chevronLeft,
                    color: Colors.white, size: 20),
              ),
            ),
            title: Text(_groupName,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w700)),
            centerTitle: true,
            actions: [
              if (_isCurrentUserAdmin)
                GestureDetector(
                  onTap: _openEditGroup,
                  child: const Padding(
                    padding: EdgeInsets.all(12),
                    child:
                        Icon(LucideIcons.pencil, color: Colors.white, size: 22),
                  ),
                ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  _groupPhoto != null && _groupPhoto!.isNotEmpty
                      ? Image.network(_groupPhoto!,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _defaultGroupBanner())
                      : _defaultGroupBanner(),
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, AppColors.surfaceL0],
                        stops: [0.5, 1.0],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            elevation: 0,
          ),
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),

                // Description (if any)
                if (_description != null && _description!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                    child: Text(
                      _description!,
                      style: const TextStyle(
                          color: AppColors.textDarkGray,
                          fontSize: 14,
                          height: 1.5),
                    ),
                  ),

                // Notifications row
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceL2,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.surfaceL4, width: 1),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.notifications_none_rounded,
                            color: Colors.white, size: 22),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Text('Notifications',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w500)),
                        ),
                        GestureDetector(
                          onTap: () => setState(
                              () => _notificationsOn = !_notificationsOn),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            width: 46,
                            height: 26,
                            decoration: BoxDecoration(
                              color: _notificationsOn
                                  ? AppColors.primary
                                  : AppColors.borderGray,
                              borderRadius: BorderRadius.circular(13),
                            ),
                            child: AnimatedAlign(
                              duration: const Duration(milliseconds: 200),
                              alignment: _notificationsOn
                                  ? Alignment.centerRight
                                  : Alignment.centerLeft,
                              child: Container(
                                margin: const EdgeInsets.all(3),
                                width: 20,
                                height: 20,
                                decoration: const BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Members card
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppColors.surfaceL2,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.surfaceL4, width: 1),
                    ),
                    child: Column(
                      children: [
                        // Members header
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 14, 12, 14),
                          child: Row(
                            children: [
                              const Icon(LucideIcons.users,
                                  color: AppColors.primary, size: 20),
                              const SizedBox(width: 10),
                              Text(
                                '${activeMembers.length} Members',
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600),
                              ),
                              const Spacer(),
                              if (_isCurrentUserAdmin)
                                GestureDetector(
                                  onTap: _showAddMemberSheet,
                                  child: const Padding(
                                    padding: EdgeInsets.all(6),
                                    child: Icon(LucideIcons.userPlus,
                                        color: AppColors.primary, size: 20),
                                  ),
                                ),
                              GestureDetector(
                                onTap: () {},
                                child: const Padding(
                                  padding: EdgeInsets.all(6),
                                  child: Icon(LucideIcons.search,
                                      color: AppColors.textDarkGray, size: 20),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const Divider(color: AppColors.surfaceL4, height: 1),

                        // Member list
                        ...List.generate(activeMembers.length, (i) {
                          final m = activeMembers[i];
                          final id = (m['_id'] ?? m['id'] ?? '').toString();
                          final name =
                              (m['name'] ?? m['friend_name'] ?? 'Unknown')
                                  .toString();
                          final photo = m['photo'] ??
                              m['friend_photo'] ??
                              m['profile_photo_url'];
                          final isAdmin =
                              m['isAdmin'] == true || m['is_admin'] == true;
                          final isYou = id == _currentUserId;

                          return GestureDetector(
                            onLongPress: _isCurrentUserAdmin && !isYou
                                ? () {
                                    HapticFeedback.mediumImpact();
                                    _showMemberOptions(m);
                                  }
                                : null,
                            child: _MemberTile(
                              name: name,
                              photoUrl: photo?.toString(),
                              isAdmin: isAdmin,
                              isYou: isYou,
                              showDivider: i < activeMembers.length - 1,
                            ),
                          );
                        }),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 28),

                // Leave Group
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: GestureDetector(
                    onTap: _isLeaving ? null : _showLeaveSheet,
                    child: Container(
                      width: double.infinity,
                      height: 52,
                      decoration: BoxDecoration(
                        color: AppColors.surfaceL3,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                            color: AppColors.backgroundCard, width: 1),
                      ),
                      child: Center(
                        child: _isLeaving
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2.5, color: AppColors.primary),
                              )
                            : const Text('Leave Group',
                                style: TextStyle(
                                    color: AppColors.primary,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 10),

                // Report Group
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: GestureDetector(
                    onTap: _showReportSheet,
                    child: Container(
                      width: double.infinity,
                      height: 52,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Center(
                        child: Text('Report Group',
                            style: TextStyle(
                                color: Colors.black,
                                fontSize: 15,
                                fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 36),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _defaultGroupBanner() => Container(
        color: AppColors.surfaceL3,
        child: const Center(
            child:
                Icon(LucideIcons.users, color: AppColors.borderGray, size: 80)),
      );
}

// â”€â”€ Admin Option Tile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _AdminOptionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color color;

  const _AdminOptionTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color = Colors.white,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(width: 16),
            Text(label,
                style: TextStyle(
                    color: color, fontSize: 15, fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }
}

// â”€â”€ Member Tile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _MemberTile extends StatelessWidget {
  final String name;
  final String? photoUrl;
  final bool isAdmin;
  final bool isYou;
  final bool showDivider;

  const _MemberTile({
    required this.name,
    required this.photoUrl,
    required this.isAdmin,
    required this.isYou,
    required this.showDivider,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              Stack(
                children: [
                  Container(
                    width: 46,
                    height: 46,
                    decoration: const BoxDecoration(shape: BoxShape.circle),
                    child: ClipOval(
                      child: photoUrl != null && photoUrl!.isNotEmpty
                          ? Image.network(photoUrl!,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => _defaultAvatar())
                          : _defaultAvatar(),
                    ),
                  ),
                  Positioned(
                    bottom: 1,
                    right: 1,
                    child: Container(
                      width: 11,
                      height: 11,
                      decoration: BoxDecoration(
                        color: AppColors.accentGreen,
                        shape: BoxShape.circle,
                        border:
                            Border.all(color: AppColors.surfaceL2, width: 1.5),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(name,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w500)),
              ),
              if (isYou)
                const Text('You',
                    style: TextStyle(
                        color: AppColors.textDarkGray,
                        fontSize: 13,
                        fontWeight: FontWeight.w500))
              else if (isAdmin)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text('Admin',
                      style: TextStyle(
                          color: Colors.black,
                          fontSize: 11,
                          fontWeight: FontWeight.w700)),
                ),
            ],
          ),
        ),
        if (showDivider)
          const Divider(color: AppColors.surfaceL4, height: 1, indent: 74),
      ],
    );
  }

  Widget _defaultAvatar() => Container(
        color: AppColors.backgroundCard,
        child:
            const Icon(LucideIcons.user, color: AppColors.textGray, size: 24),
      );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Leave Group Sheet
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _LeaveGroupSheet extends StatelessWidget {
  final String groupName;
  final VoidCallback onConfirm;

  const _LeaveGroupSheet({required this.groupName, required this.onConfirm});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surfaceL2,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 36),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.borderGray,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 36),
          const Text(
            'Are you sure you want to leave?\nYou will be removed from all\nconversations.',
            textAlign: TextAlign.center,
            style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w500,
                height: 1.6),
          ),
          const SizedBox(height: 36),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: onConfirm,
                  child: Container(
                    height: 52,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Center(
                      child: Text('Leave',
                          style: TextStyle(
                              color: Colors.black,
                              fontSize: 15,
                              fontWeight: FontWeight.w700)),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GestureDetector(
                  onTap: () => context.pop(),
                  child: Container(
                    height: 52,
                    decoration: BoxDecoration(
                      color: AppColors.backgroundCard,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Center(
                      child: Text('Cancel',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.w600)),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Report Group Sheet
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _ReportGroupSheet extends StatefulWidget {
  final String groupName;
  final int memberCount;
  final VoidCallback onReported;

  const _ReportGroupSheet({
    required this.groupName,
    required this.memberCount,
    required this.onReported,
  });

  @override
  State<_ReportGroupSheet> createState() => _ReportGroupSheetState();
}

class _ReportGroupSheetState extends State<_ReportGroupSheet> {
  String? _selected;

  static const _reasons = [
    _GroupReportReason(
        label: 'Spam', assetPath: 'assets/icons/icon_profile_spam.png'),
    _GroupReportReason(
        label: 'Hate', assetPath: 'assets/icons/icon_profile_hate.png'),
    _GroupReportReason(
        label: 'Inappropriate',
        assetPath: 'assets/icons/icon_profile_inappropriate.png'),
    _GroupReportReason(
        label: 'Privacy', assetPath: 'assets/icons/icon_profile_hide.png'),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surfaceL2,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.fromLTRB(
          24, 12, 24, MediaQuery.of(context).viewInsets.bottom + 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.borderGray,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 24),
          const Text('Report Group',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.surfaceL4,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    color: AppColors.surfaceForest,
                  ),
                  child: const Icon(LucideIcons.users,
                      color: AppColors.primary, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(widget.groupName,
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w600)),
                      const SizedBox(height: 2),
                      Text('${widget.memberCount} members',
                          style: const TextStyle(
                              color: AppColors.textDarkGray, fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Text('Why are you reporting this group?',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 14),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 2.4,
            children: _reasons.map((r) {
              final isSelected = _selected == r.label;
              return GestureDetector(
                onTap: () => setState(() => _selected = r.label),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppColors.primary.withValues(alpha: 0.15)
                        : AppColors.surfaceL4,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected
                          ? AppColors.primary
                          : AppColors.backgroundCard,
                      width: 1.5,
                    ),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  child: Row(
                    children: [
                      Image.asset(r.assetPath,
                          width: 20,
                          height: 20,
                          color: isSelected
                              ? AppColors.primary
                              : AppColors.textDarkGray),
                      const SizedBox(width: 8),
                      Text(r.label,
                          style: TextStyle(
                              color: isSelected
                                  ? AppColors.primary
                                  : AppColors.textLightGray,
                              fontSize: 13,
                              fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
          GestureDetector(
            onTap: _selected != null ? widget.onReported : null,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: double.infinity,
              height: 52,
              decoration: BoxDecoration(
                color: _selected != null
                    ? AppColors.primary
                    : AppColors.primary.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Center(
                child: Text('Report',
                    style: TextStyle(
                        color: Colors.black,
                        fontSize: 15,
                        fontWeight: FontWeight.w700)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _GroupReportReason {
  final String label;
  final String assetPath;
  const _GroupReportReason({required this.label, required this.assetPath});
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Report Submitted Sheet
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _ReportSubmittedSheet extends StatelessWidget {
  const _ReportSubmittedSheet();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surfaceL2,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 48),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.borderGray,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 48),
          const Text('Report Submitted',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 14),
          const Text('Thank you for helping us keep the\ncommunity safe.',
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: AppColors.textDarkGray, fontSize: 14, height: 1.6)),
          const SizedBox(height: 40),
          GestureDetector(
            onTap: () => context.pop(),
            child: Container(
              width: double.infinity,
              height: 52,
              decoration: BoxDecoration(
                color: AppColors.backgroundCard,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Center(
                child: Text('Done',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w600)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
