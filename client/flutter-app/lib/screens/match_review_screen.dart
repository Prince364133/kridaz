import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../core/constants/app_colors.dart';
import '../models/pending_match_model.dart';
import '../providers/pending_matches_provider.dart';
import '../services/scoring_service.dart';
import '../widgets/scoring/toss_modal.dart';

/// Review + password-gate screen for a match the user created via the
/// 5-step Start Scoring wizard. Mirrors the web flow:
///
///   1. wizard creates the match on the backend
///   2. match shows up on the Games screen above Recent Scores
///   3. creator taps it, reviews everything, enters the scoring password
///   4. backend exchanges the password for a scorer JWT → live scorer opens
class MatchReviewScreen extends ConsumerStatefulWidget {
  final String matchId;
  const MatchReviewScreen({super.key, required this.matchId});

  @override
  ConsumerState<MatchReviewScreen> createState() => _MatchReviewScreenState();
}

class _MatchReviewScreenState extends ConsumerState<MatchReviewScreen> {
  final _passwordCtrl = TextEditingController();
  bool _obscure = true;
  bool _starting = false;
  String? _error;
  // True when the backend reports an active scoring session for this match.
  // When set, we skip the toss flow and route straight to /scoring on tap so
  // re-entering an in-progress match doesn't ask for a second toss.
  bool _sessionAlreadyStarted = false;

  @override
  void initState() {
    super.initState();
    _refreshSessionFlag();
  }

  @override
  void dispose() {
    _passwordCtrl.dispose();
    super.dispose();
  }

  /// Hits `/scoring/status/:matchId` and sets [_sessionAlreadyStarted] when
  /// the backend already has a live `scoring` session. Silent on failure —
  /// the worst case is we ask the user to redo the toss, which the scoring
  /// screen would have asked for anyway.
  Future<void> _refreshSessionFlag() async {
    final res = await ScoringService().getMatchStatus(widget.matchId);
    if (!mounted) return;
    if (res.ok && res.data?.session != null) {
      setState(() => _sessionAlreadyStarted = true);
    }
  }

  PendingMatch? _findMatch() {
    final list = ref.read(pendingMatchesProvider);
    for (final m in list) {
      if (m.matchId == widget.matchId) return m;
    }
    return null;
  }

  Future<void> _start(PendingMatch m) async {
    final password = _passwordCtrl.text.trim();
    if (m.hasScoringPassword && password.isEmpty) {
      setState(() => _error = 'Enter the scoring password to continue');
      return;
    }
    setState(() {
      _starting = true;
      _error = null;
    });

    // If the host set a password during creation, exchange it for a scorer
    // JWT first. No password set → skip the auth call entirely (the backend
    // treats open scoring as anyone-can-score).
    if (m.hasScoringPassword) {
      final auth = await ScoringService().authenticateScorer(
        gameId: m.matchId,
        password: password,
      );
      if (!mounted) return;
      if (!auth.ok) {
        setState(() {
          _starting = false;
          _error = auth.error ?? 'Wrong password';
        });
        return;
      }
    }

    HapticFeedback.mediumImpact();

    // Re-check the backend in case the match was started since the screen
    // opened (e.g. another device started it, or the user already tossed and
    // is just resuming). If a session exists, skip the toss entirely and let
    // the scoring screen continue from wherever the live state is.
    final status = await ScoringService().getMatchStatus(m.matchId);
    final sessionStarted = status.ok && status.data?.session != null;
    if (!mounted) return;
    if (sessionStarted) {
      _sessionAlreadyStarted = true;
    }

    // Decide the toss inline so the scoring screen can auto-start the match
    // and skip its own pre-match info card — review + toss + start are now
    // one continuous flow on this screen.
    String? tossWinner = m.tossWinner;
    String? tossDecision = (m.tossWinner != null) ? m.tossDecision : null;
    if (!sessionStarted && tossWinner == null) {
      final toss = await _runTossFlow(m);
      if (!mounted) return;
      if (toss == null) {
        // User backed out of the toss — leave the review screen interactive
        // so they can re-tap Start Match.
        setState(() => _starting = false);
        return;
      }
      tossWinner = toss.winnerKey;
      tossDecision = toss.decision;
    }

    // Do NOT remove the pending match here — the card stays on Games until
    // the backend reports the match as COMPLETED (or the user discards it).
    if (!mounted) return;
    context.pushReplacement('/scoring', extra: {
      'matchId': m.matchId,
      'sport': 'Cricket',
      'teamA': m.teamAName,
      'teamB': m.teamBName,
      'location': m.location,
      // Pre-set format/overs so any fallback view never has to guess.
      'format': m.format,
      'overs': m.overs,
      if (tossWinner != null) 'tossWinner': tossWinner,
      if (tossDecision != null) 'tossDecision': tossDecision,
    });
  }

