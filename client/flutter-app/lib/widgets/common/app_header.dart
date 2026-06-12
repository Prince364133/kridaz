import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/constants/app_dimensions.dart';
import '../../providers/user_provider.dart';

class AppHeader extends ConsumerWidget {
  final VoidCallback? onNotificationTap;
  final VoidCallback? onMessageTap;
  final VoidCallback? onProfileTap;

  const AppHeader({
    Key? key,
    this.onNotificationTap,
    this.onMessageTap,
    this.onProfileTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userName = ref.watch(userDisplayNameProvider);
    final userLocation = ref.watch(userLocationProvider);
    final userPhotoUrl = ref.watch(userPhotoUrlProvider);

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppDimensions.screenHorizontalPadding,
        AppDimensions.paddingMedium,
        AppDimensions.screenHorizontalPadding,
        AppDimensions.paddingMedium,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // User Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Hi, $userName',
                  style: AppTextStyles.h2,
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(
                      LucideIcons.mapPin,
                      size: 16,
                      color: AppColors.textGray,
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        userLocation,
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textGray,
                        ),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Action Icons
          Row(
            children: [
              // Messages Icon
              GestureDetector(
                onTap: () {
                  if (onMessageTap != null) {
                    onMessageTap!();
                  } else {
                    context.push('/messages');
                  }
                },
                child: Container(
                  width: 44,
                  height: 44,
                  alignment: Alignment.center,
                  child: SvgPicture.asset(
                    'assets/icons/chat_icon.svg',
                    width: 24,
                    height: 24,
                    colorFilter: const ColorFilter.mode(
                      Colors.white,
                      BlendMode.srcIn,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 4),
              // Notification Icon
              GestureDetector(
                onTap: () {
                  if (onNotificationTap != null) {
                    onNotificationTap!();
                  } else {
                    context.push('/notification-panel');
                  }
                },
                child: Container(
                  width: 44,
                  height: 44,
                  alignment: Alignment.center,
                  child: SvgPicture.asset(
                    'assets/icons/bell-alert.svg',
                    width: 24,
                    height: 24,
                    colorFilter: const ColorFilter.mode(
                      Colors.white,
                      BlendMode.srcIn,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 4),
              // Profile Icon / Photo
              GestureDetector(
                onTap: () {
                  if (onProfileTap != null) {
                    onProfileTap!();
                  } else {
                    context.push('/user-profile');
                  }
                },
                child: Container(
                  width: 44,
                  height: 44,
                  alignment: Alignment.center,
                  child: userPhotoUrl != null && userPhotoUrl.isNotEmpty
                      ? ClipOval(
                          child: CachedNetworkImage(
                            imageUrl: userPhotoUrl,
                            width: 32,
                            height: 32,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color:
                                    AppColors.textGray.withValues(alpha: 0.3),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                LucideIcons.user,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                            errorWidget: (context, url, error) => Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color:
                                    AppColors.textGray.withValues(alpha: 0.3),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                LucideIcons.user,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                          ),
                        )
                      : SvgPicture.asset(
                          'assets/icons/user-circle.svg',
                          width: 24,
                          height: 24,
                          colorFilter: const ColorFilter.mode(
                            Colors.white,
                            BlendMode.srcIn,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
