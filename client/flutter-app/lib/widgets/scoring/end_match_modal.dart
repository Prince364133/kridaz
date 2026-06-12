import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'scoring_theme.dart';

/// Port of `EndMatchModal.jsx`. Confirms the user wants to finalise the match.
/// When [hasPassword] is true, the user must enter the scoring password.
class EndMatchModal extends StatefulWidget {
  final bool hasPassword;
  final void Function(String? password) onConfirm;
  final VoidCallback onClose;

  const EndMatchModal({
    super.key,
    this.hasPassword = false,
    required this.onConfirm,
    required this.onClose,
  });

  @override
  State<EndMatchModal> createState() => _EndMatchModalState();
}

class _EndMatchModalState extends State<EndMatchModal> {
  final _password = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black.withValues(alpha: 0.9),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                constraints: const BoxConstraints(maxWidth: 380),
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(12),
                  border:
                      Border.all(color: Colors.white.withValues(alpha: 0.05)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.fromLTRB(24, 24, 24, 20),
                      decoration: BoxDecoration(
                        border: Border(
                            bottom: BorderSide(
                                color: Colors.white.withValues(alpha: 0.05))),
                      ),
                      child: Row(
                        children: [
                          Icon(
                              widget.hasPassword
                                  ? LucideIcons.lock
                                  : LucideIcons.checkCircle2,
                              color: ScoringTheme.theme,
                              size: 20),
                          const SizedBox(width: 12),
                          const Text('END MATCH',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -0.5)),
                        ],
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                              (widget.hasPassword
                                      ? 'This match is protected. Enter the scoring password to end the match.'
                                      : 'Are you sure you want to end this match? This action cannot be undone.')
                                  .toUpperCase(),
                              style: const TextStyle(
                                  color: Colors.white54,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 1.5,
                                  height: 1.5)),
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
                                hintText: 'Enter Password...',
                                hintStyle:
                                    const TextStyle(color: Colors.white24),
                                filled: true,
                                fillColor: Colors.white.withValues(alpha: 0.02),
                                contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 20, vertical: 18),
                                border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                    borderSide: BorderSide(
                                        color: Colors.white
                                            .withValues(alpha: 0.1))),
                                enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                    borderSide: BorderSide(
                                        color: Colors.white
                                            .withValues(alpha: 0.1))),
                              ),
                            ),
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
                                      backgroundColor:
                                          ScoringTheme.bgControlBar,
                                      side: BorderSide(
                                          color: Colors.white
                                              .withValues(alpha: 0.05)),
                                      shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(8)),
                                    ),
                                    child: const Text('BACK',
                                        style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w900,
                                            letterSpacing: 2.4)),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                flex: 2,
                                child: SizedBox(
                                  height: 52,
                                  child: ElevatedButton(
                                    onPressed: _loading
                                        ? null
                                        : () {
                                            HapticFeedback.mediumImpact();
                                            setState(() => _loading = true);
                                            widget.onConfirm(widget.hasPassword
                                                ? _password.text
                                                : null);
                                          },
                                    style: ElevatedButton.styleFrom(
                                      foregroundColor: Colors.black,
                                      backgroundColor: ScoringTheme.theme,
                                      shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(8)),
                                    ),
                                    child: _loading
                                        ? const SizedBox(
                                            width: 18,
                                            height: 18,
                                            child: CircularProgressIndicator(
                                                color: Colors.black,
                                                strokeWidth: 2))
                                        : const Text('END MATCH',
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
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
