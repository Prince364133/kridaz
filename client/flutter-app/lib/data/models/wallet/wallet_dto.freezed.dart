// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'wallet_dto.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

WalletTransactionDto _$WalletTransactionDtoFromJson(Map<String, dynamic> json) {
  return _WalletTransactionDto.fromJson(json);
}

/// @nodoc
mixin _$WalletTransactionDto {
  String get id => throw _privateConstructorUsedError;
  String get amount => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  String get description => throw _privateConstructorUsedError;
  String? get createdAt => throw _privateConstructorUsedError;
  String? get bookingId => throw _privateConstructorUsedError;

  /// Serializes this WalletTransactionDto to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of WalletTransactionDto
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $WalletTransactionDtoCopyWith<WalletTransactionDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $WalletTransactionDtoCopyWith<$Res> {
  factory $WalletTransactionDtoCopyWith(WalletTransactionDto value,
          $Res Function(WalletTransactionDto) then) =
      _$WalletTransactionDtoCopyWithImpl<$Res, WalletTransactionDto>;
  @useResult
  $Res call(
      {String id,
      String amount,
      String type,
      String status,
      String description,
      String? createdAt,
      String? bookingId});
}

/// @nodoc
class _$WalletTransactionDtoCopyWithImpl<$Res,
        $Val extends WalletTransactionDto>
    implements $WalletTransactionDtoCopyWith<$Res> {
  _$WalletTransactionDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of WalletTransactionDto
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? amount = null,
    Object? type = null,
    Object? status = null,
    Object? description = null,
    Object? createdAt = freezed,
    Object? bookingId = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      amount: null == amount
          ? _value.amount
          : amount // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String?,
      bookingId: freezed == bookingId
          ? _value.bookingId
          : bookingId // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$WalletTransactionDtoImplCopyWith<$Res>
    implements $WalletTransactionDtoCopyWith<$Res> {
  factory _$$WalletTransactionDtoImplCopyWith(_$WalletTransactionDtoImpl value,
          $Res Function(_$WalletTransactionDtoImpl) then) =
      __$$WalletTransactionDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String amount,
      String type,
      String status,
      String description,
      String? createdAt,
      String? bookingId});
}

/// @nodoc
class __$$WalletTransactionDtoImplCopyWithImpl<$Res>
    extends _$WalletTransactionDtoCopyWithImpl<$Res, _$WalletTransactionDtoImpl>
    implements _$$WalletTransactionDtoImplCopyWith<$Res> {
  __$$WalletTransactionDtoImplCopyWithImpl(_$WalletTransactionDtoImpl _value,
      $Res Function(_$WalletTransactionDtoImpl) _then)
      : super(_value, _then);

  /// Create a copy of WalletTransactionDto
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? amount = null,
    Object? type = null,
    Object? status = null,
    Object? description = null,
    Object? createdAt = freezed,
    Object? bookingId = freezed,
  }) {
    return _then(_$WalletTransactionDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      amount: null == amount
          ? _value.amount
          : amount // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String?,
      bookingId: freezed == bookingId
          ? _value.bookingId
          : bookingId // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$WalletTransactionDtoImpl extends _WalletTransactionDto {
  const _$WalletTransactionDtoImpl(
      {required this.id,
      this.amount = '0',
      this.type = '',
      this.status = '',
      this.description = '',
      this.createdAt,
      this.bookingId})
      : super._();

  factory _$WalletTransactionDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$WalletTransactionDtoImplFromJson(json);

  @override
  final String id;
  @override
  @JsonKey()
  final String amount;
  @override
  @JsonKey()
  final String type;
  @override
  @JsonKey()
  final String status;
  @override
  @JsonKey()
  final String description;
  @override
  final String? createdAt;
  @override
  final String? bookingId;

  @override
  String toString() {
    return 'WalletTransactionDto(id: $id, amount: $amount, type: $type, status: $status, description: $description, createdAt: $createdAt, bookingId: $bookingId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$WalletTransactionDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.amount, amount) || other.amount == amount) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.bookingId, bookingId) ||
                other.bookingId == bookingId));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType, id, amount, type, status, description, createdAt, bookingId);

  /// Create a copy of WalletTransactionDto
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$WalletTransactionDtoImplCopyWith<_$WalletTransactionDtoImpl>
      get copyWith =>
          __$$WalletTransactionDtoImplCopyWithImpl<_$WalletTransactionDtoImpl>(
              this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$WalletTransactionDtoImplToJson(
      this,
    );
  }
}

