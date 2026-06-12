import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../services/onboarding_data.dart';
import '../widgets/common/primary_gradient_button.dart';

class BmsScreen04Gender extends StatefulWidget {
  const BmsScreen04Gender({super.key});

  @override
  State<BmsScreen04Gender> createState() => _BmsScreen04GenderState();
}

class _BmsScreen04GenderState extends State<BmsScreen04Gender> {
  // Start with no selection — illustrations render in the white-shirt
  // variant until the user picks one.
  String? selectedGender;

  void _selectGender(String gender) {
    setState(() => selectedGender = gender);
    HapticFeedback.lightImpact();
  }

  void _continue() {
    if (selectedGender == null) return;
    HapticFeedback.mediumImpact();
    OnboardingData().gender = selectedGender;
    context.push('/onboarding/interests');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundGray,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      context.pop();
                    },
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(LucideIcons.chevronLeft,
                          color: Colors.white, size: 18),
                    ),
                  ),
                  _ProgressBar(filled: 1, total: 3),
                ],
              ),
              const SizedBox(height: 36),
              const Text(
                'What is\nyour gender?',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 34,
                  fontWeight: FontWeight.w700,
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'This helps us find you more relevant content',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.55),
                  fontSize: 15,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 40),
              Expanded(
                child: Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        width: 160,
                        height: 240,
                        child: _GenderCard(
                          gender: 'Male',
                          isSelected: selectedGender == 'Male',
                          onTap: () => _selectGender('Male'),
                        ),
                      ),
                      const SizedBox(width: 16),
                      SizedBox(
                        width: 160,
                        height: 240,
                        child: _GenderCard(
                          gender: 'Female',
                          isSelected: selectedGender == 'Female',
                          onTap: () => _selectGender('Female'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              PrimaryGradientButton(
                label: 'CONTINUE',
                height: 56,
                onPressed: selectedGender != null ? _continue : null,
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class _GenderCard extends StatelessWidget {
  final String gender;
  final bool isSelected;
  final VoidCallback onTap;

  const _GenderCard({
    required this.gender,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    // White (neutral) by default; the green-shirt variant only appears for
    // the selected card. Two PNGs per gender — pre-rendered, no tinting.
    final imageAsset = isSelected
        ? 'assets/images/onboarding/${gender.toLowerCase()}_green.png'
        : 'assets/images/onboarding/${gender.toLowerCase()}_white.png';

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: AppColors.surfaceL2,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Stack(
          children: [
            Positioned.fill(
              child: Image.asset(
                imageAsset,
                fit: BoxFit.cover,
                alignment: Alignment.bottomCenter,
                errorBuilder: (_, __, ___) => Icon(
                  gender == 'Male' ? Icons.male : Icons.female,
                  size: 80,
                  color: Colors.white24,
                ),
              ),
            ),
            Positioned(
              top: 14,
              left: 0,
              right: 0,
              child: Center(
                child: Text(
                  gender,
                  style: TextStyle(
                    color: isSelected
                        ? AppColors.primary
                        : Colors.white.withValues(alpha: 0.85),
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Poppins',
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProgressBar extends StatelessWidget {
  final int filled;
  final int total;

  const _ProgressBar({required this.filled, required this.total});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(total, (i) {
        return Container(
          width: 88,
          height: 4,
          margin: EdgeInsets.only(left: i == 0 ? 0 : 4),
          decoration: BoxDecoration(
            color: i < filled ? AppColors.primary : AppColors.backgroundCard,
            borderRadius: BorderRadius.circular(2),
          ),
        );
      }),
    );
  }
}
