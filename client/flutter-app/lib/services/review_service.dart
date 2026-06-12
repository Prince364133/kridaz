import 'api_service.dart';

/// Turf reviews — list + submit. Mirrors the web's `user/review/:turfId`
/// endpoint.
class ReviewService {
  final ApiService _api = ApiService();

  /// GET /user/review/:turfId — list reviews for a turf.
  Future<List<Map<String, dynamic>>> listForTurf(String turfId) async {
    final response = await _api.get<dynamic>('/user/review/$turfId');
    if (!response.isSuccess) return const [];
    final raw = response.data;
    final list = raw is List
        ? raw
        : (raw is Map ? (raw['reviews'] ?? raw['data'] ?? []) : []) as List;
    return list.cast<Map<String, dynamic>>();
  }

  /// POST /user/review/:turfId — submit a review.
  Future<bool> submit({
    required String turfId,
    required int rating,
    required String comment,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/user/review/$turfId',
      data: {'rating': rating, 'review': comment},
    );
    return response.isSuccess;
  }
}
