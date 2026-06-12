import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../models/scoring_models.dart';
import '../../services/scoring_service.dart';

/// Shared match card used by the homepage Recent Scores tray, the Games
/// screen Recent Scores list, and the Live Now discovery list. Mirrors the
/// design of `_ResultCard` from `score_history_screen.dart` so all four
/// surfaces (home / games / live now / match results) look identical and
/// surface the same information at a glance — sport pill, date, team
/// names + bold scores with winner highlighting, result line with trophy,
/// and location with map pin.
///
/// Adapts to two payload shapes:
///   1. `/scoring/live` items — `{ status, teamA, teamB, inningsA, inningsB,
///      result, matchId, ... }`
///   2. Hosted-game JSON — `{ status, teamA, teamB, scoring: {...},
///      result, id, gameType, turf, ... }`
class LiveMatchCard extends StatefulWidget {
  final Map<String, dynamic> item;
  const LiveMatchCard({super.key, required this.item});

  @override
  State<LiveMatchCard> createState() => _LiveMatchCardState();
}

class _LiveMatchCardState extends State<LiveMatchCard> {
  Map<String, dynamic> get item => widget.item;

  /// MVP block — populated either from the item payload (when the backend
  /// embeds it) or lazily fetched from `/scoring/analytics/:matchId` after
  /// build for completed matches. Stays null on live / upcoming matches.
  Map<String, dynamic>? _mvp;
  bool _mvpFetchAttempted = false;

  /// Live-score snapshot — fetched for scoring matches whose hosted-game
  /// payload doesn't embed team / score / result data (the `/hosted-game/my-*`
  /// feed strips it for completed scoring matches, so the card has to pull it
  /// straight from `/scoring/live-score/:id`). Fills in team names, the result
  /// line, and per-team totals when the item map is missing them.
  LiveScoreSnapshot? _snap;
  bool _snapFetchAttempted = false;

  @override
  void initState() {
    super.initState();
    // Inline MVP shipped on the payload? Use it as-is.
    final inline = item['mvp'];
    if (inline is Map) {
      _mvp = Map<String, dynamic>.from(inline);
      _mvpFetchAttempted = true;
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_mvpFetchAttempted && _shouldFetchMvp) {
      _mvpFetchAttempted = true;
      _fetchAnalytics();
    }
    if (!_snapFetchAttempted && _shouldFetchSnap) {
      _snapFetchAttempted = true;
      _fetchSnap();
    }
  }

  bool get _shouldFetchMvp {
    final id = _matchId();
    if (id == null) return false;
    return _status() == 'COMPLETED';
  }

  /// We need the snapshot when the item didn't ship team info OR didn't ship
  /// any per-team scoring data. Covers live and completed scoring matches
  /// surfaced by `/hosted-game/my-*` — those rows keep team names but strip
  /// the runs/wickets/overs fields for completed matches, which would
  /// otherwise render as '—' on the card.
  bool get _shouldFetchSnap {
    final id = _matchId();
    if (id == null) return false;
    final status = _status();
    if (status != 'COMPLETED' && status != 'LIVE' && status != 'IN_PROGRESS') {
      return false;
    }
    if (_teamMap('teamA') == null && _teamMap('teamB') == null) return true;
    return !(_hasInlineScoreFor('teamA') || _hasInlineScoreFor('teamB'));
  }

  bool _hasInlineScoreFor(String teamKey) {
    final inningsKey = teamKey == 'teamA' ? 'inningsA' : 'inningsB';
    if (item[inningsKey] is Map) return true;
    final r = teamKey == 'teamA' ? 'teamARuns' : 'teamBRuns';
    for (final src in <Map?>[
      item['scoring'] is Map ? item['scoring'] as Map : null,
      item['scoringSnapshot'] is Map ? item['scoringSnapshot'] as Map : null,
      item[teamKey] is Map ? item[teamKey] as Map : null,
    ]) {
      if (src == null) continue;
      final runs = src[r] ?? src['runs'] ?? src['totalRuns'];
      if (runs != null) return true;
    }
    return false;
  }

  Future<void> _fetchAnalytics() async {
    final id = _matchId();
    if (id == null) return;
    final res = await ScoringService().getAnalytics(id);
    if (!mounted) return;
    if (!res.ok || res.data == null) return;
    final mvp = res.data!['mvp'];
    if (mvp is Map && mvp.isNotEmpty) {
      setState(() => _mvp = Map<String, dynamic>.from(mvp));
    }
  }

