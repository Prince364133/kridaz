import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/api_config.dart';

class ChatSocketService {
  static final ChatSocketService _instance = ChatSocketService._internal();
  factory ChatSocketService() => _instance;
  ChatSocketService._internal();

  io.Socket? _socket;
  String? _userId;
  bool get isConnected => _socket?.connected ?? false;

  final _messageController = StreamController<Map<String, dynamic>>.broadcast();
  final _typingController = StreamController<String>.broadcast();
  final _messageDeletedController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _chatUpdatedController =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get messageStream => _messageController.stream;
  Stream<String> get typingStream => _typingController.stream;

  /// Fires when the server confirms a message was deleted.
  /// Payload: { messageIds: [...], chatId: "...", deleteType: "me"|"everyone" }
  Stream<Map<String, dynamic>> get messageDeletedStream =>
      _messageDeletedController.stream;

  /// Fires when group/chat metadata changes (name, image, members, admin status).
  /// Payload: full updated chat object.
  Stream<Map<String, dynamic>> get chatUpdatedStream =>
      _chatUpdatedController.stream;

  void connect(String token, {String? userId}) {
    if (userId != null && userId.isNotEmpty) _userId = userId;

    // Already connected — just (re)join the personal room.
    if (_socket?.connected == true) {
      _emitSetup();
      return;
    }

    _socket = io.io(
      ApiConfig.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setExtraHeaders({'Authorization': 'Bearer $token'})
          .setAuth({'token': token})
          .disableAutoConnect()
          .build(),
    );

    _socket!.connect();

    // The server places each socket in a room named after the user id only
    // after it receives a `setup` event. Without this, `io.to(uid).emit(...)`
    // never reaches us and incoming messages are silently dropped.
    _socket!.onConnect((_) => _emitSetup());
    _socket!.onReconnect((_) => _emitSetup());
    _socket!.onDisconnect((_) {});

    // The backend emits the (intentionally typo'd) event name 'message
    // recieved'. Listen for both spellings so we're resilient either way.
    void onMessage(dynamic data) {
      if (data is Map) {
        _messageController.add(Map<String, dynamic>.from(data));
      }
    }

    _socket!.on('message recieved', onMessage);
    _socket!.on('message received', onMessage);

    _socket!.on('typing', (data) {
      if (data is String) _typingController.add(data);
      if (data is Map) _typingController.add((data['userId'] ?? '').toString());
    });

    // Server emits this after deleteMessages or clearChat
    _socket!.on('message deleted', (data) {
      if (data is Map) {
        _messageDeletedController.add(Map<String, dynamic>.from(data));
      }
    });

    // Server emits this after updateGroup, addToGroup, makeAdmin, dismissAdmin, respondToInvite
    _socket!.on('chat updated', (data) {
      if (data is Map) {
        _chatUpdatedController.add(Map<String, dynamic>.from(data));
      }
    });
  }

  /// Emits `setup` so the server adds this socket to the user's personal room.
  void _emitSetup() {
    final uid = _userId;
    if (uid != null && uid.isNotEmpty) {
      _socket?.emit('setup', {'id': uid});
    }
  }

  /// Late-bind the user id (e.g. after session restore) and (re)join the room.
  void identify(String userId) {
    if (userId.isEmpty) return;
    _userId = userId;
    _emitSetup();
  }

  void joinChat(String chatId) => _socket?.emit('join chat', chatId);

  void emitTyping(String chatId) => _socket?.emit('typing', chatId);

  void emitStopTyping(String chatId) => _socket?.emit('stop typing', chatId);

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }

  void dispose() {
    disconnect();
    _messageController.close();
    _typingController.close();
    _messageDeletedController.close();
    _chatUpdatedController.close();
  }
}
