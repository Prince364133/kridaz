import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/api_config.dart';

class NearbyLocationUpdate {
  final String userId;
  final double lat;
  final double lng;

  const NearbyLocationUpdate({
    required this.userId,
    required this.lat,
    required this.lng,
  });
}

class LocationSocketService {
  static final LocationSocketService _instance =
      LocationSocketService._internal();
  factory LocationSocketService() => _instance;
  LocationSocketService._internal();

  io.Socket? _socket;
  String? _userId;

  final _nearbyController =
      StreamController<NearbyLocationUpdate>.broadcast();

  Stream<NearbyLocationUpdate> get nearbyStream => _nearbyController.stream;

  bool get isConnected => _socket?.connected ?? false;

  void connect(String token, {required String userId}) {
    _userId = userId;

    if (_socket?.connected == true) {
      _emitSetup();
      return;
    }

    _socket = io.io(
      ApiConfig.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setExtraHeaders({'Authorization': 'Bearer $token'})
          .setAuth({'token': token})
          .disableAutoConnect()
          .build(),
    );

    _socket!
      ..onConnect((_) => _emitSetup())
      ..onReconnect((_) => _emitSetup())
      ..on('nearby:location:update', (data) {
        if (data is! Map) return;
        final uid = data['userId']?.toString();
        final lat = _toDouble(data['lat']);
        final lng = _toDouble(data['lng']);
        if (uid == null || lat == null || lng == null) return;
        _nearbyController.add(
          NearbyLocationUpdate(userId: uid, lat: lat, lng: lng),
        );
      });

    _socket!.connect();
  }

  void _emitSetup() {
    final uid = _userId;
    if (uid != null && uid.isNotEmpty) {
      _socket?.emit('setup', {'id': uid});
    }
  }

  /// Stream this client's location to the server. The server uses this both
  /// to persist (with privacy fuzzing) and to fan out a `nearby:location:update`
  /// to anyone within [radiusKm].
  void emitLocation({
    required double lat,
    required double lng,
    double radiusKm = 25,
    double? accuracy,
  }) {
    final s = _socket;
    if (s == null || !s.connected) return;
    s.emit('location:update', {
      'lat': lat,
      'lng': lng,
      'radiusKm': radiusKm,
      if (accuracy != null) 'accuracy': accuracy,
    });
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }

  void dispose() {
    disconnect();
    _nearbyController.close();
  }

  static double? _toDouble(dynamic v) {
    if (v == null) return null;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString());
  }
}
