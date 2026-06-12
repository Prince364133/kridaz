import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/core_providers.dart';
import '../../../data/datasources/remote/wallet_remote_ds.dart';
import '../../../data/repositories/wallet_repository_impl.dart';
import '../../../domain/repositories/wallet_repository.dart';
import '../../../domain/usecases/get_wallet_usecase.dart';

final walletRemoteDsProvider = Provider<WalletRemoteDataSource>((ref) {
  return WalletRemoteDataSource(ref.watch(apiClientProvider));
});

final walletRepositoryProvider = Provider<WalletRepository>((ref) {
  return WalletRepositoryImpl(ref.watch(walletRemoteDsProvider));
});

final getWalletUseCaseProvider = Provider<GetWalletUseCase>((ref) {
  return GetWalletUseCase(ref.watch(walletRepositoryProvider));
});
