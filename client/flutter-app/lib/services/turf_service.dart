import 'api_service.dart';
import '../config/api_config.dart';
import '../models/turf_model.dart';
import '../models/time_slot_model.dart';

class TurfService {
  final ApiService _api = ApiService();

  Future<List<TurfModel>> getAllTurfs() async {
    final response = await _api.get<Map<String, dynamic>>(
      '/user/turf/all',
      useCache: false,
    );
    if (response.isSuccess && response.data != null) {
      final raw = response.data!;
      final list =
          raw['turfs'] ?? raw['data'] ?? raw['result'] ?? raw['grounds'];
      if (list is List) {
        final turfs = list
            .whereType<Map<String, dynamic>>()
            .map(TurfModel.fromJson)
            .toList();
        for (final t in turfs) {
          final rawMap = list.firstWhere(
              (e) => (e as Map)['id'] == t.id || (e as Map)['_id'] == t.id,
              orElse: () => <String, dynamic>{}) as Map;
        }
        return turfs;
      }
    }
    return [];
  }

  Future<TurfModel?> getTurfDetails(String turfId) async {
    final response = await _api.get<Map<String, dynamic>>(
      '/user/turf/details/$turfId',
    );
    if (response.isSuccess && response.data != null) {
      final turf = response.data!['turf'];
      if (turf is Map<String, dynamic>) {
        return TurfModel.fromJson(turf);
      }
    }
    return null;
  }

  /// POST /user/turf/user/like — toggle like on a turf (matches web client).
  Future<bool> likeTurf(String turfId) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/user/turf/user/like',
      data: {'turfId': turfId},
    );
    return response.isSuccess;
  }

  /// POST /user/turf/user/share — record a share event.
  Future<bool> shareTurf(String turfId) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/user/turf/user/share',
      data: {'turfId': turfId},
    );
    return response.isSuccess;
  }

  /// POST /user/turf/interaction — track any interaction (view, click, etc.)
  Future<void> trackInteraction(String turfId, String type) async {
    await _api.post<dynamic>(
      '/user/turf/interaction',
      data: {'turfId': turfId, 'type': type},
    );
  }

  Future<TurfTimeSlotResponse?> getTimeSlots(String turfId, String date) async {
    final response = await _api.get<Map<String, dynamic>>(
      '/user/turf/timeSlot',
      queryParameters: {'turfId': turfId, 'date': date},
      useCache: false,
    );
    if (response.isSuccess && response.data != null) {
      return TurfTimeSlotResponse.fromJson(response.data!);
    }
    return null;
  }
}
