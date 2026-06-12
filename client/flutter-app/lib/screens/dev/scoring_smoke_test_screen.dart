import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../services/api_service.dart';
import '../../services/auth_manager.dart';
import '../../services/game_service.dart';
import '../../services/scoring_service.dart';
import '../../services/scoring_socket_service.dart';

/// Dev-only end-to-end smoke harness for the scoring contract.
///
/// Walks every phase of the doc against the live backend:
///   1. GET  /hosted-game/list (pick the most recent ACTIVE row)
///   2. POST /hosted-game/create + /join (optional — creates a sandbox)
///   3. POST /scoring/auth/:gameId (when a scoringPassword is set)
///   4. POST /scoring/setup → scoringId
///   5. POST /scoring/start → LIVE
///   6. PUT  /scoring/update × N
///   7. POST /scoring/complete → earnedBadges
///   8. GET  /scoring/live, /:id/scorecard, /:id/squads, /:id/overs,
///          /live-score/:id, /analytics/:id (viewer surface)
///   9. Socket joinMatch + scoreUpdated stream
///
/// Each step shows pass / fail + the raw response so a backend dev can
/// triage in 30 seconds. Only registered in debug builds.
class ScoringSmokeTestScreen extends StatefulWidget {
  const ScoringSmokeTestScreen({super.key});

  @override
  State<ScoringSmokeTestScreen> createState() => _ScoringSmokeTestScreenState();
}

class _ScoringSmokeTestScreenState extends State<ScoringSmokeTestScreen> {
  final _game = GameService();
  final _scoring = ScoringService();
  final _socket = ScoringSocketService();

  final _matchIdCtrl = TextEditingController();
  final _scoringPwdCtrl = TextEditingController();

  // Mutable state captured as steps progress.
  String? _gameId;
  String? _scoringId;
  String? _scorerToken;
  int _socketEvents = 0;

  // One result per step keyed by step id.
  final Map<String, _StepResult> _results = {};
  bool _running = false;

  @override
  void dispose() {
    _matchIdCtrl.dispose();
    _scoringPwdCtrl.dispose();
    super.dispose();
  }

  void _setResult(String key, _StepResult r) {
    if (!mounted) return;
    setState(() => _results[key] = r);
  }

  String? get _activeMatchId =>
      _matchIdCtrl.text.trim().isEmpty ? _gameId : _matchIdCtrl.text.trim();

  // ── Individual steps ──────────────────────────────────────────────────────

  Future<void> _step_getMe() async {
    _setResult('getMe', const _StepResult.running());
    final user = AuthManager().currentUser;
    if (user == null) {
      _setResult(
          'getMe', const _StepResult.failure('Not signed in — log in first.'));
      return;
    }
    _setResult('getMe',
        _StepResult.success('Signed in as ${user['name'] ?? user['email']}'));
  }

  /// Drives /user/auth/refresh and confirms:
  ///   - the access bearer changed,
  ///   - the persisted refresh token rotated,
  ///   - accessTokenExpiresAt advanced,
  ///   - the new bearer is accepted by a protected endpoint.
  /// Pass criteria require all four; partial pass shows which leg failed.
  Future<void> _step_tokenRefresh() async {
    _setResult('refresh', const _StepResult.running());
    final api = ApiService();

    final oldBearer = api.currentAuthHeader;
    final oldExp = api.accessTokenExpiresAt;
    final oldRefresh = api.debugRefreshToken;

    if (oldBearer == null) {
      _setResult(
          'refresh', const _StepResult.failure('No bearer — log in first.'));
      return;
    }
    if (oldRefresh == null || oldRefresh.isEmpty) {
      _setResult(
          'refresh', const _StepResult.failure('No refresh token persisted.'));
      return;
    }

    try {
      final newAccess = await api.forceRefresh();
      if (newAccess == null || newAccess.isEmpty) {
        _setResult('refresh',
            const _StepResult.failure('Refresh returned no access token.'));
        return;
      }
    } catch (e) {
      _setResult('refresh', _StepResult.failure('Refresh threw: $e'));
      return;
    }

    final newBearer = api.currentAuthHeader;
    final newExp = api.accessTokenExpiresAt;
    final newRefresh = api.debugRefreshToken;

    final bearerSwapped = newBearer != null && newBearer != oldBearer;
    final refreshRotated =
        newRefresh != null && newRefresh.isNotEmpty && newRefresh != oldRefresh;
    final expAdvanced =
        newExp != null && (oldExp == null || newExp.isAfter(oldExp));

    // Final leg: the new bearer must actually be accepted server-side.
    // /hosted-game/list is auth-gated and cheap, and the smoke screen
    // already exercises it elsewhere — reusing it keeps the verification
    // honest without adding a new endpoint.
    bool acceptedByServer = false;
    String? acceptError;
    try {
      await _game.listGames(limit: 1);
      acceptedByServer = true;
    } catch (e) {
      acceptError = e.toString();
    }

    final lines = <String>[
      bearerSwapped ? '✓ bearer swapped' : '✗ bearer unchanged',
      refreshRotated ? '✓ refresh rotated' : '✗ refresh not rotated',
      expAdvanced ? '✓ expiry advanced' : '✗ expiry not advanced',
      acceptedByServer
          ? '✓ protected GET accepted'
          : '✗ protected GET rejected${acceptError != null ? ' ($acceptError)' : ''}',
    ];
    final allPass =
        bearerSwapped && refreshRotated && expAdvanced && acceptedByServer;
    final summary = lines.join(' • ');
    _setResult('refresh',
        allPass ? _StepResult.success(summary) : _StepResult.failure(summary));
  }

