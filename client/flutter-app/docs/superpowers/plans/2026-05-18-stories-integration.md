# Stories Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded mock story row on the home screen with real stories fetched from `/api/story/feed`, wire the upload flow to the backend's presigned-URL pipeline, and update the story viewer to display real media (images, video, text) with live view tracking.

**Architecture:** A new `StoryService` handles all `/api/story/*` REST calls. A Riverpod `storyFeedProvider` holds the feed state. The existing `_SportsStoryRow`, `_YourStoryCircle`, and `_StoryViewer` widgets in `new_home_dashboard.dart` are updated in-place — no new screens for viewing, but a new `StoryUploadScreen` handles the upload flow since it needs its own navigation and state.

**Tech Stack:** Flutter/Dart, Dio (via `ApiService`), `cached_network_image`, `video_player`, `image_picker`, Riverpod, `go_router`

---

## Background: What exists and what's fake

The home screen (`new_home_dashboard.dart`) already has the full stories UI skeleton:
- **`_SportsStoryRow`** (line 454) — horizontal scroll of story circles. Currently maps over `_sports` (6 hardcoded local-asset mock entries).
- **`_YourStoryCircle`** — "+" button. Opens camera and shows the captured image locally only — never uploads to the backend.
- **`_StoryCircle`** — renders one story ring. Passes `allStories: _sports` (fake) to the viewer.
- **`_StoryViewer`** — full-screen viewer with progress bars and tap gestures. Uses `Image.asset` — will crash on network URLs.

The backend feed endpoint returns stories **grouped by user**:
```json
{
  "success": true,
  "stories": [
    {
      "author": { "_id": "...", "name": "Rahul", "username": "rahul99", "profilePicture": "..." },
      "stories": [
        {
          "_id": "...", "mediaUrl": "...", "hlsUrl": "...",
          "mediaType": "image|video|text", "content": "...",
          "status": "ready|pending|failed",
          "viewers": [...], "expiresAt": "...", "createdAt": "..."
        }
      ]
    }
  ]
}
```
Current user's group is always first. If the current user has no story, their group won't appear — the `_YourStoryCircle` should always be shown and opens the upload flow.

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| **Create** | `lib/models/story_model.dart` | `StoryModel`, `StoryAuthor`, `StoryGroup` data classes |
| **Create** | `lib/services/story_service.dart` | All REST calls to `/api/story/*` |
| **Create** | `lib/providers/story_provider.dart` | Riverpod `AsyncNotifier` for the feed + upload state |
| **Create** | `lib/screens/story_upload_screen.dart` | Upload flow: pick → presigned URL → PUT to R2 → confirm |
| **Modify** | `lib/screens/new_home_dashboard.dart` | Replace mock data; update `_SportsStoryRow`, `_YourStoryCircle`, `_StoryViewer` |
| **Modify** | `lib/router/app_router.dart` | Add `/story-upload` route |

---

## Task 1: Create Story data models

**Files:**
- Create: `lib/models/story_model.dart`

- [ ] **Step 1: Create `lib/models/story_model.dart`**

```dart
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
  final StoryAuthor? author; // populated when returned as part of a group
  final String? mediaUrl;
  final String? hlsUrl;
  final String? placeholder; // base64 tiny thumbnail
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

    // userId may be populated (object) or just an ID string
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
      expiresAt: DateTime.tryParse(json['expiresAt']?.toString() ?? '') ?? DateTime.now(),
      status: (json['status'] ?? 'ready').toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
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
  bool allViewed(String userId) => stories.every((s) => s.hasBeenViewedBy(userId));
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/models/story_model.dart
git commit -m "feat(stories): add StoryModel, StoryAuthor, StoryGroup data classes"
```

---

## Task 2: Write StoryService

**Files:**
- Create: `lib/services/story_service.dart`

- [ ] **Step 1: Create `lib/services/story_service.dart`**

