import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/constants/app_dimensions.dart';

class SectionTitleDivider extends StatelessWidget {
  final String title;
  final Color color;

  const SectionTitleDivider({
    Key? key,
    required this.title,
    this.color = AppColors.accentCyan,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding:
          const EdgeInsets.symmetric(horizontal: AppDimensions.paddingLarge),
      child: Column(
        children: [
          Text(
            title,
            style: AppTextStyles.sectionTitle.copyWith(color: color),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: Container(
                  height: 0.5,
                  color: color,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
