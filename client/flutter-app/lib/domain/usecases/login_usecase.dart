import '../../core/error/result.dart';
import '../entities/auth_session.dart';
import '../repositories/auth_repository.dart';

/// One usecase = one verb the user can perform.
///
/// Controllers depend on usecases, not repositories directly. This keeps
/// presentation logic decoupled from the data shape (we could swap
/// "login via email" for "login via passkey" without touching any UI).
class LoginUseCase {
  final AuthRepository _repo;

  LoginUseCase(this._repo);

  Future<Result<AuthSession>> call({
    required String emailOrPhone,
    required String password,
  }) {
    return _repo.login(
      emailOrPhone: emailOrPhone.trim().toLowerCase(),
      password: password,
    );
  }
}
