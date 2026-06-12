# Chat API Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Flutter app's broken `/messages/*` chat service with correct calls to the backend's `/api/chat/*` endpoints, and add Socket.IO for real-time messaging.

**Architecture:** A new `ChatService` (backed by the existing `ApiService` singleton) replaces both `messages_service.dart` and `chat_websocket_service.dart`. Screens call `ChatService` for REST operations and subscribe to a `ChatSocketService` for real-time Socket.IO events. Mock data in screens is removed and replaced with live data, with loading states while the backend responds.

**Tech Stack:** Flutter/Dart, Dio (via `ApiService`), `socket_io_client ^2.0.3+1`, Riverpod, SharedPreferences, `go_router`

---

## Background: What's broken and why

The app currently calls five endpoints that **do not exist** in the backend:
- `POST /api/messages/send`
- `GET /api/messages/conversation/:id`
- `GET /api/messages/conversations`
- `POST /api/messages/upload-attachment`
- `GET /api/messages/unread-count`

It also opens a raw WebSocket to `/api/v1/chat/ws/:userId` — the backend uses **Socket.IO**, not raw WebSocket, so this connection always fails silently.

The backend's actual chat API lives at `/api/chat/*`. Auth is via `Authorization: Bearer <token>`, which `ApiService` already injects automatically after `setAuthToken()` is called on login.

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| **Create** | `lib/models/chat_model.dart` | `ChatModel`, `ChatUser`, `LatestMessage` data classes |
| **Create** | `lib/models/message_model.dart` | `MessageModel`, `MessageSender` data classes |
| **Create** | `lib/services/chat_service.dart` | All REST calls to `/api/chat/*` via `ApiService` |
| **Create** | `lib/services/chat_socket_service.dart` | Socket.IO connection and event streams |
| **Modify** | `lib/screens/conversations_screen.dart` | Replace mock data + broken service with `ChatService` |
| **Modify** | `lib/screens/chat_screen.dart` | Replace broken send/load with `ChatService` + `ChatSocketService` |
| **Modify** | `lib/screens/create_group_screen.dart` | Call `POST /api/chat/group` instead of generating a fake ID |
| **Modify** | `pubspec.yaml` | Add `socket_io_client` dependency |
| **Delete** | `lib/services/messages_service.dart` | Replaced by `chat_service.dart` |
| **Delete** | `lib/services/chat_websocket_service.dart` | Replaced by `chat_socket_service.dart` |

---

## Task 1: Create ChatModel and MessageModel

**Files:**
- Create: `lib/models/chat_model.dart`
- Create: `lib/models/message_model.dart`

These mirror the backend MongoDB documents. The backend populates nested objects (e.g. `users[].user` is a full user object, not just an ID).

- [ ] **Step 1: Create `lib/models/chat_model.dart`**

