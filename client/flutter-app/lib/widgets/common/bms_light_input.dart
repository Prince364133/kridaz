import 'package:flutter/material.dart';

/// White pill-style input used across onboarding and auth flows.
///
/// Design spec (from onboarding mocks):
/// - Background: white (#F9FAFB)
/// - Uppercase placeholder, light grey, ~12px with letter spacing
/// - Dark text once typed
/// - Rounded corners (~10), generous vertical padding
///
/// Wrap with your existing form validation / readOnly / suffix logic — this
/// widget only owns the visual shell.
class BmsLightInput extends StatelessWidget {
  final TextEditingController? controller;
  final String hint;
  final TextInputType keyboardType;
  final bool obscureText;
  final bool readOnly;
  final VoidCallback? onTap;
  final ValueChanged<String>? onChanged;
  final String? Function(String?)? validator;
  final Widget? suffix;
  final TextInputAction? textInputAction;
  final bool autofocus;
  final int? maxLength;

  const BmsLightInput({
    super.key,
    this.controller,
    required this.hint,
    this.keyboardType = TextInputType.text,
    this.obscureText = false,
    this.readOnly = false,
    this.onTap,
    this.onChanged,
    this.validator,
    this.suffix,
    this.textInputAction,
    this.autofocus = false,
    this.maxLength,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(10),
      ),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        obscureText: obscureText,
        readOnly: readOnly,
        onTap: onTap,
        onChanged: onChanged,
        validator: validator,
        textInputAction: textInputAction,
        autofocus: autofocus,
        maxLength: maxLength,
        style: const TextStyle(
          color: Color(0xFF111827),
          fontSize: 15,
          fontWeight: FontWeight.w500,
          fontFamily: 'Poppins',
        ),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(
            color: Color(0xFF9CA3AF),
            fontSize: 12,
            fontWeight: FontWeight.w500,
            letterSpacing: 1.2,
            fontFamily: 'Poppins',
          ),
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          counterText: '',
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 18,
          ),
          suffixIcon: suffix == null
              ? null
              : Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: suffix,
                ),
          suffixIconConstraints: const BoxConstraints(
            minWidth: 36,
            minHeight: 36,
          ),
        ),
      ),
    );
  }
}
