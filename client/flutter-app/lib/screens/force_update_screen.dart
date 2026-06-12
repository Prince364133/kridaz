import 'dart:io' show Platform;
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/constants/app_colors.dart';
import '../core/version/app_version.dart';

/// Blocking overlay shown when the server's Min-Client-Version is newer
/// than the shipping build. No back navigation — the user must update.
class ForceUpdateScreen extends StatelessWidget {
  final String? minSupportedClient;

  const ForceUpdateScreen({super.key, this.minSupportedClient});

  static const _playStoreUrl =
      'https://play.google.com/store/apps/details?id=com.bms.kridaz';
  static const _appStoreUrl = 'https://apps.apple.com/app/kridaz/id000000000';

  Future<void> _openStore() async {
    final uri = Uri.parse(Platform.isIOS ? _appStoreUrl : _playStoreUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: Colors.black,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Spacer(),
                Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [
                        AppColors.gradientStart,
                        AppColors.gradientEnd,
                      ],
                    ),
                  ),
                  child: const Icon(
                    LucideIcons.arrowUp,
                    color: Colors.black,
                    size: 40,
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Update required',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Poppins',
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'You\'re running ${AppVersion.current}. '
                  'The server now requires '
                  '${minSupportedClient ?? "a newer version"}.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.65),
                    fontSize: 14,
                    height: 1.5,
                    fontFamily: 'Poppins',
                  ),
                ),
                const Spacer(),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _openStore,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.accentLime,
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'Update now',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'Poppins',
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
