import '../network/api_exception.dart';

/// Sealed [Failure] hierarchy returned by repositories. UI/controllers
/// pattern-match on the concrete subtype to render the right message —
/// they never need to know about [ApiException] or [DioException].
///
/// Why sealed (vs. throwing): repositories return `Result<T, Failure>` so
/// failure paths are part of the type signature. The controller can't
/// forget to handle them like it could a `try/catch`.
sealed class Failure {
  final String message;
  final String? code;
  final String? requestId;

  const Failure(this.message, {this.code, this.requestId});

  @override
  String toString() => '$runtimeType($code): $message';
}

/// Lost connection / no internet / DNS failure / timeout.
class NetworkFailure extends Failure {
  const NetworkFailure(super.message, {super.code, super.requestId});
}

/// Server returned 5xx, malformed JSON, or otherwise upstream-broken.
class ServerFailure extends Failure {
  final int? statusCode;
  const ServerFailure(
    super.message, {
    this.statusCode,
    super.code,
    super.requestId,
  });
}

/// Login/refresh/permission failures. UI typically routes to /login.
class AuthFailure extends Failure {
  const AuthFailure(super.message, {super.code, super.requestId});
}

/// Server rejected the request body — `details` carries field-level info
/// when the backend provides it (post-§4).
class ValidationFailure extends Failure {
  final Map<String, dynamic>? fields;
  const ValidationFailure(
    super.message, {
    this.fields,
    super.code,
    super.requestId,
  });
}

/// Resource doesn't exist (404).
class NotFoundFailure extends Failure {
  const NotFoundFailure(super.message, {super.code, super.requestId});
}

/// Rate limited (429) or temporarily throttled.
class RateLimitFailure extends Failure {
  const RateLimitFailure(super.message, {super.code, super.requestId});
}

/// Razorpay/wallet/payment-specific failure.
class PaymentFailure extends Failure {
  const PaymentFailure(super.message, {super.code, super.requestId});
}

/// Anything we couldn't classify. Treat as a bug — surface to Sentry.
class UnknownFailure extends Failure {
  const UnknownFailure(super.message, {super.code, super.requestId});
}
