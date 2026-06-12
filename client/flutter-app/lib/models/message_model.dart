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
      profilePicture:
          u['profilePicture']?.toString() ?? u['profileImage']?.toString(),
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
  final bool isForwarded;

  const MessageModel({
    required this.id,
    required this.sender,
    required this.content,
    required this.chatId,
    required this.media,
    required this.createdAt,
    required this.readBy,
    this.isForwarded = false,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    final chat = json['chat'];
    final chatId = chat is Map
        ? (chat['_id'] ?? chat['id'] ?? '').toString()
        : (chat ?? '').toString();

    final mediaList = (json['media'] as List? ?? [])
        .whereType<Map<String, dynamic>>()
        .toList();

    final readList = (json['readBy'] as List? ?? []).map((r) {
      if (r is Map) {
        final userField = r['user'];
        if (userField is Map)
          return (userField['_id'] ?? userField['id'] ?? '').toString();
        return (userField ?? r['_id'] ?? '').toString();
      }
      return r.toString();
    }).toList();

    return MessageModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      sender:
          MessageSender.fromJson(json['sender'] as Map<String, dynamic>? ?? {}),
      content: (json['content'] ?? '').toString(),
      chatId: chatId,
      media: mediaList,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
      readBy: readList,
      isForwarded: json['isForwarded'] == true,
    );
  }

  bool isMine(String myUserId) => sender.id == myUserId;
}
