import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:geocoding/geocoding.dart';

class GooglePlacesService {
  // Google Maps API key from Info.plist
  static const String _apiKey = 'AIzaSyD81ZLEH2vxtKuq_f8Wh-OtngNJfhDTnvA';
  static const String _baseUrl = 'https://maps.googleapis.com/maps/api/place';

  /// Get place autocomplete suggestions
  /// Falls back to geocoding if Places API fails
  Future<List<PlacePrediction>> getAutocompleteSuggestions(String input,
      {String? sessionToken}) async {
    if (input.isEmpty) return [];

    // First try Google Places API
    try {
      final url = Uri.parse(
        '$_baseUrl/autocomplete/json?input=${Uri.encodeComponent(input)}&key=$_apiKey${sessionToken != null ? '&sessiontoken=$sessionToken' : ''}',
      );

      final response = await http.get(url);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        if (data['status'] == 'OK') {
          final predictions = data['predictions'] as List;
          return predictions.map((p) => PlacePrediction.fromJson(p)).toList();
        } else if (data['status'] != 'ZERO_RESULTS') {}
      }
    } catch (e) {}

    // Fallback to geocoding package
    return _fallbackGeocodingSearch(input);
  }

  /// Fallback search using geocoding package - returns multiple variations
  Future<List<PlacePrediction>> _fallbackGeocodingSearch(String input) async {
    try {
      List<Location> locations = await locationFromAddress(input);
      List<PlacePrediction> results = [];

      // Get the first location
      if (locations.isNotEmpty) {
        final loc = locations.first;

        try {
          List<Placemark> placemarks = await placemarkFromCoordinates(
            loc.latitude,
            loc.longitude,
          );

          if (placemarks.isNotEmpty) {
            final place = placemarks.first;

            // Create main result
            final mainText = place.name ?? place.locality ?? input;
            final secondaryText = [
              place.subLocality,
              place.locality,
              place.administrativeArea,
              place.country,
            ]
                .where((s) => s != null && s.isNotEmpty && s != mainText)
                .join(', ');

            results.add(PlacePrediction(
              placeId: '${loc.latitude},${loc.longitude}',
              description: '$mainText, $secondaryText',
              mainText: mainText,
              secondaryText: secondaryText,
              latitude: loc.latitude,
              longitude: loc.longitude,
            ));

            // Add locality/city as second option if different
            if (place.locality != null && place.locality != mainText) {
              final citySecondary = [
                place.administrativeArea,
                place.country,
              ].where((s) => s != null && s.isNotEmpty).join(', ');

              results.add(PlacePrediction(
                placeId: '${loc.latitude},${loc.longitude}',
                description: '${place.locality}, $citySecondary',
                mainText: place.locality!,
                secondaryText: citySecondary,
                latitude: loc.latitude,
                longitude: loc.longitude,
              ));
            }

            // Add subLocality as third option if available
            if (place.subLocality != null &&
                place.subLocality!.isNotEmpty &&
                place.subLocality != mainText &&
                place.subLocality != place.locality) {
              final subLocalitySecondary = [
                place.locality,
                place.administrativeArea,
              ].where((s) => s != null && s.isNotEmpty).join(', ');

              results.add(PlacePrediction(
                placeId: '${loc.latitude},${loc.longitude}',
                description: '${place.subLocality}, $subLocalitySecondary',
                mainText: place.subLocality!,
                secondaryText: subLocalitySecondary,
                latitude: loc.latitude,
                longitude: loc.longitude,
              ));
            }
          }
        } catch (e) {}
      }

      // If we still have less than 2 results, add a generic one with the search term
      if (results.isEmpty) {
        // Try to get any location and create a result
        if (locations.isNotEmpty) {
          final loc = locations.first;
          results.add(PlacePrediction(
            placeId: '${loc.latitude},${loc.longitude}',
            description: input,
            mainText: input,
            secondaryText: 'Search result',
            latitude: loc.latitude,
            longitude: loc.longitude,
          ));
        }
      }

      return results;
    } catch (e) {
      return [];
    }
  }

  /// Get place details (coordinates) from place_id
  Future<PlaceDetails?> getPlaceDetails(String placeId,
      {String? sessionToken}) async {
    // Check if placeId is actually coordinates (from fallback)
    if (placeId.contains(',')) {
      final parts = placeId.split(',');
      if (parts.length == 2) {
        final lat = double.tryParse(parts[0]);
        final lng = double.tryParse(parts[1]);
        if (lat != null && lng != null) {
          return PlaceDetails(
            latitude: lat,
            longitude: lng,
            formattedAddress: '',
            name: '',
          );
        }
      }
    }

    // Otherwise use Places API
    try {
      final url = Uri.parse(
        '$_baseUrl/details/json?place_id=$placeId&fields=geometry,formatted_address,name&key=$_apiKey${sessionToken != null ? '&sessiontoken=$sessionToken' : ''}',
      );

      final response = await http.get(url);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        if (data['status'] == 'OK') {
          return PlaceDetails.fromJson(data['result']);
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}

class PlacePrediction {
  final String placeId;
  final String description;
  final String mainText;
  final String secondaryText;
  final double? latitude; // For fallback geocoding results
  final double? longitude; // For fallback geocoding results

  PlacePrediction({
    required this.placeId,
    required this.description,
    required this.mainText,
    required this.secondaryText,
    this.latitude,
    this.longitude,
  });

  factory PlacePrediction.fromJson(Map<String, dynamic> json) {
    final structuredFormatting = json['structured_formatting'] ?? {};
    return PlacePrediction(
      placeId: json['place_id'] ?? '',
      description: json['description'] ?? '',
      mainText: structuredFormatting['main_text'] ?? json['description'] ?? '',
      secondaryText: structuredFormatting['secondary_text'] ?? '',
    );
  }
}

class PlaceDetails {
  final double latitude;
  final double longitude;
  final String formattedAddress;
  final String name;

  PlaceDetails({
    required this.latitude,
    required this.longitude,
    required this.formattedAddress,
    required this.name,
  });

  factory PlaceDetails.fromJson(Map<String, dynamic> json) {
    final geometry = json['geometry'] ?? {};
    final location = geometry['location'] ?? {};

    return PlaceDetails(
      latitude: (location['lat'] ?? 0.0).toDouble(),
      longitude: (location['lng'] ?? 0.0).toDouble(),
      formattedAddress: json['formatted_address'] ?? '',
      name: json['name'] ?? '',
    );
  }
}
