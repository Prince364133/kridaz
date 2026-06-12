import 'dart:io';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:video_player/video_player.dart';
import '../providers/reel_upload_provider.dart';
import '../core/constants/app_colors.dart';
import '../widgets/common/bms_toast.dart';

class ReelUploadScreen extends ConsumerStatefulWidget {
  const ReelUploadScreen({super.key});

  @override
  ConsumerState<ReelUploadScreen> createState() => _ReelUploadScreenState();
}

class _ReelUploadScreenState extends ConsumerState<ReelUploadScreen> {
  File? _selectedVideo;
  VideoPlayerController? _previewController;
  bool _previewInitialized = false;

  final _captionController = TextEditingController();
  final _hashtagsController = TextEditingController();

  @override
  void dispose() {
    _previewController?.dispose();
    _captionController.dispose();
    _hashtagsController.dispose();
    super.dispose();
  }

  Future<void> _pickVideo() async {
    final picker = ImagePicker();
    final picked = await picker.pickVideo(
      source: ImageSource.gallery,
      maxDuration: const Duration(minutes: 3),
    );
    if (picked == null) return;

    final file = File(picked.path);
    _previewController?.dispose();

    final controller = VideoPlayerController.file(file);
    await controller.initialize();
    controller.setLooping(true);
    controller.play();

    setState(() {
      _selectedVideo = file;
      _previewController = controller;
      _previewInitialized = true;
    });
  }

  List<String> _parseHashtags(String raw) {
    return raw
        .split(RegExp(r'[\s,]+'))
        .map((t) => t.replaceAll('#', '').trim().toLowerCase())
        .where((t) => t.isNotEmpty)
        .toList();
  }

  Future<void> _upload() async {
    if (_selectedVideo == null) return;

    final hashtags = _parseHashtags(_hashtagsController.text);
    final caption = _captionController.text.trim();

    await ref.read(reelUploadProvider.notifier).uploadReel(
          _selectedVideo!,
          caption: caption.isEmpty ? null : caption,
          hashtags: hashtags.isEmpty ? null : hashtags,
        );
  }

