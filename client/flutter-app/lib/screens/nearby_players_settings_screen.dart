import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/app_colors.dart';
import '../services/friends_service.dart';
import '../widgets/common/bms_toast.dart';

const _kLocationSharingKey = 'bms_location_sharing';

class NearbyPlayersSettingsScreen extends StatefulWidget {
  const NearbyPlayersSettingsScreen({Key? key}) : super(key: key);

  @override
  State<NearbyPlayersSettingsScreen> createState() =>
      _NearbyPlayersSettingsScreenState();
}

class _NearbyPlayersSettingsScreenState
    extends State<NearbyPlayersSettingsScreen> {
  final FriendsService _service = FriendsService();
  bool _goOnline = true;
  bool _saving = false;
  String _selectedVisibility = 'My Friends';

  @override
  void initState() {
    super.initState();
    _loadPersistedSharing();
  }

  Future<void> _loadPersistedSharing() async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getBool(_kLocationSharingKey);
    if (stored != null && mounted) {
      setState(() => _goOnline = stored);
    }
  }

  Future<void> _setSharing(bool next) async {
    if (_saving) return;
    setState(() {
      _saving = true;
      _goOnline = next;
    });
    HapticFeedback.lightImpact();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kLocationSharingKey, next);
    final ok = await _service.setLocationSharing(next);
    if (!mounted) return;
    if (!ok) {
      setState(() => _goOnline = !next);
      await prefs.setBool(_kLocationSharingKey, !next);
      BmsToast.error(context, 'Could not update visibility');
    } else {
      BmsToast.info(
        context,
        next
            ? 'You are visible to nearby players'
            : 'You are hidden from nearby players',
      );
    }
    if (mounted) setState(() => _saving = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
          onPressed: () {
            HapticFeedback.lightImpact();
            context.pop();
          },
        ),
        title: const Text(
          'Settings',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Who can see My Location
            const Text(
              'Who can see My Location',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Your location updates based on your device\'s location permission\nChange in Settings',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.5),
                fontSize: 12,
                fontWeight: FontWeight.w400,
                height: 1.5,
              ),
            ),

            const SizedBox(height: 24),

            // Go Online toggle
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.textLightGray,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  // Avatar
                  Container(
                    width: 50,
                    height: 50,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                    ),
                    child: ClipOval(
                      child: Image.network(
                        'https://i.pravatar.cc/150?img=33',
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            color: Colors.grey[300],
                            child:
                                Icon(LucideIcons.user, color: Colors.grey[600]),
                          );
                        },
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Text
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Go Online',
                          style: TextStyle(
                            color: Colors.black,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'When enabled, your friends can spot\nyou',
                          style: TextStyle(
                            color: Colors.black.withValues(alpha: 0.6),
                            fontSize: 11,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Toggle switch
                  Transform.scale(
                    scale: 0.8,
                    child: Switch(
                      value: _goOnline,
                      onChanged: _saving ? null : _setSharing,
                      activeThumbColor: AppColors.primary,
                      activeTrackColor:
                          AppColors.primary.withValues(alpha: 0.5),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Visibility options
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.textLightGray,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  _buildVisibilityOption(
                    'My Friends',
                    _selectedVisibility == 'My Friends',
                  ),
                  const SizedBox(height: 12),
                  _buildVisibilityOption(
                    'My Friends, Except....',
                    _selectedVisibility == 'My Friends, Except....',
                  ),
                  const SizedBox(height: 12),
                  _buildVisibilityOption(
                    'Only....',
                    _selectedVisibility == 'Only....',
                  ),
                ],
              ),
            ),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildVisibilityOption(String title, bool isSelected) {
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedVisibility = title;
        });
      },
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: TextStyle(
                color: Colors.black.withValues(alpha: 0.8),
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: isSelected
                    ? AppColors.primary
                    : Colors.black.withValues(alpha: 0.3),
                width: 2,
              ),
              color: isSelected ? AppColors.primary : Colors.transparent,
            ),
            child: isSelected
                ? const Icon(
                    LucideIcons.check,
                    size: 16,
                    color: Colors.black,
                  )
                : null,
          ),
        ],
      ),
    );
  }
}