```dart
class ChatUser {
  final String id;
  final String name;
  final String? profilePicture;
  final String? email;

  const ChatUser({
    required this.id,
    required this.name,
    this.profilePicture,
    this.email,
  });

  factory ChatUser.fromJson(Map<String, dynamic> json) {
    // Backend nests user inside a { user: {...}, onModel: "..." } wrapper
    final u = json['user'] is Map ? json['user'] as Map<String, dynamic> : json;
    return ChatUser(
      id: (u['_id'] ?? u['id'] ?? '').toString(),
      name: (u['name'] ?? '').toString(),
      profilePicture: u['profilePicture']?.toString() ?? u['profileImage']?.toString(),
      email: u['email']?.toString(),
    );
  }
}

class LatestMessage {
  final String id;
  final String content;
  final String? senderName;
  final DateTime createdAt;

  const LatestMessage({
    required this.id,
    required this.content,
    this.senderName,
    required this.createdAt,
  });

  factory LatestMessage.fromJson(Map<String, dynamic> json) => LatestMessage(
        id: (json['_id'] ?? '').toString(),
        content: (json['content'] ?? '').toString(),
        senderName: json['sender'] is Map
            ? (json['sender']['user'] is Map
                ? json['sender']['user']['name']?.toString()
                : null)
            : null,
        createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      );
}

class ChatModel {
  final String id;
  final String chatName;
  final bool isGroupChat;
  final bool isCommunity;
  final List<ChatUser> users;
  final List<ChatUser> groupAdmins;
  final LatestMessage? latestMessage;
  final List<String> pinnedBy;
  final DateTime updatedAt;

  const ChatModel({
    required this.id,
    required this.chatName,
    required this.isGroupChat,
    required this.isCommunity,
    required this.users,
    required this.groupAdmins,
    this.latestMessage,
    required this.pinnedBy,
    required this.updatedAt,
  });

  factory ChatModel.fromJson(Map<String, dynamic> json) {
    final usersList = (json['users'] as List? ?? [])
        .map((u) => ChatUser.fromJson(u as Map<String, dynamic>))
        .toList();

    final adminsList = (json['groupAdmins'] as List? ?? [])
        .map((a) => ChatUser.fromJson(a as Map<String, dynamic>))
        .toList();

    final pinned = (json['pinnedBy'] as List? ?? [])
        .map((p) => p.toString())
        .toList();

    return ChatModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      chatName: (json['chatName'] ?? '').toString(),
      isGroupChat: json['isGroupChat'] == true,
      isCommunity: json['isCommunity'] == true,
      users: usersList,
      groupAdmins: adminsList,
      latestMessage: json['latestMessage'] is Map
          ? LatestMessage.fromJson(json['latestMessage'] as Map<String, dynamic>)
          : null,
      pinnedBy: pinned,
      updatedAt: DateTime.tryParse(json['updatedAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }

  /// Returns the display name for a 1-on-1 chat given the current user's ID.
  String displayName(String currentUserId) {
    if (isGroupChat) return chatName;
    final other = users.firstWhere(
      (u) => u.id != currentUserId,
      orElse: () => users.isNotEmpty ? users.first : const ChatUser(id: '', name: 'Unknown'),
    );
    return other.name;
  }

  /// Returns the other user's avatar URL for a 1-on-1 chat.
  String? displayPhoto(String currentUserId) {
    if (isGroupChat) return null;
    final other = users.firstWhere(
      (u) => u.id != currentUserId,
      orElse: () => users.isNotEmpty ? users.first : const ChatUser(id: '', name: ''),
    );
    return other.profilePicture;
  }
}
```

- [ ] **Step 2: Create `lib/models/message_model.dart`**

```dart
class MessageSender {
  final String id;
  final String name;
  final String? profilePicture;

  const MessageSender({
    required this.id,
    required this.name,
    this.profilePicture,
  });

  factory MessageSender.fromJson(Map<String, dynamic> json) {
    // Backend shape: { user: { _id, name, profilePicture }, onModel: "..." }
    final u = json['user'] is Map ? json['user'] as Map<String, dynamic> : json;
    return MessageSender(
      id: (u['_id'] ?? u['id'] ?? '').toString(),
      name: (u['name'] ?? '').toString(),
      profilePicture: u['profilePicture']?.toString() ?? u['profileImage']?.toString(),
    );
  }
}

class MessageModel {
  final String id;
  final MessageSender sender;
  final String content;
  final String chatId;
  final List<Map<String, dynamic>> media;
  final DateTime createdAt;
  final List<String> readBy;

  const MessageModel({
    required this.id,
    required this.sender,
    required this.content,
    required this.chatId,
    required this.media,
    required this.createdAt,
    required this.readBy,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    final chat = json['chat'];
    final chatId = chat is Map
        ? (chat['_id'] ?? chat['id'] ?? '').toString()
        : (chat ?? '').toString();

    final mediaList = (json['media'] as List? ?? [])
        .map((m) => m as Map<String, dynamic>)
        .toList();

    final readList = (json['readBy'] as List? ?? []).map((r) {
      if (r is Map) return (r['user']?.toString() ?? r['_id']?.toString() ?? '');
      return r.toString();
    }).toList();

    return MessageModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      sender: MessageSender.fromJson(json['sender'] as Map<String, dynamic>? ?? {}),
      content: (json['content'] ?? '').toString(),
      chatId: chatId,
      media: mediaList,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      readBy: readList,
    );
  }

  bool isMine(String myUserId) => sender.id == myUserId;
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/models/chat_model.dart lib/models/message_model.dart
git commit -m "feat(chat): add ChatModel and MessageModel data classes"
```

---

## Task 2: Write ChatService

**Files:**
- Create: `lib/services/chat_service.dart`

This replaces `messages_service.dart`. It uses the `ApiService` singleton (which auto-injects the Bearer token and has base URL `https://kridaz.up.railway.app/api`).

- [ ] **Step 1: Create `lib/services/chat_service.dart`**