```dart
import 'dart:io';
import 'package:dio/dio.dart';
import '../models/story_model.dart';
import 'api_service.dart';
import '../config/api_config.dart';

class StoryService {
  static final StoryService _instance = StoryService._internal();
  factory StoryService() => _instance;
  StoryService._internal();

  final ApiService _api = ApiService();

  /// Fetch stories feed — grouped by user, current user first.
  Future<List<StoryGroup>> fetchFeed() async {
    final response = await _api.get<Map<String, dynamic>>('/story/feed');
    if (!response.isSuccess || response.data == null) return [];

    final raw = response.data!['stories'];
    if (raw is! List) return [];

    return (raw as List)
        .map((g) => StoryGroup.fromJson(g as Map<String, dynamic>))
        .toList();
  }

  /// Step 1 of upload: get a presigned R2 URL.
  /// Returns { storyId, uploadUrl, key } or null on failure.
  Future<Map<String, String>?> getUploadUrl({
    required String contentType,
    required String fileName,
  }) async {
    final response = await _api.get<Map<String, dynamic>>(
      '/story/upload-url',
      queryParameters: {'contentType': contentType, 'fileName': fileName},
    );
    if (!response.isSuccess || response.data == null) return null;
    final d = response.data!;
    return {
      'storyId': d['storyId']?.toString() ?? '',
      'uploadUrl': d['uploadUrl']?.toString() ?? '',
      'key': d['key']?.toString() ?? '',
    };
  }

  /// Step 2 of upload: PUT the file directly to R2 using the presigned URL.
  /// This bypasses ApiService (no auth header needed for presigned PUT).
  Future<bool> uploadFileToR2({
    required String uploadUrl,
    required File file,
    required String contentType,
  }) async {
    final dio = Dio();
    try {
      final bytes = await file.readAsBytes();
      final response = await dio.put(
        uploadUrl,
        data: Stream.fromIterable(bytes.map((b) => [b])),
        options: Options(
          headers: {
            'Content-Type': contentType,
            'Content-Length': bytes.length,
          },
        ),
      );
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  /// Step 3 of upload: confirm story creation in the backend.
  Future<StoryModel?> confirmUpload({
    required String storyId,
    required String key,
    required String mediaType,
    String content = '',
    int durationDays = 1,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/story/confirm-upload',
      data: {
        'storyId': storyId,
        'key': key,
        'mediaType': mediaType,
        'content': content,
        'durationDays': durationDays,
      },
    );
    if (!response.isSuccess || response.data == null) return null;
    final storyJson = response.data!['story'];
    if (storyJson is! Map<String, dynamic>) return null;
    return StoryModel.fromJson(storyJson);
  }

  /// Track that the current user viewed [storyId].
  Future<void> viewStory(String storyId) async {
    await _api.post<dynamic>('/story/$storyId/view', data: {});
  }

  /// Delete own story.
  Future<bool> deleteStory(String storyId) async {
    final response = await _api.delete<dynamic>('/story/$storyId');
    return response.isSuccess;
  }
}
```

- [ ] **Step 2: Verify `ApiService.get` supports `queryParameters`**

Open `lib/services/api_service.dart` and check if `get<T>` accepts `queryParameters`. If not, add the parameter:

```dart
Future<ApiResponse<T>> get<T>(String path, {Map<String, dynamic>? queryParameters}) async {
  try {
    final response = await _dio.get<T>(path, queryParameters: queryParameters);
    return ApiResponse.success(response.data);
  } on DioException catch (e) {
    return ApiResponse.error(_handleDioError(e));
  } catch (e) {
    return ApiResponse.error(e.toString());
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/services/story_service.dart lib/services/api_service.dart
git commit -m "feat(stories): add StoryService with feed, upload, view, delete"
```

---

## Task 3: Create StoryProvider

**Files:**
- Create: `lib/providers/story_provider.dart`

- [ ] **Step 1: Create `lib/providers/story_provider.dart`**

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/story_model.dart';
import '../services/story_service.dart';

class StoryFeedNotifier extends AsyncNotifier<List<StoryGroup>> {
  final _service = StoryService();

