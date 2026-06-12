// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'auth_response_dto.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

AuthResponseDto _$AuthResponseDtoFromJson(Map<String, dynamic> json) {
  return _AuthResponseDto.fromJson(json);
}

/// @nodoc
mixin _$AuthResponseDto {
  UserDto get user => throw _privateConstructorUsedError;
  AuthTokensDto? get tokens => throw _privateConstructorUsedError;
  String? get role =>
      throw _privateConstructorUsedError; // Legacy: some endpoints still return `token` at the data root.
  @JsonKey(name: 'token')
  String? get flatToken => throw _privateConstructorUsedError;

  /// Serializes this AuthResponseDto to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of AuthResponseDto
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $AuthResponseDtoCopyWith<AuthResponseDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AuthResponseDtoCopyWith<$Res> {
  factory $AuthResponseDtoCopyWith(
          AuthResponseDto value, $Res Function(AuthResponseDto) then) =
      _$AuthResponseDtoCopyWithImpl<$Res, AuthResponseDto>;
  @useResult
  $Res call(
      {UserDto user,
      AuthTokensDto? tokens,
      String? role,
      @JsonKey(name: 'token') String? flatToken});

  $UserDtoCopyWith<$Res> get user;
  $AuthTokensDtoCopyWith<$Res>? get tokens;
}

/// @nodoc
class _$AuthResponseDtoCopyWithImpl<$Res, $Val extends AuthResponseDto>
    implements $AuthResponseDtoCopyWith<$Res> {
  _$AuthResponseDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of AuthResponseDto
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? user = null,
    Object? tokens = freezed,
    Object? role = freezed,
    Object? flatToken = freezed,
  }) {
    return _then(_value.copyWith(
      user: null == user
          ? _value.user
          : user // ignore: cast_nullable_to_non_nullable
              as UserDto,
      tokens: freezed == tokens
          ? _value.tokens
          : tokens // ignore: cast_nullable_to_non_nullable
              as AuthTokensDto?,
      role: freezed == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as String?,
      flatToken: freezed == flatToken
          ? _value.flatToken
          : flatToken // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }

  /// Create a copy of AuthResponseDto
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $UserDtoCopyWith<$Res> get user {
    return $UserDtoCopyWith<$Res>(_value.user, (value) {
      return _then(_value.copyWith(user: value) as $Val);
    });
  }

  /// Create a copy of AuthResponseDto
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $AuthTokensDtoCopyWith<$Res>? get tokens {
    if (_value.tokens == null) {
      return null;
    }

    return $AuthTokensDtoCopyWith<$Res>(_value.tokens!, (value) {
      return _then(_value.copyWith(tokens: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$AuthResponseDtoImplCopyWith<$Res>
    implements $AuthResponseDtoCopyWith<$Res> {
  factory _$$AuthResponseDtoImplCopyWith(_$AuthResponseDtoImpl value,
          $Res Function(_$AuthResponseDtoImpl) then) =
      __$$AuthResponseDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {UserDto user,
      AuthTokensDto? tokens,
      String? role,
      @JsonKey(name: 'token') String? flatToken});

  @override
  $UserDtoCopyWith<$Res> get user;
  @override
  $AuthTokensDtoCopyWith<$Res>? get tokens;
}

/// @nodoc
class __$$AuthResponseDtoImplCopyWithImpl<$Res>
    extends _$AuthResponseDtoCopyWithImpl<$Res, _$AuthResponseDtoImpl>
    implements _$$AuthResponseDtoImplCopyWith<$Res> {
  __$$AuthResponseDtoImplCopyWithImpl(
      _$AuthResponseDtoImpl _value, $Res Function(_$AuthResponseDtoImpl) _then)
      : super(_value, _then);

  /// Create a copy of AuthResponseDto
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? user = null,
    Object? tokens = freezed,
    Object? role = freezed,
    Object? flatToken = freezed,
  }) {
    return _then(_$AuthResponseDtoImpl(
      user: null == user
          ? _value.user
          : user // ignore: cast_nullable_to_non_nullable
              as UserDto,
      tokens: freezed == tokens
          ? _value.tokens
          : tokens // ignore: cast_nullable_to_non_nullable
              as AuthTokensDto?,
      role: freezed == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as String?,
      flatToken: freezed == flatToken
          ? _value.flatToken
          : flatToken // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$AuthResponseDtoImpl extends _AuthResponseDto {
  const _$AuthResponseDtoImpl(
      {required this.user,
      this.tokens,
      this.role,
      @JsonKey(name: 'token') this.flatToken})
      : super._();

  factory _$AuthResponseDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$AuthResponseDtoImplFromJson(json);

  @override
  final UserDto user;
  @override
  final AuthTokensDto? tokens;
  @override
  final String? role;
// Legacy: some endpoints still return `token` at the data root.
  @override
  @JsonKey(name: 'token')
  final String? flatToken;

  @override
  String toString() {
    return 'AuthResponseDto(user: $user, tokens: $tokens, role: $role, flatToken: $flatToken)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AuthResponseDtoImpl &&
            (identical(other.user, user) || other.user == user) &&
            (identical(other.tokens, tokens) || other.tokens == tokens) &&
            (identical(other.role, role) || other.role == role) &&
            (identical(other.flatToken, flatToken) ||
                other.flatToken == flatToken));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, user, tokens, role, flatToken);

  /// Create a copy of AuthResponseDto
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AuthResponseDtoImplCopyWith<_$AuthResponseDtoImpl> get copyWith =>
      __$$AuthResponseDtoImplCopyWithImpl<_$AuthResponseDtoImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AuthResponseDtoImplToJson(
      this,
    );
  }
}

abstract class _AuthResponseDto extends AuthResponseDto {
  const factory _AuthResponseDto(
      {required final UserDto user,
      final AuthTokensDto? tokens,
      final String? role,
      @JsonKey(name: 'token') final String? flatToken}) = _$AuthResponseDtoImpl;
  const _AuthResponseDto._() : super._();

  factory _AuthResponseDto.fromJson(Map<String, dynamic> json) =
      _$AuthResponseDtoImpl.fromJson;

  @override
  UserDto get user;
  @override
  AuthTokensDto? get tokens;
  @override
  String?
      get role; // Legacy: some endpoints still return `token` at the data root.
  @override
  @JsonKey(name: 'token')
  String? get flatToken;

  /// Create a copy of AuthResponseDto
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AuthResponseDtoImplCopyWith<_$AuthResponseDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
