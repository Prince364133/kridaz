import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';

class PaymentOption {
  final String id;
  final String name;
  final IconData? icon;
  final String? imagePath;

  PaymentOption(this.id, this.name, {this.icon, this.imagePath});
}

class PaymentScreen extends StatefulWidget {
  const PaymentScreen({super.key});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  String selectedPayment = '';

  final List<PaymentOption> onlineOptions = [
    PaymentOption('upi', 'UPI (Pay via any App)',
        imagePath: 'assets/icons/upi_icon.png'),
    PaymentOption('card', 'Credit/Debit Card',
        imagePath: 'assets/icons/card_icon.png'),
    PaymentOption('wallets', 'Wallets',
        imagePath: 'assets/icons/wallet_icon.png'),
    PaymentOption('netbanking', 'Net Banking', icon: LucideIcons.landmark),
    PaymentOption('paylater', 'Pay Later', icon: LucideIcons.clock),
    PaymentOption('emi', 'EMI', icon: LucideIcons.indianRupee),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceL2,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => context.pop(),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceL4,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        LucideIcons.arrowLeft,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  const Text(
                    'Payment',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),

            // Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Online Payment Options
                    const Text(
                      'ONLINE PAYMENT OPTIONS',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 16),

                    ...onlineOptions.map((option) => Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceL4,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: RadioListTile<String>(
                            value: option.id,
                            groupValue: selectedPayment,
                            onChanged: (value) {
                              setState(() {
                                selectedPayment = value!;
                              });
                            },
                            fillColor:
                                WidgetStateProperty.all(AppColors.primary),
                            title: Row(
                              children: [
                                if (option.imagePath != null)
                                  Image.asset(
                                    option.imagePath!,
                                    width: 24,
                                    height: 24,
                                  )
                                else
                                  Icon(
                                    option.icon,
                                    color: Colors.white,
                                    size: 22,
                                  ),
                                const SizedBox(width: 12),
                                Text(
                                  option.name,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                  ),
                                ),
                              ],
                            ),
                            contentPadding:
                                const EdgeInsets.symmetric(horizontal: 16),
                          ),
                        )),

                    const SizedBox(height: 32),

                    // Pay on Delivery Options
                    const Text(
                      'PAY ON DELIVERY OPTIONS',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 16),

                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.surfaceL4,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: RadioListTile<String>(
                        value: 'cod',
                        groupValue: selectedPayment,
                        onChanged: (value) {
                          setState(() {
                            selectedPayment = value!;
                          });
                        },
                        fillColor: WidgetStateProperty.all(AppColors.primary),
                        title: const Row(
                          children: [
                            Icon(
                              Icons.money,
                              color: Colors.white,
                              size: 20,
                            ),
                            SizedBox(width: 12),
                            Text(
                              'Cash on Delivery',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                              ),
                            ),
                          ],
                        ),
                        contentPadding:
                            const EdgeInsets.symmetric(horizontal: 16),
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Order Summary
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceL4,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Total MRP',
                                style: TextStyle(
                                    color: Colors.white, fontSize: 14),
                              ),
                              Text(
                                '₹2999',
                                style: TextStyle(
                                    color: Colors.white, fontSize: 14),
                              ),
                            ],
                          ),
                          SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Shipping',
                                style: TextStyle(
                                    color: Colors.white, fontSize: 14),
                              ),
                              Text(
                                'Free',
                                style: TextStyle(
                                    color: AppColors.accentLime, fontSize: 14),
                              ),
                            ],
                          ),
                          SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Discount on MRP',
                                style: TextStyle(
                                    color: Colors.white, fontSize: 14),
                              ),
                              Text(
                                '₹1999',
                                style: TextStyle(
                                    color: Colors.white, fontSize: 14),
                              ),
                            ],
                          ),
                          SizedBox(height: 12),
                          Divider(color: AppColors.borderGray),
                          SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Total Amount',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              Text(
                                '₹899',
                                style: TextStyle(
                                  color: AppColors.accentLime,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 80), // Space for bottom button
                  ],
                ),
              ),
            ),
          ],
        ),
      ),

      // Pay Now Button
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: const BoxDecoration(
          color: AppColors.surfaceL4,
        ),
        child: GestureDetector(
          onTap: selectedPayment.isEmpty
              ? null
              : () {
                  context.push('/success');
                },
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: BoxDecoration(
              gradient: selectedPayment.isEmpty
                  ? null
                  : const LinearGradient(
                      colors: [AppColors.gradientStart, AppColors.gradientEnd],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ),
              color: selectedPayment.isEmpty ? AppColors.borderGray : null,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              'Pay Now',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: selectedPayment.isEmpty
                    ? AppColors.textLightGray
                    : AppColors.surfaceL2,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
