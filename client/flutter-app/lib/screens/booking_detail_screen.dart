import '../core/constants/app_colors.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

class BookingDetailScreen extends StatelessWidget {
  final String bookingId;
  final String groundName;
  final String address;
  final String selectedDate;
  final String selectedTimeSlot;
  final String duration;
  final String status;
  final double price;
  final bool isPastBooking;
  final double latitude;
  final double longitude;

  const BookingDetailScreen({
    super.key,
    required this.bookingId,
    required this.groundName,
    required this.address,
    required this.selectedDate,
    required this.selectedTimeSlot,
    required this.duration,
    required this.status,
    required this.price,
    this.isPastBooking = false,
    this.latitude = 17.3725929,
    this.longitude = 78.5035713,
  });

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
          'Booking Details',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Map Section
                  GestureDetector(
                    onTap: () => _openInMaps(address),
                    child: Container(
                      height: 200,
                      margin: const EdgeInsets.all(16),
                      clipBehavior: Clip.antiAlias,
                      decoration: BoxDecoration(
                        color: AppColors.backgroundGray,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Stack(
                        children: [
                          AbsorbPointer(
                            child: FlutterMap(
                              options: MapOptions(
                                initialCenter: LatLng(latitude, longitude),
                                initialZoom: 15,
                                interactionOptions: const InteractionOptions(
                                  flags: InteractiveFlag.none,
                                ),
                              ),
                              children: [
                                TileLayer(
                                  urlTemplate:
                                      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                                  subdomains: const ['a', 'b', 'c'],
                                ),
                                MarkerLayer(
                                  markers: [
                                    Marker(
                                      point: LatLng(latitude, longitude),
                                      child: const Icon(
                                        LucideIcons.mapPin,
                                        color: Colors.red,
                                        size: 40,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          // Open in Maps chip
                          Positioned(
                            bottom: 12,
                            right: 12,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 5,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(LucideIcons.externalLink,
                                      size: 13, color: Colors.black),
                                  SizedBox(width: 4),
                                  Text(
                                    'Open in Maps',
                                    style: TextStyle(
                                      color: Colors.black,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Venue Details
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          groundName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          address,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.6),
                            fontSize: 14,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                        const SizedBox(height: 24),

                        // â”€â”€ Booking Pass Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                        _buildBookingPassCard(),

                        const SizedBox(height: 100),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Action Buttons
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.black,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.3),
                  blurRadius: 20,
                  offset: const Offset(0, -5),
                ),
              ],
            ),
            child: SafeArea(
              child: isPastBooking
                  ? _buildReBookButton(context)
                  : _buildCancelAndShareButtons(context),
            ),
          ),
        ],
      ),
    );
  }

  String get _qrData => 'kridaz://booking/$bookingId';

  Widget _buildBookingPassCard() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceL3,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        children: [
          // header with gradient
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.gradientStart, AppColors.gradientEnd],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
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

          // perforated divider
          Row(
            children: [
              Container(
                width: 20,
                height: 20,
                decoration: const BoxDecoration(
                  color: Colors.black,
                  shape: BoxShape.circle,
                ),
              ),
              Expanded(
                child: LayoutBuilder(
                  builder: (_, constraints) {
                    final dashCount = (constraints.maxWidth / 10).floor();
                    return Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: List.generate(
                        dashCount,
                        (_) => Container(
                          width: 5,
                          height: 1,
                          color: Colors.white.withValues(alpha: 0.15),
                        ),
                      ),
                    );
                  },
                ),
              ),
              Container(
                width: 20,
                height: 20,
                decoration: const BoxDecoration(
                  color: Colors.black,
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ),

          // pass details
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
            child: Column(
              children: [
                _passRow('Venue', groundName, icon: Icons.stadium_outlined),
                const SizedBox(height: 12),
                _passRow('Date', selectedDate, icon: LucideIcons.calendar),
                const SizedBox(height: 12),
                _passRow('Time', selectedTimeSlot, icon: LucideIcons.clock),
                if (duration.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  _passRow('Duration', duration, icon: LucideIcons.hourglass),
                ],
                const SizedBox(height: 12),
                _passRow('Booking ID', bookingId, icon: LucideIcons.ticket),
                const SizedBox(height: 12),
                _passRow('Status', status, icon: LucideIcons.checkCircle),
                if (price > 0) ...[
                  const SizedBox(height: 12),
                  _passRow('Total', '₹${price.toStringAsFixed(0)}',
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
                    errorCorrectionLevel: QrErrorCorrectLevel.M,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Show this at the venue',
                  style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.4), fontSize: 11),
                ),
              ],
            ),
          ),
        ],
      ),
    );
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
                width: 70,
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

  Widget _buildCancelAndShareButtons(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Cancel Booking Button
        SizedBox(
          width: double.infinity,
          height: 56,
          child: OutlinedButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              _showCancelConfirmationDialog(context);
            },
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.white.withValues(alpha: 0.7),
              side: BorderSide(
                color: Colors.white.withValues(alpha: 0.2),
                width: 1.5,
              ),
              backgroundColor: AppColors.backgroundGray,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'CANCEL BOOKING',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Share Booking Button
        GestureDetector(
          onTap: () {
            HapticFeedback.mediumImpact();
            _shareBooking();
          },
          child: Container(
            width: double.infinity,
            height: 56,
            decoration: BoxDecoration(
              color: AppColors.surfaceL3,
              borderRadius: BorderRadius.circular(12),
            ),
            alignment: Alignment.center,
            child: ShaderMask(
              shaderCallback: (bounds) => const LinearGradient(
                colors: [AppColors.gradientStart, AppColors.gradientEnd],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ).createShader(bounds),
              child: const Text(
                'SHARE BOOKING',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildReBookButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: () {
          HapticFeedback.mediumImpact();
          // Navigate to booking flow
          context.pop();
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.black,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: const Text(
          'RE BOOK VENUE',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }

  void _showCancelConfirmationDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: AppColors.backgroundCard,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Text(
            'Cancel Booking?',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w600,
            ),
          ),
          content: const Text(
            'Are you sure you want to cancel this booking? A cancellation fee may apply based on the cancellation policy.',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 14,
              fontWeight: FontWeight.w400,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                context.pop();
              },
              child: const Text(
                'No, Keep It',
                style: TextStyle(
                  color: Colors.white70,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                context.pop(); // Close dialog
                context.go('/bookings/cancellation', extra: {
                  'bookingId': bookingId,
                  'groundName': groundName,
                  'selectedDate': selectedDate,
                  'refundAmount': price * 0.5,
                });
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),
              child: const Text(
                'Yes, Cancel',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Future<void> _openInMaps(String addr) async {
    final url = Uri.parse(
        'https://www.google.com/maps/search/?api=1&query=$latitude,$longitude');
    try {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } catch (_) {
      await launchUrl(url, mode: LaunchMode.platformDefault);
    }
  }

  void _shareBooking() {
    final shareText = '''
🎾 Booking Confirmed!

Venue: $groundName
Location: $address
Date & Time: $selectedDate · $selectedTimeSlot
Duration: $duration
Booking ID: $bookingId
Amount: ₹ ${price.toStringAsFixed(0)}

Status: $status
''';

    Share.share(shareText);
  }
}
