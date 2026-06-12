import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_dimensions.dart';

class GlassmorphicSearchBar extends StatelessWidget {
  final String hintText;
  final VoidCallback? onTap;

  const GlassmorphicSearchBar({
    Key? key,
    this.hintText = 'Search sports, venues, events...',
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
          horizontal: AppDimensions.screenHorizontalPadding),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          height: AppDimensions.searchBarHeight,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(27),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.4),
                blurRadius: 24,
                offset: const Offset(0, 8),
                spreadRadius: 0,
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(27),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: AppDimensions.screenHorizontalPadding),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(27),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.25),
                    width: 1.5,
                  ),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Colors.white.withValues(alpha: 0.15),
                      Colors.white.withValues(alpha: 0.05),
                    ],
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      LucideIcons.search,
                      color: Colors.white.withValues(alpha: 0.8),
                      size: AppDimensions.iconMedium,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      hintText,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.5),
                        fontSize: 15,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
