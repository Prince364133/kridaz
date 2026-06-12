import 'dart:async';
import 'dart:math';

import 'package:dio/dio.dart';

/// Exponential-backoff retry for transient transport failures.
///
/// What retries:
///   • DioExceptionType.connectionTimeout / receiveTimeout / sendTimeout
///   • DioExceptionType.connectionError (DNS, socket reset, etc.)
///   • 5xx server responses
///
/// What does NOT retry:
///   • Any 4xx (incl. 401 — that's AuthInterceptor's job)
///   • POST/PUT/PATCH/DELETE without an `Idempotency-Key` header — replaying
///     a mutating request can double-charge / double-write. Pass the header
///     yourself when you've made the call safe to retry.
class RetryInterceptor extends Interceptor {
  final Dio dio;
  final int maxAttempts;
  final Duration baseDelay;

  RetryInterceptor({
    required this.dio,
    this.maxAttempts = 3,
    this.baseDelay = const Duration(milliseconds: 400),
  });

  static const _attemptKey = '_retry_attempt';

  bool _isMutating(String method) {
    final m = method.toUpperCase();
    return m == 'POST' || m == 'PUT' || m == 'PATCH' || m == 'DELETE';
  }

  bool _shouldRetry(DioException err) {
    if (err.type == DioExceptionType.cancel) return false;

    final transport = err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.sendTimeout ||
        err.type == DioExceptionType.connectionError;

    final serverError = err.response?.statusCode != null &&
        err.response!.statusCode! >= 500 &&
        err.response!.statusCode! < 600;

    if (!transport && !serverError) return false;

    final method = err.requestOptions.method;
    if (_isMutating(method)) {
      final hasIdem = err.requestOptions.headers.keys
          .any((k) => k.toLowerCase() == 'idempotency-key');
      if (!hasIdem) return false;
    }
    return true;
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (!_shouldRetry(err)) return handler.next(err);

    final attempt = (err.requestOptions.extra[_attemptKey] as int? ?? 0) + 1;
    if (attempt > maxAttempts) return handler.next(err);

    // Exponential backoff with jitter: base * 2^(n-1) ± 25%.
    final exp = baseDelay * pow(2, attempt - 1).toInt();
    final jitterMs =
        Random().nextInt((exp.inMilliseconds * 0.25).round().clamp(1, 10000));
    final delay = exp + Duration(milliseconds: jitterMs);
    await Future<void>.delayed(delay);

    try {
      final req = err.requestOptions..extra[_attemptKey] = attempt;
      final resp = await dio.fetch<dynamic>(req);
      handler.resolve(resp);
    } on DioException catch (e) {
      handler.next(e);
    }
  }
}