  /// Pushes the [TossModal] as a full-screen page and resolves with the
  /// chosen winner + decision. Returns `null` if the user dismissed without
  /// completing the toss.
  Future<TossResult?> _runTossFlow(PendingMatch m) async {
    TossResult? result;
    await Navigator.of(context).push(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => TossModal(
          teamAName: m.teamAName,
          teamBName: m.teamBName,
          hasPassword: false,
          onConfirm: (r) async {
            result = r;
            Navigator.of(context).pop();
          },
        ),
      ),
    );
    if (result == null) return null;
    // The toss can be "skipped" inside the modal which yields a TossResult
    // with nulls. Treat that as no-toss so the scoring screen falls back to
    // its own toss flow rather than auto-starting with default batting.
    if (result!.winnerKey == null || result!.decision == null) return null;
    return result;
  }

  void _confirmDiscard(PendingMatch m) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.surfaceL3,
        title: const Text('Discard match?',
            style: TextStyle(color: Colors.white, fontFamily: 'Poppins')),
        content: const Text(
          'This removes the match from your Ready to Start list. The match record on the server is kept — your backend dev can clean it up.',
          style: TextStyle(color: Colors.white70, fontFamily: 'Poppins'),
        ),
        actions: [
          TextButton(
            onPressed: () => context.pop(),
            child:
                const Text('Cancel', style: TextStyle(color: Colors.white54)),
          ),
          TextButton(
            onPressed: () async {
              context.pop();
              await ref.read(pendingMatchesProvider.notifier).remove(m.matchId);
              if (mounted) context.pop();
            },
            child: const Text('Discard',
                style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Watch so we react if the match is removed elsewhere.
    ref.watch(pendingMatchesProvider);
    final m = _findMatch();
    if (m == null) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: _appBar(null),
        body: const _NotFoundView(),
      );
    }
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: _appBar(m),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _headerCard(m),
              const SizedBox(height: 16),
              _block('MATCH', [
                _kv('Name', m.matchName),
                _kv('Format', _formatLabel(m)),
                _kv('Powerplay', '${m.powerPlayOvers} overs'),
                _kv('Players per side', '${m.maxMembers}'),
                _kv('Ball', m.ballType),
                _kv('Ground', m.groundType),
                _kv('Timing', m.timing),
                _kv('Pitch', m.pitchType),
                if (m.matchDate != null)
                  _kv('Scheduled', _formatDate(m.matchDate!)),
                if (m.venueName.isNotEmpty) _kv('Venue', m.venueName),
              ]),
              const SizedBox(height: 16),
              _block('TEAMS', [
                _kv('Team A',
                    '${m.teamAName}  •  ${m.teamAPlayerCount} players'),
                _kv('Team B',
                    '${m.teamBName}  •  ${m.teamBPlayerCount} players'),
              ]),
              if (m.umpireName != null ||
                  m.scorerName != null ||
                  m.streamerName != null) ...[
                const SizedBox(height: 16),
                _block('OFFICIALS', [
                  if (m.umpireName != null) _kv('Umpire', m.umpireName!),
                  if (m.scorerName != null) _kv('Scorer', m.scorerName!),
                  if (m.streamerName != null) _kv('Streamer', m.streamerName!),
                ]),
              ],
              if (m.youtubeLiveUrl != null) ...[
                const SizedBox(height: 16),
                _block('STREAMING', [
                  _kv('YouTube', m.youtubeLiveUrl!),
                ]),
              ],
              if (m.tossWinner != null) ...[
                const SizedBox(height: 16),
                _block('TOSS', [
                  _kv('Won by',
                      m.tossWinner == 'teamA' ? m.teamAName : m.teamBName),
                  _kv('Decision', m.tossDecision),
                ]),
              ],
              const SizedBox(height: 24),
              _passwordSection(m),
              const SizedBox(height: 20),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(
                    _error!,
                    style: const TextStyle(
                      color: Colors.redAccent,
                      fontSize: 13,
                      fontFamily: 'Poppins',
                    ),
                  ),
                ),
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: _starting ? null : () => _start(m),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _starting
                      ? const CircularProgressIndicator(
                          color: Colors.black, strokeWidth: 2)
                      : Text(
                          _sessionAlreadyStarted
                              ? 'Resume Scoring'
                              : (m.tossWinner == null
                                  ? 'Continue to Toss'
                                  : 'Start Match'),
                          style: const TextStyle(
                            color: Colors.black,
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            fontFamily: 'Poppins',
                            letterSpacing: 0.4,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: OutlinedButton(
                  onPressed: _starting ? null : () => _confirmDiscard(m),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.white24),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text(
                    'Discard',
                    style: TextStyle(
                      color: Colors.white54,
                      fontSize: 14,
                      fontFamily: 'Poppins',
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  PreferredSizeWidget _appBar(PendingMatch? m) {
    return AppBar(
      backgroundColor: Colors.black,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(LucideIcons.chevronLeft, color: Colors.white),
        onPressed: () => context.pop(),
      ),
      title: Text(
        m == null ? 'Review' : 'Review & Start',
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w700,
          fontFamily: 'Poppins',
        ),
      ),
    );
  }

  Widget _headerCard(PendingMatch m) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withValues(alpha: 0.18),
            AppColors.primary.withValues(alpha: 0.04),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.flagTriangleRight,
                  color: AppColors.primary, size: 18),
              const SizedBox(width: 8),
              const Text(
                'READY TO START',
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                  fontFamily: 'Poppins',
                ),
              ),
              const Spacer(),
              Text(
                'Created ${_relativeTime(m.createdAt)}',
                style: const TextStyle(
                  color: Colors.white54,
                  fontSize: 11,
                  fontFamily: 'Poppins',
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            m.matchName,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w800,
              fontFamily: 'Poppins',
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${m.teamAName}  vs  ${m.teamBName}',
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 14,
              fontFamily: 'Poppins',
            ),
          ),
        ],
      ),
    );
  }

  Widget _passwordSection(PendingMatch m) {
    if (!m.hasScoringPassword) {
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white12),
        ),
        child: const Row(
          children: [
            Icon(LucideIcons.unlock, color: Colors.white54, size: 18),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'No scoring password set — tap Start Match to open the scorer.',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 13,
                  fontFamily: 'Poppins',
                ),
              ),
            ),
          ],
        ),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'SCORING PASSWORD',
          style: TextStyle(
            color: AppColors.primary,
            fontSize: 11,
            fontWeight: FontWeight.w900,
            letterSpacing: 2,
            fontFamily: 'Poppins',
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _passwordCtrl,
          obscureText: _obscure,
          style: const TextStyle(
            color: Colors.white,
            fontFamily: 'Poppins',
            fontSize: 15,
            fontWeight: FontWeight.w600,
            letterSpacing: 1.5,
          ),
          decoration: InputDecoration(
            hintText: 'Enter the password you set during creation',
            hintStyle: const TextStyle(
              color: Colors.white38,
              fontFamily: 'Poppins',
              fontSize: 13,
              fontWeight: FontWeight.w400,
              letterSpacing: 0,
            ),
            filled: true,
            fillColor: Colors.white.withValues(alpha: 0.04),
            prefixIcon: const Icon(LucideIcons.lock, color: Colors.white38),
            suffixIcon: IconButton(
              icon: Icon(_obscure ? LucideIcons.eye : LucideIcons.eyeOff,
                  color: Colors.white38),
              onPressed: () => setState(() => _obscure = !_obscure),
            ),
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
              borderSide:
                  const BorderSide(color: AppColors.primary, width: 1.5),
            ),
          ),
          onSubmitted: (_) => _start(m),
        ),
      ],
    );
  }

  // ── shared helpers ───────────────────────────────────────────────────────

  Widget _block(String title, List<Widget> rows) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: AppColors.primary,
              fontSize: 11,
              fontWeight: FontWeight.w900,
              letterSpacing: 2,
              fontFamily: 'Poppins',
            ),
          ),
          const SizedBox(height: 10),
          ...rows,
        ],
      ),
    );
  }

  Widget _kv(String k, String v) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              k,
              style: const TextStyle(
                color: Colors.white54,
                fontSize: 12,
                fontFamily: 'Poppins',
              ),
            ),
          ),
          Expanded(
            child: Text(
              v,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w600,
                fontFamily: 'Poppins',
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Reads `PendingMatch.format` and prints it the same way the scoring
  /// screen does — pretty names for enum-style backend keys, no redundant
  /// "MATCH" suffix, and the chosen overs appended.
  String _formatLabel(PendingMatch m) {
    final raw = m.format.toUpperCase();
    final pretty = switch (raw) {
      'THE_HUNDRED' => 'The Hundred',
      '5_DAY' => '5-Day Test',
      '90_OVERS' => '90 Overs',
      '1_WEEK' => 'One Week',
      'CUSTOM' => 'Custom',
      _ => raw,
    };
    return '$pretty • ${m.overs} overs';
  }

  String _formatDate(DateTime d) {
    const months = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ];
    final h = d.hour > 12 ? d.hour - 12 : (d.hour == 0 ? 12 : d.hour);
    final m = d.minute.toString().padLeft(2, '0');
    final p = d.hour >= 12 ? 'PM' : 'AM';
    return '${d.day.toString().padLeft(2, '0')} ${months[d.month - 1]} ${d.year} • $h:$m $p';
  }

  String _relativeTime(DateTime t) {
    final diff = DateTime.now().difference(t);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return _formatDate(t);
  }
}

class _NotFoundView extends StatelessWidget {
  const _NotFoundView();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(LucideIcons.alertCircle, color: Colors.white38, size: 40),
            SizedBox(height: 12),
            Text(
              'This match is no longer pending. It may have already been started or discarded.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white70,
                fontFamily: 'Poppins',
              ),
            ),
          ],
        ),
      ),
    );
  }
}
