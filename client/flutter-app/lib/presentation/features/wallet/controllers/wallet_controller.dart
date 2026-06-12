import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/error/failures.dart';
import '../../../../domain/entities/wallet.dart';
import '../wallet_providers.dart';

/// `AsyncValue<Wallet>`-shaped controller. UI patterns:
///   • `state.when(data:..., loading:..., error:...)`
///   • Call `ref.read(walletControllerProvider.notifier).refresh()` on
///     pull-to-refresh.
class WalletController extends AutoDisposeAsyncNotifier<Wallet> {
  @override
  Future<Wallet> build() async {
    final usecase = ref.read(getWalletUseCaseProvider);
    final result = await usecase();
    return result.fold(
      (wallet) => wallet,
      (Failure f) => throw f,
    );
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final result = await ref.read(getWalletUseCaseProvider).call();
      return result.fold(
        (wallet) => wallet,
        (Failure f) => throw f,
      );
    });
  }
}

final walletControllerProvider =
    AsyncNotifierProvider.autoDispose<WalletController, Wallet>(
  WalletController.new,
);
