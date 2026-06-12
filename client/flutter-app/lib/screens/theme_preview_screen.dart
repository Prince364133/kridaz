import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../widgets/scoring/event_animation.dart';
import '../widgets/scoring/live_cards.dart';
import '../widgets/scoring/themes/theme_packs.dart';

/// Broadcast-overlay theme preview. Loops through a fake live cycle — bowler
/// ticker, end-of-over card, milestone card, six animation, wicket animation —
/// so a scorer can sanity-check what their OBS overlay will look like.
class ThemePreviewScreen extends StatefulWidget {
  final String themeId;
  const ThemePreviewScreen({super.key, this.themeId = 'neon_classic'});

  @override
  State<ThemePreviewScreen> createState() => _ThemePreviewScreenState();
}

// Sample score data used to drive the cycling preview.
const _sampleBatters = [
  ('M. Dhoni', 55, 28, 4, 4, '196.4'),
  ('R. Jadeja', 22, 10, 2, 1, '220.0'),
];
const _sampleLast6 = [
  ('1', 'run'),
  ('4', 'boundary'),
  ('2', 'run'),
  ('6', 'boundary'),
  ('0', 'dot'),
  ('W', 'wicket'),
];

class _ThemePreviewScreenState extends State<ThemePreviewScreen> {
  Timer? _ticker;
  int _step = 0;

  LiveCardData? _card;
  EventKind? _event;

  ({Color primary, Color secondary, Color bg, String fontHint}) get _palette {
    switch (widget.themeId) {
      case 'premium_glass':
        return (
          primary: Colors.white,
          secondary: Colors.white60,
          bg: const Color(0x33FFFFFF),
          fontHint: 'Montserrat',
        );
      case 'retro_arcade':
        return (
          primary: const Color(0xFFFF00FF),
          secondary: const Color(0xFF00FFFF),
          bg: Colors.black,
          fontHint: 'Press Start 2P',
        );
      case 'sports_network':
        return (
          primary: const Color(0xFF1E3A8A),
          secondary: const Color(0xFFDC2626),
          bg: Colors.white,
          fontHint: 'Roboto Condensed',
        );
      case 'cyber_pulse':
        return (
          primary: const Color(0xFF00F3FF),
          secondary: const Color(0xFF94A3B8),
          bg: const Color(0xFF050505),
          fontHint: 'Rajdhani',
        );
      default: // neon_classic
        return (
          primary: const Color(0xFFA3E635),
          secondary: const Color(0xFF94A3B8),
          bg: const Color(0xFF0F172A),
          fontHint: 'Orbitron',
        );
    }
  }

