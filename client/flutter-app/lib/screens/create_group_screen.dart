import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../services/chat_service.dart';
import '../widgets/common/bms_toast.dart';

class CreateGroupScreen extends StatefulWidget {
  final List<Map<String, dynamic>> selectedContacts;

  const CreateGroupScreen({Key? key, required this.selectedContacts})
      : super(key: key);

  @override
  State<CreateGroupScreen> createState() => _CreateGroupScreenState();
}

class _CreateGroupScreenState extends State<CreateGroupScreen> {
  final TextEditingController _nameCtrl = TextEditingController();
  final FocusNode _nameFocus = FocusNode();
  bool _isCreating = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _nameFocus.dispose();
    super.dispose();
  }

  void _onCreate() async {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) {
      _nameFocus.requestFocus();
      return;
    }
    HapticFeedback.lightImpact();
    setState(() => _isCreating = true);

    try {
      final chat = await ChatService().createGroupChat(
        name: name,
        userIds: widget.selectedContacts
            .map((c) => c['_id']?.toString() ?? c['id']?.toString() ?? '')
            .toList(),
      );

      if (!mounted) return;

      if (chat != null) {
        context.push('/chat', extra: {
          'chatId': chat.id,
          'friendId': chat.id,
          'friendName': chat.chatName,
          'friendPhoto': null,
          'isGroup': true,
          'members':
              chat.users.map((u) => {'_id': u.id, 'name': u.name}).toList(),
        });
      } else {
        setState(() => _isCreating = false);
        BmsToast.error(context, 'Failed to create group. Please try again.');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isCreating = false);
      BmsToast.error(context, 'Error creating group: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceL0,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  const Text(
                    'New Group',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: GestureDetector(
                      onTap: () => context.pop(),
                      child: const Icon(LucideIcons.chevronLeft,
                          color: Colors.white, size: 20),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // â”€â”€ Group photo picker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            Center(
              child: Stack(
                children: [
                  Container(
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.surfaceL4,
                      border: Border.all(
                          color: AppColors.backgroundCard, width: 1.5),
                    ),
                    child: const Icon(LucideIcons.users,
                        color: AppColors.textGray, size: 40),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: const BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(LucideIcons.camera,
                          color: Colors.black, size: 15),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            // â”€â”€ Group name â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: const Text(
                'Group Name',
                style: TextStyle(
                  color: AppColors.textDarkGray,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.8,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.surfaceL3,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.backgroundCard, width: 1),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: TextField(
                  controller: _nameCtrl,
                  focusNode: _nameFocus,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w500),
                  decoration: const InputDecoration(
                    hintText: 'Enter group name...',
                    hintStyle:
                        TextStyle(color: AppColors.borderGray, fontSize: 15),
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: EdgeInsets.symmetric(vertical: 14),
                  ),
                  textCapitalization: TextCapitalization.words,
                  onSubmitted: (_) => _onCreate(),
                ),
              ),
            ),

            const SizedBox(height: 28),

            // â”€â”€ Selected members â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                'Members (${widget.selectedContacts.length})',
                style: const TextStyle(
                  color: AppColors.textDarkGray,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.8,
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 72,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: widget.selectedContacts.length,
                separatorBuilder: (_, __) => const SizedBox(width: 14),
                itemBuilder: (ctx, i) {
                  final c = widget.selectedContacts[i];
                  final name = c['friend_name'] ?? c['name'] ?? 'Unknown';
                  final photo = c['friend_photo'] ?? c['profile_photo_url'];
                  return Column(
                    children: [
                      Container(
                        width: 46,
                        height: 46,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0xFFF5EDD8),
                        ),
                        child: ClipOval(
                          child: photo != null && photo.isNotEmpty
                              ? Image.network(photo,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => _memberAvatar())
                              : _memberAvatar(),
                        ),
                      ),
                      const SizedBox(height: 4),
                      SizedBox(
                        width: 46,
                        child: Text(
                          name.split(' ').first,
                          style: const TextStyle(
                            color: AppColors.textDarkGray,
                            fontSize: 10,
                            fontWeight: FontWeight.w500,
                          ),
                          textAlign: TextAlign.center,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),

            const Spacer(),

            // â”€â”€ Create button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: GestureDetector(
                onTap: _isCreating ? null : _onCreate,
                child: Container(
                  width: double.infinity,
                  height: 52,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Center(
                    child: _isCreating
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                                strokeWidth: 2.5, color: Colors.black),
                          )
                        : const Text(
                            'Create Group',
                            style: TextStyle(
                              color: Colors.black,
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _memberAvatar() => Container(
        color: AppColors.backgroundCard,
        child:
            const Icon(LucideIcons.user, color: AppColors.textGray, size: 24),
      );
}
