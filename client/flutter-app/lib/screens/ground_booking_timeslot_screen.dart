import '../core/constants/app_colors.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../widgets/common/primary_gradient_button.dart';

class GroundBookingTimeslotScreen extends StatefulWidget {
  final String groundName;
  final String selectedDate;
  final String selectedTimeSlot;
  final double price;

  const GroundBookingTimeslotScreen({
    super.key,
    required this.groundName,
    required this.selectedDate,
    required this.selectedTimeSlot,
    required this.price,
  });

  @override
  State<GroundBookingTimeslotScreen> createState() =>
      _GroundBookingTimeslotScreenState();
}

class _GroundBookingTimeslotScreenState
    extends State<GroundBookingTimeslotScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Column(
        children: [
          // Image carousel section
          Stack(
            children: [
              // Main image — falls back to the bundled ground photo.
              Container(
                height: 380,
                width: double.infinity,
                decoration: const BoxDecoration(
                  image: DecorationImage(
                    image: AssetImage('assets/images/home/ground.jpg'),
                    fit: BoxFit.cover,
                  ),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black.withValues(alpha: 0.3),
                        Colors.black.withValues(alpha: 0.7),
                      ],
                    ),
                  ),
                ),
              ),

              // Back button
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      context.pop();
                    },
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        LucideIcons.chevronLeft,
                        color: Colors.white,
                        size: 18,
                      ),
                    ),
                  ),
                ),
              ),

              // Carousel indicators
              Positioned(
                bottom: 20,
                left: 0,
                right: 0,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    5,
                    (index) => Container(
                      width: index == 1 ? 24 : 8,
                      height: 8,
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      decoration: BoxDecoration(
                        color: index == 1
                            ? Colors.white
                            : Colors.white.withValues(alpha: 0.4),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),

          // Content section
          Expanded(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Selected booking date
                    Row(
                      children: [
                        Icon(
                          LucideIcons.calendar,
                          color: Colors.white.withValues(alpha: 0.7),
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'Select your booking date',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Selected date display
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.backgroundGray,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.primary,
                          width: 2,
                        ),
                      ),
                      child: Row(
                        children: [
                          Text(
                            widget.selectedDate,
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Selected time slot
                    Row(
                      children: [
                        Icon(
                          LucideIcons.clock,
                          color: Colors.white.withValues(alpha: 0.7),
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'Select your time slot',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.backgroundGray,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.primary,
                          width: 2,
                        ),
                      ),
                      child: Row(
                        children: [
                          Text(
                            widget.selectedTimeSlot,
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),

      // Bottom section with price and proceed button
      bottomNavigationBar: Container(
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
          child: Row(
            children: [
              // Price section
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Price',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.6),
                      fontSize: 12,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                  Text(
                    '₹${widget.price.toStringAsFixed(0)}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),

              const SizedBox(width: 20),

              // Proceed button
              Expanded(
                child: PrimaryGradientButton(
                  label: 'PROCEED',
                  height: 56,
                  onPressed: () => context.push(
                    '/ground-booking/checkout',
                    extra: {
                      'groundName': widget.groundName,
                      'selectedDate': widget.selectedDate,
                      'selectedTimeSlot': widget.selectedTimeSlot,
                      'price': widget.price,
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
