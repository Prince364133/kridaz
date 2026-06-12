import 'dart:io';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../core/constants/app_colors.dart';
import '../widgets/common/bms_toast.dart';
import '../providers/story_provider.dart';
import '../services/story_service.dart';

class StoryUploadScreen extends ConsumerStatefulWidget {
  const StoryUploadScreen({super.key});
  @override
  ConsumerState<StoryUploadScreen> createState() => _StoryUploadScreenState();
}

class _StoryUploadScreenState extends ConsumerState<StoryUploadScreen> {
  File? _file;
  bool _isUploading = false;
  final _picker = ImagePicker();

  Future<void> _pick(ImageSource source) async {
    final picked = await _picker.pickImage(source: source, imageQuality: 85);
    if (picked != null) setState(() => _file = File(picked.path));
  }

  Future<void> _upload() async {
    if (_file == null || _isUploading) return;
    setState(() => _isUploading = true);
    try {
      final urls =
          await StoryService().requestUploadUrl(mediaType: 'image', ext: 'jpg');
      if (urls == null) throw Exception('Failed to get upload URL');
      final ok = await StoryService()
          .uploadToR2(urls['uploadUrl']!, _file!, 'image/jpeg');
      if (!ok) throw Exception('Upload failed');
      await StoryService().confirmStory(urls['storyId']!, urls['key']!);
      if (!mounted) return;
      ref.invalidate(storyGroupsProvider);
      BmsToast.success(context, 'Story posted!');
      if (context.canPop()) context.pop();
    } catch (e) {
      if (!mounted) return;
      BmsToast.error(context, 'Failed: $e');
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceL0,
      appBar: AppBar(
        backgroundColor: AppColors.surfaceL0,
        title: const Text('New Story', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              if (_file == null) ...[
                const Spacer(),
                _PickButton(
                    icon: LucideIcons.camera,
                    label: 'Take Photo',
                    onTap: () => _pick(ImageSource.camera)),
                const SizedBox(height: 12),
                _PickButton(
                    icon: LucideIcons.image,
                    label: 'Choose from Gallery',
                    onTap: () => _pick(ImageSource.gallery)),
                const Spacer(),
              ] else ...[
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Image.file(_file!,
                        fit: BoxFit.cover, width: double.infinity),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isUploading ? null : _upload,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _isUploading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.black))
                        : const Text('Post Story',
                            style: TextStyle(
                                color: Colors.black,
                                fontWeight: FontWeight.w700)),
                  ),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () => setState(() => _file = null),
                  child: const Text('Choose different image',
                      style: TextStyle(color: Colors.white54)),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _PickButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _PickButton(
      {required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.surfaceL3,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.backgroundCard),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppColors.primary, size: 28),
            const SizedBox(width: 16),
            Text(label,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}
