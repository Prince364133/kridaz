import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../core/constants/app_colors.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/booking_service.dart';
import '../widgets/common/bms_empty_state.dart';
import '../widgets/common/bms_shimmer.dart';

// Lightweight model matching GET /user/booking/get-bookings response
class _Booking {
  final String id;
  final String turfName;
  final String turfLocation;
  final DateTime startTime;
  final DateTime endTime;
  final double totalPrice;
  final String? qrCode;

  _Booking({
    required this.id,
    required this.turfName,
    required this.turfLocation,
    required this.startTime,
    required this.endTime,
    required this.totalPrice,
    this.qrCode,
  });

  factory _Booking.fromJson(Map<String, dynamic> json) {
    final ts = json['timeSlot'] as Map<String, dynamic>? ?? {};
    final turf = json['turf'] as Map<String, dynamic>? ?? {};
    final rawPrice = json['totalPrice'];
    final price = rawPrice == null
        ? 0.0
        : rawPrice is num
            ? rawPrice.toDouble()
            : double.tryParse(rawPrice.toString()) ?? 0.0;
    return _Booking(
      id: (json['id'] ?? json['_id'])?.toString() ?? '',
      turfName: turf['name']?.toString() ?? 'Ground',
      turfLocation: turf['location']?.toString() ?? '',
      startTime: ts['startTime'] != null
          ? DateTime.parse(ts['startTime']).toLocal()
          : DateTime.now(),
      endTime: ts['endTime'] != null
          ? DateTime.parse(ts['endTime']).toLocal()
          : DateTime.now(),
      totalPrice: price,
      qrCode: json['qrCode']?.toString(),
    );
  }

  String get formattedTime {
    String fmt(DateTime d) {
      final h = d.hour > 12 ? d.hour - 12 : (d.hour == 0 ? 12 : d.hour);
      final m = d.minute.toString().padLeft(2, '0');
      final p = d.hour >= 12 ? 'PM' : 'AM';
      return '$h:$m $p';
    }

    return '${fmt(startTime)} – ${fmt(endTime)}';
  }

  String get formattedDate {
    const months = [
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
      'Dec',
    ];
    return '${months[startTime.month - 1]} ${startTime.day}, ${startTime.year}';
  }

  bool get _isToday {
    final now = DateTime.now();
    return startTime.year == now.year &&
        startTime.month == now.month &&
        startTime.day == now.day;
  }

  bool get isUpcoming => !_isToday && startTime.isAfter(DateTime.now());
  bool get isToday => _isToday;
  bool get isPast => endTime.isBefore(DateTime.now());
}

class BookingsHome extends StatefulWidget {
  const BookingsHome({super.key});

  @override
  State<BookingsHome> createState() => _BookingsHomeState();
}

class _BookingsHomeState extends State<BookingsHome>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final _service = BookingService();

  bool _loading = true;
  String? _error;
  List<_Booking> _today = [];
  List<_Booking> _upcoming = [];
  List<_Booking> _past = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadBookings();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadBookings() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final raw = await _service.getBookings();
      final bookings = raw.map(_Booking.fromJson).toList();
      setState(() {
        _today = bookings.where((b) => b.isToday).toList();
        _upcoming = bookings.where((b) => b.isUpcoming).toList();
        _past = bookings.where((b) => b.isPast).toList();
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load bookings';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft),
          onPressed: () => context.go('/dashboard'),
        ),
        title: Text(
          'Bookings',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
        ),
        centerTitle: true,
        backgroundColor: Colors.black,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refreshCw),
            onPressed: _loadBookings,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.accentTeal,
          labelStyle:
              GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w500),
          tabs: const [
            Tab(text: 'Today'),
            Tab(text: 'Upcoming'),
            Tab(text: 'Past'),
          ],
        ),
      ),
      body: Stack(
        children: [
          // Background watermark — sits behind everything, doesn't clip cards
          Positioned(
            left: 24,
            right: 0,
            bottom: 24,
            child: IgnorePointer(
              child: Text(
                'GAME ON\nALWAYS.',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.06),
                  fontSize: 52,
                  fontWeight: FontWeight.bold,
                  height: 0.9,
                ),
              ),
            ),
          ),
          // Foreground content
          _loading
              ? const BmsListSkeleton(
                  itemCount: 5,
                  cardHeight: 110,
                  padding: EdgeInsets.fromLTRB(12, 16, 12, 12),
                )
              : _error != null
                  ? BmsEmptyState.error(
                      title: 'Couldn\'t load bookings',
                      subtitle: _error,
                      onAction: _loadBookings,
                    )
                  : TabBarView(
                      controller: _tabController,
                      children: [
                        _BookingList(bookings: _today),
                        _BookingList(bookings: _upcoming),
                        _BookingList(bookings: _past, isPastTab: true),
                      ],
                    ),
        ],
      ),
    );
  }
}

class _BookingList extends StatelessWidget {
  final List<_Booking> bookings;
  final bool isPastTab;

  const _BookingList({required this.bookings, this.isPastTab = false});

