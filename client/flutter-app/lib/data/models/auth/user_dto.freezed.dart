// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'user_dto.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

UserDto _$UserDtoFromJson(Map<String, dynamic> json) {
  return _UserDto.fromJson(json);
}

/// @nodoc
mixin _$UserDto {
  String get id => throw _privateConstructorUsedError;
  String? get ownerId => throw _privateConstructorUsedError;
  String? get name => throw _privateConstructorUsedError;
  String? get username => throw _privateConstructorUsedError;
  String? get email => throw _privateConstructorUsedError;
  String? get phone => throw _privateConstructorUsedError;
  String? get role => throw _privateConstructorUsedError;
  String? get profilePicture => throw _privateConstructorUsedError;
  String? get city => throw _privateConstructorUsedError;
  List<String> get sportTypes => throw _privateConstructorUsedError;
  bool get isOnboarded => throw _privateConstructorUsedError;
  bool get isVerified => throw _privateConstructorUsedError;
  num get walletBalance => throw _privateConstructorUsedError;

  /// Serializes this UserDto to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of UserDto
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $UserDtoCopyWith<UserDto> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $UserDtoCopyWith<$Res> {
  factory $UserDtoCopyWith(UserDto value, $Res Function(UserDto) then) =
      _$UserDtoCopyWithImpl<$Res, UserDto>;
  @useResult
  $Res call(
      {String id,
      String? ownerId,
      String? name,
      String? username,
      String? email,
      String? phone,
      String? role,
      String? profilePicture,
      String? city,
      List<String> sportTypes,
      bool isOnboarded,
      bool isVerified,
      num walletBalance});
}

/// @nodoc
class _$UserDtoCopyWithImpl<$Res, $Val extends UserDto>
    implements $UserDtoCopyWith<$Res> {
  _$UserDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of UserDto
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? ownerId = freezed,
    Object? name = freezed,
    Object? username = freezed,
    Object? email = freezed,
    Object? phone = freezed,
    Object? role = freezed,
    Object? profilePicture = freezed,
    Object? city = freezed,
    Object? sportTypes = null,
    Object? isOnboarded = null,
    Object? isVerified = null,
    Object? walletBalance = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      ownerId: freezed == ownerId
          ? _value.ownerId
          : ownerId // ignore: cast_nullable_to_non_nullable
              as String?,
      name: freezed == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String?,
      username: freezed == username
          ? _value.username
          : username // ignore: cast_nullable_to_non_nullable
              as String?,
      email: freezed == email
          ? _value.email
          : email // ignore: cast_nullable_to_non_nullable
              as String?,
      phone: freezed == phone
          ? _value.phone
          : phone // ignore: cast_nullable_to_non_nullable
              as String?,
      role: freezed == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as String?,
      profilePicture: freezed == profilePicture
          ? _value.profilePicture
          : profilePicture // ignore: cast_nullable_to_non_nullable
              as String?,
      city: freezed == city
          ? _value.city
          : city // ignore: cast_nullable_to_non_nullable
              as String?,
      sportTypes: null == sportTypes
          ? _value.sportTypes
          : sportTypes // ignore: cast_nullable_to_non_nullable
              as List<String>,
      isOnboarded: null == isOnboarded
          ? _value.isOnboarded
          : isOnboarded // ignore: cast_nullable_to_non_nullable
              as bool,
      isVerified: null == isVerified
          ? _value.isVerified
          : isVerified // ignore: cast_nullable_to_non_nullable
              as bool,
      walletBalance: null == walletBalance
          ? _value.walletBalance
          : walletBalance // ignore: cast_nullable_to_non_nullable
              as num,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$UserDtoImplCopyWith<$Res> implements $UserDtoCopyWith<$Res> {
  factory _$$UserDtoImplCopyWith(
          _$UserDtoImpl value, $Res Function(_$UserDtoImpl) then) =
      __$$UserDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String? ownerId,
      String? name,
      String? username,
      String? email,
      String? phone,
      String? role,
      String? profilePicture,
      String? city,
      List<String> sportTypes,
      bool isOnboarded,
      bool isVerified,
      num walletBalance});
}