  @override
  Future<List<StoryGroup>> build() => _service.fetchFeed();

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _service.fetchFeed());
  }

  /// Optimistically mark a story as viewed.
  void markViewed(String storyId, String currentUserId) {
    final current = state.valueOrNull;
    if (current == null) return;

    final updated = current.map((group) {
      final updatedStories = group.stories.map((s) {
        if (s.id == storyId && !s.viewerIds.contains(currentUserId)) {
          return StoryModel(
            id: s.id,
            author: s.author,
            mediaUrl: s.mediaUrl,
            hlsUrl: s.hlsUrl,
            placeholder: s.placeholder,
            content: s.content,
            mediaType: s.mediaType,
            durationDays: s.durationDays,
            viewerIds: [...s.viewerIds, currentUserId],
            expiresAt: s.expiresAt,
            status: s.status,
            createdAt: s.createdAt,
          );
        }
        return s;
      }).toList();
      return StoryGroup(author: group.author, stories: updatedStories);
    }).toList();

    state = AsyncData(updated);
  }
}

final storyFeedProvider =
    AsyncNotifierProvider<StoryFeedNotifier, List<StoryGroup>>(
        StoryFeedNotifier.new);
```

- [ ] **Step 2: Commit**

```bash
git add lib/providers/story_provider.dart
git commit -m "feat(stories): add storyFeedProvider Riverpod notifier"
```

---

## Task 4: Build StoryUploadScreen

**Files:**
- Create: `lib/screens/story_upload_screen.dart`

This is a new screen: user picks a file, sees a preview, adds optional caption, then uploads via the 3-step presigned URL flow.

- [ ] **Step 1: Create `lib/screens/story_upload_screen.dart`**

```dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/story_service.dart';
import '../providers/story_provider.dart';
import '../core/constants/app_colors.dart';

class StoryUploadScreen extends ConsumerStatefulWidget {
  /// If [preselectedFile] is provided, skip the picker and go straight to preview.
  final File? preselectedFile;
  final String? preselectedMediaType; // 'image' | 'video'

  const StoryUploadScreen({Key? key, this.preselectedFile, this.preselectedMediaType})
      : super(key: key);

  @override
  ConsumerState<StoryUploadScreen> createState() => _StoryUploadScreenState();
}

class _StoryUploadScreenState extends ConsumerState<StoryUploadScreen> {
  final _service = StoryService();
  final _captionCtrl = TextEditingController();

