import '../core/constants/app_colors.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter/services.dart';
import 'bms_screen_06_loading.dart';
import '../services/onboarding_data.dart';

class SportsInterestsScreen extends StatefulWidget {
  const SportsInterestsScreen({super.key});

  @override
  State<SportsInterestsScreen> createState() => _SportsInterestsScreenState();
}

class _SportsInterestsScreenState extends State<SportsInterestsScreen>
    with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late AnimationController _staggerController;
  late Animation<double> _fadeAnimation;

  List<int> selectedIndices = []; // Start with no sports selected

  // 8 Popular Sports — assets pulled from the Kridaz web frontend
  // (assets/images/sports/) for visual parity across platforms.
  final List<Map<String, dynamic>> sports = [
    {
      'name': 'Cricket',
      'image': 'assets/images/sports/cricket.png',
      'gradient': [AppColors.accentGreen, AppColors.accentGreen],
      'description': 'The gentleman\'s game'
    },
    {
      'name': 'Football',
      'image': 'assets/images/sports/football.png',
      'gradient': [AppColors.accentGreen, AppColors.accentGreen],
      'description': 'The beautiful game'
    },
    {
      'name': 'Basketball',
      'image': 'assets/images/sports/basketball.png',
      'gradient': [AppColors.accentOrange, AppColors.accentOrangeDeep],
      'description': 'High-flying action'
    },
    {
      'name': 'Tennis',
      'image': 'assets/images/sports/tennis.png',
      'gradient': [AppColors.accentBlueLight, AppColors.accentBlueDark],
      'description': 'Precision and power'
    },
    {
      'name': 'Volleyball',
      'image': 'assets/images/sports/volleyball.png',
      'gradient': [AppColors.accentGoldWarm, AppColors.accentOrangeDeep],
      'description': 'Spike and serve'
    },
    {
      'name': 'Badminton',
      'image': 'assets/images/sports/badminton.png',
      'gradient': [AppColors.accentTeal, AppColors.accentTeal],
      'description': 'Shuttle sport'
    },
    {
      'name': 'Pickleball',
      'image': 'assets/images/sports/pickleball.png',
      'gradient': [AppColors.accentLime, AppColors.accentGreen],
      'description': 'Fastest growing sport'
    },
    {
      'name': 'Table Tennis',
      'image': 'assets/images/sports/table_tennis.png',
      'gradient': [AppColors.accentRed, AppColors.errorRed],
      'description': 'Speed and reflex'
    },
  ];

  @override
  void initState() {
    super.initState();

    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _staggerController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fadeController, curve: Curves.easeInOut),
    );

    _fadeController.forward();
    Future.delayed(const Duration(milliseconds: 200), () {
      _staggerController.forward();
    });
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _staggerController.dispose();
    super.dispose();
  }

  void _toggleSelection(int index) {
    setState(() {
      if (selectedIndices.contains(index)) {
        selectedIndices.remove(index);
      } else {
        selectedIndices.add(index);
      }
    });
    HapticFeedback.lightImpact();
  }

  Widget _buildSportCard(int index) {
    final sport = sports[index];
    bool isSelected = selectedIndices.contains(index);

    return AnimatedBuilder(
      animation: _staggerController,
      builder: (context, child) {
        final animationValue = Interval(
          (index * 0.1).clamp(0.0, 1.0),
          ((index * 0.1) + 0.3).clamp(0.0, 1.0),
          curve: Curves.easeOutBack,
        ).transform(_staggerController.value);

        return Transform.translate(
          offset: Offset(0, 50 * (1 - animationValue)),
          child: Opacity(
            opacity: animationValue.clamp(
                0.0, 1.0), // Ensure opacity is always valid
            child: GestureDetector(
              onTap: () => _toggleSelection(index),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeInOut,
                margin: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected ? AppColors.primary : Colors.transparent,
                    width: isSelected ? 3 : 0,
                  ),
                  boxShadow: isSelected
                      ? [
                          const BoxShadow(
                            color: Color(0x6694EA01), // Green with 40% opacity
                            blurRadius: 15,
                            offset: Offset(0, 5),
                          ),
                        ]
                      : null,
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      // Sport image - fills entire card
                      Image.asset(
                        sport['image'],
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: sport['gradient'],
                              ),
                            ),
                            child: const Icon(
                              Icons.sports,
                              size: 48,
                              color:
                                  Color(0xB3FFFFFF), // White with 70% opacity
                            ),
                          );
                        },
                      ),

                      // Dark overlay for unselected cards
                      if (!isSelected)
                        Container(
                          decoration: const BoxDecoration(
                            color: Color(0x80000000), // Black with 50% opacity
                          ),
                        ),

                      // Sport name overlay (shown when selected)
                      if (isSelected)
                        Positioned(
                          left: 0,
                          right: 0,
                          bottom: 0,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 10,
                            ),
                            decoration: const BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  Color(0x00000000), // Transparent
                                  Color(0xB3000000), // Black with 70% opacity
                                  Color(0xE6000000), // Black with 90% opacity
                                ],
                              ),
                            ),
                            child: Text(
                              sport['name'],
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),

                      // Selection checkmark (top-right corner)
                      if (isSelected)
                        Positioned(
                          top: 8,
                          right: 8,
                          child: Container(
                            width: 28,
                            height: 28,
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Color(
                                      0x4D000000), // Black with 30% opacity
                                  blurRadius: 4,
                                  offset: Offset(0, 2),
                                ),
                              ],
                            ),
                            child: const Icon(
                              LucideIcons.check,
                              color: Colors.black,
                              size: 18,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: Stack(
          children: [
            // Background image
            Positioned.fill(
              child: Image.asset(
                'assets/images/screens/starting screens background.png',
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          AppColors.backgroundBlack,
                          AppColors.surfaceL0,
                          AppColors.surfaceL3,
                          AppColors.backgroundCard,
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),

            // Dark overlay for better text readability
            Positioned.fill(
              child: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Color(0x4D000000), // Black with 30% opacity
                      Color(0x80000000), // Black with 50% opacity
                    ],
                  ),
                ),
              ),
            ),

            // Content
            SafeArea(
              child: Column(
                children: [
                  // Header
                  Container(
                    padding: const EdgeInsets.all(20),
                    child: Row(
                      children: [
                        GestureDetector(
                          onTap: () {
                            HapticFeedback.lightImpact();
                            Navigator.of(context).pop();
                          },
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(
                                  0x1AFFFFFF), // White with 10% opacity
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              LucideIcons.chevronLeft,
                              color: Colors.white,
                              size: 18,
                            ),
                          ),
                        ),
                        const Expanded(
                          child: Center(
                            child: Text(
                              'Choose Your Sports',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 44), // Balance the back button
                      ],
                    ),
                  ),

                  // Title and subtitle
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 25),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Book My Sports',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontSize: 32,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Select at least 2 sports to get personalized recommendations and find players near you',
                          style: const TextStyle(
                            color: Color(0xB3FFFFFF), // White with 70% opacity
                            fontSize: 16,
                            fontWeight: FontWeight.w400,
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: selectedIndices.length >= 2
                                ? const Color(
                                    0x1A94EA01) // Green with 10% opacity
                                : const Color(
                                    0x1AFF0000), // Red with 10% opacity
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: selectedIndices.length >= 2
                                  ? const Color(
                                      0x4D94EA01) // Green with 30% opacity
                                  : const Color(
                                      0x4DFF0000), // Red with 30% opacity
                            ),
                          ),
                          child: Text(
                            selectedIndices.length >= 2
                                ? '${selectedIndices.length} sports selected ✓'
                                : 'Select at least 2 sports • ${selectedIndices.length} selected',
                            style: TextStyle(
                              color: selectedIndices.length >= 2
                                  ? AppColors.primary
                                  : AppColors.errorRed,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 30),

                  // Sports grid
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: GridView.builder(
                        physics: const BouncingScrollPhysics(),
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                          childAspectRatio: 0.85,
                        ),
                        itemCount: sports.length,
                        itemBuilder: (context, index) => _buildSportCard(index),
                      ),
                    ),
                  ),

                  // Continue button
                  Container(
                    padding: const EdgeInsets.all(25),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: selectedIndices.length >= 2
                            ? () async {
                                HapticFeedback.mediumImpact();

                                // Save sports interests
                                final onboardingData = OnboardingData();
                                final selectedSports = selectedIndices
                                    .map((index) =>
                                        sports[index]['name'] as String)
                                    .toList();
                                onboardingData.interests = selectedSports;

                                // Save to Firebase
                                final success =
                                    await onboardingData.saveToFirebase();

                                if (success) {
                                } else {}

                                // Navigate to loading screen
                                if (mounted) {
                                  Navigator.of(context).push(
                                    PageRouteBuilder(
                                      pageBuilder: (context, animation,
                                              secondaryAnimation) =>
                                          const BmsScreen06Loading(),
                                      transitionsBuilder: (context, animation,
                                          secondaryAnimation, child) {
                                        return SlideTransition(
                                          position: Tween<Offset>(
                                            begin: const Offset(1.0, 0.0),
                                            end: Offset.zero,
                                          ).animate(CurvedAnimation(
                                              parent: animation,
                                              curve: Curves.easeInOut)),
                                          child: child,
                                        );
                                      },
                                      transitionDuration:
                                          const Duration(milliseconds: 300),
                                    ),
                                  );
                                }
                              }
                            : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: selectedIndices.length >= 2
                              ? AppColors.primary
                              : AppColors.backgroundCard,
                          foregroundColor: selectedIndices.length >= 2
                              ? Colors.black
                              : Colors.white38,
                          elevation: selectedIndices.length >= 2 ? 6 : 0,
                          shadowColor:
                              const Color(0x4D94EA01), // Green with 30% opacity
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                            side: selectedIndices.length >= 2
                                ? BorderSide.none
                                : const BorderSide(
                                    color: Color(
                                        0x1AFFFFFF), // White with 10% opacity
                                    width: 1,
                                  ),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              selectedIndices.length >= 2
                                  ? 'Continue'
                                  : 'Select 2 Sports to Continue',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            if (selectedIndices.length >= 2) ...[
                              const SizedBox(width: 8),
                              Icon(
                                LucideIcons.arrowRight,
                                size: 20,
                                color: Colors.black,
                              ),
                            ],
                          ],
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
}