  void _onUploadSuccess() {
    ref.read(reelUploadProvider.notifier).reset();
    BmsToast.success(
        context, 'Reel uploaded! It will appear once processing is done.');
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    final uploadState =
        ref.watch(reelUploadProvider).valueOrNull ?? const ReelUploadState();

    // Navigate away on success.
    ref.listen<AsyncValue<ReelUploadState>>(reelUploadProvider, (_, next) {
      final value = next.valueOrNull;
      if (value?.status == ReelUploadStatus.done) {
        _onUploadSuccess();
      }
    });

    return Scaffold(
      backgroundColor: AppColors.surfaceSlateDeep,
      appBar: AppBar(
        backgroundColor: AppColors.surfaceSlateDeep,
        foregroundColor: Colors.white,
        title: const Text(
          'New Reel',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _VideoPickerSection(
                selectedVideo: _selectedVideo,
                previewController: _previewController,
                previewInitialized: _previewInitialized,
                onPick: uploadState.isUploading ? null : _pickVideo,
              ),
              const SizedBox(height: 24),
              _FormField(
                controller: _captionController,
                label: 'Caption',
                hint: "What's happening in this reel?",
                maxLines: 3,
                enabled: !uploadState.isUploading,
              ),
              const SizedBox(height: 16),
              _FormField(
                controller: _hashtagsController,
                label: 'Hashtags',
                hint: '#cricket #sports #kridaz',
                enabled: !uploadState.isUploading,
              ),
              const SizedBox(height: 32),
              if (uploadState.isUploading ||
                  uploadState.status == ReelUploadStatus.done)
                _UploadProgress(uploadState: uploadState)
              else ...[
                if (uploadState.status == ReelUploadStatus.failed)
                  _ErrorBanner(error: uploadState.error ?? 'Upload failed'),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _selectedVideo != null ? _upload : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.accentCyan,
                      foregroundColor: Colors.black,
                      disabledBackgroundColor: Colors.white12,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: const Text(
                      'Upload Reel',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Video picker section ─────────────────────────────────────────────────────

class _VideoPickerSection extends StatelessWidget {
  final File? selectedVideo;
  final VideoPlayerController? previewController;
  final bool previewInitialized;
  final VoidCallback? onPick;

  const _VideoPickerSection({
    required this.selectedVideo,
    required this.previewController,
    required this.previewInitialized,
    required this.onPick,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPick,
      child: Container(
        width: double.infinity,
        height: 260,
        decoration: BoxDecoration(
          color: AppColors.surfaceSlate,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selectedVideo != null
                ? AppColors.accentCyan.withValues(alpha: 0.5)
                : Colors.white12,
            width: 1.5,
          ),
        ),
        clipBehavior: Clip.hardEdge,
        child: selectedVideo == null
            ? _EmptyPicker(onPick: onPick)
            : previewInitialized && previewController != null
                ? Stack(
                    fit: StackFit.expand,
                    children: [
                      FittedBox(
                        fit: BoxFit.cover,
                        child: SizedBox(
                          width: previewController!.value.size.width,
                          height: previewController!.value.size.height,
                          child: VideoPlayer(previewController!),
                        ),
                      ),
                      Container(
                        color: Colors.black.withValues(alpha: 0.3),
                      ),
                      Center(
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black54,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(LucideIcons.pencil,
                                  color: Colors.white, size: 16),
                              SizedBox(width: 6),
                              Text(
                                'Tap to change',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  )
                : const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

class _EmptyPicker extends StatelessWidget {
  final VoidCallback? onPick;
  const _EmptyPicker({required this.onPick});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: AppColors.accentCyan.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(
            LucideIcons.video,
            color: AppColors.accentCyan,
            size: 32,
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Tap to select a video',
          style: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'MP4 • up to 3 minutes',
          style: TextStyle(color: Colors.white54, fontSize: 13),
        ),
      ],
    );
  }
}

// ─── Form field ───────────────────────────────────────────────────────────────

class _FormField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final int maxLines;
  final bool enabled;

  const _FormField({
    required this.controller,
    required this.label,
    required this.hint,
    this.maxLines = 1,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          enabled: enabled,
          maxLines: maxLines,
          style: const TextStyle(color: Colors.white, fontSize: 15),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: Colors.white30),
            filled: true,
            fillColor: AppColors.surfaceSlate,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Colors.white12),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.accentCyan, width: 1.5),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
          ),
        ),
      ],
    );
  }
}

// ─── Upload progress ──────────────────────────────────────────────────────────

class _UploadProgress extends StatelessWidget {
  final ReelUploadState uploadState;
  const _UploadProgress({required this.uploadState});

  @override
  Widget build(BuildContext context) {
    final steps = [
      _StepData(
        label: 'Uploading video',
        isActive: uploadState.status == ReelUploadStatus.uploadingToR2,
        isDone: uploadState.status == ReelUploadStatus.confirming ||
            uploadState.status == ReelUploadStatus.done,
      ),
      _StepData(
        label: 'Saving your reel',
        isActive: uploadState.status == ReelUploadStatus.confirming,
        isDone: uploadState.status == ReelUploadStatus.done,
      ),
      _StepData(
        label: 'Processing started',
        isActive: false,
        isDone: uploadState.status == ReelUploadStatus.done,
      ),
    ];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surfaceSlate,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Uploading…',
            style: TextStyle(
              color: Colors.white,
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 16),
          if (uploadState.status == ReelUploadStatus.uploadingToR2) ...[
            LinearProgressIndicator(
              value: uploadState.uploadProgress,
              backgroundColor: Colors.white12,
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.accentCyan),
              borderRadius: BorderRadius.circular(4),
            ),
            const SizedBox(height: 8),
            Text(
              '${(uploadState.uploadProgress * 100).toInt()}%',
              style: const TextStyle(color: Colors.white54, fontSize: 12),
            ),
            const SizedBox(height: 16),
          ] else ...[
            LinearProgressIndicator(
              backgroundColor: Colors.white12,
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.accentCyan),
              borderRadius: BorderRadius.circular(4),
            ),
            const SizedBox(height: 16),
          ],
          ...steps.map((step) => _StepRow(step: step)),
        ],
      ),
    );
  }
}

class _StepData {
  final String label;
  final bool isActive;
  final bool isDone;
  const _StepData({
    required this.label,
    required this.isActive,
    required this.isDone,
  });
}

class _StepRow extends StatelessWidget {
  final _StepData step;
  const _StepRow({required this.step});

  @override
  Widget build(BuildContext context) {
    final color = step.isDone
        ? AppColors.accentGreen
        : step.isActive
            ? AppColors.accentCyan
            : Colors.white30;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Icon(
            step.isDone
                ? LucideIcons.checkCircle
                : step.isActive
                    ? LucideIcons.circleDot
                    : LucideIcons.circle,
            color: color,
            size: 18,
          ),
          const SizedBox(width: 10),
          Text(
            step.label,
            style: TextStyle(
              color:
                  step.isDone || step.isActive ? Colors.white : Colors.white38,
              fontSize: 14,
              fontWeight: step.isActive ? FontWeight.w600 : FontWeight.w400,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Error banner ─────────────────────────────────────────────────────────────

class _ErrorBanner extends StatelessWidget {
  final String error;
  const _ErrorBanner({required this.error});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.red.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red.withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.alertCircle, color: Colors.red, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              error,
              style: const TextStyle(color: Colors.red, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}
