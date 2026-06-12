import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../models/scoring_models.dart';
import '../../services/scoring_service.dart';

/// Side-by-side squads view used by the TEAMS tab inside the live scorer.
/// Pulls Playing XI + Bench from `/scoring/:matchId/squads` and renders
/// them in two parallel columns — Team A on the left, Team B on the right
/// — under a "Playing XI" header. Falls back to the lighter Playing XI
/// data from `MatchStatus` while the squads call is in flight.
class SquadsView extends StatefulWidget {
  final String matchId;
  final String teamAName;
  final String teamBName;
  final List<RosterPlayer> fallbackTeamA;
  final List<RosterPlayer> fallbackTeamB;

  const SquadsView({
    super.key,
    required this.matchId,
    required this.teamAName,
    required this.teamBName,
    required this.fallbackTeamA,
    required this.fallbackTeamB,
  });

  @override
  State<SquadsView> createState() => _SquadsViewState();
}

class _SquadsViewState extends State<SquadsView> {
  final _service = ScoringService();

  bool _loading = true;
  Map<String, dynamic>? _squads;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final res = await _service.getSquads(widget.matchId);
    if (!mounted) return;
    setState(() {
      _loading = false;
      if (res.ok && res.data != null) {
        _squads = res.data;
      } else {
        _error = res.error;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    // Always render — when the squads endpoint hasn't responded yet we use
    // the MatchStatus fallback rosters so the tab is never blank.
    final teamA = _readSquadTeam('teamA', widget.fallbackTeamA);
    final teamB = _readSquadTeam('teamB', widget.fallbackTeamB);

    return SingleChildScrollView(
      key: const ValueKey('squads'),
      padding: const EdgeInsets.fromLTRB(0, 12, 0, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _teamHeaderRow(),
          const SizedBox(height: 10),
          _sectionDivider('Playing XI'),
          _twoColumnList(
            teamA['playing'] ?? const [],
            teamB['playing'] ?? const [],
          ),
          if ((teamA['bench'] ?? const []).isNotEmpty ||
              (teamB['bench'] ?? const []).isNotEmpty) ...[
            const SizedBox(height: 4),
            _sectionDivider('Bench'),
            _twoColumnList(
              teamA['bench'] ?? const [],
              teamB['bench'] ?? const [],
            ),
          ],
          if (_loading && _squads == null)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 14),
              child: Center(
                child: SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white38),
                ),
              ),
            ),
          if (_error != null && _squads == null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Text(
                _error!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white38, fontSize: 11),
              ),
            ),
        ],
      ),
    );
  }

  // ── Header row ─────────────────────────────────────────────────────────────

  Widget _teamHeaderRow() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      color: const Color(0xFFC9F4DD).withValues(alpha: 0.18),
      child: Row(
        children: [
          // Team A — left
          Expanded(
            child: Row(
              children: [
                _teamFlag(0),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    widget.teamAName.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Team B — right
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Expanded(
                  child: Text(
                    widget.teamBName.toUpperCase(),
                    textAlign: TextAlign.end,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.4,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                _teamFlag(1),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _teamFlag(int idx) {
    // Simple coloured rectangle stand-in — the backend doesn't yet attach a
    // team-flag URL. Matches the reference screenshot's neutral flag tiles.
    final colors = [
      const Color(0xFFFF4C4C),
      const Color(0xFF2FD1C6),
    ];
    return Container(
      width: 22,
      height: 22,
      decoration: BoxDecoration(
        color: colors[idx].withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(4),
      ),
      alignment: Alignment.center,
      child: const Icon(LucideIcons.flag, color: Colors.white, size: 12),
    );
  }

  Widget _sectionDivider(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      color: const Color(0xFFC9F4DD).withValues(alpha: 0.08),
      alignment: Alignment.center,
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white70,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  // ── Two-column player rows ────────────────────────────────────────────────

  Widget _twoColumnList(List a, List b) {
    final rows = a.length > b.length ? a.length : b.length;
    return Column(
      children: [
        for (int i = 0; i < rows; i++)
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                    child: _playerCell(i < a.length ? a[i] : null,
                        alignEnd: false)),
                Container(width: 1, color: Colors.white12),
                Expanded(
                    child: _playerCell(i < b.length ? b[i] : null,
                        alignEnd: true)),
              ],
            ),
          ),
      ],
    );
  }

  Widget _playerCell(dynamic raw, {required bool alignEnd}) {
    if (raw == null) {
      // Keep the row height consistent when one team has fewer members.
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          border: Border(
              bottom: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
        ),
        child: const SizedBox.shrink(),
      );
    }
    final name = _readName(raw);
    final role = _readRole(raw);
    final captain = _readBool(raw, 'isCaptain') || _readBool(raw, 'captain');
    final keeper = _readBool(raw, 'isWicketKeeper') ||
        _readBool(raw, 'isKeeper') ||
        (role.toLowerCase().contains('keep'));
    final pic = _readPic(raw);
    final suffix = captain
        ? ' (c)'
        : keeper
            ? ' (wk)'
            : '';
    final children = <Widget>[
      _avatar(pic),
      const SizedBox(width: 10),
      Expanded(
        child: Column(
          crossAxisAlignment:
              alignEnd ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '$name$suffix',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              role.isEmpty ? 'Player' : role,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white54,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    ];
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        border: Border(
            bottom: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
      ),
      child: Row(
        children: alignEnd ? children.reversed.toList() : children,
      ),
    );
  }

  Widget _avatar(String? url) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white.withValues(alpha: 0.08),
        border: Border.all(color: Colors.white12),
      ),
      clipBehavior: Clip.antiAlias,
      child: url != null && url.isNotEmpty
          ? Image.network(url,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) =>
                  const Icon(LucideIcons.user, color: Colors.white38, size: 16))
          : const Icon(LucideIcons.user, color: Colors.white38, size: 16),
    );
  }

  // ── Squad / roster helpers ─────────────────────────────────────────────────

  /// Returns `{ playing: List, bench: List }` for the requested team key.
  /// Reads the `/scoring/:id/squads` payload first, then falls back to the
  /// raw `RosterPlayer` list passed from MatchStatus when the squads call
  /// hasn't landed yet (or returned an error).
  Map<String, List> _readSquadTeam(String key, List<RosterPlayer> fallback) {
    final raw = _squads;
    if (raw != null && raw[key] is Map) {
      final team = Map<String, dynamic>.from(raw[key] as Map);
      final playing =
          (team['playingXI'] ?? team['playing'] ?? const []) as List;
      final bench = (team['bench'] ?? const []) as List;
      return {'playing': playing, 'bench': bench};
    }
    return {
      'playing': fallback
          .map((p) => {
                'name': p.name,
                'role': p.role,
                'profilePicture': p.profilePicture,
              })
          .toList(),
      'bench': const [],
    };
  }

  String _readName(dynamic raw) {
    if (raw is Map) {
      final user = raw['user'];
      if (user is Map && user['name'] != null) {
        return user['name'].toString();
      }
      final custom = raw['customPlayer'];
      if (custom is Map && custom['name'] != null) {
        return custom['name'].toString();
      }
      return raw['name']?.toString() ?? 'Player';
    }
    return 'Player';
  }

  String _readRole(dynamic raw) {
    if (raw is Map) {
      return (raw['role'] ?? raw['playingRole'] ?? '').toString();
    }
    return '';
  }

  String? _readPic(dynamic raw) {
    if (raw is Map) {
      final user = raw['user'];
      if (user is Map && user['profilePicture'] != null) {
        return user['profilePicture'].toString();
      }
      return raw['profilePicture']?.toString();
    }
    return null;
  }

  bool _readBool(dynamic raw, String key) {
    if (raw is Map) return raw[key] == true;
    return false;
  }
}
