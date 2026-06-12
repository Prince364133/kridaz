import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../core/constants/app_colors.dart';
import 'package:go_router/go_router.dart';
import '../widgets/common/bms_toast.dart';
import '../widgets/common/primary_gradient_button.dart';

class WithdrawMoneyScreen extends StatefulWidget {
  final double currentBalance;
  final List<Map<String, dynamic>> transactions;

  const WithdrawMoneyScreen({
    super.key,
    required this.currentBalance,
    required this.transactions,
  });

  @override
  State<WithdrawMoneyScreen> createState() => _WithdrawMoneyScreenState();
}

class _WithdrawMoneyScreenState extends State<WithdrawMoneyScreen> {
  final TextEditingController _amountController = TextEditingController();
  String selectedPayoutMethod = '';

  final List<Map<String, dynamic>> payoutMethods = [
    {
      'id': 'upi',
      'name': 'UPI',
      'detail': '@Sampad.d@ptaxis',
      'icon': LucideIcons.landmark
    },
    {
      'id': 'pnb',
      'name': 'PNB',
      'detail': 'A/C: -9858785******',
      'icon': LucideIcons.landmark
    },
    {
      'id': 'boa',
      'name': 'Checking Account',
      'detail': 'Bank of America',
      'icon': LucideIcons.landmark
    },
  ];

  void _handleWithdraw() {
    final amount = double.tryParse(_amountController.text);
    if (amount != null && amount > 0 && selectedPayoutMethod.isNotEmpty) {
      if (amount <= widget.currentBalance) {
        final newBalance = widget.currentBalance - amount;
        final newTransactions =
            List<Map<String, dynamic>>.from(widget.transactions);

        newTransactions.insert(0, {
          'id': newTransactions.length + 1,
          'amount': '-₹${amount.toStringAsFixed(0)}',
          'type': 'Withdrawal',
          'date': DateTime.now().toString().split(' ')[0],
        });

        context.pop({
          'balance': newBalance,
          'transactions': newTransactions,
        });

        BmsToast.success(context, 'Withdrawn ₹$amount successfully!');
      } else {
        BmsToast.error(context, 'Insufficient balance!');
      }
    } else {
      BmsToast.error(context, 'Please enter amount and select payout method');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceL2,
      appBar: AppBar(
        backgroundColor: AppColors.surfaceL2,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Withdraw Money',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Available Balance',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              ShaderMask(
                shaderCallback: (bounds) => const LinearGradient(
                  colors: [AppColors.accentPurple, AppColors.accentBlueLight],
                ).createShader(bounds),
                child: Text(
                  '₹ ${widget.currentBalance.toStringAsFixed(2)}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),

              const SizedBox(height: 24),

              const Text(
                'Amount to Withdraw',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),

              // Amount input
              TextField(
                controller: _amountController,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.black),
                decoration: InputDecoration(
                  hintText: 'Enter Amount',
                  hintStyle: const TextStyle(color: Colors.grey),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppColors.borderGray),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppColors.borderGray),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: Colors.blue),
                  ),
                  contentPadding: const EdgeInsets.all(16),
                ),
              ),

              const SizedBox(height: 32),

              // Payout Method
              const Text(
                'Payout Method',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),

              ...payoutMethods.map((method) {
                final isSelected = selectedPayoutMethod == method['id'];
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      selectedPayoutMethod = method['id'];
                    });
                  },
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppColors.surfaceSlate.withValues(alpha: 0.3)
                          : AppColors.surfaceL2,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceSlate,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(method['icon'],
                              color: Colors.white, size: 24),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                method['name'],
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              Text(
                                method['detail'],
                                style: const TextStyle(
                                  color: AppColors.textLightGray,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: isSelected
                                  ? Colors.blue
                                  : AppColors.borderGray,
                              width: 2,
                            ),
                            color:
                                isSelected ? Colors.blue : Colors.transparent,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),

              // Add Payout Method
              GestureDetector(
                onTap: () =>
                    BmsToast.info(context, 'Add Payout Method — Coming Soon'),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceSlate.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(LucideIcons.plus, color: Colors.white),
                          SizedBox(width: 16),
                          Text(
                            'Add Payout Method',
                            style: TextStyle(color: Colors.white),
                          ),
                        ],
                      ),
                      Icon(LucideIcons.chevronRight, color: Colors.white),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: const BoxDecoration(
          color: AppColors.surfaceL2,
        ),
        child: SafeArea(
          child: PrimaryGradientButton(
            label: 'WITHDRAW',
            height: 52,
            onPressed: _amountController.text.isNotEmpty &&
                    selectedPayoutMethod.isNotEmpty
                ? _handleWithdraw
                : null,
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }
}
