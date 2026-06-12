import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../widgets/common/primary_gradient_button.dart';

class AddressScreen extends StatefulWidget {
  const AddressScreen({super.key});

  @override
  State<AddressScreen> createState() => _AddressScreenState();
}

class _AddressScreenState extends State<AddressScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _mobileController = TextEditingController();
  final _pincodeController = TextEditingController();
  final _houseController = TextEditingController();
  final _addressController = TextEditingController();
  final _localityController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();

  bool useCurrentLocation = false;
  String selectedAddressType = 'home';

  @override
  void dispose() {
    _nameController.dispose();
    _mobileController.dispose();
    _pincodeController.dispose();
    _houseController.dispose();
    _addressController.dispose();
    _localityController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    super.dispose();
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hintText,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: const TextStyle(color: AppColors.textLightGray),
        filled: true,
        fillColor: AppColors.surfaceL4,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.all(16),
      ),
      validator: validator,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceL2,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => context.pop(),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceL4,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        LucideIcons.arrowLeft,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  const Text(
                    'Add Address',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),

            // Form Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Saved Address Toggle
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceL4,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Saved Address',
                              style:
                                  TextStyle(color: Colors.white, fontSize: 16),
                            ),
                            IconButton(
                              onPressed: () {},
                              icon: const Icon(
                                LucideIcons.plus,
                                color: AppColors.accentLimeBright,
                                size: 24,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Contact Details Section
                      const Text(
                        'Contact Details',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 16),

                      _buildTextField(
                        controller: _nameController,
                        hintText: 'Name',
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter your name';
                          }
                          return null;
                        },
                      ),

                      const SizedBox(height: 16),

                      _buildTextField(
                        controller: _mobileController,
                        hintText: 'Mobile No',
                        keyboardType: TextInputType.phone,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter your mobile number';
                          }
                          if (value.length != 10) {
                            return 'Please enter a valid 10-digit mobile number';
                          }
                          return null;
                        },
                      ),

                      const SizedBox(height: 24),

                      // Address Section
                      const Text(
                        'Address',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Use Current Location
                      Row(
                        children: [
                          Checkbox(
                            value: useCurrentLocation,
                            onChanged: (value) {
                              setState(() {
                                useCurrentLocation = value ?? false;
                              });
                            },
                            activeColor: AppColors.primary,
                            checkColor: Colors.black,
                          ),
                          const Text(
                            'Use my current address',
                            style: TextStyle(color: Colors.white, fontSize: 14),
                          ),
                          const Spacer(),
                          const Icon(
                            LucideIcons.mapPin,
                            color: AppColors.accentLimeBright,
                            size: 16,
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      _buildTextField(
                        controller: _pincodeController,
                        hintText: 'Pincode',
                        keyboardType: TextInputType.number,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter pincode';
                          }
                          return null;
                        },
                      ),

                      const SizedBox(height: 16),

                      _buildTextField(
                        controller: _houseController,
                        hintText: 'House Number/Tower/Block',
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter house number';
                          }
                          return null;
                        },
                      ),

                      const SizedBox(height: 16),

                      _buildTextField(
                        controller: _addressController,
                        hintText: 'Address',
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter address';
                          }
                          return null;
                        },
                      ),

                      const SizedBox(height: 16),

                      _buildTextField(
                        controller: _localityController,
                        hintText: 'Town / Locality',
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter locality';
                          }
                          return null;
                        },
                      ),

                      const SizedBox(height: 16),

                      // City and State Row
                      Row(
                        children: [
                          Expanded(
                            child: _buildTextField(
                              controller: _cityController,
                              hintText: 'City / District',
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Please enter city';
                                }
                                return null;
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildTextField(
                              controller: _stateController,
                              hintText: 'State',
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Please enter state';
                                }
                                return null;
                              },
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 24),

                      // Address Type Section
                      const Text(
                        'Address Type',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 16),

                      Row(
                        children: [
                          // Home Radio
                          Row(
                            children: [
                              Radio<String>(
                                value: 'home',
                                groupValue: selectedAddressType,
                                onChanged: (value) {
                                  if (value != null) {
                                    setState(() {
                                      selectedAddressType = value;
                                    });
                                  }
                                },
                                fillColor:
                                    WidgetStateProperty.all(AppColors.primary),
                              ),
                              const Icon(
                                LucideIcons.home,
                                color: Colors.white,
                                size: 16,
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                'Home',
                                style: TextStyle(color: Colors.white),
                              ),
                            ],
                          ),
                          const SizedBox(width: 32),
                          // Office Radio
                          Row(
                            children: [
                              Radio<String>(
                                value: 'office',
                                groupValue: selectedAddressType,
                                onChanged: (value) {
                                  if (value != null) {
                                    setState(() {
                                      selectedAddressType = value;
                                    });
                                  }
                                },
                                fillColor:
                                    WidgetStateProperty.all(AppColors.primary),
                              ),
                              const Icon(
                                Icons.business,
                                color: Colors.white,
                                size: 16,
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                'Office',
                                style: TextStyle(color: Colors.white),
                              ),
                            ],
                          ),
                        ],
                      ),

                      const SizedBox(height: 80), // Space for bottom button
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),

      // Continue Button
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: const BoxDecoration(
          color: AppColors.surfaceL4,
        ),
        child: PrimaryGradientButton(
          label: 'CONTINUE',
          height: 56,
          onPressed: () {
            if (_formKey.currentState?.validate() ?? false) {
              context.push('/payment');
            }
          },
        ),
      ),
    );
  }
}
