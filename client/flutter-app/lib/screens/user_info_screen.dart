import 'dart:io';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import '../core/constants/app_colors.dart';
import '../services/onboarding_data.dart';
import '../services/pending_registration.dart';
import '../widgets/common/bms_light_input.dart';
import '../widgets/common/bms_toast.dart';
import '../widgets/common/primary_gradient_button.dart';

class UserInfoScreen extends StatefulWidget {
  const UserInfoScreen({Key? key}) : super(key: key);

  @override
  State<UserInfoScreen> createState() => _UserInfoScreenState();
}

class _UserInfoScreenState extends State<UserInfoScreen> {
  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _dobController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  final ImagePicker _imagePicker = ImagePicker();
  File? _profileImage;
  bool _detectingLocation = false;

  @override
  void initState() {
    super.initState();
    final data = OnboardingData();
    if (data.firstName.isNotEmpty) _firstNameController.text = data.firstName;
    if (data.lastName.isNotEmpty) _lastNameController.text = data.lastName;
    if (data.dateOfBirth.isNotEmpty) _dobController.text = data.dateOfBirth;
    if (data.location.isNotEmpty) _locationController.text = data.location;
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _dobController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime(2000),
      firstDate: DateTime(1950),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppColors.primary,
              onPrimary: Colors.black,
              surface: AppColors.surfaceL4,
              onSurface: Colors.white,
            ),
            dialogTheme:
                const DialogThemeData(backgroundColor: AppColors.surfaceL4),
          ),
          child: child ?? const SizedBox(),
        );
      },
    );

    if (picked != null) {
      setState(() {
        _dobController.text =
            '${picked.day.toString().padLeft(2, '0')}/${picked.month.toString().padLeft(2, '0')}/${picked.year}';
      });
    }
  }

  Future<void> _detectLocation() async {
    setState(() => _detectingLocation = true);
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.deniedForever) {
        if (mounted) {
          BmsToast.error(context,
              'Location permission denied. Please enable it in settings.');
          await Geolocator.openAppSettings();
        }
        return;
      }
      if (permission == LocationPermission.denied) return;

      final position = await Geolocator.getCurrentPosition(
        locationSettings:
            const LocationSettings(accuracy: LocationAccuracy.medium),
      );

      final placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (placemarks.isNotEmpty) {
        final place = placemarks.first;
        final parts = <String>[
          if ((place.locality ?? '').isNotEmpty) place.locality!,
          if ((place.administrativeArea ?? '').isNotEmpty)
            place.administrativeArea!,
        ];
        _locationController.text = parts.join(', ');
      }
    } catch (_) {
      if (mounted) {
        BmsToast.error(
            context, 'Could not detect location. Please enter manually.');
      }
    } finally {
      if (mounted) setState(() => _detectingLocation = false);
    }
  }

  void _continue() {
    if (_formKey.currentState?.validate() ?? false) {
      HapticFeedback.mediumImpact();
      final firstName = _firstNameController.text.trim();
      final lastName = _lastNameController.text.trim();
      final data = OnboardingData();
      data.firstName = firstName;
      data.lastName = lastName;
      data.dateOfBirth = _dobController.text;
      data.location = _locationController.text.trim();
      data.photoURL = _profileImage?.path;
      // Store full name for the email registration path
      final fullName =
          [firstName, lastName].where((s) => s.isNotEmpty).join(' ');
      if (fullName.isNotEmpty) PendingRegistration().name = fullName;
      context.push('/onboarding/gender');
    }
  }

  Future<void> _pickProfileImage() async {
    final picked = await _imagePicker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );
    if (picked == null) return;
    setState(() => _profileImage = File(picked.path));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundGray,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 16),
                  Row(
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
                            color: Colors.white.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(LucideIcons.chevronLeft,
                              color: Colors.white, size: 18),
                        ),
                      ),
                      const _ProgressBar(filled: 0, total: 3),
                    ],
                  ),
                  const SizedBox(height: 36),
                  const Text(
                    'Tell me some\ndetails please?',
                    style: TextStyle(
                      fontSize: 34,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'This helps your friends find your account',
                    style: TextStyle(
                      fontSize: 15,
                      color: Colors.white.withValues(alpha: 0.55),
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 40),
                  Center(
                    child: GestureDetector(
                      onTap: _pickProfileImage,
                      child: Stack(
                        children: [
                          Container(
                            width: 118,
                            height: 118,
                            decoration: BoxDecoration(
                              color: AppColors.backgroundCard,
                              shape: BoxShape.circle,
                              image: _profileImage != null
                                  ? DecorationImage(
                                      image: FileImage(_profileImage!),
                                      fit: BoxFit.cover,
                                    )
                                  : null,
                            ),
                            child: _profileImage == null
                                ? Icon(
                                    LucideIcons.user,
                                    size: 56,
                                    color: Colors.white.withValues(alpha: 0.4),
                                  )
                                : null,
                          ),
                          Positioned(
                            right: 4,
                            bottom: 4,
                            child: Container(
                              width: 30,
                              height: 30,
                              decoration: const BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(LucideIcons.camera,
                                  size: 16, color: Colors.black),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 36),
                  Row(
                    children: [
                      Expanded(
                        child: BmsLightInput(
                          controller: _firstNameController,
                          hint: 'FIRST NAME',
                          validator: (v) => (v == null || v.trim().isEmpty)
                              ? 'Required'
                              : null,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: BmsLightInput(
                          controller: _lastNameController,
                          hint: 'LAST NAME',
                          validator: (v) => (v == null || v.trim().isEmpty)
                              ? 'Required'
                              : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  BmsLightInput(
                    controller: _dobController,
                    hint: 'DATE OF BIRTH',
                    readOnly: true,
                    onTap: () => _selectDate(context),
                    suffix: const Icon(Icons.calendar_month_outlined,
                        color: Color(0xFF6B7280), size: 20),
                    validator: (v) => (v == null || v.isEmpty)
                        ? 'Please select your date of birth'
                        : null,
                  ),
                  const SizedBox(height: 14),
                  // Location field with GPS detect
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: BmsLightInput(
                          controller: _locationController,
                          hint: 'CITY / LOCATION',
                          suffix: const Icon(LucideIcons.mapPin,
                              color: Color(0xFF6B7280), size: 20),
                        ),
                      ),
                      const SizedBox(width: 10),
                      GestureDetector(
                        onTap: _detectingLocation ? null : _detectLocation,
                        child: Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: AppColors.backgroundCard,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: AppColors.primary.withValues(alpha: 0.4),
                            ),
                          ),
                          child: _detectingLocation
                              ? const Center(
                                  child: SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      color: AppColors.primary,
                                      strokeWidth: 2,
                                    ),
                                  ),
                                )
                              : const Icon(LucideIcons.locateFixed,
                                  color: AppColors.primary, size: 22),
                        ),
                      ),
                    ],
                  ),
                  Padding(
                    padding: const EdgeInsets.only(top: 6, left: 4),
                    child: Text(
                      'Tap  to auto-detect your location',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.white.withValues(alpha: 0.35),
                      ),
                    ),
                  ),
                  const SizedBox(height: 52),
                  PrimaryGradientButton(
                    label: 'CONTINUE',
                    height: 56,
                    onPressed: _continue,
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ProgressBar extends StatelessWidget {
  final int filled;
  final int total;

  const _ProgressBar({required this.filled, required this.total});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(total, (i) {
        return Container(
          width: 88,
          height: 4,
          margin: EdgeInsets.only(left: i == 0 ? 0 : 4),
          decoration: BoxDecoration(
            color: i < filled ? AppColors.primary : AppColors.backgroundCard,
            borderRadius: BorderRadius.circular(2),
          ),
        );
      }),
    );
  }
}
