import '../models/chat_model.dart';
import '../models/media_item_model.dart';
import '../models/message_model.dart';
import 'api_service.dart';

class ChatService {
  static final ChatService _instance = ChatService._internal();
  factory ChatService() => _instance;
  ChatService._internal();

  final ApiService _api = ApiService();

  // ─── Chat access ──────────────────────────────────────────────────────────

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

  Future<List<ChatModel>> fetchChats() async {
    final response = await _api.get<dynamic>('/chat');
    if (!response.isSuccess || response.data == null) return [];

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

  // ─── Group management ─────────────────────────────────────────────────────

  Future<ChatModel?> createGroupChat({
    required String name,
    required List<String> userIds,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/chat/group',
      data: {'name': name, 'users': userIds},
    );
    if (response.isSuccess && response.data != null) {
      return ChatModel.fromJson(response.data!);
    }
    return null;
  }

  /// Update group name, description, or image URL.
  Future<ChatModel?> updateGroup({
    required String chatId,
    String? chatName,
    String? description,
    String? groupImage,
  }) async {
    final data = <String, dynamic>{'chatId': chatId};
    if (chatName != null) data['chatName'] = chatName;
    if (description != null) data['description'] = description;
    if (groupImage != null) data['groupImage'] = groupImage;

    final response = await _api.put<Map<String, dynamic>>(
      '/chat/group/update',
      data: data,
    );
    if (response.isSuccess && response.data != null) {
      return ChatModel.fromJson(response.data!);
    }
    return null;
  }

  /// Accept or reject a pending group invite. [status] is "accepted" or "rejected".
  Future<ChatModel?> respondToInvite(String chatId, String status) async {
    final response = await _api.post<dynamic>(
      '/chat/respond-invite',
      data: {'chatId': chatId, 'status': status},
    );
    if (response.isSuccess && response.data is Map) {
      // rejected returns { message: "Invite rejected" }, not a full chat
      if (response.data['message'] != null) return null;
      return ChatModel.fromJson(response.data as Map<String, dynamic>);
    }
    return null;
  }

  /// Add [userId] to group [chatId] (sends a pending invite).
  Future<ChatModel?> addToGroup(String chatId, String userId) async {
    final response = await _api.put<Map<String, dynamic>>(
      '/chat/groupadd',
      data: {'chatId': chatId, 'userId': userId, 'onModel': 'User'},
    );
    if (response.isSuccess && response.data != null) {
      return ChatModel.fromJson(response.data!);
    }
    return null;
  }

  /// Remove [userId] from group [chatId]. Pass current user's ID to leave.
  Future<bool> removeFromGroup(String chatId, String userId) async {
    final response = await _api.put<dynamic>(
      '/chat/groupremove',
      data: {'chatId': chatId, 'userId': userId},
    );
    return response.isSuccess;
  }

  /// Leave a group chat (removes the current user).
  Future<bool> leaveGroup(String chatId) async {
    final response = await _api.put<dynamic>(
      '/chat/groupremove',
      data: {'chatId': chatId},
    );
    return response.isSuccess;
  }

  /// Promote [userId] to admin in group [chatId].
  Future<ChatModel?> makeAdmin(String chatId, String userId) async {
    final response = await _api.put<Map<String, dynamic>>(
      '/chat/groupadmin',
      data: {'chatId': chatId, 'userId': userId, 'onModel': 'User'},
    );
    if (response.isSuccess && response.data != null) {
      return ChatModel.fromJson(response.data!);
    }
    return null;
  }

  /// Dismiss [userId] as admin in group [chatId].
  Future<ChatModel?> dismissAdmin(String chatId, String userId) async {
    final response = await _api.put<Map<String, dynamic>>(
      '/chat/dismissadmin',
      data: {'chatId': chatId, 'userId': userId, 'onModel': 'User'},
    );
    if (response.isSuccess && response.data != null) {
      return ChatModel.fromJson(response.data!);
    }
    return null;
  }

  /// Add existing groups to a community.
  Future<bool> addGroupsToCommunity(
      String communityId, List<String> groupIds) async {
    final response = await _api.put<dynamic>(
      '/chat/community/add-groups',
      data: {'communityId': communityId, 'groupIds': groupIds},
    );
    return response.isSuccess;
  }

  /// Pin or unpin [chatId].
  Future<void> togglePin(String chatId) async {
    await _api.put<dynamic>('/chat/pin', data: {'chatId': chatId});
  }

  /// Delete [chatId].
  Future<void> deleteChat(String chatId) async {
    await _api.delete<dynamic>('/chat/$chatId');
  }

  // ─── Messages ─────────────────────────────────────────────────────────────

  Future<List<MessageModel>> fetchMessages(String chatId) async {
    final response = await _api.get<dynamic>('/chat/message/$chatId');
    if (!response.isSuccess || response.data == null) return [];
    final raw = response.data is List ? response.data as List : <dynamic>[];
    return raw
        .map((m) => MessageModel.fromJson(m as Map<String, dynamic>))
        .toList();
  }

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

  /// Forward a single message to multiple chats or users.
  Future<List<MessageModel>> forwardMessage({
    required String messageId,
    List<String> chatIds = const [],
    List<String> userIds = const [],
  }) async {
    final response = await _api.post<dynamic>(
      '/chat/message/forward',
      data: {
        'messageId': messageId,
        'chatIds': chatIds,
        'userIds': userIds,
      },
    );
    if (!response.isSuccess || response.data == null) return [];
    final raw = response.data is List ? response.data as List : <dynamic>[];
    return raw
        .map((m) => MessageModel.fromJson(m as Map<String, dynamic>))
        .toList();
  }

  /// Broadcast a new message to multiple chats or users.
  Future<List<MessageModel>> broadcastMessage({
    required String content,
    List<Map<String, dynamic>> media = const [],
    List<String> chatIds = const [],
    List<String> userIds = const [],
  }) async {
    final response = await _api.post<dynamic>(
      '/chat/message/broadcast',
      data: {
        'content': content,
        'media': media,
        'chatIds': chatIds,
        'userIds': userIds,
      },
    );
    if (!response.isSuccess || response.data == null) return [];
    final raw = response.data is List ? response.data as List : <dynamic>[];
    return raw
        .map((m) => MessageModel.fromJson(m as Map<String, dynamic>))
        .toList();
  }

  /// Delete messages. [deleteType] is "me" or "everyone".
  Future<bool> deleteMessages({
    required List<String> messageIds,
    required String chatId,
    required String deleteType,
  }) async {
    final response = await _api.post<dynamic>(
      '/chat/message/delete',
      data: {
        'messageIds': messageIds,
        'chatId': chatId,
        'deleteType': deleteType,
      },
    );
    return response.isSuccess;
  }

  /// Clear all messages in [chatId] for the current user.
  Future<bool> clearChat(String chatId) async {
    final response = await _api.post<dynamic>(
      '/chat/message/clear',
      data: {'chatId': chatId},
    );
    return response.isSuccess;
  }

  /// Get all media shared in [chatId].
  Future<List<MediaItem>> getChatMedia(String chatId) async {
    final response = await _api.get<dynamic>('/chat/message/$chatId/media');
    if (!response.isSuccess || response.data == null) return [];
    final raw = response.data is List ? response.data as List : <dynamic>[];
    return raw
        .map((m) => MediaItem.fromJson(m as Map<String, dynamic>))
        .toList();
  }
}