  @override
  void initState() {
    super.initState();
    _ticker = Timer.periodic(const Duration(seconds: 4), (_) => _advance());
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  void _advance() {
    if (!mounted) return;
    setState(() {
      _step = (_step + 1) % 5;
      switch (_step) {
        case 0:
          _card = null;
          _event = null;
          break;
        case 1:
          _card = const LiveCardData(
            kind: LiveCardKind.endOfOver,
            overs: 18,
            totalRuns: 185,
            totalWickets: 3,
            crr: '10.27',
            bowlerName: 'J. Archer',
            bowlerRuns: 28,
            bowlerWickets: 2,
            last6Balls: [
              (label: '1', type: 'run', freeHit: false),
              (label: '4', type: 'boundary', freeHit: false),
              (label: '2', type: 'run', freeHit: false),
              (label: '6', type: 'boundary', freeHit: false),
              (label: '0', type: 'dot', freeHit: false),
              (label: 'W', type: 'wicket', freeHit: false),
            ],
          );
          _event = null;
          break;
        case 2:
          _card = const LiveCardData(
            kind: LiveCardKind.milestone,
            batterName: 'M. DHONI',
            batterRuns: 55,
            batterBalls: 28,
            batterFours: 4,
            batterSixes: 4,
            strikeRate: '196.4',
          );
          _event = null;
          break;
        case 3:
          _card = null;
          _event = EventKind.six;
          break;
        case 4:
          _card = null;
          _event = EventKind.wicket;
          break;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Stadium-style background. Falls back to a dark gradient if the
          // asset isn't bundled in this build.
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                image: const DecorationImage(
                  image: AssetImage('assets/images/home/ground.jpg'),
                  fit: BoxFit.cover,
                  opacity: 0.4,
                  onError: null,
                ),
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.5),
                    Colors.black.withValues(alpha: 0.85),
                  ],
                ),
              ),
            ),
          ),

          // Cards overlay (end of over / milestone) — themed.
          resolveThemePack(widget.themeId).buildLiveCard(
            card: _card,
            onDismissed: () {
              if (mounted) setState(() => _card = null);
            },
          ),

          // Big banner overlay (six / wicket etc.) — themed.
          IgnorePointer(
            child: resolveThemePack(widget.themeId).buildEventAnimation(
              kind: _event,
              onDone: () {
                if (mounted) setState(() => _event = null);
              },
            ),
          ),

          // Bottom ticker (the actual broadcast strip)
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: SafeArea(top: false, child: _ticker_bar()),
          ),

          // Top-right info panel + close
          Positioned(
            top: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: _infoPanel(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _ticker_bar() {
    final p = _palette;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: p.bg.withValues(alpha: 0.9),
        border: Border(top: BorderSide(color: p.primary, width: 2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Text('SUPER KINGS  vs  ROYAL STRIKERS'.toUpperCase(),
                  style: TextStyle(
                      color: p.primary,
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2)),
              const Spacer(),
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444),
                  shape: BoxShape.circle,
                  boxShadow: const [
                    BoxShadow(color: Color(0xFFEF4444), blurRadius: 10),
                  ],
                ),
              ),
              const SizedBox(width: 6),
              const Text('LIVE',
                  style: TextStyle(
                      color: Color(0xFFEF4444),
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2)),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('185/3',
                  style: TextStyle(
                      color: p.primary,
                      fontSize: 36,
                      fontWeight: FontWeight.w900,
                      height: 1)),
              const SizedBox(width: 10),
              Text('(18.0)',
                  style: TextStyle(
                      color: p.secondary,
                      fontSize: 14,
                      fontWeight: FontWeight.w700)),
              const Spacer(),
              Text('CRR 10.27',
                  style: TextStyle(
                      color: p.secondary,
                      fontSize: 12,
                      fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(child: _batter(_sampleBatters[0], onStrike: true)),
              const SizedBox(width: 12),
              Expanded(child: _batter(_sampleBatters[1])),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Text('J. ARCHER  •  3.0 OVERS  •  ECON 9.33',
                    style: TextStyle(
                        color: p.secondary,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1)),
              ),
              Text('2/28',
                  style: TextStyle(
                      color: p.primary,
                      fontSize: 13,
                      fontWeight: FontWeight.w900)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: _sampleLast6.map((b) {
              Color bg;
              switch (b.$2) {
                case 'wicket':
                  bg = const Color(0xFFEF4444);
                  break;
                case 'boundary':
                  bg = p.primary;
                  break;
                case 'dot':
                  bg = Colors.white.withValues(alpha: 0.1);
                  break;
                default:
                  bg = Colors.white.withValues(alpha: 0.25);
              }
              return Padding(
                padding: const EdgeInsets.only(right: 6),
                child: Container(
                  width: 22,
                  height: 22,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
                  child: Text(b.$1,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w900)),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _batter((String, int, int, int, int, String) b,
      {bool onStrike = false}) {
    final p = _palette;
    return Row(
      children: [
        if (onStrike)
          const Padding(
            padding: EdgeInsets.only(right: 4),
            child: Text('🏏', style: TextStyle(fontSize: 12)),
          ),
        Expanded(
          child: Text(b.$1.toUpperCase(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                  color: onStrike ? p.primary : Colors.white70,
                  fontSize: 11,
                  fontWeight: FontWeight.w900)),
        ),
        Text('${b.$2} (${b.$3})',
            style: TextStyle(
                color: p.primary, fontSize: 12, fontWeight: FontWeight.w900)),
      ],
    );
  }

  Widget _infoPanel() {
    return Container(
      padding: const EdgeInsets.all(14),
      constraints: const BoxConstraints(maxWidth: 240),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('PREVIEWING: ${widget.themeId.toUpperCase()}',
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.5)),
          const SizedBox(height: 6),
          const Text('SIMULATING REAL-TIME GRAPHICS CYCLE',
              style: TextStyle(
                  color: Colors.white54,
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.5)),
          const SizedBox(height: 12),
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              if (context.canPop()) context.pop();
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Icon(LucideIcons.x, color: Colors.white, size: 14),
                  SizedBox(width: 6),
                  Text('CLOSE PREVIEW',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.5)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