```dart
import '../models/chat_model.dart';
import '../models/message_model.dart';
import 'api_service.dart';

class ChatService {
  static final ChatService _instance = ChatService._internal();
  factory ChatService() => _instance;
  ChatService._internal();

  final ApiService _api = ApiService();

  /// Access or create a 1-on-1 chat with [userId].
  /// Returns the chat object, or null on failure.
  Future<ChatModel?> accessChat(String userId) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/chat',
      data: {'userId': userId, 'onModel': 'User'},
    );
    if (response.isSuccess && response.data != null) {
      return ChatModel.fromJson(response.data!);
    }
    return null;
  }

  /// Fetch all chats for the logged-in user.
  /// Returns a list of active chats (excludes pending invitations).
  Future<List<ChatModel>> fetchChats() async {
    final response = await _api.get<dynamic>('/chat');
    if (!response.isSuccess || response.data == null) return [];

    // Backend may return a plain array or { chats: [...], invitations: [...] }
    List<dynamic> raw;
    if (response.data is List) {
      raw = response.data as List;
    } else if (response.data is Map && response.data['chats'] is List) {
      raw = response.data['chats'] as List;
    } else {
      return [];
    }

    return raw
        .map((c) => ChatModel.fromJson(c as Map<String, dynamic>))
        .toList();
  }

  /// Create a group chat with [name] and [userIds] as members.
  Future<ChatModel?> createGroupChat({
    required String name,
    required List<String> userIds,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/chat/group',
      data: {
        'name': name,
        'users': userIds,
      },
    );
    if (response.isSuccess && response.data != null) {
      return ChatModel.fromJson(response.data!);
    }
    return null;
  }

  /// Get all messages for [chatId].
  Future<List<MessageModel>> fetchMessages(String chatId) async {
    final response = await _api.get<dynamic>('/chat/message/$chatId');
    if (!response.isSuccess || response.data == null) return [];

    final raw = response.data is List ? response.data as List : [];
    return raw
        .map((m) => MessageModel.fromJson(m as Map<String, dynamic>))
        .toList();
  }

  /// Send a text message to [chatId].
  Future<MessageModel?> sendMessage({
    required String chatId,
    required String content,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/chat/message',
      data: {'chatId': chatId, 'content': content},
    );
    if (response.isSuccess && response.data != null) {
      return MessageModel.fromJson(response.data!);
    }
    return null;
  }

  /// Send a message with a media attachment.
  /// [mediaUrl] is a URL already uploaded to cloud storage.
  Future<MessageModel?> sendMediaMessage({
    required String chatId,
    required String mediaUrl,
    required String mediaType,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/chat/message',
      data: {
        'chatId': chatId,
        'content': '',
        'media': [
          {'url': mediaUrl, 'type': mediaType}
        ],
      },
    );
    if (response.isSuccess && response.data != null) {
      return MessageModel.fromJson(response.data!);
    }
    return null;
  }

  /// Mark all messages in [chatId] as read.
  Future<void> markMessagesRead(String chatId) async {
    await _api.put<dynamic>('/chat/message/$chatId/read', data: {});
  }

  /// Pin or unpin [chatId].
  Future<void> togglePin(String chatId) async {
    await _api.put<dynamic>('/chat/pin', data: {'chatId': chatId});
  }

  /// Delete [chatId].
  Future<void> deleteChat(String chatId) async {
    await _api.delete<dynamic>('/chat/$chatId');
  }
}
```

- [ ] **Step 2: Verify `ApiService` has the methods used above**

Open `lib/services/api_service.dart` and confirm it exposes:
- `get<T>(String path)`
- `post<T>(String path, {dynamic data})`
- `put<T>(String path, {dynamic data})`
- `delete<T>(String path)`

If `put` or `delete` are missing, add them following the same pattern as `get` and `post` in that file.

- [ ] **Step 3: Commit**

```bash
git add lib/services/chat_service.dart
git commit -m "feat(chat): add ChatService wired to /api/chat/* endpoints"
```

---

## Task 3: Add socket_io_client and write ChatSocketService

**Files:**
- Modify: `pubspec.yaml`
- Create: `lib/services/chat_socket_service.dart`

The backend uses Socket.IO (with Redis adapter). Raw WebSocket will not work. We need the `socket_io_client` package.

- [ ] **Step 1: Add dependency to `pubspec.yaml`**

Open `pubspec.yaml`. Under `dependencies:`, add:

```yaml
  socket_io_client: ^2.0.3+1
```

