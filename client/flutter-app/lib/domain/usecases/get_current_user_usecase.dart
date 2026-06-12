import '../../core/error/result.dart';
import '../entities/user.dart';
import '../repositories/auth_repository.dart';

class GetCurrentUserUseCase {
  final AuthRepository _repo;

  GetCurrentUserUseCase(this._repo);

  Future<Result<User>> call() => _repo.getCurrentUser();
}
