import '../../core/error/result.dart';
import '../entities/wallet.dart';
import '../repositories/wallet_repository.dart';

class GetWalletUseCase {
  final WalletRepository _repo;

  GetWalletUseCase(this._repo);

  Future<Result<Wallet>> call() => _repo.getWallet();
}
