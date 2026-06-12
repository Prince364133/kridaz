import 'dart:async';
import 'dart:math' as math;
import '../core/constants/app_colors.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import '../services/turf_service.dart';

/// Bottom-sheet style filter for the Arena section.
///
/// - "Use my current location" preserved as the top affordance.
/// - "Nearby Cities" replaces the hardcoded "Popular" list — pulls distinct
///   cities from /user/turf/all and sorts them by distance to the user.
/// - Search field is debounced and filters the nearby list. When the user
///   types something that doesn't match any nearby city, we fall back to
///   geocoding so they can pick any address / postal code.
class SelectLocationFilterScreen extends StatefulWidget {
  final String? selectedLocation;

  const SelectLocationFilterScreen({super.key, this.selectedLocation});

  @override
  State<SelectLocationFilterScreen> createState() =>
      _SelectLocationFilterScreenState();
}

class _CitySuggestion {
  final String name;
  final double distanceKm;
  const _CitySuggestion(this.name, this.distanceKm);
}

class _SelectLocationFilterScreenState
    extends State<SelectLocationFilterScreen> {
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounce;

  String? _selectedLocation;
  Position? _userPos;

  List<_CitySuggestion> _nearby = [];
  List<_CitySuggestion> _visible = [];
  List<String> _geocodeHits = [];
  bool _loading = true;
  bool _geocoding = false;

  @override
  void initState() {
    super.initState();
    _selectedLocation = widget.selectedLocation;
    _searchController.addListener(_onSearchChanged);
    _bootstrap();
  }

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    // Best-effort: fetch user lat/lng so we can sort cities by distance.
    // If permission denied we still surface the cities, just unsorted.
    try {
      final perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied ||
          perm == LocationPermission.deniedForever) {
        await Geolocator.requestPermission();
      }
      _userPos = await Geolocator.getLastKnownPosition() ??
          await Geolocator.getCurrentPosition();
    } catch (_) {
      _userPos = null;
    }

    final turfs = await TurfService().getAllTurfs();
    final seen = <String, _CitySuggestion>{};
    for (final t in turfs) {
      final city = (t.city ?? '').trim();
      if (city.isEmpty) continue;
      final dist =
          (t.latitude != null && t.longitude != null && _userPos != null)
              ? _haversineKm(_userPos!.latitude, _userPos!.longitude,
                  t.latitude!, t.longitude!)
              : double.infinity;
      // Keep the closest representative for each city name.
      final existing = seen[city.toLowerCase()];
      if (existing == null || dist < existing.distanceKm) {
        seen[city.toLowerCase()] = _CitySuggestion(city, dist);
      }
    }
    final list = seen.values.toList()
      ..sort((a, b) => a.distanceKm.compareTo(b.distanceKm));

    if (mounted) {
      setState(() {
        _nearby = list.take(8).toList();
        _visible = _nearby;
        _loading = false;
      });
    }
  }

  void _onSearchChanged() {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 280), _runSearch);
  }

  Future<void> _runSearch() async {
    final q = _searchController.text.trim().toLowerCase();
    if (q.isEmpty) {
      setState(() {
        _visible = _nearby;
        _geocodeHits = [];
      });
      return;
    }
    final localHits =
        _nearby.where((c) => c.name.toLowerCase().contains(q)).toList();
    setState(() => _visible = localHits);

    // Always try geocoding too so the user can pick anywhere — not just
    // cities we have turfs in.
    if (q.length >= 3) {
      setState(() => _geocoding = true);
      try {
        final hits = await locationFromAddress(q);
        final reverse = <String>[];
        for (final h in hits.take(5)) {
          try {
            final placemarks =
                await placemarkFromCoordinates(h.latitude, h.longitude);
            if (placemarks.isNotEmpty) {
              final p = placemarks.first;
              final label = [
                if ((p.locality ?? '').isNotEmpty) p.locality,
                if ((p.administrativeArea ?? '').isNotEmpty)
                  p.administrativeArea,
                if ((p.country ?? '').isNotEmpty) p.country,
              ].whereType<String>().join(', ');
              if (label.isNotEmpty) reverse.add(label);
            }
          } catch (_) {}
        }
        if (mounted) setState(() => _geocodeHits = reverse.toSet().toList());
      } catch (_) {
        if (mounted) setState(() => _geocodeHits = []);
      } finally {
        if (mounted) setState(() => _geocoding = false);
      }
    } else {
      setState(() => _geocodeHits = []);
    }
  }

  Future<void> _useCurrentLocation() async {
    String label = 'Current Location';
    try {
      final pos = _userPos ??
          await Geolocator.getLastKnownPosition() ??
          await Geolocator.getCurrentPosition();
      final placemarks =
          await placemarkFromCoordinates(pos.latitude, pos.longitude);
      if (placemarks.isNotEmpty) {
        final p = placemarks.first;
        final parts = [
          if ((p.locality ?? '').isNotEmpty) p.locality!,
          if ((p.administrativeArea ?? '').isNotEmpty) p.administrativeArea!,
        ];
        if (parts.isNotEmpty) label = parts.join(', ');
      }
    } catch (_) {}
    if (mounted) {
      setState(() => _selectedLocation = label);
      context.pop(label);
    }
  }

  void _pick(String location) {
    setState(() => _selectedLocation = location);
    context.pop(location);
  }

  double _haversineKm(double lat1, double lon1, double lat2, double lon2) {
    const r = 6371.0;
    final dLat = _deg(lat2 - lat1);
    final dLon = _deg(lon2 - lon1);
    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(_deg(lat1)) *
            math.cos(_deg(lat2)) *
            math.sin(dLon / 2) *
            math.sin(dLon / 2);
    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return r * c;
  }

  double _deg(double v) => v * math.pi / 180;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => context.pop(),
                    child: const Icon(
                      LucideIcons.x,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  const Expanded(
                    child: Center(
                      child: Text(
                        'Select Location',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 24),
                ],
              ),
            ),

            // Search bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Container(
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.backgroundCard,
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    const Icon(
                      LucideIcons.search,
                      color: Colors.white54,
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _searchController,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                        ),
                        decoration: InputDecoration(
                          hintText: 'City, area or postal code',
                          hintStyle: TextStyle(
                            color: Colors.white.withValues(alpha: 0.4),
                            fontSize: 14,
                          ),
                          border: InputBorder.none,
                        ),
                      ),
                    ),
                    if (_geocoding)
                      const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: AppColors.primary),
                      ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Use current location button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: GestureDetector(
                onTap: _useCurrentLocation,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.transparent,
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.1),
                      width: 1,
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Row(
                    children: [
                      Icon(
                        LucideIcons.locateFixed,
                        color: AppColors.primary,
                        size: 24,
                      ),
                      SizedBox(width: 16),
                      Text(
                        'Use my current location',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            const SizedBox(height: 28),

            // Section header — switches between "Nearby Cities" (default) and
            // "Search results" when the user is typing.
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  _searchController.text.trim().isEmpty
                      ? 'Nearby Cities'
                      : 'Search results',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Results list
            Expanded(
              child: _loading
                  ? const Center(
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: AppColors.primary),
                    )
                  : ListView(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      children: [
                        ..._visible.map((c) => _cityTile(c.name,
                            subtitle: c.distanceKm.isFinite
                                ? '${c.distanceKm.toStringAsFixed(1)} km away'
                                : null)),
                        if (_geocodeHits.isNotEmpty) ...[
                          if (_visible.isNotEmpty) const SizedBox(height: 12),
                          ..._geocodeHits.map((name) => _cityTile(name)),
                        ],
                        if (_visible.isEmpty &&
                            _geocodeHits.isEmpty &&
                            _searchController.text.trim().isNotEmpty &&
                            !_geocoding)
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 24),
                            child: Center(
                              child: Text(
                                'No locations match "${_searchController.text.trim()}"',
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.5),
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _cityTile(String name, {String? subtitle}) {
    final isSelected = _selectedLocation == name;
    return GestureDetector(
      onTap: () => _pick(name),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 20,
        ),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.1)
              : Colors.transparent,
          border: Border(
            bottom: BorderSide(
              color: Colors.white.withValues(alpha: 0.1),
              width: 1,
            ),
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    name,
                    style: TextStyle(
                      color: isSelected ? AppColors.primary : Colors.white,
                      fontSize: 16,
                      fontWeight:
                          isSelected ? FontWeight.w600 : FontWeight.w400,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.45),
                        fontSize: 11,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const Icon(LucideIcons.chevronRight,
                color: Colors.white24, size: 18),
          ],
        ),
      ),
    );
  }
}