  Future<void> _fetchSnap() async {
    final id = _matchId();
    if (id == null) return;
    final res = await ScoringService().getLiveScore(id);
    if (!mounted) return;
    if (!res.ok || res.data == null) return;
    setState(() => _snap = res.data);
  }

  String? _matchId() {
    final v = item['matchId'] ?? item['gameId'] ?? item['id'] ?? item['_id'];
    final s = v?.toString();
    return (s == null || s.isEmpty) ? null : s;
  }

  String _status() {
    final raw = item['status']?.toString().toUpperCase() ?? '';
    if (raw.isNotEmpty) return raw;
    if (item['isLive'] == true) return 'LIVE';
    return '';
  }

  String _sport() {
    final s = item['gameType']?.toString() ?? item['sport']?.toString();
    if (s == null || s.isEmpty) return 'Cricket';
    // Normalise SCORING_MATCH → Cricket since cricket is the only sport
    // currently scored, and SCORING_MATCH is the backend's enum tag.
    if (s.toUpperCase() == 'SCORING_MATCH') return 'Cricket';
    return s;
  }

  /// Returns the team Map for the given key, checking every shape we've
  /// seen the backend use. The three live shapes:
  ///   • `/scoring/live`            → `item['teamA']` / `item['teamB']` (Map)
  ///   • `/hosted-game/my-hosted`   → `item['teams']['teamA']`            (Map)
  ///   • `/scoring/setup` echo      → `item['teamAData']`                 (Map)
  Map? _teamMap(String key) {
    final direct = item[key];
    if (direct is Map) return direct;
    final teams = item['teams'];
    if (teams is Map) {
      final nested = teams[key];
      if (nested is Map) return nested;
    }
    final dataKey = key == 'teamA' ? 'teamAData' : 'teamBData';
    final data = item[dataKey];
    if (data is Map) return data;
    // Snapshot fetched from /scoring/live-score is the authoritative source
    // when the feed payload doesn't carry team info.
    final fromSnap = key == 'teamA' ? _snap?.teamA : _snap?.teamB;
    if (fromSnap != null) return fromSnap;
    return null;
  }

  /// Extracts a string field from any known nested location. Used as a
  /// fallback path for name / score / id lookups so we don't have to repeat
  /// the same null-checking dance everywhere.
  String? _firstNonEmpty(Iterable<dynamic> candidates) {
    for (final c in candidates) {
      if (c == null) continue;
      final s = c.toString().trim();
      if (s.isEmpty || s.toLowerCase() == 'null') continue;
      return s;
    }
    return null;
  }

  String _teamName(String key) {
    final t = _teamMap(key);
    final scoring = item['scoring'] is Map ? item['scoring'] as Map : null;
    final flatNameKey = key == 'teamA' ? 'teamAName' : 'teamBName';
    final name = _firstNonEmpty([
      // Direct Map → `name` field
      if (t != null) t['name'],
      if (t != null) t['teamName'],
      // Some endpoints flatten the name as a string directly on the item
      if (item[key] is String) item[key],
      // Flat `teamAName`/`teamBName` strings on the hosted game
      item[flatNameKey],
      // Same fields, nested under scoring snapshot
      if (scoring != null) scoring[flatNameKey],
      // Scoring snapshot's batting/chasing names (only safe when innings
      // index distinguishes them — used as a last resort)
      if (scoring != null && key == 'teamA') scoring['battingTeamName'],
      if (scoring != null && key == 'teamB') scoring['chasingTeamName'],
    ]);
    if (name != null) return name;
    return key == 'teamA' ? 'Team A' : 'Team B';
  }

  String? _teamId(String key) {
    final t = _teamMap(key);
    if (t == null) return null;
    return _firstNonEmpty([t['id'], t['_id'], t['teamId']]);
  }

