/// Thrown by [ApiClient] / repositories when the server returns
/// `success: false` or a transport-layer failure occurs that can't be
/// recovered by interceptors.
///
/// [code] mirrors `error.code` from the backend envelope and should match
/// the canonical set documented in `server/BACKEND_FIXES_FOR_FLUTTER.md`
/// §4 (NO_TOKEN, TOKEN_EXPIRED, INVALID_CREDENTIALS, …).
class ApiException implements Exception {
  final String code;
  final String message;
  final int? statusCode;
  final Map<String, dynamic>? details;
  final String? requestId;

  const ApiException({
    required this.code,
    required this.message,
    this.statusCode,
    this.details,
    this.requestId,
  });

  // ── Network/transport codes (synthetic — server never sends these) ────────
  static const codeNetwork = 'NETWORK_ERROR';
  static const codeTimeout = 'REQUEST_TIMEOUT';
  static const codeCancelled = 'REQUEST_CANCELLED';
  static const codeUnknown = 'UNKNOWN';
  static const codeBadResponse = 'BAD_RESPONSE';

  // ── Server codes (must match backend) ─────────────────────────────────────
  static const codeNoToken = 'NO_TOKEN';
  static const codeTokenExpired = 'TOKEN_EXPIRED';
  static const codeInvalidToken = 'INVALID_TOKEN';
  static const codeInvalidCredentials = 'INVALID_CREDENTIALS';
  static const codeOtpInvalid = 'OTP_INVALID';
  static const codeOtpExpired = 'OTP_EXPIRED';
  static const codeOtpRateLimited = 'OTP_RATE_LIMITED';
  static const codeEmailTaken = 'EMAIL_TAKEN';
  static const codePhoneTaken = 'PHONE_TAKEN';
  static const codeUsernameTaken = 'USERNAME_TAKEN';
  static const codeAccountBlocked = 'ACCOUNT_BLOCKED';
  static const codeValidationFailed = 'VALIDATION_FAILED';
  static const codePaymentFailed = 'PAYMENT_FAILED';
  static const codeInsufficientBalance = 'INSUFFICIENT_BALANCE';
  static const codeNotFound = 'NOT_FOUND';
  static const codeForbidden = 'FORBIDDEN';
  static const codeTokenCompromise = 'TOKEN_COMPROMISE_DETECTED';

  bool get isAuthError =>
      code == codeNoToken ||
      code == codeTokenExpired ||
      code == codeInvalidToken ||
      code == codeForbidden;

  bool get isRetriable =>
      code == codeNetwork ||
      code == codeTimeout ||
      (statusCode != null && statusCode! >= 500 && statusCode! < 600);

  @override
  String toString() =>
      'ApiException($code${statusCode != null ? ' $statusCode' : ''}): $message';
}