  File? _file;
  String _mediaType = 'image';
  bool _isUploading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.preselectedFile != null) {
      _file = widget.preselectedFile;
      _mediaType = widget.preselectedMediaType ?? 'image';
    }
  }

  @override
  void dispose() {
    _captionCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickMedia(ImageSource source, String type) async {
    final picker = ImagePicker();
    XFile? picked;
    if (type == 'image') {
      picked = await picker.pickImage(source: source, imageQuality: 85);
    } else {
      picked = await picker.pickVideo(source: source);
    }
    if (picked != null) {
      setState(() {
        _file = File(picked!.path);
        _mediaType = type;
        _error = null;
      });
    }
  }

  Future<void> _upload() async {
    if (_file == null) return;
    setState(() {
      _isUploading = true;
      _error = null;
    });

    final ext = _file!.path.split('.').last.toLowerCase();
    final contentType = _mediaType == 'video' ? 'video/mp4' : 'image/$ext';
    final fileName = 'story.$ext';

    // Step 1: get presigned URL
    final urls = await _service.getUploadUrl(
      contentType: contentType,
      fileName: fileName,
    );
    if (urls == null) {
      setState(() {
        _isUploading = false;
        _error = 'Failed to get upload URL. Please try again.';
      });
      return;
    }

    // Step 2: PUT to R2
    final uploaded = await _service.uploadFileToR2(
      uploadUrl: urls['uploadUrl']!,
      file: _file!,
      contentType: contentType,
    );
    if (!uploaded) {
      setState(() {
        _isUploading = false;
        _error = 'Upload failed. Check your connection and try again.';
      });
      return;
    }

    // Step 3: confirm with backend
    final story = await _service.confirmUpload(
      storyId: urls['storyId']!,
      key: urls['key']!,
      mediaType: _mediaType,
      content: _captionCtrl.text.trim(),
      durationDays: 1,
    );

    if (!mounted) return;

    if (story == null) {
      setState(() {
        _isUploading = false;
        _error = 'Story saved but confirmation failed. It may appear shortly.';
      });
      return;
    }

    // Refresh the feed so the new story appears
    ref.read(storyFeedProvider.notifier).refresh();

    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: const Text('New Story', style: TextStyle(color: Colors.white)),
        actions: [
          if (_file != null && !_isUploading)
            TextButton(
              onPressed: _upload,
              child: const Text('Share',
                  style: TextStyle(color: AppColors.accentCyan, fontWeight: FontWeight.w700)),
            ),
        ],
      ),
      body: _file == null ? _buildPicker() : _buildPreview(),
    );
  }

  Widget _buildPicker() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _PickerTile(
            icon: Icons.photo_library_outlined,
            label: 'Photo from Gallery',
            onTap: () => _pickMedia(ImageSource.gallery, 'image'),
          ),
          const SizedBox(height: 16),
          _PickerTile(
            icon: Icons.camera_alt_outlined,
            label: 'Take a Photo',
            onTap: () => _pickMedia(ImageSource.camera, 'image'),
          ),
          const SizedBox(height: 16),
          _PickerTile(
            icon: Icons.videocam_outlined,
            label: 'Video from Gallery',
            onTap: () => _pickMedia(ImageSource.gallery, 'video'),
          ),
        ],
      ),
    );
  }

  Widget _buildPreview() {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Media preview
        if (_mediaType == 'image')
          Image.file(_file!, fit: BoxFit.contain)
        else
          const Center(
            child: Icon(Icons.videocam, color: Colors.white54, size: 80),
          ),

        // Caption input at bottom
        Positioned(
          bottom: 32,
          left: 20,
          right: 20,
          child: Column(
            children: [
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(_error!,
                      style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
                ),
              TextField(
                controller: _captionCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Add a caption...',
                  hintStyle: const TextStyle(color: Colors.white54),
                  filled: true,
                  fillColor: Colors.black45,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ],
          ),
        ),

        // Loading overlay
        if (_isUploading)
          Container(
            color: Colors.black54,
            child: const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(color: AppColors.accentCyan),
                  SizedBox(height: 16),
                  Text('Uploading story...', style: TextStyle(color: Colors.white)),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _PickerTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _PickerTile({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 240,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: BoxDecoration(
          color: const Color(0xFF1C1C1E),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppColors.accentCyan, size: 24),
            const SizedBox(width: 14),
            Text(label, style: const TextStyle(color: Colors.white, fontSize: 15)),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: Add `/story-upload` route to `app_router.dart`**

Open `lib/router/app_router.dart`. Find the routes list and add:

```dart
GoRoute(
  path: '/story-upload',
  builder: (context, state) {
    final extra = state.extra as Map<String, dynamic>?;
    return StoryUploadScreen(
      preselectedFile: extra?['file'] as File?,
      preselectedMediaType: extra?['mediaType'] as String?,
    );
  },
),
```

Add the import at the top of `app_router.dart`:
```dart
import '../screens/story_upload_screen.dart';
```

- [ ] **Step 3: Commit**

```bash
git add lib/screens/story_upload_screen.dart lib/router/app_router.dart
git commit -m "feat(stories): add StoryUploadScreen and /story-upload route"
```

---

## Task 5: Update _SportsStoryRow with real data

**Files:**
- Modify: `lib/screens/new_home_dashboard.dart`

Replace the hardcoded `_sports` list and the entire `_SportsStoryRowState` with a Riverpod consumer that reads from `storyFeedProvider`.

- [ ] **Step 1: Add imports to `new_home_dashboard.dart`**

At the top of the file, add:

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart'; // already present via ConsumerWidget
import '../models/story_model.dart';
import '../providers/story_provider.dart';
import '../services/story_service.dart';
import '../services/auth_manager.dart';
```

- [ ] **Step 2: Delete the `_sports` constant**

Remove lines 139–146:
```dart
const List<Map<String, dynamic>> _sports = [
  {'label': 'Rahul',    'imagePath': 'assets/images/person1.png'},
  ...
];
```

- [ ] **Step 3: Replace `_SportsStoryRow` and its state**

Replace the entire `_SportsStoryRow` and `_SportsStoryRowState` classes (lines 454–535) with:

```dart
class _SportsStoryRow extends ConsumerStatefulWidget {
  @override
  ConsumerState<_SportsStoryRow> createState() => _SportsStoryRowState();
}

class _SportsStoryRowState extends ConsumerState<_SportsStoryRow> {
  final Set<String> _viewedGroupIds = {};

  void _markGroupViewed(String authorId) {
    setState(() => _viewedGroupIds.add(authorId));
  }

  @override
  Widget build(BuildContext context) {
    final feedAsync = ref.watch(storyFeedProvider);
    final currentUserId = AuthManager().currentUser?['_id']?.toString() ?? '';

    return SizedBox(
      height: 94,
      child: feedAsync.when(
        loading: () => ListView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: _pH),
          children: [
            const _YourStoryCircle(),
            const SizedBox(width: _gCard),
            // Shimmer placeholders
            for (int i = 0; i < 4; i++)
              Padding(
                padding: const EdgeInsets.only(right: _gCard),
                child: _ShimmerCircle(),
              ),
          ],
        ),
        error: (_, __) => ListView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: _pH),
          children: [const _YourStoryCircle()],
        ),
        data: (groups) {
          // Separate current user's group (if any)
          final myGroup = groups.isNotEmpty && groups.first.author.id == currentUserId
              ? groups.first
              : null;
          final otherGroups = myGroup != null ? groups.skip(1).toList() : groups;

          return ListView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: _pH),
            children: [
              _YourStoryCircle(existingStories: myGroup?.stories ?? []),
              const SizedBox(width: _gCard),
              ...otherGroups.map((group) {
                final isViewed = _viewedGroupIds.contains(group.author.id) ||
                    group.allViewed(currentUserId);
                return Padding(
                  padding: const EdgeInsets.only(right: _gCard),
                  child: _StoryCircle(
                    label: group.author.username ?? group.author.name,
                    avatarUrl: group.author.profilePicture,
                    isViewed: isViewed,
                    onTap: () {
                      _markGroupViewed(group.author.id);
                      _openStoryViewer(context, group, currentUserId);
                    },
                  ),
                );
              }),
            ],
          );
        },
      ),
    );
  }

  void _openStoryViewer(BuildContext context, StoryGroup group, String currentUserId) {
    Navigator.push(
      context,
      PageRouteBuilder(
        opaque: false,
        barrierColor: Colors.black,
        pageBuilder: (_, __, ___) => _StoryViewer(
          group: group,
          currentUserId: currentUserId,
          onViewed: (storyId) {
            ref.read(storyFeedProvider.notifier).markViewed(storyId, currentUserId);
            StoryService().viewStory(storyId);
          },
        ),
      ),
    );
  }
}

