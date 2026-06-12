import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../models/message_model.dart';
import '../services/auth_manager.dart';
import '../services/chat_service.dart';
import '../services/chat_socket_service.dart';
import '../widgets/common/bms_toast.dart';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ChatScreen
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class ChatScreen extends StatefulWidget {
  final String chatId;
  final String friendId;
  final String friendName;
  final String? friendPhoto;
  final bool isGroup;
  final List<Map<String, dynamic>> members;

  const ChatScreen({
    Key? key,
    required this.chatId,
    required this.friendId,
    required this.friendName,
    this.friendPhoto,
    this.isGroup = false,
    this.members = const [],
  }) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<MessageModel> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  String _currentUserId = '';
  bool _isTyping = false;

  // Selection mode
  final Set<String> _selectedIds = {};
  bool _isSelectMode = false;

  StreamSubscription<Map<String, dynamic>>? _messageSub;
  StreamSubscription<String>? _typingSub;
  StreamSubscription<Map<String, dynamic>>? _messageDeletedSub;
  Timer? _typingTimer;
  Timer? _typingDebounce;

  @override
  void initState() {
    super.initState();
    final me = AuthManager().currentUser;
    _currentUserId = (me?['id'] ?? me?['_id'])?.toString() ?? '';
    ChatSocketService().joinChat(widget.chatId);

    _messageSub = ChatSocketService().messageStream.listen((data) {
      final msg = MessageModel.fromJson(data);
      if (mounted) {
        setState(() => _messages.add(msg));
        _scrollToBottom();
      }
    });

    _typingSub = ChatSocketService().typingStream.listen((senderId) {
      if (senderId != _currentUserId && mounted) {
        setState(() => _isTyping = true);
        _typingTimer?.cancel();
        _typingTimer = Timer(const Duration(seconds: 3), () {
          if (mounted) setState(() => _isTyping = false);
        });
      }
    });

    // Remove messages deleted by server (e.g. deleted for everyone by someone else)
    _messageDeletedSub =
        ChatSocketService().messageDeletedStream.listen((data) {
      final ids =
          (data['messageIds'] as List? ?? []).map((e) => e.toString()).toList();
      if (mounted && ids.isNotEmpty) {
        setState(() => _messages.removeWhere((m) => ids.contains(m.id)));
      }
    });

    _loadMessages();
  }

  Future<void> _loadMessages() async {
    setState(() => _isLoading = true);
    final msgs = await ChatService().fetchMessages(widget.chatId);
    if (!mounted) return;
    setState(() {
      _messages = msgs;
      _isLoading = false;
    });
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _isSending) return;
    _messageController.clear();
    setState(() => _isSending = true);
    final msg =
        await ChatService().sendMessage(chatId: widget.chatId, content: text);
    if (!mounted) return;
    setState(() {
      if (msg != null) _messages.add(msg);
      _isSending = false;
    });
    _scrollToBottom();
  }

  void _onTyping() {
    _typingDebounce?.cancel();
    _typingDebounce = Timer(const Duration(milliseconds: 500), () {
      ChatSocketService().emitTyping(widget.chatId);
    });
  }

  Future<void> _sendImage() async {
    if (!mounted) return;
    BmsToast.info(context, 'Media upload coming soon');
  }

  // â”€â”€ Selection mode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  void _toggleSelection(String id) {
    setState(() {
      if (_selectedIds.contains(id)) {
        _selectedIds.remove(id);
        if (_selectedIds.isEmpty) _isSelectMode = false;
      } else {
        _selectedIds.add(id);
      }
    });
  }

  void _enterSelectMode(String id) {
    HapticFeedback.mediumImpact();
    setState(() {
      _isSelectMode = true;
      _selectedIds
        ..clear()
        ..add(id);
    });
  }

  void _exitSelectMode() => setState(() {
        _isSelectMode = false;
        _selectedIds.clear();
      });

  // â”€â”€ Message actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  void _showMessageOptions(MessageModel msg) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _MessageOptionsSheet(
        isMyMessage: msg.isMine(_currentUserId),
        onForward: () {
          context.pop();
          context.push('/forward-message', extra: {'messageId': msg.id});
        },
        onDeleteForMe: () {
          context.pop();
          _deleteMessages([msg.id], 'me');
        },
        onDeleteForEveryone: () {
          context.pop();
          _deleteMessages([msg.id], 'everyone');
        },
        onSelect: () {
          context.pop();
          _enterSelectMode(msg.id);
        },
      ),
    );
  }

  Future<void> _deleteMessages(List<String> ids, String type) async {
    final ok = await ChatService().deleteMessages(
      messageIds: ids,
      chatId: widget.chatId,
      deleteType: type,
    );
    if (ok && mounted) {
      setState(() {
        _messages.removeWhere((m) => ids.contains(m.id));
        if (_isSelectMode) _exitSelectMode();
      });
    }
  }

  Future<void> _confirmClearChat() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceL4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Clear Chat',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
        content: const Text(
          'All messages will be cleared for you. This cannot be undone.',
          style: TextStyle(color: AppColors.textDarkGray, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.white)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Clear',
                style: TextStyle(color: AppColors.errorRed)),
          ),
        ],
      ),
    );
    if (confirm != true || !mounted) return;
    final ok = await ChatService().clearChat(widget.chatId);
    if (ok && mounted) setState(() => _messages.clear());
  }

  void _onMenuAction(String action) {
    if (action == 'media') {
      context.push('/chat-media',
          extra: {'chatId': widget.chatId, 'chatName': widget.friendName});
    } else if (action == 'clear') {
      _confirmClearChat();
    }
  }

  String _fmtTime(DateTime dt) =>
      '${dt.hour.toString().padLeft(2, '0')}.${dt.minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceL0,
      body: Stack(
        children: [
          const Positioned.fill(child: _ChatWatermark()),
          Column(
            children: [
              _ChatAppBar(
                friendName: _isSelectMode
                    ? '${_selectedIds.length} selected'
                    : widget.friendName,
                friendPhoto: _isSelectMode ? null : widget.friendPhoto,
                isGroup: widget.isGroup,
                isSelectMode: _isSelectMode,
                onBack: () {
                  if (_isSelectMode) {
                    _exitSelectMode();
                  } else {
                    context.pop();
                  }
                },
                onNameTap: _isSelectMode
                    ? null
                    : () {
                        HapticFeedback.lightImpact();
                        if (widget.isGroup) {
                          context.push('/group-info', extra: {
                            'groupId': widget.chatId,
                            'groupName': widget.friendName,
                            'groupPhoto': widget.friendPhoto,
                            'members': widget.members,
                            'currentUserId': _currentUserId,
                          });
                        } else {
                          context.push('/chat-profile', extra: {
                            'friendId': widget.friendId,
                            'friendName': widget.friendName,
                            'friendPhoto': widget.friendPhoto,
                          });
                        }
                      },
                onMenuAction: _onMenuAction,
              ),
              Expanded(
                child: _isLoading
                    ? const Center(
                        child:
                            CircularProgressIndicator(color: AppColors.primary))
                    : _messages.isEmpty
                        ? const Center(
                            child: Text(
                              'Send a message to start the conversation',
                              style: TextStyle(
                                  color: Color(0x4DFFFFFF), fontSize: 14),
                              textAlign: TextAlign.center,
                            ),
                          )
                        : ListView.builder(
                            controller: _scrollController,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                            itemCount: _messages.length,
                            itemBuilder: (context, index) =>
                                _buildBubble(_messages[index], index),
                          ),
              ),
              if (_isTyping)
                _TypingIndicator(
                  friendName: widget.friendName,
                  friendPhoto: widget.friendPhoto,
                ),
              if (_isSelectMode)
                _SelectActionBar(
                  selectedCount: _selectedIds.length,
                  onCancel: _exitSelectMode,
                  onDeleteForMe: () =>
                      _deleteMessages(_selectedIds.toList(), 'me'),
                  onDeleteForEveryone: () =>
                      _deleteMessages(_selectedIds.toList(), 'everyone'),
                  onForward: _selectedIds.length == 1
                      ? () => context.push('/forward-message',
                          extra: {'messageId': _selectedIds.first})
                      : null,
                )
              else
                _InputBar(
                  controller: _messageController,
                  isSending: _isSending,
                  onSend: _sendMessage,
                  onAttach: _sendImage,
                  onTyping: _onTyping,
                ),
            ],
          ),
        ],
      ),
    );
  }

  // Distinct, accessible username colors for group chats. Each sender hashes
  // to a fixed index so they keep the same hue across sessions and devices.
  static const _senderPalette = <Color>[
    Color(0xFF4FC3F7), // sky
    Color(0xFFFFB74D), // amber
    Color(0xFFAED581), // lime
    Color(0xFFBA68C8), // violet
    Color(0xFFF06292), // pink
    Color(0xFF4DD0E1), // teal
    Color(0xFFFFD54F), // gold
    Color(0xFFE57373), // coral
  ];

  Color _senderHue(String userId) {
    if (userId.isEmpty) return _senderPalette.first;
    var hash = 0;
    for (final code in userId.codeUnits) {
      hash = (hash * 31 + code) & 0x7fffffff;
    }
    return _senderPalette[hash % _senderPalette.length];
  }

  Widget _buildBubble(MessageModel msg, int index) {
    final isMe = msg.isMine(_currentUserId);
    final timeStr = _fmtTime(msg.createdAt);
    final hasMedia = msg.media.isNotEmpty;
    final isSelected = _isSelectMode && _selectedIds.contains(msg.id);

    // A message is the "tail" of its burst when the next message either
    // doesn't exist or comes from a different sender. Only the tail shows
    // the avatar and a full bottom gap; intra-burst messages render tight.
    final isLastInBurst = index == _messages.length - 1 ||
        _messages[index + 1].sender.id != msg.sender.id;
    // Show the sender label only in group chats AND only on the first
    // message of a burst (so a single name heads a stack of consecutive
    // messages instead of repeating on every bubble).
    final isFirstInBurst =
        index == 0 || _messages[index - 1].sender.id != msg.sender.id;

    final bubble = isMe
        ? _SentBubble(
            content: hasMedia ? null : msg.content,
            hasMedia: hasMedia,
            timeStr: timeStr,
            showAvatar: isLastInBurst,
            isLastInBurst: isLastInBurst,
          )
        : _ReceivedBubble(
            content: hasMedia ? null : msg.content,
            hasMedia: hasMedia,
            timeStr: timeStr,
            senderName: widget.isGroup ? msg.sender.name : widget.friendName,
            senderPhoto: msg.sender.profilePicture ?? widget.friendPhoto,
            // Per-sender stable hue so two people in a group don't share the
            // same orange username. 1:1 chats keep the original accent.
            senderNameColor: widget.isGroup
                ? _senderHue(msg.sender.id)
                : AppColors.accentOrangeDeep,
            // In 1:1 chats the title bar already names the friend; repeating
            // it on every bubble is noise. In groups, show only above the
            // first message of a burst.
            showSenderName: widget.isGroup && isFirstInBurst,
            showAvatar: isLastInBurst,
            isLastInBurst: isLastInBurst,
          );

    return GestureDetector(
      onLongPress: () =>
          _isSelectMode ? _toggleSelection(msg.id) : _showMessageOptions(msg),
      onTap: _isSelectMode ? () => _toggleSelection(msg.id) : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        color: isSelected
            ? AppColors.primary.withValues(alpha: 0.1)
            : Colors.transparent,
        child: _isSelectMode
            ? Row(
                children: [
                  Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: Icon(
                      isSelected
                          ? Icons.check_circle_rounded
                          : LucideIcons.circle,
                      color:
                          isSelected ? AppColors.primary : AppColors.textGray,
                      size: 22,
                    ),
                  ),
                  Expanded(child: bubble),
                ],
              )
            : bubble,
      ),
    );
  }

  @override
  void dispose() {
    _messageSub?.cancel();
    _typingSub?.cancel();
    _messageDeletedSub?.cancel();
    _typingTimer?.cancel();
    _typingDebounce?.cancel();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Watermark Background
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _ChatWatermark extends StatelessWidget {
  const _ChatWatermark();

  @override
  Widget build(BuildContext context) => CustomPaint(
        painter: _WatermarkPainter(),
        child: const SizedBox.expand(),
      );
}

class _WatermarkPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0x09FFFFFF)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.3
      ..strokeCap = StrokeCap.round;
    const spacing = 88.0;
    const iconRadius = 14.0;
    int row = 0;
    for (double y = iconRadius; y < size.height + spacing; y += spacing) {
      final xOffset = (row % 2 == 0) ? 0.0 : spacing / 2;
      for (double x = xOffset + iconRadius;
          x < size.width + spacing;
          x += spacing) {
        _drawPerson(canvas, Offset(x, y), iconRadius, paint);
      }
      row++;
    }
  }

  void _drawPerson(Canvas canvas, Offset center, double r, Paint paint) {
    canvas.drawCircle(Offset(center.dx, center.dy - r * 0.65), r * 0.32, paint);
    final rect = Rect.fromCenter(
        center: Offset(center.dx, center.dy + r * 0.15),
        width: r * 1.3,
        height: r * 0.9);
    canvas.drawArc(rect, math.pi, math.pi, false, paint);
    canvas.drawLine(
      Offset(center.dx, center.dy - r * 0.28),
      Offset(center.dx, center.dy + r * 0.2),
      paint,
    );
  }

  @override
  bool shouldRepaint(_WatermarkPainter _) => false;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Chat App Bar
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _ChatAppBar extends StatelessWidget {
  final String friendName;
  final String? friendPhoto;
  final bool isGroup;
  final bool isSelectMode;
  final VoidCallback onBack;
  final VoidCallback? onNameTap;
  final void Function(String) onMenuAction;

  const _ChatAppBar({
    required this.friendName,
    required this.friendPhoto,
    required this.onBack,
    required this.onMenuAction,
    this.isGroup = false,
    this.isSelectMode = false,
    this.onNameTap,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Container(
        height: 64,
        color: AppColors.surfaceL0,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(
          children: [
            GestureDetector(
              onTap: () {
                HapticFeedback.lightImpact();
                onBack();
              },
              child: const Padding(
                padding: EdgeInsets.all(8),
                child: Icon(LucideIcons.chevronLeft,
                    color: Colors.white, size: 20),
              ),
            ),
            const SizedBox(width: 4),
            Expanded(
              child: GestureDetector(
                onTap: onNameTap,
                child: Row(
                  children: [
                    if (!isSelectMode)
                      Container(
                        width: 42,
                        height: 42,
                        decoration: const BoxDecoration(shape: BoxShape.circle),
                        child: ClipOval(
                          child: friendPhoto != null && friendPhoto!.isNotEmpty
                              ? Image.network(friendPhoto!,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) =>
                                      _defaultAvatar())
                              : _defaultAvatar(),
                        ),
                      ),
                    if (!isSelectMode) const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        friendName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.2,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (!isSelectMode)
              PopupMenuButton<String>(
                color: AppColors.surfaceL4,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                icon: const Icon(LucideIcons.moreVertical,
                    color: Colors.white, size: 22),
                onSelected: onMenuAction,
                itemBuilder: (_) => [
                  const PopupMenuItem(
                    value: 'media',
                    child: Row(children: [
                      Icon(LucideIcons.image, color: Colors.white, size: 18),
                      SizedBox(width: 10),
                      Text('View Media',
                          style: TextStyle(color: Colors.white, fontSize: 14)),
                    ]),
                  ),
                  const PopupMenuItem(
                    value: 'clear',
                    child: Row(children: [
                      Icon(Icons.delete_sweep_outlined,
                          color: AppColors.errorRed, size: 18),
                      SizedBox(width: 10),
                      Text('Clear Chat',
                          style: TextStyle(
                              color: AppColors.errorRed, fontSize: 14)),
                    ]),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _defaultAvatar() => Container(
        color: AppColors.backgroundCard,
        child:
            const Icon(LucideIcons.user, color: AppColors.textGray, size: 24),
      );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Message Options Sheet
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _MessageOptionsSheet extends StatelessWidget {
  final bool isMyMessage;
  final VoidCallback onForward;
  final VoidCallback onDeleteForMe;
  final VoidCallback onDeleteForEveryone;
  final VoidCallback onSelect;

  const _MessageOptionsSheet({
    required this.isMyMessage,
    required this.onForward,
    required this.onDeleteForMe,
    required this.onDeleteForEveryone,
    required this.onSelect,
  });

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
          const SizedBox(height: 20),
          _OptionTile(
              icon: LucideIcons.reply, label: 'Forward', onTap: onForward),
          _OptionTile(
              icon: LucideIcons.checkCircle, label: 'Select', onTap: onSelect),
          _OptionTile(
            icon: LucideIcons.trash2,
            label: 'Delete for Me',
            color: AppColors.errorRed,
            onTap: onDeleteForMe,
          ),
          if (isMyMessage)
            _OptionTile(
              icon: LucideIcons.trash2,
              label: 'Delete for Everyone',
              color: AppColors.errorRed,
              onTap: onDeleteForEveryone,
            ),
        ],
      ),
    );
  }
}

class _OptionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color color;

  const _OptionTile({
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Select Action Bar
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _SelectActionBar extends StatelessWidget {
  final int selectedCount;
  final VoidCallback onCancel;
  final VoidCallback onDeleteForMe;
  final VoidCallback onDeleteForEveryone;
  final VoidCallback? onForward;

  const _SelectActionBar({
    required this.selectedCount,
    required this.onCancel,
    required this.onDeleteForMe,
    required this.onDeleteForEveryone,
    this.onForward,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        color: AppColors.surfaceL3,
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        child: Row(
          children: [
            GestureDetector(
              onTap: onCancel,
              child: const Icon(LucideIcons.x, color: Colors.white, size: 22),
            ),
            const SizedBox(width: 12),
            Text(
              '$selectedCount selected',
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w600),
            ),
            const Spacer(),
            if (onForward != null)
              GestureDetector(
                onTap: onForward,
                child: const Padding(
                  padding: EdgeInsets.all(8),
                  child: Icon(LucideIcons.reply, color: Colors.white, size: 22),
                ),
              ),
            GestureDetector(
              onTap: onDeleteForMe,
              child: const Padding(
                padding: EdgeInsets.all(8),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(LucideIcons.trash2,
                        color: AppColors.errorRed, size: 22),
                    Text('For Me',
                        style:
                            TextStyle(color: AppColors.errorRed, fontSize: 9)),
                  ],
                ),
              ),
            ),
            GestureDetector(
              onTap: onDeleteForEveryone,
              child: const Padding(
                padding: EdgeInsets.all(8),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(LucideIcons.trash2,
                        color: AppColors.errorRed, size: 22),
                    Text('Everyone',
                        style:
                            TextStyle(color: AppColors.errorRed, fontSize: 9)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Received Bubble
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _ReceivedBubble extends StatelessWidget {
  final String? content;
  final bool hasMedia;
  final String timeStr;
  final String senderName;
  final String? senderPhoto;
  final Color senderNameColor;
  final bool showSenderName;
  final bool showAvatar;
  final bool isLastInBurst;

  const _ReceivedBubble({
    required this.content,
    required this.hasMedia,
    required this.timeStr,
    required this.senderName,
    required this.senderPhoto,
    required this.senderNameColor,
    required this.showSenderName,
    required this.showAvatar,
    required this.isLastInBurst,
  });

  @override
  Widget build(BuildContext context) {
    // Tail-of-burst gets a small "drop" corner toward the avatar; intra-burst
    // messages keep all corners rounded so the stack reads as one unit.
    final radius = isLastInBurst
        ? const BorderRadius.only(
            topLeft: Radius.circular(18),
            topRight: Radius.circular(18),
            bottomLeft: Radius.circular(4),
            bottomRight: Radius.circular(18),
          )
        : BorderRadius.circular(18);

    return Padding(
      padding: EdgeInsets.only(bottom: isLastInBurst ? 12 : 2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          SizedBox(
            width: 32,
            height: 32,
            child: showAvatar
                ? ClipOval(
                    child: senderPhoto != null && senderPhoto!.isNotEmpty
                        ? Image.network(senderPhoto!,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => _miniAvatar())
                        : _miniAvatar(),
                  )
                : const SizedBox.shrink(),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: ConstrainedBox(
              constraints: BoxConstraints(
                  maxWidth: MediaQuery.of(context).size.width * 0.72),
              child: Container(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 6),
                decoration: BoxDecoration(
                  color: AppColors.surfaceL4,
                  borderRadius: radius,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (showSenderName) ...[
                      Text(senderName,
                          style: TextStyle(
                              color: senderNameColor,
                              fontSize: 12,
                              fontWeight: FontWeight.w600)),
                      const SizedBox(height: 2),
                    ],
                    if (hasMedia)
                      Container(
                        width: 200,
                        height: 80,
                        decoration: BoxDecoration(
                          color: AppColors.backgroundCard,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Center(
                          child: Text('📎 Media',
                              style: TextStyle(
                                  color: AppColors.textDarkGray, fontSize: 14)),
                        ),
                      )
                    else
                      Text(content ?? '',
                          style: const TextStyle(
                              color: Colors.white, fontSize: 14, height: 1.35)),
                    Align(
                      alignment: Alignment.bottomRight,
                      child: Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(timeStr,
                            style: const TextStyle(
                                color: AppColors.textDarkGray, fontSize: 10)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _miniAvatar() => Container(
        color: AppColors.backgroundCard,
        child:
            const Icon(LucideIcons.user, color: AppColors.textGray, size: 18),
      );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Sent Bubble
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _SentBubble extends StatelessWidget {
  final String? content;
  final bool hasMedia;
  final String timeStr;
  final bool showAvatar;
  final bool isLastInBurst;

  const _SentBubble({
    required this.content,
    required this.hasMedia,
    required this.timeStr,
    required this.showAvatar,
    required this.isLastInBurst,
  });

  @override
  Widget build(BuildContext context) {
    final radius = isLastInBurst
        ? const BorderRadius.only(
            topLeft: Radius.circular(18),
            topRight: Radius.circular(18),
            bottomLeft: Radius.circular(18),
            bottomRight: Radius.circular(4),
          )
        : BorderRadius.circular(18);

    return Padding(
      padding: EdgeInsets.only(bottom: isLastInBurst ? 12 : 2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          Flexible(
            child: ConstrainedBox(
              constraints: BoxConstraints(
                  maxWidth: MediaQuery.of(context).size.width * 0.72),
              child: Container(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 6),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: radius,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    if (hasMedia)
                      Container(
                        width: 200,
                        height: 80,
                        decoration: BoxDecoration(
                          color: AppColors.backgroundCard,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Center(
                          child: Text('📎 Media',
                              style: TextStyle(
                                  color: AppColors.textDarkGray, fontSize: 14)),
                        ),
                      )
                    else
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(content ?? '',
                            style: const TextStyle(
                                color: Colors.black,
                                fontSize: 14,
                                height: 1.35)),
                      ),
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(timeStr,
                              style: const TextStyle(
                                  color: AppColors.borderGray, fontSize: 10)),
                          const SizedBox(width: 3),
                          const Icon(Icons.done,
                              size: 13, color: AppColors.borderGray),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          SizedBox(
            width: 32,
            height: 32,
            child: showAvatar
                ? Container(
                    decoration: const BoxDecoration(
                        color: AppColors.backgroundCard,
                        shape: BoxShape.circle),
                    child: const Icon(LucideIcons.user,
                        color: AppColors.textGray, size: 18),
                  )
                : const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Typing Indicator
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _TypingIndicator extends StatefulWidget {
  final String friendName;
  final String? friendPhoto;

  const _TypingIndicator({required this.friendName, required this.friendPhoto});

  @override
  State<_TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<_TypingIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late List<Animation<double>> _dotAnims;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900))
      ..repeat();
    _dotAnims = List.generate(
      3,
      (i) => Tween<double>(begin: 0, end: -6).animate(
        CurvedAnimation(
          parent: _ctrl,
          curve: Interval(i * 0.2, 0.6 + i * 0.2, curve: Curves.easeInOut),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      child: Row(
        children: [
          AnimatedBuilder(
            animation: _ctrl,
            builder: (_, __) => Row(
              children: List.generate(3, (i) {
                return Transform.translate(
                  offset: Offset(0, _dotAnims[i].value),
                  child: Container(
                    width: 7,
                    height: 7,
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                  ),
                );
              }),
            ),
          ),
          const SizedBox(width: 10),
          Container(
            width: 22,
            height: 22,
            decoration: const BoxDecoration(shape: BoxShape.circle),
            child: ClipOval(
              child: widget.friendPhoto != null
                  ? Image.network(widget.friendPhoto!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                          color: AppColors.backgroundCard,
                          child: const Icon(LucideIcons.user,
                              color: AppColors.textGray, size: 14)))
                  : Container(
                      color: AppColors.backgroundCard,
                      child: const Icon(LucideIcons.user,
                          color: AppColors.textGray, size: 14)),
            ),
          ),
          const SizedBox(width: 8),
          Text('${widget.friendName} is typing...',
              style:
                  const TextStyle(color: AppColors.textDarkGray, fontSize: 12)),
        ],
      ),
    );
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Input Bar
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _InputBar extends StatelessWidget {
  final TextEditingController controller;
  final bool isSending;
  final VoidCallback onSend;
  final VoidCallback onAttach;
  final VoidCallback onTyping;

  const _InputBar({
    required this.controller,
    required this.isSending,
    required this.onSend,
    required this.onAttach,
    required this.onTyping,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        color: AppColors.surfaceL1,
        padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
        child: Row(
          children: [
            GestureDetector(
              onTap: () {},
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 4),
                child: Icon(LucideIcons.smile,
                    color: AppColors.textDarkGray, size: 26),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Container(
                constraints: const BoxConstraints(minHeight: 44),
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.surfaceL3,
                  borderRadius: BorderRadius.circular(22),
                ),
                child: TextField(
                  controller: controller,
                  style: const TextStyle(
                      color: Colors.white, fontSize: 14, height: 1.4),
                  decoration: const InputDecoration(
                    hintText: 'Write a message...',
                    hintStyle: TextStyle(
                        color: AppColors.textGray,
                        fontSize: 14,
                        fontWeight: FontWeight.w400),
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: EdgeInsets.zero,
                  ),
                  maxLines: null,
                  textCapitalization: TextCapitalization.sentences,
                  onChanged: (_) => onTyping(),
                ),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: onAttach,
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 4),
                child: Icon(Icons.attach_file_rounded,
                    color: AppColors.textDarkGray, size: 24),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: isSending ? null : onSend,
              child: Container(
                width: 46,
                height: 46,
                decoration: const BoxDecoration(
                    color: AppColors.primary, shape: BoxShape.circle),
                child: isSending
                    ? const Padding(
                        padding: EdgeInsets.all(12),
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.black),
                      )
                    : Center(
                        child: Image.asset(
                          'assets/icons/icon_chat_send.png',
                          width: 22,
                          height: 22,
                          color: Colors.black,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
