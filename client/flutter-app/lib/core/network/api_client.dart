import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';

import '../../config/api_config.dart';
import '../storage/secure_token_store.dart';
import 'api_exception.dart';
import 'api_response.dart';
import 'cert_pinning.dart';
import 'interceptors/auth_interceptor.dart';
import 'interceptors/error_interceptor.dart';
import 'interceptors/etag_interceptor.dart';
import 'interceptors/request_id_interceptor.dart';
import 'interceptors/retry_interceptor.dart';

/// Single Dio facade used by every remote datasource.
///
/// Construction wires the canonical interceptor chain (request-id → auth →
/// retry → error → logging). The optional [refreshDio] is a sibling Dio
/// instance with NO auth interceptor — passed to [AuthInterceptor] so a
/// refresh call can't recursively trigger itself on 401.
class ApiClient {
  final Dio _dio;

  ApiClient._(this._dio);

  Dio get raw => _dio;

  factory ApiClient.build({required SecureTokenStore tokenStore}) {
    final baseOptions = BaseOptions(
      baseUrl: ApiConfig.apiUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      sendTimeout: const Duration(seconds: 15),
      headers: const {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // We treat anything outside 2xx as a Dio error so the error
      // interceptor can normalize it into ApiException uniformly — except
      // 304, which EtagInterceptor needs to handle in the success chain so
      // it can substitute the cached body.
      validateStatus: (status) =>
          status != null && ((status >= 200 && status < 300) || status == 304),
    );

    final dio = Dio(baseOptions);
    final refreshDio = Dio(baseOptions.copyWith());

    CertPinning.apply(dio);
    CertPinning.apply(refreshDio);

    dio.interceptors.addAll([
      RequestIdInterceptor(),
      AuthInterceptor(tokenStore: tokenStore, refreshDio: refreshDio, dio: dio),
      EtagInterceptor(),
      RetryInterceptor(dio: dio),
      ErrorInterceptor(),
      if (kDebugMode)
        PrettyDioLogger(
          requestHeader: true,
          requestBody: true,
          responseHeader: false,
          responseBody: true,
          error: true,
          compact: true,
          maxWidth: 100,
        ),
    ]);

    return ApiClient._(dio);
  }

  // ── Typed helpers ────────────────────────────────────────────────────────
  // Repositories normally use these instead of dio.get/post directly so the
  // envelope shape is enforced at one boundary.

  /// GET → unwrap envelope → return `data` deserialized via [fromJsonT].
  Future<T> getData<T>(
    String path, {
    Map<String, dynamic>? query,
    Options? options,
    CancelToken? cancelToken,
    required T Function(Object? data) fromJsonT,
  }) async {
    final resp = await _dio.get<Map<String, dynamic>>(
      path,
      queryParameters: query,
      options: options,
      cancelToken: cancelToken,
    );
    return ApiResponse<T>.fromJson(resp.data ?? const {}, fromJsonT).unwrap();
  }

  /// POST → unwrap envelope → return `data` deserialized via [fromJsonT].
  Future<T> postData<T>(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Options? options,
    CancelToken? cancelToken,
    required T Function(Object? data) fromJsonT,
  }) async {
    final resp = await _dio.post<Map<String, dynamic>>(
      path,
      data: body,
      queryParameters: query,
      options: options,
      cancelToken: cancelToken,
    );
    return ApiResponse<T>.fromJson(resp.data ?? const {}, fromJsonT).unwrap();
  }

  Future<T> putData<T>(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Options? options,
    CancelToken? cancelToken,
    required T Function(Object? data) fromJsonT,
  }) async {
    final resp = await _dio.put<Map<String, dynamic>>(
      path,
      data: body,
      queryParameters: query,
      options: options,
      cancelToken: cancelToken,
    );
    return ApiResponse<T>.fromJson(resp.data ?? const {}, fromJsonT).unwrap();
  }

  Future<void> delete(
    String path, {
    Map<String, dynamic>? query,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    final resp = await _dio.delete<Map<String, dynamic>>(
      path,
      queryParameters: query,
      options: options,
      cancelToken: cancelToken,
    );
    final env = ApiResponse<void>.fromJson(resp.data ?? const {}, (_) {});
    if (!env.isSuccess) {
      throw ApiException(
        code: env.error?.code ?? ApiException.codeUnknown,
        message: env.error?.message ?? 'Delete failed',
        details: env.error?.details,
      );
    }
  }
}
