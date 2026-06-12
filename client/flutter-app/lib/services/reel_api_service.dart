import 'dart:io';
import 'package:dio/dio.dart';
import 'api_service.dart';
import '../config/api_config.dart';

// â”€â”€â”€ Models â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class ReelCreator {
  final String id;
  final String name;
  final String? username;
  final String? profilePicture;

  const ReelCreator({
    required this.id,
    required this.name,
    this.username,
    this.profilePicture,
  });

  factory ReelCreator.fromJson(Map<String, dynamic> json) => ReelCreator(
        id: (json['_id'] ?? json['id'] ?? '').toString(),
        name: json['name'] ?? '',
        username: json['username'],
        profilePicture: json['profilePicture'],
      );
}

class ReelStats {
  final int views;
  final int likes;
  final int shares;
  final int comments;
  final double avgWatchTime;
  final int completionCount;

  const ReelStats({
    required this.views,
    required this.likes,
    required this.shares,
    required this.comments,
    required this.avgWatchTime,
    required this.completionCount,
  });

  factory ReelStats.fromJson(Map<String, dynamic> json) => ReelStats(
        views: (json['views'] as num?)?.toInt() ?? 0,
        likes: (json['likes'] as num?)?.toInt() ?? 0,
        shares: (json['shares'] as num?)?.toInt() ?? 0,
        comments: (json['comments'] as num?)?.toInt() ?? 0,
        avgWatchTime: (json['avgWatchTime'] as num?)?.toDouble() ?? 0,
        completionCount: (json['completionCount'] as num?)?.toInt() ?? 0,
      );

  ReelStats copyWith({int? likes, int? shares, int? comments}) => ReelStats(
        views: views,
        likes: likes ?? this.likes,
        shares: shares ?? this.shares,
        comments: comments ?? this.comments,
        avgWatchTime: avgWatchTime,
        completionCount: completionCount,
      );
}

class Reel {
  final String id;
  final ReelCreator creator;
  final String? caption;
  final List<String> hashtags;
  final String? rawVideoUrl;
  final String? hlsUrl;
  final String? thumbnailUrl;
  final double aspectRatio;
  final int? duration;
  // pending | processing | ready | failed
  final String status;
  final int processingProgress;
  final ReelStats stats;
  final bool isPrivate;
  final DateTime createdAt;

  const Reel({
    required this.id,
    required this.creator,
    this.caption,
    required this.hashtags,
    this.rawVideoUrl,
    this.hlsUrl,
    this.thumbnailUrl,
    required this.aspectRatio,
    this.duration,
    required this.status,
    required this.processingProgress,
    required this.stats,
    required this.isPrivate,
    required this.createdAt,
  });

  bool get isReady =>
      status == 'ready' ||
      status == 'published' ||
      status == 'active' ||
      status == 'completed';
  bool get isPending => status == 'pending' || status == 'processing';
  bool get isFailed => status == 'failed' || status == 'error';

  String? get playableUrl => hlsUrl ?? rawVideoUrl;