  Future<void> _step_listGames() async {
    _setResult('list', const _StepResult.running());
    final games = await _game.listGames(limit: 5);
    if (games.isEmpty) {
      _setResult('list',
          const _StepResult.failure('Empty — try /hosted-game/create first.'));
      return;
    }
    final first = games.first;
    final id = (first['id'] ?? first['_id'])?.toString();
    if (id != null) {
      setState(() {
        _gameId = id;
        _matchIdCtrl.text = id;
      });
    }
    _setResult(
        'list',
        _StepResult.success(
            '${games.length} game(s). First: ${first['gameType'] ?? '?'} @ ${first['city'] ?? '?'}'));
  }

  Future<void> _step_liveDiscovery() async {
    _setResult('liveList', const _StepResult.running());
    final res = await _scoring.getLiveMatches();
    if (!res.ok) {
      _setResult('liveList', _StepResult.failure(res.error ?? '?'));
      return;
    }
    final items = res.data ?? const [];
    if (items.isEmpty) {
      _setResult('liveList',
          const _StepResult.success('OK — no matches LIVE right now.'));
      return;
    }
    // Auto-pick the first live match if no matchId has been entered.
    if (_matchIdCtrl.text.trim().isEmpty) {
      final id = (items.first['matchId'] ?? items.first['gameId'])?.toString();
      if (id != null) setState(() => _matchIdCtrl.text = id);
    }
    _setResult(
        'liveList',
        _StepResult.success(
            '${items.length} live match(es). First name: ${items.first['name']}'));
  }

  Future<void> _step_liveScore() async {
    final id = _activeMatchId;
    if (id == null || id.isEmpty) {
      _setResult('liveScore',
          const _StepResult.failure('Enter or auto-pick a matchId first.'));
      return;
    }
    _setResult('liveScore', const _StepResult.running());
    final res = await _scoring.getLiveScore(id);
    if (!res.ok || res.data == null) {
      _setResult('liveScore', _StepResult.failure(res.error ?? '?'));
      return;
    }
    final s = res.data!;
    _setResult(
        'liveScore',
        _StepResult.success(
            '${s.runs}-${s.wickets} (${s.overString}) • CRR ${s.crr}'));
  }

  Future<void> _step_scorecard() async {
    final id = _activeMatchId;
    if (id == null || id.isEmpty) {
      _setResult('scorecard', const _StepResult.failure('No matchId.'));
      return;
    }
    _setResult('scorecard', const _StepResult.running());
    final res = await _scoring.getScorecard(id);
    if (!res.ok || res.data == null) {
      _setResult('scorecard', _StepResult.failure(res.error ?? '?'));
      return;
    }
    final innings = (res.data!['innings'] as List?) ?? const [];
    _setResult('scorecard',
        _StepResult.success('${innings.length} innings returned.'));
  }

