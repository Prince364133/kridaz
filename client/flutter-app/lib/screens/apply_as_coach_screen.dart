import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../core/constants/app_colors.dart';

class ApplyAsCoachScreen extends StatefulWidget {
  const ApplyAsCoachScreen({Key? key}) : super(key: key);

  @override
  State<ApplyAsCoachScreen> createState() => _ApplyAsCoachScreenState();
}

class _ApplyAsCoachScreenState extends State<ApplyAsCoachScreen> {
  final _formKey = GlobalKey<FormState>();
  final ImagePicker _picker = ImagePicker();

  String? _profileImagePath;
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _experienceController = TextEditingController();
  final _certificationsController = TextEditingController();
  final _rateController = TextEditingController();

  String? _selectedSport;
  TimeOfDay? _selectedTime;

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
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _experienceController.dispose();
    _certificationsController.dispose();
    _rateController.dispose();
    super.dispose();
  }

  Future<void> _pickProfileImage() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 512,
      maxHeight: 512,
    );

    if (image != null) {
      setState(() {
        _profileImagePath = image.path;
      });
    }
  }

  Future<void> _selectTime() async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: ColorScheme.dark(
              primary: AppColors.primary,
              onSurface: Colors.white,
            ),
          ),
          child: child ?? const SizedBox(),
        );
      },
    );

    if (picked != null) {
      setState(() {
        _selectedTime = picked;
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
          'Apply as a Coach',
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
              // 3D whistle hero — pulled from the Kridaz web frontend
              // for cross-platform brand consistency.
              Center(
                child: Image.asset(
                  'assets/images/3d_icons/3d_whistle.png',
                  height: 120,
                  fit: BoxFit.contain,
                ),
              ),
              const SizedBox(height: 16),
              const Center(
                child: Text(
                  'Coach the next generation',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Poppins',
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Upload Profile Picture
              GestureDetector(
                onTap: _pickProfileImage,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceL3,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        LucideIcons.image,
                        color: Colors.white.withValues(alpha: 0.6),
                        size: 24,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _profileImagePath != null
                              ? 'Profile picture selected'
                              : 'Upload Profile Picture',
                          style: TextStyle(
                            color: _profileImagePath != null
                                ? AppColors.primary
                                : Colors.white.withValues(alpha: 0.6),
                            fontSize: 14,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Full Name
              _buildLabel('Full Name'),
              const SizedBox(height: 8),
              _buildTextField(
                controller: _fullNameController,
                hint: 'Enter your full name',
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your full name';
                  }
                  return null;
                },
              ),

              const SizedBox(height: 20),

              // Email
              _buildLabel('Email'),
              const SizedBox(height: 8),
              _buildTextField(
                controller: _emailController,
                hint: 'Enter your email',
                keyboardType: TextInputType.emailAddress,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your email';
                  }
                  if (!value.contains('@')) {
                    return 'Please enter a valid email';
                  }
                  return null;
                },
              ),

              const SizedBox(height: 20),

              // Phone Number
              _buildLabel('Phone Number'),
              const SizedBox(height: 8),
              _buildTextField(
                controller: _phoneController,
                hint: 'Enter your phone number',
                keyboardType: TextInputType.phone,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your phone number';
                  }
                  return null;
                },
              ),

              const SizedBox(height: 20),

              // Coaching Experience
              _buildLabel('Coaching Experience (Years)'),
              const SizedBox(height: 8),
              _buildTextField(
                controller: _experienceController,
                hint: 'Enter years of experience',
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your experience';
                  }
                  return null;
                },
              ),

              const SizedBox(height: 20),

              // Certifications
              _buildLabel('Certifications'),
              const SizedBox(height: 8),
              _buildTextField(
                controller: _certificationsController,
                hint: 'List your certifications',
                maxLines: 3,
              ),

              const SizedBox(height: 20),

              // Sports Coached
              _buildLabel('Sports Coached'),
              const SizedBox(height: 8),
              _buildDropdown(),

              const SizedBox(height: 20),

              // Availability
              _buildLabel('Availability'),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: _selectTime,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceL3,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _selectedTime != null
                            ? _selectedTime!.format(context)
                            : 'Select time',
                        style: TextStyle(
                          color: _selectedTime != null
                              ? Colors.white
                              : Colors.white.withValues(alpha: 0.6),
                          fontSize: 14,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                      Icon(
                        LucideIcons.clock,
                        color: Colors.white.withValues(alpha: 0.6),
                        size: 20,
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // Desired Hourly Rate
              _buildLabel('Desired Hourly Rate'),
              const SizedBox(height: 8),
              _buildTextField(
                controller: _rateController,
                hint: 'Enter your rate',
                keyboardType: TextInputType.number,
                prefixText: '₹ ',
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your hourly rate';
                  }
                  return null;
                },
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
    String? prefixText,
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
        prefixText: prefixText,
        prefixStyle: const TextStyle(
          color: Colors.white,
          fontSize: 14,
        ),
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
