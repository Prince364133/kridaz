import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../core/constants/app_colors.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:uuid/uuid.dart';
import '../config/api_config.dart';
import '../providers/user_provider.dart';
import '../services/wallet_service.dart';

class RechargeWalletScreen extends ConsumerStatefulWidget {
  const RechargeWalletScreen({super.key});

  @override
  ConsumerState<RechargeWalletScreen> createState() =>
      _RechargeWalletScreenState();
}

class _RechargeWalletScreenState extends ConsumerState<RechargeWalletScreen> {
  final TextEditingController _amountController = TextEditingController();
  int? _selectedPreset;
  bool _loading = false;
  String? _error;

  late final Razorpay _razorpay;

  static const _presets = [500, 1000, 2000, 5000];

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  @override
  void dispose() {
    _razorpay.clear();
    _amountController.dispose();
    super.dispose();
  }

  void _selectPreset(int amount) {
    setState(() {
      _selectedPreset = amount;
      _amountController.text = amount.toString();
      _error = null;
    });
    HapticFeedback.selectionClick();
  }

  Future<void> _onRecharge() async {
    final raw = _amountController.text.trim();
    if (raw.isEmpty) {
      setState(() => _error = 'Please enter an amount');
      return;
    }
    final amount = double.tryParse(raw);
    if (amount == null || amount <= 0) {
      setState(() => _error = 'Please enter a valid amount');
      return;
    }
    if (amount < 500) {
      setState(() => _error = 'Minimum top-up amount is ₹500');
      return;
    }
    if (amount > 10000) {
      setState(() => _error = 'Maximum top-up amount is ₹10,000');
      return;
    }

    HapticFeedback.mediumImpact();
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final data = await WalletService().createTopupOrder(
        amount,
        idempotencyKey: const Uuid().v4(),
      );
      final order = data['order'] as Map<String, dynamic>?;
      if (order == null) throw Exception('Invalid order response from server');

      final options = <String, dynamic>{
        'key': ApiConfig.razorpayKeyId,
        'amount': order['amount'], // already in paise from backend
        'order_id': order['id'],
        'name': 'Kridaz',
        'description': 'Wallet Top-up',
        'theme': {'color': '#00E5A0'},
      };

      _razorpay.open(options);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    try {
      final orderId = response.orderId ?? '';
      final verified = await WalletService().verifyTopup(
        orderId: orderId,
        paymentId: response.paymentId ?? '',
        signature: response.signature ?? '',
        idempotencyKey: const Uuid().v4(),
      );
      if (!mounted) return;
      if (verified) {
        setState(() => _loading = false);
        HapticFeedback.heavyImpact();
        ref.invalidate(walletBalanceProvider);
        context.pop({
          'success': true,
          'amount': double.tryParse(_amountController.text) ?? 0,
        });
        return;
      }

      // Fallback: webhook may be late — poll the backend's check-status
      // endpoint a few times before giving up. Matches the web client.
      final polled = await _pollTopupStatus(orderId);
      if (!mounted) return;
      setState(() => _loading = false);
      if (polled) {
        HapticFeedback.heavyImpact();
        ref.invalidate(walletBalanceProvider);
        context.pop({
          'success': true,
          'amount': double.tryParse(_amountController.text) ?? 0,
        });
      } else {
        setState(
            () => _error = 'Payment verification failed. Contact support.');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Verification error: $e';
      });
    }
  }

  /// Polls `check-status` every 2s up to 5 times — covers the case where
  /// Razorpay's webhook hasn't reached the backend by the time the SDK
  /// returns success on-device.
  Future<bool> _pollTopupStatus(String orderId) async {
    if (orderId.isEmpty) return false;
    for (var i = 0; i < 5; i++) {
      await Future<void>.delayed(const Duration(seconds: 2));
      if (!mounted) return false;
      final data = await WalletService().checkTopupStatus(orderId);
      final status = data?['status']?.toString().toLowerCase();
      if (status == 'success' || status == 'completed' || status == 'paid') {
        return true;
      }
      if (status == 'failed' || status == 'cancelled') return false;
    }
    return false;
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    if (!mounted) return;
    setState(() {
      _loading = false;
      _error = response.message ?? 'Payment failed. Please try again.';
    });
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    if (!mounted) return;
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        leading: GestureDetector(
          onTap: () => context.pop(),
          child: const Icon(LucideIcons.arrowLeft, color: Colors.white),
        ),
        title: const Text(
          'Recharge Wallet',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
            fontFamily: 'Poppins',
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Select Amount',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Poppins',
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: _presets.asMap().entries.map((e) {
                      final i = e.key;
                      final amount = e.value;
                      final isSelected = _selectedPreset == amount;
                      return Expanded(
                        child: Padding(
                          padding: EdgeInsets.only(
                              right: i < _presets.length - 1 ? 8 : 0),
                          child: GestureDetector(
                            onTap: () => _selectPreset(amount),
                            child: Container(
                              height: 44,
                              decoration: BoxDecoration(
                                color: AppColors.surfaceL3,
                                borderRadius: BorderRadius.circular(10),
                                border: isSelected
                                    ? Border.all(
                                        color: AppColors.accentNeonGreen,
                                        width: 1.5,
                                      )
                                    : null,
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                '₹${_fmt(amount)}',
                                style: TextStyle(
                                  color: isSelected
                                      ? AppColors.accentNeonGreen
                                      : Colors.white,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  fontFamily: 'Poppins',
                                ),
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 14),
                  Container(
                    height: 52,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceL3,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: TextField(
                      controller: _amountController,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontFamily: 'Poppins',
                      ),
                      decoration: InputDecoration(
                        hintText: 'Enter Amount (min ₹500)',
                        hintStyle: TextStyle(
                          color: Colors.white.withValues(alpha: 0.35),
                          fontSize: 15,
                          fontFamily: 'Poppins',
                        ),
                        border: InputBorder.none,
                      ),
                      onChanged: (_) {
                        if (_selectedPreset != null) {
                          setState(() {
                            _selectedPreset = null;
                            _error = null;
                          });
                        }
                      },
                    ),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.red.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                            color: Colors.redAccent.withValues(alpha: 0.4)),
                      ),
                      child: Text(_error!,
                          style: const TextStyle(
                              color: Colors.redAccent,
                              fontSize: 13,
                              fontFamily: 'Poppins')),
                    ),
                  ],
                  const SizedBox(height: 32),
                  const Text(
                    'Payment Options',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Poppins',
                    ),
                  ),
                  const SizedBox(height: 20),
                  _PaymentOption(icon: LucideIcons.indianRupee, label: 'UPI'),
                  const SizedBox(height: 14),
                  _PaymentOption(
                      icon: LucideIcons.creditCard, label: 'Debit/Credit Card'),
                  const SizedBox(height: 14),
                  _PaymentOption(
                      icon: LucideIcons.landmark, label: 'NetBanking'),
                ],
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(
                16, 8, 16, MediaQuery.of(context).padding.bottom + 16),
            child: GestureDetector(
              onTap: _loading ? null : _onRecharge,
              child: Container(
                height: 54,
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: _loading
                        ? [
                            AppColors.accentNeonGreen.withValues(alpha: 0.5),
                            AppColors.accentLime.withValues(alpha: 0.5),
                          ]
                        : const [
                            AppColors.accentNeonGreen,
                            AppColors.accentLime
                          ],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                alignment: Alignment.center,
                child: _loading
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                            color: Colors.black, strokeWidth: 2.5),
                      )
                    : const Text(
                        'Recharge',
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Poppins',
                        ),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _fmt(int v) => v >= 1000 ? '${v ~/ 1000},000' : v.toString();
}

class _PaymentOption extends StatelessWidget {
  final IconData icon;
  final String label;

  const _PaymentOption({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
            color: AppColors.surfaceL3,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: Colors.white, size: 22),
        ),
        const SizedBox(width: 16),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 15,
            fontFamily: 'Poppins',
          ),
        ),
      ],
    );
  }
}