/// @nodoc
class __$$UserDtoImplCopyWithImpl<$Res>
    extends _$UserDtoCopyWithImpl<$Res, _$UserDtoImpl>
    implements _$$UserDtoImplCopyWith<$Res> {
  __$$UserDtoImplCopyWithImpl(
      _$UserDtoImpl _value, $Res Function(_$UserDtoImpl) _then)
      : super(_value, _then);

  /// Create a copy of UserDto
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? ownerId = freezed,
    Object? name = freezed,
    Object? username = freezed,
    Object? email = freezed,
    Object? phone = freezed,
    Object? role = freezed,
    Object? profilePicture = freezed,
    Object? city = freezed,
    Object? sportTypes = null,
    Object? isOnboarded = null,
    Object? isVerified = null,
    Object? walletBalance = null,
  }) {
    return _then(_$UserDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      ownerId: freezed == ownerId
          ? _value.ownerId
          : ownerId // ignore: cast_nullable_to_non_nullable
              as String?,
      name: freezed == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String?,
      username: freezed == username
          ? _value.username
          : username // ignore: cast_nullable_to_non_nullable
              as String?,
      email: freezed == email
          ? _value.email
          : email // ignore: cast_nullable_to_non_nullable
              as String?,
      phone: freezed == phone
          ? _value.phone
          : phone // ignore: cast_nullable_to_non_nullable
              as String?,
      role: freezed == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as String?,
      profilePicture: freezed == profilePicture
          ? _value.profilePicture
          : profilePicture // ignore: cast_nullable_to_non_nullable
              as String?,
      city: freezed == city
          ? _value.city
          : city // ignore: cast_nullable_to_non_nullable
              as String?,
      sportTypes: null == sportTypes
          ? _value._sportTypes
          : sportTypes // ignore: cast_nullable_to_non_nullable
              as List<String>,
      isOnboarded: null == isOnboarded
          ? _value.isOnboarded
          : isOnboarded // ignore: cast_nullable_to_non_nullable
              as bool,
      isVerified: null == isVerified
          ? _value.isVerified
          : isVerified // ignore: cast_nullable_to_non_nullable
              as bool,
      walletBalance: null == walletBalance
          ? _value.walletBalance
          : walletBalance // ignore: cast_nullable_to_non_nullable
              as num,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$UserDtoImpl extends _UserDto {
  const _$UserDtoImpl(
      {required this.id,
      this.ownerId,
      this.name,
      this.username,
      this.email,
      this.phone,
      this.role,
      this.profilePicture,
      this.city,
      final List<String> sportTypes = const <String>[],
      this.isOnboarded = false,
      this.isVerified = false,
      this.walletBalance = 0})
      : _sportTypes = sportTypes,
        super._();

  factory _$UserDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$UserDtoImplFromJson(json);

  @override
  final String id;
  @override
  final String? ownerId;
  @override
  final String? name;
  @override
  final String? username;
  @override
  final String? email;
  @override
  final String? phone;
  @override
  final String? role;
  @override
  final String? profilePicture;
  @override
  final String? city;
  final List<String> _sportTypes;
  @override
  @JsonKey()
  List<String> get sportTypes {
    if (_sportTypes is EqualUnmodifiableListView) return _sportTypes;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_sportTypes);
  }

  @override
  @JsonKey()
  final bool isOnboarded;
  @override
  @JsonKey()
  final bool isVerified;
  @override
  @JsonKey()
  final num walletBalance;

  @override
  String toString() {
    return 'UserDto(id: $id, ownerId: $ownerId, name: $name, username: $username, email: $email, phone: $phone, role: $role, profilePicture: $profilePicture, city: $city, sportTypes: $sportTypes, isOnboarded: $isOnboarded, isVerified: $isVerified, walletBalance: $walletBalance)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$UserDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.ownerId, ownerId) || other.ownerId == ownerId) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.username, username) ||
                other.username == username) &&
            (identical(other.email, email) || other.email == email) &&
            (identical(other.phone, phone) || other.phone == phone) &&
            (identical(other.role, role) || other.role == role) &&
            (identical(other.profilePicture, profilePicture) ||
                other.profilePicture == profilePicture) &&
            (identical(other.city, city) || other.city == city) &&
            const DeepCollectionEquality()
                .equals(other._sportTypes, _sportTypes) &&
            (identical(other.isOnboarded, isOnboarded) ||
                other.isOnboarded == isOnboarded) &&
            (identical(other.isVerified, isVerified) ||
                other.isVerified == isVerified) &&
            (identical(other.walletBalance, walletBalance) ||
                other.walletBalance == walletBalance));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      ownerId,
      name,
      username,
      email,
      phone,
      role,
      profilePicture,
      city,
      const DeepCollectionEquality().hash(_sportTypes),
      isOnboarded,
      isVerified,
      walletBalance);

  /// Create a copy of UserDto
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$UserDtoImplCopyWith<_$UserDtoImpl> get copyWith =>
      __$$UserDtoImplCopyWithImpl<_$UserDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$UserDtoImplToJson(
      this,
    );
  }
}

abstract class _UserDto extends UserDto {
  const factory _UserDto(
      {required final String id,
      final String? ownerId,
      final String? name,
      final String? username,
      final String? email,
      final String? phone,
      final String? role,
      final String? profilePicture,
      final String? city,
      final List<String> sportTypes,
      final bool isOnboarded,
      final bool isVerified,
      final num walletBalance}) = _$UserDtoImpl;
  const _UserDto._() : super._();

  factory _UserDto.fromJson(Map<String, dynamic> json) = _$UserDtoImpl.fromJson;

  @override
  String get id;
  @override
  String? get ownerId;
  @override
  String? get name;
  @override
  String? get username;
  @override
  String? get email;
  @override
  String? get phone;
  @override
  String? get role;
  @override
  String? get profilePicture;
  @override
  String? get city;
  @override
  List<String> get sportTypes;
  @override
  bool get isOnboarded;
  @override
  bool get isVerified;
  @override
  num get walletBalance;

  /// Create a copy of UserDto
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$UserDtoImplCopyWith<_$UserDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
