import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../services/onboarding_data.dart';
import '../widgets/common/primary_gradient_button.dart';

class BmsScreen05Interests extends StatefulWidget {
  const BmsScreen05Interests({super.key});

  @override
  State<BmsScreen05Interests> createState() => _BmsScreen05InterestsState();
}

class _BmsScreen05InterestsState extends State<BmsScreen05Interests> {
  // No preselection — user must pick at least 2 before Continue activates.
  final List<int> _selected = [];

  static const _sports = [
    _Sport('Football', 'assets/images/screens/football.png'),
    _Sport('Cricket', 'assets/images/screens/Cricket.png'),
    _Sport('Basketball', 'assets/images/screens/BasketBall.png'),
    _Sport('Tennis', 'assets/images/screens/Tennis.png'),
    _Sport('Swimming', 'assets/images/screens/Swimming.png'),
    _Sport('Badminton', 'assets/images/screens/Badminton.png'),
    _Sport('Hockey', 'assets/images/screens/Hockey.png'),
    _Sport('Volleyball', 'assets/images/screens/VolleyBall.png'),
  ];

  void _toggle(int index) {
    setState(() {
      if (_selected.contains(index)) {
        _selected.remove(index);
      } else {
        _selected.add(index);
      }
    });
    HapticFeedback.lightImpact();
  }

  bool get _canContinue => _selected.length >= 2;

  void _continue() {
    if (!_canContinue) return;
    HapticFeedback.mediumImpact();
    OnboardingData().interests = _selected.map((i) => _sports[i].name).toList();
    context.push('/onboarding/loading');
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
                  const _ProgressBar(filled: 2, total: 3),
                ],
              ),
              const SizedBox(height: 36),
              const Text(
                'What are you\ninterested in?',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 34,
                  fontWeight: FontWeight.w700,
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'Choose min. 2 categories you like, you can change them later',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.55),
                  fontSize: 15,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 28),
              Expanded(
                child: GridView.builder(
                  padding: EdgeInsets.zero,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.05,
                  ),
                  itemCount: _sports.length,
                  itemBuilder: (context, index) {
                    final isSelected = _selected.contains(index);
                    return GestureDetector(
                      onTap: () => _toggle(index),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            Image.asset(
                              _sports[index].asset,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(
                                color: AppColors.backgroundCard,
                                child: const Icon(Icons.sports,
                                    color: Colors.white24, size: 40),
                              ),
                            ),
                            // Selected: mint→lime gradient tint over the photo.
                            // Unselected: raw photo, no overlay or label.
                            if (isSelected)
                              AnimatedContainer(
                                duration: const Duration(milliseconds: 180),
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                    colors: [
                                      const Color(0xFF6FE7C3)
                                          .withValues(alpha: 0.55),
                                      const Color(0xFFCAE96A)
                                          .withValues(alpha: 0.55),
                                    ],
                                  ),
                                ),
                              ),
                            if (isSelected)
                              Center(
                                child: Text(
                                  _sports[index].name,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                    fontFamily: 'Poppins',
                                    shadows: [
                                      Shadow(
                                          color: Colors.black54, blurRadius: 6),
                                    ],
                                  ),
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
              PrimaryGradientButton(
                label: 'CONTINUE',
                height: 56,
                onPressed: _canContinue ? _continue : null,
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class _Sport {
  final String name;
  final String asset;
  const _Sport(this.name, this.asset);
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
