// ignore_for_file: invalid_annotation_target

import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../domain/entities/wallet.dart';

part 'wallet_dto.freezed.dart';
part 'wallet_dto.g.dart';

double _toDouble(dynamic v) {
  if (v == null) return 0;
  if (v is num) return v.toDouble();
  return double.tryParse(v.toString()) ?? 0;
}

@freezed
class WalletTransactionDto with _$WalletTransactionDto {
  const WalletTransactionDto._();

  const factory WalletTransactionDto({
    required String id,
    @Default('0') String amount,
    @Default('') String type,
    @Default('') String status,
    @Default('') String description,
    String? createdAt,
    String? bookingId,
  }) = _WalletTransactionDto;

  factory WalletTransactionDto.fromJson(Map<String, dynamic> json) =>
      _$WalletTransactionDtoFromJson(json);

  WalletTransaction toDomain() => WalletTransaction(
        id: id,
        amount: _toDouble(amount),
        type: type,
        status: status,
        description: description,
        createdAt: DateTime.tryParse(createdAt ?? '') ?? DateTime.now(),
        bookingId: bookingId,
      );
}

@freezed
class WalletDto with _$WalletDto {
  const WalletDto._();

  const factory WalletDto({
    @JsonKey(fromJson: _toDouble) @Default(0) double balance,
    @JsonKey(fromJson: _toDouble) @Default(0) double reservedBalance,
    @JsonKey(fromJson: _toDouble) @Default(0) double pendingBalance,
    @JsonKey(fromJson: _toDouble) @Default(0) double usableBalance,
    @Default(<WalletTransactionDto>[]) List<WalletTransactionDto> transactions,
  }) = _WalletDto;

  factory WalletDto.fromJson(Map<String, dynamic> json) =>
      _$WalletDtoFromJson(json);

  Wallet toDomain() => Wallet(
        balance: balance,
        reservedBalance: reservedBalance,
        pendingBalance: pendingBalance,
        usableBalance: usableBalance,
        transactions: transactions.map((t) => t.toDomain()).toList(),
      );
}
