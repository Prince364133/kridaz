import 'dart:io' show Platform;
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'api_service.dart';
import 'auth_manager.dart';

/// Sign in with Apple — required on iOS by App Store guideline 4.8 because
/// the app also offers Google Sign-In.
///
/// **Backend dependency**: this service POSTs to `/user/auth/apple-auth`.
/// That endpoint must be added on the kridaz backend with the same response
/// shape as `/user/auth/google-auth` (`{token, user, isNewUser}`). Until then
/// calls will 404 and [signIn] returns an error result.
class AppleAuthService {
  AppleAuthService._();

  /// Whether Apple Sign-In is even available on the current device. iOS only.
  static bool get isAvailable {
    if (!Platform.isIOS) return false;
    return true; // SignInWithApple.isAvailable() also returns Future<bool>.
  }

  /// Trigger the native Apple Sign-In sheet, then hand the resulting
  /// identity token to the backend for verification.
  static Future<AuthResult> signIn() async {
    if (!Platform.isIOS) {
      return AuthResult.error('Apple Sign-In is only available on iOS');
    }
    try {
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );

      final identityToken = credential.identityToken;
      if (identityToken == null || identityToken.isEmpty) {
        return AuthResult.error('Apple did not return an identity token');
      }

      // Backend contract — match google-auth's shape.
      final response = await ApiService()
          .post<Map<String, dynamic>>('/user/auth/apple-auth', data: {
        'identityToken': identityToken,
        'authorizationCode': credential.authorizationCode,
        'fullName': [credential.givenName, credential.familyName]
            .where((p) => (p ?? '').isNotEmpty)
            .join(' '),
        'email': credential.email,
        'userIdentifier': credential.userIdentifier,
      });

      if (!response.isSuccess || response.data == null) {
        return AuthResult.error(
            response.error ?? 'Backend rejected Apple credential');
      }

      final data = response.data!;
      final token = data['token'] as String?;
      final isNew = data['isNewUser'] == true;
      if (token == null || token.isEmpty) {
        return AuthResult.error('Backend did not return a session token');
      }

      // TODO: AuthManager needs a `consumeExternalLogin(token, user)` helper
      // so this service can finalise the session the same way google-auth
      // does. Until then, the caller has to call AuthManager() methods
      // directly after receiving this success.
      return AuthResult.success('Apple Sign-In successful', isNewUser: isNew);
    } on SignInWithAppleAuthorizationException catch (e) {
      if (e.code == AuthorizationErrorCode.canceled) {
        return AuthResult.error('Sign in cancelled');
      }
      return AuthResult.error('Apple Sign-In failed: ${e.message}');
    } catch (e) {
      return AuthResult.error('Apple Sign-In failed: $e');
    }
  }
}
