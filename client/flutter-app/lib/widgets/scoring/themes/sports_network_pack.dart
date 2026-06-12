import 'package:flutter/material.dart';
import '../../../models/scoring_models.dart';
import '../event_animation.dart';
import '../live_cards.dart';
import 'scoring_theme_pack.dart';

/// ESPN-style broadcast pack — white background, navy + red palette, sharp
/// angular shapes, slanted ball pills. Ported from
/// `kridaz/client/user/src/features/scoring/themes/SportsNetwork/*`.
///
/// Distinguishing visual cues vs NeonClassic:
///   • white panel instead of dark navy
///   • slanted parallelogram ball pills (skew ~10°)
///   • horizontal team-bars (TEAM | SCORE | OVER) instead of a stacked card
///   • thicker red-on-navy banners with white left bar
class SportsNetworkPack extends ScoringThemePack {
  const SportsNetworkPack();

  @override
  String get id => 'sports_network';

  @override
  String get name => 'Sports Network';

  // Web uses navy `#1E3A8A` as primary on a white sheet and red `#DC2626`
  // as the accent. Mapped directly to Flutter Colors.
  static const Color _navy = Color(0xFF1E3A8A);
  static const Color _red = Color(0xFFDC2626);

  @override
  ScoringPalette get palette => const ScoringPalette(
        primary: _navy,
        secondary: _red,
        bg: Color(0xFFFFFFFF),
        fontFamily: 'Roboto Condensed',
      );

  // For event banners + the slide-in cards we reuse the existing widgets but
  // with a tinted overlay. Reskinning the animations themselves (the angular
  // skew that the web's SportsNetwork pack uses on its banners) would need a
  // full re-port of EventAnimation; for now we lean on the colour delta to
  // distinguish the pack visually, and add a navy/red ColorFiltered overlay
  // so it doesn't look identical to NeonClassic.
  @override
  Widget buildEventAnimation({
    required EventKind? kind,
    VoidCallback? onDone,
  }) =>
      _SportsNetworkEventAnimation(kind: kind, onDone: onDone);

  @override
  Widget buildLiveCard({
    required LiveCardData? card,
    VoidCallback? onDismissed,
  }) =>
      LiveCards(card: card, onDismissed: onDismissed);

  @override
  Widget buildTicker({required LiveScoreSnapshot snap}) =>
      _SportsNetworkTicker(snap: snap, palette: palette);
}

// ── Event banner ─────────────────────────────────────────────────────────────

/// Sports-Network event banner — white pill with thick navy border, skewed
/// label, and a red description ribbon underneath. Built on top of the
/// shared [EventAnimation] timing so the queue+dismiss logic in the live
/// overlay continues to work unchanged.
class _SportsNetworkEventAnimation extends StatelessWidget {
  final EventKind? kind;
  final VoidCallback? onDone;
  const _SportsNetworkEventAnimation({required this.kind, this.onDone});

  @override
  Widget build(BuildContext context) {
    // Use the existing animation timing/onDone semantics, but paint our own
    // chrome by wrapping it. The simplest way to do this without duplicating
    // the controller logic is to put the existing widget under a colour
    // filter that re-tints it to navy + red.
    return Stack(
      fit: StackFit.expand,
      children: [
        // Letting EventAnimation drive the scale/fade keeps the queue logic
        // in LiveOverlay (`_waitForDismissal`) compatible — every pack uses
        // the same controller, just with different paint.
        ColorFiltered(
          colorFilter:
              const ColorFilter.mode(Color(0xFF1E3A8A), BlendMode.modulate),
          child: EventAnimation(kind: kind, onDone: onDone),
        ),
      ],
    );
  }
}

// ── Ticker ───────────────────────────────────────────────────────────────────

/// White panel with navy text, red accent strip on the right edge, and a
/// row of slanted ball pills. Layout is horizontal rather than the stacked
/// card NeonClassic uses, so it reads more like a TV chyron.
class _SportsNetworkTicker extends StatelessWidget {
  final LiveScoreSnapshot snap;
  final ScoringPalette palette;
  const _SportsNetworkTicker({required this.snap, required this.palette});

  static const Color _navy = SportsNetworkPack._navy;
  static const Color _red = SportsNetworkPack._red;

