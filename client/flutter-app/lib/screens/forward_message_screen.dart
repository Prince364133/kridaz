import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/services.dart';
import '../core/constants/app_colors.dart';
import '../models/chat_model.dart';
import '../services/auth_manager.dart';
import '../services/chat_service.dart';
import '../widgets/common/bms_toast.dart';

class ForwardMessageScreen extends StatefulWidget {
  final String messageId;

  const ForwardMessageScreen({Key? key, required this.messageId})
      : super(key: key);

  @override
  State<ForwardMessageScreen> createState() => _ForwardMessageScreenState();
}

class _ForwardMessageScreenState extends State<ForwardMessageScreen> {
  final ChatService _chatService = ChatService();
  final TextEditingController _searchController = TextEditingController();

  List<ChatModel> _allChats = [];
  List<ChatModel> _filtered = [];
  final Set<String> _selectedIds = {};
  bool _isLoading = true;
  bool _isSending = false;
  String _currentUserId = '';

  @override
  void initState() {
    super.initState();
    final me = AuthManager().currentUser;
    _currentUserId = (me?['id'] ?? me?['_id'])?.toString() ?? '';
    _loadChats();
    _searchController.addListener(_onSearch);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadChats() async {
    final chats = await _chatService.fetchChats();
    if (!mounted) return;
    setState(() {
      _allChats = chats;
      _filtered = chats;
      _isLoading = false;
    });
  }

  void _onSearch() {
    final q = _searchController.text.toLowerCase();
    setState(() {
      _filtered = _allChats
          .where((c) => c.displayName(_currentUserId).toLowerCase().contains(q))
          .toList();
    });
  }

  void _toggleSelect(String chatId) {
    setState(() {
      if (_selectedIds.contains(chatId)) {
        _selectedIds.remove(chatId);
      } else {
        _selectedIds.add(chatId);
      }
    });
  }

  Future<void> _forward() async {
    if (_selectedIds.isEmpty || _isSending) return;
    setState(() => _isSending = true);
    await _chatService.forwardMessage(
      messageId: widget.messageId,
      chatIds: _selectedIds.toList(),
    );
    if (!mounted) return;
    setState(() => _isSending = false);
    context.pop();
    BmsToast.success(context, 'Message forwarded');
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
                    'Forward Message',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Search bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.surfaceL3,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: TextField(
                  controller: _searchController,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  decoration: const InputDecoration(
                    hintText: 'Search chats...',
                    hintStyle:
                        TextStyle(color: AppColors.textGray, fontSize: 14),
                    prefixIcon: Icon(LucideIcons.search,
                        color: AppColors.textDarkGray, size: 20),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 8),

            // Selected chips
            if (_selectedIds.isNotEmpty)
              SizedBox(
                height: 40,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: _selectedIds.map((id) {
                    final chat = _allChats.firstWhere((c) => c.id == id,
                        orElse: () => ChatModel(
                              id: id,
                              chatName: id,
                              isGroupChat: false,
                              isCommunity: false,
                              users: [],
                              groupAdmins: [],
                              pinnedBy: [],
                              updatedAt: DateTime.now(),
                            ));
                    return Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.primary, width: 1),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            chat.displayName(_currentUserId),
                            style: const TextStyle(
                                color: AppColors.primary,
                                fontSize: 12,
                                fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(width: 6),
                          GestureDetector(
                            onTap: () => _toggleSelect(id),
                            child: const Icon(LucideIcons.x,
                                color: AppColors.primary, size: 14),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),

            if (_selectedIds.isNotEmpty) const SizedBox(height: 8),

            // Chat list
            Expanded(
              child: _isLoading
                  ? const Center(
                      child:
                          CircularProgressIndicator(color: AppColors.primary))
                  : _filtered.isEmpty
                      ? const Center(
                          child: Text('No chats found',
                              style: TextStyle(
                                  color: Color(0x4DFFFFFF), fontSize: 15)))
                      : ListView.builder(
                          padding: const EdgeInsets.only(bottom: 80),
                          itemCount: _filtered.length,
                          itemBuilder: (ctx, i) {
                            final chat = _filtered[i];
                            final name = chat.displayName(_currentUserId);
                            final photo = chat.displayPhoto(_currentUserId);
                            final isSelected = _selectedIds.contains(chat.id);

                            return GestureDetector(
                              onTap: () => _toggleSelect(chat.id),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 16, vertical: 6),
                                child: Row(
                                  children: [
                                    // Avatar
                                    Container(
                                      width: 48,
                                      height: 48,
                                      decoration: const BoxDecoration(
                                          shape: BoxShape.circle),
                                      child: ClipOval(
                                        child: photo != null && photo.isNotEmpty
                                            ? Image.network(photo,
                                                fit: BoxFit.cover,
                                                errorBuilder: (_, __, ___) =>
                                                    _defaultAvatar())
                                            : _defaultAvatar(),
                                      ),
                                    ),
                                    const SizedBox(width: 12),

                                    // Name + subtitle
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(name,
                                              style: const TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 15,
                                                  fontWeight: FontWeight.w600)),
                                          Text(
                                            chat.isGroupChat
                                                ? '${chat.activeUsers.length} members'
                                                : 'Personal chat',
                                            style: const TextStyle(
                                                color: AppColors.textDarkGray,
                                                fontSize: 12),
                                          ),
                                        ],
                                      ),
                                    ),

                                    // Checkbox
                                    AnimatedContainer(
                                      duration:
                                          const Duration(milliseconds: 150),
                                      width: 24,
                                      height: 24,
                                      decoration: BoxDecoration(
                                        color: isSelected
                                            ? AppColors.primary
                                            : Colors.transparent,
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                          color: isSelected
                                              ? AppColors.primary
                                              : AppColors.textGray,
                                          width: 2,
                                        ),
                                      ),
                                      child: isSelected
                                          ? const Icon(LucideIcons.check,
                                              color: Colors.black, size: 14)
                                          : null,
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
      floatingActionButton: _selectedIds.isNotEmpty
          ? GestureDetector(
              onTap: _forward,
              child: Container(
                height: 52,
                padding: const EdgeInsets.symmetric(horizontal: 28),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(26),
                ),
                child: Center(
                  child: _isSending
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.black),
                        )
                      : Text(
                          'Forward to ${_selectedIds.length}',
                          style: const TextStyle(
                              color: Colors.black,
                              fontSize: 15,
                              fontWeight: FontWeight.w700),
                        ),
                ),
              ),
            )
          : null,
    );
  }

  Widget _defaultAvatar() => Container(
        color: AppColors.backgroundCard,
        child:
            const Icon(LucideIcons.user, color: AppColors.textGray, size: 24),
      );
}
