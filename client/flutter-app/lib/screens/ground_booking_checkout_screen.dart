import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../core/constants/app_colors.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../widgets/common/primary_gradient_button.dart';

class GroundBookingCheckoutScreen extends StatefulWidget {
  final String turfId;
  final String groundName;
  final String selectedDate;
  final String selectedTimeSlot;
  final String startTime;
  final String endTime;
  final double totalPrice;
  final String cancellationPolicy;

  const GroundBookingCheckoutScreen({
    super.key,
    this.turfId = '',
    required this.groundName,
    required this.selectedDate,
    required this.selectedTimeSlot,
    this.startTime = '',
    this.endTime = '',
    required this.totalPrice,
    this.cancellationPolicy = '',
  });

  @override
  State<GroundBookingCheckoutScreen> createState() =>
      _GroundBookingCheckoutScreenState();
}

class _GroundBookingCheckoutScreenState
    extends State<GroundBookingCheckoutScreen> {
  static const List<int> _advanceOptions = [50, 70, 100];
  int _advancePercent = 50;

  double get _advanceAmount =>
      (widget.totalPrice * _advancePercent / 100).roundToDouble();
  double get _balanceAmount =>
      (widget.totalPrice - _advanceAmount).clamp(0, double.infinity);

  void _onAdvanceChanged(int? pct) {
    if (pct == null || pct == _advancePercent) return;
    setState(() => _advancePercent = pct);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceL1,
      appBar: AppBar(
        backgroundColor: AppColors.surfaceL1,
        elevation: 0,
        leading: GestureDetector(
          onTap: () {
            HapticFeedback.lightImpact();
            context.pop();
          },
          child: const Icon(LucideIcons.chevronLeft,
              color: Colors.white, size: 18),
        ),
        title: const Text(
          'Checkout',
          style: TextStyle(
              color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700),
        ),
        actions: [
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              context.pop();
            },
            child: const Padding(
              padding: EdgeInsets.only(right: 20),
              child: Icon(LucideIcons.x, color: Colors.white, size: 22),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),

            // Ground info
            Row(
              children: [
                const Icon(Icons.stadium_outlined,
                    color: Colors.white54, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    widget.groundName,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Time + date
            Row(
              children: [
                const Icon(LucideIcons.clock, color: Colors.white38, size: 15),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '${widget.selectedTimeSlot}  ·  ${widget.selectedDate}',
                    style: const TextStyle(color: Colors.white54, fontSize: 12),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),
            Divider(color: Colors.white.withValues(alpha: 0.1), height: 1),
            const SizedBox(height: 24),

            // Price Details
            const Text(
              'Price Details',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 16),
            _priceRow(
                'Slot Price', '₹ ${widget.totalPrice.toStringAsFixed(0)}'),
            const SizedBox(height: 16),
            Divider(color: Colors.white.withValues(alpha: 0.1), height: 1),
            const SizedBox(height: 16),
            _priceRow(
              'Total Amount',
              '₹ ${widget.totalPrice.toStringAsFixed(0)}',
              valueColor: AppColors.accentLime,
              bold: true,
            ),

            const SizedBox(height: 28),
            Divider(color: Colors.white.withValues(alpha: 0.1), height: 1),
            const SizedBox(height: 24),

            // Payment breakdown
            const Text(
              'Payment',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 16),

            // Advance % selector
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.surfaceL3,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Text(
                    'Advance',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.65),
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  DropdownButtonHideUnderline(
                    child: DropdownButton<int>(
                      value: _advancePercent,
                      dropdownColor: AppColors.surfaceL4,
                      isDense: true,
                      borderRadius: BorderRadius.circular(10),
                      icon: const Icon(LucideIcons.chevronDown,
                          color: AppColors.gradientEnd, size: 20),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                      items: _advanceOptions
                          .map((p) => DropdownMenuItem<int>(
                                value: p,
                                child: Text(
                                  p == 100 ? '100% (Full)' : '$p%',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ))
                          .toList(),
                      onChanged: _onAdvanceChanged,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            _priceRow(
              'Advance Pay ($_advancePercent%)',
              '₹ ${_advanceAmount.toStringAsFixed(0)}',
              valueColor: AppColors.accentLime,
              bold: true,
            ),
            const SizedBox(height: 6),
            Text(
              _advancePercent == 100
                  ? '( Full amount paid upfront )'
                  : '( Pay ₹${_balanceAmount.toStringAsFixed(0)} balance at venue )',
              style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.45), fontSize: 11),
            ),

            const SizedBox(height: 28),
            Divider(color: Colors.white.withValues(alpha: 0.1), height: 1),
            const SizedBox(height: 24),

            // Cancellation Policy
            const Text(
              'Cancellation Policy',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 10),
            Text(
              widget.cancellationPolicy.isNotEmpty
                  ? widget.cancellationPolicy
                  : 'Cancellations made 24 hours before the booking time are eligible for a full refund. No refunds for cancellations made less than 24 hours in advance.',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.5),
                fontSize: 12,
                height: 1.6,
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: EdgeInsets.fromLTRB(
            20, 12, 20, MediaQuery.of(context).padding.bottom + 12),
        decoration: const BoxDecoration(
          color: AppColors.surfaceL1,
          border: Border(top: BorderSide(color: Colors.white10)),
        ),
        child: Row(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Advance ($_advancePercent%)',
                    style:
                        const TextStyle(color: Colors.white54, fontSize: 11)),
                const SizedBox(height: 2),
                Text(
                  '₹${_advanceAmount.toStringAsFixed(0)}',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.w800),
                ),
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: PrimaryGradientButton(
                label: 'NEXT',
                onPressed: () => context.push(
                  '/ground-booking/payment',
                  extra: {
                    'turfId': widget.turfId,
                    'groundName': widget.groundName,
                    'selectedDate': widget.selectedDate,
                    'selectedTimeSlot': widget.selectedTimeSlot,
                    'startTime': widget.startTime,
                    'endTime': widget.endTime,
                    'totalPrice': widget.totalPrice,
                    'advanceAmount': _advanceAmount,
                    'balanceAmount': _balanceAmount,
                    'advancePercent': _advancePercent,
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _priceRow(String label, String value,
      {Color valueColor = Colors.white, bool bold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.65),
            fontSize: 13,
            fontWeight: bold ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            color: valueColor,
            fontSize: bold ? 15 : 13,
            fontWeight: bold ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
