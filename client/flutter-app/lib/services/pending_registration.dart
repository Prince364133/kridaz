/// Holds registration credentials between OTP verification (step 2) and the
/// onboarding loading screen, where the actual register API call is made with
/// the complete profile data (gender, location, interests).
class PendingRegistration {
  static final PendingRegistration _instance = PendingRegistration._internal();
  factory PendingRegistration() => _instance;
  PendingRegistration._internal();

  String? name; // set by user_info_screen
  String? email;
  String? phone;
  String? password;
  String? registrationToken; // issued by /user/auth/verify-otp
  String?
      phoneOtp; // still required by register endpoint alongside registrationToken

  bool get hasPendingData => email != null && registrationToken != null;

  void clear() {
    name = null;
    email = null;
    phone = null;
    password = null;
    registrationToken = null;
    phoneOtp = null;
  }
}
