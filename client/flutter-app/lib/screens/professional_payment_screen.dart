import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../core/constants/app_colors.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../services/booking_service.dart';
import '../widgets/common/bms_toast.dart';

/// Payment step for booking a professional session. Wallet-only — the user
/// must have a sufficient Kridaz Wallet balance; if not, they're routed to
/// the wallet top-up flow.
class ProfessionalPaymentScreen extends StatefulWidget {
  final double amount;
  final String date;
  final String timeSlot;
  final String professionalName;

  const ProfessionalPaymentScreen({
    super.key,
    required this.amount,
    required this.date,
    this.timeSlot = '',
    this.professionalName = 'B.M Sportz',
  });

  @override
  State<ProfessionalPaymentScreen> createState() =>
      _ProfessionalPaymentScreenState();
}

class _ProfessionalPaymentScreenState extends State<ProfessionalPaymentScreen> {
  final BookingService _bookingService = BookingService();
  double _usableBalance = 0;
  bool _isLoadingWallet = true;
  bool _isPaying = false;

  bool get _hasEnoughBalance => _usableBalance >= widget.amount;

  @override
  void initState() {
    super.initState();
    _loadWallet();
  }

  Future<void> _loadWallet() async {
    final data = await _bookingService.getWalletData();
    if (!mounted) return;
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

  Future<void> _payNow() async {
    if (_isPaying) return;
    if (!_hasEnoughBalance) {
      _promptRecharge();
      return;
    }
    HapticFeedback.mediumImpact();
    setState(() => _isPaying = true);

    // Professional booking flow is currently mocked end-to-end; simulate the
    // wallet deduction round-trip then navigate to success. When the backend
    // exposes a real `/pros/book-with-wallet`, swap this for the real call.
    await Future.delayed(const Duration(milliseconds: 700));
    if (!mounted) return;
    setState(() => _isPaying = false);

    context.push(
      '/professional/success',
      extra: {
        'amount': widget.amount,
        'paymentMethod': 'Kridaz Wallet',
        'date': widget.date,
        'transactionId': 'TXN${DateTime.now().millisecondsSinceEpoch}',
        'professionalName': widget.professionalName,
      },
    );
  }

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

            // ── Amount summary ──
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surfaceL3,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Amount to pay',
                    style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.5),
                        fontSize: 12),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '₹${widget.amount.toStringAsFixed(0)}',
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.w800),
                  ),
                  if (widget.date.isNotEmpty || widget.timeSlot.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      [widget.date, widget.timeSlot]
                          .where((e) => e.isNotEmpty)
                          .join(' · '),
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.6),
                          fontSize: 12),
                    ),
                  ],
                ],
              ),
            ),

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
                border: Border.all(color: AppColors.gradientEnd, width: 1.5),
              ),
              child: Row(
                children: [
                  Image.asset(
                    'assets/icons/wallet_icon.png',
                    width: 28,
                    height: 28,
                    errorBuilder: (_, __, ___) => const Icon(LucideIcons.wallet,
                        color: AppColors.gradientEnd, size: 28),
                  ),
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
        child: GestureDetector(
          onTap: (_isPaying || _isLoadingWallet) ? null : _payNow,
          child: Container(
            height: 52,
            decoration: BoxDecoration(
              gradient: (_isPaying || _isLoadingWallet)
                  ? null
                  : const LinearGradient(
                      colors: [AppColors.gradientStart, AppColors.gradientEnd],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ),
              color: (_isPaying || _isLoadingWallet) ? Colors.white12 : null,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: _isPaying
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                          color: Colors.black, strokeWidth: 2),
                    )
                  : const Text(
                      'PAY WITH WALLET',
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5,
                      ),
                    ),
            ),
          ),
        ),
      ),
    );
  }
}
