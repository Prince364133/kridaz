// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_dto.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$UserDtoImpl _$$UserDtoImplFromJson(Map<String, dynamic> json) =>
    _$UserDtoImpl(
      id: json['id'] as String,
      ownerId: json['ownerId'] as String?,
      name: json['name'] as String?,
      username: json['username'] as String?,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      role: json['role'] as String?,
      profilePicture: json['profilePicture'] as String?,
      city: json['city'] as String?,
      sportTypes: (json['sportTypes'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const <String>[],
      isOnboarded: json['isOnboarded'] as bool? ?? false,
      isVerified: json['isVerified'] as bool? ?? false,
      walletBalance: json['walletBalance'] as num? ?? 0,
    );

Map<String, dynamic> _$$UserDtoImplToJson(_$UserDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'ownerId': instance.ownerId,
      'name': instance.name,
      'username': instance.username,
      'email': instance.email,
      'phone': instance.phone,
      'role': instance.role,
      'profilePicture': instance.profilePicture,
      'city': instance.city,
      'sportTypes': instance.sportTypes,
      'isOnboarded': instance.isOnboarded,
      'isVerified': instance.isVerified,
      'walletBalance': instance.walletBalance,
    };
