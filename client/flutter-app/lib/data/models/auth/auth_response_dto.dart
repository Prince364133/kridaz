// ignore_for_file: invalid_annotation_target

import 'package:freezed_annotation/freezed_annotation.dart';

import 'auth_tokens_dto.dart';
import 'user_dto.dart';

part 'auth_response_dto.freezed.dart';
part 'auth_response_dto.g.dart';

/// The `data` block returned by login/register/google-auth/refresh-token
/// (post-§1/§2). Reads tolerantly so we can ship this code BEFORE the
/// backend completes the envelope migration.
@freezed
class AuthResponseDto with _$AuthResponseDto {
  const AuthResponseDto._();

  const factory AuthResponseDto({
    required UserDto user,
    AuthTokensDto? tokens,
    String? role,
    // Legacy: some endpoints still return `token` at the data root.
    @JsonKey(name: 'token') String? flatToken,
  }) = _AuthResponseDto;

  factory AuthResponseDto.fromJson(Map<String, dynamic> json) =>
      _$AuthResponseDtoFromJson(json);

  /// Legacy responses put `token` at the root and omit `tokens`. Normalize.
  AuthTokensDto get effectiveTokens =>
      tokens ?? AuthTokensDto(legacyToken: flatToken);
}
