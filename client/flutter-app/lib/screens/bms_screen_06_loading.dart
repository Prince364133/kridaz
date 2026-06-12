import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/app_colors.dart';
import '../services/auth_manager.dart';
import '../services/onboarding_data.dart';
import '../services/pending_registration.dart';
import '../providers/user_provider.dart';

class BmsScreen06Loading extends ConsumerStatefulWidget {
  const BmsScreen06Loading({super.key});

  @override
  ConsumerState<BmsScreen06Loading> createState() => _BmsScreen06LoadingState();
}

class _BmsScreen06LoadingState extends ConsumerState<BmsScreen06Loading>
    with SingleTickerProviderStateMixin {
  late AnimationController _spinController;

  @override
  void initState() {
    super.initState();
    _spinController = AnimationController(
      duration: const Duration(milliseconds: 1800),
      vsync: this,
    )..repeat();

    _saveAndNavigate();
  }

  // Converts DD/MM/YYYY → YYYY-MM-DD for the backend.
  String? _isoDate(String ddmmyyyy) {
    final parts = ddmmyyyy.split('/');
    if (parts.length != 3) return null;
    return '${parts[2]}-${parts[1]}-${parts[0]}';
  }

  Future<void> _saveAndNavigate() async {
    final pending = PendingRegistration();
    final onboarding = OnboardingData();

    if (pending.hasPendingData) {
      // Email registration path — submit the full profile in one call
      await AuthManager().register(
        name: pending.name ?? '',
        email: pending.email!,
        phone: pending.phone!,
        password: pending.password!,
        registrationToken: pending.registrationToken!,
        phoneOtp: pending.phoneOtp,
        gender: onboarding.gender ?? 'Other',
        location:
            onboarding.location.isNotEmpty ? onboarding.location : 'Unknown',
        dob: onboarding.dateOfBirth.isNotEmpty
            ? _isoDate(onboarding.dateOfBirth)
            : null,
        sportTypes:
            onboarding.interests.isNotEmpty ? onboarding.interests : null,
      );
      pending.clear();
    } else {
      // Google sign-in path — update existing profile with onboarding data
      await onboarding.saveToFirebase();
    }

    // Refresh caches so the dashboard header shows the correct name/location
    await AuthManager().refreshUser();
    ref.read(userProfileNotifierProvider.notifier).refresh();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_complete', true);

    await Future.delayed(const Duration(seconds: 3));
    if (mounted) context.go('/dashboard');
  }

  @override
  void dispose() {
    _spinController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundGray,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedBuilder(
              animation: _spinController,
              builder: (context, _) => CustomPaint(
                size: const Size(140, 140),
                painter: _RingPainter(_spinController.value),
              ),
            ),
            const SizedBox(height: 36),
            Text(
              'Preparing\naccount..',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.7),
                fontSize: 16,
                fontWeight: FontWeight.w500,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  final double rotation;
  _RingPainter(this.rotation);

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 10;
    const strokeWidth = 9.0;

    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..color = AppColors.backgroundCard
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth,
    );

    final arcPaint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final rect = Rect.fromCircle(center: center, radius: radius);
    const sweep = 117.0 * math.pi / 180;
    final start = rotation * 2 * math.pi - math.pi / 2;

    canvas.drawArc(rect, start, sweep, false, arcPaint);
    canvas.drawArc(rect, start + math.pi, sweep, false, arcPaint);
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.rotation != rotation;
}
