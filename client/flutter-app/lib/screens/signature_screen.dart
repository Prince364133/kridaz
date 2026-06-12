import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../core/constants/app_colors.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/services.dart';

class SignatureScreen extends StatefulWidget {
  const SignatureScreen({Key? key}) : super(key: key);

  @override
  State<SignatureScreen> createState() => _SignatureScreenState();
}

class _SignatureScreenState extends State<SignatureScreen> {
  final List<DrawingPoint?> _points = [];
  bool _hasSignature = false;

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
        title: const Text(
          'Make a signature',
          style: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          // REDO button
          TextButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              setState(() {
                _points.clear();
                _hasSignature = false;
              });
            },
            child: const Text(
              'REDO',
              style: TextStyle(
                color: Colors.red,
                fontSize: 14,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
          ),
          const SizedBox(width: 8),
          // DONE button
          Container(
            margin: const EdgeInsets.only(right: 16, top: 8, bottom: 8),
            child: ElevatedButton(
              onPressed: _hasSignature
                  ? () {
                      HapticFeedback.mediumImpact();
                      context.pop(true);
                    }
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.borderGray,
                disabledBackgroundColor: AppColors.backgroundCard,
                foregroundColor: Colors.white,
                disabledForegroundColor: Colors.white.withValues(alpha: 0.3),
                elevation: 0,
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                'DONE',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          const SizedBox(height: 20),

          // Signature Canvas
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.textLightGray,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: GestureDetector(
                    onPanStart: (details) {
                      setState(() {
                        _hasSignature = true;
                        _points.add(
                          DrawingPoint(
                            details.localPosition,
                            Paint()
                              ..color = Colors.black
                              ..strokeWidth = 3
                              ..strokeCap = StrokeCap.round,
                          ),
                        );
                      });
                    },
                    onPanUpdate: (details) {
                      setState(() {
                        _points.add(
                          DrawingPoint(
                            details.localPosition,
                            Paint()
                              ..color = Colors.black
                              ..strokeWidth = 3
                              ..strokeCap = StrokeCap.round,
                          ),
                        );
                      });
                    },
                    onPanEnd: (details) {
                      setState(() {
                        _points.add(null);
                      });
                    },
                    child: CustomPaint(
                      painter: SignaturePainter(_points),
                      size: Size.infinite,
                    ),
                  ),
                ),
              ),
            ),
          ),

          const SizedBox(height: 40),
        ],
      ),
    );
  }
}

class DrawingPoint {
  final Offset offset;
  final Paint paint;

  DrawingPoint(this.offset, this.paint);
}

class SignaturePainter extends CustomPainter {
  final List<DrawingPoint?> points;

  SignaturePainter(this.points);

  @override
  void paint(Canvas canvas, Size size) {
    for (int i = 0; i < points.length - 1; i++) {
      final currentPoint = points[i];
      final nextPoint = points[i + 1];
      if (currentPoint != null && nextPoint != null) {
        canvas.drawLine(
          currentPoint.offset,
          nextPoint.offset,
          currentPoint.paint,
        );
      }
    }
  }

  @override
  bool shouldRepaint(SignaturePainter oldDelegate) {
    return oldDelegate.points != points;
  }
}
