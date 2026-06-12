import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../services/phone_auth_service.dart';
import '../core/constants/app_colors.dart';
import 'otp_verification_screen.dart';
import '../widgets/common/primary_gradient_button.dart';

/// Phone Authentication Screen
/// Allows users to enter their phone number for OTP-based authentication
class PhoneAuthScreen extends StatefulWidget {
  const PhoneAuthScreen({Key? key}) : super(key: key);

  @override
  State<PhoneAuthScreen> createState() => _PhoneAuthScreenState();
}

class _PhoneAuthScreenState extends State<PhoneAuthScreen> {
  final PhoneAuthService _phoneAuthService = PhoneAuthService();
  final TextEditingController _phoneController = TextEditingController();

  String _selectedCountryCode = '+91'; // Default to India
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _sendOTP() async {
    // Clear previous errors
    setState(() {
      _errorMessage = null;
      _isLoading = true;
    });

    // Validate phone number
    final phoneNumber = _phoneController.text.trim();
    if (phoneNumber.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter your phone number';
        _isLoading = false;
      });
      return;
    }

    // Format phone number
    final formattedPhone = _phoneAuthService.formatPhoneNumber(
      phoneNumber,
      _selectedCountryCode,
    );

    if (!_phoneAuthService.isValidPhoneNumber(formattedPhone)) {
      setState(() {
        _errorMessage = 'Invalid phone number format';
        _isLoading = false;
      });
      return;
    }

    // Send OTP (stubbed — actual OTP requires email+phone via AuthManager.sendOtp)
    final result = await _phoneAuthService.sendOTP(
      phoneNumber: formattedPhone,
      onAutoVerify: (credential) async {
        await _handleAutoVerification(credential);
      },
      onError: (error) {
        setState(() {
          _errorMessage = error;
          _isLoading = false;
        });
      },
    );

    if (result.isSuccess && mounted) {
      // Navigate to OTP verification screen
      setState(() {
        _isLoading = false;
      });

      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => OTPVerificationScreen(
              phoneNumber: formattedPhone,
              verificationId: _phoneAuthService.verificationId,
            ),
          ),
        );
      }
    } else {
      setState(() {
        _errorMessage = result.message;
        _isLoading = false;
      });
    }
  }

  Future<void> _handleAutoVerification(Map<String, dynamic> credential) async {
    // Auto-verification is not used in the Kridaz flow
    if (mounted) context.go('/dashboard');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),

              // Title
              const Text(
                'Enter your phone number',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'We will send you a verification code',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.white.withValues(alpha: 0.6),
                ),
              ),

              const SizedBox(height: 40),

              // Phone icon
              Center(
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.phone_android,
                    size: 40,
                    color: AppColors.primary,
                  ),
                ),
              ),

              const SizedBox(height: 40),

              // Country code + Phone number input
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Country code dropdown
                  Container(
                    width: 100,
                    decoration: BoxDecoration(
                      color: AppColors.backgroundGray,
                      border: Border.all(color: AppColors.borderGray),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _selectedCountryCode,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        dropdownColor: AppColors.backgroundGray,
                        items: [
                          '+1', // US/Canada
                          '+91', // India
                          '+44', // UK
                          '+61', // Australia
                          '+971', // UAE
                        ].map((code) {
                          return DropdownMenuItem(
                            value: code,
                            child: Text(
                              code,
                              style: const TextStyle(
                                fontSize: 16,
                                color: Colors.white,
                              ),
                            ),
                          );
                        }).toList(),
                        onChanged: (value) {
                          setState(() {
                            _selectedCountryCode = value!;
                          });
                        },
                      ),
                    ),
                  ),

                  const SizedBox(width: 12),

                  // Phone number input
                  Expanded(
                    child: TextField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      style: const TextStyle(
                        fontSize: 18,
                        color: Colors.white,
                      ),
                      decoration: InputDecoration(
                        hintText: 'Phone number',
                        hintStyle: TextStyle(
                          color: Colors.white.withValues(alpha: 0.4),
                        ),
                        prefixIcon: const Icon(LucideIcons.phone,
                            color: AppColors.primary),
                        filled: true,
                        fillColor: AppColors.backgroundGray,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide:
                              const BorderSide(color: AppColors.borderGray),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide:
                              const BorderSide(color: AppColors.borderGray),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                              color: AppColors.primary, width: 2),
                        ),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Error message
              if (_errorMessage != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(LucideIcons.alertCircle,
                          color: Colors.red, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: Colors.red),
                        ),
                      ),
                    ],
                  ),
                ),

              const SizedBox(height: 30),

              // Send OTP button
              PrimaryGradientButton(
                label: 'SEND OTP',
                height: 56,
                isLoading: _isLoading,
                onPressed: _isLoading ? null : _sendOTP,
              ),

              const SizedBox(height: 24),

              // Privacy note
              Center(
                child: Text(
                  'By continuing, you agree to our Terms & Privacy Policy',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withValues(alpha: 0.5),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
