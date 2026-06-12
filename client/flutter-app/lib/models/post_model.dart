class PostAuthor {
  final String id;
  final String name;
  final String? username;
  final String? profilePicture;

  const PostAuthor({
    required this.id,
    required this.name,
    this.username,
    this.profilePicture,
  });

  factory PostAuthor.fromJson(Map<String, dynamic> json) => PostAuthor(
        id: (json['_id'] ?? json['id'] ?? '').toString(),
        name: (json['name'] ?? 'Player').toString(),
        username: json['username']?.toString(),
        profilePicture: json['profilePicture']?.toString(),
      );
}

class PostComment {
  final String id;
  final String text;
  final PostAuthor? user;
  final DateTime createdAt;

  const PostComment({
    required this.id,
    required this.text,
    this.user,
    required this.createdAt,
  });

  factory PostComment.fromJson(Map<String, dynamic> json) {
    final rawUser = json['userId'] ?? json['user'];
    PostAuthor? u;
    if (rawUser is Map<String, dynamic>) {
      u = PostAuthor.fromJson(rawUser);
    }
    return PostComment(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      text: (json['text'] ?? '').toString(),
      user: u,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}

class PostModel {
  final String id;
  final PostAuthor? author;
  final String? title;
  final String content;
  final String? mediaUrl;
  final String? thumbnailUrl;
  final String mediaType; // 'image' | 'video' | 'text'
  final List<String> likeUserIds;
  final List<PostComment> comments;
  final String status; // 'ready' | 'pending' | 'processing'
  final int processingProgress;
  final DateTime createdAt;

  const PostModel({
    required this.id,
    this.author,
    this.title,
    required this.content,
    this.mediaUrl,
    this.thumbnailUrl,
    required this.mediaType,
    required this.likeUserIds,
    required this.comments,
    required this.status,
    required this.processingProgress,
    required this.createdAt,
  });

  bool isLikedBy(String userId) =>
      userId.isNotEmpty && likeUserIds.contains(userId);

  int get likeCount => likeUserIds.length;
  int get commentCount => comments.length;
  bool get isMediaReady => status == 'ready' || status.isEmpty;

  PostModel copyWith({
    List<String>? likeUserIds,
    List<PostComment>? comments,
    String? status,
    int? processingProgress,
    String? mediaUrl,
    String? thumbnailUrl,
  }) =>
      PostModel(
        id: id,
        author: author,
        title: title,
        content: content,
        mediaUrl: mediaUrl ?? this.mediaUrl,
        thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
        mediaType: mediaType,
        likeUserIds: likeUserIds ?? this.likeUserIds,
        comments: comments ?? this.comments,
        status: status ?? this.status,
        processingProgress: processingProgress ?? this.processingProgress,
        createdAt: createdAt,
      );

  factory PostModel.fromJson(Map<String, dynamic> json) {
    PostAuthor? author;
    final rawAuthor = json['adminId'] ?? json['author'] ?? json['userId'];
    if (rawAuthor is Map<String, dynamic>) {
      author = PostAuthor.fromJson(rawAuthor);
    }

    final mediaUrls = json['mediaUrls'];
    String? mediaUrl = json['mediaUrl']?.toString() ??
        json['image']?.toString() ??
        json['imageUrl']?.toString() ??
        json['videoUrl']?.toString();
    if (mediaUrl == null && mediaUrls is List && mediaUrls.isNotEmpty) {
      mediaUrl = mediaUrls.first?.toString();
    }

    final mediaType =
        (json['mediaType'] ?? (mediaUrl == null ? 'text' : 'image')).toString();

    final rawLikes = json['likes'];
    final likeIds = <String>[];
    if (rawLikes is List) {
      for (final l in rawLikes) {
        if (l is Map) {
          final id = (l['_id'] ?? l['id'] ?? '').toString();
          if (id.isNotEmpty) likeIds.add(id);
        } else if (l != null) {
          likeIds.add(l.toString());
        }
      }
    }

    final rawComments = json['comments'];
    final comments = <PostComment>[];
    if (rawComments is List) {
      for (final c in rawComments) {
        if (c is Map<String, dynamic>) {
          try {
            comments.add(PostComment.fromJson(c));
          } catch (_) {}
        }
      }
    }

    return PostModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      author: author,
      title: json['title']?.toString(),
      content: (json['content'] ?? '').toString(),
      mediaUrl: mediaUrl,
      thumbnailUrl:
          json['thumbnailUrl']?.toString() ?? json['image']?.toString(),
      mediaType: mediaType,
      likeUserIds: likeIds,
      comments: comments,
      status: (json['status'] ?? 'ready').toString(),
      processingProgress: (json['processingProgress'] as num?)?.toInt() ?? 0,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}
