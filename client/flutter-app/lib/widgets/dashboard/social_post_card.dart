import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_dimensions.dart';
import '../../core/util/image_url.dart';

class SocialPostCard extends StatelessWidget {
  final String? imageUrl;
  final int likeCount;
  final int commentCount;
  final int shareCount;

  const SocialPostCard({
    Key? key,
    this.imageUrl,
    this.likeCount = 0,
    this.commentCount = 0,
    this.shareCount = 0,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 462.35,
      margin: const EdgeInsets.symmetric(
          horizontal: AppDimensions.screenHorizontalPadding),
      decoration: ShapeDecoration(
        color: Colors.grey.withValues(alpha: 0.3),
        shape: RoundedRectangleBorder(
          side: const BorderSide(width: 0.62, color: AppColors.borderLight),
          borderRadius: BorderRadius.circular(4.57),
        ),
      ),
      child: Stack(
        children: [
          Center(
            child: isHttpUrl(imageUrl)
                ? Image.network(imageUrl!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Text(
                          'SOCIAL POST\nIMAGE PLACEHOLDER',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.white54),
                        ))
                : const Text(
                    'SOCIAL POST\nIMAGE PLACEHOLDER',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white54),
                  ),
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 36,
              decoration: const ShapeDecoration(
                color: AppColors.surfaceL0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(4.57),
                    bottomRight: Radius.circular(4.57),
                  ),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _ActionButton(icon: LucideIcons.heart, count: likeCount),
                  _ActionButton(
                      icon: LucideIcons.messageSquare, count: commentCount),
                  _ActionButton(icon: LucideIcons.share2, count: shareCount),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final int count;

  const _ActionButton({required this.icon, required this.count});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: Colors.white, size: 20),
        const SizedBox(width: 4),
        Text(
          count.toString(),
          style: const TextStyle(color: Colors.white, fontSize: 12),
        ),
      ],
    );
  }
}
