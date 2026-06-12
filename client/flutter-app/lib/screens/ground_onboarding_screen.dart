import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../core/constants/app_colors.dart';
import 'signature_screen.dart';
import '../widgets/common/bms_toast.dart';

class GroundOnboardingScreen extends StatefulWidget {
  const GroundOnboardingScreen({Key? key}) : super(key: key);

  @override
  State<GroundOnboardingScreen> createState() => _GroundOnboardingScreenState();
}

class _GroundOnboardingScreenState extends State<GroundOnboardingScreen> {
  final PageController _pageController = PageController();
  final ImagePicker _picker = ImagePicker();
  int _currentPage = 0;

  // Form controllers
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _businessNameController = TextEditingController();
  final _accountNoController = TextEditingController();
  final _reAccountNoController = TextEditingController();
  final _ifscController = TextEditingController();
  final _accountHolderController = TextEditingController();

  String? _aadharPath;
  String? _panPath;
  String? _chequePath;
  bool _agreedToTerms = false;
  bool _isSigned = false;

  @override
  void dispose() {
    _pageController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _businessNameController.dispose();
    _accountNoController.dispose();
    _reAccountNoController.dispose();
    _ifscController.dispose();
    _accountHolderController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(Function(String) onPicked) async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1024,
      maxHeight: 1024,
    );

