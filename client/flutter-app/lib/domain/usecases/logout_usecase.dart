import '../../core/error/result.dart';
import '../repositories/auth_repository.dart';

class LogoutUseCase {
  final AuthRepository _repo;

  LogoutUseCase(this._repo);

  Future<Result<void>> call() => _repo.logout();
}
