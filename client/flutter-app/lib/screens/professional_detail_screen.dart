import '../core/constants/app_colors.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../services/professionals_service.dart';

class ProfessionalDetailScreen extends StatefulWidget {
  /// Optional id passed via router extras. When provided we fetch the live
  /// professional record from `/professional/details/:id` and overwrite the
  /// static placeholder name / rating / review count / image.
  final String? professionalId;
  const ProfessionalDetailScreen({Key? key, this.professionalId})
      : super(key: key);

  @override
  State<ProfessionalDetailScreen> createState() =>
      _ProfessionalDetailScreenState();
}

class _ProfessionalDetailScreenState extends State<ProfessionalDetailScreen> {
  Professional? _pro;

  String get _displayName {
    final n = _pro?.name.trim();
    if (n != null && n.isNotEmpty) return n;
    final role = _pro?.profession.trim();
    if (role != null && role.isNotEmpty) return role;
    return 'Loading…';
  }

  String get _displayRating => (_pro?.rating ?? 4.5).toStringAsFixed(1);
  String get _displayReviews =>
      _pro?.reviews.isNotEmpty == true ? _pro!.reviews : '30';
  String? get _displayImage =>
      (_pro?.imageUrl.isNotEmpty == true) ? _pro!.imageUrl : null;
  String get _displaySpecialization => _pro?.specialization.isNotEmpty == true
      ? _pro!.specialization
      : 'Professional';

  @override
  void initState() {
    super.initState();
    _loadLive();
  }

  Future<void> _loadLive() async {
    final id = widget.professionalId;
    if (id == null || id.isEmpty) return;
    final p = await ProfessionalsService().fetchProfessionalDetails(id);
    if (mounted && p != null) setState(() => _pro = p);
  }

  @override
  Widget build(BuildContext context) {
    final image = _displayImage;
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Image Carousel
                Stack(
                  children: [
                    Container(
                      height: 400,
                      width: double.infinity,
                      color: AppColors.surfaceL3,
                      child: image != null
                          ? CachedNetworkImage(
                              imageUrl: image,
                              fit: BoxFit.cover,
                              errorWidget: (_, __, ___) => _placeholderImage(),
                            )
                          : _placeholderImage(),
                    ),
                    // Gradient overlay
                    Container(
                      height: 400,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.black.withValues(alpha: 0.3),
                            Colors.black.withValues(alpha: 0.7),
                          ],
                        ),
                      ),
                    ),
                    // Back button
                    Positioned(
                      top: 40,
                      left: 16,
                      child: IconButton(
                        icon: const Icon(LucideIcons.arrowLeft,
                            color: Colors.white),
                        onPressed: () => context.pop(),
                      ),
                    ),
                    // Carousel dots
                    Positioned(
                      bottom: 16,
                      left: 0,
                      right: 0,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          5,
                          (index) => Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: index == 0
                                  ? Colors.white
                                  : Colors.white.withValues(alpha: 0.5),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                // Content
                Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Coach Name and Rating
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              _displayName,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          Row(
                            children: [
                              Image.asset(
                                'assets/icons/professional_info_star.png',
                                width: 18,
                                height: 18,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                _displayRating,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Text(
                                'Star',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),

                      const SizedBox(height: 8),

                      // Location and Reviews
                      Row(
                        children: [
                          Text(
                            _displaySpecialization,
                            style: TextStyle(
                              color: Colors.grey[400],
                              fontSize: 14,
                            ),
                          ),
                          const Spacer(),
                          Text(
                            '($_displayReviews Reviews)',
                            style: TextStyle(
                              color: Colors.grey[400],
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // Show in Map Button
                      OutlinedButton.icon(
                        onPressed: () {},
                        icon: Image.asset(
                          'assets/icons/professional_info_location.png',
                          width: 16,
                          height: 16,
                        ),
                        label: const Text(
                          'Show In Map',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: AppColors.primary),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(6),
                          ),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 10),
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Coaching Expertise
                      const Text(
                        'Coaching Expertise',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                      const SizedBox(height: 12),

                      const Row(
                        children: [
                          Text(
                            'Cricket',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                            ),
                          ),
                          SizedBox(width: 16),
                          Text(
                            '|',
                            style: TextStyle(
                              color: Colors.grey,
                              fontSize: 14,
                            ),
                          ),
                          SizedBox(width: 16),
                          Text(
                            'Badminton',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                            ),
                          ),
                          SizedBox(width: 16),
                          Text(
                            '|',
                            style: TextStyle(
                              color: Colors.grey,
                              fontSize: 14,
                            ),
                          ),
                          SizedBox(width: 16),
                          Text(
                            'Pickel Ball',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 24),

                      // Qualifications
                      const Text(
                        'Qualifications',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                      const SizedBox(height: 12),

                      const Row(
                        children: [
                          Text(
                            'WIFI',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                            ),
                          ),
                          SizedBox(width: 16),
                          Text(
                            '|',
                            style: TextStyle(
                              color: Colors.grey,
                              fontSize: 14,
                            ),
                          ),
                          SizedBox(width: 16),
                          Text(
                            'Washroom',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                            ),
                          ),
                          SizedBox(width: 16),
                          Text(
                            '|',
                            style: TextStyle(
                              color: Colors.grey,
                              fontSize: 14,
                            ),
                          ),
                          SizedBox(width: 16),
                          Text(
                            'Parking',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 24),

                      // About Venue
                      const Text(
                        'About Venue',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                      const SizedBox(height: 12),

                      Text(
                        'Nestled in the heart of Aziz Nagar, Horizon Cricket Arena is a premier sports venue designed for both professional and recreational matches. The ground features lush green turf, a well-maintained 70-yard boundary, and top-grade pitch conditions ideal for T20 and one-day formats. Equipped with floodlights for night games, separate practice nets, digital scoreboards, and comfortable spectator seating, it ensures a complete match-day experience. Players have access to clean changing rooms, refreshments, and parking facilities. Whether its league tournaments, coaching camps, or friendly matches, Horizon Cricket Arena delivers world-class amenities and a vibrant cricketing atmosphere.',
                        style: TextStyle(
                          color: Colors.grey[400],
                          fontSize: 14,
                          height: 1.5,
                        ),
                      ),

                      const SizedBox(height: 100),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Bottom Book Button
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black,
                border: Border(
                  top: BorderSide(color: Colors.grey[900]!),
                ),
              ),
              child: Container(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.gradientStart, AppColors.gradientEnd],
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: ElevatedButton(
                  onPressed: () {
                    // The dedicated /professional/booking flow doesn't
                    // exist yet — until then the Book button hands off
                    // straight to /professional/payment with the pro's
                    // hourly rate, leaving date/time blank for the
                    // payment screen's pickers to surface.
                    context.push('/professional/payment', extra: {
                      'amount': (_pro?.hourlyRate ?? 0).toDouble(),
                      'date': '',
                      'timeSlot': '',
                      'professionalName': _displayName,
                    });
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text(
                    'BOOK SESSION',
                    style: TextStyle(
                      color: Colors.black,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _placeholderImage() => Container(
        color: AppColors.surfaceL3,
        child: const Center(
          child: Icon(LucideIcons.user, color: Colors.white24, size: 80),
        ),
      );
}
