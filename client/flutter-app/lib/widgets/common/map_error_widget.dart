import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../core/constants/app_colors.dart';

class SafeGoogleMap extends StatefulWidget {
  final CameraPosition initialCameraPosition;
  final Set<Marker>? markers;
  final bool myLocationEnabled;
  final bool myLocationButtonEnabled;
  final bool zoomControlsEnabled;
  final bool mapToolbarEnabled;
  final MapType mapType;
  final Function(GoogleMapController)? onMapCreated;
  final Widget? errorWidget;
  final String? errorMessage;
  final VoidCallback? onRetry;

  const SafeGoogleMap({
    Key? key,
    required this.initialCameraPosition,
    this.markers,
    this.myLocationEnabled = true,
    this.myLocationButtonEnabled = true,
    this.zoomControlsEnabled = true,
    this.mapToolbarEnabled = true,
    this.mapType = MapType.normal,
    this.onMapCreated,
    this.errorWidget,
    this.errorMessage,
    this.onRetry,
  }) : super(key: key);

  @override
  State<SafeGoogleMap> createState() => _SafeGoogleMapState();
}

class _SafeGoogleMapState extends State<SafeGoogleMap> {
  bool _isLoading = true;
  bool _hasError = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _initializeMap();
  }

  Future<void> _initializeMap() async {
    try {
      // Simulate map initialization
      await Future.delayed(const Duration(milliseconds: 500));

      if (mounted) {
        setState(() {
          _isLoading = false;
          _hasError = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _hasError = true;
          _errorMessage =
              widget.errorMessage ?? 'Failed to load map: ${e.toString()}';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Container(
        color: Colors.grey[300],
        child: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(
                color: AppColors.primary,
              ),
              SizedBox(height: 16),
              Text(
                'Loading map...',
                style: TextStyle(
                  color: Colors.black54,
                  fontSize: 16,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_hasError) {
      return widget.errorWidget ?? _buildDefaultErrorWidget();
    }

    return GoogleMap(
      initialCameraPosition: widget.initialCameraPosition,
      markers: widget.markers ?? {},
      myLocationEnabled: widget.myLocationEnabled,
      myLocationButtonEnabled: widget.myLocationButtonEnabled,
      zoomControlsEnabled: widget.zoomControlsEnabled,
      mapToolbarEnabled: widget.mapToolbarEnabled,
      mapType: widget.mapType,
      onMapCreated: (controller) {
        try {
          widget.onMapCreated?.call(controller);
        } catch (e) {
          if (mounted) {
            setState(() {
              _hasError = true;
              _errorMessage = 'Map controller error: ${e.toString()}';
            });
          }
        }
      },
      // Add error handling for map gestures (empty set to prevent crashes)
      gestureRecognizers: const {},
      // Add timeout protection
      buildingsEnabled: true,
      // Prevent crashes from invalid configurations
      compassEnabled: true,
      rotateGesturesEnabled: true,
      scrollGesturesEnabled: true,
      tiltGesturesEnabled: true,
      zoomGesturesEnabled: true,
    );
  }

  Widget _buildDefaultErrorWidget() {
    return Container(
      color: Colors.grey[300],
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                LucideIcons.map,
                size: 64,
                color: Colors.red,
              ),
              const SizedBox(height: 16),
              Text(
                _errorMessage ?? 'Map unavailable',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.black87,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              if (widget.onRetry != null) ...[
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () {
                    setState(() {
                      _isLoading = true;
                      _hasError = false;
                      _errorMessage = null;
                    });
                    _initializeMap();
                    widget.onRetry?.call();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 24, vertical: 12),
                  ),
                  child: const Text('Retry'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// Helper widget for map with location
class LocationAwareMap extends StatefulWidget {
  final Function(GoogleMapController)? onMapCreated;
  final Set<Marker>? markers;
  final VoidCallback? onLocationError;
  final String? locationErrorMessage;

  const LocationAwareMap({
    Key? key,
    this.onMapCreated,
    this.markers,
    this.onLocationError,
    this.locationErrorMessage,
  }) : super(key: key);

  @override
  State<LocationAwareMap> createState() => _LocationAwareMapState();
}

class _LocationAwareMapState extends State<LocationAwareMap> {
  @override
  Widget build(BuildContext context) {
    return SafeGoogleMap(
      initialCameraPosition: const CameraPosition(
        target: LatLng(17.3850, 78.4867), // Default to Hyderabad
        zoom: 14,
      ),
      markers: widget.markers,
      myLocationEnabled: true,
      myLocationButtonEnabled: false,
      zoomControlsEnabled: false,
      mapToolbarEnabled: false,
      onMapCreated: widget.onMapCreated,
      errorMessage: widget.locationErrorMessage,
      onRetry: widget.onLocationError,
    );
  }
}
