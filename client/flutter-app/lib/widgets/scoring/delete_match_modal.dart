import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'scoring_theme.dart';

/// Confirm-with-password dialog for permanently deleting a match.
/// Port of `DeleteMatchModal.jsx`.
class DeleteMatchModal extends StatefulWidget {
  final bool hasPassword;
  final Future<bool> Function(String? password) onDelete;
  final VoidCallback onClose;

  const DeleteMatchModal({
    super.key,
    this.hasPassword = false,
    required this.onDelete,
    required this.onClose,
  });

  @override
  State<DeleteMatchModal> createState() => _DeleteMatchModalState();
}

class _DeleteMatchModalState extends State<DeleteMatchModal> {
  final _password = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _password.dispose();
    super.dispose();
  }

  Future<void> _confirm() async {
    if (widget.hasPassword && _password.text.trim().isEmpty) {
      setState(() => _error = 'Password is required');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    final ok = await widget
        .onDelete(widget.hasPassword ? _password.text.trim() : null);
    if (!mounted) return;
    if (!ok) {
      setState(() {
        _loading = false;
        _error = 'Delete failed. Check the password and try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black.withValues(alpha: 0.95),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: Container(
              constraints: const BoxConstraints(maxWidth: 380),
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                              color: const Color(0xFFEF4444)
                                  .withValues(alpha: 0.3)),
                        ),
                        child: const Icon(LucideIcons.trash2,
                            color: Color(0xFFEF4444), size: 18),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text('DELETE MATCH?',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.5)),
                      ),
                      GestureDetector(
                        onTap: widget.onClose,
                        child: const Icon(LucideIcons.x,
                            color: Colors.white54, size: 18),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'THIS WILL PERMANENTLY DELETE THE MATCH, ITS SCORING SESSION, AND ALL PLAYER STATISTICS. THIS CANNOT BE UNDONE.',
                    style: TextStyle(
                        color: Color(0xFFCBD5E1),
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.5,
                        height: 1.6),
                  ),
                  if (widget.hasPassword) ...[
                    const SizedBox(height: 20),
                    TextField(
                      controller: _password,
                      obscureText: true,
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 3),
                      decoration: InputDecoration(
                        hintText: 'Enter scoring password...',
                        hintStyle: const TextStyle(color: Colors.white24),
                        filled: true,
                        fillColor: Colors.white.withValues(alpha: 0.02),
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 16),
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: BorderSide(
                                color: Colors.white.withValues(alpha: 0.1))),
                        enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: BorderSide(
                                color: Colors.white.withValues(alpha: 0.1))),
                      ),
                    ),
                  ],
                  if (_error != null) ...[
                    const SizedBox(height: 8),
                    Text(_error!.toUpperCase(),
                        style: const TextStyle(
                            color: Color(0xFFEF4444),
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 2)),
                  ],
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: SizedBox(
                          height: 52,
                          child: OutlinedButton(
                            onPressed: _loading ? null : widget.onClose,
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.white54,
                              backgroundColor: ScoringTheme.bgControlBar,
                              side: BorderSide(
                                  color: Colors.white.withValues(alpha: 0.05)),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8)),
                            ),
                            child: const Text('CANCEL',
                                style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 2.4)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: SizedBox(
                          height: 52,
                          child: ElevatedButton(
                            onPressed: _loading
                                ? null
                                : () {
                                    HapticFeedback.mediumImpact();
                                    _confirm();
                                  },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFDC2626),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8)),
                            ),
                            child: _loading
                                ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(
                                        color: Colors.white, strokeWidth: 2))
                                : const Text('DELETE',
                                    style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 2.4)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
