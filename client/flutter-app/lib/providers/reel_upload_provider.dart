import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/reel_api_service.dart';

// ─── State ───────────────────────────────────────────────────────────────────

enum ReelUploadStatus { idle, uploadingToR2, confirming, done, failed }

class ReelUploadState {
  final ReelUploadStatus status;
  // 0.0 → 1.0 — only meaningful during uploadingToR2.
  final double uploadProgress;
  final String? error;
  // The reel returned by confirm-upload on success.
  final Reel? uploadedReel;

  const ReelUploadState({
    this.status = ReelUploadStatus.idle,
    this.uploadProgress = 0,
    this.error,
    this.uploadedReel,
  });

  bool get isUploading =>
      status == ReelUploadStatus.uploadingToR2 ||
      status == ReelUploadStatus.confirming;

  ReelUploadState copyWith({
    ReelUploadStatus? status,
    double? uploadProgress,
    String? error,
    Reel? uploadedReel,
  }) =>
      ReelUploadState(
        status: status ?? this.status,
        uploadProgress: uploadProgress ?? this.uploadProgress,
        error: error,
        uploadedReel: uploadedReel ?? this.uploadedReel,
      );
}

// ─── Notifier ─────────────────────────────────────────────────────────────────

class ReelUploadNotifier extends AsyncNotifier<ReelUploadState> {
  ReelApiService get _service => ReelApiService();

  @override
  Future<ReelUploadState> build() async => const ReelUploadState();

  /// Runs the full 3-step upload flow:
  ///   1. GET /reels/upload-url  → presigned URL + reelId + key
  ///   2. PUT video bytes → R2 via presigned URL (streaming, with progress)
  ///   3. POST /reels/confirm-upload → triggers transcoding queue
  Future<void> uploadReel(
    File videoFile, {
    String? caption,
    List<String>? hashtags,
  }) async {
    // ── Step 1: get presigned URL ──────────────────────────────────────────
    state = AsyncData(const ReelUploadState(
      status: ReelUploadStatus.uploadingToR2,
      uploadProgress: 0,
    ));

    const contentType = 'video/mp4';
    final fileName = videoFile.path.split(Platform.pathSeparator).last;

    final urlResult = await _service.getUploadUrl(
      contentType: contentType,
      fileName: fileName,
    );

    if (!urlResult.isSuccess || urlResult.data == null) {
      state = AsyncData(ReelUploadState(
        status: ReelUploadStatus.failed,
        error: urlResult.error ?? 'Failed to get upload URL',
      ));
      return;
    }

    final urlData = urlResult.data!;

    // ── Step 2: stream upload to R2 ───────────────────────────────────────
    try {
      await _service.uploadToR2(
        urlData.uploadUrl,
        videoFile,
        contentType,
        onProgress: (progress) {
          state = AsyncData(ReelUploadState(
            status: ReelUploadStatus.uploadingToR2,
            uploadProgress: progress,
          ));
        },
      );
    } catch (e) {
      state = AsyncData(ReelUploadState(
        status: ReelUploadStatus.failed,
        error: 'Upload to storage failed: $e',
      ));
      return;
    }

    // ── Step 3: confirm upload ────────────────────────────────────────────
    state = AsyncData(const ReelUploadState(
      status: ReelUploadStatus.confirming,
      uploadProgress: 1,
    ));

    final confirmResult = await _service.confirmUpload(
      reelId: urlData.reelId,
      key: urlData.key,
      caption: caption,
      hashtags: hashtags,
    );

    if (!confirmResult.isSuccess || confirmResult.data == null) {
      state = AsyncData(ReelUploadState(
        status: ReelUploadStatus.failed,
        error: confirmResult.error ?? 'Failed to confirm upload',
      ));
      return;
    }

    state = AsyncData(ReelUploadState(
      status: ReelUploadStatus.done,
      uploadProgress: 1,
      uploadedReel: confirmResult.data,
    ));
  }

  void reset() {
    state = const AsyncData(ReelUploadState());
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

final reelUploadProvider =
    AsyncNotifierProvider<ReelUploadNotifier, ReelUploadState>(
  ReelUploadNotifier.new,
);
