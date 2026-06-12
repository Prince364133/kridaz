import 'dart:io';
import 'package:path/path.dart' as path;
import 'api_service.dart';

/// Profile-picture upload service.
///
/// Uploads via the canonical backend endpoint that the Kridaz web frontend
/// also uses: `POST /user/auth/profile-picture` (multipart, field "file").
/// Goes through [ApiService] so the request inherits the user's auth token
/// + refresh handling.
abstract class ImageStorageService {
  /// Upload a profile picture and return the resulting URL (or null on failure).
  Future<String?> uploadProfilePicture(File imageFile);
}

class BackendImageStorageService implements ImageStorageService {
  final ApiService _api = ApiService();

  /// Raster formats the Android/iOS native image decoders can handle.
  /// SVG/HEIC/etc. decode to "ImageDecoder: unimplemented" and must be rejected
  /// at upload time so they never get stored and rendered later.
  static const _allowedExtensions = {'.jpg', '.jpeg', '.png', '.webp', '.gif'};

  @override
  Future<String?> uploadProfilePicture(File imageFile) async {
    final ext = path.extension(imageFile.path).toLowerCase();
    if (!_allowedExtensions.contains(ext)) return null;

    final response = await _api.uploadFile<Map<String, dynamic>>(
      '/user/auth/profile-picture',
      imageFile,
    );

    if (!response.isSuccess || response.data == null) return null;
    final data = response.data!;
    // Backend returns one of `{url}`, `{profilePicture}`, or
    // `{user: {profilePicture}}`. Try them in order.
    return data['url']?.toString() ??
        data['profilePicture']?.toString() ??
        (data['user'] as Map<String, dynamic>?)?['profilePicture']?.toString();
  }
}

class ImageStorageFactory {
  static ImageStorageService getService() => BackendImageStorageService();
}
