import '../core/constants/app_colors.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../widgets/common/filter_apply_button.dart';

class SelectSportScreen extends StatefulWidget {
  final String? selectedSport;

  const SelectSportScreen({super.key, this.selectedSport});

  @override
  State<SelectSportScreen> createState() => _SelectSportScreenState();
}

class _SelectSportScreenState extends State<SelectSportScreen> {
  final TextEditingController _searchController = TextEditingController();
  String? _selectedSport;

  final List<Map<String, dynamic>> _sports = [
    {'name': 'Cricket', 'icon': Icons.sports_cricket},
    {'name': 'Football', 'icon': Icons.sports_soccer},
    {'name': 'Badminton', 'icon': Icons.sports_tennis},
    {'name': 'Tennis', 'icon': Icons.sports_tennis},
    {'name': 'Basketball', 'icon': Icons.sports_basketball},
    {'name': 'Volleyball', 'icon': Icons.sports_volleyball},
    {'name': 'Baseball', 'icon': Icons.sports_baseball},
  ];

  List<Map<String, dynamic>> _filteredSports = [];

  @override
  void initState() {
    super.initState();
    _selectedSport = widget.selectedSport;
    _filteredSports = _sports;
    _searchController.addListener(_filterSports);
  }

  @override
  void dispose() {
    _searchController.removeListener(_filterSports);
    _searchController.dispose();
    super.dispose();
  }

  void _filterSports() {
    setState(() {
      if (_searchController.text.isEmpty) {
        _filteredSports = _sports;
      } else {
        _filteredSports = _sports
            .where((sport) => sport['name']
                .toString()
                .toLowerCase()
                .contains(_searchController.text.toLowerCase()))
            .toList();
      }
    });
  }

  void _apply() {
    context.pop(_selectedSport);
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
                        'Select Sport',
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
                          hintText: 'Search sports',
                          hintStyle: TextStyle(
                            color: Colors.white.withValues(alpha: 0.4),
                            fontSize: 14,
                          ),
                          border: InputBorder.none,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Sports list
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _filteredSports.length,
                itemBuilder: (context, index) {
                  final sport = _filteredSports[index];
                  final isSelected = _selectedSport == sport['name'];

                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedSport = isSelected ? null : sport['name'];
                      });
                    },
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppColors.primary.withValues(alpha: 0.1)
                            : Colors.transparent,
                        border: Border.all(
                          color: isSelected
                              ? AppColors.primary
                              : Colors.white.withValues(alpha: 0.1),
                          width: 1,
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            sport['icon'],
                            color:
                                isSelected ? AppColors.primary : Colors.white,
                            size: 24,
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Text(
                              sport['name'],
                              style: TextStyle(
                                color: isSelected
                                    ? AppColors.primary
                                    : Colors.white,
                                fontSize: 16,
                                fontWeight: isSelected
                                    ? FontWeight.w600
                                    : FontWeight.w400,
                              ),
                            ),
                          ),
                          Container(
                            width: 24,
                            height: 24,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: isSelected
                                    ? AppColors.primary
                                    : Colors.white.withValues(alpha: 0.3),
                                width: 2,
                              ),
                              color: isSelected
                                  ? AppColors.primary
                                  : Colors.transparent,
                            ),
                            child: isSelected
                                ? const Icon(
                                    LucideIcons.check,
                                    color: Colors.black,
                                    size: 16,
                                  )
                                : null,
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),

            // Apply pill — grey background, gradient text per design.
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: FilterApplyButton(onTap: _apply),
            ),
          ],
        ),
      ),
    );
  }
}
