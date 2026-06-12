import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/services.dart';
import '../core/constants/app_colors.dart';
import '../models/chat_model.dart';
import '../services/chat_service.dart';

class EditGroupScreen extends StatefulWidget {
  final String groupId;
  final String initialName;
  final String? initialDescription;
  final String? initialPhoto;

  const EditGroupScreen({
    Key? key,
    required this.groupId,
    required this.initialName,
    this.initialDescription,
    this.initialPhoto,
  }) : super(key: key);

  @override
  State<EditGroupScreen> createState() => _EditGroupScreenState();
}

class _EditGroupScreenState extends State<EditGroupScreen> {
  late final TextEditingController _nameController;
  late final TextEditingController _descController;
  bool _isSaving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.initialName);
    _descController =
        TextEditingController(text: widget.initialDescription ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      setState(() => _error = 'Group name cannot be empty');
      return;
    }

    setState(() {
      _isSaving = true;
      _error = null;
    });

    final updated = await ChatService().updateGroup(
      chatId: widget.groupId,
      chatName: name,
      description: _descController.text.trim().isNotEmpty
          ? _descController.text.trim()
          : null,
    );

    if (!mounted) return;
    setState(() => _isSaving = false);

    if (updated != null) {
      context.pop(updated);
    } else {
      setState(() => _error = 'Failed to update group. Please try again.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceL0,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      context.pop();
                    },
                    child: const Icon(LucideIcons.chevronLeft,
                        color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 16),
                  const Text(
                    'Edit Group',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Group avatar
                    Center(
                      child: Stack(
                        children: [
                          Container(
                            width: 100,
                            height: 100,
                            decoration:
                                const BoxDecoration(shape: BoxShape.circle),
                            child: ClipOval(
                              child: widget.initialPhoto != null &&
                                      widget.initialPhoto!.isNotEmpty
                                  ? Image.network(widget.initialPhoto!,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) =>
                                          _defaultGroupAvatar())
                                  : _defaultGroupAvatar(),
                            ),
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                                border: Border.all(
                                    color: AppColors.surfaceL0, width: 2),
                              ),
                              child: const Icon(LucideIcons.camera,
                                  color: Colors.black, size: 16),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 8),

                    const Center(
                      child: Text(
                        'Tap to change photo',
                        style: TextStyle(
                            color: AppColors.textDarkGray, fontSize: 12),
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Name field
                    const Text(
                      'Group Name',
                      style: TextStyle(
                        color: AppColors.textDarkGray,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.surfaceL2,
                        borderRadius: BorderRadius.circular(12),
                        border:
                            Border.all(color: AppColors.surfaceL4, width: 1),
                      ),
                      child: TextField(
                        controller: _nameController,
                        style:
                            const TextStyle(color: Colors.white, fontSize: 15),
                        decoration: const InputDecoration(
                          hintText: 'Enter group name',
                          hintStyle: TextStyle(color: AppColors.textGray),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(
                              horizontal: 16, vertical: 14),
                        ),
                        textCapitalization: TextCapitalization.words,
                        maxLength: 60,
                        buildCounter: (_,
                                {required currentLength,
                                required isFocused,
                                maxLength}) =>
                            Text(
                          '$currentLength / $maxLength',
                          style: const TextStyle(
                              color: AppColors.textGray, fontSize: 11),
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Description field
                    const Text(
                      'Description (optional)',
                      style: TextStyle(
                        color: AppColors.textDarkGray,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.surfaceL2,
                        borderRadius: BorderRadius.circular(12),
                        border:
                            Border.all(color: AppColors.surfaceL4, width: 1),
                      ),
                      child: TextField(
                        controller: _descController,
                        style:
                            const TextStyle(color: Colors.white, fontSize: 15),
                        decoration: const InputDecoration(
                          hintText: 'What is this group about?',
                          hintStyle: TextStyle(color: AppColors.textGray),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(
                              horizontal: 16, vertical: 14),
                        ),
                        maxLines: 3,
                        maxLength: 200,
                        textCapitalization: TextCapitalization.sentences,
                        buildCounter: (_,
                                {required currentLength,
                                required isFocused,
                                maxLength}) =>
                            Text(
                          '$currentLength / $maxLength',
                          style: const TextStyle(
                              color: AppColors.textGray, fontSize: 11),
                        ),
                      ),
                    ),

                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        _error!,
                        style: const TextStyle(
                            color: AppColors.errorRed, fontSize: 13),
                      ),
                    ],

                    const SizedBox(height: 32),

                    // Save button
                    GestureDetector(
                      onTap: _isSaving ? null : _save,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: double.infinity,
                        height: 52,
                        decoration: BoxDecoration(
                          color: _isSaving
                              ? AppColors.primary.withValues(alpha: 0.6)
                              : AppColors.primary,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Center(
                          child: _isSaving
                              ? const SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2.5, color: Colors.black),
                                )
                              : const Text(
                                  'Save Changes',
                                  style: TextStyle(
                                    color: Colors.black,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _defaultGroupAvatar() => Container(
        color: AppColors.surfaceL4,
        child: const Icon(LucideIcons.users,
            color: AppColors.borderGray, size: 48),
      );
}
