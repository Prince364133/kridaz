import '../../core/error/result.dart';
import '../entities/auth_session.dart';
import '../entities/user.dart';

/// Abstract contract the presentation/usecases code depends on.
/// Implementation lives in `data/repositories/auth_repository_impl.dart`.
///
/// Keep this file PURE Dart — no Dio, no Riverpod, no Flutter.
abstract class AuthRepository {
  Future<Result<AuthSession>> login({
    required String emailOrPhone,
    required String password,
  });

  Future<Result<AuthSession>> loginWithGoogle({
    required String idToken,
    String? requestedRole,
  });

  Future<Result<AuthSession>> register({
    required String name,
    required String email,
    required String phone,
    required String password,
    required String registrationToken,
  });

  Future<Result<void>> sendOtp({String? email, String? phone});

  Future<Result<String>> verifyOtp({
    String? email,
    String? phone,
    required String otp,
  });

  Future<Result<void>> requestPasswordResetOtp({required String emailOrPhone});

  Future<Result<void>> resetPassword({
    required String emailOrPhone,
    required String otp,
    required String newPassword,
  });

  Future<Result<User>> getCurrentUser();

  Future<Result<void>> logout();
}
