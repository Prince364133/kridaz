import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, TargetPlatform;
import 'auth_manager.dart';

class GoogleAuthService {
  late final GoogleSignIn _googleSignIn;

  GoogleAuthService() {
    _googleSignIn = GoogleSignIn(
      clientId: defaultTargetPlatform == TargetPlatform.iOS
          ? '312328302719-9g84j5fk7j7q1nr47330jnnse61t7n0s.apps.googleusercontent.com'
          : null,
      scopes: ['email', 'profile'],
    );
  }

  /// Signs in with Google and authenticates with the Kridaz backend.
  /// Returns the user profile map on success, or null on cancellation/failure.
  Future<Map<String, dynamic>?> signInWithGoogle() async {
    final result = await AuthManager().signInWithGoogle();
    if (result.isSuccess) {
      return AuthManager().currentUser;
    }
    return null;
  }

  Future<void> signOut() async {
    await AuthManager().signOut();
  }

  Map<String, dynamic>? get currentUser => AuthManager().currentUser;

  bool isSignedIn() => AuthManager().isLoggedIn;
}