- [ ] **Step 2: Run pub get**

```bash
flutter pub get
```

Expected: resolves without conflict. If version conflict, use `^2.0.0`.

- [ ] **Step 3: Create `lib/services/chat_socket_service.dart`**

```dart
import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/api_config.dart';

class ChatSocketService {
  static final ChatSocketService _instance = ChatSocketService._internal();
  factory ChatSocketService() => _instance;
  ChatSocketService._internal();

  io.Socket? _socket;
  bool get isConnected => _socket?.connected ?? false;

  final _messageController = StreamController<Map<String, dynamic>>.broadcast();
  final _typingController = StreamController<String>.broadcast();

  Stream<Map<String, dynamic>> get messageStream => _messageController.stream;
  Stream<String> get typingStream => _typingController.stream;

  /// Connect to the Socket.IO server. Call this after login.
  void connect(String token) {
    if (_socket?.connected == true) return;

    // Strip the /api suffix — Socket.IO connects to the root server
    final serverUrl = ApiConfig.apiUrl.replaceAll(RegExp(r'/api$'), '');

    _socket = io.io(
      serverUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setExtraHeaders({'Authorization': 'Bearer $token'})
          .setAuth({'token': token})
          .disableAutoConnect()
          .build(),
    );

    _socket!.connect();

    _socket!.onConnect((_) {
      print('✅ Socket.IO connected');
    });

    _socket!.onDisconnect((_) {
      print('🔌 Socket.IO disconnected');
    });

    // Backend emits "message received" when a new message arrives
    _socket!.on('message received', (data) {
      if (data is Map) {
        _messageController.add(Map<String, dynamic>.from(data));
      }
    });

    // Backend emits "typing" when another user is typing
    _socket!.on('typing', (data) {
      if (data is String) _typingController.add(data);
      if (data is Map) _typingController.add((data['userId'] ?? '').toString());
    });
  }

  /// Join a chat room to receive messages for that chat.
  void joinChat(String chatId) {
    _socket?.emit('join chat', chatId);
  }

  /// Emit typing indicator for [chatId].
  void emitTyping(String chatId) {
    _socket?.emit('typing', chatId);
  }

  /// Emit stop typing for [chatId].
  void emitStopTyping(String chatId) {
    _socket?.emit('stop typing', chatId);
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }

  void dispose() {
    disconnect();
    _messageController.close();
    _typingController.close();
  }
}
```

- [ ] **Step 4: Connect the socket at login**

Open `lib/services/auth_manager.dart`. After `await _setToken(tok)` in both `loginWithEmail` and `signInWithGoogle`, add:

```dart
ChatSocketService().connect(tok);
```

Add the import at the top:
```dart
import 'chat_socket_service.dart';
```

Also call `ChatSocketService().disconnect()` inside `signOut()` before `_authController.add(false)`.

- [ ] **Step 5: Commit**

```bash
git add pubspec.yaml pubspec.lock lib/services/chat_socket_service.dart lib/services/auth_manager.dart
git commit -m "feat(chat): add Socket.IO service and connect on login"
```

---

## Task 4: Update ConversationsScreen

**Files:**
- Modify: `lib/screens/conversations_screen.dart`

Replace the `MessagesService` import and all mock data with real `ChatService` calls.

- [ ] **Step 1: Update imports at top of `conversations_screen.dart`**

Remove:
```dart
import '../services/messages_service.dart';
```

Add:
```dart
import '../services/chat_service.dart';
import '../models/chat_model.dart';
import '../services/auth_manager.dart';
```

- [ ] **Step 2: Replace state and service field**

Remove:
```dart
final MessagesService _messagesService = MessagesService();
List<Map<String, dynamic>> _conversations = [];
String? _userId;
```

Add:
```dart
final ChatService _chatService = ChatService();
List<ChatModel> _chats = [];
String? _currentUserId;
```

- [ ] **Step 3: Replace `_loadUserId` and `_loadConversations`**

Remove the old `_loadUserId`, `_loadConversations`, and ALL `_mockPersonal`, `_mockConversations`, `_mockGroups` static constants.

Replace with:

```dart
@override
void initState() {
  super.initState();
  _tabController = TabController(length: 2, vsync: this);
  _tabController.addListener(() => setState(() {}));
  _loadChats();
}

Future<void> _loadChats() async {
  setState(() => _isLoading = true);
  _currentUserId = AuthManager().currentUser?['_id']?.toString();
  final chats = await _chatService.fetchChats();
  if (mounted) {
    setState(() {
      _chats = chats;
      _isLoading = false;
    });
  }
}
```

