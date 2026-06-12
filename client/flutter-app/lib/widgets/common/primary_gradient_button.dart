import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/constants/app_colors.dart';

/// The signature cyan→lime CTA button used on every primary action across
/// the app. Replaces ad-hoc `ElevatedButton` + `DecoratedBox` + gradient
/// dance that's been rebuilt in 30+ places.
///
/// Usage:
///   PrimaryGradientButton(label: 'JOIN GAME', onPressed: _join)
///   PrimaryGradientButton.loading(label: 'JOINING…')
class PrimaryGradientButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool fullWidth;
  final double height;
  final IconData? icon;
  final Gradient gradient;

  const PrimaryGradientButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.isLoading = false,
    this.fullWidth = true,
    this.height = 52,
    this.icon,
    this.gradient = AppGradients.primary,
  });

  /// Convenience constructor — non-tappable loading state.
  const PrimaryGradientButton.loading({
    super.key,
    required this.label,
    this.fullWidth = true,
    this.height = 52,
    this.icon,
    this.gradient = AppGradients.primary,
  })  : onPressed = null,
        isLoading = true;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null && !isLoading;
    final btn = AnimatedOpacity(
      duration: const Duration(milliseconds: 120),
      opacity: enabled ? 1.0 : 0.55,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(AppRadii.button),
          boxShadow: enabled
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.18),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: SizedBox(
          height: height,
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(AppRadii.button),
              onTap: enabled
                  ? () {
                      HapticFeedback.mediumImpact();
                      onPressed!();
                    }
                  : null,
              child: Center(
                child: isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          color: Colors.black,
                          strokeWidth: 2.4,
                        ),
                      )
                    : Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (icon != null) ...[
                            Icon(icon, color: Colors.black, size: 18),
                            const SizedBox(width: 8),
                          ],
                          Text(
                            label,
                            style: const TextStyle(
                              color: Colors.black,
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.8,
                              fontFamily: 'Poppins',
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ),
        ),
      ),
    );
    return fullWidth ? SizedBox(width: double.infinity, child: btn) : btn;
  }
}
