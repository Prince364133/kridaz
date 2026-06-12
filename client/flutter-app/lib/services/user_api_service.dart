import 'dart:io';
import 'api_service.dart';
import '../models/user_profile.dart';

/// User API Service — Kridaz backend integration
class UserApiService {
  final ApiService _apiService = ApiService();

  /// Create a new user in the backend
  Future<ApiResponse<UserProfile>> createUser(
      Map<String, dynamic> userData) async {
    final response = await _apiService.post<Map<String, dynamic>>(
      '/user/auth/register',
      data: userData,
    );

    if (response.isSuccess && response.data != null) {
      return ApiResponse.success(UserProfile.fromJson(response.data!));
    }

    return ApiResponse.error(response.error ?? 'Failed to create user');
  }

  /// Get user by ID
  Future<ApiResponse<UserProfile>> getUserById(String id) async {
    final response = await _apiService.get<Map<String, dynamic>>(
      '/user/auth/me',
      useCache: true,
    );

    if (response.isSuccess && response.data != null) {
      final data = response.data as Map<String, dynamic>;
      final user = data['user'] as Map<String, dynamic>?;
      if (user != null) {
        return ApiResponse.success(UserProfile.fromJson(user));
      }
    }

    return ApiResponse.error(response.error ?? 'Failed to get user');
  }

  /// Update user profile
  Future<ApiResponse<UserProfile>> updateUser(
    String id,
    Map<String, dynamic> updates,
  ) async {
    final response = await _apiService.put<Map<String, dynamic>>(
      '/user/profile',
      data: updates,
    );

    if (response.isSuccess && response.data != null) {
      _apiService.clearCache();
      return ApiResponse.success(UserProfile.fromJson(response.data!));
    }

    return ApiResponse.error(response.error ?? 'Failed to update user');
  }

  /// Delete user account
  Future<ApiResponse<void>> deleteUser(String id) async {
    final response = await _apiService.delete<Map<String, dynamic>>(
      '/user/profile',
    );

    if (response.isSuccess) {
      _apiService.clearCache();
      return ApiResponse.success(null);
    }

    return ApiResponse.error(response.error ?? 'Failed to delete user');
  }

  /// Update user profile with file upload
  Future<ApiResponse<UserProfile>> updateUserWithPhoto(
    String id,
    Map<String, dynamic> updates,
    File? photoFile,
  ) async {
    if (photoFile != null) {
      final uploadResponse = await _apiService.uploadFile<Map<String, dynamic>>(
        '/upload',
        photoFile,
        fieldName: 'file',
      );

      if (uploadResponse.isSuccess && uploadResponse.data != null) {
        updates['photoURL'] = uploadResponse.data!['url'];
      }
    }

    return await updateUser(id, updates);
  }
}
