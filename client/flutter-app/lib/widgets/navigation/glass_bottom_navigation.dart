import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/navigation_provider.dart';

// Fix #10: compact height (64px), stronger blur, active-tab glow indicator

class GlassBottomNavigation extends ConsumerWidget {
  final List<String> iconPaths;
  final List<String>? labels;
  final Function(int)? onTap;

  const GlassBottomNavigation({
    Key? key,
    required this.iconPaths,
    this.labels,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentIndex = ref.watch(navigationProvider);

    return ClipRRect(
      borderRadius: const BorderRadius.only(
        topLeft: Radius.circular(24),
        topRight: Radius.circular(24),
      ),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
        child: Container(
          height: 70,
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.55),
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
            border: Border(
              top: BorderSide(
                color: Colors.white.withValues(alpha: 0.10),
                width: 0.8,
              ),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(
              iconPaths.length,
              (index) => _GlassNavItem(
                iconPath: iconPaths[index],
                label: labels != null && index < labels!.length
                    ? labels![index]
                    : null,
                isSelected: currentIndex == index,
                onTap: () {
                  ref.read(navigationProvider.notifier).setIndex(index);
                  onTap?.call(index);
                },
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _GlassNavItem extends StatelessWidget {
  final String iconPath;
  final String? label;
  final bool isSelected;
  final VoidCallback onTap;

  const _GlassNavItem({
    required this.iconPath,
    this.label,
    required this.isSelected,
    required this.onTap,
  });

  Widget _buildIcon(String path, Color tint) {
    if (path.endsWith('.svg')) {
      return SvgPicture.asset(path,
          width: 22,
          height: 22,
          colorFilter: ColorFilter.mode(tint, BlendMode.srcIn));
    }
    return Image.asset(path,
        width: 22, height: 22, color: tint, colorBlendMode: BlendMode.srcIn);
  }

  @override
  Widget build(BuildContext context) {
    final color = isSelected
        ? AppColors.accentCyan
        : Colors.white.withValues(alpha: 0.55);

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 64,
        height: 70,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (isSelected)
              ShaderMask(
                shaderCallback: (bounds) => const LinearGradient(
                  colors: [AppColors.accentCyan, AppColors.accentNeonGreen],
                ).createShader(bounds),
                blendMode: BlendMode.srcIn,
                child: _buildIcon(iconPath, Colors.white),
              )
            else
              _buildIcon(iconPath, color),
            if (label != null) ...[
              const SizedBox(height: 4),
              Text(label!,
                  style: TextStyle(
                      color: color,
                      fontSize: 9,
                      fontWeight:
                          isSelected ? FontWeight.w700 : FontWeight.w400,
                      letterSpacing: 0.5,
                      fontFamily: 'Poppins')),
            ],
          ],
        ),
      ),
    );
  }
}
