import 'package:dio/dio.dart';

import '../network/api_exception.dart';
import 'failures.dart';

/// Repository-side helper: catches anything thrown by [ApiClient] /
/// [Dio] and turns it into a typed [Failure].
///
/// Keep the mapping table in one place so we don't grow if/else cliffs
/// inside every repository.
Failure mapToFailure(Object error, [StackTrace? _]) {
  if (error is DioException) {
    final inner = error.error;
    if (inner is ApiException) return _fromApi(inner);
    return _fromDio(error);
  }
  if (error is ApiException) return _fromApi(error);
  return UnknownFailure(error.toString());
}

Failure _fromApi(ApiException e) {
  switch (e.code) {
    case ApiException.codeNoToken:
    case ApiException.codeTokenExpired:
    case ApiException.codeInvalidToken:
    case ApiException.codeForbidden:
    case ApiException.codeAccountBlocked:
    case ApiException.codeTokenCompromise:
      return AuthFailure(e.message, code: e.code, requestId: e.requestId);

    case ApiException.codeInvalidCredentials:
    case ApiException.codeOtpInvalid:
    case ApiException.codeOtpExpired:
    case ApiException.codeEmailTaken:
    case ApiException.codePhoneTaken:
    case ApiException.codeUsernameTaken:
    case ApiException.codeValidationFailed:
      return ValidationFailure(
        e.message,
        fields: e.details,
        code: e.code,
        requestId: e.requestId,
      );

    case ApiException.codeOtpRateLimited:
      return RateLimitFailure(e.message, code: e.code, requestId: e.requestId);

    case ApiException.codeNotFound:
      return NotFoundFailure(e.message, code: e.code, requestId: e.requestId);

    case ApiException.codePaymentFailed:
    case ApiException.codeInsufficientBalance:
      return PaymentFailure(e.message, code: e.code, requestId: e.requestId);

    case ApiException.codeNetwork:
    case ApiException.codeTimeout:
      return NetworkFailure(e.message, code: e.code, requestId: e.requestId);

    case ApiException.codeBadResponse:
      return ServerFailure(
        e.message,
        statusCode: e.statusCode,
        code: e.code,
        requestId: e.requestId,
      );

    default:
      if (e.statusCode != null && e.statusCode! >= 500) {
        return ServerFailure(
          e.message,
          statusCode: e.statusCode,
          code: e.code,
          requestId: e.requestId,
        );
      }
      return UnknownFailure(e.message, code: e.code, requestId: e.requestId);
  }
}

Failure _fromDio(DioException e) {
  switch (e.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.receiveTimeout:
    case DioExceptionType.sendTimeout:
      return const NetworkFailure(
        'Request timed out — please check your connection',
        code: ApiException.codeTimeout,
      );
    case DioExceptionType.connectionError:
      return const NetworkFailure(
        'No internet connection',
        code: ApiException.codeNetwork,
      );
    case DioExceptionType.cancel:
      return const UnknownFailure(
        'Request cancelled',
        code: ApiException.codeCancelled,
      );
    case DioExceptionType.badCertificate:
    case DioExceptionType.badResponse:
    case DioExceptionType.unknown:
      return ServerFailure(
        e.message ?? 'Server error',
        statusCode: e.response?.statusCode,
        code: ApiException.codeBadResponse,
      );
  }
}
