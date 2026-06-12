import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/constants/app_colors.dart';
import '../models/turf_model.dart';
import '../services/review_service.dart';
import '../services/turf_service.dart';
import '../widgets/common/bms_toast.dart';
import '../widgets/common/primary_gradient_button.dart';
import 'ground_booking_date_screen.dart';

class GroundDetailScreen extends StatefulWidget {
  final String turfId;
  final String groundName;
  final String location;
  final String distance;
  final double rating;
  final int reviewCount;
  final List<String> images;
  final double pricePerHour;

  const GroundDetailScreen({
    super.key,
    this.turfId = '',
    required this.groundName,
    required this.location,
    this.distance = '',
    required this.rating,
    required this.reviewCount,
    this.images = const [],
    this.pricePerHour = 0,
  });

  @override
  State<GroundDetailScreen> createState() => _GroundDetailScreenState();
}

class _GroundDetailScreenState extends State<GroundDetailScreen> {
  final TurfService _turfService = TurfService();
  final ReviewService _reviewService = ReviewService();
  int _currentImageIndex = 0;
  bool _isLoading = false;
  bool _isFavorite = false;
  TurfModel? _turf;
  List<Map<String, dynamic>> _reviews = const [];
  bool _reviewsLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.turfId.isNotEmpty) {
      _loadTurf();
      _loadReviews();
    }
  }

  Future<void> _loadTurf() async {
    setState(() => _isLoading = true);
    final turf = await _turfService.getTurfDetails(widget.turfId);
    if (mounted) {
      setState(() {
        _turf = turf;
        _isLoading = false;
      });
    }
    if (widget.turfId.isNotEmpty) {
      _turfService.trackInteraction(widget.turfId, 'view');
    }
  }

  Future<void> _loadReviews() async {
    setState(() => _reviewsLoading = true);
    final reviews = await _reviewService.listForTurf(widget.turfId);
    if (mounted) {
      setState(() {
        _reviews = reviews;
        _reviewsLoading = false;
      });
    }
  }

  Future<void> _openWriteReviewSheet() async {
    final submitted = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: AppColors.surfaceL1,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _WriteReviewSheet(turfId: widget.turfId),
    );
    if (submitted == true) {
      BmsToast.success(context, 'Review submitted');
      _loadTurf();
      _loadReviews();
    }
  }

  Future<void> _toggleFavorite() async {
    setState(() => _isFavorite = !_isFavorite);
    if (widget.turfId.isNotEmpty) {
      await _turfService.likeTurf(widget.turfId);
    }
  }

  Future<void> _shareTurf() async {
    if (widget.turfId.isNotEmpty) {
      await _turfService.shareTurf(widget.turfId);
    }
  }

  List<String> get _displayImages {
    if (_turf != null) {
      final all = <String>[];
      if (_turf!.image.isNotEmpty) all.add(_turf!.image);
      for (final img in _turf!.images) {
        if (img.isNotEmpty && !all.contains(img)) all.add(img);
      }
      if (all.isNotEmpty) return all;
    }
    if (widget.images.isNotEmpty) return widget.images;
    return ['assets/images/home/ground.jpg'];
  }

  bool get _isNetworkImage =>
      _turf != null && _displayImages[0].startsWith('http');

  String get _displayName => _turf?.name ?? widget.groundName;
  String get _displayLocation => _turf?.location ?? widget.location;
  double get _displayRating => _turf?.avgRating ?? widget.rating;
  double get _displayPrice => _turf?.pricePerHour ?? widget.pricePerHour;

  Future<void> _openMap() async {
    Uri uri;
    if (_turf?.mapUrl != null && _turf!.mapUrl!.isNotEmpty) {
      uri = Uri.parse(_turf!.mapUrl!);
    } else if (_turf?.latitude != null && _turf?.longitude != null) {
      uri = Uri.parse(
          'https://maps.google.com/maps?q=${_turf!.latitude},${_turf!.longitude}');
    } else {
      final q = Uri.encodeComponent(_displayLocation);
      uri = Uri.parse('https://maps.google.com/maps?q=$q');
    }
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _callPhone(String phone) async {
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    final images = _displayImages;
    final isNetwork = _isNetworkImage;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Column(
        children: [
          // â”€â”€ Image carousel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          Stack(
            children: [
              Container(
                height: 360,
                width: double.infinity,
                color: AppColors.surfaceL3,
                child: isNetwork
                    ? CachedNetworkImage(
                        imageUrl: images[_currentImageIndex],
                        fit: BoxFit.cover,
                        placeholder: (_, __) => const Center(
                          child: CircularProgressIndicator(
                              color: AppColors.primary),
                        ),
                        errorWidget: (_, __, ___) => const Center(
                          child: Icon(LucideIcons.imageOff,
                              color: Colors.white38, size: 48),
                        ),
                      )
                    : Image.asset(
                        images[_currentImageIndex],
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const SizedBox(),
                      ),
              ),
              // gradient overlay
              Container(
                height: 360,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withValues(alpha: 0.25),
                      Colors.black.withValues(alpha: 0.75),
                    ],
                  ),
                ),
              ),
              // top bar
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _iconButton(LucideIcons.chevronLeft, () => context.pop()),
                      Row(
                        children: [
                          _iconButton(
                            _isFavorite ? LucideIcons.heart : LucideIcons.heart,
                            _toggleFavorite,
                            color:
                                _isFavorite ? Colors.redAccent : Colors.white,
                          ),
                          const SizedBox(width: 8),
                          _iconButton(LucideIcons.share2, _shareTurf),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              // carousel dots
              Positioned(
                bottom: 16,
                left: 0,
                right: 0,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                      images.length,
                      (i) => Container(
                            width: i == _currentImageIndex ? 24 : 8,
                            height: 8,
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            decoration: BoxDecoration(
                              color: i == _currentImageIndex
                                  ? Colors.white
                                  : Colors.white.withValues(alpha: 0.4),
                              borderRadius: BorderRadius.circular(4),
                            ),
                          )),
                ),
              ),
              // swipe detector
              if (images.length > 1)
                Positioned.fill(
                  child: GestureDetector(
                    behavior: HitTestBehavior.translucent,
                    onHorizontalDragEnd: (details) {
                      if (details.primaryVelocity == null) return;
                      if (details.primaryVelocity! < -200 &&
                          _currentImageIndex < images.length - 1) {
                        setState(() => _currentImageIndex++);
                      } else if (details.primaryVelocity! > 200 &&
                          _currentImageIndex > 0) {
                        setState(() => _currentImageIndex--);
                      }
                    },
                    child: const SizedBox(),
                  ),
                ),
            ],
          ),

          // â”€â”€ Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Name + rating
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    _displayName,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 22,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                                if (_turf?.status == 'approved') ...[
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary
                                          .withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                          color: AppColors.primary
                                              .withValues(alpha: 0.5)),
                                    ),
                                    child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(LucideIcons.badgeCheck,
                                            color: AppColors.primary, size: 12),
                                        SizedBox(width: 4),
                                        Text('Verified',
                                            style: TextStyle(
                                                color: AppColors.primary,
                                                fontSize: 10,
                                                fontWeight: FontWeight.w600)),
                                      ],
                                    ),
                                  ),
                                ],
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _displayLocation,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.6),
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Row(
                            children: [
                              const Icon(LucideIcons.star,
                                  color: AppColors.accentYellow, size: 18),
                              const SizedBox(width: 4),
                              ShaderMask(
                                shaderCallback: (b) => const LinearGradient(
                                  colors: [
                                    AppColors.gradientStart,
                                    AppColors.gradientEnd
                                  ],
                                ).createShader(b),
                                child: Text(
                                  _displayRating > 0
                                      ? _displayRating.toStringAsFixed(1)
                                      : '—',
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Builder(builder: (_) {
                            final count =
                                _turf?.reviewCount ?? widget.reviewCount;
                            return Text(
                              count > 0 ? '($count reviews)' : 'No reviews yet',
                              style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.45),
                                  fontSize: 11),
                            );
                          }),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Quick info row: map, hours, price
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _infoChipButton(
                        icon: Image.asset('assets/icons/google_maps.png',
                            width: 16, height: 16),
                        label: 'Show In Map',
                        onTap: _openMap,
                      ),
                      if (_turf != null &&
                          _turf!.openTime.isNotEmpty &&
                          _turf!.closeTime.isNotEmpty)
                        _infoChip(
                          icon: const Icon(LucideIcons.clock,
                              color: Colors.white70, size: 14),
                          label: '${_turf!.openTime} – ${_turf!.closeTime}',
                        ),
                      if (_displayPrice > 0)
                        _infoChip(
                          icon: const Icon(LucideIcons.indianRupee,
                              color: AppColors.primary, size: 14),
                          label: '${_displayPrice.toStringAsFixed(0)} onwards',
                        ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Loading indicator (overlay while fetching)
                  if (_isLoading)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.symmetric(vertical: 16),
                        child: CircularProgressIndicator(
                            color: AppColors.primary, strokeWidth: 2),
                      ),
                    ),

                  // Sports available
                  if ((_turf?.sportTypes ?? []).isNotEmpty ||
                      widget.groundName.isNotEmpty) ...[
                    _sectionLabel('Sports Available'),
                    const SizedBox(height: 10),
                    _buildItemsBar(
                        _turf?.sportTypes ?? ['Cricket', 'Badminton']),
                    const SizedBox(height: 20),
                  ],

                  // Amenities
                  if ((_turf?.facilities ?? []).isNotEmpty) ...[
                    _sectionLabel('Amenities'),
                    const SizedBox(height: 10),
                    _buildItemsBar(_turf!.facilities),
                    const SizedBox(height: 20),
                  ],

                  // Ground types
                  if ((_turf?.groundTypes ?? []).isNotEmpty) ...[
                    _sectionLabel('Ground Types'),
                    const SizedBox(height: 10),
                    _buildItemsBar(_turf!.groundTypes),
                    const SizedBox(height: 20),
                  ],

                  // About
                  _sectionLabel('About Venue'),
                  const SizedBox(height: 10),
                  Text(
                    _turf?.description.isNotEmpty == true
                        ? _turf!.description
                        : 'No description available.',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.65),
                      fontSize: 13,
                      height: 1.6,
                    ),
                  ),

                  // Reviews
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _sectionLabel('Reviews (${_reviews.length})'),
                      TextButton.icon(
                        onPressed: _openWriteReviewSheet,
                        icon: const Icon(LucideIcons.pencil,
                            color: AppColors.primary, size: 14),
                        label: const Text('Write a review',
                            style: TextStyle(color: AppColors.primary)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  if (_reviewsLoading)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 16),
                      child: Center(
                          child: CircularProgressIndicator(
                              color: AppColors.primary)),
                    )
                  else if (_reviews.isEmpty)
                    Text(
                      'Be the first to review this venue.',
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.5),
                          fontSize: 12),
                    )
                  else
                    ..._reviews.take(5).map((r) => _reviewTile(r)),

                  // Manager contacts
                  if ((_turf?.managerContacts ?? []).isNotEmpty) ...[
                    const SizedBox(height: 20),
                    _sectionLabel('Manager Contacts'),
                    const SizedBox(height: 12),
                    ...(_turf!.managerContacts.map((m) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 12),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceL3,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              children: [
                                const Icon(LucideIcons.user,
                                    color: Colors.white54, size: 18),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      if (m.name != null && m.name!.isNotEmpty)
                                        Text(m.name!,
                                            style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 13,
                                                fontWeight: FontWeight.w500)),
                                      if (m.phone != null &&
                                          m.phone!.isNotEmpty)
                                        Text(m.phone!,
                                            style: TextStyle(
                                                color: Colors.white
                                                    .withValues(alpha: 0.5),
                                                fontSize: 12)),
                                    ],
                                  ),
                                ),
                                if (m.phone != null && m.phone!.isNotEmpty)
                                  GestureDetector(
                                    onTap: () => _callPhone(m.phone!),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 12, vertical: 6),
                                      decoration: BoxDecoration(
                                        gradient: const LinearGradient(
                                          colors: [
                                            AppColors.gradientStart,
                                            AppColors.gradientEnd
                                          ],
                                        ),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(LucideIcons.phone,
                                              color: Colors.black, size: 14),
                                          SizedBox(width: 4),
                                          Text('Call',
                                              style: TextStyle(
                                                  color: Colors.black,
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w600)),
                                        ],
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ))),
                  ],

                  // Cancellation policy
                  if (_turf?.policies != null &&
                      _turf!.policies!.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    _sectionLabel('Cancellation Policy'),
                    const SizedBox(height: 10),
                    Text(
                      _turf!.policies!,
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.55),
                          fontSize: 12,
                          height: 1.6),
                    ),
                  ],

                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.black,
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.4),
                blurRadius: 20,
                offset: const Offset(0, -5)),
          ],
        ),
        child: SafeArea(
          child: Row(
            children: [
              if (_displayPrice > 0) ...[
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('onwards',
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.5),
                            fontSize: 11)),
                    Text(
                      '₹${_displayPrice.toStringAsFixed(0)}',
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
                const SizedBox(width: 16),
              ],
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    HapticFeedback.mediumImpact();
                    Navigator.push(
                      context,
                      PageRouteBuilder(
                        opaque: false,
                        barrierColor: Colors.transparent,
                        pageBuilder: (_, __, ___) => GroundBookingDateScreen(
                          turfId: widget.turfId,
                          groundName: _displayName,
                          turfImageUrl: _turf?.image ?? '',
                          pricePerHour: _displayPrice,
                        ),
                        transitionsBuilder: (_, anim, __, child) =>
                            SlideTransition(
                          position: Tween<Offset>(
                            begin: const Offset(0, 1),
                            end: Offset.zero,
                          ).animate(CurvedAnimation(
                              parent: anim, curve: Curves.easeOutCubic)),
                          child: child,
                        ),
                      ),
                    );
                  },
                  child: Container(
                    height: 56,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                        colors: [
                          AppColors.gradientStart,
                          AppColors.gradientEnd
                        ],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Center(
                      child: Text(
                        'BOOK GROUND',
                        style: TextStyle(
                            color: Colors.black,
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.5),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _iconButton(IconData icon, VoidCallback onTap,
      {Color color = Colors.white}) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: color, size: 18),
      ),
    );
  }

  Widget _infoChipButton(
      {required Widget icon,
      required String label,
      required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            icon,
            const SizedBox(width: 6),
            Text(label,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }

  Widget _infoChip({required Widget icon, required String label}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          icon,
          const SizedBox(width: 6),
          Text(label,
              style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.8), fontSize: 12)),
        ],
      ),
    );
  }

  Widget _sectionLabel(String label) {
    return Text(
      label,
      style: const TextStyle(
          color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600),
    );
  }

  Widget _buildItemsBar(List<String> items) {
    if (items.isEmpty) return const SizedBox();
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: items
          .map((item) => Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.surfaceL4,
                  borderRadius: BorderRadius.circular(20),
                  border:
                      Border.all(color: Colors.white.withValues(alpha: 0.1)),
                ),
                child: Text(item,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w500)),
              ))
          .toList(),
    );
  }

  Widget _reviewTile(Map<String, dynamic> r) {
    final name = r['userName']?.toString() ??
        (r['user'] as Map?)?['name']?.toString() ??
        'Player';
    final rating = (r['rating'] is num) ? (r['rating'] as num).toInt() : 0;
    final comment = r['review']?.toString() ?? r['comment']?.toString() ?? '';
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceL1,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.borderSoft),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(name,
                  style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 13)),
              const Spacer(),
              for (var i = 0; i < 5; i++)
                Icon(LucideIcons.star,
                    size: 12,
                    color:
                        i < rating ? AppColors.accentYellow : Colors.white24),
            ],
          ),
          if (comment.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(comment,
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.7),
                    fontSize: 12,
                    height: 1.4)),
          ],
        ],
      ),
    );
  }
}

