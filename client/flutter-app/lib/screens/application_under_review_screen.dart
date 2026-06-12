import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/services.dart';
import '../core/constants/app_colors.dart';

class ApplicationUnderReviewScreen extends StatelessWidget {
  const ApplicationUnderReviewScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
          onPressed: () {
            HapticFeedback.lightImpact();
            context.pop();
          },
        ),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Success Icon
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.3),
                    blurRadius: 30,
                    spreadRadius: 10,
                  ),
                ],
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Gear/Badge shape background
                  CustomPaint(
                    size: const Size(120, 120),
                    painter: GearBadgePainter(),
                  ),
                  // Checkmark
                  const Icon(
                    LucideIcons.check,
                    color: Colors.white,
                    size: 60,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 40),

            // Title
            const Text(
              'Application\nUnder Review',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.w700,
                height: 1.2,
              ),
            ),

            const SizedBox(height: 20),

            // Description
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40),
              child: Text(
                'Your application is being reviewed\nby our team. You will be notified\nonce approved.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.7),
                  fontSize: 15,
                  fontWeight: FontWeight.w400,
                  height: 1.6,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class GearBadgePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.fill;

    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;
    final innerRadius = radius * 0.7;

    final path = Path();

    // Create gear shape with 8 teeth
    for (int i = 0; i < 8; i++) {
      final angle = (i * 45) * (3.14159 / 180);

      // Outer point
      final outerX = center.dx + radius * 0.95 * cos(angle);
      final outerY = center.dy + radius * 0.95 * sin(angle);

      // Inner point
      final innerX = center.dx + innerRadius * cos(angle + 0.39);
      final innerY = center.dy + innerRadius * sin(angle + 0.39);

      if (i == 0) {
        path.moveTo(outerX, outerY);
      } else {
        path.lineTo(outerX, outerY);
      }
      path.lineTo(innerX, innerY);
    }

    path.close();
    canvas.drawPath(path, paint);

    // Draw inner circle
    canvas.drawCircle(center, innerRadius * 0.85, paint);
  }

  double cos(double angle) {
    return math.cos(angle);
  }

  double sin(double angle) {
    return math.sin(angle);
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}
