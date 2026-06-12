import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../widgets/common/bms_toast.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/app_colors.dart';
import '../core/util/image_url.dart';
import '../providers/user_provider.dart';
import '../services/friends_service.dart';
import '../services/location_socket_service.dart';
import 'player_profile_screen.dart';

const _kGuestLocationKey = 'bms_guest_location';
const _kLocationSharingKey = 'bms_location_sharing';
const _kMovementThresholdMeters = 50.0;
const _kHeartbeatInterval = Duration(seconds: 30);
const _kAccuracyCeilingMeters = 200.0;

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Data model
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _Player {
  final String id, initials, name, handle, sport, level, distance;
  final int mutual;
  final Color color;
  final double? lat, lng;
  final bool isFollowing;
  final String? profilePicture;

  const _Player({
    required this.id,
    required this.initials,
    required this.name,
    required this.handle,
    required this.sport,
    required this.level,
    required this.distance,
    required this.mutual,
    required this.color,
    this.lat,
    this.lng,
    this.isFollowing = false,
    this.profilePicture,
  });

  _Player copyWith({bool? isFollowing, double? lat, double? lng}) => _Player(
        id: id,
        initials: initials,
        name: name,
        handle: handle,
        sport: sport,
        level: level,
        distance: distance,
        mutual: mutual,
        color: color,
        lat: lat ?? this.lat,
        lng: lng ?? this.lng,
        isFollowing: isFollowing ?? this.isFollowing,
        profilePicture: profilePicture,
      );

  static const _colors = [
    AppColors.accentBlueLight,
    AppColors.accentPurple,
    AppColors.accentOrange,
    AppColors.accentGreen,
    AppColors.accentOrange,
    AppColors.accentBlueLight,
    AppColors.accentIndigo,
    AppColors.accentBlueLight,
  ];

  factory _Player.fromApi(Map<String, dynamic> d) {
    final name = (d['name'] ?? '').toString();
    // Filter empty tokens so a name like "John  Doe" or "John " doesn't
    // produce ["John", ""] which would crash on parts[1][0].
    final parts =
        name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    final initials = parts.length >= 2
        ? '${parts[0][0]}${parts[1][0]}'.toUpperCase()
        : (parts.isNotEmpty ? parts[0][0].toUpperCase() : '?');
    final sports =
        (d['sportTypes'] as List?)?.map((e) => e.toString()).toList() ?? [];
    final distKm = d['distanceKm'];
    final colorIdx = name.isNotEmpty ? name.codeUnitAt(0) % _colors.length : 0;
    return _Player(
      id: d['id']?.toString() ?? '',
      initials: initials,
      name: name,
      handle: '@${d['username'] ?? ''}',
      sport: sports.isNotEmpty ? _cap(sports.first) : '',
      level: '',
      distance: _formatDistance(distKm),
      mutual: 0,
      color: _colors[colorIdx],
      lat: _parseDouble(d['lat']),
      lng: _parseDouble(d['lng']),
      isFollowing: d['isFollowing'] == true,
      profilePicture: d['profilePicture']?.toString(),
    );
  }

  static String _cap(String s) =>
      s.isEmpty ? s : s[0].toUpperCase() + s.substring(1).toLowerCase();

  static double? _parseDouble(dynamic v) {
    if (v == null) return null;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString());
  }

  static String _formatDistance(dynamic v) {
    if (v == null) return '';
    final n = v is num ? v.toDouble() : double.tryParse(v.toString());
    if (n == null) return '';
    return '${n.toStringAsFixed(1)}km';
  }
}

const _kSportFilters = ['All', 'Online', 'Football', 'Cricket', 'Tennis'];

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Screen
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class NearbyPlayersHomeScreen extends ConsumerStatefulWidget {
  const NearbyPlayersHomeScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<NearbyPlayersHomeScreen> createState() =>
      _NearbyPlayersHomeScreenState();
}