/// Bottom-sheet form for submitting a new review on the open turf.
class _WriteReviewSheet extends StatefulWidget {
  final String turfId;
  const _WriteReviewSheet({required this.turfId});

  @override
  State<_WriteReviewSheet> createState() => _WriteReviewSheetState();
}

class _WriteReviewSheetState extends State<_WriteReviewSheet> {
  final _commentCtrl = TextEditingController();
  int _rating = 0;
  bool _submitting = false;

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_rating == 0) {
      BmsToast.error(context, 'Pick a star rating');
      return;
    }
    setState(() => _submitting = true);
    final ok = await ReviewService().submit(
      turfId: widget.turfId,
      rating: _rating,
      comment: _commentCtrl.text.trim(),
    );
    if (!mounted) return;
    setState(() => _submitting = false);
    if (ok) {
      Navigator.of(context).pop(true);
    } else {
      BmsToast.error(context, 'Failed to submit — try again');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Write a review',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          Row(
            children: List.generate(
                5,
                (i) => IconButton(
                      onPressed: () => setState(() => _rating = i + 1),
                      icon: Icon(LucideIcons.star,
                          size: 28,
                          color: i < _rating
                              ? AppColors.accentYellow
                              : Colors.white24),
                    )),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: AppColors.surfaceL2,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.borderSoft),
            ),
            child: TextField(
              controller: _commentCtrl,
              maxLines: 4,
              minLines: 4,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                border: InputBorder.none,
                contentPadding: EdgeInsets.all(14),
                hintText: 'Share your experience…',
                hintStyle: TextStyle(color: Colors.white30),
              ),
            ),
          ),
          const SizedBox(height: 16),
          PrimaryGradientButton(
            label: 'POST REVIEW',
            isLoading: _submitting,
            onPressed: _submitting ? null : _submit,
            height: 52,
          ),
        ],
      ),
    );
  }
}
