import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'scoring_theme.dart';

/// Port of `ScoringPasswordModal.jsx`. Unlocks a password-protected scoring
/// console. The actual verification call is delegated to the caller — this
/// widget only collects the password and reports loading/error state.
class ScoringPasswordModal extends StatefulWidget {
  final String actionLabel;
  final Future<String?> Function(String password) onVerify;
  final void Function(String token) onSuccess;
  final VoidCallback? onClose;

  const ScoringPasswordModal({
    super.key,
    this.actionLabel = 'Unlock Scoring App',
    required this.onVerify,
    required this.onSuccess,
    this.onClose,
  });

  @override
  State<ScoringPasswordModal> createState() => _ScoringPasswordModalState();
}

class _ScoringPasswordModalState extends State<ScoringPasswordModal> {
  final _ctrl = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final pw = _ctrl.text.trim();
    if (pw.isEmpty) {
      setState(() => _error = 'Password is required');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final token = await widget.onVerify(pw);
      if (!mounted) return;
      if (token != null) {
        widget.onSuccess(token);
      } else {
        setState(() {
          _error = 'Incorrect password';
          _loading = false;
        });
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Network error. Please try again.';
        _loading = false;
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
              padding: const EdgeInsets.all(32),
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
                      const Icon(LucideIcons.lock,
                          color: ScoringTheme.theme, size: 24),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text('AUTH',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.5)),
                      ),
                      if (widget.onClose != null)
                        GestureDetector(
                          onTap: widget.onClose,
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.05),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(LucideIcons.x,
                                color: Colors.white54, size: 18),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Text(widget.actionLabel.toUpperCase(),
                      style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2.4)),
                  const SizedBox(height: 6),
                  const Text(
                    'THIS MATCH IS PROTECTED. ENTER THE SCORING PASSWORD TO PROCEED.',
                    style: TextStyle(
                        color: Color(0xFF666666),
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 2,
                        height: 1.6),
                  ),
                  const SizedBox(height: 24),
                  TextField(
                    controller: _ctrl,
                    obscureText: true,
                    autofocus: true,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 3),
                    decoration: InputDecoration(
                      hintText: 'Enter Password...',
                      hintStyle: const TextStyle(color: Colors.white24),
                      filled: true,
                      fillColor: Colors.white.withValues(alpha: 0.02),
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 18),
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(
                              color: Colors.white.withValues(alpha: 0.1))),
                      enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(
                              color: Colors.white.withValues(alpha: 0.1))),
                      focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide:
                              const BorderSide(color: ScoringTheme.theme)),
                    ),
                    onSubmitted: (_) => _submit(),
                  ),
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
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _loading
                          ? null
                          : () {
                              HapticFeedback.mediumImpact();
                              _submit();
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: ScoringTheme.theme,
                        foregroundColor: Colors.black,
                        disabledBackgroundColor:
                            ScoringTheme.theme.withValues(alpha: 0.5),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                      ),
                      child: _loading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                  color: Colors.black, strokeWidth: 2))
                          : const Text('AUTHENTICATE',
                              style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 2.4)),
                    ),
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
