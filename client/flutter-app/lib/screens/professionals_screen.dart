import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../core/constants/app_colors.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../services/professionals_service.dart';
import '../widgets/common/bms_empty_state.dart';
import '../widgets/common/bms_shimmer.dart';
import '../widgets/common/bms_toast.dart';
import 'new_home_dashboard.dart' show HomeHeader;
import 'pros_filter_sheets.dart';

class ProfessionalsScreen extends ConsumerStatefulWidget {
  const ProfessionalsScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<ProfessionalsScreen> createState() =>
      _ProfessionalsScreenState();
}

class _ProfessionalsScreenState extends ConsumerState<ProfessionalsScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ProfessionalsService _service = ProfessionalsService();
  String _query = '';
  String? _selectedProfession; // null = All
  bool _isLoading = false;

  // Filter state — applied client-side to the visible list.
  DateTime? _filterDate;
  Set<String> _filterExperience = {};
  Set<String> _filterRating = {};
  double _filterDistanceKm = 20; // 20 = any

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
    _loadFromBackend();
  }

  Future<void> _loadFromBackend() async {
    if (_service.hasLoadedRemote) return;
    setState(() => _isLoading = true);
    final ok = await _service.fetchAll();
    if (!mounted) return;
    setState(() => _isLoading = false);
    if (!ok && _service.lastFetchError != null) {
      BmsToast.error(
        context,
        'Professionals (showing offline list): ${_service.lastFetchError}',
      );
    }
  }

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    final q = _searchController.text.trim().toLowerCase();
    if (q == _query) return;
    setState(() => _query = q);
  }

  List<Professional> get _visible {
    var base = _query.isEmpty
        ? _service.getAllProfessionals()
        : _service.searchProfessionals(_query);
    if (_selectedProfession != null) {
      base = base
          .where((p) => p.profession
              .toLowerCase()
              .contains(_selectedProfession!.toLowerCase()))
          .toList();
    }
    if (_filterExperience.isNotEmpty) {
      base = base.where((p) {
        final years = p.experience;
        return _filterExperience.any((bucket) => switch (bucket) {
              '0-1 Year' => years <= 1,
              '2-4 Year' => years >= 2 && years <= 4,
              '5-7 Year' => years >= 5 && years <= 7,
              '8+ Year' => years >= 8,
              _ => true,
            });
      }).toList();
    }
    if (_filterRating.isNotEmpty) {
      base = base.where((p) {
        final r = p.rating;
        return _filterRating.any((bucket) => switch (bucket) {
              '4.5★ and above' => r >= 4.5,
              '4.0★ – 4.5★' => r >= 4.0 && r < 4.5,
              '3.5★ – 4.0★' => r >= 3.5 && r < 4.0,
              '3.0★ – 3.5★' => r >= 3.0 && r < 3.5,
              _ => true,
            });
      }).toList();
    }
    return base;
  }

  Future<void> _openDateFilter() async {
    final picked = await showDateFilterSheet(context, _filterDate);
    if (picked != null) setState(() => _filterDate = picked);
  }

  Future<void> _openExperienceFilter() async {
    final picked = await showExperienceSheet(context, _filterExperience);
    if (picked != null) setState(() => _filterExperience = picked);
  }

  Future<void> _openRatingFilter() async {
    final picked = await showRatingSheet(context, _filterRating);
    if (picked != null) setState(() => _filterRating = picked);
  }

  Future<void> _openDistanceFilter() async {
    final picked = await showDistanceSheet(context, _filterDistanceKm);
    if (picked != null) setState(() => _filterDistanceKm = picked);
  }

  String? get _dateLabel =>
      _filterDate == null ? null : DateFormat('d MMM').format(_filterDate!);
  String? get _distLabel => _filterDistanceKm >= 20
      ? null
      : '${_filterDistanceKm.toStringAsFixed(0)}km';

  @override
  Widget build(BuildContext context) {
    final visible = _visible;
    return Scaffold(
      backgroundColor: Colors.black,
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const HomeHeader(),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // â”€â”€ Search Bar (pill) â”€â”€
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: Colors.grey[900],
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Row(
                      children: [
                        const Icon(LucideIcons.search,
                            color: Colors.white54, size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextField(
                            controller: _searchController,
                            style: const TextStyle(color: Colors.white),
                            textInputAction: TextInputAction.search,
                            decoration: const InputDecoration(
                              hintText: 'Search for any profession',
                              hintStyle: TextStyle(
                                  color: Colors.white54, fontSize: 13),
                              border: InputBorder.none,
                              contentPadding:
                                  EdgeInsets.symmetric(vertical: 14),
                            ),
                          ),
                        ),
                        if (_query.isNotEmpty)
                          GestureDetector(
                            onTap: () => _searchController.clear(),
                            child: const Icon(LucideIcons.x,
                                color: Colors.white54, size: 18),
                          ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 12),

                  // ── Filter pills (Date / Experience / Rating / Distance) ──
                  SizedBox(
                    height: 36,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: [
                        _FilterPill(
                          label: _dateLabel ?? 'Date',
                          active: _filterDate != null,
                          onTap: _openDateFilter,
                          onClear: _filterDate == null
                              ? null
                              : () => setState(() => _filterDate = null),
                        ),
                        const SizedBox(width: 8),
                        _FilterPill(
                          label: _filterExperience.isEmpty
                              ? 'Experience'
                              : 'Experience (${_filterExperience.length})',
                          active: _filterExperience.isNotEmpty,
                          onTap: _openExperienceFilter,
                          onClear: _filterExperience.isEmpty
                              ? null
                              : () => setState(() => _filterExperience = {}),
                        ),
                        const SizedBox(width: 8),
                        _FilterPill(
                          label: _filterRating.isEmpty
                              ? 'Rating'
                              : 'Rating (${_filterRating.length})',
                          active: _filterRating.isNotEmpty,
                          onTap: _openRatingFilter,
                          onClear: _filterRating.isEmpty
                              ? null
                              : () => setState(() => _filterRating = {}),
                        ),
                        const SizedBox(width: 8),
                        _FilterPill(
                          label: _distLabel ?? 'Distance',
                          active: _distLabel != null,
                          onTap: _openDistanceFilter,
                          onClear: _distLabel == null
                              ? null
                              : () => setState(() => _filterDistanceKm = 20),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // â”€â”€ Circular profession filters â”€â”€
                  SizedBox(
                    height: 78,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: [
                        _profIcon('All', null, LucideIcons.layoutGrid),
                        _profIcon('Coach', 'Coach', Icons.sports_tennis),
                        _profIcon('Physio', 'Physiotherapist', Icons.healing),
                        _profIcon(
                            'Nutrition', 'Nutritionist', LucideIcons.utensils),
                        _profIcon(
                            'Psychology', 'Psychologist', LucideIcons.brain),
                        _profIcon('Strength', 'Strength', LucideIcons.dumbbell),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  const Text(
                    'Professionals Curated for you',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),

                  const SizedBox(height: 14),

                  if (_isLoading)
                    const BmsListSkeleton(
                      itemCount: 4,
                      cardHeight: 220,
                      padding: EdgeInsets.symmetric(vertical: 8),
                    )
                  else if (visible.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 32),
                      child: BmsEmptyState(
                        icon: LucideIcons.brain,
                        title: _query.isNotEmpty
                            ? 'No matches for "$_query"'
                            : 'No professionals yet',
                        subtitle: _query.isNotEmpty
                            ? 'Try a different search term.'
                            : 'Pros will show up here once they join the platform.',
                      ),
                    )
                  else
                    ...visible.map((p) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _ProfessionalCard(
                            professional: p,
                            imageUrl: p.imageUrl,
                            title: p.name.isNotEmpty
                                ? p.name
                                : (p.profession.isNotEmpty
                                    ? p.profession
                                    : 'Professional'),
                            subtitle: _proSubtitle(p),
                            rating: p.rating,
                          ),
                        )),

                  const SizedBox(height: 20),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Build the small line under the pro's name. Falls back gracefully when
  /// the backend omits experience or rate (mock data has them; live data
  /// may not until the backend wires those fields into /professional/list).
  String _proSubtitle(Professional p) {
    final parts = <String>[];
    if (p.profession.isNotEmpty) parts.add(p.profession);
    if (p.experience > 0) parts.add('${p.experience} yrs exp');
    if (p.hourlyRate > 0) parts.add('₹${p.hourlyRate}/hr');
    if (parts.isEmpty) return 'Tap to view details';
    return parts.join(' · ');
  }

  Widget _profIcon(String label, String? value, IconData icon) {
    final selected = _selectedProfession == value;
    return GestureDetector(
      onTap: () => setState(() => _selectedProfession = value),
      child: Container(
        margin: const EdgeInsets.only(right: 14),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: selected ? Colors.white : AppColors.surfaceL3,
                shape: BoxShape.circle,
                border: Border.all(
                  color: selected
                      ? Colors.white
                      : Colors.white.withValues(alpha: 0.10),
                  width: 1.2,
                ),
              ),
              child: Icon(
                icon,
                size: 22,
                color: selected ? Colors.black : Colors.white,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                color: selected ? Colors.white : Colors.white60,
                fontSize: 11,
                fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfessionalCard extends StatefulWidget {
  const _ProfessionalCard({
    this.professional,
    required this.imageUrl,
    required this.title,
    required this.subtitle,
    required this.rating,
  });

  final Professional? professional;
  final String imageUrl;
  final String title;
  final String subtitle;
  final double rating;

  @override
  State<_ProfessionalCard> createState() => _ProfessionalCardState();
}

class _ProfessionalCardState extends State<_ProfessionalCard> {
  bool _liked = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        final p = widget.professional;
        context.push(
          '/professional/detail',
          extra: p == null ? null : {'professionalId': p.id},
        );
      },
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: AspectRatio(
          // Shorter card than before to match design — about 5:4 portrait.
          aspectRatio: 1.18,
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Image
              Image.network(
                widget.imageUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) =>
                    Container(color: AppColors.surfaceL3),
                loadingBuilder: (_, child, progress) {
                  if (progress == null) return child;
                  return Container(
                    color: AppColors.surfaceL1,
                    child: const Center(
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white24),
                    ),
                  );
                },
              ),

              // Bottom gradient for legibility
              const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.center,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Colors.black87],
                  ),
                ),
              ),

              // Heart top-right — solid fill per design.
              Positioned(
                top: 12,
                right: 12,
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () => setState(() => _liked = !_liked),
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.45),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.favorite,
                      color: _liked ? Colors.redAccent : Colors.white,
                      size: 18,
                    ),
                  ),
                ),
              ),

              // Bottom label row — person_pin_circle icon next to the
              // title, yellow star + rating on the right.
              Positioned(
                left: 12,
                right: 12,
                bottom: 12,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        Image.asset(
                          'assets/images/pros/person_pin_circle.png',
                          width: 14,
                          height: 14,
                          errorBuilder: (_, __, ___) => const Icon(
                              LucideIcons.mapPin,
                              color: Color(0xFFFFC107),
                              size: 13),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            widget.title,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              fontFamily: 'Poppins',
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Image.asset(
                          'assets/images/pros/star_yellow.png',
                          width: 13,
                          height: 13,
                          errorBuilder: (_, __, ___) => const Icon(
                              LucideIcons.star,
                              color: Color(0xFFFFC107),
                              size: 13),
                        ),
                        const SizedBox(width: 3),
                        Text(
                          widget.rating.toStringAsFixed(1),
                          style: const TextStyle(
                            color: Color(0xFFFFC107),
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Padding(
                      padding: const EdgeInsets.only(left: 20),
                      child: Text(
                        widget.subtitle,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.75),
                          fontSize: 11,
                          fontFamily: 'Poppins',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FilterPill extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;
  final VoidCallback? onClear;

  const _FilterPill({
    required this.label,
    required this.active,
    required this.onTap,
    this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: active
              ? const Color(0xFFCAE96A).withValues(alpha: 0.18)
              : const Color(0xFF2A2A2C),
          borderRadius: BorderRadius.circular(20),
          border: active
              ? Border.all(
                  color: const Color(0xFFCAE96A).withValues(alpha: 0.7),
                  width: 1)
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(label,
                style: TextStyle(
                    color: active ? const Color(0xFFCAE96A) : Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Poppins')),
            if (onClear != null) ...[
              const SizedBox(width: 6),
              GestureDetector(
                onTap: onClear,
                child: Icon(LucideIcons.x,
                    color: active ? const Color(0xFFCAE96A) : Colors.white70,
                    size: 14),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
