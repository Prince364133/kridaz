import 'package:dio/dio.dart';

import '../api_exception.dart';

/// Last interceptor in the error chain — normalizes any [DioException] into
/// an [ApiException] so callers only ever catch one exception type.
///
/// Reads `error.code` from the server envelope (post-§4) when present,
/// otherwise falls back to a synthetic transport code.
class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final apiErr = _toApiException(err);

    handler.reject(
      DioException(
        requestOptions: err.requestOptions,
        type: err.type,
        response: err.response,
        error: apiErr,
        message: apiErr.message,
        stackTrace: err.stackTrace,
      ),
    );
  }

  ApiException _toApiException(DioException err) {
    final status = err.response?.statusCode;
    final body = err.response?.data;
    final requestId = err.response?.headers.value('x-request-id');

    if (body is Map<String, dynamic>) {
      final errorBlock = body['error'];
      if (errorBlock is Map) {
        return ApiException(
          code: (errorBlock['code'] ?? ApiException.codeUnknown).toString(),
          message: (errorBlock['message'] ?? 'Request failed').toString(),
          statusCode: status,
          details: errorBlock['details'] is Map<String, dynamic>
              ? errorBlock['details'] as Map<String, dynamic>
              : null,
          requestId: requestId,
        );
      }
      // Legacy shape: { success:false, message:'...' }
      if (body['message'] is String) {
        return ApiException(
          code: _legacyCodeFromStatus(status),
          message: body['message'] as String,
          statusCode: status,
          requestId: requestId,
        );
      }
    }

    switch (err.type) {
      case DioExceptionType.cancel:
        return ApiException(
          code: ApiException.codeCancelled,
          message: 'Request cancelled',
          requestId: requestId,
        );
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return ApiException(
          code: ApiException.codeTimeout,
          message: 'Request timed out — check your connection',
          statusCode: status,
          requestId: requestId,
        );
      case DioExceptionType.connectionError:
        return ApiException(
          code: ApiException.codeNetwork,
          message: 'No internet connection',
          requestId: requestId,
        );
      case DioExceptionType.badCertificate:
      case DioExceptionType.badResponse:
      case DioExceptionType.unknown:
        return ApiException(
          code: ApiException.codeBadResponse,
          message: err.message ?? 'Unexpected server response',
          statusCode: status,
          requestId: requestId,
        );
    }
  }

  String _legacyCodeFromStatus(int? status) {
    if (status == null) return ApiException.codeUnknown;
    if (status == 401) return ApiException.codeInvalidToken;
    if (status == 403) return ApiException.codeForbidden;
    if (status == 404) return ApiException.codeNotFound;
    if (status == 422) return ApiException.codeValidationFailed;
    if (status >= 500) return ApiException.codeBadResponse;
    return ApiException.codeUnknown;
  }
}