abstract class _WalletTransactionDto extends WalletTransactionDto {
  const factory _WalletTransactionDto(
      {required final String id,
      final String amount,
      final String type,
      final String status,
      final String description,
      final String? createdAt,
      final String? bookingId}) = _$WalletTransactionDtoImpl;
  const _WalletTransactionDto._() : super._();

  factory _WalletTransactionDto.fromJson(Map<String, dynamic> json) =
      _$WalletTransactionDtoImpl.fromJson;

  @override
  String get id;
  @override
  String get amount;
  @override
  String get type;
  @override
  String get status;
  @override
  String get description;
  @override
  String? get createdAt;
  @override
  String? get bookingId;

  /// Create a copy of WalletTransactionDto
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$WalletTransactionDtoImplCopyWith<_$WalletTransactionDtoImpl>
      get copyWith => throw _privateConstructorUsedError;
}

WalletDto _$WalletDtoFromJson(Map<String, dynamic> json) {
  return _WalletDto.fromJson(json);
}

/// @nodoc
mixin _$WalletDto {
  @JsonKey(fromJson: _toDouble)
  double get balance => throw _privateConstructorUsedError;
  @JsonKey(fromJson: _toDouble)
  double get reservedBalance => throw _privateConstructorUsedError;
  @JsonKey(fromJson: _toDouble)
  double get pendingBalance => throw _privateConstructorUsedError;
  @JsonKey(fromJson: _toDouble)
  double get usableBalance => throw _privateConstructorUsedError;
  List<WalletTransactionDto> get transactions =>
      throw _privateConstructorUsedError;

  /// Serializes this WalletDto to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of WalletDto
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $WalletDtoCopyWith<WalletDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $WalletDtoCopyWith<$Res> {
  factory $WalletDtoCopyWith(WalletDto value, $Res Function(WalletDto) then) =
      _$WalletDtoCopyWithImpl<$Res, WalletDto>;
  @useResult
  $Res call(
      {@JsonKey(fromJson: _toDouble) double balance,
      @JsonKey(fromJson: _toDouble) double reservedBalance,
      @JsonKey(fromJson: _toDouble) double pendingBalance,
      @JsonKey(fromJson: _toDouble) double usableBalance,
      List<WalletTransactionDto> transactions});
}

/// @nodoc
class _$WalletDtoCopyWithImpl<$Res, $Val extends WalletDto>
    implements $WalletDtoCopyWith<$Res> {
  _$WalletDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of WalletDto
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? balance = null,
    Object? reservedBalance = null,
    Object? pendingBalance = null,
    Object? usableBalance = null,
    Object? transactions = null,
  }) {
    return _then(_value.copyWith(
      balance: null == balance
          ? _value.balance
          : balance // ignore: cast_nullable_to_non_nullable
              as double,
      reservedBalance: null == reservedBalance
          ? _value.reservedBalance
          : reservedBalance // ignore: cast_nullable_to_non_nullable
              as double,
      pendingBalance: null == pendingBalance
          ? _value.pendingBalance
          : pendingBalance // ignore: cast_nullable_to_non_nullable
              as double,
      usableBalance: null == usableBalance
          ? _value.usableBalance
          : usableBalance // ignore: cast_nullable_to_non_nullable
              as double,
      transactions: null == transactions
          ? _value.transactions
          : transactions // ignore: cast_nullable_to_non_nullable
              as List<WalletTransactionDto>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$WalletDtoImplCopyWith<$Res>
    implements $WalletDtoCopyWith<$Res> {
  factory _$$WalletDtoImplCopyWith(
          _$WalletDtoImpl value, $Res Function(_$WalletDtoImpl) then) =
      __$$WalletDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@JsonKey(fromJson: _toDouble) double balance,
      @JsonKey(fromJson: _toDouble) double reservedBalance,
      @JsonKey(fromJson: _toDouble) double pendingBalance,
      @JsonKey(fromJson: _toDouble) double usableBalance,
      List<WalletTransactionDto> transactions});
}

/// @nodoc
class __$$WalletDtoImplCopyWithImpl<$Res>
    extends _$WalletDtoCopyWithImpl<$Res, _$WalletDtoImpl>
    implements _$$WalletDtoImplCopyWith<$Res> {
  __$$WalletDtoImplCopyWithImpl(
      _$WalletDtoImpl _value, $Res Function(_$WalletDtoImpl) _then)
      : super(_value, _then);

  /// Create a copy of WalletDto
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? balance = null,
    Object? reservedBalance = null,
    Object? pendingBalance = null,
    Object? usableBalance = null,
    Object? transactions = null,
  }) {
    return _then(_$WalletDtoImpl(
      balance: null == balance
          ? _value.balance
          : balance // ignore: cast_nullable_to_non_nullable
              as double,
      reservedBalance: null == reservedBalance
          ? _value.reservedBalance
          : reservedBalance // ignore: cast_nullable_to_non_nullable
              as double,
      pendingBalance: null == pendingBalance
          ? _value.pendingBalance
          : pendingBalance // ignore: cast_nullable_to_non_nullable
              as double,
      usableBalance: null == usableBalance
          ? _value.usableBalance
          : usableBalance // ignore: cast_nullable_to_non_nullable
              as double,
      transactions: null == transactions
          ? _value._transactions
          : transactions // ignore: cast_nullable_to_non_nullable
              as List<WalletTransactionDto>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$WalletDtoImpl extends _WalletDto {
  const _$WalletDtoImpl(
      {@JsonKey(fromJson: _toDouble) this.balance = 0,
      @JsonKey(fromJson: _toDouble) this.reservedBalance = 0,
      @JsonKey(fromJson: _toDouble) this.pendingBalance = 0,
      @JsonKey(fromJson: _toDouble) this.usableBalance = 0,
      final List<WalletTransactionDto> transactions =
          const <WalletTransactionDto>[]})
      : _transactions = transactions,
        super._();

  factory _$WalletDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$WalletDtoImplFromJson(json);

  @override
  @JsonKey(fromJson: _toDouble)
  final double balance;
  @override
  @JsonKey(fromJson: _toDouble)
  final double reservedBalance;
  @override
  @JsonKey(fromJson: _toDouble)
  final double pendingBalance;
  @override
  @JsonKey(fromJson: _toDouble)
  final double usableBalance;
  final List<WalletTransactionDto> _transactions;
  @override
  @JsonKey()
  List<WalletTransactionDto> get transactions {
    if (_transactions is EqualUnmodifiableListView) return _transactions;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_transactions);
  }

  @override
  String toString() {
    return 'WalletDto(balance: $balance, reservedBalance: $reservedBalance, pendingBalance: $pendingBalance, usableBalance: $usableBalance, transactions: $transactions)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$WalletDtoImpl &&
            (identical(other.balance, balance) || other.balance == balance) &&
            (identical(other.reservedBalance, reservedBalance) ||
                other.reservedBalance == reservedBalance) &&
            (identical(other.pendingBalance, pendingBalance) ||
                other.pendingBalance == pendingBalance) &&
            (identical(other.usableBalance, usableBalance) ||
                other.usableBalance == usableBalance) &&
            const DeepCollectionEquality()
                .equals(other._transactions, _transactions));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      balance,
      reservedBalance,
      pendingBalance,
      usableBalance,
      const DeepCollectionEquality().hash(_transactions));

  /// Create a copy of WalletDto
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$WalletDtoImplCopyWith<_$WalletDtoImpl> get copyWith =>
      __$$WalletDtoImplCopyWithImpl<_$WalletDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$WalletDtoImplToJson(
      this,
    );
  }
}

abstract class _WalletDto extends WalletDto {
  const factory _WalletDto(
      {@JsonKey(fromJson: _toDouble) final double balance,
      @JsonKey(fromJson: _toDouble) final double reservedBalance,
      @JsonKey(fromJson: _toDouble) final double pendingBalance,
      @JsonKey(fromJson: _toDouble) final double usableBalance,
      final List<WalletTransactionDto> transactions}) = _$WalletDtoImpl;
  const _WalletDto._() : super._();

  factory _WalletDto.fromJson(Map<String, dynamic> json) =
      _$WalletDtoImpl.fromJson;

  @override
  @JsonKey(fromJson: _toDouble)
  double get balance;
  @override
  @JsonKey(fromJson: _toDouble)
  double get reservedBalance;
  @override
  @JsonKey(fromJson: _toDouble)
  double get pendingBalance;
  @override
  @JsonKey(fromJson: _toDouble)
  double get usableBalance;
  @override
  List<WalletTransactionDto> get transactions;

  /// Create a copy of WalletDto
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$WalletDtoImplCopyWith<_$WalletDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
