// ignore_for_file: invalid_annotation_target

import 'package:freezed_annotation/freezed_annotation.dart';

part 'auth_tokens_dto.freezed.dart';
part 'auth_tokens_dto.g.dart';

/// Mirrors the `tokens` block returned by `/api/.../login` after §2 of the
/// backend audit lands. Tolerant to the legacy shape (flat `token`,
/// no `expiresIn`) — see [AuthTokensDto.resolveExpiresAt].
@Freezed(toJson: true, fromJson: true)
class AuthTokensDto with _$AuthTokensDto {
  const AuthTokensDto._();

  const factory AuthTokensDto({
    String? accessToken,
    @JsonKey(name: 'token') String? legacyToken,
    String? refreshToken,
    String? accessTokenExpiresAt,
    String? refreshTokenExpiresAt,
    int? expiresIn,
  }) = _AuthTokensDto;

  factory AuthTokensDto.fromJson(Map<String, dynamic> json) =>
      _$AuthTokensDtoFromJson(json);

  String get effectiveAccess => accessToken ?? legacyToken ?? '';

  DateTime get resolveAccessExpiresAt {
    if (accessTokenExpiresAt != null) {
      final parsed = DateTime.tryParse(accessTokenExpiresAt!);
      if (parsed != null) return parsed.toUtc();
    }
    return DateTime.now().toUtc().add(Duration(seconds: expiresIn ?? 15 * 60));
  }

  DateTime? get resolveRefreshExpiresAt => refreshTokenExpiresAt == null
      ? null
      : DateTime.tryParse(refreshTokenExpiresAt!);
}
