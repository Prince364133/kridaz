// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'auth_tokens_dto.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

AuthTokensDto _$AuthTokensDtoFromJson(Map<String, dynamic> json) {
  return _AuthTokensDto.fromJson(json);
}

/// @nodoc
mixin _$AuthTokensDto {
  String? get accessToken => throw _privateConstructorUsedError;
  @JsonKey(name: 'token')
  String? get legacyToken => throw _privateConstructorUsedError;
  String? get refreshToken => throw _privateConstructorUsedError;
  String? get accessTokenExpiresAt => throw _privateConstructorUsedError;
  String? get refreshTokenExpiresAt => throw _privateConstructorUsedError;
  int? get expiresIn => throw _privateConstructorUsedError;

  /// Serializes this AuthTokensDto to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of AuthTokensDto
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $AuthTokensDtoCopyWith<AuthTokensDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AuthTokensDtoCopyWith<$Res> {
  factory $AuthTokensDtoCopyWith(
          AuthTokensDto value, $Res Function(AuthTokensDto) then) =
      _$AuthTokensDtoCopyWithImpl<$Res, AuthTokensDto>;
  @useResult
  $Res call(
      {String? accessToken,
      @JsonKey(name: 'token') String? legacyToken,
      String? refreshToken,
      String? accessTokenExpiresAt,
      String? refreshTokenExpiresAt,
      int? expiresIn});
}

/// @nodoc
class _$AuthTokensDtoCopyWithImpl<$Res, $Val extends AuthTokensDto>
    implements $AuthTokensDtoCopyWith<$Res> {
  _$AuthTokensDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of AuthTokensDto
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? accessToken = freezed,
    Object? legacyToken = freezed,
    Object? refreshToken = freezed,
    Object? accessTokenExpiresAt = freezed,
    Object? refreshTokenExpiresAt = freezed,
    Object? expiresIn = freezed,
  }) {
    return _then(_value.copyWith(
      accessToken: freezed == accessToken
          ? _value.accessToken
          : accessToken // ignore: cast_nullable_to_non_nullable
              as String?,
      legacyToken: freezed == legacyToken
          ? _value.legacyToken
          : legacyToken // ignore: cast_nullable_to_non_nullable
              as String?,
      refreshToken: freezed == refreshToken
          ? _value.refreshToken
          : refreshToken // ignore: cast_nullable_to_non_nullable
              as String?,
      accessTokenExpiresAt: freezed == accessTokenExpiresAt
          ? _value.accessTokenExpiresAt
          : accessTokenExpiresAt // ignore: cast_nullable_to_non_nullable
              as String?,
      refreshTokenExpiresAt: freezed == refreshTokenExpiresAt
          ? _value.refreshTokenExpiresAt
          : refreshTokenExpiresAt // ignore: cast_nullable_to_non_nullable
              as String?,
      expiresIn: freezed == expiresIn
          ? _value.expiresIn
          : expiresIn // ignore: cast_nullable_to_non_nullable
              as int?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AuthTokensDtoImplCopyWith<$Res>
    implements $AuthTokensDtoCopyWith<$Res> {
  factory _$$AuthTokensDtoImplCopyWith(
          _$AuthTokensDtoImpl value, $Res Function(_$AuthTokensDtoImpl) then) =
      __$$AuthTokensDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String? accessToken,
      @JsonKey(name: 'token') String? legacyToken,
      String? refreshToken,
      String? accessTokenExpiresAt,
      String? refreshTokenExpiresAt,
      int? expiresIn});
}

/// @nodoc
class __$$AuthTokensDtoImplCopyWithImpl<$Res>
    extends _$AuthTokensDtoCopyWithImpl<$Res, _$AuthTokensDtoImpl>
    implements _$$AuthTokensDtoImplCopyWith<$Res> {
  __$$AuthTokensDtoImplCopyWithImpl(
      _$AuthTokensDtoImpl _value, $Res Function(_$AuthTokensDtoImpl) _then)
      : super(_value, _then);

  /// Create a copy of AuthTokensDto
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? accessToken = freezed,
    Object? legacyToken = freezed,
    Object? refreshToken = freezed,
    Object? accessTokenExpiresAt = freezed,
    Object? refreshTokenExpiresAt = freezed,
    Object? expiresIn = freezed,
  }) {
    return _then(_$AuthTokensDtoImpl(
      accessToken: freezed == accessToken
          ? _value.accessToken
          : accessToken // ignore: cast_nullable_to_non_nullable
              as String?,
      legacyToken: freezed == legacyToken
          ? _value.legacyToken
          : legacyToken // ignore: cast_nullable_to_non_nullable
              as String?,
      refreshToken: freezed == refreshToken
          ? _value.refreshToken
          : refreshToken // ignore: cast_nullable_to_non_nullable
              as String?,
      accessTokenExpiresAt: freezed == accessTokenExpiresAt
          ? _value.accessTokenExpiresAt
          : accessTokenExpiresAt // ignore: cast_nullable_to_non_nullable
              as String?,
      refreshTokenExpiresAt: freezed == refreshTokenExpiresAt
          ? _value.refreshTokenExpiresAt
          : refreshTokenExpiresAt // ignore: cast_nullable_to_non_nullable
              as String?,
      expiresIn: freezed == expiresIn
          ? _value.expiresIn
          : expiresIn // ignore: cast_nullable_to_non_nullable
              as int?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$AuthTokensDtoImpl extends _AuthTokensDto {
  const _$AuthTokensDtoImpl(
      {this.accessToken,
      @JsonKey(name: 'token') this.legacyToken,
      this.refreshToken,
      this.accessTokenExpiresAt,
      this.refreshTokenExpiresAt,
      this.expiresIn})
      : super._();

  factory _$AuthTokensDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$AuthTokensDtoImplFromJson(json);

  @override
  final String? accessToken;
  @override
  @JsonKey(name: 'token')
  final String? legacyToken;
  @override
  final String? refreshToken;
  @override
  final String? accessTokenExpiresAt;
  @override
  final String? refreshTokenExpiresAt;
  @override
  final int? expiresIn;

  @override
  String toString() {
    return 'AuthTokensDto(accessToken: $accessToken, legacyToken: $legacyToken, refreshToken: $refreshToken, accessTokenExpiresAt: $accessTokenExpiresAt, refreshTokenExpiresAt: $refreshTokenExpiresAt, expiresIn: $expiresIn)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AuthTokensDtoImpl &&
            (identical(other.accessToken, accessToken) ||
                other.accessToken == accessToken) &&
            (identical(other.legacyToken, legacyToken) ||
                other.legacyToken == legacyToken) &&
            (identical(other.refreshToken, refreshToken) ||
                other.refreshToken == refreshToken) &&
            (identical(other.accessTokenExpiresAt, accessTokenExpiresAt) ||
                other.accessTokenExpiresAt == accessTokenExpiresAt) &&
            (identical(other.refreshTokenExpiresAt, refreshTokenExpiresAt) ||
                other.refreshTokenExpiresAt == refreshTokenExpiresAt) &&
            (identical(other.expiresIn, expiresIn) ||
                other.expiresIn == expiresIn));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, accessToken, legacyToken,
      refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt, expiresIn);

  /// Create a copy of AuthTokensDto
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AuthTokensDtoImplCopyWith<_$AuthTokensDtoImpl> get copyWith =>
      __$$AuthTokensDtoImplCopyWithImpl<_$AuthTokensDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AuthTokensDtoImplToJson(
      this,
    );
  }
}

abstract class _AuthTokensDto extends AuthTokensDto {
  const factory _AuthTokensDto(
      {final String? accessToken,
      @JsonKey(name: 'token') final String? legacyToken,
      final String? refreshToken,
      final String? accessTokenExpiresAt,
      final String? refreshTokenExpiresAt,
      final int? expiresIn}) = _$AuthTokensDtoImpl;
  const _AuthTokensDto._() : super._();

  factory _AuthTokensDto.fromJson(Map<String, dynamic> json) =
      _$AuthTokensDtoImpl.fromJson;

  @override
  String? get accessToken;
  @override
  @JsonKey(name: 'token')
  String? get legacyToken;
  @override
  String? get refreshToken;
  @override
  String? get accessTokenExpiresAt;
  @override
  String? get refreshTokenExpiresAt;
  @override
  int? get expiresIn;

  /// Create a copy of AuthTokensDto
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AuthTokensDtoImplCopyWith<_$AuthTokensDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
