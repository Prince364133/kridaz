import 'package:flutter/material.dart';
import '../../core/constants/app_dimensions.dart';
import '../../core/constants/app_text_styles.dart';

class FeatureCard extends StatelessWidget {
  final String title;
  final List<Color> gradientColors;
  final String iconPath;
  final IconData fallbackIcon;
  final VoidCallback? onTap;

  const FeatureCard({
    Key? key,
    required this.title,
    required this.gradientColors,
    required this.iconPath,
    required this.fallbackIcon,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: AppDimensions.featureCardHeight,
        decoration: BoxDecoration(
          gradient: RadialGradient(
            center: Alignment.topRight,
            radius: 1.2,
            colors: gradientColors,
          ),
          borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: Padding(
                padding: const EdgeInsets.only(left: 14, right: 50),
                child: Text(
                  title,
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.2,
                  ),
                  textAlign: TextAlign.left,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
            Positioned(
              top: -12,
              right: -12,
              child: Image.asset(
                iconPath,
                width: 105,
                height: 105,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) {
                  return Icon(
                    fallbackIcon,
                    size: 80,
                    color: Colors.white.withValues(alpha: 0.3),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
