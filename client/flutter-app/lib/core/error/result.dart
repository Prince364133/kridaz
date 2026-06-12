import 'failures.dart';

/// Discriminated union for repository return types.
///
/// Usage:
/// ```dart
/// final result = await repo.login(email, password);
/// switch (result) {
///   case Ok(:final value): ...
///   case Err(:final failure): ...
/// }
/// ```
///
/// Why not just throw? Repositories cross the I/O boundary. Forcing the
/// caller to handle [Err] at compile time stops silent UI freezes from
/// uncaught futures.
sealed class Result<T> {
  const Result();

  bool get isOk => this is Ok<T>;
  bool get isErr => this is Err<T>;

  T? get valueOrNull => switch (this) {
        Ok<T>(:final value) => value,
        Err<T>() => null,
      };

  Failure? get failureOrNull => switch (this) {
        Ok<T>() => null,
        Err<T>(:final failure) => failure,
      };

  R fold<R>(R Function(T value) onOk, R Function(Failure f) onErr) =>
      switch (this) {
        Ok<T>(:final value) => onOk(value),
        Err<T>(:final failure) => onErr(failure),
      };

  Result<R> map<R>(R Function(T value) f) => switch (this) {
        Ok<T>(:final value) => Ok(f(value)),
        Err<T>(:final failure) => Err(failure),
      };
}

class Ok<T> extends Result<T> {
  final T value;
  const Ok(this.value);
}

class Err<T> extends Result<T> {
  final Failure failure;
  const Err(this.failure);
}
