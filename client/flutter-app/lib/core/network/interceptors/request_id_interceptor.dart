import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';

/// Tags every outgoing request with an `X-Request-Id` (UUID v4).
/// The Kridaz backend (post-§14) echoes this back in the response and
/// logs it to Sentry, so attaching it on the client lets us correlate a
/// Flutter crash report with a server log in one search.
class RequestIdInterceptor extends Interceptor {
  static const headerName = 'X-Request-Id';
  static const _uuid = Uuid();

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    options.headers.putIfAbsent(headerName, _uuid.v4);
    handler.next(options);
  }
}
