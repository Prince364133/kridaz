import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/constants/app_colors.dart';

class TeamCodeChip extends StatelessWidget {
  final String code;

  const TeamCodeChip({super.key, required this.code});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surfaceL1,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            code,
            style: const TextStyle(
              color: AppColors.primary,
              fontSize: 16,
              fontWeight: FontWeight.w700,
              fontFamily: 'Poppins',
              letterSpacing: 2,
            ),
          ),
          const SizedBox(width: 10),
          GestureDetector(
            onTap: () {
              Clipboard.setData(ClipboardData(text: code));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Team code copied!'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
            child:
                const Icon(LucideIcons.copy, color: Colors.white54, size: 18),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => Share.share('Join my team on BMS! Use code: $code'),
            child:
                const Icon(LucideIcons.share2, color: Colors.white54, size: 18),
          ),
        ],
      ),
    );
  }
}