- [ ] **Step 4: Update the list builder**

Find every place `_conversations` or `_mockPersonal` / `_mockGroups` is used in the `build` method to render a list tile. Replace with `_chats`, splitting on `isGroupChat`:

```dart
// Personal chats tab
final personal = _chats.where((c) => !c.isGroupChat).toList();
// Groups tab
final groups = _chats.where((c) => c.isGroupChat).toList();
```

For each tile, use:
- `chat.displayName(_currentUserId ?? '')` instead of `conv['other_user_name']`
- `chat.displayPhoto(_currentUserId ?? '')` instead of `conv['other_user_photo']`
- `chat.latestMessage?.content ?? ''` instead of `conv['last_message']`
- `_formatTime(chat.latestMessage?.createdAt.toIso8601String())` instead of `conv['last_message_at']`
- `chat.id` instead of `conv['other_user_id']`

When navigating to `ChatScreen`, pass:
```dart
context.go('/chat', extra: {
  'chatId': chat.id,
  'friendName': chat.displayName(_currentUserId ?? ''),
  'friendPhoto': chat.displayPhoto(_currentUserId ?? ''),
  'isGroup': chat.isGroupChat,
});
```

- [ ] **Step 5: Commit**

```bash
git add lib/screens/conversations_screen.dart
git commit -m "feat(chat): wire ConversationsScreen to real /api/chat data"
```

---

## Task 5: Update ChatScreen

**Files:**
- Modify: `lib/screens/chat_screen.dart`

Replace broken WebSocket + `MessagesService` calls with `ChatService` + `ChatSocketService`.

- [ ] **Step 1: Update ChatScreen constructor**

The screen currently takes `friendId` (a user ID). We now need to also accept `chatId` (the backend chat document `_id`), since messages are fetched by chat ID, not user ID.

Change the constructor:

```dart
class ChatScreen extends StatefulWidget {
  final String? chatId;       // backend chat _id (null if opening from player profile)
  final String? friendId;     // other user's _id (used to create/find chat if chatId is null)
  final String friendName;
  final String? friendPhoto;
  final bool isGroup;
  final List<Map<String, dynamic>> members;

  const ChatScreen({
    Key? key,
    this.chatId,
    this.friendId,
    required this.friendName,
    this.friendPhoto,
    this.isGroup = false,
    this.members = const [],
  }) : super(key: key);
  ...
}
```

- [ ] **Step 2: Replace imports**

Remove:
```dart
import '../services/messages_service.dart';
import '../services/chat_websocket_service.dart';
```

Add:
```dart
import '../services/chat_service.dart';
import '../services/chat_socket_service.dart';
import '../models/message_model.dart';
import '../services/auth_manager.dart';
```

- [ ] **Step 3: Replace state fields**

Remove:
```dart
final MessagesService _messagesService = MessagesService();
ChatWebSocketService? _webSocketService;
List<Map<String, dynamic>> _messages = [];
String? _userId;
```

Add:
```dart
final ChatService _chatService = ChatService();
final ChatSocketService _socketService = ChatSocketService();
List<MessageModel> _messages = [];
String? _currentUserId;
String? _resolvedChatId;   // set after accessChat if chatId was not provided
```

- [ ] **Step 4: Replace `initState` and `_loadUserId`**

Remove `_loadUserId`, `_initWebSocket`, `_buildMockMessages`, and the entire mock data section.

Replace with:

```dart
@override
void initState() {
  super.initState();
  _init();
}

Future<void> _init() async {
  _currentUserId = AuthManager().currentUser?['_id']?.toString();

  // If we have a chatId already (from ConversationsScreen), use it directly.
  // If we only have a friendId (from player profile), create/find the chat first.
  if (widget.chatId != null) {
    _resolvedChatId = widget.chatId;
  } else if (widget.friendId != null) {
    final chat = await _chatService.accessChat(widget.friendId!);
    _resolvedChatId = chat?.id;
  }

  if (_resolvedChatId != null) {
    _socketService.joinChat(_resolvedChatId!);
    _listenToSocket();
    await _loadMessages();
  }
}

void _listenToSocket() {
  _socketService.messageStream.listen((data) {
    // data is the raw message JSON from the backend
    try {
      final msg = MessageModel.fromJson(data);
      if (msg.chatId == _resolvedChatId) {
        if (!mounted) return;
        setState(() {
          final exists = _messages.any((m) => m.id == msg.id);
          if (!exists) _messages.add(msg);
        });
        _scrollToBottom();
      }
    } catch (_) {}
  });

  _socketService.typingStream.listen((userId) {
    if (userId != _currentUserId) {
      setState(() => _isTyping = true);
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) setState(() => _isTyping = false);
      });
    }
  });
}
```

