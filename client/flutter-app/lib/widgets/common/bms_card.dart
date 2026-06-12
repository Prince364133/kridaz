import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/constants/app_colors.dart';

/// Canonical card surface — radius 14 (per app design), L1 surface, soft
/// border. Use everywhere a card-style container is needed instead of
/// hand-rolling `Container(decoration: BoxDecoration(...))`.
///
/// Pass [onTap] to make it interactive (adds an InkWell + haptic).
class BmsCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;
  final VoidCallback? onTap;
  final Color? color;
  final Border? border;
  final double radius;

  const BmsCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(14),
    this.margin,
    this.onTap,
    this.color,
    this.border,
    this.radius = AppRadii.card,
  });

  @override
  Widget build(BuildContext context) {
    final shape = BorderRadius.circular(radius);
    final inner = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color ?? AppColors.surfaceL1,
        borderRadius: shape,
        border: border ?? Border.all(color: AppColors.borderSoft),
      ),
      child: child,
    );

    final wrapped = onTap == null
        ? inner
        : Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: shape,
              onTap: () {
                HapticFeedback.lightImpact();
                onTap!();
              },
              child: inner,
            ),
          );

    return margin == null ? wrapped : Padding(padding: margin!, child: wrapped);
  }
}
