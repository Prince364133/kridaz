import '../../../core/network/api_client.dart';
import '../../models/wallet/wallet_dto.dart';

class WalletRemoteDataSource {
  final ApiClient _client;

  WalletRemoteDataSource(this._client);

  /// `GET /user/wallet/data` — the backend currently returns the wallet
  /// object at the TOP LEVEL (no `{ success, data }` envelope). When the
  /// server-wide envelope migration ships, this will switch over.
  ///
  /// We bypass `ApiClient.getData` (which would treat the missing `success`
  /// field as failure and throw) and parse both shapes directly:
  ///   * legacy:   `{ balance, transactions, ... }`
  ///   * envelope: `{ success: true, data: { balance, transactions, ... } }`
  Future<WalletDto> getWallet() async {
    final resp =
        await _client.raw.get<Map<String, dynamic>>('/user/wallet/data');
    final body = resp.data ?? const <String, dynamic>{};

    // Envelope-aware: prefer `data` when present and `success` is true,
    // otherwise read the top-level fields as the wallet object.
    final inner =
        (body['success'] == true && body['data'] is Map<String, dynamic>)
            ? body['data'] as Map<String, dynamic>
            : body;

    return WalletDto.fromJson(inner);
  }
}
