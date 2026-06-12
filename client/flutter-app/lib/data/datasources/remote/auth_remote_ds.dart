import '../../../core/network/api_client.dart';
import '../../models/auth/auth_response_dto.dart';
import '../../models/auth/user_dto.dart';

/// Thin wrapper around the auth HTTP endpoints. ONLY responsibilities:
///   • know the endpoint URLs
///   • shape request bodies
///   • parse response DTOs
///
/// It must NOT contain business rules, token storage, or error mapping —
/// those belong in [AuthRepositoryImpl].
class AuthRemoteDataSource {
  final ApiClient _client;

  AuthRemoteDataSource(this._client);

  static const _basePathUser = '/user/auth';

  Future<AuthResponseDto> login({
    required String emailOrPhone,
    required String password,
  }) {
    return _client.postData<AuthResponseDto>(
      '$_basePathUser/login-step1',
      body: {'email': emailOrPhone, 'password': password},
      fromJsonT: (data) =>
          AuthResponseDto.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<AuthResponseDto> googleAuth({
    required String credential,
    String? requestedRole,
  }) {
    return _client.postData<AuthResponseDto>(
      '$_basePathUser/google-auth',
      body: {
        'credential': credential,
        if (requestedRole != null) 'role': requestedRole,
      },
      fromJsonT: (data) =>
          AuthResponseDto.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<AuthResponseDto> register({
    required String name,
    required String email,
    required String phone,
    required String password,
    required String registrationToken,
  }) {
    return _client.postData<AuthResponseDto>(
      '$_basePathUser/register',
      body: {
        'name': name,
        'email': email,
        'phone': phone,
        'password': password,
        'registrationToken': registrationToken,
      },
      fromJsonT: (data) =>
          AuthResponseDto.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<void> sendOtp({String? email, String? phone}) {
    return _client.postData<void>(
      '$_basePathUser/send-otp',
      body: {
        if (email != null) 'email': email,
        if (phone != null) 'phone': phone,
      },
      fromJsonT: (_) {},
    );
  }

  Future<String> verifyOtp({
    String? email,
    String? phone,
    required String otp,
  }) {
    return _client.postData<String>(
      '$_basePathUser/verify-otp',
      body: {
        if (email != null) 'email': email,
        if (phone != null) 'phone': phone,
        'otp': otp,
      },
      fromJsonT: (data) {
        if (data is Map<String, dynamic>) {
          return (data['registrationToken'] ?? '') as String;
        }
        return '';
      },
    );
  }

  Future<void> requestPasswordResetOtp({required String emailOrPhone}) {
    return _client.postData<void>(
      '$_basePathUser/forgot-password-otp',
      body: {'email': emailOrPhone},
      fromJsonT: (_) {},
    );
  }

  Future<void> resetPassword({
    required String emailOrPhone,
    required String otp,
    required String newPassword,
  }) {
    return _client.postData<void>(
      '$_basePathUser/reset-password',
      body: {'email': emailOrPhone, 'otp': otp, 'newPassword': newPassword},
      fromJsonT: (_) {},
    );
  }

  Future<UserDto> getMe() {
    return _client.getData<UserDto>(
      '$_basePathUser/me',
      fromJsonT: (data) {
        // Tolerate both new shape ({ user: {...} }) and direct user object.
        final map = data as Map<String, dynamic>;
        final userJson = (map['user'] ?? map) as Map<String, dynamic>;
        return UserDto.fromJson(userJson);
      },
    );
  }

  Future<void> logout() {
    return _client.postData<void>(
      '$_basePathUser/logout',
      body: const {},
      fromJsonT: (_) {},
    );
  }
}
