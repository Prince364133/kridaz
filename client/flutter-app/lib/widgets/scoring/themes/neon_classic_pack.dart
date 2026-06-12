import 'package:flutter/material.dart';
import '../../../models/scoring_models.dart';
import '../event_animation.dart';
import '../live_cards.dart';
import 'scoring_theme_pack.dart';

/// Default Kridaz theme — dark navy background, lime accent, condensed
/// caps typography. Ported from
/// `kridaz/client/user/src/features/scoring/themes/NeonClassic/*`.
///
/// The animation + card widgets are the existing [EventAnimation] and
/// [LiveCards] components — they already match this look 1:1.
class NeonClassicPack extends ScoringThemePack {
  const NeonClassicPack();

  @override
  String get id => 'neon_classic';

  @override
  String get name => 'Neon Classic';

  @override
  ScoringPalette get palette => const ScoringPalette(
        primary: Color(0xFFA3E635),
        secondary: Color(0xFF94A3B8),
        bg: Color(0xFF0F172A),
        fontFamily: 'Orbitron',
      );

  @override
  Widget buildEventAnimation({
    required EventKind? kind,
    VoidCallback? onDone,
  }) =>
      EventAnimation(kind: kind, onDone: onDone);

  @override
  Widget buildLiveCard({
    required LiveCardData? card,
    VoidCallback? onDismissed,
  }) =>
      LiveCards(card: card, onDismissed: onDismissed);

  @override
  Widget buildTicker({required LiveScoreSnapshot snap}) =>
      _NeonClassicTicker(snap: snap, palette: palette);
}

/// The bottom score strip. Stacked card layout: team header → big score →
/// striker / non-striker rows → bowler line → last-6 balls dots. The
/// distinguishing visual cue is the **lime top border** separating the
/// ticker from the broadcast frame.
class _NeonClassicTicker extends StatelessWidget {
  final LiveScoreSnapshot snap;
  final ScoringPalette palette;
  const _NeonClassicTicker({required this.snap, required this.palette});

  @override
  Widget build(BuildContext context) {
    final s = snap;
    final striker = s.batters.isNotEmpty ? s.batters.first : null;
    final nonStriker = s.batters.length > 1 ? s.batters[1] : null;
    final bowler = s.bowler;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: palette.bg.withValues(alpha: 0.92),
        border: Border(top: BorderSide(color: palette.primary, width: 2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  s.battingTeamName.toUpperCase(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: palette.primary,
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2,
                  ),
                ),
              ),
              if (s.target != null)
                Text(
                  'TARGET ${s.target}  •  NEED ${s.runsNeeded ?? '-'} / ${s.ballsRemaining ?? '-'}B',
                  style: TextStyle(
                    color: palette.secondary,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('${s.runs}/${s.wickets}',
                  style: TextStyle(
                    color: palette.primary,
                    fontSize: 38,
                    fontWeight: FontWeight.w900,
                    height: 1,
                  )),
              const SizedBox(width: 10),
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text('(${s.overString})',
                    style: TextStyle(
                      color: palette.secondary,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    )),
              ),
              const Spacer(),
              Text('CRR ${s.crr}',
                  style: TextStyle(
                    color: palette.secondary,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  )),
              if (s.rrr != null) ...[
                const SizedBox(width: 12),
                Text('RRR ${s.rrr}',
                    style: TextStyle(
                      color: palette.primary,
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                    )),
              ],
            ],
          ),
          const SizedBox(height: 10),
          if (striker != null) _batterRow(striker, onStrike: true),
          if (nonStriker != null) ...[
            const SizedBox(height: 4),
            _batterRow(nonStriker, onStrike: false),
          ],
          if (bowler != null) ...[
            const SizedBox(height: 8),
            _bowlerRow(bowler),
          ],
          if (s.last6Balls.isNotEmpty) ...[
            const SizedBox(height: 10),
            Row(
              children: s.last6Balls.take(6).map((b) {
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: _ballDot(b),
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _batterRow(BatterStat b, {required bool onStrike}) {
    return Row(
      children: [
        if (onStrike)
          const Padding(
            padding: EdgeInsets.only(right: 4),
            child: Text('🏏', style: TextStyle(fontSize: 12)),
          ),
        Expanded(
          child: Text(b.name.toUpperCase(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: onStrike ? palette.primary : Colors.white70,
                fontSize: 11,
                fontWeight: FontWeight.w900,
              )),
        ),
        Text('${b.runs} (${b.balls})',
            style: TextStyle(
              color: palette.primary,
              fontSize: 12,
              fontWeight: FontWeight.w900,
            )),
      ],
    );
  }

  Widget _bowlerRow(BowlerStat b) {
    return Row(
      children: [
        Expanded(
          child: Text(b.name.toUpperCase(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: palette.secondary,
                fontSize: 11,
                fontWeight: FontWeight.w900,
                letterSpacing: 1,
              )),
        ),
        Text('${b.wickets}/${b.runs} • ${b.oversString} OVERS',
            style: TextStyle(
              color: palette.primary,
              fontSize: 11,
              fontWeight: FontWeight.w900,
            )),
      ],
    );
  }

  Widget _ballDot(TimelineBall b) {
    Color bg;
    Color fg = Colors.white;
    if (b.type == 'wicket') {
      bg = const Color(0xFFEF4444);
    } else if (b.type == 'boundary') {
      bg = palette.primary;
      fg = Colors.black;
    } else if (b.label == '0') {
      bg = Colors.white.withValues(alpha: 0.08);
      fg = Colors.white54;
    } else {
      bg = Colors.white.withValues(alpha: 0.2);
    }
    return Container(
      width: 24,
      height: 24,
      alignment: Alignment.center,
      decoration: BoxDecoration(shape: BoxShape.circle, color: bg),
      child: Text(b.label,
          style: TextStyle(
            color: fg,
            fontSize: 11,
            fontWeight: FontWeight.w900,
          )),
    );
  }
}