  factory Reel.fromJson(Map<String, dynamic> json) {
    final creatorRaw = json['creatorId'];
    final creator = creatorRaw is Map<String, dynamic>
        ? ReelCreator.fromJson(creatorRaw)
        : ReelCreator(id: creatorRaw?.toString() ?? '', name: 'Unknown');

    return Reel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      creator: creator,
      caption: json['caption'],
      hashtags: List<String>.from(json['hashtags'] ?? []),
      rawVideoUrl: json['rawVideoUrl'],
      hlsUrl: json['hlsUrl'],
      thumbnailUrl: json['thumbnailUrl'],
      aspectRatio: (json['aspectRatio'] as num?)?.toDouble() ?? 0.5625,
      duration: (json['duration'] as num?)?.toInt(),
      status: json['status'] ?? 'pending',
      processingProgress: (json['processingProgress'] as num?)?.toInt() ?? 0,
      stats: json['stats'] != null
          ? ReelStats.fromJson(json['stats'] as Map<String, dynamic>)
          : const ReelStats(
              views: 0,
              likes: 0,
              shares: 0,
              comments: 0,
              avgWatchTime: 0,
              completionCount: 0,
            ),
      isPrivate: json['isPrivate'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Reel copyWith({ReelStats? stats}) => Reel(
        id: id,
        creator: creator,
        caption: caption,
        hashtags: hashtags,
        rawVideoUrl: rawVideoUrl,
        hlsUrl: hlsUrl,
        thumbnailUrl: thumbnailUrl,
        aspectRatio: aspectRatio,
        duration: duration,
        status: status,
        processingProgress: processingProgress,
        stats: stats ?? this.stats,
        isPrivate: isPrivate,
        createdAt: createdAt,
      );
}

class ReelComment {
  final String id;
  final String reelId;
  final String userId;
  final String text;
  final String? parentId;
  final DateTime createdAt;

  const ReelComment({
    required this.id,
    required this.reelId,
    required this.userId,
    required this.text,
    this.parentId,
    required this.createdAt,
  });

  factory ReelComment.fromJson(Map<String, dynamic> json) => ReelComment(
        id: (json['_id'] ?? json['id'] ?? '').toString(),
        reelId: json['reelId']?.toString() ?? '',
        userId: json['userId']?.toString() ?? '',
        text: json['text'] ?? '',
        parentId: json['parentId']?.toString(),
        createdAt: json['createdAt'] != null
            ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
            : DateTime.now(),
      );
}

class ReelFeedPage {
  final List<Reel> reels;
  final String? nextCursor;

  const ReelFeedPage({required this.reels, this.nextCursor});
}

class ReelUploadUrlResult {
  final String reelId;
  final String uploadUrl;
  final String key;

  const ReelUploadUrlResult({
    required this.reelId,
    required this.uploadUrl,
    required this.key,
  });
}

// â”€â”€â”€ Service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class ReelApiService {
  static final ReelApiService _instance = ReelApiService._internal();
  factory ReelApiService() => _instance;
  ReelApiService._internal();

  final ApiService _api = ApiService();

  // Dedicated Dio for R2 presigned URL uploads (no auth headers).
  final Dio _r2Dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 30),
    sendTimeout: const Duration(minutes: 5),
    receiveTimeout: const Duration(seconds: 30),
  ));

  // Minimal Dio for fire-and-forget telemetry (no logger, short timeouts).
  // Heartbeats and view pings must never block the UI or spam the log.
  final Dio _telemetryDio = Dio(BaseOptions(
    baseUrl: ApiConfig.apiUrl,
    connectTimeout: const Duration(seconds: 5),
    sendTimeout: const Duration(seconds: 5),
    receiveTimeout: const Duration(seconds: 5),
    headers: {'Content-Type': 'application/json'},
  ));

  // â”€â”€ Feed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  Future<ApiResponse<ReelFeedPage>> getReelsFeed({
    String? cursor,
    int limit = 10,
  }) async {
    final response = await _api.get<Map<String, dynamic>>(
      '/reels/feed',
      queryParameters: {
        'limit': limit,
        if (cursor != null) 'cursor': cursor,
      },
    );
    return _parseFeedPage(response);
  }

  Future<ApiResponse<ReelFeedPage>> getRecommendedReels({
    String? cursor,
  }) async {
    final response = await _api.get<Map<String, dynamic>>(
      '/reels/recommended',
      queryParameters: {
        if (cursor != null) 'cursor': cursor,
      },
    );
    return _parseFeedPage(response);
  }

  ApiResponse<ReelFeedPage> _parseFeedPage(
    ApiResponse<Map<String, dynamic>> response,
  ) {
    if (!response.isSuccess || response.data == null) {
      return ApiResponse.error(response.error ?? 'Failed to load reels');
    }
    final data = response.data!;
    // Backend may use different list key
    final rawReels = (data['reels'] ?? data['data'] ?? data['result'] ?? [])
        as List<dynamic>;
    final parsed =
        rawReels.whereType<Map<String, dynamic>>().map(Reel.fromJson).toList();
    return ApiResponse.success(ReelFeedPage(
      reels: parsed,
      nextCursor: data['nextCursor']?.toString(),
    ));
  }

  // â”€â”€ Upload flow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /// Step 1: get a pre-signed R2 upload URL from the server.
  Future<ApiResponse<ReelUploadUrlResult>> getUploadUrl({
    required String contentType,
    String? fileName,
  }) async {
    final response = await _api.get<Map<String, dynamic>>(
      '/reels/upload-url',
      queryParameters: {
        'contentType': contentType,
        if (fileName != null) 'fileName': fileName,
      },
    );
    if (!response.isSuccess || response.data == null) {
      return ApiResponse.error(response.error ?? 'Failed to get upload URL');
    }
    final data = response.data!;
    return ApiResponse.success(ReelUploadUrlResult(
      reelId: data['reelId'].toString(),
      uploadUrl: data['uploadUrl'].toString(),
      key: data['key'].toString(),
    ));
  }

  /// Step 2: PUT the video file directly to R2 using the pre-signed URL.
  Future<void> uploadToR2(
    String uploadUrl,
    File videoFile,
    String contentType, {
    void Function(double progress)? onProgress,
  }) async {
    final fileSize = await videoFile.length();

    await _r2Dio.put(
      uploadUrl,
      data: videoFile.openRead(),
      options: Options(headers: {
        'Content-Type': contentType,
        'Content-Length': fileSize,
      }),
      onSendProgress: (sent, total) {
        if (onProgress != null && total > 0) {
          onProgress(sent / total);
        }
      },
    );
  }

  /// Step 3: notify the server that the upload is complete, triggering transcoding.
  Future<ApiResponse<Reel>> confirmUpload({
    required String reelId,
    required String key,
    String? caption,
    List<String>? hashtags,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/reels/confirm-upload',
      data: {
        'reelId': reelId,
        'key': key,
        if (caption != null && caption.isNotEmpty) 'caption': caption,
        if (hashtags != null && hashtags.isNotEmpty) 'hashtags': hashtags,
      },
    );
    if (!response.isSuccess || response.data == null) {
      return ApiResponse.error(response.error ?? 'Failed to confirm upload');
    }
    final reelJson = response.data!['reel'] as Map<String, dynamic>?;
    if (reelJson == null) {
      return ApiResponse.error('Unexpected response from server');
    }
    return ApiResponse.success(Reel.fromJson(reelJson));
  }

  // â”€â”€ Interactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /// type: 'view' | 'like' | 'share' | 'complete'
  Future<ApiResponse<void>> interact(
    String reelId,
    String type, {
    int? watchTime,
    double? completionRate,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/reels/$reelId/interact',
      data: {
        'type': type,
        if (watchTime != null) 'watchTime': watchTime,
        if (completionRate != null) 'completionRate': completionRate,
      },
    );
    if (!response.isSuccess) {
      return ApiResponse.error(response.error ?? 'Interaction failed');
    }
    return ApiResponse.success(null);
  }

  Future<ApiResponse<ReelComment>> addComment(
    String reelId,
    String text, {
    String? parentId,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/reels/$reelId/comment',
      data: {
        'text': text,
        if (parentId != null) 'parentId': parentId,
      },
    );
    if (!response.isSuccess || response.data == null) {
      return ApiResponse.error(response.error ?? 'Failed to post comment');
    }
    final commentJson = response.data!['comment'] as Map<String, dynamic>?;
    if (commentJson == null) {
      return ApiResponse.error('Unexpected response from server');
    }
    return ApiResponse.success(ReelComment.fromJson(commentJson));
  }

  /// Heartbeat — fire-and-forget via the minimal telemetry Dio instance.
  /// Uses a 5-second timeout and no logger so failed calls don't spam the console.
  Future<void> heartbeat(
    String reelId, {
    required int watchTime,
    bool completed = false,
  }) async {
    try {
      await _telemetryDio.post(
        '/reels/$reelId/heartbeat',
        data: {'watchTime': watchTime, 'completed': completed},
      );
    } catch (_) {
      // Intentionally silent — heartbeats are best-effort telemetry.
    }
  }

  // â”€â”€ Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  Future<ApiResponse<List<ReelComment>>> getComments(String reelId) async {
    final response = await _api.get<Map<String, dynamic>>(
      '/reels/$reelId/comments',
    );
    if (!response.isSuccess || response.data == null) {
      return ApiResponse.error(response.error ?? 'Failed to load comments');
    }
    final raw = (response.data!['comments'] ?? response.data!['data'] ?? [])
        as List<dynamic>;
    final comments = raw
        .whereType<Map<String, dynamic>>()
        .map(ReelComment.fromJson)
        .toList();
    return ApiResponse.success(comments);
  }

  Future<ApiResponse<void>> reportReel(String reelId, String reason) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/reels/$reelId/report',
      data: {'reason': reason},
    );
    if (!response.isSuccess) {
      return ApiResponse.error(response.error ?? 'Failed to report reel');
    }
    return ApiResponse.success(null);
  }

  Future<ApiResponse<void>> deleteReel(String reelId) async {
    final response = await _api.delete<Map<String, dynamic>>(
      '/reels/$reelId',
    );
    if (!response.isSuccess) {
      return ApiResponse.error(response.error ?? 'Failed to delete reel');
    }
    return ApiResponse.success(null);
  }

  Future<ApiResponse<Map<String, dynamic>>> getCreatorAnalytics() async {
    final response = await _api.get<Map<String, dynamic>>(
      '/reels/analytics',
    );
    if (!response.isSuccess || response.data == null) {
      return ApiResponse.error(response.error ?? 'Failed to load analytics');
    }
    return ApiResponse.success(response.data!);
  }
}