    if (image != null) {
      onPicked(image.path);
      setState(() {});
    }
  }

  void _nextPage() {
    if (_currentPage < 2) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _previousPage() {
    _pageController.previousPage(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  void _openSignatureScreen() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const SignatureScreen(),
      ),
    );

    if (result == true && mounted) {
      setState(() {
        _isSigned = true;
      });
    }
  }

  void _submitApplication() {
    if (!_agreedToTerms) {
      BmsToast.error(context, 'Please accept the service agreement');
      return;
    }

    // TODO: Submit to backend

    // Navigate to success screen
    context.go('/application-review');
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
            if (_currentPage > 0) {
              _previousPage();
            } else {
              context.pop();
            }
          },
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              onPageChanged: (page) {
                setState(() {
                  _currentPage = page;
                });
              },
              children: [
                _buildOwnerRegistrationPage(),
                _buildDocumentsPage(),
                _buildServiceAgreementPage(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOwnerRegistrationPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Ground Owner\nRegistration',
            style: TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.w700,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Complete the steps below to list\nyour ground',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.6),
              fontSize: 14,
              fontWeight: FontWeight.w400,
            ),
          ),
          const SizedBox(height: 40),
          _buildTextField(
            controller: _nameController,
            label: 'YOUR NAME',
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _phoneController,
            label: 'PHONE NO',
            keyboardType: TextInputType.phone,
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _emailController,
            label: 'EMAIL ADDRESS',
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _businessNameController,
            label: 'BUSINESS NAME',
          ),
          const SizedBox(height: 40),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _nextPage,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.black,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'Continue',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDocumentsPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Upload\nDocuments',
            style: TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.w700,
              height: 1.2,
            ),
          ),

          const SizedBox(height: 40),

          // Aadhar Card
          _buildDocumentUpload(
            label: 'AADHAR CARD',
            isUploaded: _aadharPath != null,
            onTap: () => _pickImage((path) => _aadharPath = path),
          ),

          const SizedBox(height: 16),

          // PAN Card
          _buildDocumentUpload(
            label: 'PAN CARD',
            isUploaded: _panPath != null,
            onTap: () => _pickImage((path) => _panPath = path),
          ),

          const SizedBox(height: 32),

          // Bank Details Header
          const Text(
            'BANK DETAILS',
            style: TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
          ),

          const SizedBox(height: 16),

          _buildTextField(
            controller: _accountNoController,
            label: 'ACCOUNT NO',
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _reAccountNoController,
            label: 'RE ENTER ACCOUNT NO',
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _ifscController,
            label: 'IFS CODE',
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _accountHolderController,
            label: 'ACCOUNT HOLDER NAME',
          ),

          const SizedBox(height: 16),

          // Upload Cancelled Cheque
          _buildDocumentUpload(
            label: 'UPLOAD CANCELLED CHEQUE',
            isUploaded: _chequePath != null,
            onTap: () => _pickImage((path) => _chequePath = path),
          ),

          const SizedBox(height: 40),

          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _nextPage,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.black,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'Continue',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildServiceAgreementPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Service\nAgreement',
            style: TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.w700,
              height: 1.2,
            ),
          ),

          const SizedBox(height: 32),

          // Terms and Conditions Box
          Container(
            height: 400,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.backgroundCard,
              borderRadius: BorderRadius.circular(12),
            ),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Ground Owner Terms & Conditions',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'This agreement outlines the terms between BookMyGround and the ground owner for listing and managing sports venues on the platform.\n\n'
                    '1. Listing Requirements\n'
                    'The owner agrees to provide accurate information about the venue, including pricing, facilities, and availability.\n\n'
                    '2. Commission Structure\n'
                    'BookMyGround will charge a 10% commission on all online bookings made through the platform.\n\n'
                    '3. Payment Terms\n'
                    'Payments will be settled on a bi-weekly basis to the owner\'s registered bank account.\n\n'
                    '4. Cancellation Policy\n'
                    'The owner must honor all confirmed bookings unless there are exceptional circumstances.\n\n'
                    '5. Quality Standards\n'
                    'The venue must maintain the standards advertised on the platform.\n\n'
                    '6. Liability\n'
                    'The owner is responsible for ensuring the safety and maintenance of the facility.',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.8),
                      fontSize: 12,
                      fontWeight: FontWeight.w400,
                      height: 1.6,
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 24),

          // Show different buttons based on signature status
          if (!_isSigned) ...[
            // Checkbox
            Row(
              children: [
                Checkbox(
                  value: _agreedToTerms,
                  onChanged: (value) {
                    setState(() {
                      _agreedToTerms = value ?? false;
                    });
                  },
                  activeColor: AppColors.primary,
                  checkColor: Colors.black,
                  side: BorderSide(
                    color: Colors.white.withValues(alpha: 0.5),
                  ),
                ),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'I accept this service agreement',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 32),

            // Digital Sign Button
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _agreedToTerms ? _openSignatureScreen : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _agreedToTerms
                      ? AppColors.borderGray
                      : AppColors.backgroundCard,
                  foregroundColor: AppColors.primary,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'Digital Sign Document',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ] else ...[
            // After signing - show Download and Submit buttons
            SizedBox(
              width: double.infinity,
              height: 56,
              child: OutlinedButton(
                onPressed: () {
                  HapticFeedback.lightImpact();
                  // TODO: Download agreement
                  BmsToast.info(context, 'Downloading agreement…');
                },
                style: OutlinedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  side: BorderSide(
                    color: AppColors.primary,
                    width: 2,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  'DOWNLOAD AGREEMENT',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ),

            const SizedBox(height: 40),

            // Submit Application Button
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
                  'SUBMIT APPLICATION',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
          ),
          decoration: InputDecoration(
            hintText: label,
            hintStyle: TextStyle(
              color: Colors.white.withValues(alpha: 0.4),
              fontSize: 12,
              fontWeight: FontWeight.w500,
              letterSpacing: 0.5,
            ),
            filled: true,
            fillColor: AppColors.surfaceL4,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.borderGray),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.borderGray),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: AppColors.primary, width: 2),
            ),
            contentPadding: const EdgeInsets.all(16),
          ),
        ),
      ],
    );
  }

  Widget _buildDocumentUpload({
    required String label,
    required bool isUploaded,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surfaceL4,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isUploaded ? AppColors.primary : AppColors.borderGray,
            width: isUploaded ? 2 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.8),
                fontSize: 12,
                fontWeight: FontWeight.w500,
                letterSpacing: 0.5,
              ),
            ),
            Icon(
              isUploaded ? LucideIcons.checkCircle : LucideIcons.camera,
              color: isUploaded
                  ? AppColors.primary
                  : Colors.white.withValues(alpha: 0.6),
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}