- [ ] **Step 5: Replace `_loadMessages`**

```dart
Future<void> _loadMessages() async {
  if (_resolvedChatId == null) return;
  setState(() => _isLoading = true);
  final msgs = await _chatService.fetchMessages(_resolvedChatId!);
  if (!mounted) return;
  setState(() {
    _messages = msgs;
    _isLoading = false;
  });
  _scrollToBottom();
  _chatService.markMessagesRead(_resolvedChatId!);
}
```

- [ ] **Step 6: Replace `_sendMessage`**

```dart
Future<void> _sendMessage() async {
  final content = _messageController.text.trim();
  if (content.isEmpty || _resolvedChatId == null) return;
  _messageController.clear();

  // Optimistic update
  final optimistic = MessageModel(
    id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
    sender: MessageSender(
      id: _currentUserId ?? '',
      name: AuthManager().currentUser?['name']?.toString() ?? '',
    ),
    content: content,
    chatId: _resolvedChatId!,
    media: [],
    createdAt: DateTime.now(),
    readBy: [_currentUserId ?? ''],
  );
  setState(() => _messages.add(optimistic));
  _scrollToBottom();

  // Send via REST
  final sent = await _chatService.sendMessage(
    chatId: _resolvedChatId!,
    content: content,
  );

  // Replace optimistic message with real one
  if (sent != null && mounted) {
    setState(() {
      final idx = _messages.indexWhere((m) => m.id == optimistic.id);
      if (idx != -1) _messages[idx] = sent;
    });
  }
}
```

- [ ] **Step 7: Update message bubble rendering**

Find where `_messages` is mapped to widgets. Change `Map<String, dynamic>` accesses to use `MessageModel`:

```dart
// Old:
final isMe = msg['sender_id'] == _userId;
final content = msg['content'] ?? '';
final time = msg['created_at'] ?? '';

// New:
final isMe = msg.isMine(_currentUserId ?? '');
final content = msg.content;
final time = msg.createdAt.toIso8601String();
```

- [ ] **Step 8: Add typing indicator emission**

On the `_messageController` listener (or wherever typing is detected), add:

```dart
_messageController.addListener(() {
  if (_resolvedChatId != null) {
    _socketService.emitTyping(_resolvedChatId!);
  }
});
```

- [ ] **Step 9: Commit**

```bash
git add lib/screens/chat_screen.dart
git commit -m "feat(chat): wire ChatScreen to real API + Socket.IO"
```

---

## Task 6: Wire CreateGroupScreen to backend

**Files:**
- Modify: `lib/screens/create_group_screen.dart`

Currently `_onCreate` generates a fake `group_<timestamp>` ID and navigates. Replace with a real `POST /api/chat/group` call.

- [ ] **Step 1: Add imports**

```dart
import '../services/chat_service.dart';
import '../services/auth_manager.dart';
```

- [ ] **Step 2: Replace `_onCreate`**

```dart
void _onCreate() async {
  final name = _nameCtrl.text.trim();
  if (name.isEmpty) {
    _nameFocus.requestFocus();
    return;
  }
  HapticFeedback.lightImpact();
  setState(() => _isCreating = true);

  final memberIds = widget.selectedContacts
      .map((c) => c['_id']?.toString() ?? c['id']?.toString() ?? '')
      .where((id) => id.isNotEmpty)
      .toList();

  final chat = await ChatService().createGroupChat(
    name: name,
    userIds: memberIds,
  );

  if (!mounted) return;
  setState(() => _isCreating = false);

  if (chat == null) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Failed to create group. Please try again.')),
    );
    return;
  }

  context.go('/chat', extra: {
    'chatId': chat.id,
    'friendName': chat.chatName,
    'friendPhoto': null,
    'isGroup': true,
    'members': widget.selectedContacts,
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/screens/create_group_screen.dart
git commit -m "feat(chat): wire CreateGroupScreen to POST /api/chat/group"
```

---

## Task 7: Delete deprecated service files

