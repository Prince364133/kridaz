import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/error/failures.dart';
import '../../../../domain/entities/auth_session.dart';
import '../auth_providers.dart';

/// Worked example of a Riverpod controller that consumes the new
/// architecture. Mirror this shape for any other feature controller.
///
/// State: `AsyncValue<AuthSession?>`
///   • `AsyncValue.data(null)`     — idle, not logged in
///   • `AsyncValue.loading()`      — submit in flight
///   • `AsyncValue.data(session)`  — success, router watches and pushes home
///   • `AsyncValue.error(failure)` — UI renders failure.message
class LoginController extends AutoDisposeAsyncNotifier<AuthSession?> {
  @override
  Future<AuthSession?> build() async => null;

  Future<void> submit({
    required String emailOrPhone,
    required String password,
  }) async {
    state = const AsyncValue.loading();
    final usecase = ref.read(loginUseCaseProvider);
    final result = await usecase(
      emailOrPhone: emailOrPhone,
      password: password,
    );

    state = result.fold(
      AsyncValue.data,
      (Failure f) => AsyncValue.error(f, StackTrace.current),
    );
  }
}

final loginControllerProvider =
    AsyncNotifierProvider.autoDispose<LoginController, AuthSession?>(
  LoginController.new,
);
