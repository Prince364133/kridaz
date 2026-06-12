import 'package:flutter_riverpod/flutter_riverpod.dart';

class LocationState {
  final String locationName;
  final double? latitude;
  final double? longitude;
  final bool isCurrentLocation;

  LocationState({
    this.locationName = 'Current Location',
    this.latitude,
    this.longitude,
    this.isCurrentLocation = true,
  });

  LocationState copyWith({
    String? locationName,
    double? latitude,
    double? longitude,
    bool? isCurrentLocation,
  }) {
    return LocationState(
      locationName: locationName ?? this.locationName,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      isCurrentLocation: isCurrentLocation ?? this.isCurrentLocation,
    );
  }
}

class LocationNotifier extends StateNotifier<LocationState> {
  LocationNotifier() : super(LocationState());

  void updateLocation({
    required String locationName,
    required double latitude,
    required double longitude,
    bool isCurrentLocation = false,
  }) {
    state = LocationState(
      locationName: locationName,
      latitude: latitude,
      longitude: longitude,
      isCurrentLocation: isCurrentLocation,
    );
  }

  void setCurrentLocation({
    required double latitude,
    required double longitude,
    String? locationName,
  }) {
    state = LocationState(
      locationName: locationName ?? 'Current Location',
      latitude: latitude,
      longitude: longitude,
      isCurrentLocation: true,
    );
  }

  void reset() {
    state = LocationState();
  }
}

final locationProvider =
    StateNotifierProvider<LocationNotifier, LocationState>((ref) {
  return LocationNotifier();
});
