import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class IconBadge extends StatelessWidget {
  final IconData icon;
  final double size;
  final Color? color;
  final Color? backgroundColor;

  const IconBadge({
    Key? key,
    required this.icon,
    this.size = 20.0,
    this.color,
    this.backgroundColor,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: backgroundColor ?? AppColors.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(
        icon,
        color: color ?? AppColors.primary,
        size: size,
      ),
    );
  }
}