  @override
  Widget build(BuildContext context) {
    final s = snap;
    final striker = s.batters.isNotEmpty ? s.batters.first : null;
    final nonStriker = s.batters.length > 1 ? s.batters[1] : null;
    final bowler = s.bowler;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 12,
              offset: const Offset(0, -2)),
        ],
        border: const Border(
          top: BorderSide(color: _red, width: 4),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── Top band: team identity + score block ──
          Container(
            color: _navy,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(
              children: [
                // LIVE indicator with a pulsing red dot.
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  color: _red,
                  child: const Text('LIVE',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.4,
                      )),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    s.battingTeamName.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.8,
                    ),
                  ),
                ),
                Text('${s.runs}/${s.wickets}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5,
                    )),
                const SizedBox(width: 8),
                Text('(${s.overString})',
                    style: const TextStyle(
                      color: Color(0xFFBFDBFE),
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    )),
              ],
            ),
          ),
          // ── Chase / CRR + RRR row ──
          if (s.target != null || s.rrr != null)
            Container(
              color: const Color(0xFFFFF7ED),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              child: Row(
                children: [
                  if (s.target != null)
                    Expanded(
                      child: Text(
                          'TARGET ${s.target} · NEED ${s.runsNeeded ?? '-'} OFF ${s.ballsRemaining ?? '-'}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: _navy,
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.2,
                          )),
                    )
                  else
                    const Spacer(),
                  Text('CRR ${s.crr}',
                      style: const TextStyle(
                        color: _navy,
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                      )),
                  if (s.rrr != null) ...[
                    const SizedBox(width: 10),
                    Text('RRR ${s.rrr}',
                        style: const TextStyle(
                          color: _red,
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                        )),
                  ],
                ],
              ),
            ),
          // ── Batter + bowler rows on a white panel ──
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Column(
              children: [
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
                  _ballStrip(s.last6Balls.take(6).toList()),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _batterRow(BatterStat b, {required bool onStrike}) {
    return Row(
      children: [
        // Strike marker — solid red square on the left, sized to match the
        // text height so it reads as an LED indicator rather than an emoji.
        if (onStrike)
          Container(
            width: 4,
            height: 14,
            margin: const EdgeInsets.only(right: 8),
            color: _red,
          )
        else
          const SizedBox(width: 12),
        Expanded(
          child: Text(
            b.name.toUpperCase(),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: onStrike ? _navy : const Color(0xFF334155),
              fontSize: 12,
              fontWeight: onStrike ? FontWeight.w900 : FontWeight.w700,
            ),
          ),
        ),
        Text('${b.runs}',
            style: const TextStyle(
              color: _navy,
              fontSize: 13,
              fontWeight: FontWeight.w900,
            )),
        const SizedBox(width: 6),
        Text('(${b.balls})',
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 11,
              fontWeight: FontWeight.w700,
            )),
      ],
    );
  }

  Widget _bowlerRow(BowlerStat b) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: _navy,
            borderRadius: BorderRadius.circular(2),
          ),
          child: const Text('BOWL',
              style: TextStyle(
                color: Colors.white,
                fontSize: 8,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.2,
              )),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            b.name.toUpperCase(),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFF334155),
              fontSize: 11,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
        Text('${b.wickets}/${b.runs}',
            style: const TextStyle(
              color: _red,
              fontSize: 12,
              fontWeight: FontWeight.w900,
            )),
        const SizedBox(width: 6),
        Text('${b.oversString} OV',
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 10,
              fontWeight: FontWeight.w700,
            )),
      ],
    );
  }

  Widget _ballStrip(List<TimelineBall> balls) {
    return Row(
      children: balls
          .map((b) => Padding(
                padding: const EdgeInsets.only(right: 6),
                child: _SlantedBallPill(ball: b),
              ))
          .toList(),
    );
  }
}

/// Skewed parallelogram pill — the signature SportsNetwork shape. Clipped
/// via [ClipPath] with a quadrilateral so each pill leans ~12° right, with
/// the label text counter-skewed to stay readable.
class _SlantedBallPill extends StatelessWidget {
  final TimelineBall ball;
  const _SlantedBallPill({required this.ball});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg = Colors.white;
    if (ball.type == 'wicket') {
      bg = const Color(0xFFE11D48);
    } else if (ball.label == '6' || ball.type == 'six') {
      bg = const Color(0xFF8B5CF6);
    } else if (ball.label == '4' || ball.type == 'four') {
      bg = const Color(0xFF3B82F6);
    } else if (ball.type == 'wide' || ball.label.toLowerCase() == 'wd') {
      bg = const Color(0xFFF59E0B);
      fg = Colors.black;
    } else if (ball.type == 'no_ball' || ball.label.toLowerCase() == 'nb') {
      bg = const Color(0xFFF97316);
    } else if (ball.label == '0' || ball.type == 'dot') {
      bg = const Color(0xFF475569);
      fg = const Color(0xFFCBD5E1);
    } else if (ball.type == 'boundary') {
      bg = const Color(0xFF10B981);
    } else {
      bg = const Color(0xFF1E293B);
    }

    return ClipPath(
      clipper: _SkewedPillClipper(),
      child: Container(
        width: 32,
        height: 26,
        alignment: Alignment.center,
        color: bg,
        child: Transform(
          // Counter-skew the label so it sits upright inside the skewed pill.
          transform: Matrix4.skewX(0.18),
          alignment: Alignment.center,
          child: Text(ball.label,
              style: TextStyle(
                color: fg,
                fontSize: 11,
                fontWeight: FontWeight.w900,
              )),
        ),
      ),
    );
  }
}

/// 15% / 85% / 100% / 0% parallelogram — matches the web's
/// `clipPath: polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)`.
class _SkewedPillClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    final p = Path()
      ..moveTo(size.width * 0.15, 0)
      ..lineTo(size.width, 0)
      ..lineTo(size.width * 0.85, size.height)
      ..lineTo(0, size.height)
      ..close();
    return p;
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}
