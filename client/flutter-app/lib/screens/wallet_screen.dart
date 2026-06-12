import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../core/constants/app_colors.dart';
import 'package:go_router/go_router.dart';
import '../presentation/features/wallet/controllers/wallet_controller.dart';

// Migrated to the new architecture (see lib/core/network/ARCHITECTURE.md).
// Reads `walletControllerProvider` instead of calling WalletService directly.
class WalletScreen extends ConsumerStatefulWidget {
  const WalletScreen({super.key});

  @override
  ConsumerState<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends ConsumerState<WalletScreen> {
  @override
  Widget build(BuildContext context) {
    final walletState = ref.watch(walletControllerProvider);
    final wallet = walletState.valueOrNull;
    // Show what the user can actually spend, not the gross balance. The
    // ledger has total = usable + reserved (held against pending joins /
    // bookings) + pending (in-flight top-ups). Reserved is surfaced
    // separately under the transaction-history row.
    final usableBalance = wallet?.usableBalance;
    final reservedBalance = wallet?.reservedBalance ?? 0;
    final loading = walletState.isLoading;
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
          'Wallet',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
            fontFamily: 'Poppins',
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _WalletCard(
              balance: usableBalance,
              loading: loading,
              onRecharge: () async {
                final result = await context.push('/wallet/recharge');
                if (result is Map && result['success'] == true) {
                  ref.read(walletControllerProvider.notifier).refresh();
                }
              },
            ),
            const SizedBox(height: 32),
            _PaymentRow(
              icon: LucideIcons.landmark,
              label: 'Transaction History',
              onTap: () => context.push('/wallet/transactions'),
            ),
            const SizedBox(height: 20),
            _ReservedTile(amount: reservedBalance, loading: loading),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

// â”€â”€â”€ Wallet Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _WalletCard extends StatelessWidget {
  final double? balance;
  final bool loading;
  final Future<void> Function() onRecharge;

  const _WalletCard(
      {required this.balance, required this.onRecharge, this.loading = false});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final cardWidth = constraints.maxWidth;
        return ClipPath(
          clipper: _TabCardClipper(),
          child: Container(
            height: 185,
            width: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [AppColors.accentNeonGreen, AppColors.accentLime],
              ),
            ),
            child: Stack(
              children: [
                // Texture image — right 65% of card
                Positioned(
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: cardWidth * 0.65,
                  child: Image.asset(
                    'assets/images/wallet_texture.png',
                    fit: BoxFit.cover,
                    opacity: const AlwaysStoppedAnimation(0.38),
                  ),
                ),
                // Content
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Available Balance',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontFamily: 'Poppins',
                        ),
                      ),
                      const SizedBox(height: 6),
                      loading
                          ? const SizedBox(
                              height: 36,
                              child: Center(
                                child: SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(
                                      color: Colors.white, strokeWidth: 2.5),
                                ),
                              ),
                            )
                          : Text(
                              '₹ ${_formatBalance(balance ?? 0)}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 30,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'Poppins',
                              ),
                            ),
                      const Spacer(),
                      Align(
                        alignment: Alignment.bottomRight,
                        child: GestureDetector(
                          onTap: onRecharge,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 20, vertical: 10),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceL1,
                              borderRadius: BorderRadius.circular(24),
                            ),
                            child: ShaderMask(
                              shaderCallback: (bounds) => const LinearGradient(
                                colors: [
                                  AppColors.accentNeonGreen,
                                  AppColors.accentLime
                                ],
                              ).createShader(bounds),
                              blendMode: BlendMode.srcIn,
                              child: const Text(
                                'Recharge Wallet',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  fontFamily: 'Poppins',
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _formatBalance(double v) {
    final parts = v.toStringAsFixed(2).split('.');
    final intPart = parts[0];
    final decPart = parts[1];
    final buf = StringBuffer();
    int count = 0;
    for (int i = intPart.length - 1; i >= 0; i--) {
      buf.write(intPart[i]);
      count++;
      if (count == 3 && i != 0) {
        buf.write(',');
        count = 0;
      }
    }
    return '${buf.toString().split('').reversed.join()}.$decPart';
  }
}

// â”€â”€â”€ Tab/Notch card clipper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _TabCardClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    const r = 14.0;
    final notchX = size.width * 0.67;
    final notchSlope = size.height * 0.28;

    final path = Path()
      ..moveTo(r, 0)
      ..lineTo(notchX, 0)
      ..lineTo(notchX + notchSlope * 0.5, notchSlope)
      ..lineTo(size.width, notchSlope)
      ..lineTo(size.width, size.height - r)
      ..arcToPoint(
        Offset(size.width - r, size.height),
        radius: const Radius.circular(r),
      )
      ..lineTo(r, size.height)
      ..arcToPoint(
        Offset(0, size.height - r),
        radius: const Radius.circular(r),
      )
      ..lineTo(0, r)
      ..arcToPoint(
        Offset(r, 0),
        radius: const Radius.circular(r),
      )
      ..close();
    return path;
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}

// â”€â”€â”€ Payment row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _PaymentRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _PaymentRow({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Row(
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
      ),
    );
  }
}

class _ReservedTile extends StatelessWidget {
  final double amount;
  final bool loading;

  const _ReservedTile({required this.amount, required this.loading});

  String _fmt(double v) {
    final parts = v.toStringAsFixed(2).split('.');
    final intPart = parts[0];
    final buf = StringBuffer();
    int count = 0;
    for (int i = intPart.length - 1; i >= 0; i--) {
      buf.write(intPart[i]);
      count++;
      if (count == 3 && i != 0) {
        buf.write(',');
        count = 0;
      }
    }
    return '${buf.toString().split('').reversed.join()}.${parts[1]}';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
      decoration: BoxDecoration(
        color: AppColors.surfaceL2,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.surfaceL4),
      ),
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: AppColors.surfaceL3,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(LucideIcons.lock,
                color: AppColors.accentYellow, size: 22),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Reserved Coins',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontFamily: 'Poppins',
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Held against pending joins and bookings',
                  style: TextStyle(
                    color: Color(0x80FFFFFF),
                    fontSize: 11,
                    fontFamily: 'Poppins',
                  ),
                ),
              ],
            ),
          ),
          if (loading)
            const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                  color: AppColors.accentYellow, strokeWidth: 2),
            )
          else
            Text(
              '₹ ${_fmt(amount)}',
              style: const TextStyle(
                color: AppColors.accentYellow,
                fontSize: 16,
                fontWeight: FontWeight.w700,
                fontFamily: 'Poppins',
              ),
            ),
        ],
      ),
    );
  }
}
