import 'package:flutter/material.dart';

enum EventKind { four, six, wicket, fifty, hundred }

/// Big-bang animated event banner — fires for boundaries, wickets, and
/// milestones. Port of `EventAnimation.jsx` — uses Flutter's tween animation
/// to scale + fade the banner over ~2 seconds.
class EventAnimation extends StatefulWidget {
  final EventKind? kind;
  final VoidCallback? onDone;
  final Duration duration;

  const EventAnimation({
    super.key,
    required this.kind,
    this.onDone,
    this.duration = const Duration(milliseconds: 2200),
  });

  @override
  State<EventAnimation> createState() => _EventAnimationState();
}

class _EventAnimationState extends State<EventAnimation>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  EventKind? _current;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: widget.duration);
    if (widget.kind != null) {
      _current = widget.kind;
      _play();
    }
  }

  @override
  void didUpdateWidget(covariant EventAnimation old) {
    super.didUpdateWidget(old);
    if (widget.kind != null && widget.kind != _current) {
      _current = widget.kind;
      _ctrl.value = 0;
      _play();
    }
  }

  void _play() async {
    await _ctrl.forward();
    if (!mounted) return;
    widget.onDone?.call();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  ({String text, Color color, Color glow, IconData? icon}) _params() {
    switch (_current) {
      case EventKind.six:
        return (
          text: 'SIX',
          color: const Color(0xFF00C187),
          glow: const Color(0xFF00C187),
          icon: null,
        );
      case EventKind.four:
        return (
          text: 'FOUR',
          color: const Color(0xFF22C55E),
          glow: const Color(0xFF22C55E),
          icon: null,
        );
      case EventKind.wicket:
        return (
          text: 'WICKET',
          color: const Color(0xFFEF4444),
          glow: const Color(0xFFEF4444),
          icon: null,
        );
      case EventKind.fifty:
        return (
          text: 'FIFTY',
          color: const Color(0xFFFACC15),
          glow: const Color(0xFFFACC15),
          icon: null,
        );
      case EventKind.hundred:
        return (
          text: 'CENTURY',
          color: const Color(0xFFA3E635),
          glow: const Color(0xFFA3E635),
          icon: null,
        );
      default:
        return (
          text: '',
          color: Colors.white,
          glow: Colors.white,
          icon: null,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_current == null) return const SizedBox.shrink();
    final p = _params();
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, __) {
        final v = _ctrl.value;
        // Tween: scale 0.5 -> 1.2 in first 30%, ease to 1.0 by 70%, fade out
        double scale;
        double opacity;
        if (v < 0.3) {
          final t = v / 0.3;
          scale = 0.5 + 0.7 * Curves.easeOut.transform(t);
          opacity = t;
        } else if (v < 0.7) {
          final t = (v - 0.3) / 0.4;
          scale = 1.2 - 0.2 * t;
          opacity = 1.0;
        } else {
          final t = (v - 0.7) / 0.3;
          scale = 1.0 + 0.1 * t;
          opacity = 1.0 - t;
        }
        return Center(
          child: Opacity(
            opacity: opacity.clamp(0, 1),
            child: Transform.scale(
              scale: scale,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 32, vertical: 20),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.7),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: p.color, width: 3),
                  boxShadow: [
                    BoxShadow(
                        color: p.glow.withValues(alpha: 0.6),
                        blurRadius: 50,
                        spreadRadius: 4),
                  ],
                ),
                child: Text(p.text,
                    style: TextStyle(
                        color: p.color,
                        fontSize: 56,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 4,
                        shadows: [
                          Shadow(color: p.glow, blurRadius: 30),
                        ])),
              ),
            ),
          ),
        );
      },
    );
  }
}
