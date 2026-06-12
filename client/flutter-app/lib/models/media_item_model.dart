class MediaItem {
  final String url;
  final String type; // "image" | "video" | "file"
  final DateTime createdAt;

  const MediaItem({
    required this.url,
    required this.type,
    required this.createdAt,
  });

  factory MediaItem.fromJson(Map<String, dynamic> json) => MediaItem(
        url: (json['url'] ?? '').toString(),
        type: (json['type'] ?? 'image').toString(),
        createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
            DateTime.now(),
      );

  bool get isImage => type == 'image';
  bool get isVideo => type == 'video';
  bool get isFile => type == 'file';
}
