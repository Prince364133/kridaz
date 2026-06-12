import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

enum LiveCardKind { endOfOver, milestone }

class LiveCardData {
  final LiveCardKind kind;
  final String batterName;
  final int batterRuns;
  final int batterBalls;
  final int batterFours;
  final int batterSixes;
  final String strikeRate;
  final int totalRuns;
  final int totalWickets;
  final int overs;
  final String crr;
  final String? bowlerName;
  final int bowlerRuns;
  final int bowlerWickets;
  final List<({String label, String type, bool freeHit})> last6Balls;

  const LiveCardData({
    required this.kind,
    this.batterName = '',
    this.batterRuns = 0,
    this.batterBalls = 0,
    this.batterFours = 0,
    this.batterSixes = 0,
    this.strikeRate = '0.00',
    this.totalRuns = 0,
    this.totalWickets = 0,
    this.overs = 0,
    this.crr = '0.00',
    this.bowlerName,
    this.bowlerRuns = 0,
    this.bowlerWickets = 0,
    this.last6Balls = const [],
  });
}

/// Animated overlay card shown over the scoring console for end-of-over and
/// milestone events. Slides in from the left, holds, slides out. Port of
/// `LiveCards.jsx`.
class LiveCards extends StatefulWidget {
  final LiveCardData? card;
  final Duration display;
  final VoidCallback? onDismissed;

  const LiveCards({
    super.key,
    required this.card,
    this.display = const Duration(seconds: 8),
    this.onDismissed,
  });

  @override
  State<LiveCards> createState() => _LiveCardsState();
}