**Files:**
- Delete: `lib/services/messages_service.dart`
- Delete: `lib/services/chat_websocket_service.dart`

- [ ] **Step 1: Confirm no remaining imports**

```bash
grep -r "messages_service" lib/
grep -r "chat_websocket_service" lib/
```

Expected: no output. If any file still imports them, update that file first.

- [ ] **Step 2: Delete the files**

```bash
rm lib/services/messages_service.dart
rm lib/services/chat_websocket_service.dart
```

- [ ] **Step 3: Verify app compiles**

```bash
flutter analyze
```

Expected: no errors referencing `MessagesService` or `ChatWebSocketService`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(chat): remove deprecated messages_service and chat_websocket_service"
```

---

## Task 8: Update app_router.dart for new ChatScreen params

**Files:**
- Modify: `lib/router/app_router.dart`

The `ChatScreen` constructor now accepts `chatId` instead of (or alongside) `friendId`. The router's `extra` parsing needs updating.

- [ ] **Step 1: Find the `/chat` route in `app_router.dart`**

```bash
grep -n "chat" lib/router/app_router.dart
```

- [ ] **Step 2: Update the route builder**

Find the GoRoute for `/chat` and update the `extra` destructuring:

```dart
GoRoute(
  path: '/chat',
  builder: (context, state) {
    final extra = state.extra as Map<String, dynamic>? ?? {};
    return ChatScreen(
      chatId: extra['chatId'] as String?,
      friendId: extra['friendId'] as String?,
      friendName: (extra['friendName'] as String?) ?? 'Chat',
      friendPhoto: extra['friendPhoto'] as String?,
      isGroup: (extra['isGroup'] as bool?) ?? false,
      members: List<Map<String, dynamic>>.from(extra['members'] as List? ?? []),
    );
  },
),
```

- [ ] **Step 3: Verify all `context.go('/chat', extra: {...})` calls**

```bash
grep -rn "go('/chat'" lib/
```

Confirm every call passes either `chatId` or `friendId` (or both). Update any that still pass `friendId` named as `other_user_id` or similar.

- [ ] **Step 4: Commit**

```bash
git add lib/router/app_router.dart
git commit -m "feat(chat): update router to handle chatId param in ChatScreen"
```

---

## Task 9: Verify ApiService has put/delete methods

**Files:**
- Modify: `lib/services/api_service.dart` (only if methods are missing)

`ChatService` calls `_api.put(...)` and `_api.delete(...)`. Confirm these exist.

- [ ] **Step 1: Check**

```bash
grep -n "Future.*put\|Future.*delete" lib/services/api_service.dart
```

- [ ] **Step 2: Add if missing**

If `put` is absent, add after the `post` method, following the same `ApiResponse<T>` pattern used by `get` and `post`. Example:

```dart
Future<ApiResponse<T>> put<T>(String path, {dynamic data}) async {
  try {
    final response = await _dio.put<T>(path, data: data);
    return ApiResponse.success(response.data);
  } on DioException catch (e) {
    return ApiResponse.error(_handleDioError(e));
  } catch (e) {
    return ApiResponse.error(e.toString());
  }
}

