// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'auth_tokens_dto.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$AuthTokensDtoImpl _$$AuthTokensDtoImplFromJson(Map<String, dynamic> json) =>
    _$AuthTokensDtoImpl(
      accessToken: json['accessToken'] as String?,
      legacyToken: json['token'] as String?,
      refreshToken: json['refreshToken'] as String?,
      accessTokenExpiresAt: json['accessTokenExpiresAt'] as String?,
      refreshTokenExpiresAt: json['refreshTokenExpiresAt'] as String?,
      expiresIn: (json['expiresIn'] as num?)?.toInt(),
    );

Map<String, dynamic> _$$AuthTokensDtoImplToJson(_$AuthTokensDtoImpl instance) =>
    <String, dynamic>{
      'accessToken': instance.accessToken,
      'token': instance.legacyToken,
      'refreshToken': instance.refreshToken,
      'accessTokenExpiresAt': instance.accessTokenExpiresAt,
      'refreshTokenExpiresAt': instance.refreshTokenExpiresAt,
      'expiresIn': instance.expiresIn,
    };
