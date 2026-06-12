import '../../core/error/exception_mapper.dart';
import '../../core/error/result.dart';
import '../../core/storage/secure_token_store.dart';
import '../../domain/entities/auth_session.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/remote/auth_remote_ds.dart';
import '../models/auth/auth_response_dto.dart';

/// Concrete implementation of [AuthRepository]. Composes the remote
/// datasource with the secure token store so tokens are persisted as part
/// of a successful auth flow (single atomic-ish operation from the
/// controller's POV).
class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remote;
  final SecureTokenStore _tokens;

  AuthRepositoryImpl({
    required AuthRemoteDataSource remote,
    required SecureTokenStore tokens,
  })  : _remote = remote,
        _tokens = tokens;

  Future<AuthSession> _persist(AuthResponseDto dto) async {
    final tokens = dto.effectiveTokens;
    final access = tokens.effectiveAccess;
    final refresh = tokens.refreshToken ?? '';

    if (access.isNotEmpty && refresh.isNotEmpty) {
      await _tokens.save(
        access: access,
        refresh: refresh,
        expiresAt: tokens.resolveAccessExpiresAt,
      );
    }

    return AuthSession(
      user: dto.user.toDomain(),
      accessToken: access,
      refreshToken: refresh,
      accessTokenExpiresAt: tokens.resolveAccessExpiresAt,
      refreshTokenExpiresAt: tokens.resolveRefreshExpiresAt,
    );
  }

  @override
  Future<Result<AuthSession>> login({
    required String emailOrPhone,
    required String password,
  }) async {
    try {
      final dto = await _remote.login(
        emailOrPhone: emailOrPhone,
        password: password,
      );
      return Ok(await _persist(dto));
    } catch (e, st) {
      return Err(mapToFailure(e, st));
    }
  }

  @override
  Future<Result<AuthSession>> loginWithGoogle({
    required String idToken,
    String? requestedRole,
  }) async {
    try {
      final dto = await _remote.googleAuth(
        credential: idToken,
        requestedRole: requestedRole,
      );
      return Ok(await _persist(dto));
    } catch (e, st) {
      return Err(mapToFailure(e, st));
    }
  }

  @override
  Future<Result<AuthSession>> register({
    required String name,
    required String email,
    required String phone,
    required String password,
    required String registrationToken,
  }) async {
    try {
      final dto = await _remote.register(
        name: name,
        email: email,
        phone: phone,
        password: password,
        registrationToken: registrationToken,
      );
      return Ok(await _persist(dto));
    } catch (e, st) {
      return Err(mapToFailure(e, st));
    }
  }

  @override
  Future<Result<void>> sendOtp({String? email, String? phone}) async {
    try {
      await _remote.sendOtp(email: email, phone: phone);
      return const Ok(null);
    } catch (e, st) {
      return Err(mapToFailure(e, st));
    }
  }

  @override
  Future<Result<String>> verifyOtp({
    String? email,
    String? phone,
    required String otp,
  }) async {
    try {
      final token =
          await _remote.verifyOtp(email: email, phone: phone, otp: otp);
      return Ok(token);
    } catch (e, st) {
      return Err(mapToFailure(e, st));
    }
  }

  @override
  Future<Result<void>> requestPasswordResetOtp({
    required String emailOrPhone,
  }) async {
    try {
      await _remote.requestPasswordResetOtp(emailOrPhone: emailOrPhone);
      return const Ok(null);
    } catch (e, st) {
      return Err(mapToFailure(e, st));
    }
  }

  @override
  Future<Result<void>> resetPassword({
    required String emailOrPhone,
    required String otp,
    required String newPassword,
  }) async {
    try {
      await _remote.resetPassword(
        emailOrPhone: emailOrPhone,
        otp: otp,
        newPassword: newPassword,
      );
      return const Ok(null);
    } catch (e, st) {
      return Err(mapToFailure(e, st));
    }
  }

  @override
  Future<Result<User>> getCurrentUser() async {
    try {
      final dto = await _remote.getMe();
      return Ok(dto.toDomain());
    } catch (e, st) {
      return Err(mapToFailure(e, st));
    }
  }

  @override
  Future<Result<void>> logout() async {
    try {
      await _remote.logout();
    } catch (_) {
      // Even if the server call fails, we still want to wipe local state.
    }
    await _tokens.clear();
    return const Ok(null);
  }
}
