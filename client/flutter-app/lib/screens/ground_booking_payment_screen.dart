import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../core/constants/app_colors.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';
import '../services/booking_service.dart';
import '../widgets/common/bms_toast.dart';
import '../widgets/common/primary_gradient_button.dart';

class GroundBookingPaymentScreen extends StatefulWidget {
  final String turfId;
  final String groundName;
  final String selectedDate;
  final String selectedTimeSlot;
  final String startTime;
  final String endTime;
  final double totalPrice;
  final double advanceAmount;
  final double balanceAmount;
  final int advancePercent;

  const GroundBookingPaymentScreen({
    super.key,
    this.turfId = '',
    required this.groundName,
    required this.selectedDate,
    required this.selectedTimeSlot,
    this.startTime = '',
    this.endTime = '',
    required this.totalPrice,
    required this.advanceAmount,
    this.balanceAmount = 0,
    this.advancePercent = 50,
  });

  @override
  State<GroundBookingPaymentScreen> createState() =>
      _GroundBookingPaymentScreenState();
}

class _GroundBookingPaymentScreenState
    extends State<GroundBookingPaymentScreen> {
  final BookingService _bookingService = BookingService();

  double _usableBalance = 0;
  bool _isLoadingWallet = true;
  bool _isPaying = false;

  // Coupon
  final TextEditingController _couponController = TextEditingController();
  bool _isValidatingCoupon = false;
  double _couponDiscount = 0;
  String? _couponMessage;
  bool _couponApplied = false;

  // The advance % was already chosen on the checkout screen; treat the
  // amounts passed in as the source of truth.
  double get _baseAdvance => widget.advanceAmount;
  double get _balanceAtVenue => widget.balanceAmount;
  double get _finalAmount =>
      (_baseAdvance - _couponDiscount).clamp(0, double.infinity);

  bool get _hasEnoughBalance => _usableBalance >= _finalAmount;

  @override
  void initState() {
    super.initState();
    _loadWallet();
  }

  @override
  void dispose() {
    _couponController.dispose();
    super.dispose();
  }

  Future<void> _loadWallet() async {
    final data = await _bookingService.getWalletData();
    if (mounted) {
      setState(() {
        final rawBal = data?['usableBalance'];
        _usableBalance = rawBal == null
            ? 0
            : rawBal is num
                ? rawBal.toDouble()
                : double.tryParse(rawBal.toString()) ?? 0;
        _isLoadingWallet = false;
      });
    }
  }

  Future<void> _applyCoupon() async {
    final code = _couponController.text.trim();
    if (code.isEmpty) return;
    setState(() {
      _isValidatingCoupon = true;
      _couponMessage = null;
      _couponApplied = false;
      _couponDiscount = 0;
    });
    final result = await _bookingService.validateCoupon(
      code: code,
      turfId: widget.turfId,
      amount: _baseAdvance,
    );
    if (mounted) {
      if (result?['success'] == true) {
        final discount = (result!['discount'] as num?)?.toDouble() ?? 0;
        setState(() {
          _couponDiscount = discount;
          _couponApplied = true;
          _couponMessage = result['message']?.toString() ?? 'Coupon applied!';
          _isValidatingCoupon = false;
        });
      } else {
        setState(() {
          _couponMessage =
              result?['message']?.toString() ?? 'Invalid coupon code';
          _isValidatingCoupon = false;
        });
      }
    }
  }

  Future<void> _payWithWallet() async {
    if (widget.turfId.isEmpty) {
      _showError('Missing booking details.');
      return;
    }
    if (!_hasEnoughBalance) {
      _promptRecharge();
      return;
    }
    setState(() => _isPaying = true);
    final now = DateTime.now().toUtc();
    final result = await _bookingService.bookWithWallet(
      turfId: widget.turfId,
      startTime: widget.startTime.isNotEmpty
          ? widget.startTime
          : now.toIso8601String(),
      endTime: widget.endTime.isNotEmpty
          ? widget.endTime
          : now.add(const Duration(hours: 1)).toIso8601String(),
      selectedTurfDate: widget.startTime.isNotEmpty
          ? widget.startTime
          : now.toIso8601String(),
      totalPrice: widget.totalPrice,
      couponCode: _couponApplied ? _couponController.text.trim() : null,
      advanceAmount: _finalAmount,
      balanceAmount: _balanceAtVenue,
      paymentType: widget.advancePercent == 100 ? 'FULL' : 'PARTIAL',
      idempotencyKey: const Uuid().v4(),
    );
    if (!mounted) return;
    setState(() => _isPaying = false);
    if (result.success && result.data?['success'] == true) {
      context.go('/ground-booking/success', extra: {
        'bookingId': result.data!['bookingId']?.toString() ?? '',
        'groundName': widget.groundName,
        'selectedDate': widget.selectedDate,
        'selectedTimeSlot': widget.selectedTimeSlot,
        'totalPrice': widget.totalPrice,
      });
    } else {
      _handleBookingError(
        code: result.code,
        message: result.error ?? result.data?['message']?.toString(),
      );
    }
  }

  /// Surface an action-toast pointing the user to the recharge flow when
  /// their wallet can't cover the advance. After recharge returns, we refresh
  /// the balance so the PAY button can re-enable.
  void _promptRecharge() {
    BmsToast.action(
      context,
      'Insufficient wallet balance (₹${_usableBalance.toStringAsFixed(0)} available).',
      actionLabel: 'RECHARGE',
      isError: true,
      onAction: () async {
        final result = await context.push('/wallet/recharge');
        if (!mounted) return;
        if (result is Map && result['success'] == true) {
          setState(() => _isLoadingWallet = true);
          await _loadWallet();
        }
      },
    );
  }

  void _showError(String message) {
    if (!mounted) return;
    BmsToast.error(context, message);
  }

  /// Surface a backend booking error in user-friendly language and, when the
  /// failure is recoverable in-app (e.g. slot conflict), offer a one-tap CTA
  /// back to the date picker so the user can choose another slot.
  ///
  /// Branches on the stable backend `code` first because the user-facing
  /// `message` is sanitized for 500/internal-trace responses — for those
  /// the message becomes "Server error. Please try again in a moment.",
  /// which would otherwise mask the real cause (e.g. SLOT_UNAVAILABLE
  /// returned with a 500 by an unhappy backend).
  void _handleBookingError({String? code, String? message}) {
    if (!mounted) return;
    final msg = message ?? '';
    final c = code ?? '';

    if (c == 'SLOT_UNAVAILABLE' ||
        c == 'BOOKING_CONFLICT' ||
        msg.contains('SLOT_UNAVAILABLE')) {
      BmsToast.action(
        context,
        'This slot was just booked. Please pick another time.',
        actionLabel: 'CHANGE SLOT',
        isError: true,
        onAction: () => context.go(
          '/ground-booking/date',
          extra: {
            'turfId': widget.turfId,
            'groundName': widget.groundName,
          },
        ),
      );
      return;
    }

    if (c.startsWith('INSUFFICIENT') || msg.contains('INSUFFICIENT')) {
      _promptRecharge();
      return;
    }

    // Idempotency replay collision — the previous Pay tap is still being
    // processed. Tell the user to wait rather than letting them mash the
    // button into a double-charge attempt.
    if (c == 'IDEMPOTENCY_IN_PROGRESS') {
      _showError(
          'Still processing your previous attempt. Please wait a moment.');
      return;
    }

    // Strip backend-style "An error occurred:" prefix when present so the
    // toast reads cleanly to the user.
    final clean =
        msg.replaceFirst(RegExp(r'^An error occurred:\s*'), '').trim();
    _showError(
        clean.isNotEmpty ? clean : 'Wallet payment failed. Please try again.');
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
          'Payment',
          style: TextStyle(
              color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 16),

            // ── Amount summary (chosen on checkout, shown read-only) ──
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surfaceL3,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Advance to pay (${widget.advancePercent}%)',
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.5),
                            fontSize: 12),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '₹${_finalAmount.toStringAsFixed(0)}',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.w800),
                      ),
                      if (_couponApplied && _couponDiscount > 0) ...[
                        const SizedBox(height: 2),
                        Text(
                          '- ₹${_couponDiscount.toStringAsFixed(0)} coupon saved',
                          style: const TextStyle(
                              color: AppColors.accentLime, fontSize: 11),
                        ),
                      ],
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'Balance at venue',
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.5),
                            fontSize: 11),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '₹${_balanceAtVenue.toStringAsFixed(0)}',
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.7),
                            fontSize: 16,
                            fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ── Coupon Code ──
            Text(
              'COUPON CODE',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.45),
                fontSize: 11,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _couponController,
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                    textCapitalization: TextCapitalization.characters,
                    decoration: InputDecoration(
                      hintText: 'Enter coupon code',
                      hintStyle: TextStyle(
                          color: Colors.white.withValues(alpha: 0.3),
                          fontSize: 13),
                      filled: true,
                      fillColor: AppColors.surfaceL3,
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 14),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide.none,
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(
                          color: _couponApplied
                              ? AppColors.accentLime.withValues(alpha: 0.5)
                              : Colors.white.withValues(alpha: 0.08),
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(
                            color: AppColors.gradientEnd, width: 1.5),
                      ),
                      suffixIcon: _couponApplied
                          ? const Icon(LucideIcons.checkCircle,
                              color: AppColors.accentLime, size: 20)
                          : null,
                    ),
                    onSubmitted: (_) => _applyCoupon(),
                  ),
                ),
                const SizedBox(width: 10),
                GestureDetector(
                  onTap: _isValidatingCoupon ? null : _applyCoupon,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [
                          AppColors.gradientStart,
                          AppColors.gradientEnd
                        ],
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: _isValidatingCoupon
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                                color: Colors.black, strokeWidth: 2),
                          )
                        : const Text(
                            'Apply',
                            style: TextStyle(
                                color: Colors.black,
                                fontSize: 13,
                                fontWeight: FontWeight.w700),
                          ),
                  ),
                ),
              ],
            ),
            if (_couponMessage != null) ...[
              const SizedBox(height: 6),
              Text(
                _couponMessage!,
                style: TextStyle(
                  color: _couponApplied
                      ? AppColors.accentLime
                      : Colors.red.shade400,
                  fontSize: 12,
                ),
              ),
            ],

            const SizedBox(height: 28),

            // ── Wallet (only payment method) ──
            Text(
              'PAY USING',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.45),
                fontSize: 11,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 12),

            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: AppColors.surfaceL3,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.accentBlue, width: 1.5),
              ),
              child: Row(
                children: [
                  Image.asset('assets/icons/wallet_icon.png',
                      width: 28,
                      height: 28,
                      errorBuilder: (_, __, ___) => const Icon(
                          LucideIcons.wallet,
                          color: AppColors.gradientEnd,
                          size: 28)),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Kridaz Wallet',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 3),
                        _isLoadingWallet
                            ? Text(
                                'Loading balance...',
                                style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.4),
                                    fontSize: 12),
                              )
                            : Text(
                                'Avl balance — ₹${_usableBalance.toStringAsFixed(0)}',
                                style: TextStyle(
                                  color: _hasEnoughBalance
                                      ? Colors.white.withValues(alpha: 0.5)
                                      : Colors.red.shade400,
                                  fontSize: 12,
                                ),
                              ),
                      ],
                    ),
                  ),
                  if (!_isLoadingWallet && !_hasEnoughBalance)
                    GestureDetector(
                      onTap: () async {
                        final result = await context.push('/wallet/recharge');
                        if (!mounted) return;
                        if (result is Map && result['success'] == true) {
                          setState(() => _isLoadingWallet = true);
                          await _loadWallet();
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [
                              AppColors.gradientStart,
                              AppColors.gradientEnd
                            ],
                          ),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'RECHARGE',
                          style: TextStyle(
                            color: Colors.black,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: EdgeInsets.fromLTRB(
            20, 12, 20, MediaQuery.of(context).padding.bottom + 12),
        color: AppColors.surfaceL1,
        child: PrimaryGradientButton(
          label: 'PAY WITH WALLET',
          isLoading: _isPaying,
          onPressed: (_isPaying || _isLoadingWallet) ? null : _payWithWallet,
        ),
      ),
    );
  }
}
