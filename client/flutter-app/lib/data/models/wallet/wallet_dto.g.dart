// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'wallet_dto.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$WalletTransactionDtoImpl _$$WalletTransactionDtoImplFromJson(
        Map<String, dynamic> json) =>
    _$WalletTransactionDtoImpl(
      id: json['id'] as String,
      amount: json['amount'] as String? ?? '0',
      type: json['type'] as String? ?? '',
      status: json['status'] as String? ?? '',
      description: json['description'] as String? ?? '',
      createdAt: json['createdAt'] as String?,
      bookingId: json['bookingId'] as String?,
    );

Map<String, dynamic> _$$WalletTransactionDtoImplToJson(
        _$WalletTransactionDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'amount': instance.amount,
      'type': instance.type,
      'status': instance.status,
      'description': instance.description,
      'createdAt': instance.createdAt,
      'bookingId': instance.bookingId,
    };

_$WalletDtoImpl _$$WalletDtoImplFromJson(Map<String, dynamic> json) =>
    _$WalletDtoImpl(
      balance: json['balance'] == null ? 0 : _toDouble(json['balance']),
      reservedBalance: json['reservedBalance'] == null
          ? 0
          : _toDouble(json['reservedBalance']),
      pendingBalance: json['pendingBalance'] == null
          ? 0
          : _toDouble(json['pendingBalance']),
      usableBalance:
          json['usableBalance'] == null ? 0 : _toDouble(json['usableBalance']),
      transactions: (json['transactions'] as List<dynamic>?)
              ?.map((e) =>
                  WalletTransactionDto.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <WalletTransactionDto>[],
    );

Map<String, dynamic> _$$WalletDtoImplToJson(_$WalletDtoImpl instance) =>
    <String, dynamic>{
      'balance': instance.balance,
      'reservedBalance': instance.reservedBalance,
      'pendingBalance': instance.pendingBalance,
      'usableBalance': instance.usableBalance,
      'transactions': instance.transactions,
    };
