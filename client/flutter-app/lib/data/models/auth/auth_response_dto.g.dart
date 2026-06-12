// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'auth_response_dto.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$AuthResponseDtoImpl _$$AuthResponseDtoImplFromJson(
        Map<String, dynamic> json) =>
    _$AuthResponseDtoImpl(
      user: UserDto.fromJson(json['user'] as Map<String, dynamic>),
      tokens: json['tokens'] == null
          ? null
          : AuthTokensDto.fromJson(json['tokens'] as Map<String, dynamic>),
      role: json['role'] as String?,
      flatToken: json['token'] as String?,
    );

Map<String, dynamic> _$$AuthResponseDtoImplToJson(
        _$AuthResponseDtoImpl instance) =>
    <String, dynamic>{
      'user': instance.user,
      'tokens': instance.tokens,
      'role': instance.role,
      'token': instance.flatToken,
    };
