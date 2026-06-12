import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../services/auth_manager.dart';
import '../services/onboarding_data.dart';
import '../widgets/common/bms_light_input.dart';
import '../widgets/common/bms_toast.dart';
import '../widgets/common/otp_dev_toast.dart';
import '../widgets/common/primary_gradient_button.dart';

class BmsLoginScreen extends StatefulWidget {
  const BmsLoginScreen({super.key});

  @override
  State<BmsLoginScreen> createState() => _BmsLoginScreenState();
}

class _BmsLoginScreenState extends State<BmsLoginScreen> {
  final _identifierCtrl = TextEditingController(); // email OR phone
  final _passwordCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;

  // Step-up OTP state (set when login-step1 returns `requiresOtp: true`).
  bool _otpStep = false;
  String? _otpHint;

  @override
  void dispose() {
    _identifierCtrl.dispose();
    _passwordCtrl.dispose();
    _otpCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final id = _identifierCtrl.text.trim();
    final pass = _passwordCtrl.text;
    if (id.isEmpty || pass.isEmpty) {
      BmsToast.error(context, 'Please fill in all fields');
      return;
    }
    setState(() => _loading = true);
    final result =
        await AuthManager().loginStep1(identifier: id, password: pass);
    if (!mounted) return;
    setState(() => _loading = false);

    if (result.requiresOtp) {
      setState(() {
        _otpStep = true;
        _otpHint = result.otpHint;
        _otpCtrl.clear();
      });
      final hint = result.otpHint;
      if (hint != null && hint.isNotEmpty) {
        OtpDevToast.show(context, hint);
      }
      return;
    }
    if (result.isSuccess) {
      context.go('/dashboard');
    } else {
      BmsToast.error(context, result.message);
    }
  }

  Future<void> _verifyOtp() async {
    final otp = _otpCtrl.text.trim();
    if (otp.length != 6) {
      BmsToast.error(context, 'Enter the 6-digit code');
      return;
    }
    setState(() => _loading = true);
    final result = await AuthManager().loginStep2(
      identifier: _identifierCtrl.text.trim(),
      otp: otp,
      password: _passwordCtrl.text,
    );
    if (!mounted) return;
    setState(() => _loading = false);
    if (result.isSuccess) {
      context.go('/dashboard');
    } else {
      BmsToast.error(context, result.message);
    }
  }

