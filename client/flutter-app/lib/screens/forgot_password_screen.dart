import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../services/auth_manager.dart';
import '../widgets/common/otp_dev_toast.dart';
import '../widgets/common/primary_gradient_button.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailCtrl = TextEditingController(); // email OR phone — matches web
  final _otpCtrl = TextEditingController();
  final _newPassCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();

  int _step = 1;
  bool _obscure = true;
  bool _obscureConfirm = true;
  bool _loading = false;
  String? _error;
  String? _successMsg;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _otpCtrl.dispose();
    _newPassCtrl.dispose();
    _confirmPassCtrl.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    final identifier = _emailCtrl.text.trim();
    if (identifier.isEmpty) {
      setState(() => _error = 'Please enter your email or phone number');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });

    final result = await AuthManager().forgotPasswordOtp(identifier);

    if (!mounted) return;
    setState(() => _loading = false);

    if (result.isSuccess) {
      final hint = result.otpHint;
      if (hint != null && hint.isNotEmpty) {
        OtpDevToast.show(context, hint);
      }
      setState(() => _step = 2);
    } else {
      setState(() => _error = result.message);
    }
  }

  Future<void> _resetPassword() async {
    final otp = _otpCtrl.text.trim();
    final newPass = _newPassCtrl.text;
    final confirmPass = _confirmPassCtrl.text;

    if (otp.length != 6) {
      setState(() => _error = 'Enter the 6-digit OTP');
      return;
    }
    // Match the web frontend: 8-char minimum + confirmation.
    if (newPass.length < 8) {
      setState(() => _error = 'Password must be at least 8 characters');
      return;
    }
    if (newPass != confirmPass) {
      setState(() => _error = 'Passwords do not match');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    final result = await AuthManager().resetPassword(
      email: _emailCtrl.text.trim(),
      otp: otp,
      newPassword: newPass,
    );

    if (!mounted) return;
    setState(() => _loading = false);

    if (result.isSuccess) {
      setState(() => _successMsg = 'Password reset successfully!');
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) context.go('/login');
    } else {
      setState(() => _error = result.message);
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
                        onTap: () {
                          if (_step == 2) {
                            setState(() {
                              _step = 1;
                              _error = null;
                            });
                          } else {
                            context.pop();
                          }
                        },
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
                    child: _step == 1 ? _step1() : _step2(),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _step1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Forgot Password',
          style: TextStyle(
            color: Colors.white,
            fontSize: 32,
            fontWeight: FontWeight.bold,
            fontFamily: 'Poppins',
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Enter your email or phone number to receive a reset code',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.55),
            fontSize: 15,
            fontFamily: 'Poppins',
          ),
        ),
        const SizedBox(height: 36),
        _label('Email or Phone Number'),
        const SizedBox(height: 8),
        _inputField(
          controller: _emailCtrl,
          hint: 'you@example.com or 98765 43210',
          keyboardType: TextInputType.emailAddress,
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          _errorBox(_error!),
        ],
        const SizedBox(height: 28),
        PrimaryGradientButton(
          label: 'SEND RESET OTP',
          height: 56,
          isLoading: _loading,
          onPressed: _loading ? null : _sendOtp,
        ),
      ],
    );
  }

  Widget _step2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Reset Password',
          style: TextStyle(
            color: Colors.white,
            fontSize: 32,
            fontWeight: FontWeight.bold,
            fontFamily: 'Poppins',
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Enter the OTP sent to ${_emailCtrl.text.trim()}',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.55),
            fontSize: 15,
            fontFamily: 'Poppins',
          ),
        ),
        const SizedBox(height: 36),
        _label('6-Digit Code'),
        const SizedBox(height: 8),
        _inputField(
          controller: _otpCtrl,
          hint: '••••••',
          keyboardType: TextInputType.number,
        ),
        const SizedBox(height: 20),
        _label('New Password'),
        const SizedBox(height: 8),
        _inputField(
          controller: _newPassCtrl,
          hint: 'Min 8 characters',
          obscure: _obscure,
          suffix: GestureDetector(
            onTap: () => setState(() => _obscure = !_obscure),
            child: Icon(
              _obscure ? LucideIcons.eyeOff : LucideIcons.eye,
              color: Colors.white38,
              size: 20,
            ),
          ),
        ),
        const SizedBox(height: 20),
        _label('Confirm Password'),
        const SizedBox(height: 8),
        _inputField(
          controller: _confirmPassCtrl,
          hint: 'Repeat new password',
          obscure: _obscureConfirm,
          suffix: GestureDetector(
            onTap: () => setState(() => _obscureConfirm = !_obscureConfirm),
            child: Icon(
              _obscureConfirm ? LucideIcons.eyeOff : LucideIcons.eye,
              color: Colors.white38,
              size: 20,
            ),
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          _errorBox(_error!),
        ],
        if (_successMsg != null) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.green.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
              border:
                  Border.all(color: Colors.greenAccent.withValues(alpha: 0.4)),
            ),
            child: Text(
              _successMsg!,
              style: const TextStyle(
                  color: Colors.greenAccent,
                  fontSize: 13,
                  fontFamily: 'Poppins'),
            ),
          ),
        ],
        const SizedBox(height: 28),
        PrimaryGradientButton(
          label: 'RESET PASSWORD',
          height: 56,
          isLoading: _loading,
          onPressed: _loading ? null : _resetPassword,
        ),
        const SizedBox(height: 20),
        Center(
          child: GestureDetector(
            onTap: _loading ? null : _sendOtp,
            child: Text(
              'Resend OTP',
              style: TextStyle(
                color: AppColors.primary,
                fontFamily: 'Poppins',
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ],
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

  Widget _errorBox(String msg) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.red.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.redAccent.withValues(alpha: 0.4)),
        ),
        child: Text(
          msg,
          style: const TextStyle(
              color: Colors.redAccent, fontSize: 13, fontFamily: 'Poppins'),
        ),
      );

  Widget _inputField({
    required TextEditingController controller,
    required String hint,
    TextInputType keyboardType = TextInputType.text,
    bool obscure = false,
    Widget? suffix,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceL1,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        obscureText: obscure,
        style: const TextStyle(
            color: Colors.white, fontFamily: 'Poppins', fontSize: 15),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(
              color: Colors.white.withValues(alpha: 0.3),
              fontFamily: 'Poppins'),
          border: InputBorder.none,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          suffixIcon: suffix != null
              ? Padding(
                  padding: const EdgeInsets.only(right: 12), child: suffix)
              : null,
          suffixIconConstraints:
              const BoxConstraints(minWidth: 44, minHeight: 44),
        ),
      ),
    );
  }
}
