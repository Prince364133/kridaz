import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../core/constants/app_colors.dart';
import 'package:go_router/go_router.dart';

class PickSportsScreen extends StatefulWidget {
  const PickSportsScreen({Key? key}) : super(key: key);

  @override
  State<PickSportsScreen> createState() => _PickSportsScreenState();
}

class _PickSportsScreenState extends State<PickSportsScreen> {
  String? selectedSport;

  final List<Map<String, dynamic>> sports = [
    {'name': 'Cricket', 'icon': Icons.sports_cricket},
    {'name': 'Football', 'icon': Icons.sports_soccer},
    {'name': 'Basketball', 'icon': Icons.sports_basketball},
    {'name': 'Tennis', 'icon': Icons.sports_tennis},
    {'name': 'Badminton', 'icon': Icons.sports_tennis},
    {'name': 'Volleyball', 'icon': Icons.sports_volleyball},
    {'name': 'Table Tennis', 'icon': Icons.sports_tennis},
    {'name': 'Hockey', 'icon': Icons.sports_hockey},
    {'name': 'Swimming', 'icon': Icons.pool},
    {'name': 'Running', 'icon': LucideIcons.activity},
    {'name': 'Cycling', 'icon': Icons.directions_bike},
    {'name': 'Gym', 'icon': LucideIcons.dumbbell},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Row(
                children: [
                  InkWell(
                    onTap: () => context.pop(),
                    child: Container(
                      width: 48,
                      height: 48,
                      alignment: Alignment.center,
                      child: const Icon(
                        LucideIcons.arrowLeft,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                  ),
                  const Expanded(
                    child: Text(
                      'Pick Your Sport',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
            ),

            // Sports Grid
            Expanded(
              child: GridView.builder(
                padding: const EdgeInsets.all(16),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1,
                ),
                itemCount: sports.length,
                itemBuilder: (context, index) {
                  final sport = sports[index];
                  final isSelected = selectedSport == sport['name'];

                  return InkWell(
                    onTap: () {
                      setState(() {
                        selectedSport = sport['name'];
                      });
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppColors.accentCyan.withValues(alpha: 0.2)
                            : AppColors.surfaceL4,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected
                              ? AppColors.accentCyan
                              : Colors.transparent,
                          width: 2,
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            sport['icon'],
                            color: isSelected
                                ? AppColors.accentCyan
                                : Colors.white,
                            size: 40,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            sport['name'],
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: isSelected
                                  ? AppColors.accentCyan
                                  : Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),

            // Confirm Button
            Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: selectedSport != null
                      ? () {
                          context.pop(selectedSport);
                        }
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: selectedSport != null
                        ? AppColors.backgroundCard
                        : AppColors.surfaceL3,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
                    'CONFIRM SPORT',
                    style: TextStyle(
                      fontFamily: 'Poppins',
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: selectedSport != null
                          ? Colors.white
                          : Colors.white.withValues(alpha: 0.3),
                    ),
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
