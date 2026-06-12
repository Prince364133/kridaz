import 'user.dart';

/// Composite returned from successful auth flows. Repositories return
/// this so the controller can persist tokens AND set the user in one go.
class AuthSession {
  final User user;
  final String accessToken;
  final String refreshToken;
  final DateTime accessTokenExpiresAt;
  final DateTime? refreshTokenExpiresAt;

  const AuthSession({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
    required this.accessTokenExpiresAt,
    this.refreshTokenExpiresAt,
  });
}