/// Simple shimmer placeholder while feed loads.
class _ShimmerCircle extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 70,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withOpacity(0.08),
            ),
          ),
          const SizedBox(height: 6),
          Container(
            width: 40, height: 8,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.08),
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step 4: Update `_StoryCircle` signature**

Replace the old `_StoryCircle` constructor (which took `sampleImagePath`, `allStories`, `storyIndex`, `onWatched`, `child`) with a simpler version:

```dart
class _StoryCircle extends StatelessWidget {
  final String label;
  final String? avatarUrl;
  final bool isViewed;
  final VoidCallback onTap;

  const _StoryCircle({
    required this.label,
    this.avatarUrl,
    required this.isViewed,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 70,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64, height: 64,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: isViewed
                    ? null
                    : const LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Color(0xFF3DD9C5), Color(0xFF2ECC71)],
                      ),
                color: isViewed ? const Color(0xFF1E293B) : null,
              ),
              padding: const EdgeInsets.all(2.5),
              child: Container(
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.black,
                ),
                padding: const EdgeInsets.all(1.5),
                child: ClipOval(
                  child: avatarUrl != null
                      ? CachedNetworkImage(
                          imageUrl: avatarUrl!,
                          fit: BoxFit.cover,
                          errorWidget: (_, __, ___) => _placeholderIcon(),
                        )
                      : _placeholderIcon(),
                ),
              ),
            ),
            const SizedBox(height: 5),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: isViewed ? Colors.white38 : Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.w500,
                fontFamily: 'Poppins',
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _placeholderIcon() => Container(
        color: const Color(0xFF1A1A1A),
        child: const Icon(Icons.person, color: Colors.white54, size: 28),
      );
}
```

