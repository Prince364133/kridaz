import 'api_service.dart';

class WalletService {
  static final WalletService _instance = WalletService._internal();
  factory WalletService() => _instance;
  WalletService._internal();

  final ApiService _api = ApiService();

  Future<Map<String, dynamic>?> getWalletData() async {
    final response = await _api.get<Map<String, dynamic>>('/user/wallet/data');
    if (response.isSuccess) return response.data;
    return null;
  }

  /// [idempotencyKey] must be a fresh UUID minted ONCE when the user taps
  /// "Recharge" and reused across every retry of this single intent.
  Future<Map<String, dynamic>> createTopupOrder(
    double amount, {
    required String idempotencyKey,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/user/wallet/topup/create-order',
      data: {'amount': amount},
      idempotencyKey: idempotencyKey,
    );
    if (response.isSuccess && response.data != null) return response.data!;
    throw Exception(response.error ?? 'Failed to create order');
  }

  Future<bool> verifyTopup({
    required String orderId,
    required String paymentId,
    required String signature,
    required String idempotencyKey,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/user/wallet/topup/verify',
      data: {
        'razorpay_order_id': orderId,
        'razorpay_payment_id': paymentId,
        'razorpay_signature': signature,
      },
      idempotencyKey: idempotencyKey,
    );
    return response.isSuccess && response.data?['success'] == true;
  }

  /// GET /user/wallet/topup/check-status/:orderId — polled by the recharge
  /// screen as a fallback when the Razorpay verify webhook is slow. Returns
  /// the txn payload (`{status: 'success' | 'pending' | 'failed', ...}`)
  /// or null on network error. Matches the web client.
  Future<Map<String, dynamic>?> checkTopupStatus(String orderId) async {
    final response = await _api.get<Map<String, dynamic>>(
      '/user/wallet/topup/check-status/$orderId',
    );
    if (response.isSuccess) return response.data;
    return null;
  }

  /// Release a RESERVED transaction so the funds return to `usableBalance`.
  /// Used by the transaction history "Cancel" affordance.
  /// Returns `(ok, message)` — on failure, `message` carries the server's
  /// rejection reason so the UI can show "Host already approved" etc.
  Future<({bool ok, String? message})> cancelReservation(
    String transactionId,
  ) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/user/wallet/transactions/$transactionId/cancel',
    );
    if (response.isSuccess && response.data?['success'] != false) {
      return (ok: true, message: null);
    }
    return (ok: false, message: response.error ?? 'Could not cancel');
  }
}
