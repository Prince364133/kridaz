class ChatUser {
  final String id;
  final String name;
  final String? profilePicture;
  final String? email;
  final bool isAdmin;
  final bool isPending;

  const ChatUser({
    required this.id,
    required this.name,
    this.profilePicture,
    this.email,
    this.isAdmin = false,
    this.isPending = false,
  });

  factory ChatUser.fromJson(Map<String, dynamic> json) {
    // Backend shape: { user: { _id, name, profilePicture }, onModel, isAdmin, isPending }
    final u = json['user'] is Map ? json['user'] as Map<String, dynamic> : json;
    return ChatUser(
      id: (u['_id'] ?? u['id'] ?? '').toString(),
      name: (u['name'] ?? '').toString(),
      profilePicture:
          u['profilePicture']?.toString() ?? u['profileImage']?.toString(),
      email: u['email']?.toString(),
      isAdmin: json['isAdmin'] == true,
      isPending: json['isPending'] == true,
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
        id: (json['_id'] ?? json['id'] ?? '').toString(),
        content: (json['content'] ?? '').toString(),
        senderName: json['sender'] is Map
            ? (json['sender']['user'] is Map
                ? json['sender']['user']['name']?.toString()
                : null)
            : null,
        createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
            DateTime.now(),
      );
}

class ChatModel {
  final String id;
  final String chatName;
  final bool isGroupChat;
  final bool isCommunity;
  final bool isAnnouncementGroup;
  final bool adminOnlyMessages;
  final String? description;
  final String? groupImage;
  final String? parentCommunityId;
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
    this.isAnnouncementGroup = false,
    this.adminOnlyMessages = false,
    this.description,
    this.groupImage,
    this.parentCommunityId,
    required this.users,
    required this.groupAdmins,
    this.latestMessage,
    required this.pinnedBy,
    required this.updatedAt,
  });

  factory ChatModel.fromJson(Map<String, dynamic> json) {
    // participants array contains { user, onModel, isAdmin, isPending }
    final participantsList =
        json['participants'] as List? ?? json['users'] as List? ?? [];
    final usersList = participantsList
        .map((u) => ChatUser.fromJson(u as Map<String, dynamic>))
        .toList();

    // groupAdmins: either a separate list or derived from participants
    final adminsList = (json['groupAdmins'] as List? ?? [])
        .map((a) => ChatUser.fromJson(a as Map<String, dynamic>))
        .toList();

    final pinned =
        (json['pinnedBy'] as List? ?? []).map((p) => p.toString()).toList();

    return ChatModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      chatName: (json['chatName'] ?? '').toString(),
      isGroupChat: json['isGroupChat'] == true,
      isCommunity: json['isCommunity'] == true,
      isAnnouncementGroup: json['isAnnouncementGroup'] == true,
      adminOnlyMessages: json['adminOnlyMessages'] == true,
      description: json['description']?.toString(),
      groupImage: json['groupImage']?.toString(),
      parentCommunityId: json['parentCommunityId']?.toString(),
      users: usersList,
      groupAdmins: adminsList,
      latestMessage: json['latestMessage'] is Map
          ? LatestMessage.fromJson(
              json['latestMessage'] as Map<String, dynamic>)
          : null,
      pinnedBy: pinned,
      updatedAt: DateTime.tryParse(json['updatedAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }

  /// Returns the display name for a 1-on-1 chat given the current user's ID.
  String displayName(String currentUserId) {
    if (isGroupChat) return chatName;
    final other = users.firstWhere(
      (u) => u.id != currentUserId,
      orElse: () => users.isNotEmpty
          ? users.first
          : const ChatUser(id: '', name: 'Unknown'),
    );
    return other.name;
  }

  /// Returns the other user's avatar URL for a 1-on-1 chat.
  String? displayPhoto(String currentUserId) {
    if (isGroupChat) return groupImage;
    final other = users.firstWhere(
      (u) => u.id != currentUserId,
      orElse: () =>
          users.isNotEmpty ? users.first : const ChatUser(id: '', name: ''),
    );
    return other.profilePicture;
  }

  /// Whether the current user is an admin of this chat.
  bool isCurrentUserAdmin(String currentUserId) {
    return users.any((u) => u.id == currentUserId && u.isAdmin);
  }

  /// Active (non-pending) participants.
  List<ChatUser> get activeUsers => users.where((u) => !u.isPending).toList();

  /// Pending invite participants.
  List<ChatUser> get pendingUsers => users.where((u) => u.isPending).toList();
}
