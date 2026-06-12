import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';

class SelectableFormField extends StatelessWidget {
  final String label;
  final String? value;
  final String placeholder;
  final IconData icon;
  final VoidCallback onTap;

  const SelectableFormField({
    Key? key,
    required this.label,
    required this.value,
    required this.placeholder,
    required this.icon,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppTextStyles.h3.copyWith(fontSize: 16),
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: onTap,
          child: Container(
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.backgroundCard,
              borderRadius: BorderRadius.circular(8),
            ),
            alignment: Alignment.centerLeft,
            padding: const EdgeInsets.symmetric(horizontal: 15),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    value ?? placeholder,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: value != null
                          ? AppColors.textWhite
                          : AppColors.textGray,
                    ),
                  ),
                ),
                Icon(
                  icon,
                  color: AppColors.textWhite,
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
