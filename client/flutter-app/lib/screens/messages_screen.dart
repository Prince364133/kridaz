import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../models/chat_model.dart';
import '../services/auth_manager.dart';
import '../services/chat_service.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({Key? key}) : super(key: key);

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen>
    with SingleTickerProviderStateMixin {
  final ChatService _chatService = ChatService();

  List<ChatModel> _chats = [];
  bool _isLoading = true;
  String? _currentUserId;
  late TabController _tabController;
  final Set<String> _pinnedIds = {};
  final Set<String> _readIds = {};

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() => setState(() {}));
    _loadChats();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadChats() async {
    final user = AuthManager().currentUser;
    _currentUserId = user?['_id']?.toString();
    setState(() => _isLoading = true);
    final chats = await _chatService.fetchChats();
    if (!mounted) return;
    setState(() {
      _chats = chats;
      _isLoading = false;
    });
  }

  void _openChat(ChatModel chat) {
    HapticFeedback.lightImpact();
    setState(() => _readIds.add(chat.id));
    final myId = _currentUserId ?? '';
    final otherId = chat.isGroupChat
        ? chat.id
        : chat.users
            .firstWhere(
              (u) => u.id != myId,
              orElse: () => chat.users.isNotEmpty
                  ? chat.users.first
                  : const ChatUser(id: '', name: ''),
            )
            .id;
    context.push('/chat', extra: {
      'chatId': chat.id,
      'friendId': otherId,
      'friendName': chat.displayName(myId),
      'friendPhoto': chat.displayPhoto(myId),
      'isGroup': chat.isGroupChat,
      'members': chat.users
          .map((u) => {
                '_id': u.id,
                'name': u.name,
                'photo': u.profilePicture,
                'isAdmin': u.isAdmin,
                'isPending': u.isPending,
              })
          .toList(),
    }).then((_) => _loadChats());
  }

  void _deleteConversation(String chatId) {
    _chatService.deleteChat(chatId);
    setState(() => _chats.removeWhere((c) => c.id == chatId));
  }

  void _togglePin(String chatId) {
    _chatService.togglePin(chatId);
    setState(() {
      if (_pinnedIds.contains(chatId)) {
        _pinnedIds.remove(chatId);
      } else {
        _pinnedIds.add(chatId);
      }
    });
  }

  Future<void> _respondToInvite(ChatModel chat, String status) async {
    final result = await _chatService.respondToInvite(chat.id, status);
    if (!mounted) return;
    setState(() {
      if (status == 'accepted' && result != null) {
        final idx = _chats.indexWhere((c) => c.id == chat.id);
        if (idx >= 0) _chats[idx] = result;
      } else {
        _chats.removeWhere((c) => c.id == chat.id);
      }
    });
  }

  void _showChatTypeSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _MsgChatTypeSheet(
        onIndividual: () {
          context.pop();
          context.push('/my-friends');
        },
        onGroup: () {
          context.pop();
          context.push('/select-contacts');
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEmpty = !_isLoading && _chats.isEmpty;
    return Scaffold(
      backgroundColor: AppColors.surfaceL0,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Row(
                children: [
                  Text(
                    isEmpty ? 'Chats' : 'Recent Chats',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => HapticFeedback.lightImpact(),
                    child: Image.asset(
                      'assets/icons/icon_chat_search.png',
                      width: 22,
                      height: 22,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // â”€â”€ Personal / Groups Pills â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  _MsgTabPill(
                    label: 'Personal',
                    selected: _tabController.index == 0,
                    onTap: () => _tabController.animateTo(0),
                  ),
                  const SizedBox(width: 8),
                  _MsgTabPill(
                    label: 'Groups',
                    selected: _tabController.index == 1,
                    onTap: () => _tabController.animateTo(1),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 6),

            // â”€â”€ Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildList(),
                  _buildList(groupsOnly: true),
                ],
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: _MsgFab(
        onTap: () {
          HapticFeedback.lightImpact();
          _showChatTypeSheet();
        },
      ),
    );
  }

  Widget _buildList({bool groupsOnly = false}) {
    if (_isLoading) {
      return const Center(
          child: CircularProgressIndicator(color: AppColors.primary));
    }

    final myId = _currentUserId ?? '';

    // Pending invites (groups only tab)
    final pendingChats = groupsOnly
        ? _chats.where((c) {
            final me = c.users.where((u) => u.id == myId);
            return me.isNotEmpty && me.first.isPending;
          }).toList()
        : <ChatModel>[];

    // Active chats
    final items = _chats.where((c) {
      if (groupsOnly ? !c.isGroupChat : c.isGroupChat) return false;
      final me = c.users.where((u) => u.id == myId);
      if (me.isNotEmpty && me.first.isPending) return false;
      return true;
    }).toList();

    if (items.isEmpty && pendingChats.isEmpty) {
      return const Center(
        child: Text(
          'Start Messaging !',
          style: TextStyle(
            color: Color(0x4DFFFFFF),
            fontSize: 16,
            fontWeight: FontWeight.w400,
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadChats,
      color: AppColors.primary,
      backgroundColor: AppColors.surfaceL3,
      child: ListView(
        padding: const EdgeInsets.only(top: 6, bottom: 80),
        children: [
          // Pending invites section
          if (pendingChats.isNotEmpty) ...[
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 8, 20, 10),
              child: Text(
                'Invites',
                style: TextStyle(
                  color: AppColors.textDarkGray,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            ...pendingChats.map((chat) => _MsgInviteTile(
                  key: ValueKey('invite_${chat.id}'),
                  chat: chat,
                  currentUserId: myId,
                  onAccept: () => _respondToInvite(chat, 'accepted'),
                  onDecline: () => _respondToInvite(chat, 'rejected'),
                )),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Divider(color: AppColors.surfaceL4),
            ),
          ],

          // Active chats
          ...items.map((chat) => _MsgSwipeableTile(
                key: ValueKey(chat.id),
                chat: chat,
                currentUserId: myId,
                isPinned: _pinnedIds.contains(chat.id),
                isRead: _readIds.contains(chat.id),
                onTap: () => _openChat(chat),
                onDelete: () => _deleteConversation(chat.id),
                onPin: () => _togglePin(chat.id),
              )),
        ],
      ),
    );
  }
}

// â”€â”€ Tab Pill â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _MsgTabPill extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _MsgTabPill(
      {required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppColors.primary : Colors.white,
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.black : Colors.white,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

// â”€â”€ FAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _MsgFab extends StatelessWidget {
  final VoidCallback onTap;
  const _MsgFab({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 56,
        height: 56,
        decoration: const BoxDecoration(
          color: AppColors.primary,
          shape: BoxShape.circle,
        ),
        child: Center(
          child: Image.asset(
            'assets/icons/icon_chat_start.png',
            width: 22,
            height: 22,
            color: Colors.black,
          ),
        ),
      ),
    );
  }
}

// â”€â”€ Swipeable Tile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _MsgSwipeableTile extends StatefulWidget {
  final ChatModel chat;
  final String currentUserId;
  final bool isPinned;
  final bool isRead;
  final VoidCallback onTap;
  final VoidCallback onDelete;
  final VoidCallback onPin;

  const _MsgSwipeableTile({
    super.key,
    required this.chat,
    required this.currentUserId,
    required this.isPinned,
    required this.isRead,
    required this.onTap,
    required this.onDelete,
    required this.onPin,
  });

  @override
  State<_MsgSwipeableTile> createState() => _MsgSwipeableTileState();
}

class _MsgSwipeableTileState extends State<_MsgSwipeableTile>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late Animation<double> _anim;
  double _offset = 0;
  bool _isOpen = false;
  static const double _revealWidth = 160.0;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 220));
    _anim = const AlwaysStoppedAnimation(0);
    _ctrl.addListener(_onTick);
  }

  void _onTick() => setState(() => _offset = _anim.value);

  @override
  void dispose() {
    _ctrl.removeListener(_onTick);
    _ctrl.dispose();
    super.dispose();
  }

  void _onDragUpdate(DragUpdateDetails d) {
    _ctrl.stop();
    setState(() {
      _offset = (_offset + d.delta.dx).clamp(-_revealWidth, 0.0);
    });
  }

  void _onDragEnd(DragEndDetails d) {
    final vel = d.velocity.pixelsPerSecond.dx;
    final shouldOpen = _offset < -_revealWidth * 0.35 || vel < -400;
    _animateTo(shouldOpen ? -_revealWidth : 0.0);
    _isOpen = shouldOpen;
  }

  void _animateTo(double end) {
    _anim = Tween<double>(begin: _offset, end: end)
        .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));
    _ctrl.forward(from: 0);
  }

  void _close() => _animateTo(0);

  String _fmtTime(DateTime? dt) {
    if (dt == null) return '';
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inDays == 0) {
      return '${dt.hour.toString().padLeft(2, '0')}.${dt.minute.toString().padLeft(2, '0')}';
    } else if (diff.inDays == 1) {
      return 'Yesterday';
    } else if (diff.inDays < 7) {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days[dt.weekday - 1];
    } else {
      return '${dt.day}/${dt.month}/${dt.year}';
    }
  }

  @override
  Widget build(BuildContext context) {
    final chat = widget.chat;
    final name = chat.displayName(widget.currentUserId);
    final photo = chat.displayPhoto(widget.currentUserId);
    final lastMsg = chat.latestMessage?.content ?? '';
    final lastAt = chat.latestMessage?.createdAt;
    final hasUnread = !widget.isRead && chat.latestMessage != null;

    return GestureDetector(
      onTap: () => _isOpen ? _close() : widget.onTap(),
      onHorizontalDragUpdate: _onDragUpdate,
      onHorizontalDragEnd: _onDragEnd,
      child: SizedBox(
        height: 78,
        child: Stack(
          children: [
            // â”€â”€ Action Buttons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            Positioned(
              right: 0,
              top: 0,
              bottom: 0,
              width: _revealWidth,
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        _close();
                        Future.delayed(
                            const Duration(milliseconds: 150), widget.onDelete);
                      },
                      child: Container(
                        color: AppColors.errorRed,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Image.asset('assets/icons/icon_chat_delete.png',
                                width: 20, height: 20, color: Colors.white),
                            const SizedBox(height: 5),
                            const Text('Delete',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        _close();
                        widget.onPin();
                      },
                      child: Container(
                        color: AppColors.backgroundCard,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Image.asset('assets/icons/icon_chat_pin.png',
                                width: 20,
                                height: 20,
                                color: AppColors.primary),
                            const SizedBox(height: 5),
                            Text(widget.isPinned ? 'Unpin' : 'Pin Msg.',
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // â”€â”€ Tile Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            Transform.translate(
              offset: Offset(_offset, 0),
              child: Container(
                color: AppColors.surfaceL0,
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 11),
                child: Row(
                  children: [
                    Stack(
                      children: [
                        Container(
                          width: 54,
                          height: 54,
                          decoration:
                              const BoxDecoration(shape: BoxShape.circle),
                          child: ClipOval(
                            child: photo != null && photo.isNotEmpty
                                ? Image.network(photo,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) =>
                                        _defaultAvatar())
                                : _defaultAvatar(),
                          ),
                        ),
                        Positioned(
                          bottom: 1,
                          right: 1,
                          child: Container(
                            width: 13,
                            height: 13,
                            decoration: BoxDecoration(
                              color: AppColors.accentGreen,
                              shape: BoxShape.circle,
                              border: Border.all(
                                  color: AppColors.surfaceL0, width: 2),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(name,
                                    style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 15,
                                        fontWeight: hasUnread
                                            ? FontWeight.w700
                                            : FontWeight.w600),
                                    overflow: TextOverflow.ellipsis),
                              ),
                              Text(
                                _fmtTime(lastAt),
                                style: TextStyle(
                                    color: hasUnread
                                        ? AppColors.primary
                                        : AppColors.textDarkGray,
                                    fontSize: 12,
                                    fontWeight: hasUnread
                                        ? FontWeight.w600
                                        : FontWeight.w400),
                              ),
                            ],
                          ),
                          const SizedBox(height: 5),
                          Row(
                            children: [
                              if (!hasUnread)
                                const Padding(
                                  padding: EdgeInsets.only(right: 4),
                                  child: Icon(LucideIcons.checkCheck,
                                      size: 14, color: AppColors.textDarkGray),
                                ),
                              Expanded(
                                child: Text(lastMsg,
                                    style: TextStyle(
                                        color: hasUnread
                                            ? Colors.white70
                                            : AppColors.textDarkGray,
                                        fontSize: 13,
                                        fontWeight: hasUnread
                                            ? FontWeight.w500
                                            : FontWeight.w400),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis),
                              ),
                            ],
                          ),
                        ],
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

  Widget _defaultAvatar() => Container(
        color: AppColors.backgroundCard,
        child:
            const Icon(LucideIcons.user, color: AppColors.textGray, size: 28),
      );
}

// â”€â”€ Invite Tile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _MsgInviteTile extends StatelessWidget {
  final ChatModel chat;
  final String currentUserId;
  final VoidCallback onAccept;
  final VoidCallback onDecline;

  const _MsgInviteTile({
    super.key,
    required this.chat,
    required this.currentUserId,
    required this.onAccept,
    required this.onDecline,
  });

  @override
  Widget build(BuildContext context) {
    final name = chat.displayName(currentUserId);
    final photo = chat.displayPhoto(currentUserId);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surfaceL2,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
              color: AppColors.primary.withValues(alpha: 0.3), width: 1),
        ),
        child: Row(
          children: [
            Container(
              width: 46,
              height: 46,
              decoration: const BoxDecoration(shape: BoxShape.circle),
              child: ClipOval(
                child: photo != null && photo.isNotEmpty
                    ? Image.network(photo,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _defaultAvatar())
                    : _defaultAvatar(),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  const Text('Group invite',
                      style: TextStyle(
                          color: AppColors.textDarkGray, fontSize: 12)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: onDecline,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.backgroundCard,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text('Decline',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w600)),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: onAccept,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text('Accept',
                    style: TextStyle(
                        color: Colors.black,
                        fontSize: 12,
                        fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _defaultAvatar() => Container(
        color: AppColors.backgroundCard,
        child:
            const Icon(LucideIcons.users, color: AppColors.textGray, size: 24),
      );
}

// â”€â”€ Chat Type Choice Sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _MsgChatTypeSheet extends StatelessWidget {
  final VoidCallback onIndividual;
  final VoidCallback onGroup;

  const _MsgChatTypeSheet({required this.onIndividual, required this.onGroup});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surfaceL2,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
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
          const SizedBox(height: 24),
          const Align(
            alignment: Alignment.centerLeft,
            child: Text(
              'New Conversation',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(height: 20),
          _SheetOption(
            icon: LucideIcons.user,
            title: 'Message Individual',
            subtitle: 'Chat one-on-one with a friend',
            onTap: onIndividual,
          ),
          const SizedBox(height: 12),
          _SheetOption(
            icon: LucideIcons.users,
            title: 'Create a Group',
            subtitle: 'Start a group conversation',
            onTap: onGroup,
          ),
        ],
      ),
    );
  }
}

class _SheetOption extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _SheetOption({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surfaceL4,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.backgroundCard, width: 1),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: AppColors.primary, size: 24),
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
                          fontWeight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Text(subtitle,
                      style: const TextStyle(
                          color: AppColors.textDarkGray, fontSize: 12)),
                ],
              ),
            ),
            const Icon(LucideIcons.chevronRight,
                color: AppColors.textGray, size: 14),
          ],
        ),
      ),
    );
  }
}