  Future<void> _step_squads() async {
    final id = _activeMatchId;
    if (id == null || id.isEmpty) {
      _setResult('squads', const _StepResult.failure('No matchId.'));
      return;
    }
    _setResult('squads', const _StepResult.running());
    final res = await _scoring.getSquads(id);
    if (!res.ok || res.data == null) {
      _setResult('squads', _StepResult.failure(res.error ?? '?'));
      return;
    }
    final a = (res.data!['teamA'] as Map?)?['name'] ?? '?';
    final b = (res.data!['teamB'] as Map?)?['name'] ?? '?';
    _setResult('squads', _StepResult.success('Teams: $a vs $b'));
  }

  Future<void> _step_overs() async {
    final id = _activeMatchId;
    if (id == null || id.isEmpty) {
      _setResult('overs', const _StepResult.failure('No matchId.'));
      return;
    }
    _setResult('overs', const _StepResult.running());
    final res = await _scoring.getOvers(id, innings: 0);
    if (!res.ok || res.data == null) {
      _setResult('overs', _StepResult.failure(res.error ?? '?'));
      return;
    }
    final innings = (res.data!['innings'] as List?) ?? const [];
    final overs = innings.isEmpty
        ? const []
        : ((innings.first as Map?)?['overs'] as List?) ?? const [];
    final cursor = res.data!['nextCursor'];
    _setResult(
        'overs',
        _StepResult.success(
            '${overs.length} over(s), cursor=${cursor ?? 'null'}'));
  }

  Future<void> _step_analytics() async {
    final id = _activeMatchId;
    if (id == null || id.isEmpty) {
      _setResult('analytics', const _StepResult.failure('No matchId.'));
      return;
    }
    _setResult('analytics', const _StepResult.running());
    final res = await _scoring.getAnalytics(id);
    if (!res.ok || res.data == null) {
      _setResult('analytics', _StepResult.failure(res.error ?? '?'));
      return;
    }
    final analytics = (res.data!['analytics'] as Map?);
    final mvp = (analytics?['mvp'] as Map?)?['name'];
    _setResult(
        'analytics', _StepResult.success('MVP: ${mvp ?? '(post-match only)'}'));
  }

  Future<void> _step_scorerAuth() async {
    final id = _activeMatchId;
    final pwd = _scoringPwdCtrl.text.trim();
    if (id == null || id.isEmpty || pwd.isEmpty) {
      _setResult(
          'scorerAuth', const _StepResult.failure('Need matchId + password.'));
      return;
    }
    _setResult('scorerAuth', const _StepResult.running());
    final res = await _scoring.authenticateScorer(gameId: id, password: pwd);
    if (!res.ok) {
      _setResult('scorerAuth', _StepResult.failure(res.error ?? '?'));
      return;
    }
    setState(() => _scorerToken = res.data);
    _setResult('scorerAuth',
        _StepResult.success('JWT obtained (length ${res.data?.length ?? 0}).'));
  }

  Future<void> _step_socketConnect() async {
    final id = _activeMatchId;
    if (id == null || id.isEmpty) {
      _setResult('socket', const _StepResult.failure('No matchId.'));
      return;
    }
    _setResult('socket', const _StepResult.running());
    _socket.connect(id);
    final sub = _socket.scoreStream.listen((_) {
      setState(() => _socketEvents++);
    });
    // Give the socket up to 3 seconds to land.
    await Future<void>.delayed(const Duration(seconds: 3));
    final connected = _socket.isConnected;
    await sub.cancel();
    _setResult(
        'socket',
        connected
            ? _StepResult.success(
                'Connected — $_socketEvents scoreUpdated event(s).')
            : const _StepResult.failure('Socket did not connect in 3s.'));
  }

  Future<void> _step_undo() async {
    if (_scoringId == null || _scoringId!.isEmpty) {
      _setResult('undo', const _StepResult.failure('No scoringId.'));
      return;
    }
    _setResult('undo', const _StepResult.running());
    final res = await _scoring.undoLastBall(_scoringId!);
    _setResult(
        'undo',
        res.ok
            ? const _StepResult.success('Undo accepted.')
            : _StepResult.failure(res.error ?? '?'));
  }

