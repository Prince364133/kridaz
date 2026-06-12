import '../../core/error/exception_mapper.dart';
import '../../core/error/result.dart';
import '../../domain/entities/wallet.dart';
import '../../domain/repositories/wallet_repository.dart';
import '../datasources/remote/wallet_remote_ds.dart';

class WalletRepositoryImpl implements WalletRepository {
  final WalletRemoteDataSource _remote;

  WalletRepositoryImpl(this._remote);

  @override
  Future<Result<Wallet>> getWallet() async {
    try {
      final dto = await _remote.getWallet();
      return Ok(dto.toDomain());
    } catch (e, st) {
      return Err(mapToFailure(e, st));
    }
  }
}
