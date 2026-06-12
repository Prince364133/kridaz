import '../core/constants/app_colors.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'new_home_dashboard.dart' show HomeHeader;
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import '../core/clock/server_clock.dart';
import '../models/time_slot_model.dart';
import '../providers/location_provider.dart';
import '../services/turf_service.dart';
import '../models/turf_model.dart';

class NewSearchScreen extends ConsumerStatefulWidget {
  const NewSearchScreen({super.key});

  @override
  ConsumerState<NewSearchScreen> createState() => _NewSearchScreenState();
}

class _NewSearchScreenState extends ConsumerState<NewSearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _query = '';
  String? _selectedSport;
  String? _selectedLocation;
  DateTime? _selectedDate;
  List<TurfModel> _turfs = [];
  bool _loadingTurfs = true;

  @override
  void initState() {
    super.initState();
    _loadTurfs();
    _searchController.addListener(_onSearchChanged);
  }

  Future<void> _loadTurfs() async {
    try {
      final turfs = await TurfService().getAllTurfs();
      if (mounted)
        setState(() {
          _turfs = turfs;
          _loadingTurfs = false;
        });
    } catch (_) {
      if (mounted) setState(() => _loadingTurfs = false);
    }
  }

  void _onSearchChanged() {
    final q = _searchController.text.trim().toLowerCase();
    if (q == _query) return;
    setState(() => _query = q);
  }

  List<TurfModel> get _visibleTurfs {
    return _turfs.where((t) {
      // Text search across name, location, city
      if (_query.isNotEmpty) {
        final hay = '${t.name} ${t.location} ${t.city ?? ''}'.toLowerCase();
        if (!hay.contains(_query)) return false;
      }
      // Sport filter
      if (_selectedSport != null && _selectedSport!.isNotEmpty) {
        final wantsSport = _selectedSport!.toLowerCase();
        final hasSport = t.sportTypes.any((s) => s.toLowerCase() == wantsSport);
        if (!hasSport) return false;
      }
      // Location filter (matches city/state/location string)
      if (_selectedLocation != null && _selectedLocation!.isNotEmpty) {
        final wantsLoc = _selectedLocation!.toLowerCase();
        final hay =
            '${t.location} ${t.city ?? ''} ${t.state ?? ''}'.toLowerCase();
        if (!hay.contains(wantsLoc)) return false;
      }
      return true;
    }).toList();
  }

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _showSportFilter() async {
    final result = await context.push<String>('/select-sport',
        extra: {'selectedSport': _selectedSport});
    if (result != null) {
      setState(() {
        _selectedSport = result;
      });
    }
  }

  Future<void> _showLocationFilter() async {
    final result = await context.push<String>('/select-location-filter',
        extra: {'selectedLocation': _selectedLocation});
    if (result != null) {
      setState(() {
        _selectedLocation = result;
      });
    }
  }

  Future<void> _showDateFilter() async {
    final result = await context
        .push<DateTime>('/select-date', extra: {'selectedDate': _selectedDate});
    if (result != null) {
      setState(() {
        _selectedDate = result;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            const HomeHeader(),
            const SizedBox(height: 20),

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
                    const Icon(LucideIcons.search,
                        color: Colors.white54, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _searchController,
                        style:
                            const TextStyle(color: Colors.white, fontSize: 14),
                        textInputAction: TextInputAction.search,
                        decoration: InputDecoration(
                          hintText: 'Search ground or location...',
                          hintStyle: TextStyle(
                              color: Colors.white.withValues(alpha: 0.4),
                              fontSize: 14),
                          border: InputBorder.none,
                        ),
                      ),
                    ),
                    if (_query.isNotEmpty)
                      GestureDetector(
                        onTap: () => _searchController.clear(),
                        child: Icon(LucideIcons.x,
                            size: 18,
                            color: Colors.white.withValues(alpha: 0.45)),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Filter chips
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Row(
                children: [
                  Expanded(
                      child: _buildFilterChip(
                          'Sport', _selectedSport ?? '', _showSportFilter)),
                  const SizedBox(width: 8),
                  Expanded(
                      child: _buildFilterChip('Location',
                          _selectedLocation ?? '', _showLocationFilter)),
                  const SizedBox(width: 8),
                  Expanded(
                      child: _buildFilterChip(
                          'Date',
                          _selectedDate != null
                              ? '${_selectedDate!.day}/${_selectedDate!.month}'
                              : '',
                          _showDateFilter)),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Venue list (booking only)
            Expanded(
              child: Builder(builder: (_) {
                if (_loadingTurfs) {
                  return Center(
                    child: CircularProgressIndicator(
                      valueColor:
                          AlwaysStoppedAnimation<Color>(AppColors.primary),
                    ),
                  );
                }
                final list = _visibleTurfs;
                if (_turfs.isEmpty) {
                  return const Center(
                    child: Text('No venues available',
                        style: TextStyle(color: Colors.white54)),
                  );
                }
                if (list.isEmpty) {
                  return Center(
                    child: Text(
                      _query.isNotEmpty
                          ? 'No matches for "$_query"'
                          : 'No venues match your filters',
                      style: const TextStyle(color: Colors.white54),
                    ),
                  );
                }
                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: list.length,
                  itemBuilder: (_, i) => _buildVenueCardFor(list[i]),
                );
              }),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, String value, VoidCallback onTap) {
    bool hasValue = value.isNotEmpty;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 36,
        decoration: BoxDecoration(
          color: hasValue ? AppColors.primary : AppColors.backgroundCard,
          borderRadius: BorderRadius.circular(8),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Center(
          child: Text(
            hasValue ? value : label,
            style: TextStyle(
              color: hasValue ? Colors.black : Colors.white,
              fontSize: 12,
              fontWeight: hasValue ? FontWeight.w600 : FontWeight.w400,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ),
    );
  }

  Widget _buildVenueCardFor(TurfModel t) {
    return _ArenaGroundCard(
      turf: t,
      onTap: () async {
        await context.push('/home/ground-detail', extra: {
          'turfId': t.id,
          'groundName': t.name,
          'location': t.location,
          'distance': t.location,
          'rating': t.avgRating ?? 4.5,
          'reviewCount': t.reviewCount,
          'pricePerHour': t.pricePerHour,
          'images': t.image.isNotEmpty ? [t.image] : <String>[],
        });
        if (mounted) _loadTurfs();
      },
    );
  }
}

// ── Rich arena card with hero, dates, slots & Book Now (live DB) ────────────

class _ArenaGroundCard extends ConsumerStatefulWidget {
  final TurfModel turf;
  final VoidCallback onTap;
  const _ArenaGroundCard({required this.turf, required this.onTap});
  @override
  ConsumerState<_ArenaGroundCard> createState() => _ArenaGroundCardState();
}

class _ArenaGroundCardState extends ConsumerState<_ArenaGroundCard> {
  static const _weekdayShort = [
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sun'
  ];
  static const _monthShort = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];

  final TurfService _turfService = TurfService();

  bool _liked = false;
  int _selectedDateIndex = 0;
  int? _selectedSlotIndex;
  bool _loadingSlots = false;

  late final List<DateTime> _dates;
  List<DisplaySlot> _slots = const [];

  @override
  void initState() {
    super.initState();
    final today = ServerClock.now();
    _dates = List.generate(
        7,
        (i) => DateTime(today.year, today.month, today.day)
            .add(Duration(days: i)));
    _loadSlots();
  }

  DateTime get _selectedDate => _dates[_selectedDateIndex];

  Future<void> _loadSlots() async {
    if (widget.turf.id.isEmpty) {
      setState(() {
        _slots = _generateFallbackSlots();
        _loadingSlots = false;
      });
      return;
    }
    setState(() {
      _loadingSlots = true;
      _selectedSlotIndex = null;
    });
    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    final response = await _turfService.getTimeSlots(widget.turf.id, dateStr);
    if (!mounted) return;
    if (response == null) {
      setState(() {
        _slots = _generateFallbackSlots();
        _loadingSlots = false;
      });
      return;
    }
    final booked = response.bookedTime;
    final generated =
        response.timeSlots.generatedSlots.where((s) => s.isActive).toList();
    final fallbackPrice = response.timeSlots.pricePerHour;

    double resolvePrice(double? p) {
      if (p != null && p > 0) return p;
      if (fallbackPrice > 0) return fallbackPrice;
      if (widget.turf.pricePerHour > 0) return widget.turf.pricePerHour;
      return 1500.0;
    }

    final raw = generated.isNotEmpty
        ? generated
            .map((s) => DisplaySlot(
                  startTime: s.startTime,
                  endTime: s.endTime,
                  price: resolvePrice(s.price),
                ))
            .toList()
        : _generateFallbackSlots();

    final now = ServerClock.now();
    final isToday = _selectedDate.year == now.year &&
        _selectedDate.month == now.month &&
        _selectedDate.day == now.day;

    final slots = raw.where((s) {
      if (!isToday) return true;
      final dt = _parseSlotTime(s.startTime);
      if (dt == null) return true;
      return dt.isAfter(now);
    }).map((s) {
      final isBooked = booked.any((b) {
        final bStart = b.startTime.toLocal();
        final bEnd = b.endTime.toLocal();
        final ss = _parseSlotTime(s.startTime);
        final se = _parseSlotTime(s.endTime);
        if (ss == null || se == null) return false;
        return ss.isBefore(bEnd) && se.isAfter(bStart);
      });
      return DisplaySlot(
        startTime: s.startTime,
        endTime: s.endTime,
        price: s.price,
        isBooked: isBooked,
      );
    }).toList();

    setState(() {
      _slots = slots;
      _loadingSlots = false;
    });
  }

  List<DisplaySlot> _generateFallbackSlots() {
    final open =
        widget.turf.openTime.isNotEmpty ? widget.turf.openTime : '06:00';
    final close =
        widget.turf.closeTime.isNotEmpty ? widget.turf.closeTime : '22:00';
    final dur = widget.turf.slotDuration > 0 ? widget.turf.slotDuration : 60;
    final brk = widget.turf.breakTime > 0 ? widget.turf.breakTime : 0;
    final price =
        widget.turf.pricePerHour > 0 ? widget.turf.pricePerHour : 1500.0;

    int parseMin(String t) {
      try {
        if (t.toUpperCase().contains('AM') || t.toUpperCase().contains('PM')) {
          final dt = DateFormat('hh:mm a').parse(t.toUpperCase());
          return dt.hour * 60 + dt.minute;
        }
        final p = t.split(':');
        return (int.tryParse(p[0]) ?? 0) * 60 + (int.tryParse(p[1]) ?? 0);
      } catch (_) {
        return -1;
      }
    }

    String toHHmm(int m) {
      final h = (m ~/ 60) % 24;
      final mm = m % 60;
      return '${h.toString().padLeft(2, '0')}:${mm.toString().padLeft(2, '0')}';
    }

    var openMin = parseMin(open);
    if (openMin < 0) openMin = 6 * 60;
    var closeMin = parseMin(close);
    if (closeMin <= openMin) closeMin = 22 * 60;

    final list = <DisplaySlot>[];
    var cur = openMin;
    while (cur + dur <= closeMin) {
      final end = cur + dur;
      list.add(DisplaySlot(
          startTime: toHHmm(cur), endTime: toHHmm(end), price: price));
      cur = end + brk;
    }
    return list;
  }

  DateTime? _parseSlotTime(String time) {
    final t = time.trim();
    try {
      if (t.toUpperCase().contains('AM') || t.toUpperCase().contains('PM')) {
        final dt = DateFormat('hh:mm a').parse(t.toUpperCase());
        return DateTime(_selectedDate.year, _selectedDate.month,
            _selectedDate.day, dt.hour, dt.minute);
      }
      final parts = t.split(':');
      if (parts.length < 2) return null;
      final h = int.tryParse(parts[0]);
      final m = int.tryParse(parts[1]);
      if (h == null || m == null) return null;
      return DateTime(
          _selectedDate.year, _selectedDate.month, _selectedDate.day, h, m);
    } catch (_) {
      return null;
    }
  }

  String _fmtSlot(String time) {
    final t = time.trim();
    try {
      if (t.toUpperCase().contains('AM') || t.toUpperCase().contains('PM')) {
        final dt = DateFormat('hh:mm a').parse(t.toUpperCase());
        return DateFormat('HH:mm').format(dt);
      }
      final p = t.split(':');
      if (p.length < 2) return t;
      final h = int.tryParse(p[0]) ?? 0;
      final m = int.tryParse(p[1]) ?? 0;
      return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}';
    } catch (_) {
      return t;
    }
  }

  String _isoFor(String slotTime) {
    final dt = _parseSlotTime(slotTime);
    return dt?.toUtc().toIso8601String() ?? '';
  }

  String get _displayDateLong {
    final d = _selectedDate;
    return '${_weekdayShort[d.weekday - 1]}, ${d.day.toString().padLeft(2, '0')} ${_monthShort[d.month - 1]} ${d.year}';
  }

  Future<void> _onBookNow() async {
    if (_selectedSlotIndex == null) return;
    final slot = _slots[_selectedSlotIndex!];
    HapticFeedback.mediumImpact();
    await context.push(
      '/ground-booking/checkout',
      extra: {
        'turfId': widget.turf.id,
        'groundName': widget.turf.name,
        'selectedDate': _displayDateLong,
        'selectedTimeSlot':
            '${_fmtSlot(slot.startTime)} – ${_fmtSlot(slot.endTime)}',
        'startTime': _isoFor(slot.startTime),
        'endTime': _isoFor(slot.endTime),
        'totalPrice': slot.price,
        'cancellationPolicy': widget.turf.policies ?? '',
      },
    );
    if (mounted) {
      setState(() => _selectedSlotIndex = null);
      _loadSlots();
    }
  }

  Future<void> _toggleLike() async {
    HapticFeedback.selectionClick();
    setState(() => _liked = !_liked);
    if (widget.turf.id.isNotEmpty) {
      await _turfService.likeTurf(widget.turf.id);
    }
  }

  @override
  Widget build(BuildContext context) {
    final turf = widget.turf;
    final hasRating = (turf.avgRating ?? 0) > 0;
    final rating = hasRating ? turf.avgRating! : 0.0;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surfaceL1,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHero(turf, rating, hasRating),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildVenueHeader(turf),
                  const SizedBox(height: 14),
                  _buildQuickStats(turf),
                  const SizedBox(height: 16),
                  _buildDateSection(),
                  const SizedBox(height: 16),
                  _buildSlotSection(),
                  const SizedBox(height: 14),
                  _buildSocialBar(),
                  const SizedBox(height: 14),
                  _buildBookNow(),
                  const SizedBox(height: 10),
                  _buildSecureFooter(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Hero ──────────────────────────────────────────────────────────────────
  Widget _buildHero(TurfModel turf, double rating, bool hasRating) {
    final isNetwork = turf.image.startsWith('http');
    // Distance from the user (rather than the address text) so the chip is
    // useful at a glance. Needs both the user location and the turf coords
    // — falls back to "—" if either is missing.
    final userLoc = ref.watch(locationProvider);
    final distanceLabel = _formatDistance(
      userLat: userLoc.latitude,
      userLng: userLoc.longitude,
      turfLat: turf.latitude,
      turfLng: turf.longitude,
    );

    return GestureDetector(
      onTap: widget.onTap,
      child: SizedBox(
        height: 200,
        width: double.infinity,
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (isNetwork)
              CachedNetworkImage(
                imageUrl: turf.image,
                fit: BoxFit.cover,
                placeholder: (_, __) =>
                    Container(color: AppColors.surfaceForest),
                errorWidget: (_, __, ___) => Image.asset(
                  'assets/images/home/ground.jpg',
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) =>
                      Container(color: AppColors.surfaceForest),
                ),
              )
            else
              Image.asset(
                'assets/images/home/ground.jpg',
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) =>
                    Container(color: AppColors.surfaceForest),
              ),

            // Featured badge
            Positioned(
              top: 12,
              left: 12,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.55),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.45)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Icon(LucideIcons.star, color: AppColors.primary, size: 12),
                    SizedBox(width: 4),
                    Text('FEATURED',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        )),
                  ],
                ),
              ),
            ),

            // Heart
            Positioned(
              top: 12,
              right: 12,
              child: GestureDetector(
                onTap: _toggleLike,
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.55),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    _liked ? Icons.favorite : Icons.favorite_border,
                    color: _liked ? Colors.redAccent : Colors.white,
                    size: 18,
                  ),
                ),
              ),
            ),

            // Rating chip — green star + score on the image (mirrors the
            // pinned-corner pattern used elsewhere in the app).
            Positioned(
              right: 12,
              bottom: 12,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.55),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.star_outline_rounded,
                        color: AppColors.primary, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      hasRating ? rating.toStringAsFixed(1) : 'New',
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Distance / location pill
            Positioned(
              left: 12,
              bottom: 12,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.55),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(LucideIcons.mapPin,
                        color: AppColors.primary, size: 12),
                    const SizedBox(width: 4),
                    Text(
                      distanceLabel,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
            ),

            // Carousel dots
            Positioned(
              left: 0,
              right: 0,
              bottom: 12,
              child: Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: List.generate(
                      3,
                      (i) => Container(
                            width: i == 0 ? 14 : 6,
                            height: 6,
                            margin: const EdgeInsets.symmetric(horizontal: 2),
                            decoration: BoxDecoration(
                              color: i == 0
                                  ? AppColors.primary
                                  : Colors.white.withValues(alpha: 0.5),
                              borderRadius: BorderRadius.circular(3),
                            ),
                          )),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Venue header ──────────────────────────────────────────────────────────
  Widget _buildVenueHeader(TurfModel turf) {
    // Rating moved onto the hero image; this row is now just the venue
    // name + secondary location line.
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          turf.name,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
              color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 4),
        Row(
          children: [
            const Icon(LucideIcons.mapPin, color: AppColors.primary, size: 12),
            const SizedBox(width: 4),
            Expanded(
              child: Text(
                _composeLocation(turf),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.65), fontSize: 12),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ── Quick stats row ───────────────────────────────────────────────────────
  /// Build the secondary "City, State" line below the venue name. Some
  /// turfs come back from the backend with the same value in two or three
  /// of `location` / `city` / `state` (e.g. "New Delhi, New Delhi, New
  /// Delhi"). Trim, lower-case-compare, and skip duplicates so each
  /// distinct place name only appears once.
  String _composeLocation(TurfModel turf) {
    final seen = <String>{};
    final parts = <String>[];
    for (final raw in [turf.location, turf.city, turf.state]) {
      final s = raw?.trim() ?? '';
      if (s.isEmpty) continue;
      final key = s.toLowerCase();
      if (seen.add(key)) parts.add(s);
    }
    return parts.join(', ');
  }

  /// Format the great-circle distance between the user and the turf into
  /// a short pill-ready string. Returns "—" when either side of the pair
  /// is missing (no permission, no turf coords).
  String _formatDistance({
    required double? userLat,
    required double? userLng,
    required double? turfLat,
    required double? turfLng,
  }) {
    if (userLat == null ||
        userLng == null ||
        turfLat == null ||
        turfLng == null) {
      return '—';
    }
    final meters =
        Geolocator.distanceBetween(userLat, userLng, turfLat, turfLng);
    if (meters < 1000) return '${meters.round()} m';
    final km = meters / 1000.0;
    if (km < 10) return '${km.toStringAsFixed(1)} km';
    if (km < 100) return '${km.round()} km';
    return '100+ km';
  }

  Widget _buildQuickStats(TurfModel turf) {
    // Combine sport types + ground types into one pipe-separated pill so
    // every value fits the same row (Cricket | Artificial Turf | Pickleball
    // …) regardless of how many a turf has. Empty fall-back keeps the pill
    // from collapsing to zero height on a freshly-listed venue.
    final items = <String>[
      ...turf.sportTypes.where((s) => s.trim().isNotEmpty),
      ...turf.groundTypes.where((s) => s.trim().isNotEmpty),
    ];
    final label = items.isEmpty ? 'Sports' : items.join('  |  ');
    return Container(
      height: 44,
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: AppColors.surfaceL2,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            Align(
              alignment: Alignment.center,
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Date strip ────────────────────────────────────────────────────────────
  Widget _buildDateSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Expanded(
              child: Text('Select Date',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w700)),
            ),
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.surfaceL2,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
              ),
              child: const Icon(LucideIcons.calendar,
                  color: Colors.white70, size: 16),
            ),
          ],
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 78,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _dates.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (_, i) {
              final d = _dates[i];
              final selected = i == _selectedDateIndex;
              final label = i == 0 ? 'Today' : _weekdayShort[d.weekday - 1];
              return GestureDetector(
                onTap: () {
                  HapticFeedback.selectionClick();
                  setState(() => _selectedDateIndex = i);
                  _loadSlots();
                },
                child: Container(
                  width: 60,
                  decoration: BoxDecoration(
                    gradient: selected
                        ? const LinearGradient(
                            colors: [
                              AppColors.gradientStart,
                              AppColors.gradientEnd
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          )
                        : null,
                    color: selected ? null : AppColors.surfaceL2,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: selected
                            ? Colors.transparent
                            : Colors.white.withValues(alpha: 0.08)),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        label,
                        style: TextStyle(
                          color: selected ? Colors.black87 : Colors.white70,
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        d.day.toString().padLeft(2, '0'),
                        style: TextStyle(
                          color: selected ? Colors.black : Colors.white,
                          fontSize: 19,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _monthShort[d.month - 1],
                        style: TextStyle(
                          color: selected ? Colors.black54 : Colors.white54,
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // ── Slot strip ────────────────────────────────────────────────────────────
  Widget _buildSlotSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(LucideIcons.clock, color: Colors.white, size: 14),
            const SizedBox(width: 6),
            const Expanded(
              child: Text('Select your time slot',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w700)),
            ),
            Icon(LucideIcons.info,
                color: Colors.white.withValues(alpha: 0.4), size: 13),
            const SizedBox(width: 4),
            Text(
              '${widget.turf.slotDuration > 0 ? widget.turf.slotDuration : 60} min slots',
              style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.55), fontSize: 10),
            ),
          ],
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 56,
          child: _loadingSlots
              ? const Center(
                  child: SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: AppColors.primary),
                  ),
                )
              : _slots.isEmpty
                  ? Center(
                      child: Text(
                        'No slots available for this date',
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.4),
                            fontSize: 12),
                      ),
                    )
                  : ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _slots.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (_, i) {
                        final slot = _slots[i];
                        final selected = _selectedSlotIndex == i;
                        final booked = slot.isBooked;
                        return GestureDetector(
                          onTap: booked
                              ? null
                              : () {
                                  HapticFeedback.selectionClick();
                                  setState(() => _selectedSlotIndex = i);
                                },
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: booked
                                  ? AppColors.surfaceL3
                                  : AppColors.surfaceL2,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: selected
                                    ? AppColors.primary
                                    : Colors.white.withValues(alpha: 0.08),
                                width: selected ? 1.5 : 1,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  '${_fmtSlot(slot.startTime)} – ${_fmtSlot(slot.endTime)}',
                                  style: TextStyle(
                                    color: booked
                                        ? Colors.white.withValues(alpha: 0.3)
                                        : Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    decoration: booked
                                        ? TextDecoration.lineThrough
                                        : TextDecoration.none,
                                  ),
                                ),
                                if (selected) ...[
                                  const SizedBox(width: 8),
                                  Container(
                                    width: 18,
                                    height: 18,
                                    decoration: const BoxDecoration(
                                      color: AppColors.primary,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.check,
                                        color: Colors.black, size: 12),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }

  // ── Social bar ────────────────────────────────────────────────────────────
  Widget _buildSocialBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surfaceL2,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Row(
        children: [
          Expanded(
              child: _socialAction(LucideIcons.share2, 'Share', () async {
            if (widget.turf.id.isNotEmpty)
              await _turfService.shareTurf(widget.turf.id);
          })),
          Container(
              width: 1,
              height: 18,
              color: Colors.white.withValues(alpha: 0.08)),
          Expanded(
              child: _socialAction(
                  LucideIcons.messageCircle, 'Like / Comment', widget.onTap)),
          Container(
              width: 1,
              height: 18,
              color: Colors.white.withValues(alpha: 0.08)),
          Expanded(
              child: _socialAction(
                  LucideIcons.bookmark, 'Add to List', _toggleLike)),
        ],
      ),
    );
  }

  Widget _socialAction(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: Colors.white.withValues(alpha: 0.85), size: 14),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
                color: Colors.white.withValues(alpha: 0.85),
                fontSize: 11,
                fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  // ── Book Now ──────────────────────────────────────────────────────────────
  Widget _buildBookNow() {
    final enabled = _selectedSlotIndex != null;
    return GestureDetector(
      onTap: enabled ? _onBookNow : null,
      child: Container(
        height: 52,
        width: double.infinity,
        decoration: BoxDecoration(
          gradient: enabled
              ? const LinearGradient(
                  colors: [AppColors.gradientStart, AppColors.gradientEnd],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                )
              : null,
          color: enabled ? null : Colors.white.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Book Now',
              style: TextStyle(
                color: enabled ? Colors.black : Colors.white38,
                fontSize: 15,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.4,
              ),
            ),
            const SizedBox(width: 10),
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: enabled ? Colors.black : Colors.white12,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.arrow_forward,
                color: enabled ? AppColors.primary : Colors.white24,
                size: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSecureFooter() {
    return Center(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.lock,
              color: Colors.white.withValues(alpha: 0.45), size: 11),
          const SizedBox(width: 6),
          Text(
            'Secure Booking & Safe Payments',
            style: TextStyle(
                color: Colors.white.withValues(alpha: 0.5), fontSize: 10),
          ),
        ],
      ),
    );
  }
}
