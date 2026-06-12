import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class ToggleButtonGroup extends StatelessWidget {
  final String leftLabel;
  final String rightLabel;
  final bool isLeftSelected;
  final VoidCallback onLeftTap;
  final VoidCallback onRightTap;

  const ToggleButtonGroup({
    Key? key,
    required this.leftLabel,
    required this.rightLabel,
    required this.isLeftSelected,
    required this.onLeftTap,
    required this.onRightTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 40,
      decoration: BoxDecoration(
        color: AppColors.backgroundCard,
        borderRadius: BorderRadius.circular(12),
      ),
      padding: const EdgeInsets.all(4),
      child: Row(
        children: [
          Expanded(
            child: _ToggleButton(
              label: leftLabel,
              isSelected: isLeftSelected,
              onTap: onLeftTap,
            ),
          ),
          Expanded(
            child: _ToggleButton(
              label: rightLabel,
              isSelected: !isLeftSelected,
              onTap: onRightTap,
            ),
          ),
        ],
      ),
    );
  }
}

class _ToggleButton extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _ToggleButton({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: isSelected ? AppColors.backgroundDark : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 4,
                  ),
                ]
              : null,
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            fontFamily: 'Poppins',
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: isSelected ? AppColors.textWhite : AppColors.textDarkGray,
          ),
        ),
      ),
    );
  }
}
