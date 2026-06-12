import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../widgets/common/bms_toast.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import '../core/constants/app_colors.dart';
import 'package:go_router/go_router.dart';
import '../services/auth_manager.dart';
import '../services/google_auth_service.dart';
import '../services/user_api_service.dart';
import '../services/user_service.dart';
import '../providers/user_provider.dart';

class UserProfileDetailScreen extends ConsumerStatefulWidget {
  const UserProfileDetailScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<UserProfileDetailScreen> createState() =>
      _UserProfileDetailScreenState();
}

class _UserProfileDetailScreenState
    extends ConsumerState<UserProfileDetailScreen> {
  final _fullNameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _dobController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _locationController = TextEditingController();

  List<Map<String, dynamic>> _interests = [];
  bool _isLoading = true;
  bool _isSaving = false;
  String? _photoUrl;
  File? _selectedImage;
  final ImagePicker _imagePicker = ImagePicker();
  double? _latitude;
  double? _longitude;

  // Username availability check state — debounce + result.
  Timer? _usernameDebounce;
  bool _usernameChecking = false;
  bool? _usernameAvailable; // null = untested, true = free, false = taken
  String? _lastCheckedUsername;

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
    _usernameController.addListener(_onUsernameChanged);
  }

  void _onUsernameChanged() {
    final value = _usernameController.text.trim();
    _usernameDebounce?.cancel();
    if (value.isEmpty || value == _lastCheckedUsername) {
      if (_usernameAvailable != null) {
        setState(() => _usernameAvailable = null);
      }
      return;
    }
    _usernameDebounce = Timer(const Duration(milliseconds: 500), () async {
      setState(() => _usernameChecking = true);
      final ok = await UserService().isUsernameAvailable(value);
      if (!mounted) return;
      setState(() {
        _usernameChecking = false;
        _lastCheckedUsername = value;
        _usernameAvailable = ok;
      });
    });
  }

  Future<void> _loadUserProfile() async {
    try {
      final userService = UserService();
      final profile = await userService.fetchUserFromBackend();

      if (profile != null && mounted) {
        setState(() {
          _fullNameController.text =
              '${profile['firstName'] ?? ''} ${profile['lastName'] ?? ''}'
                  .trim();
          _usernameController.text =
              profile['firstName']?.toString().toLowerCase() ?? '';
          _dobController.text = profile['dateOfBirth'] ?? '';
          _phoneController.text = profile['phoneNumber'] ?? '';
          _emailController.text = profile['email'] ?? '';
          _photoUrl = profile['photoURL'];
          _locationController.text = profile['location'] ?? '';
          if (profile['latitude'] != null) {
            _latitude = double.tryParse(profile['latitude'].toString());
          }
          if (profile['longitude'] != null) {
            _longitude = double.tryParse(profile['longitude'].toString());
          }

          // Load interests
          final interests = profile['interests'] ?? profile['favourites'] ?? [];
          _interests = (interests as List).map((sport) {
            return {
              'name': sport.toString(),
              'icon': _getSportIcon(sport.toString()),
            };
          }).toList();

          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  String _getSportIcon(String sport) {
    final icons = {
      'Cricket': '🏏',
      'Football': '⚽',
      'Badminton': '🏸',
      'Basketball': '🏀',
      'Tennis': '🎾',
      'Volleyball': '🏐',
      'Swimming': '🏊',
      'Hockey': '🏑',
      'Running': '🏃',
      'Golf': '⛳',
    };
    return icons[sport] ?? '🎯';
  }

  Future<void> _pickImage() async {
    final picked = await _imagePicker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );
    if (picked == null) return;

    final file = File(picked.path);
    setState(() {
      _selectedImage = file;
      _isSaving = true;
    });

    final me = AuthManager().currentUser;
    final userId = (me?['id'] ?? me?['_id'])?.toString() ?? '';
    try {
      final result =
          await UserApiService().updateUserWithPhoto(userId, {}, file);
      if (!mounted) return;
      if (result.isSuccess) {
        UserService.clearCache();
        ref.read(userProfileNotifierProvider.notifier).refresh();
        BmsToast.success(context, 'Profile photo updated');
      } else {
        setState(() => _selectedImage = null);
        BmsToast.error(context, result.error ?? 'Upload failed');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _selectedImage = null);
      BmsToast.error(context, 'Upload error: $e');
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _updatePhoneNumber() async {
    final controller = TextEditingController(text: _phoneController.text);
    final newPhone = await showDialog<String>(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: AppColors.surfaceL3,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Text(
            'Update Phone Number',
            style: TextStyle(color: Colors.white),
          ),
          content: TextField(
            controller: controller,
            keyboardType: TextInputType.phone,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'Enter phone number',
              hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.5)),
              enabledBorder: OutlineInputBorder(
                borderSide:
                    BorderSide(color: Colors.white.withValues(alpha: 0.3)),
                borderRadius: BorderRadius.circular(8),
              ),
              focusedBorder: OutlineInputBorder(
                borderSide: const BorderSide(color: AppColors.primary),
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => context.pop(),
              child: Text(
                'Cancel',
                style: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
              ),
            ),
            ElevatedButton(
              onPressed: () => context.pop(controller.text),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
              ),
              child: const Text(
                'Save',
                style:
                    TextStyle(color: Colors.black, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        );
      },
    );

    if (newPhone != null &&
        newPhone.isNotEmpty &&
        newPhone != _phoneController.text) {
      setState(() => _isSaving = true);
      try {
        final userService = UserService();
        final success = await userService.updatePhoneNumber(newPhone);
        if (success && mounted) {
          setState(() {
            _phoneController.text = newPhone;
            _isSaving = false;
          });
          BmsToast.success(context, 'Phone number updated successfully!');
        } else {
          setState(() => _isSaving = false);
          if (mounted) {
            BmsToast.error(context, 'Failed to update phone number');
          }
        }
      } catch (e) {
        setState(() => _isSaving = false);
        if (mounted) {
          BmsToast.error(context, 'Error: $e');
        }
      }
    }
  }

  Future<void> _updateLocation() async {
    // Use geolocator to get current location
    try {
      setState(() => _isSaving = true);

      // Check location permission
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() => _isSaving = false);
          if (mounted) {
            BmsToast.error(context, 'Location permission denied');
          }
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() => _isSaving = false);
        if (mounted) {
          BmsToast.error(context,
              'Location permission permanently denied. Please enable in settings.');
        }
        return;
      }

      // Get current position
      Position position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );

      // Get address from coordinates
      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      String locationName = 'Unknown';
      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        locationName =
            '${place.locality ?? place.subAdministrativeArea ?? ''}, ${place.administrativeArea ?? ''}';
        locationName = locationName.replaceAll(', ,', ',').trim();
        if (locationName.startsWith(','))
          locationName = locationName.substring(1).trim();
        if (locationName.endsWith(','))
          locationName =
              locationName.substring(0, locationName.length - 1).trim();
      }

      // Save to backend
      final userService = UserService();
      final success = await userService.updateLocation(
        location: locationName,
        latitude: position.latitude,
        longitude: position.longitude,
      );

      if (success && mounted) {
        // Update location override provider for instant sync across screens
        ref.read(locationOverrideProvider.notifier).setLocation(locationName);

        setState(() {
          _locationController.text = locationName;
          _latitude = position.latitude;
          _longitude = position.longitude;
          _isSaving = false;
        });
        BmsToast.success(context, 'Location updated to: $locationName');
      } else {
        setState(() => _isSaving = false);
        if (mounted) {
          BmsToast.error(context, 'Failed to update location');
        }
      }
    } catch (e) {
      setState(() => _isSaving = false);
      if (mounted) {
        BmsToast.error(context, 'Error: $e');
      }
    }
  }

  @override
  void dispose() {
    _usernameDebounce?.cancel();
    _usernameController.removeListener(_onUsernameChanged);
    _fullNameController.dispose();
    _usernameController.dispose();
    _dobController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Background wave pattern
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 200,
            child: CustomPaint(
              painter: WavePatternPainter(),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                // Top bar
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      GestureDetector(
                        onTap: () {
                          HapticFeedback.lightImpact();
                          context.pop();
                        },
                        child: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: Colors.transparent,
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.2),
                            ),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            LucideIcons.x,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                      ),
                      const Text(
                        'Profile',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 40),
                    ],
                  ),
                ),

                // Scrollable content
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 20),

                        // Profile picture
                        Center(
                          child: Stack(
                            children: [
                              Container(
                                width: 120,
                                height: 120,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: Colors.white,
                                    width: 3,
                                  ),
                                  gradient: const LinearGradient(
                                    colors: [
                                      AppColors.accentIndigo,
                                      AppColors.accentPink,
                                      AppColors.accentOrange,
                                    ],
                                  ),
                                ),
                                child: _selectedImage != null
                                    ? ClipOval(
                                        child: Image.file(
                                          _selectedImage!,
                                          width: 120,
                                          height: 120,
                                          fit: BoxFit.cover,
                                        ),
                                      )
                                    : _photoUrl != null
                                        ? ClipOval(
                                            child: Image.network(
                                              _photoUrl!,
                                              width: 120,
                                              height: 120,
                                              fit: BoxFit.cover,
                                              errorBuilder:
                                                  (context, error, stackTrace) {
                                                return const Icon(
                                                  LucideIcons.user,
                                                  size: 60,
                                                  color: Colors.white,
                                                );
                                              },
                                            ),
                                          )
                                        : const Icon(
                                            LucideIcons.user,
                                            size: 60,
                                            color: Colors.white,
                                          ),
                              ),
                              Positioned(
                                bottom: 0,
                                right: 0,
                                child: GestureDetector(
                                  onTap: _pickImage,
                                  child: Container(
                                    width: 36,
                                    height: 36,
                                    decoration: BoxDecoration(
                                      color: AppColors.primary,
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: Colors.black,
                                        width: 2,
                                      ),
                                    ),
                                    child: const Icon(
                                      LucideIcons.camera,
                                      color: Colors.black,
                                      size: 18,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 32),

                        // Full Name
                        _buildTextField(
                          controller: _fullNameController,
                          label: 'Full Name',
                          readOnly: true,
                        ),

                        const SizedBox(height: 16),

                        // User Name (with live availability check)
                        _buildUsernameField(),

                        const SizedBox(height: 16),

                        // D.O.B
                        _buildTextField(
                          controller: _dobController,
                          label: 'D.O.B',
                          hasEdit: true,
                        ),

                        const SizedBox(height: 16),

                        // Phone No
                        _buildEditableField(
                          controller: _phoneController,
                          label: 'Phone no',
                          onEdit: _updatePhoneNumber,
                        ),

                        const SizedBox(height: 16),

                        // Email
                        _buildTextField(
                          controller: _emailController,
                          label: 'Email',
                          readOnly: true,
                        ),

                        const SizedBox(height: 16),

                        // Location
                        _buildEditableField(
                          controller: _locationController,
                          label: 'Location',
                          onEdit: _updateLocation,
                        ),

                        const SizedBox(height: 24),

                        // Interested
                        if (_interests.isNotEmpty) _buildInterests(),

                        const SizedBox(height: 32),

                        // Logout Button
                        _buildLogoutButton(),

                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLogoutButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: () => _handleLogout(),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.red,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.logOut, color: Colors.white),
            SizedBox(width: 8),
            Text(
              'Logout',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleLogout() async {
    HapticFeedback.mediumImpact();

    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: AppColors.surfaceL3,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Text(
            'Logout',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          content: Text(
            'Are you sure you want to logout?',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.7),
              fontSize: 14,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text(
                'Cancel',
                style: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
              ),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
              ),
              child: const Text(
                'Logout',
                style: TextStyle(
                  color: Colors.black,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        );
      },
    );

    if (shouldLogout == true && mounted) {
      try {
        final authService = GoogleAuthService();
        await authService.signOut();

        if (mounted) {
          context.go('/welcome');
        }
      } catch (e) {
        if (mounted) {
          BmsToast.error(context, 'Error logging out. Please try again.');
        }
      }
    }
  }

  Widget _buildEditableField({
    required TextEditingController controller,
    required String label,
    required VoidCallback onEdit,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.6),
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: onEdit,
          child: Container(
            decoration: BoxDecoration(
              color: Colors.transparent,
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.2),
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    child: Text(
                      controller.text.isEmpty ? label : controller.text,
                      style: TextStyle(
                        color: controller.text.isEmpty
                            ? Colors.white.withValues(alpha: 0.3)
                            : Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: Icon(
                    LucideIcons.pencil,
                    color: Colors.white.withValues(alpha: 0.5),
                    size: 18,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildUsernameField() {
    Widget suffix;
    if (_usernameChecking) {
      suffix = const SizedBox(
          width: 16,
          height: 16,
          child:
              CircularProgressIndicator(strokeWidth: 2, color: Colors.white54));
    } else if (_usernameAvailable == true) {
      suffix = const Icon(LucideIcons.checkCircle,
          color: AppColors.accentGreen, size: 18);
    } else if (_usernameAvailable == false) {
      suffix =
          const Icon(LucideIcons.xCircle, color: AppColors.errorRed, size: 18);
    } else {
      suffix = Icon(LucideIcons.pencil,
          color: Colors.white.withValues(alpha: 0.5), size: 18);
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('User Name',
            style: TextStyle(
                color: Colors.white.withValues(alpha: 0.6),
                fontSize: 12,
                fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.transparent,
            border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _usernameController,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w400),
                  decoration: const InputDecoration(
                    border: InputBorder.none,
                    contentPadding:
                        EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    hintText: 'User Name',
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(right: 12),
                child: suffix,
              ),
            ],
          ),
        ),
        if (_usernameAvailable == false && !_usernameChecking) ...[
          const SizedBox(height: 4),
          const Text('Username is already taken',
              style: TextStyle(color: AppColors.errorRed, fontSize: 11)),
        ],
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    bool hasEdit = false,
    bool readOnly = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.6),
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.transparent,
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.2),
            ),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  readOnly: readOnly,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w400,
                  ),
                  decoration: InputDecoration(
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    hintText: label,
                    hintStyle: TextStyle(
                      color: Colors.white.withValues(alpha: 0.3),
                    ),
                  ),
                ),
              ),
              if (hasEdit)
                Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: Icon(
                    LucideIcons.pencil,
                    color: Colors.white.withValues(alpha: 0.5),
                    size: 18,
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildInterests() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Intrested',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.6),
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.transparent,
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.2),
            ),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              ..._interests.map((sport) {
                return Container(
                  margin: const EdgeInsets.only(right: 12),
                  child: Column(
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Center(
                          child: Text(
                            sport['icon'],
                            style: const TextStyle(fontSize: 30),
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        sport['name'],
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.8),
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ],
          ),
        ),
      ],
    );
  }
}

class WavePatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..shader = const LinearGradient(
        colors: [
          AppColors.accentBlueDark,
          AppColors.accentBlueLight,
        ],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
      ..style = PaintingStyle.fill;

    final path = Path();

    // Create diagonal wave lines
    for (int i = -1; i < 10; i++) {
      path.moveTo(i * size.width / 5, 0);
      path.lineTo((i + 1) * size.width / 5, size.height);
    }

    canvas.drawPath(
        path,
        paint
          ..strokeWidth = 40
          ..style = PaintingStyle.stroke);
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}