  /// Returns `({runs, wkts, overs})` for the given team key. Walks every
  /// known shape — `/scoring/live` innings maps, the hosted-game flat
  /// `scoring.teamARuns/...` fields, and a nested `scoringSnapshot` sub-map
  /// used by completed matches.
  ({String? runs, String? wkts, String? overs}) _teamScore(String teamKey) {
    final inningsKey = teamKey == 'teamA' ? 'inningsA' : 'inningsB';
    final live = item[inningsKey];
    if (live is Map) {
      return (
        runs: live['runs']?.toString(),
        wkts: live['wickets']?.toString(),
        overs: (live['overs'] ?? live['overString'])?.toString(),
      );
    }
    final r = teamKey == 'teamA' ? 'teamARuns' : 'teamBRuns';
    final w = teamKey == 'teamA' ? 'teamAWickets' : 'teamBWickets';
    final o = teamKey == 'teamA' ? 'teamAOvers' : 'teamBOvers';

    // Check scoring sub-map, then a nested scoringSnapshot, then the team Map
    // itself (some payloads inline `runs`/`wickets`/`overs` on the team entry).
    for (final src in <Map?>[
      item['scoring'] is Map ? item['scoring'] as Map : null,
      item['scoringSnapshot'] is Map ? item['scoringSnapshot'] as Map : null,
      _teamMap(teamKey),
    ]) {
      if (src == null) continue;
      final runs = src[r] ?? src['runs'] ?? src['totalRuns'];
      final wkts = src[w] ?? src['wickets'] ?? src['totalWickets'];
      final overs = src[o] ?? src['overs'] ?? src['overString'];
      if (runs != null || wkts != null || overs != null) {
        return (
          runs: runs?.toString(),
          wkts: wkts?.toString(),
          overs: overs?.toString(),
        );
      }
    }
    // Derive from the fetched snapshot when nothing else worked. The snapshot
    // exposes the currently-batting team's stats directly, and the *other*
    // team's first-innings total via `target - 1` (the chase target is the
    // 1st-innings total + 1). For 1st-innings live matches the non-batting
    // team has no score yet.
    final snap = _snap;
    if (snap != null) {
      final battingName = snap.battingTeamName;
      final thisName = _teamName(teamKey);
      final isBattingThis = battingName.isNotEmpty &&
          thisName.isNotEmpty &&
          battingName.toLowerCase() == thisName.toLowerCase();
      if (isBattingThis) {
        return (
          runs: snap.runs.toString(),
          wkts: snap.wickets.toString(),
          overs: snap.overString,
        );
      }
      // Other team — only known when we're in the 2nd innings or beyond.
      if (snap.currentInningsIndex >= 1 && snap.target != null) {
        return (
          runs: (snap.target! - 1).toString(),
          wkts: null,
          overs: null,
        );
      }
    }
    return (runs: null, wkts: null, overs: null);
  }

  String _bigScore(({String? runs, String? wkts, String? overs}) s) {
    if (s.runs == null) return '—';
    final wkts = s.wkts ?? '0';
    return '${s.runs}/$wkts';
  }

  String? _oversLabel(({String? runs, String? wkts, String? overs}) s) {
    if (s.overs == null || s.overs!.isEmpty) return null;
    return '(${s.overs})';
  }

  /// Reads the winner token (could be a team name, "teamA"/"teamB" alias, or
  /// a team id depending on the backend payload) from any of the known
  /// locations. Returns null only when no field is set anywhere.
  String? _winner() {
    final candidates = <String?>[
      item['winner']?.toString(),
      if (item['scoring'] is Map)
        (item['scoring'] as Map)['winner']?.toString(),
      if (item['scoring'] is Map)
        (item['scoring'] as Map)['winnerName']?.toString(),
      if (item['scoring'] is Map)
        (item['scoring'] as Map)['winningTeam']?.toString(),
    ];
    for (final c in candidates) {
      if (c != null && c.isNotEmpty && c.toLowerCase() != 'null') return c;
    }
    return null;
  }

  String? _result() {
    final r1 = item['result']?.toString();
    if (r1 != null && r1.isNotEmpty) return r1;
    final scoring = item['scoring'];
    if (scoring is Map) {
      final r2 = scoring['result']?.toString();
      if (r2 != null && r2.isNotEmpty) return r2;
    }
    final r3 = _snap?.result;
    if (r3 != null && r3.isNotEmpty) return r3;
    return null;
  }

  String? _location() {
    final turf = item['turf'];
    if (turf is Map) {
      final n = turf['name']?.toString();
      if (n != null && n.isNotEmpty) return n;
    }
    final v = item['venue']?.toString();
    if (v != null && v.isNotEmpty) return v;
    final c = item['city']?.toString();
    if (c != null && c.isNotEmpty) return c;
    return null;
  }