class _NearbyPlayersHomeScreenState
    extends ConsumerState<NearbyPlayersHomeScreen>
    with WidgetsBindingObserver {
  final FriendsService _service = FriendsService();
  final LocationSocketService _socket = LocationSocketService();

  // Tabs: 0=Discover, 1=Following
  int _tab = 0;

  // Sport filter
  String _sportFilter = 'All';

  // Map
  bool _mapExpanded = true;
  final MapController _mapController = MapController();
  Position? _position;
  LatLng? _location;
  String _locationName = 'Secunderabad';
  double _mapZoom = 12;

  // Search
  final TextEditingController _searchCtrl = TextEditingController();
  double _distanceKm = 25.0;

  // Live data
  List<_Player> _discoverPlayers = [];
  List<_Player> _followingPlayers = [];

  // Live tracking
  StreamSubscription<Position>? _positionSub;
  StreamSubscription<NearbyLocationUpdate>? _nearbySub;
  Timer? _heartbeatTimer;
  LatLng? _lastEmitted;
  DateTime? _lastEmittedAt;
  bool _appActive = true;
  bool _isLocationSharing = true;

  /// Starts true so the loader is visible while [_initLocation] resolves the
  /// device position — without this the empty-state ("No players found")
  /// flashes immediately on entry before the API has even been called.
  bool _isLoading = true;

  // User
  String? _userPhotoUrl;
  String _userInitials = 'M';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadUser();
    _restorePersistedState();
    _initLocation();
    _subscribeToNearbyUpdates();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final active = state == AppLifecycleState.resumed;
    if (active == _appActive) return;
    setState(() => _appActive = active);
    if (active) {
      _startPositionStream();
      _startHeartbeat();
    } else {
      _positionSub?.cancel();
      _positionSub = null;
      _heartbeatTimer?.cancel();
      _heartbeatTimer = null;
    }
  }

  Future<void> _restorePersistedState() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_kGuestLocationKey);
    if (raw != null) {
      try {
        final m = json.decode(raw) as Map<String, dynamic>;
        final lat = (m['lat'] as num?)?.toDouble();
        final lng = (m['lng'] as num?)?.toDouble();
        if (lat != null && lng != null && mounted) {
          setState(() => _location = LatLng(lat, lng));
        }
      } catch (_) {}
    }
    final sharing = prefs.getBool(_kLocationSharingKey);
    if (sharing != null && mounted) {
      setState(() => _isLocationSharing = sharing);
    }
  }

  void _subscribeToNearbyUpdates() {
    _nearbySub = _socket.nearbyStream.listen((update) {
      if (!mounted) return;
      final idx =
          _discoverPlayers.indexWhere((p) => p.id == update.userId);
      if (idx == -1) {
        _loadNearbyPlayers(
          _location?.latitude ?? 0,
          _location?.longitude ?? 0,
        );
        return;
      }
      setState(() {
        _discoverPlayers[idx] = _discoverPlayers[idx].copyWith(
          lat: update.lat,
          lng: update.lng,
        );
      });
    });
  }

  void _loadUser() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final profileAsync = ref.read(userProfileProvider);
      profileAsync.whenData((profile) {
        if (profile != null && mounted) {
          final name =
              (profile['fullName'] ?? profile['firstName'] ?? '') as String;
          setState(() {
            _userPhotoUrl = profile['photoURL'] as String?;
            if (name.isNotEmpty) {
              final parts = name.trim().split(' ');
              _userInitials = parts.length >= 2
                  ? '${parts[0][0]}${parts[1][0]}'.toUpperCase()
                  : parts[0][0].toUpperCase();
            }
          });
        }
      });
    });
  }

  Future<void> _initLocation() async {
    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        if (mounted) setState(() => _isLoading = false);
        _showError('Turn on Location services to find nearby players.');
        return;
      }
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
        if (perm == LocationPermission.denied) {
          if (mounted) setState(() => _isLoading = false);
          _showError('Location permission denied.');
          return;
        }
      }
      if (perm == LocationPermission.deniedForever) {
        if (mounted) setState(() => _isLoading = false);
        _showError(
            'Location permission permanently denied — enable it in Settings.');
        return;
      }
      final pos = await Geolocator.getCurrentPosition();
      await _handleNewFix(pos, isInitial: true);
      _startPositionStream();
      _startHeartbeat();
      if (mounted) _loadFollowing();
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
      _showError('Could not get your location: $e');
    }
  }

  void _startPositionStream() {
    _positionSub?.cancel();
    _positionSub = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      ),
    ).listen((pos) => _handleNewFix(pos));
  }

  void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(_kHeartbeatInterval, (_) {
      final loc = _location;
      if (loc == null || _isLoading) return;
      _loadNearbyPlayers(loc.latitude, loc.longitude);
      if (_isLocationSharing) {
        _socket.emitLocation(
          lat: loc.latitude,
          lng: loc.longitude,
          radiusKm: _distanceKm,
        );
      }
    });
  }

  Future<void> _handleNewFix(Position pos, {bool isInitial = false}) async {
    if (pos.accuracy > _kAccuracyCeilingMeters) return;

    final newLoc = LatLng(pos.latitude, pos.longitude);
    final movedEnough = _lastEmitted == null ||
        _distanceMeters(_lastEmitted!, newLoc) > _kMovementThresholdMeters;
    final aged = _lastEmittedAt == null ||
        DateTime.now().difference(_lastEmittedAt!) > _kHeartbeatInterval;

    if (!isInitial && !movedEnough && !aged) return;

    if (!mounted) return;
    setState(() {
      _position = pos;
      _location = newLoc;
    });

    if (isInitial) {
      try {
        _mapController.move(newLoc, 13);
      } catch (_) {}
      _resolveLocationName(newLoc);
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _kGuestLocationKey,
      json.encode({'lat': newLoc.latitude, 'lng': newLoc.longitude}),
    );

    if (_isLocationSharing) {
      _socket.emitLocation(
        lat: newLoc.latitude,
        lng: newLoc.longitude,
        radiusKm: _distanceKm,
        accuracy: pos.accuracy,
      );
      _service.updateLocation(newLoc.latitude, newLoc.longitude);
    }

    _lastEmitted = newLoc;
    _lastEmittedAt = DateTime.now();

    if (isInitial) _loadNearbyPlayers(newLoc.latitude, newLoc.longitude);
  }

  Future<void> _resolveLocationName(LatLng loc) async {
    try {
      final places = await placemarkFromCoordinates(loc.latitude, loc.longitude);
      if (places.isEmpty || !mounted) return;
      final p = places.first;
      setState(() =>
          _locationName = p.locality ?? p.subLocality ?? _locationName);
    } catch (_) {}
  }

  static double _distanceMeters(LatLng a, LatLng b) {
    return Geolocator.distanceBetween(
      a.latitude,
      a.longitude,
      b.latitude,
      b.longitude,
    );
  }

  Future<void> _toggleLocationSharing() async {
    HapticFeedback.lightImpact();
    final next = !_isLocationSharing;
    setState(() => _isLocationSharing = next);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kLocationSharingKey, next);
    final loc = _location;
    final ok = await _service.setLocationSharing(
      next,
      lat: loc?.latitude,
      lng: loc?.longitude,
    );
    if (!ok && mounted) {
      setState(() => _isLocationSharing = !next);
      await prefs.setBool(_kLocationSharingKey, !next);
      _showError('Could not update privacy setting');
      return;
    }
    if (mounted) {
      BmsToast.info(
        context,
        next
            ? 'Sharing enabled: nearby players can see you'
            : 'Privacy on: you are hidden from others',
      );
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    BmsToast.error(context, msg);
  }

  Future<void> _loadNearbyPlayers(double lat, double lng) async {
    if (_isLoading) return;
    setState(() => _isLoading = true);
    final players = await _service.getNearbyPlayers(
      latitude: lat,
      longitude: lng,
      radiusKm: _distanceKm.round(),
    );
    if (mounted) {
      setState(() {
        _discoverPlayers = players.map(_Player.fromApi).toList();
        _isLoading = false;
      });
      if (players.isEmpty && _service.lastNearbyError != null) {
        _showError('Nearby players: ${_service.lastNearbyError}');
      }
    }
  }

  Future<void> _loadFollowing() async {
    final network = await _service.getNetwork();
    if (mounted) {
      setState(() {
        _followingPlayers =
            (network['following'] ?? []).map(_Player.fromApi).toList();
      });
    }
  }

  Future<void> _toggleFollow(_Player player, {bool inFollowing = false}) async {
    HapticFeedback.lightImpact();
    final newVal = !player.isFollowing;
    if (inFollowing) {
      final idx = _followingPlayers.indexWhere((p) => p.id == player.id);
      if (idx != -1) {
        setState(() {
          _followingPlayers[idx] =
              _followingPlayers[idx].copyWith(isFollowing: newVal);
        });
      }
    } else {
      final idx = _discoverPlayers.indexWhere((p) => p.id == player.id);
      if (idx != -1) {
        setState(() {
          _discoverPlayers[idx] =
              _discoverPlayers[idx].copyWith(isFollowing: newVal);
        });
      }
    }
    final ok = newVal
        ? await _service.followPlayer(player.id)
        : await _service.unfollowPlayer(player.id);
    if (!ok && mounted) {
      // revert on failure
      if (inFollowing) {
        final idx = _followingPlayers.indexWhere((p) => p.id == player.id);
        if (idx != -1) {
          setState(() {
            _followingPlayers[idx] = _followingPlayers[idx]
                .copyWith(isFollowing: player.isFollowing);
          });
        }
      } else {
        final idx = _discoverPlayers.indexWhere((p) => p.id == player.id);
        if (idx != -1) {
          setState(() {
            _discoverPlayers[idx] =
                _discoverPlayers[idx].copyWith(isFollowing: player.isFollowing);
          });
        }
      }
    }
  }

  // â”€â”€ Computed lists â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  List<_Player> get _filteredDiscover {
    final q = _searchCtrl.text.toLowerCase();
    List<_Player> list = _discoverPlayers;
    if (_sportFilter != 'All' && _sportFilter != 'Online') {
      list = list.where((p) => p.sport == _sportFilter).toList();
    }
    if (q.isNotEmpty) {
      list = list
          .where((p) =>
              p.name.toLowerCase().contains(q) ||
              p.handle.toLowerCase().contains(q))
          .toList();
    }
    return list;
  }

  // â”€â”€ Build â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceL0,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            if (!_mapExpanded) ...[
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                child: Container(
                  height: 44,
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceL3,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(LucideIcons.search,
                          size: 18,
                          color: Colors.white.withValues(alpha: 0.40)),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: _searchCtrl,
                          onChanged: (_) => setState(() {}),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontFamily: 'Poppins',
                          ),
                          decoration: InputDecoration(
                            hintText: 'Search players, handles...',
                            hintStyle: TextStyle(
                              fontSize: 14,
                              color: Colors.white.withValues(alpha: 0.40),
                              fontFamily: 'Poppins',
                            ),
                            border: InputBorder.none,
                            isCollapsed: true,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              _buildTabs(),
              Container(height: 1, color: Colors.white.withValues(alpha: 0.07)),
            ],
            Expanded(child: _buildContent()),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    if (!_mapExpanded) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(8, 12, 16, 4),
        child: Row(
          children: [
            IconButton(
              onPressed: () => setState(() {
                _mapExpanded = true;
                _searchCtrl.clear();
              }),
              icon: const Icon(LucideIcons.arrowLeft,
                  color: Colors.white, size: 22),
            ),
            const Text(
              'People',
              style: TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w700,
                fontFamily: 'Poppins',
              ),
            ),
            const Spacer(),
            GestureDetector(
              onTap: _showFilters,
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.surfaceL3,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(LucideIcons.sliders,
                    color: Colors.white, size: 18),
              ),
            ),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
      child: Row(
        children: [
          Builder(builder: (_) {
            final photo = safeAvatarUrl(_userPhotoUrl);
            return Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
                image: photo != null
                    ? DecorationImage(
                        image: NetworkImage(photo),
                        fit: BoxFit.cover,
                      )
                    : null,
              ),
              child: photo == null
                  ? Center(
                      child: Text(
                        _userInitials,
                        style: const TextStyle(
                          color: Colors.black,
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    )
                  : null,
            );
          }),
          const SizedBox(width: 10),
          Expanded(
            child: Container(
              height: 42,
              decoration: BoxDecoration(
                color: AppColors.surfaceL3,
                borderRadius: BorderRadius.circular(22),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                children: [
                  const Icon(LucideIcons.search,
                      color: Colors.white38, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: _searchCtrl,
                      onTap: () {
                        if (_mapExpanded) setState(() => _mapExpanded = false);
                      },
                      onChanged: (_) => setState(() {}),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontFamily: 'Poppins',
                      ),
                      decoration: const InputDecoration(
                        hintText: 'Search players, handles...',
                        hintStyle:
                            TextStyle(color: Colors.white38, fontSize: 14),
                        border: InputBorder.none,
                        isCollapsed: true,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: _showDistancePicker,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppColors.backgroundCard,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: ShaderMask(
                        shaderCallback: (bounds) => const LinearGradient(
                          colors: [
                            AppColors.gradientStart,
                            AppColors.gradientEnd
                          ],
                        ).createShader(bounds),
                        blendMode: BlendMode.srcIn,
                        child: Text(
                          '${_distanceKm.round()} km',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Poppins',
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 10),
          GestureDetector(
            onTap: _showFilters,
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.surfaceL3,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(LucideIcons.sliders,
                  color: Colors.white, size: 18),
            ),
          ),
        ],
      ),
    );
  }

  void _showDistancePicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceL1,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => StatefulBuilder(
        builder: (ctx, setModal) {
          return Padding(
            padding: EdgeInsets.fromLTRB(
                20, 16, 20, MediaQuery.of(ctx).padding.bottom + 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Search Radius',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'Poppins',
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.backgroundCard,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: ShaderMask(
                        shaderCallback: (bounds) => const LinearGradient(
                          colors: [
                            AppColors.gradientStart,
                            AppColors.gradientEnd
                          ],
                        ).createShader(bounds),
                        blendMode: BlendMode.srcIn,
                        child: Text(
                          '${_distanceKm.round()} km',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Poppins',
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SliderTheme(
                  data: SliderTheme.of(ctx).copyWith(
                    trackShape: const _GradientTrackShape(),
                    thumbColor: AppColors.gradientEnd,
                    overlayColor:
                        AppColors.gradientStart.withValues(alpha: 0.20),
                    trackHeight: 4,
                  ),
                  child: Slider(
                    value: _distanceKm,
                    min: 1,
                    max: 100,
                    divisions: 99,
                    onChanged: (v) {
                      setModal(() {});
                      setState(() => _distanceKm = v);
                    },
                    onChangeEnd: (_) {
                      if (_position != null) {
                        _loadNearbyPlayers(
                            _position!.latitude, _position!.longitude);
                      }
                    },
                  ),
                ),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('1 km',
                        style: TextStyle(
                            color: Colors.white38,
                            fontSize: 12,
                            fontFamily: 'Poppins')),
                    Text('100 km',
                        style: TextStyle(
                            color: Colors.white38,
                            fontSize: 12,
                            fontFamily: 'Poppins')),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // â”€â”€ Tab row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  Widget _buildTabs() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          _TabChip(
            label: 'Discover',
            count: _discoverPlayers.length,
            active: _tab == 0,
            onTap: () => setState(() => _tab = 0),
          ),
          const SizedBox(width: 8),
          _TabChip(
            label: 'Following',
            count: _followingPlayers.length,
            active: _tab == 1,
            onTap: () => setState(() => _tab = 1),
          ),
        ],
      ),
    );
  }

  // â”€â”€ Content router â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  Widget _buildContent() {
    switch (_tab) {
      case 1:
        return _buildFollowing();
      default:
        return _buildDiscover();
    }
  }

  // â”€â”€ Discover tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  Widget _buildDiscover() {
    final players = _filteredDiscover;
    if (_mapExpanded) return _buildMapView(players);
    return Column(
      children: [
        _buildSportFilters(),
        Expanded(
          child: _isLoading
              ? const Center(
                  child: CircularProgressIndicator(color: AppColors.primary))
              : players.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(LucideIcons.users,
                                color: Colors.white24, size: 56),
                            const SizedBox(height: 12),
                            const Text('No players nearby',
                                style: TextStyle(
                                    color: Colors.white70,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                    fontFamily: 'Poppins')),
                            const SizedBox(height: 6),
                            Text(
                              'No one has shared their location within '
                              '${_distanceKm.round()} km. Try increasing '
                              'the radius or invite friends to join Kridaz.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.45),
                                  fontSize: 13,
                                  fontFamily: 'Poppins'),
                            ),
                            const SizedBox(height: 16),
                            OutlinedButton.icon(
                              onPressed: () => _position == null
                                  ? _initLocation()
                                  : _loadNearbyPlayers(_position!.latitude,
                                      _position!.longitude),
                              icon: const Icon(LucideIcons.refreshCw,
                                  size: 14, color: AppColors.primary),
                              label: const Text('Retry',
                                  style: TextStyle(color: AppColors.primary)),
                            ),
                          ],
                        ),
                      ),
                    )
                  : ListView.separated(
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      itemCount: players.length,
                      separatorBuilder: (_, __) => Container(
                        height: 1,
                        margin: const EdgeInsets.symmetric(horizontal: 16),
                        color: Colors.white.withValues(alpha: 0.05),
                      ),
                      itemBuilder: (_, i) {
                        final p = players[i];
                        return _PlayerRow(
                          player: p,
                          onTap: () => _openProfile(p),
                          trailing: _FollowButton(
                            isFollowing: p.isFollowing,
                            onTap: () => _toggleFollow(p),
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }

  // â”€â”€ Map view â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  Widget _buildMapView(List<_Player> players) {
    return Stack(
      children: [
        Positioned.fill(child: _buildFullMap(players)),
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: Container(
            decoration: const BoxDecoration(
              color: AppColors.surfaceL1,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              boxShadow: [
                BoxShadow(
                    color: Colors.black38,
                    blurRadius: 12,
                    offset: Offset(0, -4)),
              ],
            ),
            child: _buildPlayersPanel(players),
          ),
        ),
      ],
    );
  }

  Widget _buildFullMap(List<_Player> players) {
    final center = _location ?? const LatLng(17.3850, 78.4867);
    final pinned = players
        .where((p) => p.lat != null && p.lng != null)
        .toList(growable: false);
    final clusters = _clusterPlayers(pinned, _mapZoom);
    final markers = <Marker>[];
    for (final c in clusters) {
      if (c is _SinglePin) {
        final p = c.player;
        markers.add(Marker(
          point: LatLng(p.lat!, p.lng!),
          width: 52,
          height: 64,
          alignment: Alignment.topCenter,
          child: GestureDetector(
            onTap: () => _openProfile(p),
            child: _PlayerPin(player: p),
          ),
        ));
      } else if (c is _Cluster) {
        markers.add(Marker(
          point: c.center,
          width: 56,
          height: 56,
          alignment: Alignment.center,
          child: GestureDetector(
            onTap: () {
              try {
                _mapController.move(c.center, math.min(_mapZoom + 2, 18));
              } catch (_) {}
            },
            child: _ClusterBadge(count: c.count),
          ),
        ));
      }
    }
    if (_location != null) {
      markers.add(Marker(
        point: _location!,
        width: 16,
        height: 16,
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.primary,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2),
          ),
        ),
      ));
    }
    return Stack(
      children: [
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: center,
            initialZoom: _mapZoom,
            onPositionChanged: (camera, _) {
              if ((camera.zoom - _mapZoom).abs() > 0.25) {
                setState(() => _mapZoom = camera.zoom);
              }
            },
          ),
          children: [
            TileLayer(
              urlTemplate:
                  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
              subdomains: const ['a', 'b', 'c', 'd'],
              userAgentPackageName: 'com.saavikdev.bms',
              maxZoom: 19,
            ),
            if (_location != null)
              CircleLayer(
                circles: [
                  CircleMarker(
                    point: _location!,
                    radius: _distanceKm * 1000,
                    useRadiusInMeter: true,
                    color: AppColors.primary.withValues(alpha: 0.08),
                    borderColor: AppColors.primary.withValues(alpha: 0.40),
                    borderStrokeWidth: 2,
                  ),
                ],
              ),
            MarkerLayer(markers: markers),
            const RichAttributionWidget(
              attributions: [
                TextSourceAttribution('OpenStreetMap contributors')
              ],
            ),
          ],
        ),
        Positioned(
          top: 12,
          right: 12,
          child: GestureDetector(
            onTap: _toggleLocationSharing,
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: _isLocationSharing
                    ? AppColors.primary.withValues(alpha: 0.22)
                    : Colors.red.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: _isLocationSharing
                      ? AppColors.primary.withValues(alpha: 0.45)
                      : Colors.red.withValues(alpha: 0.45),
                ),
              ),
              child: Icon(
                _isLocationSharing ? LucideIcons.eye : LucideIcons.eyeOff,
                color: _isLocationSharing ? AppColors.primary : Colors.red,
                size: 18,
              ),
            ),
          ),
        ),
      ],
    );
  }

  List<_PinNode> _clusterPlayers(List<_Player> players, double zoom) {
    if (players.isEmpty) return const [];
    double radiusPx;
    if (zoom < 13) {
      radiusPx = 80;
    } else if (zoom <= 15) {
      radiusPx = 60;
    } else if (zoom <= 17) {
      radiusPx = 30;
    } else {
      radiusPx = 0;
    }
    if (radiusPx == 0) {
      return players.map((p) => _SinglePin(p)).toList();
    }
    final pxPerDegree = 256 * math.pow(2, zoom) / 360;
    final assigned = <int>{};
    final out = <_PinNode>[];
    for (var i = 0; i < players.length; i++) {
      if (assigned.contains(i)) continue;
      final a = players[i];
      final group = <_Player>[a];
      for (var j = i + 1; j < players.length; j++) {
        if (assigned.contains(j)) continue;
        final b = players[j];
        final dLat = (a.lat! - b.lat!).abs() * pxPerDegree;
        final dLng = (a.lng! - b.lng!).abs() * pxPerDegree;
        final distPx = math.sqrt(dLat * dLat + dLng * dLng);
        if (distPx < radiusPx) {
          group.add(b);
          assigned.add(j);
        }
      }
      assigned.add(i);
      if (group.length == 1) {
        out.add(_SinglePin(a));
      } else {
        final lat =
            group.map((p) => p.lat!).reduce((x, y) => x + y) / group.length;
        final lng =
            group.map((p) => p.lng!).reduce((x, y) => x + y) / group.length;
        out.add(_Cluster(LatLng(lat, lng), group.length));
      }
    }
    return out;
  }

  Widget _buildPlayersPanel(List<_Player> players) {
    final combined = [
      ..._followingPlayers.map((p) => (player: p, isFollowing: true)),
      ...players
          .where((p) => !_followingPlayers.any((f) => f.id == p.id))
          .map((p) => (player: p, isFollowing: false)),
    ];

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${players.length} players nearby',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Poppins',
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 58,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: combined.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, i) {
              final entry = combined[i];
              final p = entry.player;
              final following = entry.isFollowing;
              return GestureDetector(
                onTap: () => _openProfile(p),
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      width: 46,
                      height: 46,
                      decoration: BoxDecoration(
                        color: p.color,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: following ? AppColors.primary : Colors.white24,
                          width: following ? 2.0 : 1.5,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          p.initials,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                    if (!following)
                      Positioned(
                        right: -2,
                        bottom: -2,
                        child: GestureDetector(
                          onTap: p.isFollowing ? null : () => _toggleFollow(p),
                          child: Container(
                            width: 18,
                            height: 18,
                            decoration: BoxDecoration(
                              color: p.isFollowing
                                  ? Colors.white24
                                  : AppColors.accentGreen,
                              shape: BoxShape.circle,
                              border: Border.all(
                                  color: AppColors.surfaceL1, width: 1.5),
                            ),
                            child: Center(
                              child: Icon(
                                p.isFollowing
                                    ? LucideIcons.check
                                    : LucideIcons.plus,
                                color: p.isFollowing
                                    ? Colors.white54
                                    : Colors.black,
                                size: 10,
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Future<void> _openProfile(_Player player) async {
    final fallback = {
      'display_name': player.name,
      'name': player.name,
      'photo_url': player.profilePicture,
      'total_games_played': 0,
      'games_by_sport': <String, dynamic>{},
      'weekly_activity': <String, dynamic>{},
      'most_active_day': '',
    };
    final fetched = await _service.getPlayerProfile(player.id);
    if (!mounted) return;
    final profileData = fetched != null
        ? {...fallback, ...fetched}
        : fallback;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => PlayerProfileScreen(playerData: profileData),
    );
  }

  Widget _buildSportFilters() {
    return SizedBox(
      height: 46,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
        itemCount: _kSportFilters.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final f = _kSportFilters[i];
          final active = _sportFilter == f;
          return GestureDetector(
            onTap: () => setState(() => _sportFilter = f),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
              decoration: BoxDecoration(
                color: active ? AppColors.borderGray : AppColors.backgroundCard,
                borderRadius: BorderRadius.circular(20),
              ),
              child: ShaderMask(
                shaderCallback: (bounds) => const LinearGradient(
                  colors: [AppColors.gradientStart, AppColors.gradientEnd],
                ).createShader(bounds),
                blendMode: BlendMode.srcIn,
                child: Text(
                  f,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: active ? FontWeight.w700 : FontWeight.w400,
                    fontFamily: 'Poppins',
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  // â”€â”€ Following tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  Widget _buildFollowing() {
    return ListView.separated(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(vertical: 4),
      itemCount: _followingPlayers.length,
      separatorBuilder: (_, __) => Container(
        height: 1,
        margin: const EdgeInsets.symmetric(horizontal: 16),
        color: Colors.white.withValues(alpha: 0.05),
      ),
      itemBuilder: (_, i) {
        final p = _followingPlayers[i];
        return _PlayerRow(
          player: p,
          onTap: () => _openProfile(p),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const _GlassMsgButton(),
              const SizedBox(width: 8),
              const _GlassPlayButton(),
            ],
          ),
        );
      },
    );
  }

  // â”€â”€ Filter sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  void _showFilters() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => const _FilterSheet(),
    );
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _positionSub?.cancel();
    _nearbySub?.cancel();
    _heartbeatTimer?.cancel();
    _mapController.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }
}

sealed class _PinNode {
  const _PinNode();
}

class _SinglePin extends _PinNode {
  final _Player player;
  const _SinglePin(this.player);
}

class _Cluster extends _PinNode {
  final LatLng center;
  final int count;
  const _Cluster(this.center, this.count);
}

class _ClusterBadge extends StatelessWidget {
  final int count;
  const _ClusterBadge({required this.count});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const LinearGradient(
          colors: [AppColors.gradientStart, AppColors.gradientEnd],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.35),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      alignment: Alignment.center,
      child: Text(
        '$count',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 14,
          fontWeight: FontWeight.w800,
          fontFamily: 'Poppins',
        ),
      ),
    );
  }
}

// _PlayerPin — teardrop-shaped map marker with avatar inside
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _PlayerPin extends StatelessWidget {
  final _Player player;
  const _PlayerPin({required this.player});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: const Size(52, 64),
      painter: _PinPainter(color: player.color),
      child: Padding(
        // avatar sits in the round head of the pin
        padding: const EdgeInsets.only(top: 4, left: 4, right: 4),
        child: SizedBox(
          width: 44,
          height: 44,
          child: ClipOval(
            child: player.profilePicture != null &&
                    player.profilePicture!.isNotEmpty
                ? Image.network(
                    player.profilePicture!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => _initialsFallback(),
                    loadingBuilder: (_, child, progress) =>
                        progress == null ? child : _initialsFallback(),
                  )
                : _initialsFallback(),
          ),
        ),
      ),
    );
  }

  Widget _initialsFallback() => Container(
        color: player.color,
        alignment: Alignment.center,
        child: Text(
          player.initials,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w800,
            fontFamily: 'Poppins',
          ),
        ),
      );
}

