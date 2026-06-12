import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../domain/entities/user.dart';

part 'user_dto.freezed.dart';
part 'user_dto.g.dart';

/// Server-shape DTO. NEVER pass this into the presentation layer — the
/// repository converts it to [User] (the domain entity) so the UI is
/// decoupled from server-field renames.
///
/// Build with: `dart run build_runner build --delete-conflicting-outputs`
@freezed
class UserDto with _$UserDto {
  const UserDto._();

  const factory UserDto({
    required String id,
    String? ownerId,
    String? name,
    String? username,
    String? email,
    String? phone,
    String? role,
    String? profilePicture,
    String? city,
    @Default(<String>[]) List<String> sportTypes,
    @Default(false) bool isOnboarded,
    @Default(false) bool isVerified,
    @Default(0) num walletBalance,
  }) = _UserDto;

  factory UserDto.fromJson(Map<String, dynamic> json) =>
      _$UserDtoFromJson(json);

  User toDomain() => User(
        id: id,
        ownerId: ownerId,
        name: name ?? '',
        username: username ?? '',
        email: email,
        phone: phone,
        role: (role ?? 'USER').toUpperCase(),
        profilePicture: profilePicture,
        city: city,
        sportTypes: sportTypes,
        isOnboarded: isOnboarded,
        isVerified: isVerified,
        walletBalance: walletBalance.toDouble(),
      );
}
