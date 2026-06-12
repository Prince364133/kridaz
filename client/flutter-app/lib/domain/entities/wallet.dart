class WalletTransaction {
  final String id;
  final double amount;
  final String type;
  final String status;
  final String description;
  final DateTime createdAt;
  final String? bookingId;

  const WalletTransaction({
    required this.id,
    required this.amount,
    required this.type,
    required this.status,
    required this.description,
    required this.createdAt,
    this.bookingId,
  });

  bool get isCredit => amount > 0 && status.toUpperCase() == 'SUCCESS';
  bool get isPending =>
      status.toUpperCase() == 'RESERVED' || status.toUpperCase() == 'PENDING';
}

class Wallet {
  final double balance;
  final double reservedBalance;
  final double pendingBalance;
  final double usableBalance;
  final List<WalletTransaction> transactions;

  const Wallet({
    required this.balance,
    required this.reservedBalance,
    required this.pendingBalance,
    required this.usableBalance,
    this.transactions = const [],
  });

  static const empty = Wallet(
    balance: 0,
    reservedBalance: 0,
    pendingBalance: 0,
    usableBalance: 0,
  );
}
