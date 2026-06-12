import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../services/auth_manager.dart';
import '../services/onboarding_data.dart';
import '../services/pending_registration.dart';
import '../widgets/common/bms_light_input.dart';
import '../widgets/common/otp_dev_toast.dart';
import '../widgets/common/primary_gradient_button.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  // Step 1
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passCtrl = TextEditingController();

  // Step 2 — six cells, one per digit (backend issues 6-digit codes).
  static const int _otpLength = 6;
  late final List<TextEditingController> _otpCells;
  late final List<FocusNode> _otpFocus;

  int _step = 1;
  bool _obscure = true;
  bool _loading = false;
  String? _error;
  bool _alreadyRegistered = false;
  String _countryCode = '+91';

  /// Resend countdown for step 2 (matches login OTP screen).
  int _resendTimer = 60;
  bool _canResend = false;
  Timer? _resendTicker;

  /// Dev-mode OTP echoed back by the backend (since real SMS/WhatsApp
  /// delivery isn't wired up yet). Shown both as a top toast and inline
  /// below the cells on step 2.
  String? _sentOtp;

  static const _countryCodes = ['+91', '+1', '+44', '+61', '+971', '+65'];

  @override
  void initState() {
    super.initState();
    _otpCells = List.generate(_otpLength, (_) => TextEditingController());
    _otpFocus = List.generate(_otpLength, (_) => FocusNode());
  }

  @override
  void dispose() {
    _resendTicker?.cancel();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passCtrl.dispose();
    for (final c in _otpCells) {
      c.dispose();
    }
    for (final f in _otpFocus) {
      f.dispose();
    }
    super.dispose();
  }

  void _startResendCountdown() {
    _resendTicker?.cancel();
    setState(() {
      _resendTimer = 60;
      _canResend = false;
    });
    _resendTicker = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      if (_resendTimer <= 1) {
        t.cancel();
        setState(() {
          _resendTimer = 0;
          _canResend = true;
        });
      } else {
        setState(() => _resendTimer--);
      }
    });
  }

  String _collectOtp() => _otpCells.map((c) => c.text).join();

  void _clearError() {
    if (_error != null || _alreadyRegistered) {
      setState(() {
        _error = null;
        _alreadyRegistered = false;
      });
    }
  }

  // ── Step 1: send OTP ───────────────────────────────────────────────────────

  Future<void> _sendOtp() async {
    final email = _emailCtrl.text.trim();
    final phone = _phoneCtrl.text.trim();
    final pass = _passCtrl.text;

    if (email.isEmpty || phone.isEmpty || pass.isEmpty) {
      setState(() => _error = 'Please fill in all fields');
      return;
    }
    if (pass.length < 6) {
      setState(() => _error = 'Password must be at least 6 characters');
      return;
    }
    if (_alreadyRegistered) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    final result = await AuthManager().sendOtp(
      phone: '$_countryCode$phone',
    );

    if (!mounted) return;
    setState(() => _loading = false);

    if (result.isSuccess) {
      final code = RegExp(r'\b(\d{6})\b').firstMatch(result.message)?.group(1);
      if (code != null) {
        setState(() => _sentOtp = code);
        OtpDevToast.show(context, code);
      }
      // Clear any previously-entered cells before showing step 2.
      for (final c in _otpCells) {
        c.clear();
      }
      setState(() => _step = 2);
      _startResendCountdown();
      // Autofocus first cell.
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _otpFocus.first.requestFocus();
      });
    } else {
      final isExisting =
          result.message.toLowerCase().contains('already registered') ||
              result.message.toLowerCase().contains('already exists');
      setState(() {
        _error = result.message;
        _alreadyRegistered = isExisting;
      });
    }
  }

  Future<void> _resendOtp() async {
    if (!_canResend || _loading) return;
    HapticFeedback.lightImpact();
    await _sendOtp();
  }

  // ── Step 2: verify OTP → get registrationToken → onboarding ───────────────

  Future<void> _verifyAndRegister() async {
    final phoneOtp = _collectOtp();
    if (phoneOtp.length != _otpLength) {
      setState(() => _error = 'Enter the $_otpLength-digit code');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    final result = await AuthManager().verifyOtp(
      phone: '$_countryCode${_phoneCtrl.text.trim()}',
      phoneOtp: phoneOtp,
    );

    if (!mounted) return;
    setState(() => _loading = false);

    if (!result.isSuccess) {
      setState(() => _error = result.message);
      return;
    }

    PendingRegistration()
      ..email = _emailCtrl.text.trim()
      ..phone = '$_countryCode${_phoneCtrl.text.trim()}'
      ..password = _passCtrl.text
      ..registrationToken = result.message
      ..phoneOtp = phoneOtp;

    OnboardingData().email = _emailCtrl.text.trim();
    context.go('/onboarding/info');
  }

  // ── Build ────────────────────────────────────────────────────────────────

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
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: () {
                          if (_step > 1) {
                            setState(() {
                              _step--;
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
                      const Spacer(),
                      Row(
                        children: List.generate(2, (i) {
                          final active = i + 1 == _step;
                          final done = i + 1 < _step;
                          return Container(
                            margin: const EdgeInsets.only(left: 6),
                            width: active ? 20 : 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: (active || done)
                                  ? AppColors.primary
                                  : Colors.white24,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          );
                        }),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
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

  // ── Step 1 UI ────────────────────────────────────────────────────────────

  Widget _step1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Create Account',
            style: TextStyle(
                color: Colors.white,
                fontSize: 30,
                fontWeight: FontWeight.bold,
                fontFamily: 'Poppins')),
        const SizedBox(height: 4),
        Text('Step 1 of 2 — Basic Info',
            style: TextStyle(
                color: Colors.white.withValues(alpha: 0.45),
                fontSize: 13,
                fontFamily: 'Poppins')),
        const SizedBox(height: 32),
        _label('Email Address'),
        const SizedBox(height: 8),
        BmsLightInput(
          controller: _emailCtrl,
          hint: 'EMAIL ADDRESS',
          keyboardType: TextInputType.emailAddress,
          onChanged: (_) => _clearError(),
        ),
        const SizedBox(height: 18),
        _label('Phone Number'),
        const SizedBox(height: 8),
        _phoneField(),
        const SizedBox(height: 18),
        _label('Password'),
        const SizedBox(height: 8),
        BmsLightInput(
          controller: _passCtrl,
          hint: 'PASSWORD',
          obscureText: _obscure,
          onChanged: (_) => _clearError(),
          suffix: GestureDetector(
            onTap: () => setState(() => _obscure = !_obscure),
            child: Icon(
              _obscure ? LucideIcons.eyeOff : LucideIcons.eye,
              color: const Color(0xFF6B7280),
              size: 20,
            ),
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          if (_alreadyRegistered)
            _alreadyRegisteredBanner()
          else
            _errorBox(_error!),
        ],
        const SizedBox(height: 28),
        PrimaryGradientButton(
          label: 'SEND OTP',
          height: 56,
          isLoading: _loading,
          onPressed: _loading ? null : _sendOtp,
        ),
        const SizedBox(height: 24),
        Center(
          child: GestureDetector(
            onTap: () => context.pop(),
            child: RichText(
                text: TextSpan(
              style: const TextStyle(fontFamily: 'Poppins', fontSize: 14),
              children: [
                TextSpan(
                    text: 'Already have an account? ',
                    style:
                        TextStyle(color: Colors.white.withValues(alpha: 0.55))),
                TextSpan(
                    text: 'Sign In',
                    style: TextStyle(
                        color: AppColors.primary, fontWeight: FontWeight.w600)),
              ],
            )),
          ),
        ),
      ],
    );
  }

  // ── Step 2 UI — matches the "Enter Verification Code" design ─────────────

  Widget _step2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Enter Verification\nCode',
            style: TextStyle(
                color: Colors.white,
                fontSize: 30,
                fontWeight: FontWeight.bold,
                height: 1.2,
                fontFamily: 'Poppins')),
        const SizedBox(height: 8),
        Text('Sent to $_countryCode${_phoneCtrl.text.trim()}',
            style: TextStyle(
                color: Colors.white.withValues(alpha: 0.5),
                fontSize: 13,
                fontFamily: 'Poppins')),
        const SizedBox(height: 40),
        // White square cells, lime focused border.
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(_otpLength, (i) {
            return SizedBox(
              width: 44,
              height: 56,
              child: TextField(
                controller: _otpCells[i],
                focusNode: _otpFocus[i],
                keyboardType: TextInputType.number,
                textAlign: TextAlign.center,
                maxLength: 1,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF111827),
                  fontFamily: 'Poppins',
                ),
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: InputDecoration(
                  counterText: '',
                  filled: true,
                  fillColor: const Color(0xFFF9FAFB),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide.none,
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide.none,
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(
                        color: AppColors.accentLimeBright, width: 2),
                  ),
                ),
                onChanged: (v) {
                  _clearError();
                  if (v.isNotEmpty && i < _otpLength - 1) {
                    _otpFocus[i + 1].requestFocus();
                  } else if (v.isEmpty && i > 0) {
                    _otpFocus[i - 1].requestFocus();
                  }
                  if (i == _otpLength - 1 && v.isNotEmpty) {
                    _verifyAndRegister();
                  }
                },
              ),
            );
          }),
        ),
        const SizedBox(height: 24),
        // Resend countdown — muted grey with seconds in lime.
        Center(
          child: _canResend
              ? TextButton(
                  onPressed: _loading ? null : _resendOtp,
                  child: const Text(
                    'Resend code',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.accentLimeBright,
                      fontFamily: 'Poppins',
                    ),
                  ),
                )
              : RichText(
                  text: TextSpan(
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white.withValues(alpha: 0.45),
                      fontFamily: 'Poppins',
                    ),
                    children: [
                      const TextSpan(text: 'You can resend the code in '),
                      TextSpan(
                        text: '$_resendTimer seconds',
                        style: const TextStyle(
                          color: AppColors.accentLimeBright,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
        ),
        if (_sentOtp != null) ...[
          const SizedBox(height: 20),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text('Developer Message',
                    style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.6),
                        fontSize: 11,
                        fontFamily: 'Poppins')),
                const SizedBox(height: 4),
                RichText(
                  text: TextSpan(
                    style: const TextStyle(
                        fontFamily: 'Poppins',
                        fontSize: 13,
                        color: AppColors.primary),
                    children: [
                      const TextSpan(text: 'Your OTP code is: '),
                      TextSpan(
                          text: _sentOtp,
                          style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontFamily: 'monospace',
                              color: AppColors.primary)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
        if (_error != null) ...[const SizedBox(height: 12), _errorBox(_error!)],
        const SizedBox(height: 28),
        PrimaryGradientButton(
          label: 'CONTINUE',
          height: 56,
          isLoading: _loading,
          onPressed: _loading ? null : _verifyAndRegister,
        ),
      ],
    );
  }

  // ── Phone field — white pill with country-code dropdown on the left ──────

  Widget _phoneField() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 12),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _countryCode,
                dropdownColor: Colors.white,
                style: const TextStyle(
                    color: Color(0xFF111827),
                    fontFamily: 'Poppins',
                    fontSize: 15,
                    fontWeight: FontWeight.w600),
                icon: const Icon(LucideIcons.chevronDown,
                    color: Color(0xFF6B7280), size: 16),
                items: _countryCodes
                    .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                    .toList(),
                onChanged: (v) {
                  if (v != null) setState(() => _countryCode = v);
                },
              ),
            ),
          ),
          Container(width: 1, height: 24, color: const Color(0xFFE5E7EB)),
          Expanded(
            child: TextField(
              controller: _phoneCtrl,
              keyboardType: TextInputType.phone,
              onChanged: (_) => _clearError(),
              style: const TextStyle(
                  color: Color(0xFF111827),
                  fontFamily: 'Poppins',
                  fontSize: 15,
                  fontWeight: FontWeight.w500),
              decoration: const InputDecoration(
                hintText: 'PHONE NO',
                hintStyle: TextStyle(
                  color: Color(0xFF9CA3AF),
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  letterSpacing: 1.2,
                  fontFamily: 'Poppins',
                ),
                border: InputBorder.none,
                contentPadding:
                    EdgeInsets.symmetric(horizontal: 12, vertical: 18),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _label(String text) => Text(text,
      style: const TextStyle(
          color: Colors.white70,
          fontSize: 13,
          fontWeight: FontWeight.w500,
          fontFamily: 'Poppins'));

  Widget _errorBox(String msg) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.red.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.redAccent.withValues(alpha: 0.4)),
        ),
        child: Text(msg,
            style: const TextStyle(
                color: Colors.redAccent, fontSize: 13, fontFamily: 'Poppins')),
      );

  Widget _alreadyRegisteredBanner() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.amber.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.amber.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Account already exists',
              style: TextStyle(
                  color: Colors.amber,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Poppins')),
          const SizedBox(height: 4),
          Text('An account with this email or phone is already registered.',
              style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.7),
                  fontSize: 12,
                  fontFamily: 'Poppins')),
          const SizedBox(height: 10),
          PrimaryGradientButton(
            label: 'SIGN IN INSTEAD',
            height: 40,
            onPressed: () => context.go('/login'),
          ),
        ],
      ),
    );
  }
}
