import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../core/constants/app_colors.dart';

class ApplyAsAcademyScreen extends StatefulWidget {
  const ApplyAsAcademyScreen({Key? key}) : super(key: key);

  @override
  State<ApplyAsAcademyScreen> createState() => _ApplyAsAcademyScreenState();
}

class _ApplyAsAcademyScreenState extends State<ApplyAsAcademyScreen> {
  final _formKey = GlobalKey<FormState>();
  final ImagePicker _picker = ImagePicker();

  String? _logoImagePath;
  final List<String> _facilityImages = [];

  final _academyNameController = TextEditingController();
  final _contactPersonController = TextEditingController();
  final _locationController = TextEditingController();
  final _facilitiesController = TextEditingController();
  final _pricingController = TextEditingController();

  String? _selectedSport;

  final List<String> _sports = [
    'Cricket',
    'Football',
    'Basketball',
    'Tennis',
    'Badminton',
    'Swimming',
    'Athletics',
    'Volleyball',
  ];

  @override
  void dispose() {
    _academyNameController.dispose();
    _contactPersonController.dispose();
    _locationController.dispose();
    _facilitiesController.dispose();
    _pricingController.dispose();
    super.dispose();
  }

  Future<void> _pickLogo() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 512,
      maxHeight: 512,
    );

    if (image != null) {
      setState(() {
        _logoImagePath = image.path;
      });
    }
  }

  Future<void> _pickFacilityImages() async {
    final List<XFile> images = await _picker.pickMultiImage(
      maxWidth: 1024,
      maxHeight: 1024,
    );

    if (images.isNotEmpty) {
      setState(() {
        _facilityImages.addAll(images.map((img) => img.path));
      });
    }
  }

  void _submitApplication() {
    if (_formKey.currentState?.validate() ?? false) {
      // TODO: Submit application to backend

      // Navigate to Application Under Review screen
      context.go('/application-review');
    }
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
          'Apply as Academy',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Academy Name
              _buildLabel('Academy Name'),
              const SizedBox(height: 8),
              _buildTextField(
                controller: _academyNameController,
                hint: 'Enter academy name',
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter academy name';
                  }
                  return null;
                },
              ),

              const SizedBox(height: 20),

              // Contact Person
              _buildLabel('Contact Person'),
              const SizedBox(height: 8),
              _buildTextField(
                controller: _contactPersonController,
                hint: 'Enter contact person\'s name',
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter contact person';
                  }
                  return null;
                },
              ),

              const SizedBox(height: 20),

              // Location
              _buildLabel('Location'),
              const SizedBox(height: 8),
              _buildTextField(
                controller: _locationController,
                hint: 'Enter academy location',
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter location';
                  }
                  return null;
                },
              ),

              const SizedBox(height: 20),

              // Facilities Offered
              _buildLabel('Facilities Offered'),
              const SizedBox(height: 8),
              _buildTextField(
                controller: _facilitiesController,
                hint: 'Describe your facilities',
                maxLines: 5,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please describe facilities';
                  }
                  return null;
                },
              ),

              const SizedBox(height: 20),

              // Sports Coached
              _buildLabel('Sports Coached'),
              const SizedBox(height: 8),
              _buildDropdown(),

              const SizedBox(height: 20),

              // Pricing Structures
              _buildLabel('Pricing Structures'),
              const SizedBox(height: 8),
              _buildTextField(
                controller: _pricingController,
                hint: 'Describe your pricing structure',
                maxLines: 5,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please describe pricing structure';
                  }
                  return null;
                },
              ),

              const SizedBox(height: 24),

              // Upload Logo
              _buildLabel('Upload Logo'),
              const SizedBox(height: 12),
              GestureDetector(
                onTap: _pickLogo,
                child: Container(
                  width: double.infinity,
                  height: 120,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceL3,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.1),
                      width: 1,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _logoImagePath != null
                            ? LucideIcons.checkCircle
                            : LucideIcons.upload,
                        color: _logoImagePath != null
                            ? AppColors.primary
                            : Colors.white.withValues(alpha: 0.6),
                        size: 32,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _logoImagePath != null
                            ? 'Logo Uploaded'
                            : 'Upload Logo',
                        style: TextStyle(
                          color: _logoImagePath != null
                              ? AppColors.primary
                              : Colors.white.withValues(alpha: 0.8),
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Tap to upload your academy logo',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.5),
                          fontSize: 12,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Upload Facility Images
              _buildLabel('Upload Facility Images'),
              const SizedBox(height: 12),
              GestureDetector(
                onTap: _pickFacilityImages,
                child: Container(
                  width: double.infinity,
                  height: 120,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceL3,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.1),
                      width: 1,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _facilityImages.isNotEmpty
                            ? LucideIcons.checkCircle
                            : LucideIcons.upload,
                        color: _facilityImages.isNotEmpty
                            ? AppColors.primary
                            : Colors.white.withValues(alpha: 0.6),
                        size: 32,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _facilityImages.isNotEmpty
                            ? '${_facilityImages.length} Images Uploaded'
                            : 'Upload Images',
                        style: TextStyle(
                          color: _facilityImages.isNotEmpty
                              ? AppColors.primary
                              : Colors.white.withValues(alpha: 0.8),
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Tap to upload images of your facilities',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.5),
                          fontSize: 12,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 40),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _submitApplication,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.black,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Submit Application',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String label) {
    return Text(
      label,
      style: const TextStyle(
        color: Colors.white,
        fontSize: 14,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    TextInputType? keyboardType,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      style: const TextStyle(
        color: Colors.white,
        fontSize: 14,
      ),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(
          color: Colors.white.withValues(alpha: 0.4),
          fontSize: 14,
        ),
        filled: true,
        fillColor: AppColors.surfaceL3,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.all(16),
      ),
      validator: validator,
    );
  }

  Widget _buildDropdown() {
    return DropdownButtonFormField<String>(
      initialValue: _selectedSport,
      dropdownColor: AppColors.surfaceL3,
      decoration: InputDecoration(
        hintText: 'Select sports',
        hintStyle: TextStyle(
          color: Colors.white.withValues(alpha: 0.4),
          fontSize: 14,
        ),
        filled: true,
        fillColor: AppColors.surfaceL3,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.all(16),
      ),
      style: const TextStyle(
        color: Colors.white,
        fontSize: 14,
      ),
      icon: Icon(
        LucideIcons.chevronDown,
        color: Colors.white.withValues(alpha: 0.6),
      ),
      items: _sports.map((sport) {
        return DropdownMenuItem<String>(
          value: sport,
          child: Text(sport),
        );
      }).toList(),
      onChanged: (value) {
        setState(() {
          _selectedSport = value;
        });
      },
      validator: (value) {
        if (value == null || value.isEmpty) {
          return 'Please select a sport';
        }
        return null;
      },
    );
  }
}
