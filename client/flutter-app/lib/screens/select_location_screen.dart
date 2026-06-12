import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../core/constants/app_colors.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import '../widgets/common/bms_toast.dart';
import '../widgets/common/back_button.dart';

class SelectLocationScreen extends StatefulWidget {
  const SelectLocationScreen({Key? key}) : super(key: key);

  @override
  State<SelectLocationScreen> createState() => _SelectLocationScreenState();
}

class _SelectLocationScreenState extends State<SelectLocationScreen> {
  final TextEditingController _searchController = TextEditingController();
  GoogleMapController? _mapController;
  String? selectedLocation;
  LatLng _currentPosition = const LatLng(17.3850, 78.4867); // Hyderabad default
  Set<Marker> _markers = {};
  bool _isLoading = true;
  bool _locationFetched = false;

  @override
  void initState() {
    super.initState();
    // Delay location fetch to allow map to initialize first
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _getCurrentLocation();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _mapController?.dispose();
    super.dispose();
  }

  Future<void> _getCurrentLocation() async {
    try {
      // Check if location services are enabled
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _isLoading = false;
          selectedLocation = 'Hyderabad, India';
          _searchController.text = selectedLocation ?? '';
        });
        _addMarker(_currentPosition);
        return;
      }

      // Check location permission
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _isLoading = false;
            selectedLocation = 'Hyderabad, India';
            _searchController.text = selectedLocation ?? '';
          });
          _addMarker(_currentPosition);
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _isLoading = false;
          selectedLocation = 'Hyderabad, India';
          _searchController.text = selectedLocation ?? '';
        });
        _addMarker(_currentPosition);
        return;
      }

      // Get current position with timeout
      Position position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 10),
        ),
      );

      setState(() {
        _currentPosition = LatLng(position.latitude, position.longitude);
        _isLoading = false;
        _locationFetched = true;
      });

      _getAddressFromLatLng(_currentPosition);
      _addMarker(_currentPosition);

      // Move camera to current location
      if (_mapController != null) {
        _mapController!.animateCamera(
          CameraUpdate.newLatLngZoom(_currentPosition, 15),
        );
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        selectedLocation = 'Hyderabad, India';
        _searchController.text = selectedLocation ?? '';
      });
      _addMarker(_currentPosition);
    }
  }

  Future<void> _getAddressFromLatLng(LatLng position) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        setState(() {
          selectedLocation =
              '${place.name}, ${place.locality}, ${place.administrativeArea}';
          _searchController.text = selectedLocation ?? '';
        });
      }
    } catch (e) {}
  }

  void _addMarker(LatLng position) {
    setState(() {
      _markers.clear();
      _markers.add(
        Marker(
          markerId: const MarkerId('selected_location'),
          position: position,
          infoWindow: InfoWindow(
            title: 'Selected Location',
            snippet: selectedLocation ?? 'Location',
          ),
        ),
      );
    });
  }

  void _onMapTap(LatLng position) {
    setState(() {});
    _getAddressFromLatLng(position);
    _addMarker(position);
  }

  Future<void> _searchLocation() async {
    String query = _searchController.text.trim();
    if (query.isEmpty) return;

    try {
      List<Location> locations = await locationFromAddress(query);
      if (locations.isNotEmpty) {
        Location location = locations.first;
        LatLng newPosition = LatLng(location.latitude, location.longitude);

        setState(() {});

        _getAddressFromLatLng(newPosition);
        _addMarker(newPosition);

        _mapController?.animateCamera(
          CameraUpdate.newLatLngZoom(newPosition, 15),
        );
      }
    } catch (e) {
      BmsToast.error(context, 'Location not found: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Row(
                children: [
                  const AppBackButton(),
                  const Expanded(
                    child: Text(
                      'Select Location',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 40),
                ],
              ),
            ),

            // Search Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Container(
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.surfaceL4,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 16),
                      child: Icon(
                        LucideIcons.search,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                    Expanded(
                      child: TextField(
                        controller: _searchController,
                        style: const TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 16,
                          color: Colors.white,
                        ),
                        decoration: const InputDecoration(
                          hintText: 'Search for an address or venue',
                          hintStyle: TextStyle(
                            fontFamily: 'Poppins',
                            fontSize: 16,
                            color: Colors.white,
                          ),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.zero,
                        ),
                        onSubmitted: (value) => _searchLocation(),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(LucideIcons.search, color: Colors.white),
                      onPressed: _searchLocation,
                    ),
                  ],
                ),
              ),
            ),

            // Map Area
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        color: Colors.white,
                      ),
                    )
                  : Stack(
                      children: [
                        GoogleMap(
                          initialCameraPosition: CameraPosition(
                            target: _currentPosition,
                            zoom: 15,
                          ),
                          onMapCreated: (controller) {
                            _mapController = controller;
                          },
                          onTap: _onMapTap,
                          markers: _markers,
                          myLocationEnabled: true,
                          myLocationButtonEnabled: false,
                          zoomControlsEnabled: false,
                          mapType: MapType.normal,
                        ),

                        // Map controls (zoom, locate)
                        Positioned(
                          right: 16,
                          bottom: 120,
                          child: Column(
                            children: [
                              // Zoom In
                              Container(
                                width: 32.29,
                                height: 32.29,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: const BorderRadius.only(
                                    topLeft: Radius.circular(9.69),
                                    topRight: Radius.circular(9.69),
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color:
                                          Colors.black.withValues(alpha: 0.1),
                                      blurRadius: 3.23,
                                      offset: const Offset(0, 1.62),
                                    ),
                                  ],
                                ),
                                child: IconButton(
                                  padding: EdgeInsets.zero,
                                  icon: const Icon(
                                    LucideIcons.plus,
                                    color: Colors.black,
                                    size: 16,
                                  ),
                                  onPressed: () {
                                    _mapController?.animateCamera(
                                      CameraUpdate.zoomIn(),
                                    );
                                  },
                                ),
                              ),
                              const SizedBox(height: 1.62),
                              // Zoom Out
                              Container(
                                width: 32.29,
                                height: 32.29,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: const BorderRadius.only(
                                    bottomLeft: Radius.circular(9.69),
                                    bottomRight: Radius.circular(9.69),
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color:
                                          Colors.black.withValues(alpha: 0.1),
                                      blurRadius: 3.23,
                                      offset: const Offset(0, 1.62),
                                    ),
                                  ],
                                ),
                                child: IconButton(
                                  padding: EdgeInsets.zero,
                                  icon: const Icon(
                                    LucideIcons.minus,
                                    color: Colors.black,
                                    size: 16,
                                  ),
                                  onPressed: () {
                                    _mapController?.animateCamera(
                                      CameraUpdate.zoomOut(),
                                    );
                                  },
                                ),
                              ),
                              const SizedBox(height: 9.69),
                              // Current Location
                              Container(
                                width: 32.29,
                                height: 32.29,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(9.69),
                                  boxShadow: [
                                    BoxShadow(
                                      color:
                                          Colors.black.withValues(alpha: 0.1),
                                      blurRadius: 3.23,
                                      offset: const Offset(0, 1.62),
                                    ),
                                  ],
                                ),
                                child: IconButton(
                                  padding: EdgeInsets.zero,
                                  icon: const Icon(
                                    LucideIcons.locateFixed,
                                    color: Colors.black,
                                    size: 16,
                                  ),
                                  onPressed: _getCurrentLocation,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
            ),

            // Confirm Location Button
            Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () {
                    // Return selected location to previous screen
                    context.pop(selectedLocation ?? 'Selected Location');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.backgroundCard,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'CONFIRM LOCATION',
                    style: TextStyle(
                      fontFamily: 'Poppins',
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
