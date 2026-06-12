import '../../core/error/result.dart';
import '../entities/wallet.dart';

abstract class WalletRepository {
  Future<Result<Wallet>> getWallet();
}
