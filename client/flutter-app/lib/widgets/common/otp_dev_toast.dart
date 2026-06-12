import 'package:flutter/material.dart';

/// Top floating toast that surfaces the dev-mode OTP echoed back by the
/// backend (the real SMS/WhatsApp delivery isn't wired up yet, so the
/// backend returns `testOtp` on send-otp / forgot-password-otp / login-step1).
///
/// Auto-dismisses after [duration]. Returns the inserted [OverlayEntry] so
/// the caller can dispose of it early on widget tear-down.
class OtpDevToast {
  static OverlayEntry? _current;

  static OverlayEntry show(
    BuildContext context,
    String otp, {
    Duration duration = const Duration(seconds: 8),
  }) {
    _current?.remove();
    final entry = OverlayEntry(
      builder: (ctx) => Positioned(
        top: MediaQuery.of(ctx).padding.top + 12,
        left: 16,
        right: 16,
        child: Material(
          color: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.25),
                  blurRadius: 20,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Row(children: [
                  Text('\u{1F514}', style: TextStyle(fontSize: 14)),
                  SizedBox(width: 6),
                  Text(
                    'Kridaz Notification',
                    style: TextStyle(
                      fontFamily: 'Poppins',
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: Colors.black,
                    ),
                  ),
                ]),
                const SizedBox(height: 4),
                RichText(
                  text: TextSpan(
                    style: const TextStyle(
                      fontFamily: 'Poppins',
                      fontSize: 12,
                      color: Color(0xFF555555),
                    ),
                    children: [
                      const TextSpan(text: 'Your verification code is: '),
                      TextSpan(
                        text: otp,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          color: Colors.black,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    Overlay.of(context).insert(entry);
    _current = entry;
    Future.delayed(duration, () {
      if (identical(_current, entry)) _current = null;
      entry.remove();
    });
    return entry;
  }
}
