import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../services/content_services.dart';
import '../widgets/common/bms_toast.dart';
import '../widgets/common/primary_gradient_button.dart';

class RaiseDisputeScreen extends StatefulWidget {
  /// Optional booking or game id the dispute is attached to.
  final String? bookingId;
  final String? gameId;
  const RaiseDisputeScreen({super.key, this.bookingId, this.gameId});

  @override
  State<RaiseDisputeScreen> createState() => _RaiseDisputeScreenState();
}

class _RaiseDisputeScreenState extends State<RaiseDisputeScreen> {
  final _subjectCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _subjectCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_subjectCtrl.text.trim().isEmpty || _descCtrl.text.trim().isEmpty) {
      BmsToast.error(context, 'Subject and description are required');
      return;
    }
    setState(() => _loading = true);
    final ok = await DisputeService().raise(
      subject: _subjectCtrl.text.trim(),
      description: _descCtrl.text.trim(),
      bookingId: widget.bookingId,
      gameId: widget.gameId,
    );
    if (!mounted) return;
    setState(() => _loading = false);
    if (ok) {
      BmsToast.success(context, 'Dispute submitted — our team will reach out');
      context.pop(true);
    } else {
      BmsToast.error(context, 'Failed to submit dispute');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text('Raise a Dispute',
            style: TextStyle(color: Colors.white)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Subject',
                style: TextStyle(color: Colors.white70, fontSize: 13)),
            const SizedBox(height: 8),
            _input(_subjectCtrl, 'Briefly summarise the issue'),
            const SizedBox(height: 18),
            const Text('Description',
                style: TextStyle(color: Colors.white70, fontSize: 13)),
            const SizedBox(height: 8),
            _input(
                _descCtrl, 'What happened? Dates, names, what we should know.',
                lines: 6),
            const SizedBox(height: 24),
            PrimaryGradientButton(
              label: 'SUBMIT DISPUTE',
              isLoading: _loading,
              onPressed: _loading ? null : _submit,
              height: 56,
            ),
            const SizedBox(height: 16),
            const Text(
              'Disputes are reviewed within 48 hours. You will receive '
              'a notification once a support agent picks up the case.',
              style: TextStyle(color: Colors.white38, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _input(TextEditingController c, String hint, {int lines = 1}) =>
      Container(
        decoration: BoxDecoration(
          color: AppColors.surfaceL1,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.borderSoft),
        ),
        child: TextField(
          controller: c,
          maxLines: lines,
          minLines: lines,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            border: InputBorder.none,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            hintText: hint,
            hintStyle: const TextStyle(color: Colors.white30),
          ),
        ),
      );
}
