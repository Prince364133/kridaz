import 'dart:async';
import 'package:geolocator/geolocator.dart';

class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  Position? _currentPosition;
  StreamController<Position?> _positionController =
      StreamController<Position?>.broadcast();
  bool _isListening = false;

  // Stream to listen to location updates
  Stream<Position?> get positionStream => _positionController.stream;

  // Current position
  Position? get currentPosition => _currentPosition;

  // Initialize location service
  Future<bool> initialize() async {
    try {
      // Check if location services are enabled
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return false;
      }

      // Check permissions
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          return false;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        return false;
      }

      // Get current position with timeout
      _currentPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );

      _positionController.add(_currentPosition);
      return true;
    } catch (e) {
      _positionController.add(null);
      return false;
    }
  }

  // Start listening to location updates
  Future<void> startLocationUpdates() async {
    if (_isListening) return;

    try {
      final locationSettings = LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10, // Update every 10 meters
      );

      Geolocator.getPositionStream(locationSettings: locationSettings).listen(
        (Position position) {
          _currentPosition = position;
          _positionController.add(position);
        },
        onError: (error) {
          _positionController.add(null);
        },
        onDone: () {
          _isListening = false;
        },
      );

      _isListening = true;
    } catch (e) {}
  }

  // Stop location updates
  void stopLocationUpdates() {
    if (_isListening) {
      _isListening = false;
    }
  }

  // Get current position with retry
  Future<Position?> getCurrentPosition({int maxRetries = 3}) async {
    int attempts = 0;

    while (attempts < maxRetries) {
      try {
        final position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
          timeLimit: const Duration(seconds: 5),
        );
        _currentPosition = position;
        _positionController.add(position);
        return position;
      } catch (e) {
        attempts++;

        if (attempts < maxRetries) {
          // Wait before retrying
          await Future.delayed(Duration(seconds: attempts));
        }
      }
    }

    return null;
  }

  // Calculate distance between two points
  double calculateDistance(double startLatitude, double startLongitude,
      double endLatitude, double endLongitude) {
    return Geolocator.distanceBetween(
        startLatitude, startLongitude, endLatitude, endLongitude);
  }

  // Check if location permissions are granted
  Future<bool> hasLocationPermission() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      return permission == LocationPermission.always ||
          permission == LocationPermission.whileInUse;
    } catch (e) {
      return false;
    }
  }

  // Request location permissions
  Future<bool> requestLocationPermission() async {
    try {
      LocationPermission permission = await Geolocator.requestPermission();
      return permission == LocationPermission.always ||
          permission == LocationPermission.whileInUse;
    } catch (e) {
      return false;
    }
  }

  // Open app settings
  Future<void> openAppSettings() async {
    try {
      await Geolocator.openAppSettings();
    } catch (e) {}
  }

  void dispose() {
    stopLocationUpdates();
    _positionController.close();
  }
}
