import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class WagonWheelResult {
  final String? position;
  final String? distance;
  const WagonWheelResult({this.position, this.distance});
}

/// Tap a sector of the cricket field to record where the ball was hit.
/// Port of `VisualWagonWheelModal.jsx` — uses a CustomPainter for the
/// 8-sector wheel with 3 rings (short / mid / boundary).
class VisualWagonWheelModal extends StatelessWidget {
  final int runs;
  final bool isBoundary;
  final void Function(WagonWheelResult) onConfirm;
  final VoidCallback onClose;

  const VisualWagonWheelModal({
    super.key,
    required this.runs,
    required this.isBoundary,
    required this.onConfirm,
    required this.onClose,
  });

  static String _positionForAngle(double angleDeg) {
    var a = (angleDeg + 360) % 360;
    if (a < 45) return 'LONG_ON';
    if (a < 90) return 'DEEP_MID_WICKET';
    if (a < 135) return 'DEEP_SQUARE_LEG';
    if (a < 180) return 'DEEP_FINE_LEG';
    if (a < 225) return 'THIRD_MAN';
    if (a < 270) return 'DEEP_POINT';
    if (a < 315) return 'DEEP_COVER';
    return 'LONG_OFF';
  }

  static String _distanceForRadius(double pct) {
    if (pct <= 0.33) return 'SHORT';
    if (pct <= 0.66) return 'MID';
    return 'BOUNDARY';
  }

  void _handleTap(Offset local, Size size) {
    final centerX = size.width / 2;
    final centerY = size.height / 2;
    final radius = size.width / 2;
    final dx = local.dx - centerX;
    final dy = local.dy - centerY;
    final dist = sqrt(dx * dx + dy * dy);
    if (dist > radius) return;
    // atan2(0 at +x). Shift +90 so 0 is up (12 o'clock), clockwise.
    var angle = atan2(dy, dx) * 180 / pi + 90;
    if (angle < 0) angle += 360;
    final position = _positionForAngle(angle);
    final distance =
        isBoundary ? 'BOUNDARY' : _distanceForRadius(dist / radius);
    HapticFeedback.selectionClick();
    onConfirm(WagonWheelResult(position: position, distance: distance));
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black.withValues(alpha: 0.85),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Center(
            child: Container(
              constraints: const BoxConstraints(maxWidth: 380),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFF1A1A1A),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      const Expanded(
                        child: Text('SELECT SHOT DIRECTION',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.3)),
                      ),
                      GestureDetector(
                        onTap: onClose,
                        child: const Text('CLOSE',
                            style: TextStyle(
                                color: Color(0xFF60A5FA),
                                fontSize: 12,
                                fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),
                  AspectRatio(
                    aspectRatio: 1,
                    child: LayoutBuilder(builder: (context, constraints) {
                      return GestureDetector(
                        onTapDown: (d) =>
                            _handleTap(d.localPosition, constraints.biggest),
                        child: CustomPaint(
                          painter: _WagonWheelPainter(),
                          size: constraints.biggest,
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'TAP ON THE FIELD WHERE THE BALL WAS HIT',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        color: Colors.white54,
                        fontSize: 11,
                        fontStyle: FontStyle.italic),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'SCORING $runs RUN${runs == 1 ? '' : 'S'}',
                    style: const TextStyle(
                        color: Color(0xFF60A5FA),
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2.4),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () => onConfirm(const WagonWheelResult()),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white54,
                        side: BorderSide(
                            color: Colors.white.withValues(alpha: 0.1)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text('SKIP WAGON WHEEL',
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _WagonWheelPainter extends CustomPainter {
  static const _outerFill = Color(0xFF141E18);
  static const _outerStroke = Color(0xFF165133);
  static const _innerStroke = Color(0xFF1F3325);
  static const _pitchFill = Color(0xFF2E4A35);
  static const _pitchStroke = Color(0xFF417351);
  static const _labelColor = Color(0xFF5F7666);

  @override
  void paint(Canvas canvas, Size size) {
    final c = Offset(size.width / 2, size.height / 2);
    final r = size.width / 2;

    // Outer ring (boundary)
    canvas.drawCircle(
        c,
        r - 2,
        Paint()
          ..style = PaintingStyle.fill
          ..color = _outerFill);
    canvas.drawCircle(
        c,
        r - 2,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 4
          ..color = _outerStroke);

    // Mid ring
    canvas.drawCircle(
        c,
        r * 0.66,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1
          ..color = _innerStroke);
    // Inner ring (short)
    canvas.drawCircle(
        c,
        r * 0.33,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1
          ..color = _innerStroke);

    // 8 sector lines
    final sectorPaint = Paint()
      ..color = _innerStroke
      ..strokeWidth = 1;
    for (int i = 0; i < 8; i++) {
      final angle = (i * 45) * pi / 180 - pi / 2;
      canvas.drawLine(
          c, c + Offset(cos(angle) * r, sin(angle) * r), sectorPaint);
    }

    // Pitch in the middle
    final pitchRect =
        Rect.fromCenter(center: c, width: r * 0.16, height: r * 0.4);
    final pitchRRect =
        RRect.fromRectAndRadius(pitchRect, const Radius.circular(3));
    canvas.drawRRect(pitchRRect, Paint()..color = _pitchFill);
    canvas.drawRRect(
        pitchRRect,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.5
          ..color = _pitchStroke);
    // Crease lines
    final creasePaint = Paint()
      ..color = _pitchStroke.withValues(alpha: 0.5)
      ..strokeWidth = 1;
    canvas.drawLine(
        Offset(pitchRect.left, pitchRect.top + pitchRect.height * 0.25),
        Offset(pitchRect.right, pitchRect.top + pitchRect.height * 0.25),
        creasePaint);
    canvas.drawLine(
        Offset(pitchRect.left, pitchRect.bottom - pitchRect.height * 0.25),
        Offset(pitchRect.right, pitchRect.bottom - pitchRect.height * 0.25),
        creasePaint);

    _drawLabel(canvas, c, 'STRAIGHT', Offset(0, -r + 14), 0);
    _drawLabel(canvas, c, 'BEHIND', Offset(0, r - 14), 0);
    _drawLabel(canvas, c, 'LEG SIDE', Offset(r - 14, 0), pi / 2);
    _drawLabel(canvas, c, 'OFF SIDE', Offset(-r + 14, 0), -pi / 2);
  }

  void _drawLabel(
      Canvas canvas, Offset center, String text, Offset offset, double rot) {
    final tp = TextPainter(
      text: TextSpan(
          text: text,
          style: const TextStyle(
              color: _labelColor,
              fontSize: 8,
              fontWeight: FontWeight.w700,
              letterSpacing: 1)),
      textDirection: TextDirection.ltr,
    )..layout();
    final pos = center + offset;
    canvas.save();
    canvas.translate(pos.dx, pos.dy);
    canvas.rotate(rot);
    canvas.translate(-tp.width / 2, -tp.height / 2);
    tp.paint(canvas, Offset.zero);
    canvas.restore();
  }

  @override
  bool shouldRepaint(_) => false;
}
