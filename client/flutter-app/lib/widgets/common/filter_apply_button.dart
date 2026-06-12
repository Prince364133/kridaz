import 'package:flutter/material.dart';

/// "Apply" CTA used across the Arena & Pros filter sheets.
///
/// Design spec: dark grey pill (≈ #2A2A2C), centered text "Apply" rendered
/// in the mint→lime gradient. Full-width by default.
class FilterApplyButton extends StatelessWidget {
  final VoidCallback? onTap;
  final String label;

  const FilterApplyButton({
    super.key,
    required this.onTap,
    this.label = 'Apply',
  });

  static const _gradient = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [Color(0xFF6FE7C3), Color(0xFFCAE96A)],
  );

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Opacity(
        opacity: onTap == null ? 0.5 : 1,
        child: Container(
          width: double.infinity,
          height: 52,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: const Color(0xFF2A2A2C),
            borderRadius: BorderRadius.circular(12),
          ),
          child: ShaderMask(
            shaderCallback: (bounds) => _gradient.createShader(bounds),
            blendMode: BlendMode.srcIn,
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w700,
                fontFamily: 'Poppins',
                letterSpacing: 0.2,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
