class StoryAuthor {
  final String id;
  final String name;
  final String? username;
  final String? profilePicture;

  const StoryAuthor({
    required this.id,
    required this.name,
    this.username,
    this.profilePicture,
  });

  factory StoryAuthor.fromJson(Map<String, dynamic> json) => StoryAuthor(
        id: (json['_id'] ?? json['id'] ?? '').toString(),
        name: (json['name'] ?? '').toString(),
        username: json['username']?.toString(),
        profilePicture: json['profilePicture']?.toString(),
      );
}

class StoryModel {
  final String id;
  final StoryAuthor? author;
  final String? mediaUrl;
  final String? hlsUrl;
  final String? placeholder;
  final String content;
  final String mediaType; // 'image' | 'video' | 'text'
  final int durationDays;
  final List<String> viewerIds;
  final DateTime expiresAt;
  final String status; // 'ready' | 'pending' | 'failed'
  final DateTime createdAt;

  const StoryModel({
    required this.id,
    this.author,
    this.mediaUrl,
    this.hlsUrl,
    this.placeholder,
    required this.content,
    required this.mediaType,
    required this.durationDays,
    required this.viewerIds,
    required this.expiresAt,
    required this.status,
    required this.createdAt,
  });

  bool get isReady => status == 'ready';
  bool hasBeenViewedBy(String userId) => viewerIds.contains(userId);

  factory StoryModel.fromJson(Map<String, dynamic> json) {
    final viewers = (json['viewers'] as List? ?? []).map((v) {
      if (v is Map) return (v['_id'] ?? v['id'] ?? '').toString();
      return v.toString();
    }).toList();

    StoryAuthor? author;
    if (json['userId'] is Map) {
      author = StoryAuthor.fromJson(json['userId'] as Map<String, dynamic>);
    }

    return StoryModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      author: author,
      mediaUrl: json['mediaUrl']?.toString(),
      hlsUrl: json['hlsUrl']?.toString(),
      placeholder: json['placeholder']?.toString(),
      content: (json['content'] ?? '').toString(),
      mediaType: (json['mediaType'] ?? 'image').toString(),
      durationDays: (json['durationDays'] as num?)?.toInt() ?? 1,
      viewerIds: viewers,
      expiresAt: DateTime.tryParse(json['expiresAt']?.toString() ?? '') ??
          DateTime.now(),
      status: (json['status'] ?? 'ready').toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}

/// One entry in the feed: an author + all their active stories.
class StoryGroup {
  final StoryAuthor author;
  final List<StoryModel> stories;

  const StoryGroup({required this.author, required this.stories});

  factory StoryGroup.fromJson(Map<String, dynamic> json) {
    final author = StoryAuthor.fromJson(json['author'] as Map<String, dynamic>);
    final stories = (json['stories'] as List? ?? [])
        .map((s) => StoryModel.fromJson(s as Map<String, dynamic>))
        .toList();
    return StoryGroup(author: author, stories: stories);
  }

  /// True if all stories in this group have been viewed by [userId].
  bool allViewed(String userId) =>
      stories.every((s) => s.hasBeenViewedBy(userId));
}
