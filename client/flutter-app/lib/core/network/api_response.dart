import 'api_exception.dart';

/// Server envelope: every backend response is shaped as
/// `{ success, data, error, meta }` (post-§1 standardization in the
/// Kridaz backend audit). This is the typed wrapper Flutter sees.
class ApiResponse<T> {
  final bool success;
  final T? data;
  final ApiErrorPayload? error;
  final ApiMeta? meta;

  const ApiResponse({
    required this.success,
    this.data,
    this.error,
    this.meta,
  });

  bool get isSuccess => success && error == null;

  /// Throws ApiException if the envelope reports failure.
  T unwrap() {
    if (!isSuccess) {
      throw ApiException(
        code: error?.code ?? 'UNKNOWN',
        message: error?.message ?? 'Unknown error',
        details: error?.details,
      );
    }
    if (data == null) {
      throw const ApiException(
        code: 'EMPTY_RESPONSE',
        message: 'Server returned no data',
      );
    }
    return data as T;
  }

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Object? data) fromJsonT,
  ) {
    return ApiResponse<T>(
      success: json['success'] == true,
      data: json['data'] == null ? null : fromJsonT(json['data']),
      error: json['error'] == null
          ? null
          : ApiErrorPayload.fromJson(json['error'] as Map<String, dynamic>),
      meta: json['meta'] == null
          ? null
          : ApiMeta.fromJson(json['meta'] as Map<String, dynamic>),
    );
  }

  /// Backward-compat shim for legacy backend responses that put `user`,
  /// `token`, `role`, etc. at the top level instead of inside `data`.
  /// Use this only while migrating off the old envelope.
  factory ApiResponse.legacy(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic> root) fromRoot,
  ) {
    final ok = json['success'] != false; // legacy success defaults to true
    return ApiResponse<T>(
      success: ok,
      data: ok ? fromRoot(json) : null,
      error: ok
          ? null
          : ApiErrorPayload(
              code: 'LEGACY_ERROR',
              message: (json['message'] ?? 'Error').toString(),
            ),
    );
  }
}

class ApiErrorPayload {
  final String code;
  final String message;
  final Map<String, dynamic>? details;

  const ApiErrorPayload({
    required this.code,
    required this.message,
    this.details,
  });

  factory ApiErrorPayload.fromJson(Map<String, dynamic> json) =>
      ApiErrorPayload(
        code: (json['code'] ?? 'UNKNOWN').toString(),
        message: (json['message'] ?? '').toString(),
        details: json['details'] as Map<String, dynamic>?,
      );
}

class ApiMeta {
  final String? requestId;
  final DateTime? timestamp;

  const ApiMeta({this.requestId, this.timestamp});

  factory ApiMeta.fromJson(Map<String, dynamic> json) => ApiMeta(
        requestId: json['requestId'] as String?,
        timestamp: json['timestamp'] == null
            ? null
            : DateTime.tryParse(json['timestamp'].toString()),
      );
}

/// Standard pagination envelope returned inside `data` for list endpoints.
class Paginated<T> {
  final List<T> items;
  final int page;
  final int limit;
  final int totalItems;
  final int totalPages;
  final bool hasMore;
  final String? nextCursor;

  const Paginated({
    required this.items,
    required this.page,
    required this.limit,
    required this.totalItems,
    required this.totalPages,
    required this.hasMore,
    this.nextCursor,
  });

  factory Paginated.fromJson(
    Map<String, dynamic> json,
    T Function(Object? item) fromJsonT,
  ) {
    final pagination = (json['pagination'] ?? const {}) as Map<String, dynamic>;
    return Paginated<T>(
      items: ((json['items'] ?? const []) as List).map(fromJsonT).toList(),
      page: (pagination['page'] ?? 1) as int,
      limit: (pagination['limit'] ?? 20) as int,
      totalItems: (pagination['totalItems'] ?? 0) as int,
      totalPages: (pagination['totalPages'] ?? 1) as int,
      hasMore: pagination['hasMore'] == true,
      nextCursor: pagination['nextCursor'] as String?,
    );
  }
}
