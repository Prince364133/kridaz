import 'api_service.dart';

typedef BookingResult = ({
  bool success,
  Map<String, dynamic>? data,
  String? error,

  /// Stable backend error code preserved from the response envelope.
  /// `null` on success or when the failure had no code (network errors,
  /// legacy endpoints). Branch on this rather than `error` — the human
  /// message is sanitized for 500s and isn't a stable contract.
  String? code,
});

class BookingService {
  final ApiService _api = ApiService();

  /// POST /user/booking/create-order
  /// Returns Razorpay order: { order: {id, amount, currency, ...}, user: {...} }
  ///
  /// [idempotencyKey] must be a fresh UUID minted ONCE when the user taps
  /// "Pay" and reused across every retry of this single intent. The backend
  /// uses it to replay the original response instead of double-charging.
  Future<Map<String, dynamic>?> createOrder(
    double totalPrice, {
    required String idempotencyKey,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/user/booking/create-order',
      data: {'totalPrice': totalPrice},
      idempotencyKey: idempotencyKey,
    );
    if (response.isSuccess && response.data != null) {
      return response.data;
    }
    return null;
  }

  /// POST /user/booking/verify-payment
  /// Call after Razorpay payment succeeds with the payment signature.
  /// Returns { success: true, message, bookingId }
  Future<BookingResult> verifyPayment({
    required String turfId,
    required String startTime, // ISO string
    required String endTime, // ISO string
    required String selectedTurfDate, // ISO string
    required double totalPrice,
    required double advanceAmount,
    required double balanceAmount,
    required String paymentType, // "FULL" or "PARTIAL"
    required String paymentId,
    required String orderId,
    required String razorpaySignature,
    String paymentMethod = 'ONLINE',
    required String idempotencyKey,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/user/booking/verify-payment',
      data: {
        'turfId': turfId,
        'startTime': startTime,
        'endTime': endTime,
        'selectedTurfDate': selectedTurfDate,
        'totalPrice': totalPrice,
        'advanceAmount': advanceAmount,
        'balanceAmount': balanceAmount,
        'paymentType': paymentType,
        'paymentId': paymentId,
        'orderId': orderId,
        'razorpay_signature': razorpaySignature,
        'paymentMethod': paymentMethod,
      },
      idempotencyKey: idempotencyKey,
    );
    return (
      success: response.isSuccess && response.data != null,
      data: response.data,
      error: response.error,
      code: response.code,
    );
  }

  /// POST /user/booking/book-with-wallet
  /// Returns { success, bookingId, newBalance }
  Future<BookingResult> bookWithWallet({
    required String turfId,
    required String startTime,
    required String endTime,
    required String selectedTurfDate,
    required double totalPrice,
    String? couponCode,
    required double advanceAmount,
    required double balanceAmount,
    String paymentType = 'FULL',
    required String idempotencyKey,
  }) async {
    final body = <String, dynamic>{
      'turfId': turfId,
      'startTime': startTime,
      'endTime': endTime,
      'selectedTurfDate': selectedTurfDate,
      'totalPrice': totalPrice,
      'advanceAmount': advanceAmount,
      'balanceAmount': balanceAmount,
      'paymentType': paymentType,
    };
    if (couponCode != null && couponCode.isNotEmpty) {
      body['couponCode'] = couponCode;
    }
    final response = await _api.post<Map<String, dynamic>>(
      '/user/booking/book-with-wallet',
      data: body,
      idempotencyKey: idempotencyKey,
    );
    return (
      success: response.isSuccess && response.data != null,
      data: response.data,
      error: response.error,
      code: response.code,
    );
  }

  /// POST /user/booking/validate-coupon
  /// Returns { success, discount, finalAmount, message }
  Future<Map<String, dynamic>?> validateCoupon({
    required String code,
    required String turfId,
    required double amount,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/user/booking/validate-coupon',
      data: {'code': code, 'turfId': turfId, 'amount': amount},
    );
    if (response.isSuccess && response.data != null) {
      return response.data;
    }
    return null;
  }

  /// GET /user/booking/get-bookings
  /// Returns list of user's bookings with turf name/location and time slot
  Future<List<Map<String, dynamic>>> getBookings() async {
    final response = await _api.get<List<dynamic>>(
      '/user/booking/get-bookings',
      useCache: false,
    );
    if (response.isSuccess && response.data != null) {
      return List<Map<String, dynamic>>.from(
        (response.data as List).map((e) => e as Map<String, dynamic>),
      );
    }
    return [];
  }

  /// GET /hosted-game/my-hosted
  /// Returns { games: [...] } — games this user created
  Future<List<Map<String, dynamic>>> getMyHostedGames() async {
    final response = await _api.get<Map<String, dynamic>>(
      '/hosted-game/my-hosted',
      useCache: false,
    );
    if (response.isSuccess && response.data != null) {
      final list = response.data!['games'];
      if (list is List) {
        return List<Map<String, dynamic>>.from(
            list.map((e) => e as Map<String, dynamic>));
      }
    }
    return [];
  }

  /// GET /hosted-game/my-joined
  /// Returns { success: true, games: [...] } — games this user joined as a player
  Future<List<Map<String, dynamic>>> getMyJoinedGames() async {
    final response = await _api.get<Map<String, dynamic>>(
      '/hosted-game/my-joined',
      useCache: false,
    );
    if (response.isSuccess && response.data != null) {
      final list = response.data!['games'];
      if (list is List) {
        return List<Map<String, dynamic>>.from(
            list.map((e) => e as Map<String, dynamic>));
      }
    }
    return [];
  }

  /// POST /user/booking/:id/cancel (matches web client's REST shape).
  /// Returns { success, message }
  Future<bool> cancelBooking(String bookingId) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/user/booking/$bookingId/cancel',
    );
    return response.isSuccess;
  }

  /// GET /user/booking/invoice/:bookingId
  /// Returns { invoiceUrl } or PDF redirect
  Future<String?> getInvoiceUrl(String bookingId) async {
    final response = await _api.get<Map<String, dynamic>>(
      '/user/booking/invoice/$bookingId',
    );
    if (response.isSuccess && response.data != null) {
      return response.data!['invoiceUrl']?.toString() ??
          response.data!['url']?.toString();
    }
    return null;
  }

  /// GET /user/wallet/data
  /// Returns { balance, reservedBalance, pendingBalance, usableBalance, transactions }
  Future<Map<String, dynamic>?> getWalletData() async {
    final response = await _api.get<Map<String, dynamic>>(
      '/user/wallet/data',
      useCache: false,
    );
    if (response.isSuccess && response.data != null) {
      return response.data;
    }
    return null;
  }
}