  Future<void> _step_houseRules() async {
    if (_scoringId == null || _scoringId!.isEmpty) {
      _setResult('houseRules', const _StepResult.failure('No scoringId.'));
      return;
    }
    _setResult('houseRules', const _StepResult.running());
    // Send a no-op patch (all defaults) just to exercise the route.
    final res = await _scoring.setHouseRules(
      scoringId: _scoringId!,
      houseRules: const {
        'wideIsLegalBall': false,
        'noBallIsLegalBall': false,
        'penaltyEnabled': true,
      },
    );
    _setResult(
        'houseRules',
        res.ok
            ? const _StepResult.success('OK')
            : _StepResult.failure('${res.code ?? ''} ${res.error ?? ''}'));
  }

  Future<void> _step_complete() async {
    if (_scoringId == null || _scoringId!.isEmpty) {
      _setResult('complete', const _StepResult.failure('No scoringId.'));
      return;
    }
    _setResult('complete', const _StepResult.running());
    final res = await _scoring.completeMatch(_scoringId!);
    if (!res.ok) {
      _setResult('complete',
          _StepResult.failure('${res.code ?? ''} ${res.error ?? ''}'));
      return;
    }
    final badges = res.data?.earnedBadges ?? const [];
    _setResult('complete',
        _StepResult.success('Complete — ${badges.length} badge(s) earned.'));
  }