- [ ] **Step 5: Update `_YourStoryCircle` to accept existing stories and navigate to upload**

Replace `_YourStoryCircle` with:

```dart
class _YourStoryCircle extends StatelessWidget {
  final List<StoryModel> existingStories;
  const _YourStoryCircle({this.existingStories = const []});

  @override
  Widget build(BuildContext context) {
    final hasStory = existingStories.isNotEmpty;
    final firstStory = hasStory ? existingStories.first : null;

    return GestureDetector(
      onTap: () {
        if (hasStory) {
          // Show own stories
          final currentUserId = AuthManager().currentUser?['_id']?.toString() ?? '';
          Navigator.push(
            context,
            PageRouteBuilder(
              opaque: false,
              barrierColor: Colors.black,
              pageBuilder: (_, __, ___) => _StoryViewer(
                group: StoryGroup(
                  author: StoryAuthor(
                    id: currentUserId,
                    name: AuthManager().currentUser?['name']?.toString() ?? 'You',
                  ),
                  stories: existingStories,
                ),
                currentUserId: currentUserId,
                onViewed: (_) {}, // own stories — no need to track self-views
              ),
            ),
          );
        } else {
          context.push('/story-upload');
        }
      },
      child: SizedBox(
        width: 70,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 64, height: 64,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 64, height: 64,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: hasStory ? AppColors.accentCyan : const Color(0xFF1E293B),
                        width: 2.5,
                      ),
                    ),
                    padding: const EdgeInsets.all(3),
                    child: ClipOval(
                      child: hasStory && firstStory?.mediaUrl != null
                          ? CachedNetworkImage(
                              imageUrl: firstStory!.mediaUrl!,
                              fit: BoxFit.cover,
                              errorWidget: (_, __, ___) => _emptyAvatar(),
                            )
                          : _emptyAvatar(),
                    ),
                  ),
                  // "+" badge — always shown so user can add more stories
                  Positioned(
                    bottom: -1, right: -1,
                    child: GestureDetector(
                      onTap: () => context.push('/story-upload'),
                      child: Container(
                        width: 18, height: 18,
                        decoration: const BoxDecoration(
                          color: Color(0xFF22C55E),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.add, size: 12, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 5),
            const Text(
              'Your Story',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.w500,
                fontFamily: 'Poppins',
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _emptyAvatar() => Container(
        color: const Color(0xFF1E293B),
        child: const Center(
          child: Icon(Icons.person_outline, color: Colors.white, size: 26),
        ),
      );
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/screens/new_home_dashboard.dart
git commit -m "feat(stories): wire SportsStoryRow + YourStoryCircle to real backend feed"
```

---

## Task 6: Update _StoryViewer for real media

**Files:**
- Modify: `lib/screens/new_home_dashboard.dart`

The existing `_StoryViewer` uses `Image.asset`. Replace it to handle real network images, video, and text stories, plus call the view-tracking callback.

- [ ] **Step 1: Update `_StoryViewer` constructor and state**

Find the `_StoryViewer` class and replace it entirely:

