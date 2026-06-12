import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../core/constants/app_colors.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../core/clock/server_clock.dart';
import '../models/time_slot_model.dart';
import '../services/turf_service.dart';

class GroundBookingDateScreen extends StatefulWidget {
  final String turfId;
  final String groundName;
  final String turfImageUrl;
  final double pricePerHour;

  const GroundBookingDateScreen({
    super.key,
    this.turfId = '',
    required this.groundName,
    this.turfImageUrl = '',
    this.pricePerHour = 0,
  });

  @override
  State<GroundBookingDateScreen> createState() =>
      _GroundBookingDateScreenState();
}

class _GroundBookingDateScreenState extends State<GroundBookingDateScreen>
    with WidgetsBindingObserver {
  final TurfService _turfService = TurfService();

  int _selectedDateIndex = 0;
  final Set<int> _selectedSlotIndices = {};
  bool _isLoadingSlots = false;

  late final List<DateTime> _dates;
  List<DisplaySlot> _displaySlots = [];
  String? _cancellationPolicy;

  static const _monthNames = [
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
  static const _weekdayNames = [
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sun'
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Server-aligned "today" — avoids a 30-min device-clock drift causing
    // the wrong calendar day to be selected near midnight.
    final today = ServerClock.now();
    _dates = List.generate(14, (i) => today.add(Duration(days: i)));
    _loadSlots();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  /// Re-fetch slots when the app comes back to foreground — covers the case
  /// where another user booked one of the slots while this screen was open
  /// in the background.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _loadSlots();
  }

  DateTime get _selectedDate => _dates[_selectedDateIndex];

  String get _selectedDateApiFormat =>
      DateFormat('yyyy-MM-dd').format(_selectedDate);

  Future<void> _loadSlots() async {
    if (widget.turfId.isEmpty) {
      setState(() {
        _displaySlots = _generateSlotsFromHours(
          openTime: '06:00',
          closeTime: '22:00',
          slotDuration: 60,
          breakTime: 0,
          price: widget.pricePerHour > 0 ? widget.pricePerHour : 1500.0,
        );
        _isLoadingSlots = false;
      });
      return;
    }
    setState(() {
      _isLoadingSlots = true;
      _selectedSlotIndices.clear();
    });
    final response =
        await _turfService.getTimeSlots(widget.turfId, _selectedDateApiFormat);
    if (!mounted) return;

    if (response == null || response.timeSlots.slotsNeedsUpdate) {
      setState(() {
        _displaySlots = [];
        _isLoadingSlots = false;
      });
      return;
    }

    _cancellationPolicy = response.timeSlots.policies;

    final bookedRanges = response.bookedTime;
    final generated = response.timeSlots.generatedSlots;
    final fallbackPrice = response.timeSlots.pricePerHour;

    // Resolve the best available price: slot price â†’ turf pricePerHour â†’ widget param
    double _resolvePrice(double? slotPrice) {
      if (slotPrice != null && slotPrice > 0) return slotPrice;
      if (fallbackPrice > 0) return fallbackPrice;
      if (widget.pricePerHour > 0) return widget.pricePerHour;
      return 1500.0; // ultimate fallback
    }

    // If the owner hasn't configured slots yet, generate them from the turf's
    // open/close time and slot duration (defaults: 60 min slots, 0 break time).
    final activeGenerated = generated.where((s) => s.isActive).toList();
    final rawSlots = activeGenerated.isNotEmpty
        ? activeGenerated.map((s) {
            final p = _resolvePrice(s.price);
            return DisplaySlot(
              startTime: s.startTime,
              endTime: s.endTime,
              price: p,
            );
          }).toList()
        : _generateSlotsFromHours(
            openTime: response.timeSlots.openTime,
            closeTime: response.timeSlots.closeTime,
            slotDuration: response.timeSlots.slotDuration,
            breakTime: response.timeSlots.breakTime,
            price: fallbackPrice,
          );

    // Server time — the slot-past filter must match what the server
    // considers "past", not what the device thinks.
    final now = ServerClock.now();
    final isToday = _selectedDate.year == now.year &&
        _selectedDate.month == now.month &&
        _selectedDate.day == now.day;

    // Mark booked slots and filter past slots for today
    final slots = rawSlots.where((s) {
      if (!isToday) return true;
      final slotStart = _parseSlotTime(s.startTime);
      if (slotStart == null) return true;
      return slotStart.isAfter(now);
    }).map((s) {
      final isBooked = bookedRanges.any((b) {
        final bStart = b.startTime.toLocal();
        final bEnd = b.endTime.toLocal();
        final slotStart = _parseSlotTime(s.startTime);
        final slotEnd = _parseSlotTime(s.endTime);
        if (slotStart == null || slotEnd == null) return false;
        return slotStart.isBefore(bEnd) && slotEnd.isAfter(bStart);
      });
      return DisplaySlot(
        startTime: s.startTime,
        endTime: s.endTime,
        price: s.price,
        isBooked: isBooked,
      );
    }).toList();

    setState(() {
      _displaySlots = slots;
      _isLoadingSlots = false;
    });
  }

  // Handles both "HH:mm" (24-hour) and "hh:mm a" (12-hour AM/PM) formats.
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

  /// Generates slots from open/close time when the owner hasn't configured
  /// generatedSlots. Falls back to 06:00–22:00 if the turf times are missing.
  List<DisplaySlot> _generateSlotsFromHours({
    required String openTime,
    required String closeTime,
    required int slotDuration,
    required int breakTime,
    required double price,
  }) {
    final effectivePrice = price > 0
        ? price
        : (widget.pricePerHour > 0 ? widget.pricePerHour : 1500.0);
    final step = (slotDuration > 0 ? slotDuration : 60) +
        (breakTime > 0 ? breakTime : 0);

    int parseMinutes(String t) {
      final s = t.trim();
      try {
        if (s.toUpperCase().contains('AM') || s.toUpperCase().contains('PM')) {
          final dt = DateFormat('hh:mm a').parse(s.toUpperCase());
          return dt.hour * 60 + dt.minute;
        }
        final p = s.split(':');
        if (p.length < 2) return -1;
        final h = int.tryParse(p[0]);
        final m = int.tryParse(p[1]);
        if (h == null || m == null) return -1;
        return h * 60 + m;
      } catch (_) {
        return -1;
      }
    }

    String minutesToHHmm(int minutes) {
      final h = (minutes ~/ 60) % 24;
      final m = minutes % 60;
      return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}';
    }

    int openMin = parseMinutes(openTime);
    int closeMin = parseMinutes(closeTime);

    // Fallback if times missing or invalid
    if (openMin < 0) openMin = 6 * 60;
    if (closeMin <= openMin) closeMin = 22 * 60;

    final slots = <DisplaySlot>[];
    int cursor = openMin;
    while (cursor + slotDuration <= closeMin) {
      final end = cursor + (slotDuration > 0 ? slotDuration : 60);
      slots.add(DisplaySlot(
        startTime: minutesToHHmm(cursor),
        endTime: minutesToHHmm(end),
        price: effectivePrice,
      ));
      cursor = end + (breakTime > 0 ? breakTime : 0);
    }
    return slots;
  }

  double get _totalPrice {
    if (_selectedSlotIndices.isEmpty) return 0;
    double total = 0;
    for (final idx in _selectedSlotIndices) {
      total += _displaySlots[idx].price;
    }
    return total;
  }

  // Slots must be contiguous — when user taps a slot, extend selection or reset
  void _toggleSlot(int index) {
    if (_displaySlots[index].isBooked) return;
    HapticFeedback.selectionClick();
    setState(() {
      if (_selectedSlotIndices.contains(index)) {
        // Deselect: if it's an edge slot, trim; if it's middle, reset
        final min = _selectedSlotIndices.reduce((a, b) => a < b ? a : b);
        final max = _selectedSlotIndices.reduce((a, b) => a > b ? a : b);
        if (index == min || index == max) {
          _selectedSlotIndices.remove(index);
        } else {
          _selectedSlotIndices.clear();
          _selectedSlotIndices.add(index);
        }
      } else {
        if (_selectedSlotIndices.isEmpty) {
          _selectedSlotIndices.add(index);
        } else {
          final min = _selectedSlotIndices.reduce((a, b) => a < b ? a : b);
          final max = _selectedSlotIndices.reduce((a, b) => a > b ? a : b);
          // Only allow extending contiguously
          if (index == min - 1 || index == max + 1) {
            // Check no booked slots in the range
            final newMin = index < min ? index : min;
            final newMax = index > max ? index : max;
            bool hasBooked = false;
            for (int i = newMin; i <= newMax; i++) {
              if (_displaySlots[i].isBooked) {
                hasBooked = true;
                break;
              }
            }
            if (!hasBooked) {
              for (int i = newMin; i <= newMax; i++) {
                _selectedSlotIndices.add(i);
              }
            }
          } else {
            // Non-adjacent: reset to just this slot
            _selectedSlotIndices.clear();
            _selectedSlotIndices.add(index);
          }
        }
      }
    });
  }

  String _formatSlotDisplay(String time) {
    final t = time.trim();
    try {
      if (t.toUpperCase().contains('AM') || t.toUpperCase().contains('PM')) {
        final dt = DateFormat('hh:mm a').parse(t.toUpperCase());
        return DateFormat('hh:mm a').format(dt);
      }
      final parts = t.split(':');
      if (parts.length < 2) return t;
      final h = int.tryParse(parts[0]) ?? 0;
      final m = int.tryParse(parts[1]) ?? 0;
      return DateFormat('hh:mm a').format(DateTime(2000, 1, 1, h, m));
    } catch (_) {
      return t;
    }
  }

  String get _selectedTimeRange {
    if (_selectedSlotIndices.isEmpty || _displaySlots.isEmpty) return '';
    final sorted = _selectedSlotIndices.toList()..sort();
    final start = _displaySlots[sorted.first].startTime;
    final end = _displaySlots[sorted.last].endTime;
    return '${_formatSlotDisplay(start)} – ${_formatSlotDisplay(end)}';
  }

  String _isoDateTime(String slotTime) {
    final dt = _parseSlotTime(slotTime);
    if (dt == null) return '';
    return dt.toUtc().toIso8601String();
  }

  String get _displayDate {
    final d = _selectedDate;
    return '${_weekdayNames[d.weekday - 1]}, ${d.day.toString().padLeft(2, '0')} ${_monthNames[d.month - 1]} ${d.year}';
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final sheetHeight = screenHeight * 0.82;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          // tap-outside to dismiss
          GestureDetector(
            onTap: () => context.pop(),
            child: Container(color: Colors.transparent),
          ),

          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              height: sheetHeight,
              decoration: const BoxDecoration(
                color: AppColors.surfaceL1,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  const SizedBox(height: 12),
                  // drag handle
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                        color: Colors.white24,
                        borderRadius: BorderRadius.circular(2)),
                  ),
                  const SizedBox(height: 12),

                  // header
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            widget.groundName,
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 15,
                                fontWeight: FontWeight.w700),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        GestureDetector(
                          onTap: () => context.pop(),
                          child: const Icon(LucideIcons.x,
                              color: Colors.white54, size: 20),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Divider(
                      color: Colors.white.withValues(alpha: 0.08), height: 1),

                  Expanded(
                    child: RefreshIndicator(
                      onRefresh: () async {
                        await _loadSlots();
                      },
                      color: AppColors.primary,
                      backgroundColor: AppColors.surfaceL1,
                      child: SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 16),

                            // Date strip
                            const Text(
                              'Select date',
                              style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 10),
                            SizedBox(
                              height: 76,
                              child: ListView.separated(
                                scrollDirection: Axis.horizontal,
                                itemCount: _dates.length,
                                separatorBuilder: (_, __) =>
                                    const SizedBox(width: 8),
                                itemBuilder: (context, index) {
                                  final d = _dates[index];
                                  final selected = index == _selectedDateIndex;
                                  return GestureDetector(
                                    onTap: () {
                                      HapticFeedback.selectionClick();
                                      setState(
                                          () => _selectedDateIndex = index);
                                      _loadSlots();
                                    },
                                    child: Container(
                                      width: 54,
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
                                        color: selected
                                            ? null
                                            : AppColors.surfaceL4,
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                            color: selected
                                                ? Colors.transparent
                                                : Colors.white12),
                                      ),
                                      child: Column(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: [
                                          Text(
                                            d.day.toString().padLeft(2, '0'),
                                            style: TextStyle(
                                              color: selected
                                                  ? Colors.black
                                                  : Colors.white,
                                              fontSize: 20,
                                              fontWeight: FontWeight.w800,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            _weekdayNames[d.weekday - 1],
                                            style: TextStyle(
                                              color: selected
                                                  ? Colors.black54
                                                  : Colors.white38,
                                              fontSize: 11,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),

                            const SizedBox(height: 20),

                            // Time slots
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Select time slot(s)',
                                  style: TextStyle(
                                      color: Colors.white70,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600),
                                ),
                                if (_selectedSlotIndices.isNotEmpty)
                                  Text(
                                    '${_selectedSlotIndices.length} slot${_selectedSlotIndices.length > 1 ? 's' : ''} selected',
                                    style: const TextStyle(
                                        color: AppColors.gradientEnd,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w500),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 10),

                            if (_isLoadingSlots)
                              const Center(
                                child: Padding(
                                  padding: EdgeInsets.symmetric(vertical: 32),
                                  child: CircularProgressIndicator(
                                    color: AppColors.gradientEnd,
                                    strokeWidth: 2,
                                  ),
                                ),
                              )
                            else if (_displaySlots.isEmpty)
                              Center(
                                child: Padding(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 32),
                                  child: Column(
                                    children: [
                                      const Icon(LucideIcons.calendar,
                                          color: Colors.white24, size: 36),
                                      const SizedBox(height: 12),
                                      Text(
                                        'No slots available for this date',
                                        style: TextStyle(
                                            color: Colors.white
                                                .withValues(alpha: 0.4),
                                            fontSize: 13),
                                      ),
                                    ],
                                  ),
                                ),
                              )
                            else
                              GridView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                padding: EdgeInsets.zero,
                                gridDelegate:
                                    const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 3,
                                  mainAxisSpacing: 8,
                                  crossAxisSpacing: 8,
                                  childAspectRatio: 2.0,
                                ),
                                itemCount: _displaySlots.length,
                                itemBuilder: (context, index) {
                                  final slot = _displaySlots[index];
                                  final selected =
                                      _selectedSlotIndices.contains(index);
                                  final booked = slot.isBooked;
                                  return GestureDetector(
                                    onTap: booked
                                        ? null
                                        : () => _toggleSlot(index),
                                    child: Container(
                                      alignment: Alignment.center,
                                      decoration: BoxDecoration(
                                        gradient: selected
                                            ? const LinearGradient(
                                                colors: [
                                                  AppColors.gradientStart,
                                                  AppColors.gradientEnd
                                                ],
                                                begin: Alignment.centerLeft,
                                                end: Alignment.centerRight,
                                              )
                                            : null,
                                        color: booked
                                            ? AppColors.surfaceL3
                                            : selected
                                                ? null
                                                : AppColors.surfaceL4,
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(
                                          color: booked
                                              ? Colors.white
                                                  .withValues(alpha: 0.05)
                                              : selected
                                                  ? Colors.transparent
                                                  : Colors.white12,
                                        ),
                                      ),
                                      child: Column(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: [
                                          Text(
                                            _formatSlotDisplay(slot.startTime),
                                            style: TextStyle(
                                              color: booked
                                                  ? Colors.white
                                                      .withValues(alpha: 0.25)
                                                  : selected
                                                      ? Colors.black
                                                      : Colors.white,
                                              fontSize: 11,
                                              fontWeight: FontWeight.w600,
                                              // Strikethrough on booked slots makes
                                              // the locked state unmistakable.
                                              decoration: booked
                                                  ? TextDecoration.lineThrough
                                                  : TextDecoration.none,
                                              decorationColor: Colors.white
                                                  .withValues(alpha: 0.4),
                                            ),
                                          ),
                                          if (booked)
                                            Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment.center,
                                              children: [
                                                Icon(LucideIcons.lock,
                                                    size: 9,
                                                    color: Colors.white
                                                        .withValues(
                                                            alpha: 0.35)),
                                                const SizedBox(width: 3),
                                                Text(
                                                  'Booked',
                                                  style: TextStyle(
                                                    color: Colors.white
                                                        .withValues(
                                                            alpha: 0.35),
                                                    fontSize: 9,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ),
                                              ],
                                            )
                                          else
                                            Text(
                                              '₹${slot.price.toStringAsFixed(0)}',
                                              style: TextStyle(
                                                color: selected
                                                    ? Colors.black54
                                                    : Colors.white38,
                                                fontSize: 10,
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),

                            const SizedBox(height: 100),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // â”€â”€ Bottom bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: EdgeInsets.fromLTRB(
                  16, 12, 16, MediaQuery.of(context).padding.bottom + 12),
              decoration: const BoxDecoration(
                color: AppColors.surfaceL1,
                border: Border(top: BorderSide(color: Colors.white10)),
              ),
              child: Row(
                children: [
                  if (_selectedSlotIndices.isNotEmpty) ...[
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _selectedTimeRange,
                          style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.6),
                              fontSize: 11),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '₹${_totalPrice.toStringAsFixed(0)}',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 28,
                              fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                    const SizedBox(width: 16),
                  ],
                  Expanded(
                    child: GestureDetector(
                      onTap: _selectedSlotIndices.isEmpty
                          ? null
                          : () async {
                              HapticFeedback.mediumImpact();
                              final sorted = _selectedSlotIndices.toList()
                                ..sort();
                              final startSlot = _displaySlots[sorted.first];
                              final endSlot = _displaySlots[sorted.last];
                              await context.push(
                                '/ground-booking/checkout',
                                extra: {
                                  'turfId': widget.turfId,
                                  'groundName': widget.groundName,
                                  'selectedDate': _displayDate,
                                  'selectedTimeSlot': _selectedTimeRange,
                                  'startTime':
                                      _isoDateTime(startSlot.startTime),
                                  'endTime': _isoDateTime(endSlot.endTime),
                                  'totalPrice': _totalPrice,
                                  'cancellationPolicy':
                                      _cancellationPolicy ?? '',
                                },
                              );
                              // Re-fetch slots once the checkout flow pops back —
                              // the slot the user just paid for is now booked
                              // and must turn off in the grid.
                              if (mounted) {
                                setState(() => _selectedSlotIndices.clear());
                                _loadSlots();
                              }
                            },
                      child: Container(
                        height: 52,
                        decoration: BoxDecoration(
                          gradient: _selectedSlotIndices.isNotEmpty
                              ? const LinearGradient(
                                  colors: [
                                    AppColors.gradientStart,
                                    AppColors.gradientEnd
                                  ],
                                  begin: Alignment.centerLeft,
                                  end: Alignment.centerRight,
                                )
                              : null,
                          color: _selectedSlotIndices.isEmpty
                              ? Colors.white12
                              : null,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Text(
                            'PROCEED',
                            style: TextStyle(
                              color: _selectedSlotIndices.isNotEmpty
                                  ? Colors.black
                                  : Colors.white38,
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
