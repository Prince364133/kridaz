import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../core/constants/app_colors.dart';
import 'package:go_router/go_router.dart';
import '../services/wallet_service.dart';

class TransactionHistoryScreen extends StatefulWidget {
  const TransactionHistoryScreen({super.key});

  @override
  State<TransactionHistoryScreen> createState() =>
      _TransactionHistoryScreenState();
}

class _TransactionHistoryScreenState extends State<TransactionHistoryScreen> {
  int _tabIndex = 0; // 0 = All, 1 = Recharges

  List<Map<String, dynamic>> _allTransactions = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchTransactions();
  }

  Future<void> _fetchTransactions() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await WalletService().getWalletData();
      if (!mounted) return;
      final raw = (data?['transactions'] as List<dynamic>?) ?? [];
      setState(() {
        _allTransactions = raw.map((t) {
          final tx = t as Map<String, dynamic>;
          final type = tx['type'] as String? ?? '';
          final status = tx['status'] as String? ?? '';
          final isCredit = type == 'TOPUP';
          final rawAmt = tx['amount'];
          final amount = rawAmt == null
              ? 0.0
              : rawAmt is num
                  ? rawAmt.toDouble()
                  : double.tryParse(rawAmt.toString()) ?? 0.0;
          final desc = tx['description'] as String? ?? type;
          final createdAt = tx['createdAt'] as String? ?? '';
          final date =
              createdAt.length >= 10 ? createdAt.substring(0, 10) : createdAt;
          return {
            'id': tx['id']?.toString() ?? '',
            'amount': amount,
            'type': desc,
            'date': date,
            'isCredit': isCredit,
            'status': status,
          };
        }).toList();
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Failed to load transactions';
      });
    }
  }

  List<Map<String, dynamic>> get _visibleTransactions {
    if (_tabIndex == 1) {
      return _allTransactions.where((t) => t['isCredit'] == true).toList();
    }
    return _allTransactions;
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
          'Transaction History',
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
        children: [
          // Tab row
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Row(
              children: [
                _Tab(
                  label: 'All',
                  selected: _tabIndex == 0,
                  onTap: () => setState(() => _tabIndex = 0),
                ),
                const SizedBox(width: 12),
                _Tab(
                  label: 'Recharges',
                  selected: _tabIndex == 1,
                  onTap: () => setState(() => _tabIndex = 1),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(
                        color: AppColors.accentNeonGreen, strokeWidth: 2),
                  )
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(_error!,
                                style: const TextStyle(
                                    color: Colors.white54, fontSize: 14)),
                            const SizedBox(height: 12),
                            TextButton(
                              onPressed: _fetchTransactions,
                              child: const Text('Retry',
                                  style: TextStyle(
                                      color: AppColors.accentNeonGreen)),
                            ),
                          ],
                        ),
                      )
                    : _visibleTransactions.isEmpty
                        ? const Center(
                            child: Text(
                              'No transactions yet',
                              style: TextStyle(
                                  color: Colors.white54, fontSize: 14),
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                            itemCount: _visibleTransactions.length,
                            separatorBuilder: (_, __) => const Divider(
                              color: AppColors.surfaceL4,
                              height: 1,
                            ),
                            itemBuilder: (context, index) {
                              final tx = _visibleTransactions[index];
                              final id = tx['id'] as String;
                              final isCredit = tx['isCredit'] as bool;
                              final amount = tx['amount'] as double;
                              final type = tx['type'] as String;
                              final date = tx['date'] as String;
                              final status = tx['status'] as String? ?? '';
                              final isReserved = status == 'RESERVED';
                              final isPending =
                                  status == 'PENDING' || isReserved;

                              return Padding(
                                padding:
                                    const EdgeInsets.symmetric(vertical: 14),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Text(
                                                '${isCredit ? '+' : '-'}₹${_fmt(amount)}',
                                                style: TextStyle(
                                                  color: isPending
                                                      ? Colors.orange
                                                      : isCredit
                                                          ? const Color(
                                                              0xFF00E5A0)
                                                          : Colors.white,
                                                  fontSize: 15,
                                                  fontWeight: FontWeight.w600,
                                                  fontFamily: 'Poppins',
                                                ),
                                              ),
                                              if (isPending) ...[
                                                const SizedBox(width: 6),
                                                Container(
                                                  padding: const EdgeInsets
                                                      .symmetric(
                                                      horizontal: 6,
                                                      vertical: 2),
                                                  decoration: BoxDecoration(
                                                    color: Colors.orange
                                                        .withValues(
                                                            alpha: 0.15),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            4),
                                                  ),
                                                  child: Text(
                                                      isReserved
                                                          ? 'Reserved'
                                                          : 'Pending',
                                                      style: const TextStyle(
                                                          color: Colors.orange,
                                                          fontSize: 10,
                                                          fontFamily:
                                                              'Poppins')),
                                                ),
                                              ],
                                            ],
                                          ),
                                          const SizedBox(height: 3),
                                          Text(
                                            type,
                                            style: TextStyle(
                                              color: Colors.white
                                                  .withValues(alpha: 0.55),
                                              fontSize: 13,
                                              fontFamily: 'Poppins',
                                            ),
                                          ),
                                          if (isReserved && id.isNotEmpty) ...[
                                            const SizedBox(height: 6),
                                            _CancelLink(
                                              onTap: () =>
                                                  _confirmCancel(id, amount),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    Text(
                                      date,
                                      style: TextStyle(
                                        color: Colors.white
                                            .withValues(alpha: 0.55),
                                        fontSize: 13,
                                        fontFamily: 'Poppins',
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }

  String _fmt(double v) {
    if (v == v.roundToDouble()) return v.toInt().toString();
    return v.toStringAsFixed(2);
  }

  Future<void> _confirmCancel(String txId, double amount) async {
    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: AppColors.surfaceL2,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 18),
            const Text('Release ₹',
                style: TextStyle(
                    color: Colors.white70,
                    fontSize: 13,
                    fontFamily: 'Poppins')),
            Text('₹${_fmt(amount)} reserved',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Poppins')),
            const SizedBox(height: 10),
            const Text(
              'Cancelling this reservation will return the coins to your usable balance. '
              'If a host has already approved the join, the cancellation may be declined.',
              style: TextStyle(
                  color: Colors.white60, fontSize: 13, fontFamily: 'Poppins'),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () => Navigator.pop(ctx, false),
                    child: const Text('Keep',
                        style: TextStyle(
                            color: Colors.white, fontFamily: 'Poppins')),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.accentNeonGreen,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: () => Navigator.pop(ctx, true),
                    child: const Text('Cancel reservation',
                        style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Poppins')),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
    if (confirmed != true || !mounted) return;
    final result = await WalletService().cancelReservation(txId);
    if (!mounted) return;
    if (result.ok) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Reservation released'),
        backgroundColor: AppColors.surfaceL3,
      ));
      await _fetchTransactions();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(result.message ?? 'Could not cancel'),
        backgroundColor: Colors.red.shade900,
      ));
    }
  }
}

class _CancelLink extends StatelessWidget {
  final VoidCallback onTap;
  const _CancelLink({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(LucideIcons.xCircle, color: AppColors.accentNeonGreen, size: 14),
          SizedBox(width: 4),
          Text(
            'Cancel reservation',
            style: TextStyle(
              color: AppColors.accentNeonGreen,
              fontSize: 12,
              fontWeight: FontWeight.w600,
              fontFamily: 'Poppins',
              decoration: TextDecoration.underline,
              decorationColor: AppColors.accentNeonGreen,
            ),
          ),
        ],
      ),
    );
  }
}

class _Tab extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _Tab({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.surfaceL3 : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : Colors.white54,
            fontSize: 14,
            fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
            fontFamily: 'Poppins',
          ),
        ),
      ),
    );
  }
}
