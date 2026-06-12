import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';

class FormTextInput extends StatelessWidget {
  final String? label;
  final String placeholder;
  final TextInputType keyboardType;
  final ValueChanged<String>? onChanged;
  final bool enabled;
  final double height;

  const FormTextInput({
    Key? key,
    this.label,
    required this.placeholder,
    this.keyboardType = TextInputType.text,
    this.onChanged,
    this.enabled = true,
    this.height = 43,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Text(
            label!,
            style: AppTextStyles.h3.copyWith(fontSize: 14),
          ),
          const SizedBox(height: 10),
        ],
        Container(
          height: height,
          decoration: BoxDecoration(
            color: AppColors.backgroundCard,
            borderRadius: BorderRadius.circular(12),
          ),
          alignment: Alignment.centerLeft,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: TextField(
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.textWhite,
            ),
            keyboardType: keyboardType,
            enabled: enabled,
            decoration: InputDecoration(
              hintText: placeholder,
              hintStyle: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textGray,
              ),
              border: InputBorder.none,
              contentPadding: EdgeInsets.zero,
            ),
            onChanged: onChanged,
          ),
        ),
      ],
    );
  }
}