class _PinPainter extends CustomPainter {
  final Color color;
  const _PinPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final headR = w / 2;

    // Build teardrop: circle on top, triangle tapering to a point at bottom.
    final path = ui.Path();
    final cx = w / 2;
    path.moveTo(cx - headR, headR);
    path.arcToPoint(
      Offset(cx + headR, headR),
      radius: Radius.circular(headR),
      clockwise: true,
    );
    path.quadraticBezierTo(cx + headR, h - headR * 0.4, cx, h);
    path.quadraticBezierTo(cx - headR, h - headR * 0.4, cx - headR, headR);
    path.close();

    // soft drop shadow
    canvas.drawShadow(path, Colors.black.withValues(alpha: 0.45), 4, false);

    // fill
    final fill = Paint()..color = color;
    canvas.drawPath(path, fill);

    // white ring around the head
    final ring = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;
    canvas.drawCircle(Offset(cx, headR), headR - 1.3, ring);

    // small bright dot at the tip for polish
    canvas.drawCircle(
      Offset(cx, h - 2),
      1.8,
      Paint()..color = Colors.white.withValues(alpha: 0.85),
    );
  }

  @override
  bool shouldRepaint(covariant _PinPainter old) => old.color != color;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// _TabChip
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _TabChip extends StatelessWidget {
  final String label;
  final int count;
  final bool active;
  final VoidCallback onTap;

  const _TabChip({
    required this.label,
    required this.count,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: active ? AppColors.borderGray : AppColors.backgroundCard,
          borderRadius: BorderRadius.circular(20),
        ),
        child: ShaderMask(
          shaderCallback: (bounds) => const LinearGradient(
            colors: [AppColors.gradientStart, AppColors.gradientEnd],
          ).createShader(bounds),
          blendMode: BlendMode.srcIn,
          child: Text(
            '$label  $count',
            style: TextStyle(
              color: Colors.white,
              fontSize: 13,
              fontWeight: active ? FontWeight.w700 : FontWeight.w400,
              fontFamily: 'Poppins',
            ),
          ),
        ),
      ),
    );
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// _PlayerRow
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _PlayerRow extends StatelessWidget {
  final _Player player;
  final Widget trailing;
  final VoidCallback? onTap;

  const _PlayerRow({required this.player, required this.trailing, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: player.color,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  player.initials,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    player.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'Poppins',
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    player.distance.isNotEmpty
                        ? '${player.handle}  ·  ${player.distance}'
                        : player.handle,
                    style: const TextStyle(
                      color: Colors.white54,
                      fontSize: 11,
                      fontFamily: 'Poppins',
                    ),
                  ),
                  if (player.sport.isNotEmpty) ...[
                    const SizedBox(height: 1),
                    Text(
                      player.sport,
                      style: const TextStyle(
                        color: Colors.white38,
                        fontSize: 11,
                        fontFamily: 'Poppins',
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () {},
              child: trailing,
            ),
          ],
        ),
      ),
    );
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// _FollowButton  (replaces _AddButton)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _FollowButton extends StatelessWidget {
  final bool isFollowing;
  final VoidCallback onTap;

  const _FollowButton({required this.isFollowing, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: isFollowing
          ? _glassButton(
              gradient: const LinearGradient(
                colors: [AppColors.gradientStart, AppColors.textLightGray],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              child: const Text(
                'Following',
                style: TextStyle(
                  color: AppColors.gradientStart,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Poppins',
                  letterSpacing: 0.5,
                ),
              ),
            )
          : _glassButton(
              gradient: const LinearGradient(
                colors: [AppColors.primary, AppColors.textLightGray],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Image.asset('assets/icons/add_player.png',
                      width: 16, height: 16),
                  const SizedBox(width: 6),
                  const Text(
                    'Follow',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'Poppins',
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _glassButton(
      {required LinearGradient gradient, required Widget child}) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: gradient,
      ),
      padding: const EdgeInsets.all(1.2),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(19),
        child: BackdropFilter(
          filter: ui.ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.55),
              borderRadius: BorderRadius.circular(19),
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// _GlassMsgButton / _GlassPlayButton
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _GlassMsgButton extends StatelessWidget {
  final VoidCallback? onTap;
  const _GlassMsgButton({this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap?.call();
      },
      child: Container(
        width: 40,
        height: 40,
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          gradient: LinearGradient(
            colors: [AppColors.primary, AppColors.textLightGray],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        padding: const EdgeInsets.all(1.2),
        child: ClipOval(
          child: BackdropFilter(
            filter: ui.ImageFilter.blur(sigmaX: 12, sigmaY: 12),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.55),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Image.asset(
                  'assets/icons/nearby_msg.png',
                  width: 18,
                  height: 18,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _GlassPlayButton extends StatelessWidget {
  const _GlassPlayButton();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: [AppColors.accentYellow, AppColors.textLightGray],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      padding: const EdgeInsets.all(1.2),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(19),
        child: BackdropFilter(
          filter: ui.ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.55),
              borderRadius: BorderRadius.circular(19),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.primary.withValues(alpha: 0.15),
                    border: Border.all(color: AppColors.primary, width: 1.2),
                  ),
                  child: const Icon(LucideIcons.user,
                      color: AppColors.primary, size: 12),
                ),
                const SizedBox(width: 6),
                const Text(
                  'PLAY',
                  style: TextStyle(
                    color: AppColors.accentYellow,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Poppins',
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Filter sheet
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _FilterSheet extends StatefulWidget {
  const _FilterSheet();

  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  String? _gender;
  String? _skill;
  final Set<String> _sports = {};
  final _minCtrl = TextEditingController();
  final _maxCtrl = TextEditingController();

  static const _sportsList = [
    'Cricket',
    'Football',
    'Basketball',
    'Tennis',
    'Badminton',
    'Swimming',
    'Hockey',
    'Volleyball',
  ];
  static const _skillLevels = ['Beginner', 'Intermediate', 'Advanced'];

  @override
  void dispose() {
    _minCtrl.dispose();
    _maxCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final botPad = MediaQuery.of(context).padding.bottom;
    return Container(
      height: MediaQuery.of(context).size.height * 0.82,
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
      decoration: const BoxDecoration(
        color: AppColors.surfaceL1,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Filters',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Poppins')),
              GestureDetector(
                onTap: () => setState(() {
                  _gender = null;
                  _skill = null;
                  _sports.clear();
                  _minCtrl.clear();
                  _maxCtrl.clear();
                }),
                child: Text('Clear All',
                    style: TextStyle(
                        color: AppColors.primary,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        fontFamily: 'Poppins')),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _label('Gender'),
                  const SizedBox(height: 10),
                  Row(
                    children: ['Male', 'Female', 'Other'].map((g) {
                      final sel = _gender == g;
                      return Padding(
                        padding: const EdgeInsets.only(right: 10),
                        child: GestureDetector(
                          onTap: () => setState(() => _gender = sel ? null : g),
                          child: _chip(g, sel),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 22),
                  _label('Age Range'),
                  const SizedBox(height: 10),
                  Row(children: [
                    Expanded(child: _ageInput(_minCtrl, 'Min')),
                    const SizedBox(width: 12),
                    Expanded(child: _ageInput(_maxCtrl, 'Max')),
                  ]),
                  const SizedBox(height: 22),
                  _label('Interested Sports'),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _sportsList.map((s) {
                      final sel = _sports.contains(s);
                      return GestureDetector(
                        onTap: () => setState(
                            () => sel ? _sports.remove(s) : _sports.add(s)),
                        child: _chip(s, sel),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 22),
                  _label('Skill Level'),
                  const SizedBox(height: 10),
                  Row(
                    children: _skillLevels.map((sk) {
                      final sel = _skill == sk;
                      return Padding(
                        padding: const EdgeInsets.only(right: 10),
                        child: GestureDetector(
                          onTap: () => setState(() => _skill = sel ? null : sk),
                          child: _chip(sk, sel),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 28),
                ],
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.only(bottom: botPad + 16, top: 8),
            child: GestureDetector(
              onTap: () => context.pop(),
              child: Container(
                width: double.infinity,
                height: 52,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Center(
                  child: Text('Apply Filters',
                      style: TextStyle(
                          color: Colors.black,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'Poppins')),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _label(String text) => Text(text,
      style: const TextStyle(
          color: Colors.white,
          fontSize: 15,
          fontWeight: FontWeight.w600,
          fontFamily: 'Poppins'));

  Widget _chip(String label, bool selected) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 9),
      decoration: BoxDecoration(
        color: selected ? AppColors.primary : AppColors.surfaceL3,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: selected ? AppColors.primary : Colors.white24,
        ),
      ),
      child: Text(label,
          style: TextStyle(
            color: selected ? Colors.black : Colors.white70,
            fontSize: 13,
            fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
            fontFamily: 'Poppins',
          )),
    );
  }

  Widget _ageInput(TextEditingController ctrl, String hint) {
    return Container(
      height: 46,
      decoration: BoxDecoration(
        color: AppColors.surfaceL3,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white24),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: Center(
        child: TextField(
          controller: ctrl,
          keyboardType: TextInputType.number,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: Colors.white38, fontSize: 14),
            border: InputBorder.none,
            isCollapsed: true,
          ),
        ),
      ),
    );
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Gradient slider track
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _GradientTrackShape extends SliderTrackShape with BaseSliderTrackShape {
  const _GradientTrackShape();

  @override
  void paint(
    PaintingContext context,
    Offset offset, {
    required RenderBox parentBox,
    required SliderThemeData sliderTheme,
    required Animation<double> enableAnimation,
    required TextDirection textDirection,
    required Offset thumbCenter,
    Offset? secondaryOffset,
    bool isDiscrete = false,
    bool isEnabled = false,
    double additionalActiveTrackHeight = 2,
  }) {
    final trackRect = getPreferredRect(
      parentBox: parentBox,
      offset: offset,
      sliderTheme: sliderTheme,
      isEnabled: isEnabled,
      isDiscrete: isDiscrete,
    );
    const radius = Radius.circular(4);

    context.canvas.drawRRect(
      RRect.fromRectAndCorners(
        Rect.fromLTRB(
            thumbCenter.dx, trackRect.top, trackRect.right, trackRect.bottom),
        topRight: radius,
        bottomRight: radius,
      ),
      Paint()..color = Colors.white12,
    );

    if (thumbCenter.dx > trackRect.left) {
      context.canvas.drawRRect(
        RRect.fromRectAndCorners(
          Rect.fromLTRB(
              trackRect.left, trackRect.top, thumbCenter.dx, trackRect.bottom),
          topLeft: radius,
          bottomLeft: radius,
        ),
        Paint()
          ..shader = const LinearGradient(
            colors: [AppColors.gradientStart, AppColors.gradientEnd],
          ).createShader(
            Rect.fromLTRB(trackRect.left, trackRect.top, thumbCenter.dx,
                trackRect.bottom),
          ),
      );
    }
  }
}
