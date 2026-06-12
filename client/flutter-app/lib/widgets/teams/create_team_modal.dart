import 'dart:io';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/team_provider.dart';
import '../../services/team_service.dart';

const _sports = [
  'Cricket',
  'Football',
  'Badminton',
  'Volleyball',
  'Basketball',
];

class CreateTeamModal extends ConsumerStatefulWidget {
  final String? teamId;
  final Map<String, dynamic>? initialValues;
  final VoidCallback onSuccess;

  const CreateTeamModal({
    super.key,
    this.teamId,
    this.initialValues,
    required this.onSuccess,
  });

  @override
  ConsumerState<CreateTeamModal> createState() => _CreateTeamModalState();
}

class _CreateTeamModalState extends ConsumerState<CreateTeamModal> {
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  String _sport = 'Cricket';
  File? _imageFile;
  bool _loading = false;
  String? _error;

  bool get _isEdit => widget.teamId != null;

  @override
  void initState() {
    super.initState();
    if (widget.initialValues != null) {
      _nameCtrl.text = widget.initialValues!['name'] ?? '';
      _descCtrl.text = widget.initialValues!['description'] ?? '';
      _cityCtrl.text = widget.initialValues!['city'] ?? '';
      _sport = widget.initialValues!['sportType'] ?? 'Cricket';
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    _cityCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery);
    if (picked != null) setState(() => _imageFile = File(picked.path));
  }

  Future<void> _submit() async {
    if (_nameCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Team name is required');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final payload = {
        'name': _nameCtrl.text.trim(),
        if (_descCtrl.text.trim().isNotEmpty)
          'description': _descCtrl.text.trim(),
        'sportType': _sport,
        if (_cityCtrl.text.trim().isNotEmpty) 'city': _cityCtrl.text.trim(),
      };
      if (_isEdit) {
        await TeamService().updateTeam(widget.teamId!, payload);
      } else {
        await TeamService().createTeam(payload);
      }
      ref.invalidate(myTeamsProvider);
      if (mounted) context.pop();
      widget.onSuccess();
    } catch (e) {
      setState(() {
        _loading = false;
        _error = 'Failed to save team. Try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surfaceL1,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              _isEdit ? 'Edit Team' : 'Create Team',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w700,
                fontFamily: 'Poppins',
              ),
            ),
            const SizedBox(height: 20),
            _logoRow(),
            const SizedBox(height: 16),
            _field('Team Name *', _nameCtrl),
            const SizedBox(height: 12),
            _field('Description', _descCtrl, maxLines: 2, maxLength: 200),
            const SizedBox(height: 12),
            _sportDropdown(),
            const SizedBox(height: 12),
            _field('City', _cityCtrl),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.25)),
              ),
              child: const Text(
                'Captain, Vice Captain and playing roles are assigned by tapping a member after they join the team.',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 12.5,
                  fontFamily: 'Poppins',
                ),
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!,
                  style:
                      const TextStyle(color: Colors.redAccent, fontSize: 13)),
            ],
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _loading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
                child: _loading
                    ? const CircularProgressIndicator(
                        color: Colors.black, strokeWidth: 2)
                    : Text(
                        _isEdit ? 'Save Changes' : 'Create Team',
                        style: const TextStyle(
                          color: Colors.black,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'Poppins',
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _logoRow() {
    return Row(
      children: [
        GestureDetector(
          onTap: _pickImage,
          child: Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: AppColors.surfaceL3,
              borderRadius: BorderRadius.circular(14),
              border:
                  Border.all(color: AppColors.primary.withValues(alpha: 0.4)),
            ),
            child: _imageFile != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: Image.file(_imageFile!, fit: BoxFit.cover),
                  )
                : const Icon(LucideIcons.camera,
                    color: AppColors.primary, size: 28),
          ),
        ),
        const SizedBox(width: 14),
        const Text(
          'Tap to add\nteam logo',
          style: TextStyle(
              color: Colors.white54, fontSize: 13, fontFamily: 'Poppins'),
        ),
      ],
    );
  }

  Widget _field(
    String hint,
    TextEditingController ctrl, {
    int maxLines = 1,
    int? maxLength,
    TextInputType? keyboardType,
  }) {
    return TextField(
      controller: ctrl,
      maxLines: maxLines,
      maxLength: maxLength,
      keyboardType: keyboardType,
      style: const TextStyle(color: Colors.white, fontFamily: 'Poppins'),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle:
            const TextStyle(color: Colors.white38, fontFamily: 'Poppins'),
        filled: true,
        fillColor: AppColors.surfaceL3,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.white12),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.white12),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary),
        ),
        counterStyle: const TextStyle(color: Colors.white38),
      ),
    );
  }

  Widget _sportDropdown() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: AppColors.surfaceL3,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _sport,
          isExpanded: true,
          dropdownColor: AppColors.surfaceL3,
          style: const TextStyle(color: Colors.white, fontFamily: 'Poppins'),
          items: _sports
              .map((s) => DropdownMenuItem(value: s, child: Text(s)))
              .toList(),
          onChanged: (v) => setState(() => _sport = v!),
        ),
      ),
    );
  }
}
