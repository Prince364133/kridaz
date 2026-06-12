import 'dart:async';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:logger/logger.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/storage/token_bridge.dart';
import 'api_service.dart';
import 'chat_socket_service.dart';
import 'location_socket_service.dart';
import 'scoring_socket_service.dart';
import 'push_notification_service.dart';

class AuthManager {
  static final AuthManager _instance = AuthManager._internal();
  factory AuthManager() => _instance;

  /// Web OAuth client ID from Google Cloud Console (project `owlturf-auth`).
  /// google_sign_in needs this `serverClientId` to issue tokens — without
  /// it the SDK returns ApiException 10 (DEVELOPER_ERROR) on Android even
  /// when the Android OAuth client (with the correct SHA-1) exists.
  /// The Android client validates (package, SHA-1); the Web client is what
  /// actually mints the id/access token the backend then verifies.
  static const _googleWebClientId =
      '615790581143-k4g37kb3krcfnh1p64aodd2qa3le5q96.apps.googleusercontent.com';

  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: const ['openid', 'email', 'profile'],
    serverClientId: _googleWebClientId,
  );
  final ApiService _apiService = ApiService();
  final Logger _logger = Logger();

  final StreamController<bool> _authController =
      StreamController<bool>.broadcast();
  // Emits when the user gets forcibly logged out. Payload describes the
  // reason so the UI can show the right message:
  //   'session_expired'      — refresh failed or session was invalidated
  //   'refresh_token_reuse'  — server detected token reuse; warn the user
  //                            their account was logged out everywhere
  final StreamController<String> _forcedLogoutController =
      StreamController<String>.broadcast();

  String? _token;
  Map<String, dynamic>? _currentUser;

  Stream<bool> get authStateChanges => _authController.stream;
  Stream<String> get forcedLogoutEvents => _forcedLogoutController.stream;
  bool get isLoggedIn => _token != null;
  String? get token => _token;
  Map<String, dynamic>? get currentUser => _currentUser;

  AuthManager._internal() {
    // Wire ApiService callbacks before loading token so refresh flow works
    _apiService.onTokenRefreshed = (newToken) {
      _token = newToken;
      // Mirror to new stack (no-op if bridge isn't bound yet).
      TokenBridge.publish(newToken);
    };
    _apiService.onSessionExpired = () {
      _token = null;
      _currentUser = null;
      _authController.add(false);
      _forcedLogoutController.add('session_expired');
    };
    _apiService.onRefreshTokenReuseDetected = () {
      // _handleSessionExpiry already cleared state and fired onSessionExpired
      // with 'session_expired'. Re-emit with the more specific reason so the
      // UI can override the generic toast.
      _forcedLogoutController.add('refresh_token_reuse');
    };
    _loadStoredToken();
  }

  Future<void> _loadStoredToken() async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getString('auth_token');
    if (stored != null) {
      _token = stored;
      await _apiService.setAuthToken(stored);
      await _fetchMe();
      // _token may have been cleared by onSessionExpired if refresh also failed
      if (_token != null) _connectChatSocket();
      _authController.add(_token != null);
    } else {
      _authController.add(false);
    }
  }

  /// Public refresh — call after profile updates (e.g. onboarding sync) so the
  /// in-memory cache reflects the latest name/location from the backend.
  Future<void> refreshUser() => _fetchMe();

  Future<void> _fetchMe() async {
    try {
      final response =
          await _apiService.get<Map<String, dynamic>>('/user/auth/getMe');
      if (response.isSuccess && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        _currentUser = data['user'] as Map<String, dynamic>?;
        if (_currentUser != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('user_id', _currentUserId ?? '');
          await prefs.setString(
              'user_email', _currentUser!['email']?.toString() ?? '');
        }
      }
    } catch (e) {
      _logger.e('Failed to fetch user profile: $e');
    }
  }

  /// Backend user objects use `id` (UUID); older code paths used `_id`.
  String? get _currentUserId =>
      (_currentUser?['id'] ?? _currentUser?['_id'])?.toString();

  /// Connects the chat socket and identifies the user so the server can route
  /// incoming messages to this client's personal room. Also re-registers
  /// the FCM device token now that the user is identified — push messages
  /// can't be routed to a user before login.
  void _connectChatSocket() {
    final tok = _token;
    if (tok == null) return;
    ChatSocketService().connect(tok, userId: _currentUserId);
    final uid = _currentUserId;
    if (uid != null && uid.isNotEmpty) {
      LocationSocketService().connect(tok, userId: uid);
    }
    // Now that we're authenticated, hand the cached FCM token to the
    // backend so push messages can be delivered. Safe to call multiple
    // times — the service caches the token.
    unawaited(PushNotificationService.instance.registerWithBackend());
  }

  // ── Login (2-step) ────────────────────────────────────────────────────────

  /// Detect whether a string looks like an email vs a phone number — used
  /// to route a single-field "email or phone" input to the right payload
  /// shape (matches the web's single login input).
  static bool _isEmail(String s) =>
      RegExp(r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$').hasMatch(s);

  /// Unified login step 1 — accepts either email or phone in a single
  /// identifier (mirrors the web's "Email or Phone No" field).
  ///
  /// Backend may respond with:
  ///   * `{token, user}` → immediately authenticated → [AuthResult.success]
  ///   * `{requiresOtp: true, otp?}` → caller must show OTP step then call
  ///     [loginStep2] → [AuthResult.otpRequired]
  Future<AuthResult> loginStep1({
    required String identifier,
    required String password,
  }) async {
    try {
      final body = _isEmail(identifier)
          ? {'email': identifier, 'password': password}
          : {'phone': identifier, 'password': password};

      final response = await _apiService.post<Map<String, dynamic>>(
        '/user/auth/login-step1',
        data: body,
      );

      if (response.isSuccess && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        final tok = data['token'] as String?;
        if (tok != null) {
          await _setSessionFromResponse(data);
          _currentUser = data['user'] as Map<String, dynamic>?;
          _connectChatSocket();
          _saveUserLocally();
          _authController.add(true);
          return AuthResult.success('Login successful');
        }

        if (data['requiresOtp'] == true) {
          return AuthResult.otpRequired(otpHint: data['otp']?.toString());
        }
      }
      return AuthResult.error(response.error ?? 'Login failed');
    } catch (e) {
      _logger.e('Login error: $e');
      return AuthResult.error('Login failed: $e');
    }
  }

  /// Step 2 of step-up login — call after [loginStep1] returned
  /// [AuthResult.otpRequired]. Posts to `/auth/login` (not `/auth/login-step1`)
  /// to mirror the web client's contract.
  Future<AuthResult> loginStep2({
    required String identifier,
    required String otp,
    required String password,
  }) async {
    try {
      final body = _isEmail(identifier)
          ? {'email': identifier, 'otp': otp, 'password': password}
          : {'phone': identifier, 'otp': otp, 'password': password};

      final response = await _apiService.post<Map<String, dynamic>>(
        '/user/auth/login',
        data: body,
      );

      if (response.isSuccess && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        final tok = data['token'] as String?;
        if (tok != null) {
          await _setSessionFromResponse(data);
          _currentUser = data['user'] as Map<String, dynamic>?;
          _connectChatSocket();
          _saveUserLocally();
          _authController.add(true);
          return AuthResult.success('Login successful');
        }
      }
      return AuthResult.error(response.error ?? 'OTP verification failed');
    } catch (e) {
      _logger.e('Login step 2 error: $e');
      return AuthResult.error('OTP verification failed: $e');
    }
  }

  /// Legacy wrapper — kept for back-compat with screens that still call it.
  /// New code should call [loginStep1] directly.
  Future<AuthResult> loginWithEmail(String email, String password) =>
      loginStep1(identifier: email, password: password);

  /// Legacy wrapper — kept for back-compat with screens that still call it.
  Future<AuthResult> loginWithPhone(String phone, String password) =>
      loginStep1(identifier: phone, password: password);

  // ── Registration ──────────────────────────────────────────────────────────

  /// Returns true if an account already exists for this email.
  Future<bool> checkEmailExists(String email) async {
    try {
      final response = await _apiService.post<Map<String, dynamic>>(
        '/user/auth/login-step1',
        data: {'email': email, 'password': ''},
      );
      final msg = (response.error ?? '').toLowerCase();
      return !msg.contains('not found') && !msg.contains('sign up');
    } catch (_) {
      return false;
    }
  }

  /// Send OTP for signup.
  ///
  /// The web frontend sends `{phone}` only — mobile mirrors that by default.
  /// Pass [email] (optional) for legacy callers that still want a dual-OTP
  /// flow; when omitted, only the phone OTP is dispatched.
  Future<AuthResult> sendOtp({
    String? email,
    required String phone,
  }) async {
    try {
      final body = <String, dynamic>{'phone': phone};
      if (email != null && email.isNotEmpty) body['email'] = email;

      final response = await _apiService.post<Map<String, dynamic>>(
        '/user/auth/send-otp',
        data: body,
      );
      if (response.isSuccess) {
        final data = response.data;
        // Backend returns testOtp: { email: "123456", phone: "654321" }
        final testOtp = data?['testOtp'] as Map<String, dynamic>?;
        if (testOtp != null) {
          final emailOtp = testOtp['email']?.toString();
          final phoneOtp = testOtp['phone']?.toString();
          final parts = <String>[];
          if (emailOtp != null) parts.add('Email OTP: $emailOtp');
          if (phoneOtp != null) parts.add('Phone OTP: $phoneOtp');
          if (parts.isNotEmpty) {
            return AuthResult.success('OTP sent\n${parts.join('  •  ')}');
          }
        }
        return AuthResult.success('OTP sent successfully');
      }
      return AuthResult.error(response.error ?? 'Failed to send OTP');
    } catch (e) {
      return AuthResult.error('Failed to send OTP: $e');
    }
  }

  /// Verify phone OTP and receive a short-lived registrationToken.
  /// Call this after send-otp. Pass the token to register().
  ///
  /// Sends BOTH `otp` and `phoneOtp` field names so the backend can read
  /// whichever it expects — web uses `otp`, mobile historically used
  /// `phoneOtp`. Keeping both means either contract works.
  Future<AuthResult> verifyOtp({
    String? email,
    required String phone,
    required String phoneOtp,
  }) async {
    try {
      final body = <String, dynamic>{
        'phone': phone,
        'otp': phoneOtp,
        'phoneOtp': phoneOtp,
      };
      if (email != null && email.isNotEmpty) body['email'] = email;

      final response = await _apiService.post<Map<String, dynamic>>(
        '/user/auth/verify-otp',
        data: body,
      );
      if (response.isSuccess && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        final token = data['registrationToken'] as String?;
        if (token != null) {
          return AuthResult.success(token); // message carries the token
        }
      }
      return AuthResult.error(response.error ?? 'OTP verification failed');
    } catch (e) {
      return AuthResult.error('OTP verification failed: $e');
    }
  }

  /// Complete registration using the registrationToken from verifyOtp().
  ///
  /// Backend expects: name, email, phone, password, confirmPassword,
  ///                  registrationToken  (+ optional gender/dob/location/sportTypes)
  Future<AuthResult> register({
    required String name,
    required String email,
    required String phone,
    required String password,
    required String registrationToken,
    String? phoneOtp,
    String gender = '',
    String location = '',
    String? dob,
    List<String>? sportTypes,
  }) async {
    try {
      final body = <String, dynamic>{
        'name': name,
        'email': email,
        'phone': phone,
        'password': password,
        'confirmPassword': password,
        'registrationToken': registrationToken,
        if (phoneOtp != null) 'phoneOtp': phoneOtp,
        'gender': gender,
        'location': location,
        if (dob != null) 'dob': dob,
        if (sportTypes != null) 'sportTypes': sportTypes,
      };

      final response = await _apiService.post<Map<String, dynamic>>(
        '/user/auth/register',
        data: body,
      );

      if (response.isSuccess && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        final tok = data['token'] as String?;
        if (tok != null) {
          await _setSessionFromResponse(data);
          _currentUser = data['user'] as Map<String, dynamic>?;
          _connectChatSocket();
          _saveUserLocally();
          _authController.add(true);
          // Registration collects profile data inline — no onboarding needed
          final prefs = await SharedPreferences.getInstance();
          await prefs.setBool('onboarding_complete', true);
          return AuthResult.success('Registration successful');
        }
      }
      return AuthResult.error(response.error ?? 'Registration failed');
    } catch (e) {
      return AuthResult.error('Registration failed: $e');
    }
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────

  Future<AuthResult> signInWithGoogle() async {
    try {
      await _googleSignIn.signOut();
      final googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return AuthResult.error('Sign in cancelled');

      final googleAuth = await googleUser.authentication;
      final accessToken = googleAuth.accessToken;
      if (accessToken == null) {
        return AuthResult.error('Failed to get Google access token');
      }

      // Forward any pending invite tokens so post-login redirects (team
      // joins, umpire onboarding) work the same as the web client.
      final prefs = await SharedPreferences.getInstance();
      final inviteToken = prefs.getString('pendingTeamInvite');
      final umpireInvite = prefs.getString('umpireInvite');

      final payload = <String, dynamic>{
        'accessToken': accessToken,
        'role': 'user',
        if (inviteToken != null) 'inviteToken': inviteToken,
        if (umpireInvite != null) 'umpireInvite': umpireInvite,
      };

      final response = await _apiService.post<Map<String, dynamic>>(
        '/user/auth/google-auth',
        data: payload,
      );

      if (response.isSuccess && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        final tok = data['token'] as String?;
        if (tok != null) {
          await _setSessionFromResponse(data);
          _currentUser = data['user'] as Map<String, dynamic>?;
          _connectChatSocket();
          _saveUserLocally();
          _authController.add(true);

          // The google-auth response only carries the auth-essential user
          // fields (id, email, name). The full profile (dob, location,
          // gender, sportTypes) lives behind /user/auth/getMe, so fetch it
          // before deciding whether onboarding is still needed — otherwise
          // returning users get sent through it again on a fresh install.
          await _fetchMe();

          // Skip onboarding when the backend profile is already filled, not
          // just when SharedPreferences remembers the user finished it. The
          // local flag is wiped on reinstall and missing on new devices, so
          // relying on it forced returning users to re-enter name/DOB/location.
          final alreadyOnboarded =
              prefs.getBool('onboarding_complete') ?? false;
          final profileComplete = _isProfileComplete(_currentUser);
          final isNew = !profileComplete &&
              !alreadyOnboarded &&
              (data['isNewUser'] == true || _currentUser == null);

          // Cache the completion locally so subsequent launches short-circuit
          // without re-reading the full profile.
          if (profileComplete && !alreadyOnboarded) {
            await prefs.setBool('onboarding_complete', true);
          }
          return AuthResult.success('Google sign-in successful',
              isNewUser: isNew);
        }
      }
      return AuthResult.error(response.error ?? 'Google sign-in failed');
    } catch (e) {
      _logger.e('Google sign-in error: $e');
      return AuthResult.error('Google sign-in failed: $e');
    }
  }

  // ── Forgot password ───────────────────────────────────────────────────────

  /// Send a password-reset OTP. The [identifier] can be an email or a phone
  /// number (matches the web's "Email or Phone Number" field).
  ///
  /// Real delivery isn't wired up yet — the backend echoes the OTP back in
  /// `testOtp` so the UI can show it. When present, it's surfaced via
  /// [AuthResult.otpHint] (same channel [loginStep1] uses).
  Future<AuthResult> forgotPasswordOtp(String identifier) async {
    try {
      // Send `email` field for both — matches the web client. Backend
      // accepts either an email or a phone number in that field.
      final response = await _apiService.post<Map<String, dynamic>>(
        '/user/auth/forgot-password-otp',
        data: {'email': identifier},
      );
      if (response.isSuccess) {
        final isPhone = !_isEmail(identifier);
        final base =
            isPhone ? 'OTP sent to your phone' : 'OTP sent to your email';
        final data = response.data;
        String? hint;
        final testOtp = data?['testOtp'];
        if (testOtp is Map) {
          hint = (testOtp['phone'] ?? testOtp['email'])?.toString();
        } else if (testOtp != null) {
          hint = testOtp.toString();
        }
        hint ??= data?['otp']?.toString();
        return AuthResult.otpRequired(otpHint: hint, message: base);
      }
      return AuthResult.error(response.error ?? 'Failed to send OTP');
    } catch (e) {
      return AuthResult.error('Failed to send OTP: $e');
    }
  }

  Future<AuthResult> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    try {
      final response = await _apiService.post<Map<String, dynamic>>(
        '/user/auth/reset-password',
        data: {'email': email, 'otp': otp, 'newPassword': newPassword},
      );
      if (response.isSuccess) {
        return AuthResult.success('Password reset successfully');
      }
      return AuthResult.error(response.error ?? 'Reset failed');
    } catch (e) {
      return AuthResult.error('Reset failed: $e');
    }
  }

  // ── Sign out ──────────────────────────────────────────────────────────────

  Future<void> signOut() async {
    // Best-effort: tell the backend to stop pushing to this device.
    // Must happen BEFORE we drop the auth token — the unregister call
    // is authenticated.
    try {
      await PushNotificationService.instance.unregisterFromBackend();
    } catch (_) {}

    // Revoke refresh token on the server before clearing local state
    try {
      await _apiService.post<Map<String, dynamic>>('/user/auth/logout');
    } catch (_) {}

    await _clearLocalSession();
    _logger.i('User signed out');
  }

  /// Revoke EVERY refresh token issued to this account on every device.
  /// Server bumps `tokenVersion` so all previously-issued access tokens
  /// fail their next call with `TOKEN_REVOKED`. Local state on this device
  /// is cleared the same way [signOut] does it.
  Future<void> signOutAll() async {
    try {
      await PushNotificationService.instance.unregisterFromBackend();
    } catch (_) {}

    try {
      await _apiService.post<Map<String, dynamic>>('/user/auth/logout-all');
    } catch (_) {}

    await _clearLocalSession();
    _logger.i('User signed out of all devices');
  }

  Future<void> _clearLocalSession() async {
    _token = null;
    _currentUser = null;
    await _apiService.clearAuthToken();
    await TokenBridge.clear();
    _apiService.clearCache();
    try {
      await _googleSignIn.signOut();
    } catch (_) {}

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_id');
    await prefs.remove('user_email');
    ChatSocketService().disconnect();
    LocationSocketService().disconnect();
    ScoringSocketService().disconnect();
    _authController.add(false);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /// True when the backend profile already has the fields the onboarding flow
  /// would otherwise collect — name, DOB, location, gender, and at least one
  /// sport. Used to avoid forcing returning users (e.g. fresh installs, new
  /// device) through onboarding again.
  bool _isProfileComplete(Map<String, dynamic>? u) {
    if (u == null) return false;
    bool filled(dynamic v) {
      if (v == null) return false;
      if (v is String) return v.trim().isNotEmpty;
      if (v is List) return v.isNotEmpty;
      if (v is Map) return v.isNotEmpty;
      return true;
    }

    final hasName =
        filled(u['firstName']) || filled(u['name']) || filled(u['fullName']);
    final hasDob = filled(u['dob']) || filled(u['dateOfBirth']);
    final hasLocation = filled(u['location']) || filled(u['city']);
    final hasGender = filled(u['gender']);
    final hasSports = filled(u['sportTypes']) ||
        filled(u['sports']) ||
        filled(u['interests']);
    return hasName && hasDob && hasLocation && hasGender && hasSports;
  }

  Future<AuthResult> deleteAccount() async {
    await signOut();
    return AuthResult.success('Account deleted');
  }

  Future<AuthResult> sendPhoneOTP({
    required String email,
    required String phoneNumber,
    Function(String error)? onError,
  }) async {
    return sendOtp(email: email, phone: phoneNumber);
  }

  String getAuthProvider() {
    if (_currentUser == null) return 'none';
    return _currentUser!['authProvider']?.toString() ?? 'email';
  }

  void reloadUser() => _fetchMe();

  Future<String?> getStoredUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('user_id');
  }

  /// Persist a full session response (access + refresh + expiry).
  /// Use this on login / register / google-auth where the backend returns
  /// the refresh token in the body — mobile can't rely on the cookie jar.
  Future<void> _setSessionFromResponse(Map<String, dynamic> data) async {
    final tok = data['token'] as String?;
    if (tok == null) return;
    _token = tok;
    await _apiService.setSession(
      accessToken: tok,
      refreshToken: data['refreshToken'] as String?,
      accessTokenExpiresAt: data['accessTokenExpiresAt']?.toString(),
    );
    await TokenBridge.publish(tok);
  }

  Future<void> _saveUserLocally() async {
    if (_currentUser == null) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_id', _currentUserId ?? '');
    await prefs.setString(
        'user_email', _currentUser!['email']?.toString() ?? '');
  }
}

// ── Result type ───────────────────────────────────────────────────────────────

class AuthResult {
  final bool isSuccess;
  final String message;
  final bool isNewUser;

  /// True when the backend's login-step1 returned `{requiresOtp: true}` —
  /// the caller should switch to the OTP step and then call [AuthManager.loginStep2].
  final bool requiresOtp;

  /// Dev-mode OTP echoed back by the backend (only set when [requiresOtp] is
  /// true). Lets the screen show "Your OTP is …" while real SMS delivery is
  /// stubbed.
  final String? otpHint;

  AuthResult._({
    required this.isSuccess,
    required this.message,
    this.isNewUser = false,
    this.requiresOtp = false,
    this.otpHint,
  });

  factory AuthResult.success(String message, {bool isNewUser = false}) =>
      AuthResult._(isSuccess: true, message: message, isNewUser: isNewUser);

  factory AuthResult.error(String message) =>
      AuthResult._(isSuccess: false, message: message);

  /// Step-up OTP required after a password-only login attempt.
  factory AuthResult.otpRequired(
          {String? otpHint, String message = 'OTP sent'}) =>
      AuthResult._(
          isSuccess: true,
          message: message,
          requiresOtp: true,
          otpHint: otpHint);
}