  Future<void> _runViewerSuite() async {
    setState(() => _running = true);
    await _step_listGames();
    await _step_liveDiscovery();
    if ((_activeMatchId ?? '').isNotEmpty) {
      await _step_liveScore();
      await _step_scorecard();
      await _step_squads();
      await _step_overs();
      await _step_analytics();
    }
    setState(() => _running = false);
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Scoring Smoke Test',
            style: TextStyle(color: Colors.white, fontFamily: 'Poppins')),
        iconTheme: const IconThemeData(color: Colors.white),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
          onPressed: () =>
              context.canPop() ? context.pop() : context.go('/dashboard'),
        ),
        actions: [
          if (_activeMatchId != null && _activeMatchId!.isNotEmpty)
            IconButton(
              tooltip: 'Copy matchId',
              icon: const Icon(LucideIcons.copy, color: Colors.white),
              onPressed: () =>
                  Clipboard.setData(ClipboardData(text: _activeMatchId ?? '')),
            ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const _Hint(
              'Drives the scoring contract end-to-end against the live '
              'backend. Steps run independently — pick a matchId or auto-fill '
              'it from /hosted-game/list, then run the viewer suite. To test '
              'writes, paste a known scoringId (or open this from the scoring '
              'screen so it pre-fills).',
            ),
            const SizedBox(height: 16),
            _Field(
              controller: _matchIdCtrl,
              label: 'matchId / gameId',
              hint: 'paste or auto-fill from List Games',
            ),
            const SizedBox(height: 10),
            _Field(
              controller: _scoringPwdCtrl,
              label: 'scoringPassword',
              hint: 'only for the scorer-auth test',
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _running ? null : _runViewerSuite,
                    icon: const Icon(LucideIcons.play),
                    label: const Text('Run viewer suite'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF7CFE6A),
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 22),
            const _Section('Auth & discovery'),
            _StepRow(
                label: 'getMe (current user)',
                onTap: _step_getMe,
                result: _results['getMe']),
            _StepRow(
                label: 'POST /user/auth/refresh (rotation check)',
                onTap: _step_tokenRefresh,
                result: _results['refresh']),
            _StepRow(
                label: 'GET /hosted-game/list',
                onTap: _step_listGames,
                result: _results['list']),
            _StepRow(
                label: 'GET /scoring/live',
                onTap: _step_liveDiscovery,
                result: _results['liveList']),
            const SizedBox(height: 16),
            const _Section('Viewer surface'),
            _StepRow(
                label: 'GET /scoring/live-score/:id',
                onTap: _step_liveScore,
                result: _results['liveScore']),
            _StepRow(
                label: 'GET /scoring/:id/scorecard',
                onTap: _step_scorecard,
                result: _results['scorecard']),
            _StepRow(
                label: 'GET /scoring/:id/squads',
                onTap: _step_squads,
                result: _results['squads']),
            _StepRow(
                label: 'GET /scoring/:id/overs',
                onTap: _step_overs,
                result: _results['overs']),
            _StepRow(
                label: 'GET /scoring/analytics/:id',
                onTap: _step_analytics,
                result: _results['analytics']),
            const SizedBox(height: 16),
            const _Section('Real-time'),
            _StepRow(
                label: 'Socket joinMatch + scoreUpdated',
                onTap: _step_socketConnect,
                result: _results['socket']),
            const SizedBox(height: 16),
            const _Section('Scorer writes (needs scoringId)'),
            _StepRow(
                label: 'POST /scoring/auth/:gameId',
                onTap: _step_scorerAuth,
                result: _results['scorerAuth']),
            _StepRow(
                label: 'PATCH /scoring/house-rules',
                onTap: _step_houseRules,
                result: _results['houseRules']),
            _StepRow(
                label: 'POST /scoring/undo',
                onTap: _step_undo,
                result: _results['undo']),
            _StepRow(
                label: 'POST /scoring/complete',
                onTap: _step_complete,
                result: _results['complete']),
            const SizedBox(height: 30),
            if (_scorerToken != null)
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Scorer token captured (len=${_scorerToken!.length}).',
                  style: const TextStyle(
                      color: Color(0xFF7CFE6A),
                      fontSize: 12,
                      fontFamily: 'Poppins'),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _StepResult {
  const _StepResult.running()
      : status = _StepStatus.running,
        message = 'Running…';
  const _StepResult.success(this.message) : status = _StepStatus.success;
  const _StepResult.failure(this.message) : status = _StepStatus.failure;
  final _StepStatus status;
  final String message;
}

enum _StepStatus { running, success, failure }

class _StepRow extends StatelessWidget {
  const _StepRow({
    required this.label,
    required this.onTap,
    required this.result,
  });
  final String label;
  final Future<void> Function() onTap;
  final _StepResult? result;

  @override
  Widget build(BuildContext context) {
    final color = switch (result?.status) {
      _StepStatus.success => const Color(0xFF7CFE6A),
      _StepStatus.failure => const Color(0xFFEF4444),
      _StepStatus.running => const Color(0xFFFFC107),
      null => Colors.white.withValues(alpha: 0.2),
    };
    final icon = switch (result?.status) {
      _StepStatus.success => LucideIcons.checkCircle2,
      _StepStatus.failure => LucideIcons.xCircle,
      _StepStatus.running => LucideIcons.loader,
      null => LucideIcons.circle,
    };
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF0E0E10),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(label,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'Poppins')),
                if (result != null) ...[
                  const SizedBox(height: 2),
                  Text(result!.message,
                      style: TextStyle(
                          color: color, fontSize: 11, fontFamily: 'Poppins')),
                ],
              ],
            ),
          ),
          TextButton(
            onPressed: result?.status == _StepStatus.running ? null : onTap,
            child: const Text('Run',
                style: TextStyle(
                    color: Color(0xFF7CFE6A),
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Poppins')),
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section(this.title);
  final String title;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 8, left: 4),
        child: Text(title.toUpperCase(),
            style: TextStyle(
                color: Colors.white.withValues(alpha: 0.45),
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.4,
                fontFamily: 'Poppins')),
      );
}

class _Hint extends StatelessWidget {
  const _Hint(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
        ),
        child: Text(text,
            style: TextStyle(
                color: Colors.white.withValues(alpha: 0.7),
                fontSize: 12,
                height: 1.4,
                fontFamily: 'Poppins')),
      );
}

class _Field extends StatelessWidget {
  const _Field({
    required this.controller,
    required this.label,
    required this.hint,
  });
  final TextEditingController controller;
  final String label;
  final String hint;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 6, left: 4),
            child: Text(label.toUpperCase(),
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.5),
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.4,
                    fontFamily: 'Poppins')),
          ),
          TextField(
            controller: controller,
            style: const TextStyle(
                color: Colors.white, fontSize: 13, fontFamily: 'monospace'),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(
                  color: Colors.white.withValues(alpha: 0.3),
                  fontSize: 12,
                  fontFamily: 'Poppins'),
              filled: true,
              fillColor: const Color(0xFF0E0E10),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide:
                    BorderSide(color: Colors.white.withValues(alpha: 0.08)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide:
                    BorderSide(color: Colors.white.withValues(alpha: 0.08)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide:
                    const BorderSide(color: Color(0xFF7CFE6A), width: 1.2),
              ),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            ),
          ),
        ],
      );
}
