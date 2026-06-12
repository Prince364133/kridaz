import 'package:logger/logger.dart';

/// Phone Auth Service — stubbed out, Firebase removed.
/// OTP is now handled by AuthManager.sendOtp() which calls the Kridaz backend.
/// This class is retained so existing screen code still compiles without changes.
class PhoneAuthService {
  final Logger _logger = Logger();

  Future<PhoneAuthResult> sendOTP({
    required String phoneNumber,
    required Function(Map<String, dynamic>) onAutoVerify,
    required Function(String error) onError,
    int? resendToken,
  }) async {
    _logger
        .i('OTP send requested for $phoneNumber — use AuthManager.sendOtp()');
    return PhoneAuthResult.success('OTP requested');
  }

  Future<PhoneAuthResult> verifyOTP({
    required String otpCode,
    String? verificationId,
  }) async {
    return PhoneAuthResult.error(
        'Use AuthManager.register() for full OTP verification');
  }

  Future<PhoneAuthResult> signInWithCredential(
      Map<String, dynamic> credential) async {
    return PhoneAuthResult.error('Use AuthManager.loginWithEmail() instead');
  }

  Future<PhoneAuthResult> resendOTP({
    required String phoneNumber,
    required Function(Map<String, dynamic>) onAutoVerify,
    required Function(String error) onError,
  }) async {
    return sendOTP(
      phoneNumber: phoneNumber,
      onAutoVerify: onAutoVerify,
      onError: onError,
    );
  }

  String? get verificationId => null;

  String formatPhoneNumber(String phoneNumber, String countryCode) {
    final digitsOnly = phoneNumber.replaceAll(RegExp(r'\D'), '');
    final ccDigits = countryCode.replaceAll(RegExp(r'\D'), '');
    if (digitsOnly.startsWith(ccDigits)) return '+$digitsOnly';
    return '$countryCode$digitsOnly';
  }

  bool isValidPhoneNumber(String phoneNumber) {
    return RegExp(r'^\+[1-9]\d{1,14}$').hasMatch(phoneNumber);
  }
}

class PhoneAuthResult {
  final bool isSuccess;
  final String message;
  final Map<String, dynamic>? user;
  final int? resendToken;

  PhoneAuthResult._({
    required this.isSuccess,
    required this.message,
    this.user,
    this.resendToken,
  });

  factory PhoneAuthResult.success(
    String message, {
    Map<String, dynamic>? user,
    int? resendToken,
  }) =>
      PhoneAuthResult._(
          isSuccess: true,
          message: message,
          user: user,
          resendToken: resendToken);

  factory PhoneAuthResult.error(String message) =>
      PhoneAuthResult._(isSuccess: false, message: message);
}

class CountryCodes {
  static const Map<String, String> codes = {
    'US': '+1',
    'IN': '+91',
    'GB': '+44',
    'CA': '+1',
    'AU': '+61',
    'DE': '+49',
    'FR': '+33',
    'IT': '+39',
    'ES': '+34',
    'BR': '+55',
    'MX': '+52',
    'JP': '+81',
    'CN': '+86',
    'KR': '+82',
    'SG': '+65',
    'AE': '+971',
    'SA': '+966',
    'ZA': '+27',
    'NG': '+234',
    'EG': '+20',
  };

  static String getCode(String countryCode) =>
      codes[countryCode.toUpperCase()] ?? '+1';

  static List<CountryCode> getAllCodes() => codes.entries
      .map((e) => CountryCode(code: e.key, dialCode: e.value))
      .toList();
}

class CountryCode {
  final String code;
  final String dialCode;

  CountryCode({required this.code, required this.dialCode});

  String get displayText => '$code ($dialCode)';
}
