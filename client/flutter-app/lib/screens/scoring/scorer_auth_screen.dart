import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../services/scoring_service.dart';
import '../../widgets/common/bms_toast.dart';

/// Gate for the scoring console — the host sets a scoring password when
/// they create the match; the umpire/scorer enters it here and we trade
/// it for an 8h scorer JWT via `POST /scoring/auth/:gameId`.
///
/// Currently we keep the token in memory and forward it on the route
/// extra so the scoring screen can attach it to its socket session. A
/// future pass can mirror it into SecureTokenStore.
class ScorerAuthScreen extends StatefulWidget {
  const ScorerAuthScreen({super.key, required this.gameId});
  final String gameId;

  @override
  State<ScorerAuthScreen> createState() => _ScorerAuthScreenState();
}

class _ScorerAuthScreenState extends State<ScorerAuthScreen> {
  final _scoring = ScoringService();
  final _password = TextEditingController();
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final pwd = _password.text.trim();
    if (pwd.isEmpty) {
      setState(() => _error = 'Enter the scoring password');
      return;
    }
    HapticFeedback.mediumImpact();
    setState(() {
      _submitting = true;
      _error = null;
    });
    final res =
        await _scoring.authenticateScorer(gameId: widget.gameId, password: pwd);
    if (!mounted) return;
    setState(() => _submitting = false);
    if (res.ok) {
      BmsToast.success(context, 'Scorer session active');
      context.go('/scoring/${widget.gameId}', extra: {'scorerToken': res.data});
    } else {
      setState(() => _error = res.error ?? 'Authentication failed');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Scorer sign in',
            style: TextStyle(color: Colors.white, fontFamily: 'Poppins')),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Enter the password the host set when creating this match.',
                style: TextStyle(
                    color: Colors.white70, fontSize: 14, fontFamily: 'Poppins'),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _password,
                obscureText: true,
                style:
                    const TextStyle(color: Colors.white, fontFamily: 'Poppins'),
                onSubmitted: (_) => _submit(),
                decoration: InputDecoration(
                  hintText: 'SCORING PASSWORD',
                  hintStyle: const TextStyle(
                      color: Colors.white38,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'Poppins'),
                  filled: true,
                  fillColor: const Color(0xFFF9FAFB),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(28),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 22, vertical: 18),
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!,
                    style: const TextStyle(
                        color: Color(0xFFEF4444),
                        fontSize: 12,
                        fontFamily: 'Poppins')),
              ],
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF7CFE6A),
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(28)),
                  ),
                  child: _submitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.black))
                      : const Text('CONTINUE',
                          style: TextStyle(
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.2,
                              fontFamily: 'Poppins')),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
