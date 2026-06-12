import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';

class TimeSelector extends StatelessWidget {
  final String placeholder;
  final TimeOfDay? time;
  final VoidCallback onTap;

  const TimeSelector({
    Key? key,
    required this.placeholder,
    required this.time,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        height: 40,
        decoration: BoxDecoration(
          color: AppColors.backgroundCard,
          borderRadius: BorderRadius.circular(8),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: [
            Expanded(
              child: Text(
                time?.format(context) ?? placeholder,
                style: AppTextStyles.bodySmall.copyWith(
                  color:
                      time != null ? AppColors.textWhite : AppColors.textGray,
                ),
              ),
            ),
            const Icon(
              LucideIcons.clock,
              color: AppColors.textWhite,
              size: 16,
            ),
          ],
        ),
      ),
    );
  }
}