  Future<void> _googleLogin() async {
    setState(() => _loading = true);
    final result = await AuthManager().signInWithGoogle();
    if (!mounted) return;
    setState(() => _loading = false);
    if (result.isSuccess) {
      if (result.isNewUser) {
        final user = AuthManager().currentUser;
        if (user != null) {
          final fullName =
              user['name']?.toString() ?? user['fullName']?.toString() ?? '';
          final parts = fullName.trim().split(' ');
          final onboarding = OnboardingData();
          onboarding.firstName = parts.isNotEmpty ? parts.first : '';
          onboarding.lastName =
              parts.length > 1 ? parts.sublist(1).join(' ') : '';
          onboarding.email = user['email']?.toString();
        }
        context.go('/onboarding/info');
      } else {
        context.go('/dashboard');
      }
    } else if (result.message != 'Sign in cancelled') {
      BmsToast.error(context, result.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          Positioned.fill(
            child: Image.asset(
              'assets/images/screens/starting screens background.png',
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black,
                      AppColors.surfaceForestDeep,
                      AppColors.surfaceForest
                    ],
                  ),
                ),
              ),
            ),
          ),
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.4),
                    Colors.black.withValues(alpha: 0.75),
                  ],
                ),
              ),
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: () =>
                            context.canPop() ? context.pop() : context.go('/'),
                        child: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                                color: Colors.white.withValues(alpha: 0.15)),
                          ),
                          child: const Icon(LucideIcons.chevronLeft,
                              color: Colors.white, size: 18),
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(24, 4, 24, 32),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Welcome Back',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Poppins',
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Sign in to continue playing',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.55),
                            fontSize: 15,
                            fontFamily: 'Poppins',
                          ),
                        ),
                        const SizedBox(height: 36),
                        if (!_otpStep) ...[
                          _label('Email or Phone Number'),
                          const SizedBox(height: 8),
                          _inputField(
                            controller: _identifierCtrl,
                            hint: 'EMAIL OR PHONE',
                            keyboardType: TextInputType.emailAddress,
                          ),
                          const SizedBox(height: 20),
                          _label('Password'),
                          const SizedBox(height: 8),
                          _inputField(
                            controller: _passwordCtrl,
                            hint: 'PASSWORD',
                            obscure: _obscure,
                            suffix: GestureDetector(
                              onTap: () => setState(() => _obscure = !_obscure),
                              child: Icon(
                                _obscure ? LucideIcons.eyeOff : LucideIcons.eye,
                                color: const Color(0xFF6B7280),
                                size: 20,
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Align(
                            alignment: Alignment.centerRight,
                            child: GestureDetector(
                              onTap: () => context.push('/forgot-password'),
                              child: Text(
                                'Forgot password?',
                                style: TextStyle(
                                  color: AppColors.primary,
                                  fontFamily: 'Poppins',
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 28),
                          PrimaryGradientButton(
                            label: 'SIGN IN',
                            onPressed: _loading ? null : _login,
                            isLoading: _loading,
                            height: 56,
                          ),
                        ] else ...[
                          _label('Verification Code'),
                          const SizedBox(height: 4),
                          Text(
                            'We sent a 6-digit code to your account.',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.55),
                              fontSize: 13,
                              fontFamily: 'Poppins',
                            ),
                          ),
                          const SizedBox(height: 12),
                          _inputField(
                            controller: _otpCtrl,
                            hint: 'VERIFICATION CODE',
                            keyboardType: TextInputType.number,
                          ),
                          if (_otpHint != null && _otpHint!.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.05),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                    color: AppColors.primary
                                        .withValues(alpha: 0.3)),
                              ),
                              child: Text(
                                'Developer Message — your OTP is: $_otpHint',
                                style: TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 13,
                                  fontFamily: 'Poppins',
                                ),
                              ),
                            ),
                          ],
                          const SizedBox(height: 20),
                          PrimaryGradientButton(
                            label: 'VERIFY & SIGN IN',
                            onPressed: _loading ? null : _verifyOtp,
                            isLoading: _loading,
                            height: 56,
                          ),
                          const SizedBox(height: 12),
                          Center(
                            child: GestureDetector(
                              onTap: () => setState(() {
                                _otpStep = false;
                                _otpHint = null;
                                _otpCtrl.clear();
                              }),
                              child: Text(
                                'Use a different account',
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.55),
                                  fontSize: 13,
                                  fontFamily: 'Poppins',
                                ),
                              ),
                            ),
                          ),
                        ],
                        if (!_otpStep) ...[
                          const SizedBox(height: 28),
                          Row(
                            children: [
                              Expanded(
                                  child: Divider(
                                      color: Colors.white
                                          .withValues(alpha: 0.15))),
                              Padding(
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 16),
                                child: Text(
                                  'OR',
                                  style: TextStyle(
                                      color:
                                          Colors.white.withValues(alpha: 0.45),
                                      fontSize: 12,
                                      fontFamily: 'Poppins'),
                                ),
                              ),
                              Expanded(
                                  child: Divider(
                                      color: Colors.white
                                          .withValues(alpha: 0.15))),
                            ],
                          ),
                          const SizedBox(height: 28),
                          SizedBox(
                            width: double.infinity,
                            height: 56,
                            child: OutlinedButton(
                              onPressed: _loading ? null : _googleLogin,
                              style: OutlinedButton.styleFrom(
                                side: BorderSide(
                                    color: Colors.white.withValues(alpha: 0.2)),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14)),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Image.asset(
                                    'assets/images/icons/Google.png',
                                    width: 22,
                                    height: 22,
                                    errorBuilder: (_, __, ___) => const Icon(
                                        Icons.g_mobiledata,
                                        color: Colors.white,
                                        size: 24),
                                  ),
                                  const SizedBox(width: 12),
                                  const Text(
                                    'Continue with Google',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 15,
                                      fontWeight: FontWeight.w500,
                                      fontFamily: 'Poppins',
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 36),
                          Center(
                            child: GestureDetector(
                              onTap: () => context.push('/register'),
                              child: RichText(
                                text: TextSpan(
                                  style: const TextStyle(
                                      fontFamily: 'Poppins', fontSize: 14),
                                  children: [
                                    TextSpan(
                                      text: "Don't have an account? ",
                                      style: TextStyle(
                                          color: Colors.white
                                              .withValues(alpha: 0.55)),
                                    ),
                                    TextSpan(
                                      text: 'Register',
                                      style: TextStyle(
                                          color: AppColors.primary,
                                          fontWeight: FontWeight.w600),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ], // end !_otpStep block (OR / Google / register)
                        const SizedBox(height: 24),
                        Center(
                          child: Text(
                            'By continuing, you agree to our Terms & Conditions',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.35),
                              fontSize: 12,
                              fontFamily: 'Poppins',
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _label(String text) => Text(
        text,
        style: const TextStyle(
          color: Colors.white70,
          fontSize: 13,
          fontWeight: FontWeight.w500,
          fontFamily: 'Poppins',
        ),
      );

  Widget _inputField({
    required TextEditingController controller,
    required String hint,
    TextInputType keyboardType = TextInputType.text,
    bool obscure = false,
    Widget? suffix,
  }) =>
      BmsLightInput(
        controller: controller,
        hint: hint,
        keyboardType: keyboardType,
        obscureText: obscure,
        suffix: suffix,
      );
}