  @override
  Widget build(BuildContext context) {
    if (bookings.isEmpty) {
      return BmsEmptyState(
        icon: Icons.sports_soccer_outlined,
        title: 'No bookings here',
        subtitle: isPastTab
            ? 'Your past matches will appear here once you play one.'
            : 'Book a ground and your next match shows up right here.',
      );
    }

    return RefreshIndicator(
      color: AppColors.accentTeal,
      backgroundColor: Colors.black,
      onRefresh: () async {},
      child: ListView.builder(
        // top: breathing room below the tab bar
        // bottom: scrollable space so the last card clears the watermark
        padding: const EdgeInsets.fromLTRB(12, 16, 12, 180),
        itemCount: bookings.length,
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _BookingCard(booking: bookings[index], isPast: isPastTab),
          );
        },
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  final _Booking booking;
  final bool isPast;

  const _BookingCard({required this.booking, this.isPast = false});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surfaceL1,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) =>
                _BookingDetailScreen(booking: booking, isPast: isPast),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      booking.turfName,
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      booking.turfLocation,
                      style:
                          const TextStyle(color: Colors.white54, fontSize: 12),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      booking.formattedTime,
                      style:
                          const TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '₹ ${booking.totalPrice.toStringAsFixed(0)}',
                      style: const TextStyle(
                        color: AppColors.accentTeal,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton(
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => _BookingDetailScreen(
                              booking: booking, isPast: isPast),
                        ),
                      ),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        side: BorderSide(
                            color: Colors.white.withValues(alpha: 0.12)),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(6)),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text('View Details',
                          style:
                              TextStyle(fontSize: 12, color: Colors.white70)),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: AppColors.accentTeal.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.sports_soccer,
                    color: AppColors.accentTeal, size: 28),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BookingDetailScreen extends StatefulWidget {
  final _Booking booking;
  final bool isPast;

  const _BookingDetailScreen({required this.booking, this.isPast = false});

  @override
  State<_BookingDetailScreen> createState() => _BookingDetailScreenState();
}

class _BookingDetailScreenState extends State<_BookingDetailScreen> {
  bool _cancelling = false;
  bool _loadingInvoice = false;

  _Booking get booking => widget.booking;
  bool get isPast => widget.isPast;

  void _showSnack(BuildContext context, String msg) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));

  Future<bool?> _confirm(BuildContext context, String title, String body) =>
      showDialog<bool>(
        context: context,
        builder: (c) => AlertDialog(
          backgroundColor: Colors.grey[900],
          title: Text(title),
          content: Text(body),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(c, false),
                child: const Text('No')),
            TextButton(
                onPressed: () => Navigator.pop(c, true),
                child: const Text('Yes')),
          ],
        ),
      );

  Future<void> _cancelBooking() async {
    final ok = await _confirm(context, 'Cancel booking',
        'Are you sure you want to cancel this booking?');
    if (ok != true || !mounted) return;
    setState(() => _cancelling = true);
    final success = await BookingService().cancelBooking(booking.id);
    if (!mounted) return;
    setState(() => _cancelling = false);
    if (success) {
      _showSnack(context, 'Booking cancelled successfully');
      context.pop();
    } else {
      _showSnack(context, 'Could not cancel — please try again');
    }
  }

  Future<void> _downloadInvoice() async {
    setState(() => _loadingInvoice = true);
    final url = await BookingService().getInvoiceUrl(booking.id);
    if (!mounted) return;
    setState(() => _loadingInvoice = false);
    if (url != null && url.isNotEmpty) {
      final uri = Uri.tryParse(url);
      if (uri != null) {
        _showSnack(context, 'Opening invoice…');
      }
    } else {
      _showSnack(context, 'Invoice not available yet');
    }
  }

  Widget _row(BuildContext context, IconData icon, String text) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.tealAccent.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: Colors.tealAccent, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(text,
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.w500)),
            ),
          ],
        ),
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('Booking Details'),
        backgroundColor: Colors.black,
        elevation: 0,
        leading: const BackButton(color: Colors.white),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 12),
              Text(booking.turfName,
                  style: GoogleFonts.poppins(
                      fontWeight: FontWeight.bold,
                      fontSize: 20,
                      color: Colors.white)),
              const SizedBox(height: 4),
              Text(booking.turfLocation,
                  style: const TextStyle(color: Colors.white54, fontSize: 14)),
              const SizedBox(height: 20),
              _row(context, LucideIcons.calendar,
                  '${booking.formattedDate} · ${booking.formattedTime}'),
              _row(context, LucideIcons.dollarSign,
                  '₹ ${booking.totalPrice.toStringAsFixed(0)}'),
              if (booking.qrCode != null && booking.qrCode!.isNotEmpty)
                _row(context, LucideIcons.qrCode,
                    'QR: ${booking.qrCode!.substring(0, 12)}…'),
              const Spacer(),
              if (!isPast) ...[
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _loadingInvoice ? null : _downloadInvoice,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.grey[850],
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8)),
                    ),
                    child: _loadingInvoice
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2))
                        : const Text('DOWNLOAD INVOICE',
                            style: TextStyle(
                                letterSpacing: 1.2, color: Colors.white)),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: _cancelling ? null : _cancelBooking,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8)),
                      side: BorderSide(
                          color: Colors.white.withValues(alpha: 0.12)),
                    ),
                    child: _cancelling
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2))
                        : const Text('CANCEL BOOKING',
                            style: TextStyle(
                                letterSpacing: 1.2, color: Colors.white)),
                  ),
                ),
              ] else ...[
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _loadingInvoice ? null : _downloadInvoice,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.grey[850],
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8)),
                    ),
                    child: _loadingInvoice
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2))
                        : const Text('DOWNLOAD INVOICE',
                            style: TextStyle(
                                letterSpacing: 1.2, color: Colors.white)),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      final result = await context.push('/write-review',
                          extra: {'groundName': booking.turfName});
                      if (result != null && context.mounted) {
                        final r = result as Map;
                        _showSnack(
                            context, 'Review submitted: ${r['rating']} stars');
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.grey[850],
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text('WRITE REVIEW',
                        style:
                            TextStyle(letterSpacing: 1.2, color: Colors.white)),
                  ),
                ),
              ],
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