```dart
class _StoryViewer extends StatefulWidget {
  final StoryGroup group;
  final String currentUserId;
  final void Function(String storyId) onViewed;

  const _StoryViewer({
    required this.group,
    required this.currentUserId,
    required this.onViewed,
  });

  @override
  State<_StoryViewer> createState() => _StoryViewerState();
}

class _StoryViewerState extends State<_StoryViewer>
    with SingleTickerProviderStateMixin {
  late final AnimationController _progress;
  late final PageController _pageCtrl;
  int _currentIndex = 0;
  final Set<String> _trackedIds = {};

  @override
  void initState() {
    super.initState();
    _pageCtrl = PageController();
    _progress = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 5),
    )..addStatusListener((status) {
        if (status == AnimationStatus.completed) _goNext();
      });
    _trackCurrentView();
    _progress.forward();
  }

  void _trackCurrentView() {
    final story = widget.group.stories[_currentIndex];
    if (!_trackedIds.contains(story.id)) {
      _trackedIds.add(story.id);
      widget.onViewed(story.id);
    }
  }

  void _goNext() {
    if (_currentIndex < widget.group.stories.length - 1) {
      _pageCtrl.nextPage(
          duration: const Duration(milliseconds: 250), curve: Curves.easeInOut);
    } else {
      Navigator.pop(context);
    }
  }

  void _goPrev() {
    if (_currentIndex > 0) {
      _pageCtrl.previousPage(
          duration: const Duration(milliseconds: 250), curve: Curves.easeInOut);
    }
  }

  void _onPageChanged(int index) {
    setState(() => _currentIndex = index);
    _progress.reset();
    _trackCurrentView();
    _progress.forward();
  }

  @override
  void dispose() {
    _progress.dispose();
    _pageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.of(context).padding.top;
    final stories = widget.group.stories;
    final story = stories[_currentIndex];
    final author = widget.group.author;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // ── Swipeable story pages ──
          PageView.builder(
            controller: _pageCtrl,
            onPageChanged: _onPageChanged,
            itemCount: stories.length,
            itemBuilder: (_, i) => _StoryPageContent(story: stories[i]),
          ),

          // ── Tap zones ──
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  behavior: HitTestBehavior.translucent,
                  onTap: _goPrev,
                ),
              ),
              Expanded(
                child: GestureDetector(
                  behavior: HitTestBehavior.translucent,
                  onTap: _goNext,
                ),
              ),
            ],
          ),

          // ── Progress bars ──
          Positioned(
            top: topPad + 10,
            left: 12, right: 12,
            child: Row(
              children: List.generate(stories.length, (i) {
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    child: AnimatedBuilder(
                      animation: _progress,
                      builder: (_, __) {
                        final value = i < _currentIndex
                            ? 1.0
                            : i == _currentIndex
                                ? _progress.value
                                : 0.0;
                        return ClipRRect(
                          borderRadius: BorderRadius.circular(3),
                          child: LinearProgressIndicator(
                            value: value,
                            minHeight: 2.5,
                            backgroundColor: Colors.white.withOpacity(0.35),
                            valueColor:
                                const AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        );
                      },
                    ),
                  ),
                );
              }),
            ),
          ),

          // ── Author header + close ──
          Positioned(
            top: topPad + 22,
            left: 16, right: 16,
            child: Row(
              children: [
                if (author.profilePicture != null)
                  ClipOval(
                    child: CachedNetworkImage(
                      imageUrl: author.profilePicture!,
                      width: 32, height: 32,
                      fit: BoxFit.cover,
                      errorWidget: (_, __, ___) => const CircleAvatar(radius: 16),
                    ),
                  ),
                const SizedBox(width: 8),
                Text(
                  author.username ?? author.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Poppins',
                    shadows: [Shadow(color: Colors.black54, blurRadius: 6)],
                  ),
                ),
                const Spacer(),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: const Icon(Icons.close, color: Colors.white, size: 22),
                ),
              ],
            ),
          ),

          // ── Caption (if any) ──
          if (story.content.isNotEmpty)
            Positioned(
              bottom: 48,
              left: 20, right: 20,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  story.content,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Renders one story's media: image, video placeholder, or text.
class _StoryPageContent extends StatelessWidget {
  final StoryModel story;
  const _StoryPageContent({required this.story});

  @override
  Widget build(BuildContext context) {
    if (story.mediaType == 'text') {
      return Container(
        color: const Color(0xFF1A2332),
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Text(
              story.content,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      );
    }

    if (story.mediaUrl != null) {
      return Stack(
        fit: StackFit.expand,
        children: [
          CachedNetworkImage(
            imageUrl: story.mediaUrl!,
            fit: BoxFit.cover,
            placeholder: (_, __) => story.placeholder != null
                ? Container(color: const Color(0xFF1E293B)) // could decode base64
                : Container(color: const Color(0xFF1E293B)),
            errorWidget: (_, __, ___) => Container(color: const Color(0xFF1E293B)),
          ),
          Container(color: Colors.black.withOpacity(0.08)),
        ],
      );
    }

    return Container(
      color: const Color(0xFF1E293B),
      child: const Center(
        child: Icon(Icons.broken_image_outlined, color: Colors.white38, size: 60),
      ),
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/screens/new_home_dashboard.dart
git commit -m "feat(stories): update StoryViewer for real network media and view tracking"
```