class _LiveCardsState extends State<LiveCards>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<Offset> _slide;
  late final Animation<double> _fade;
  LiveCardData? _last;
  bool _dismissedByUser = false;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 400));
    // Slides down from above into the top — matches the card now living at
    // the top of the screen instead of bottom-left.
    _slide = Tween<Offset>(begin: const Offset(0, -1.2), end: Offset.zero)
        .chain(CurveTween(curve: Curves.easeOutBack))
        .animate(_ctrl);
    _fade = Tween<double>(begin: 0, end: 1).animate(_ctrl);
    if (widget.card != null) {
      _last = widget.card;
      _show();
    }
  }

  void _show() async {
    _dismissedByUser = false;
    await _ctrl.forward();
    if (!mounted) return;
    await Future.delayed(widget.display);
    if (!mounted || _dismissedByUser) return;
    await _ctrl.reverse();
    if (!mounted) return;
    widget.onDismissed?.call();
  }

  /// Triggered by the close-X in the corner of the card. Runs the reverse
  /// animation immediately, then fires `onDismissed` so the parent clears
  /// the pending card slot.
  Future<void> _dismissNow() async {
    _dismissedByUser = true;
    if (_ctrl.status == AnimationStatus.forward) {
      await _ctrl.forward();
    }
    if (!mounted) return;
    await _ctrl.reverse();
    if (!mounted) return;
    widget.onDismissed?.call();
  }

  @override
  void didUpdateWidget(covariant LiveCards old) {
    super.didUpdateWidget(old);
    if (widget.card != null && widget.card != _last) {
      _last = widget.card;
      _ctrl.value = 0;
      _show();
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final card = _last;
    if (card == null) return const SizedBox.shrink();
    final topPad = MediaQuery.of(context).padding.top;
    return Positioned(
      top: topPad + 12,
      left: 16,
      right: 16,
      child: FadeTransition(
        opacity: _fade,
        child: SlideTransition(
          position: _slide,
          child: Material(
            color: Colors.transparent,
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A).withValues(alpha: 0.94),
                border: Border.all(color: const Color(0xFFA3E635), width: 2),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                      color: Colors.black.withValues(alpha: 0.5),
                      blurRadius: 30,
                      offset: const Offset(0, 10)),
                ],
              ),
              child: Stack(
                children: [
                  card.kind == LiveCardKind.endOfOver
                      ? _endOfOver(card)
                      : _milestone(card),
                  Positioned(
                    top: 6,
                    right: 6,
                    child: _CloseButton(onTap: _dismissNow),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _endOfOver(LiveCardData c) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 44, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('END OF OVER ${c.overs}',
              style: const TextStyle(
                  color: Color(0xFF94A3B8),
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.8)),
          const SizedBox(height: 10),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${c.totalRuns}/${c.totalWickets}',
                      style: const TextStyle(
                          color: Color(0xFFA3E635),
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                          height: 1)),
                  const SizedBox(height: 4),
                  Text('CRR: ${c.crr}',
                      style: const TextStyle(
                          color: Color(0xFF94A3B8), fontSize: 13)),
                ],
              ),
              const Spacer(),
              if (c.bowlerName != null)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(c.bowlerName!,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text('${c.bowlerWickets}-${c.bowlerRuns}',
                        style: const TextStyle(
                            color: Color(0xFF94A3B8), fontSize: 13)),
                  ],
                ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: c.last6Balls.take(6).map((b) {
              // Same colour grammar as the BALLING strip: wicket=red,
              // 6=purple, 4=green, extras=orange, dot=grey pill with •,
              // off-the-bat 1/2/3=yellow.
              final lower = b.label.toLowerCase();
              final isWicket = b.type == 'wicket';
              final isSix = b.label.startsWith('6');
              final isFour = b.label.startsWith('4');
              final isWide = lower.endsWith('wd');
              final isNoBall = lower.endsWith('nb');
              final isLegBye = lower.endsWith('lb');
              final isBye = !isLegBye && lower.endsWith('b');
              final isPenalty = lower.endsWith('p') && !lower.endsWith('wp');
              final isExtra =
                  isWide || isNoBall || isLegBye || isBye || isPenalty;
              final isDot = b.label == '0';

              Color bg;
              Color fg = Colors.white;
              if (isWicket) {
                bg = const Color(0xFFEF4444);
              } else if (isSix) {
                bg = const Color(0xFF8B5CF6);
              } else if (isFour) {
                bg = const Color(0xFF22C55E);
              } else if (isExtra) {
                bg = const Color(0xFFF97316);
              } else if (isDot) {
                bg = Colors.white.withValues(alpha: 0.10);
                fg = Colors.white60;
              } else {
                bg = const Color(0xFFFFC403);
                fg = Colors.black;
              }

              final text = isDot ? '•' : b.label;
              final fontSize = isDot
                  ? 18.0
                  : (b.label.length >= 3
                      ? 9.0
                      : b.label.length == 2
                          ? 11.0
                          : 13.0);

              return Padding(
                padding: const EdgeInsets.only(right: 5),
                child: Container(
                  width: 32,
                  height: 32,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: bg,
                    // Yellow ring = ball was bowled on a free hit.
                    border: b.freeHit
                        ? Border.all(color: const Color(0xFFFFC403), width: 2)
                        : null,
                  ),
                  child: Text(text,
                      style: TextStyle(
                          color: fg,
                          fontSize: fontSize,
                          fontWeight: FontWeight.w900)),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _milestone(LiveCardData c) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 44, 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('MILESTONE REACHED',
              style: TextStyle(
                  color: Color(0xFFA3E635),
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2)),
          const SizedBox(height: 10),
          Text(c.batterName,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w700)),
          Text('${c.batterRuns}',
              style: const TextStyle(
                  color: Color(0xFFA3E635),
                  fontSize: 56,
                  fontWeight: FontWeight.w900,
                  height: 1.05)),
          const SizedBox(height: 6),
          Text('off ${c.batterBalls} balls (SR: ${c.strikeRate})',
              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _kv('4s', c.batterFours),
              const SizedBox(width: 18),
              _kv('6s', c.batterSixes),
            ],
          ),
        ],
      ),
    );
  }

  Widget _kv(String label, int value) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('$label: ',
            style: const TextStyle(color: Colors.white, fontSize: 14)),
        Text('$value',
            style: const TextStyle(
                color: Color(0xFFA3E635),
                fontSize: 14,
                fontWeight: FontWeight.w900)),
      ],
    );
  }
}

/// Small dismiss chip overlaid on the top-right of the card.
class _CloseButton extends StatelessWidget {
  final VoidCallback onTap;
  const _CloseButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkResponse(
        onTap: onTap,
        radius: 22,
        child: Container(
          width: 32,
          height: 32,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.white.withValues(alpha: 0.1),
            border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
          ),
          child: const Icon(LucideIcons.x, color: Colors.white70, size: 16),
        ),
      ),
    );
  }
}
