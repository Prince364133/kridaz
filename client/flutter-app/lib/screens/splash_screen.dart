import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'dart:async';
import 'dart:math' as math;
import '../services/auth_manager.dart';

class SplashScreen extends StatefulWidget {
  final Widget nextScreen;

  const SplashScreen({
    super.key,
    required this.nextScreen,
  });

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();

    // Set status bar to black
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
      ),
    );

    // Initialize fade animation
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fadeController, curve: Curves.easeIn),
    );

    // Start fade in animation
    _fadeController.forward();

    // Navigate to next screen after delay
    Timer(const Duration(seconds: 3), () {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) =>
                widget.nextScreen,
            transitionsBuilder:
                (context, animation, secondaryAnimation, child) {
              return FadeTransition(
                opacity: animation,
                child: child,
              );
            },
            transitionDuration: const Duration(milliseconds: 500),
          ),
        );
      }
    });
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: Center(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo Icon - Star with person
              CustomPaint(
                size: const Size(70, 70),
                painter: _LogoIconPainter(),
              ),
              const SizedBox(width: 16),
              // Text Column
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // "BOOK MY" in regular weight
                  const Text(
                    'BOOK MY',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w500,
                      letterSpacing: 2.0,
                      height: 1.0,
                    ),
                  ),
                  // "SPORTZ" in bold italic
                  const Text(
                    'SPORTZ',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 42,
                      fontWeight: FontWeight.w900,
                      fontStyle: FontStyle.italic,
                      letterSpacing: 1.0,
                      height: 1.1,
                    ),
                  ),
                  const SizedBox(height: 2),
                  // "BY REACT SPORTS CLUB" subtitle
                  const Text(
                    'BY REACT SPORTS CLUB',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 8,
                      fontWeight: FontWeight.w400,
                      letterSpacing: 1.8,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Custom painter for the logo icon
class _LogoIconPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final whitePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    final center = Offset(size.width / 2, size.height / 2);

    // Draw the star shape
    final starPath = Path();
    final outerRadius = size.width / 2;
    final innerRadius = outerRadius * 0.4;

    // Create a 5-pointed star
    for (var i = 0; i < 5; i++) {
      final outerAngle = (i * 72 - 90) * math.pi / 180;
      final innerAngle = ((i * 72) + 36 - 90) * math.pi / 180;

      final outerX = center.dx + outerRadius * math.cos(outerAngle);
      final outerY = center.dy + outerRadius * math.sin(outerAngle);

      final innerX = center.dx + innerRadius * math.cos(innerAngle);
      final innerY = center.dy + innerRadius * math.sin(innerAngle);

      if (i == 0) {
        starPath.moveTo(outerX, outerY);
      } else {
        starPath.lineTo(outerX, outerY);
      }
      starPath.lineTo(innerX, innerY);
    }
    starPath.close();

    canvas.drawPath(starPath, whitePaint);

    // Draw person figure (silhouette) on top of the star
    final blackPaint = Paint()
      ..color = Colors.black
      ..style = PaintingStyle.fill;

    // Head (circle)
    canvas.drawCircle(
      Offset(center.dx, center.dy - size.height * 0.12),
      size.width * 0.09,
      blackPaint,
    );

    // Body (trapezoid shape for torso and legs)
    final bodyPath = Path();
    // Shoulders
    bodyPath.moveTo(center.dx - size.width * 0.12, center.dy);
    // Left leg
    bodyPath.lineTo(
        center.dx - size.width * 0.15, center.dy + size.height * 0.2);
    // Right leg
    bodyPath.lineTo(
        center.dx + size.width * 0.15, center.dy + size.height * 0.2);
    // Right shoulder
    bodyPath.lineTo(center.dx + size.width * 0.12, center.dy);
    bodyPath.close();

    canvas.drawPath(bodyPath, blackPaint);

    // Arms raised (two triangular shapes)
    final leftArmPath = Path();
    leftArmPath.moveTo(
        center.dx - size.width * 0.1, center.dy + size.height * 0.02);
    leftArmPath.lineTo(
        center.dx - size.width * 0.25, center.dy - size.height * 0.08);
    leftArmPath.lineTo(
        center.dx - size.width * 0.15, center.dy + size.height * 0.08);
    leftArmPath.close();

    final rightArmPath = Path();
    rightArmPath.moveTo(
        center.dx + size.width * 0.1, center.dy + size.height * 0.02);
    rightArmPath.lineTo(
        center.dx + size.width * 0.25, center.dy - size.height * 0.08);
    rightArmPath.lineTo(
        center.dx + size.width * 0.15, center.dy + size.height * 0.08);
    rightArmPath.close();

    canvas.drawPath(leftArmPath, blackPaint);
    canvas.drawPath(rightArmPath, blackPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ---------------------------------------------------------------------------
// SplashScreenRouter — go_router-aware splash screen.
// Uses context.go() instead of Navigator.pushReplacement so that go_router's
// redirect guard fires and the back-stack is cleared correctly.
// ---------------------------------------------------------------------------
class SplashScreenRouter extends StatefulWidget {
  const SplashScreenRouter({super.key});

  @override
  State<SplashScreenRouter> createState() => _SplashScreenRouterState();
}

class _SplashScreenRouterState extends State<SplashScreenRouter>
    with SingleTickerProviderStateMixin {
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();

    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
      ),
    );

    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fadeController, curve: Curves.easeIn),
    );

    _fadeController.forward();

    Timer(const Duration(seconds: 3), () {
      if (mounted) {
        context.go(AuthManager().isLoggedIn ? '/dashboard' : '/welcome');
      }
    });
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: Center(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CustomPaint(
                size: const Size(70, 70),
                painter: _LogoIconPainter(),
              ),
              const SizedBox(width: 16),
              const Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'BOOK MY',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w500,
                      letterSpacing: 2.0,
                      height: 1.0,
                    ),
                  ),
                  Text(
                    'SPORTZ',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 42,
                      fontWeight: FontWeight.w900,
                      fontStyle: FontStyle.italic,
                      letterSpacing: 1.0,
                      height: 1.1,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'BY REACT SPORTS CLUB',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 8,
                      fontWeight: FontWeight.w400,
                      letterSpacing: 1.8,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