---

## Task 7: Wire `_YourStoryCircle` camera shortcut to upload screen

**Files:**
- Modify: `lib/screens/new_home_dashboard.dart`

The camera shortcut in the bottom sheet (`_showUploadChoice`) currently calls `_openCamera()` which stores the image locally. Replace it to navigate to `/story-upload` with the captured file pre-loaded.

- [ ] **Step 1: Find `_showUploadChoice` inside `_YourStoryCircleState` and remove it**

The new `_YourStoryCircle` is now a `StatelessWidget` (from Task 5). Remove the old `_YourStoryCircleState` entirely — it's already been replaced.

Verify the old state class is gone:

```bash
grep -n "_YourStoryCircleState\|_openCamera\|_showUploadChoice\|_storyImage" lib/screens/new_home_dashboard.dart
```

Expected: no output. If found, delete those methods/fields.

- [ ] **Step 2: `flutter analyze`**

```bash
flutter analyze lib/screens/new_home_dashboard.dart
```

Expected: 0 errors. Fix any type mismatches (e.g. `_SportsStoryRow` now extends `ConsumerStatefulWidget` — ensure `createState` returns `ConsumerState`).

- [ ] **Step 3: Commit**

```bash
git add lib/screens/new_home_dashboard.dart
git commit -m "chore(stories): remove stale camera capture code from YourStoryCircle"
```

---

## Task 8: Final compile and smoke test

- [ ] **Step 1: Run analyzer**

```bash
flutter analyze
```

Expected: 0 errors, warnings acceptable.

- [ ] **Step 2: Verify all imports resolve**

```bash
grep -rn "import.*story" lib/ | grep -v ".dart.snapshot"
```

Confirm `story_model.dart`, `story_service.dart`, `story_provider.dart`, `story_upload_screen.dart` are all importable.

- [ ] **Step 3: Hot-restart and check home screen**

- Story row should show a loading shimmer, then real circles from the backend
- `_YourStoryCircle` should show the "+" ring
- Tapping another user's circle should open the full-screen `_StoryViewer`
- Tapping "+" should navigate to `/story-upload`
- Uploading a photo should go through the 3-step R2 flow and refresh the feed

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(stories): complete stories integration — feed, upload, viewer, view tracking"
```

---

## Self-Review Checklist

- [x] **Upload flow is 3-step**: getUploadUrl → PUT to R2 (not backend) → confirmUpload. Matches backend controller exactly.
- [x] **Feed response shape**: `{ success, stories: [{ author, stories: [] }] }` — `StoryGroup.fromJson` handles this.
- [x] **Current user first**: backend guarantees this; `_SportsStoryRow` separates `myGroup` from `otherGroups`.
- [x] **View tracking**: `onViewed` callback called on page open, deduplicated by `_trackedIds` set. REST call is fire-and-forget.
- [x] **Video stories**: `_StoryPageContent` shows a placeholder for videos (full HLS player is a future enhancement — requires `video_player` integration with `hlsUrl`).
- [x] **TTL expiry**: handled server-side by MongoDB TTL index — no client-side expiry logic needed.
- [x] **No mock data remains**: `_sports` constant deleted, `_SportsStoryRow` reads from Riverpod.
- [x] **`_YourStoryCircle` is stateless**: no local camera capture state remains.