  String? _date() {
    final raw = item['updatedAt']?.toString() ??
        item['date']?.toString() ??
        item['createdAt']?.toString();
    if (raw == null || raw.isEmpty) return null;
    DateTime? dt;
    try {
      dt = DateTime.parse(raw).toLocal();
    } catch (_) {
      return null;
    }
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${dt.day} ${months[dt.month - 1]}';
  }

  Color _sportColor(String sport) {
    switch (sport) {
      case 'Cricket':
        return AppColors.primary;
      case 'Football':
        return AppColors.gradientStart;
      case 'Badminton':
        return AppColors.accentYellow;
      default:
        return AppColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final id = _matchId();
    final status = _status();
    final isLive = status == 'LIVE' || status == 'IN_PROGRESS';
    final isCompleted = status == 'COMPLETED';
    final sport = _sport();
    final sportTint = _sportColor(sport);

    final teamA = _teamName('teamA');
    final teamB = _teamName('teamB');
    final teamAId = _teamId('teamA');
    final teamBId = _teamId('teamB');
    final scoreA = _teamScore('teamA');
    final scoreB = _teamScore('teamB');

    final result = _result();
    final location = _location();
    final date = _date();

    // Winner can arrive in any of several forms — full team name, "teamA"/
    // "teamB" alias, or the team's id. Match against all three so the
    // highlighting works regardless of which shape the backend sent.
    final winner = _winner();
    bool _matches(String token,
        {required String name, required String alias, required String? id}) {
      final t = token.trim();
      if (t.isEmpty) return false;
      if (t == name) return true;
      if (t.toLowerCase() == alias.toLowerCase()) return true;
      if (id != null && t == id) return true;
      // Result strings often embed the winner: "Mumbai won by 5 runs".
      if (t.toLowerCase().contains(name.toLowerCase()) &&
          t.toLowerCase().contains('won')) {
        return true;
      }
      return false;
    }

    bool winnerIsA = winner != null &&
        _matches(winner, name: teamA, alias: 'teamA', id: teamAId);
    bool winnerIsB = winner != null &&
        _matches(winner, name: teamB, alias: 'teamB', id: teamBId);

    // No explicit winner field but the result string still names one — parse
    // it so completed matches don't fall through to DRAW.
    if (!winnerIsA && !winnerIsB && result != null && result.isNotEmpty) {
      final r = result.toLowerCase();
      if (r.contains(teamA.toLowerCase()) && r.contains('won')) {
        winnerIsA = true;
      } else if (r.contains(teamB.toLowerCase()) && r.contains('won')) {
        winnerIsB = true;
      }
    }

    final isDraw = isCompleted && !winnerIsA && !winnerIsB;

    return GestureDetector(
      onTap: id == null ? null : () => context.push('/match-view/$id'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.backgroundCard,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withValues(alpha: 0.07)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Status pill / sport pill + date ──────────────────────────
            Row(
              children: [
                if (isLive)
                  _pill('LIVE', AppColors.errorRed)
                else if (isCompleted)
                  _pill(sport.toUpperCase(), sportTint)
                else if (status.isNotEmpty)
                  _pill(status, AppColors.textGray)
                else
                  _pill(sport.toUpperCase(), sportTint),
                const Spacer(),
                if (date != null)
                  Text(date,
                      style: const TextStyle(
                        color: AppColors.textGray,
                        fontSize: 11,
                        fontFamily: 'Poppins',
                      )),
              ],
            ),
            const SizedBox(height: 12),

            // ── Score row: Team A | VS | Team B ──────────────────────────
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _teamColumn(
                    name: teamA,
                    score: _bigScore(scoreA),
                    overs: _oversLabel(scoreA),
                    highlight: winnerIsA || (!isCompleted && !winnerIsB),
                    alignEnd: false,
                  ),
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                      child: Text(
                        'VS',
                        style: TextStyle(
                          color: AppColors.borderGray,
                          fontSize: 12,
                          fontFamily: 'Poppins',
                        ),
                      ),
                    ),
                    if (isDraw)
                      const Text(
                        'DRAW',
                        style: TextStyle(
                          color: Colors.orange,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'Poppins',
                        ),
                      ),
                    if (isLive)
                      Container(
                        margin: const EdgeInsets.only(top: 2),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.errorRed.withValues(alpha: 0.18),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'LIVE',
                          style: TextStyle(
                            color: AppColors.errorRed,
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1,
                            fontFamily: 'Poppins',
                          ),
                        ),
                      ),
                  ],
                ),
                Expanded(
                  child: _teamColumn(
                    name: teamB,
                    score: _bigScore(scoreB),
                    overs: _oversLabel(scoreB),
                    highlight: winnerIsB || (!isCompleted && !winnerIsA),
                    alignEnd: true,
                  ),
                ),
              ],
            ),

            // ── MVP row (completed matches only) ────────────────────────
            if (isCompleted && _mvp != null) ...[
              const SizedBox(height: 12),
              _mvpRow(_mvp!),
            ],

            // ── Result + location footer ────────────────────────────────
            if ((result != null && result.isNotEmpty) ||
                (location != null && location.isNotEmpty)) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  if (result != null && result.isNotEmpty) ...[
                    const Icon(LucideIcons.trophy,
                        color: AppColors.accentYellow, size: 13),
                    const SizedBox(width: 5),
                    Expanded(
                      child: Text(
                        result,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppColors.textGray,
                          fontSize: 11,
                          fontFamily: 'Poppins',
                        ),
                      ),
                    ),
                  ] else
                    const Spacer(),
                  if (location != null && location.isNotEmpty) ...[
                    const SizedBox(width: 6),
                    const Icon(LucideIcons.mapPin,
                        color: AppColors.textGray, size: 12),
                    const SizedBox(width: 3),
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 130),
                      child: Text(
                        location,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppColors.textGray,
                          fontSize: 11,
                          fontFamily: 'Poppins',
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _pill(String text, Color tint) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: tint.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: tint,
          fontSize: 10,
          fontWeight: FontWeight.w700,
          fontFamily: 'Poppins',
        ),
      ),
    );
  }

  /// Player-of-the-match row. Yellow-tinted strip with a medal icon, MVP
  /// name on the left, "MVP" label + points pill on the right. Only shown
  /// when the analytics fetch has actually returned a player.
  Widget _mvpRow(Map<String, dynamic> mvp) {
    final name = mvp['name']?.toString() ??
        (mvp['user'] is Map ? mvp['user']['name']?.toString() : null) ??
        'Player';
    final points = mvp['points']?.toString();
    final summary = mvp['summary']?.toString();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFFFC107).withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
        border:
            Border.all(color: const Color(0xFFFFC107).withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          const Icon(Icons.emoji_events, color: Color(0xFFFFC107), size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    const Text(
                      'MVP',
                      style: TextStyle(
                        color: Color(0xFFFFC107),
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.5,
                        fontFamily: 'Poppins',
                      ),
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          fontFamily: 'Poppins',
                        ),
                      ),
                    ),
                  ],
                ),
                if (summary != null && summary.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      summary,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.textGray,
                        fontSize: 11,
                        fontFamily: 'Poppins',
                      ),
                    ),
                  ),
              ],
            ),
          ),
          if (points != null) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(0xFFFFC107).withValues(alpha: 0.22),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                '$points pts',
                style: const TextStyle(
                  color: Color(0xFFFFC107),
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  fontFamily: 'Poppins',
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _teamColumn({
    required String name,
    required String score,
    required String? overs,
    required bool highlight,
    required bool alignEnd,
  }) {
    return Column(
      crossAxisAlignment:
          alignEnd ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        Text(
          name,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          textAlign: alignEnd ? TextAlign.end : TextAlign.start,
          style: TextStyle(
            color: highlight ? Colors.white : Colors.white54,
            fontSize: 13,
            fontWeight: FontWeight.w600,
            fontFamily: 'Poppins',
          ),
        ),
        const SizedBox(height: 4),
        Text(
          score,
          style: TextStyle(
            color: highlight ? AppColors.primary : Colors.white38,
            fontSize: 22,
            fontWeight: FontWeight.w800,
            fontFamily: 'Poppins',
          ),
        ),
        if (overs != null) ...[
          const SizedBox(height: 2),
          Text(
            overs,
            style: const TextStyle(
              color: AppColors.textGray,
              fontSize: 11,
              fontFamily: 'Poppins',
              fontFeatures: [FontFeature.tabularFigures()],
            ),
          ),
        ],
      ],
    );
  }
}