Future<ApiResponse<T>> delete<T>(String path) async {
  try {
    final response = await _dio.delete<T>(path);
    return ApiResponse.success(response.data);
  } on DioException catch (e) {
    return ApiResponse.error(_handleDioError(e));
  } catch (e) {
    return ApiResponse.error(e.toString());
  }
}
```

- [ ] **Step 3: Commit if changed**

```bash
git add lib/services/api_service.dart
git commit -m "feat(api): add put and delete methods to ApiService"
```

---

## Task 10: Update MessagesScreen

**Files:**
- Modify: `lib/screens/messages_screen.dart`

`MessagesScreen` is a near-duplicate of `ConversationsScreen` with the same broken `MessagesService` calls and the same mock data. Apply the exact same migration.

- [ ] **Step 1: Update imports**

Remove:
```dart
import '../services/messages_service.dart';
```

Add:
```dart
import '../services/chat_service.dart';
import '../models/chat_model.dart';
import '../services/auth_manager.dart';
```

- [ ] **Step 2: Replace service field and state**

Remove:
```dart
final MessagesService _messagesService = MessagesService();
List<Map<String, dynamic>> _conversations = [];
String? _userId;
```

Add:
```dart
final ChatService _chatService = ChatService();
List<ChatModel> _chats = [];
String? _currentUserId;
```

- [ ] **Step 3: Replace `_loadConversations`**

Remove the entire `_loadConversations` method and all mock data constants (`_mockConversations`, `_mockPersonal`, `_mockGroups` or similar).

Replace with:
```dart
Future<void> _loadConversations() async {
  _currentUserId = AuthManager().currentUser?['_id']?.toString();
  final chats = await _chatService.fetchChats();
  if (!mounted) return;
  setState(() {
    _chats = chats;
    _isLoading = false;
  });
}
```

- [ ] **Step 4: Update list builder**

Split `_chats` into personal and group tabs exactly as in `ConversationsScreen` (Task 4 Step 4). Use:
- `chat.displayName(_currentUserId ?? '')` for name
- `chat.displayPhoto(_currentUserId ?? '')` for avatar
- `chat.latestMessage?.content ?? ''` for last message
- `chat.id` for navigation

When tapping a tile, navigate with:
```dart
context.go('/chat', extra: {
  'chatId': chat.id,
  'friendName': chat.displayName(_currentUserId ?? ''),
  'friendPhoto': chat.displayPhoto(_currentUserId ?? ''),
  'isGroup': chat.isGroupChat,
});
```

- [ ] **Step 5: Run analyzer**

```bash
flutter analyze lib/screens/messages_screen.dart
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add lib/screens/messages_screen.dart
git commit -m "feat(chat): wire MessagesScreen to real /api/chat data"
```

---

## Task 11: Wire GroupInfoScreen Leave/Remove to backend

**Files:**
- Modify: `lib/screens/group_info_screen.dart`

The "Leave Group" button currently calls `Navigator.pop` three times with no API call. Wire it to `PUT /api/chat/groupremove`.

- [ ] **Step 1: Add imports**

```dart
import '../services/chat_service.dart';
import '../services/auth_manager.dart';
```

- [ ] **Step 2: Add `_leaveGroup` method to `_GroupInfoScreenState`**

```dart
Future<void> _leaveGroup() async {
  final currentUserId = AuthManager().currentUser?['_id']?.toString();
  if (currentUserId == null) return;

  final api = ChatService();
  // groupremove requires the chatId and userId to remove
  // Reuse the underlying ApiService directly since ChatService exposes put
  final apiService = ApiService();
  await apiService.put<dynamic>('/chat/groupremove', data: {
    'chatId': widget.groupId,
    'userId': currentUserId,
  });
}
```

Add the import for ApiService:
```dart
import '../services/api_service.dart';
```

- [ ] **Step 3: Update `_showLeaveSheet` → `onConfirm` callback**

Find the `onConfirm` lambda inside `_showLeaveSheet` and replace:
```dart
onConfirm: () {
  Navigator.pop(context); // close sheet
  Navigator.pop(context); // close info screen
  Navigator.pop(context); // close chat screen
},
```

With:
```dart
onConfirm: () async {
  await _leaveGroup();
  if (!mounted) return;
  Navigator.pop(context); // close sheet
  Navigator.pop(context); // close info screen
  Navigator.pop(context); // close chat screen
},
```

- [ ] **Step 4: Commit**

```bash
git add lib/screens/group_info_screen.dart
git commit -m "feat(chat): wire GroupInfoScreen leave group to PUT /api/chat/groupremove"
```

---

## Story Endpoints Note

The backend has `/api/story/*` endpoints (upload, feed, view, edit, delete), but the app already works against `/api/reels/*` which is also in the backend. No story migration is required — the `/api/story` routes can remain unused unless a separate Stories UI is added in future.

---

## Self-Review Checklist

- [x] **Auth**: `ApiService` injects `Authorization: Bearer` automatically — no manual header handling needed in `ChatService`.
- [x] **Chat creation flow**: Opening chat from player profile (`friendId` only) → `accessChat` → get `chatId` → load messages. Opening from conversations list (`chatId` known) → skip `accessChat`, load directly.
- [x] **Socket.IO event names**: Backend emits `"message received"` (with space) and listens for `"join chat"`, `"typing"`, `"stop typing"` — these are the Socket.IO standard chat event names used by this backend pattern.
- [x] **No `/messages/*` calls remain** after Tasks 4–7.
- [x] **No raw WebSocket** remains after Task 3 + 7.
- [x] **`ChatModel.displayName`** handles both 1-on-1 and group chats.
- [x] **Optimistic send** in `ChatScreen` prevents UI lag on message send.
- [x] **Router updated** so both `chatId` and `friendId` entry points work.
