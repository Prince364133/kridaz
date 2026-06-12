import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../core/constants/app_colors.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';

class GroundBookingSuccessScreen extends StatelessWidget {
  final String bookingId;
  final String groundName;
  final String selectedDate;
  final String selectedTimeSlot;
  final double totalPrice;

  const GroundBookingSuccessScreen({
    super.key,
    this.bookingId = '',
    required this.groundName,
    required this.selectedDate,
    required this.selectedTimeSlot,
    this.totalPrice = 0,
  });

  String get _displayBookingId => bookingId.isNotEmpty
      ? bookingId
      : 'BKG${DateTime.now().millisecondsSinceEpoch % 10000000}';

  String get _qrData => 'kridaz://booking/$_displayBookingId';

  @override
  Widget build(BuildContext context) {
    // Reached via `context.go(...)` which clears the back stack — without
    // this PopScope the Android back button finds nothing to pop and
    // exits the app. Intercept and route to /dashboard instead.
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        context.go('/dashboard');
      },
      child: Scaffold(
        backgroundColor: AppColors.surfaceL1,
        body: SafeArea(
          child: Column(
            children: [
              // top bar
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const SizedBox(width: 40),
                    const Text(
                      'Booking Confirmed',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w700),
                    ),
                    GestureDetector(
                      onTap: () {
                        HapticFeedback.lightImpact();
                        context.go('/dashboard');
                      },
                      child: const Icon(LucideIcons.x,
                          color: Colors.white, size: 22),
                    ),
                  ],
                ),
              ),

              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    children: [
                      const SizedBox(height: 24),

                      // Success icon + title
                      Image.asset(
                        'assets/icons/success_icon.png',
                        width: 80,
                        height: 80,
                        errorBuilder: (_, __, ___) => Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: AppColors.accentLime.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(LucideIcons.checkCircle,
                              color: AppColors.accentLime, size: 44),
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Your booking is\nsuccessful!',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                            height: 1.3),
                      ),

                      const SizedBox(height: 28),

                      // â”€â”€ Booking Pass Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                      Container(
                        decoration: BoxDecoration(
                          color: AppColors.surfaceL3,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                              color: Colors.white.withValues(alpha: 0.08)),
                        ),
                        child: Column(
                          children: [
                            // header with gradient
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 20, vertical: 16),
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    AppColors.gradientStart,
                                    AppColors.gradientEnd
                                  ],
                                  begin: Alignment.centerLeft,
                                  end: Alignment.centerRight,
                                ),
                                borderRadius: BorderRadius.vertical(
                                    top: Radius.circular(20)),
                              ),
                              child: const Text(
                                'BOOKING PASS',
                                style: TextStyle(
                                  color: Colors.black,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1.5,
                                ),
                              ),
                            ),

                            // perforated divider style
                            Row(
                              children: [
                                Container(
                                  width: 20,
                                  height: 20,
                                  decoration: const BoxDecoration(
                                    color: AppColors.surfaceL1,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                Expanded(
                                  child: LayoutBuilder(
                                    builder: (_, constraints) {
                                      final dashCount =
                                          (constraints.maxWidth / 10).floor();
                                      return Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceEvenly,
                                        children: List.generate(
                                            dashCount,
                                            (_) => Container(
                                                  width: 5,
                                                  height: 1,
                                                  color: Colors.white
                                                      .withValues(alpha: 0.15),
                                                )),
                                      );
                                    },
                                  ),
                                ),
                                Container(
                                  width: 20,
                                  height: 20,
                                  decoration: const BoxDecoration(
                                    color: AppColors.surfaceL1,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ],
                            ),

                            // booking details
                            Padding(
                              padding:
                                  const EdgeInsets.fromLTRB(20, 16, 20, 20),
                              child: Column(
                                children: [
                                  _passRow('Venue', groundName,
                                      icon: Icons.stadium_outlined),
                                  const SizedBox(height: 12),
                                  _passRow('Date', selectedDate,
                                      icon: LucideIcons.calendar),
                                  const SizedBox(height: 12),
                                  _passRow('Time', selectedTimeSlot,
                                      icon: LucideIcons.clock),
                                  const SizedBox(height: 12),
                                  _passRow('Booking ID', _displayBookingId,
                                      icon: LucideIcons.ticket),
                                  if (totalPrice > 0) ...[
                                    const SizedBox(height: 12),
                                    _passRow('Total',
                                        '₹${totalPrice.toStringAsFixed(0)}',
                                        icon: LucideIcons.indianRupee),
                                  ],
                                  const SizedBox(height: 20),

                                  // QR code
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: QrImageView(
                                      data: _qrData,
                                      version: QrVersions.auto,
                                      size: 140,
                                      backgroundColor: Colors.white,
                                      errorCorrectionLevel:
                                          QrErrorCorrectLevel.M,
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    'Show this at the venue',
                                    style: TextStyle(
                                        color:
                                            Colors.white.withValues(alpha: 0.4),
                                        fontSize: 11),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Action buttons
                      _actionButton(
                        label: 'SHARE BOOKING PASS',
                        icon: LucideIcons.share2,
                        onTap: () => _sharePass(),
                      ),
                      const SizedBox(height: 10),
                      _actionButton(
                        label: 'VIEW BOOKING',
                        icon: LucideIcons.receipt,
                        gradient: true,
                        onTap: () => context.go('/bookings'),
                      ),
                      const SizedBox(height: 28),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _sharePass() {
    final text = 'My booking at $groundName is confirmed!\n'
        'Date: $selectedDate\n'
        'Time: $selectedTimeSlot\n'
        'Booking ID: $_displayBookingId\n'
        'Booked via Kridaz';
    Share.share(text);
  }

  Widget _passRow(String label, String value, {required IconData icon}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: Colors.white38, size: 16),
        const SizedBox(width: 10),
        Expanded(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 60,
                child: Text(label,
                    style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.4),
                        fontSize: 12)),
              ),
              Expanded(
                child: Text(
                  value,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _actionButton({
    required String label,
    required IconData icon,
    required VoidCallback onTap,
    bool gradient = false,
  }) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        width: double.infinity,
        height: 52,
        decoration: BoxDecoration(
          gradient: gradient
              ? const LinearGradient(
                  colors: [AppColors.surfaceL3, AppColors.surfaceL3],
                )
              : null,
          color: gradient ? null : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: gradient
              ? null
              : Border.all(
                  color: Colors.white.withValues(alpha: 0.2), width: 1.2),
        ),
        child: Center(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon,
                  color: gradient ? AppColors.gradientStart : Colors.white,
                  size: 18),
              const SizedBox(width: 8),
              gradient
                  ? ShaderMask(
                      shaderCallback: (b) => const LinearGradient(
                        colors: [
                          AppColors.gradientStart,
                          AppColors.gradientEnd
                        ],
                      ).createShader(b),
                      child: Text(
                        label,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                    )
                  : Text(
                      label,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                      ),
                    ),
            ],
          ),
        ),
      ),
    );
  }
}
