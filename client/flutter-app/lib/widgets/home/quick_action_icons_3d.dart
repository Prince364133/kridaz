import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

// Chunky 3D home quick-action icons — ported from the Saavik design handoff.
// Each glyph is generated as an inline SVG so flutter_svg can paint the
// gradients, drop shadow and rim highlights crisply at any size.

enum QuickIcon3DKind {
  bookGround,
  nearbyPlayers,
  joinGame,
  myTeams,
  tournaments,
  hostGame,
  joinAGame, // Cricket bat + ball — Games tab
  scoreAMatch, // Scoreboard — Games tab
}

class _Mat {
  final String l, m, d, dd;
  const _Mat(this.l, this.m, this.d, this.dd);
}

const _matBlue = _Mat('#AECBFF', '#3B82F6', '#1D4ED8', '#16307A');
const _matLime = _Mat('#E2FBA6', '#84CC16', '#4D7C0F', '#2E4A0C');
const _matGold = _Mat('#FFE9A3', '#F5A623', '#B45309', '#73370A');
const _matPurple = _Mat('#E2C4FE', '#A855F7', '#7E22CE', '#4A1680');
const _matRose = _Mat('#FFB8C2', '#F43F5E', '#BE123C', '#7C0E2A');
const _matSteel = _Mat('#EEF2F7', '#9AA8BC', '#4A5A72', '#1E293B');
const _matCoral = _Mat('#FFC2AE', '#FB6F50', '#D62E16', '#8F1B0C');
const _matWood = _Mat('#F4DCAC', '#DCA864', '#A9743A', '#714826');
const _matBall = _Mat('#FF9A8E', '#E23B3B', '#A11616', '#660C0C');

const Map<QuickIcon3DKind, List<Color>> tileGradient3D = {
  QuickIcon3DKind.bookGround: [Color(0xFF34D17A), Color(0xFF1FA258)],
  QuickIcon3DKind.nearbyPlayers: [Color(0xFF2E6BE6), Color(0xFF1B49B0)],
  QuickIcon3DKind.joinGame: [Color(0xFF92D62E), Color(0xFF5FA416)],
  QuickIcon3DKind.myTeams: [Color(0xFFB44DEA), Color(0xFF8A1FD6)],
  QuickIcon3DKind.tournaments: [Color(0xFFF6A93B), Color(0xFFE07712)],
  QuickIcon3DKind.hostGame: [Color(0xFFFB5E7E), Color(0xFFE11D48)],
  // Games-tab wide cards use a different palette per the Saavik handoff.
  QuickIcon3DKind.joinAGame: [Color(0xFF3C9BE8), Color(0xFF2766C4)],
  QuickIcon3DKind.scoreAMatch: [Color(0xFFF6962E), Color(0xFFE2630F)],
};

const Map<QuickIcon3DKind, String> tileLabel3D = {
  QuickIcon3DKind.bookGround: 'Book\nGround',
  QuickIcon3DKind.nearbyPlayers: 'Nearby\nPlayers',
  QuickIcon3DKind.joinGame: 'Join\nGame',
  QuickIcon3DKind.myTeams: 'My\nTeams',
  QuickIcon3DKind.tournaments: 'Tourna-\nments',
  QuickIcon3DKind.hostGame: 'Host a\nGame',
  QuickIcon3DKind.joinAGame: 'Join a\nGame',
  QuickIcon3DKind.scoreAMatch: 'Score a\nMatch',
};

String _svgFor(QuickIcon3DKind kind) {
  switch (kind) {
    case QuickIcon3DKind.bookGround:
      return _stadiumSvg(_matSteel);
    case QuickIcon3DKind.nearbyPlayers:
      return _mapPinSvg(_matBlue, _matCoral);
    case QuickIcon3DKind.joinGame:
      return _whistleSvg(_matLime);
    case QuickIcon3DKind.myTeams:
      return _shieldSvg(_matPurple);
    case QuickIcon3DKind.tournaments:
      return _trophySvg(_matGold);
    case QuickIcon3DKind.hostGame:
      return _megaphoneSvg(_matRose);
    case QuickIcon3DKind.joinAGame:
      return _cricketBatSvg(_matWood, _matBall);
    case QuickIcon3DKind.scoreAMatch:
      return _scoreboardSvg(_matSteel);
  }
}

String _filters(String p) => '''
<filter id="$p-sh" x="-50%" y="-40%" width="200%" height="190%">
  <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000" flood-opacity="0.38"/>
</filter>
<filter id="$p-bl" x="-80%" y="-80%" width="260%" height="260%">
  <feGaussianBlur stdDeviation="1.5"/>
</filter>
''';

String _shadow(
        {double cx = 40,
        double cy = 70,
        double rx = 25,
        double ry = 4.5,
        double o = 0.32}) =>
    '<ellipse cx="$cx" cy="$cy" rx="$rx" ry="$ry" fill="rgba(0,0,0,$o)"/>';

// ── Map + pin ────────────────────────────────────────────────────────────────
String _mapPinSvg(_Mat c, _Mat pin) => '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <defs>
    ${_filters('mp')}
    <linearGradient id="mp-lit" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.9"/>
      <stop offset="0.18" stop-color="${c.l}"/>
      <stop offset="1" stop-color="${c.m}"/>
    </linearGradient>
    <linearGradient id="mp-valley" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c.m}"/>
      <stop offset="1" stop-color="${c.d}"/>
    </linearGradient>
    <linearGradient id="mp-side" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c.d}"/>
      <stop offset="1" stop-color="${c.dd}"/>
    </linearGradient>
    <linearGradient id="mp-pin" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="${pin.l}"/>
      <stop offset="0.5" stop-color="${pin.m}"/>
      <stop offset="1" stop-color="${pin.d}"/>
    </linearGradient>
  </defs>
  ${_shadow(cy: 71, rx: 28, ry: 4.5)}
  <g filter="url(#mp-sh)">
    <polygon points="10,68 30,60 50,68 70,60 70,65 50,73 30,65 10,73" fill="url(#mp-side)"/>
    <polygon points="10,42 30,34 30,60 10,68" fill="url(#mp-lit)"/>
    <polygon points="30,34 50,42 50,68 30,60" fill="url(#mp-valley)"/>
    <polygon points="50,42 70,34 70,60 50,68" fill="url(#mp-lit)"/>
  </g>
  <line x1="10" y1="42" x2="30" y2="34" stroke="rgba(255,255,255,0.7)" stroke-width="1.3"/>
  <line x1="50" y1="42" x2="70" y2="34" stroke="rgba(255,255,255,0.7)" stroke-width="1.3"/>
  <line x1="30" y1="34" x2="30" y2="60" stroke="rgba(0,0,0,0.28)" stroke-width="1.5"/>
  <line x1="50" y1="42" x2="50" y2="68" stroke="rgba(0,0,0,0.22)" stroke-width="1.5"/>
  <path d="M13 52 L27 45 L33 49 L47 42" stroke="rgba(255,255,255,0.78)" stroke-width="1.7" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M53 47 L62 43 L67 46" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M16 61 L24 57" stroke="rgba(255,255,255,0.38)" stroke-width="1.3" fill="none"/>
  <ellipse cx="42" cy="40" rx="7" ry="2.2" fill="rgba(0,0,0,0.28)"/>
  <g filter="url(#mp-sh)">
    <path d="M42 7 C33 7 28 13 28 20.5 C28 29.5 42 41 42 41 C42 41 56 29.5 56 20.5 C56 13 51 7 42 7 Z" fill="url(#mp-pin)"/>
  </g>
  <circle cx="42" cy="20" r="5.6" fill="#fff"/>
  <circle cx="42" cy="20" r="2.6" fill="${pin.d}"/>
  <ellipse cx="37.5" cy="14" rx="3.2" ry="5" fill="rgba(255,255,255,0.85)" filter="url(#mp-bl)" transform="rotate(-22 37.5 14)"/>
</svg>
''';

// ── Whistle ─────────────────────────────────────────────────────────────────
String _whistleSvg(_Mat c) => '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <defs>
    ${_filters('wh')}
    <radialGradient id="wh-ball" cx="0.35" cy="0.3" r="0.85">
      <stop offset="0" stop-color="#fff" stop-opacity="0.7"/>
      <stop offset="0.14" stop-color="${c.l}"/>
      <stop offset="0.58" stop-color="${c.m}"/>
      <stop offset="1" stop-color="${c.dd}"/>
    </radialGradient>
    <linearGradient id="wh-tube" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c.l}"/>
      <stop offset="0.5" stop-color="${c.m}"/>
      <stop offset="1" stop-color="${c.d}"/>
    </linearGradient>
  </defs>
  ${_shadow(cx: 35, cy: 67, rx: 23, ry: 4.5)}
  <g filter="url(#wh-sh)">
    <circle cx="23" cy="23" r="6.8" fill="none" stroke="${c.d}" stroke-width="4.4"/>
    <circle cx="23" cy="23" r="6.8" fill="none" stroke="${c.l}" stroke-width="1.5"/>
    <g transform="rotate(-22 48 36)">
      <rect x="43" y="29" width="25" height="14" rx="7" fill="url(#wh-tube)"/>
      <rect x="47" y="31" width="17" height="3.4" rx="1.7" fill="rgba(255,255,255,0.6)"/>
    </g>
    <circle cx="34" cy="46" r="17.5" fill="url(#wh-ball)"/>
  </g>
  <path d="M22 56 A17.5 17.5 0 0 0 50 49" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2.2" stroke-linecap="round" filter="url(#wh-bl)"/>
  <circle cx="30" cy="44" r="3.1" fill="${c.dd}"/>
  <circle cx="30" cy="44" r="3.1" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>
  <ellipse cx="26.5" cy="38" rx="6.5" ry="4.5" fill="rgba(255,255,255,0.9)" filter="url(#wh-bl)" transform="rotate(-30 26.5 38)"/>
  <circle cx="41" cy="53" r="2.2" fill="rgba(255,255,255,0.35)"/>
</svg>
''';

// ── Stadium ─────────────────────────────────────────────────────────────────
String _stadiumSvg(_Mat s) {
  final seatLines = StringBuffer();
  for (var i = 0; i < 14; i++) {
    final a = (i / 14) * 2 * math.pi;
    final x1 = 40 + 19.5 * math.cos(a);
    final y1 = 42 + 9.7 * math.sin(a);
    final x2 = 40 + 31.5 * math.cos(a);
    final y2 = 42 + 15.7 * math.sin(a);
    seatLines.write(
      '<line x1="${x1.toStringAsFixed(2)}" y1="${y1.toStringAsFixed(2)}" '
      'x2="${x2.toStringAsFixed(2)}" y2="${y2.toStringAsFixed(2)}" '
      'stroke="rgba(0,0,0,0.14)" stroke-width="1"/>',
    );
  }
  String light(double fx, double fy) {
    final dx = fx < 40 ? 5 : -5;
    final dy = fy < 42 ? 5 : -5;
    return '''
<g filter="url(#st-sh)">
  <line x1="$fx" y1="$fy" x2="${fx + dx}" y2="${fy + dy}" stroke="${s.dd}" stroke-width="1.8"/>
  <rect x="${fx - 3.2}" y="${fy - 4}" width="6.4" height="4.2" rx="1.6" fill="#FFF6C8"/>
</g>''';
  }

  return '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <defs>
    ${_filters('st')}
    <linearGradient id="st-wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${s.m}"/>
      <stop offset="1" stop-color="${s.dd}"/>
    </linearGradient>
    <radialGradient id="st-rim" cx="0.42" cy="0.32" r="0.8">
      <stop offset="0" stop-color="#fff"/>
      <stop offset="0.4" stop-color="${s.l}"/>
      <stop offset="1" stop-color="${s.m}"/>
    </radialGradient>
    <radialGradient id="st-field" cx="0.5" cy="0.38" r="0.75">
      <stop offset="0" stop-color="#a6ef96"/>
      <stop offset="1" stop-color="#318a3e"/>
    </radialGradient>
  </defs>
  ${_shadow(cy: 68, rx: 30, ry: 5)}
  <g filter="url(#st-sh)">
    <path d="M7 42 A33 17 0 0 0 73 42 L73 55 A33 17 0 0 1 7 55 Z" fill="url(#st-wall)"/>
    <ellipse cx="40" cy="42" rx="33" ry="17" fill="url(#st-rim)"/>
  </g>
  <ellipse cx="40" cy="42" rx="33" ry="17" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.2"/>
  <ellipse cx="40" cy="42" rx="26.5" ry="13.2" fill="none" stroke="rgba(0,0,0,0.14)" stroke-width="1"/>
  $seatLines
  <ellipse cx="40" cy="42" rx="19.5" ry="9.8" fill="rgba(0,0,0,0.25)"/>
  <ellipse cx="40" cy="41.4" rx="18.5" ry="9.2" fill="url(#st-field)"/>
  <line x1="40" y1="32.5" x2="40" y2="50.5" stroke="rgba(255,255,255,0.6)" stroke-width="1"/>
  <circle cx="40" cy="41.5" r="3" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1"/>
  ${light(12, 29)}
  ${light(68, 29)}
  ${light(13, 56)}
  ${light(67, 56)}
  <ellipse cx="26" cy="33" rx="12" ry="4.2" fill="rgba(255,255,255,0.7)" filter="url(#st-bl)" transform="rotate(-12 26 33)"/>
</svg>
''';
}

// ── Shield / crest ──────────────────────────────────────────────────────────
String _shieldSvg(_Mat c) => '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <defs>
    ${_filters('sd')}
    <radialGradient id="sd-body" cx="0.4" cy="0.28" r="0.95">
      <stop offset="0" stop-color="#fff" stop-opacity="0.55"/>
      <stop offset="0.18" stop-color="${c.l}"/>
      <stop offset="0.6" stop-color="${c.m}"/>
      <stop offset="1" stop-color="${c.dd}"/>
    </radialGradient>
  </defs>
  ${_shadow(cy: 71, rx: 20, ry: 4)}
  <g filter="url(#sd-sh)">
    <path d="M40 12 L63 19 C63 42 55 60 40 70 C25 60 17 42 17 19 Z" fill="${c.dd}"/>
    <path d="M40 9 L62 16 C62 39 54 57 40 67 C26 57 18 39 18 16 Z" fill="url(#sd-body)"/>
  </g>
  <path d="M40 15 L56 20.5 C56 39 49 53 40 60 C31 53 24 39 24 20.5 Z"
        fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
  <path d="M40 25 l3.4 6.9 7.6 1.1 -5.5 5.4 1.3 7.5 -6.8 -3.6 -6.8 3.6 1.3 -7.5 -5.5 -5.4 7.6 -1.1 Z" fill="#fff"/>
  <path d="M40 25 l3.4 6.9 7.6 1.1 -5.5 5.4 1.3 7.5 -6.8 -3.6 Z" fill="rgba(0,0,0,0.1)"/>
  <path d="M40 10 L60 16.5 C60 27 57 37 51 45 C47 30 44 19 40 10 Z" fill="rgba(255,255,255,0.35)" filter="url(#sd-bl)"/>
</svg>
''';

// ── Trophy ──────────────────────────────────────────────────────────────────
String _trophySvg(_Mat c) => '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <defs>
    ${_filters('tr')}
    <linearGradient id="tr-cup" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.7"/>
      <stop offset="0.2" stop-color="${c.l}"/>
      <stop offset="0.55" stop-color="${c.m}"/>
      <stop offset="1" stop-color="${c.d}"/>
    </linearGradient>
    <linearGradient id="tr-base" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c.m}"/>
      <stop offset="1" stop-color="${c.dd}"/>
    </linearGradient>
  </defs>
  ${_shadow(cy: 71, rx: 19, ry: 4)}
  <g filter="url(#tr-sh)">
    <path d="M25 23 C14 23 12 37 26 41" fill="none" stroke="${c.d}" stroke-width="5"/>
    <path d="M55 23 C66 23 68 37 54 41" fill="none" stroke="${c.d}" stroke-width="5"/>
    <rect x="36" y="48" width="8" height="9" fill="url(#tr-base)"/>
    <path d="M29 57 L51 57 L54 63 L26 63 Z" fill="url(#tr-base)"/>
    <rect x="24" y="63" width="32" height="5.5" rx="2.5" fill="${c.dd}"/>
    <path d="M24 19 L56 19 C56 38 48 49 40 49 C32 49 24 38 24 19 Z" fill="url(#tr-cup)"/>
    <ellipse cx="40" cy="19" rx="16" ry="3.8" fill="${c.l}"/>
    <ellipse cx="40" cy="19" rx="16" ry="3.8" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="0.8"/>
  </g>
  <path d="M40 26 l2.5 5 5.5 0.8 -4 3.9 0.95 5.4 -4.95 -2.6 -4.95 2.6 0.95 -5.4 -4 -3.9 5.5 -0.8 Z" fill="#fff" opacity="0.92"/>
  <path d="M30 21 C30 33 33 42 38 47 C33 45 28.5 34 28.5 21 Z" fill="rgba(255,255,255,0.55)" filter="url(#tr-bl)"/>
</svg>
''';

// ── Megaphone ───────────────────────────────────────────────────────────────
String _megaphoneSvg(_Mat c) => '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <defs>
    ${_filters('mg')}
    <linearGradient id="mg-bell" x1="0" y1="0.1" x2="1" y2="0.7">
      <stop offset="0" stop-color="${c.d}"/>
      <stop offset="0.5" stop-color="${c.m}"/>
      <stop offset="1" stop-color="${c.l}"/>
    </linearGradient>
    <linearGradient id="mg-handle" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c.l}"/>
      <stop offset="1" stop-color="${c.d}"/>
    </linearGradient>
  </defs>
  ${_shadow(cx: 42, cy: 67, rx: 24, ry: 4.5)}
  <g stroke="${c.l}" stroke-width="2.6" fill="none" stroke-linecap="round">
    <path d="M63 29 a9 9 0 0 1 0 20"/>
    <path d="M69 24 a15 15 0 0 1 0 30"/>
  </g>
  <g filter="url(#mg-sh)">
    <rect x="29" y="51" width="9" height="15" rx="3.5" fill="url(#mg-handle)" transform="rotate(12 33 58)"/>
    <path d="M13 33 L50 21 C54 20 57 23 57 27.5 L57 50.5 C57 55 54 58 50 57 L13 45 Z" fill="url(#mg-bell)"/>
    <ellipse cx="53" cy="39" rx="5.5" ry="18" fill="${c.l}"/>
    <ellipse cx="53" cy="39" rx="3.2" ry="14" fill="${c.dd}"/>
    <rect x="10" y="33" width="6.5" height="12" rx="3" fill="${c.d}"/>
  </g>
  <path d="M19 35 L46 26.5 C46 29.5 46 31 46 32 L19 39 Z" fill="rgba(255,255,255,0.55)" filter="url(#mg-bl)"/>
  <ellipse cx="51" cy="30" rx="2" ry="5" fill="rgba(255,255,255,0.5)" filter="url(#mg-bl)"/>
</svg>
''';

// ── Cricket bat + ball (Join a Game) ────────────────────────────────────────
String _cricketBatSvg(_Mat w, _Mat b) => '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <defs>
    ${_filters('cb')}
    <linearGradient id="cb-blade" x1="0.15" y1="0" x2="0.85" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.6"/>
      <stop offset="0.18" stop-color="${w.l}"/>
      <stop offset="0.6" stop-color="${w.m}"/>
      <stop offset="1" stop-color="${w.d}"/>
    </linearGradient>
    <linearGradient id="cb-grip" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#3A3F46"/>
      <stop offset="0.5" stop-color="#23272D"/>
      <stop offset="1" stop-color="#14171B"/>
    </linearGradient>
    <radialGradient id="cb-ball" cx="0.35" cy="0.3" r="0.85">
      <stop offset="0" stop-color="#fff" stop-opacity="0.6"/>
      <stop offset="0.16" stop-color="${b.l}"/>
      <stop offset="0.6" stop-color="${b.m}"/>
      <stop offset="1" stop-color="${b.dd}"/>
    </radialGradient>
  </defs>
  ${_shadow(cx: 40, cy: 70, rx: 27, ry: 4.5)}
  <g filter="url(#cb-sh)" transform="rotate(32 40 42)">
    <rect x="36.5" y="8" width="7" height="20" rx="3.5" fill="url(#cb-grip)"/>
    <line x1="37" y1="13" x2="43" y2="13" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
    <line x1="37" y1="17" x2="43" y2="17" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
    <line x1="37" y1="21" x2="43" y2="21" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
    <path d="M36.5 26 L43.5 26 L46 33 L34 33 Z" fill="${w.d}"/>
    <rect x="32" y="31" width="16" height="35" rx="7" fill="url(#cb-blade)"/>
    <rect x="34.5" y="34" width="3.2" height="27" rx="1.6" fill="rgba(255,255,255,0.4)"/>
    <line x1="40" y1="34" x2="40" y2="62" stroke="rgba(0,0,0,0.12)" stroke-width="1.2"/>
  </g>
  <g filter="url(#cb-sh)">
    <circle cx="55" cy="30" r="9.5" fill="url(#cb-ball)"/>
    <path d="M48 27 Q55 31 62 27" fill="none" stroke="#fff" stroke-width="1.3" opacity="0.85"/>
    <line x1="50" y1="27.5" x2="50" y2="30.5" stroke="#fff" stroke-width="0.9" opacity="0.8"/>
    <line x1="53.3" y1="27.5" x2="53.3" y2="30.5" stroke="#fff" stroke-width="0.9" opacity="0.8"/>
    <line x1="56.7" y1="27.5" x2="56.7" y2="30.5" stroke="#fff" stroke-width="0.9" opacity="0.8"/>
    <line x1="60" y1="27.5" x2="60" y2="30.5" stroke="#fff" stroke-width="0.9" opacity="0.8"/>
    <ellipse cx="51" cy="25" rx="3" ry="2.2" fill="rgba(255,255,255,0.85)" filter="url(#cb-bl)" transform="rotate(-25 51 25)"/>
  </g>
</svg>
''';

// ── Scoreboard (Score a Match) ──────────────────────────────────────────────
String _scoreboardSvg(_Mat s) => '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <defs>
    ${_filters('sc')}
    <linearGradient id="sc-frame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.5"/>
      <stop offset="0.16" stop-color="${s.l}"/>
      <stop offset="0.6" stop-color="${s.m}"/>
      <stop offset="1" stop-color="${s.d}"/>
    </linearGradient>
    <filter id="sc-glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="1.6"/>
    </filter>
  </defs>
  ${_shadow(cy: 69, rx: 28, ry: 4.5)}
  <g filter="url(#sc-sh)">
    <rect x="25" y="13" width="8" height="9" rx="2" fill="${s.d}"/>
    <rect x="47" y="13" width="8" height="9" rx="2" fill="${s.d}"/>
    <rect x="12" y="22" width="56" height="40" rx="9" fill="${s.dd}"/>
    <rect x="12" y="19" width="56" height="40" rx="9" fill="url(#sc-frame)"/>
    <rect x="18" y="25" width="44" height="28" rx="5" fill="#0B1018"/>
    <rect x="18" y="25" width="44" height="28" rx="5" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="1.4"/>
  </g>
  <text x="40" y="46.5" text-anchor="middle" font-family="Courier New, monospace" font-size="23" font-weight="800" fill="#7BE36A" filter="url(#sc-glow)">2:0</text>
  <text x="40" y="46.5" text-anchor="middle" font-family="Courier New, monospace" font-size="23" font-weight="800" fill="#C8FFA8" letter-spacing="1">2:0</text>
  <path d="M20 27 L60 27 L52 39 L20 39 Z" fill="rgba(255,255,255,0.06)"/>
  <ellipse cx="28" cy="24" rx="11" ry="2.6" fill="rgba(255,255,255,0.6)" filter="url(#sc-bl)"/>
</svg>
''';

// ─────────────────────────────────────────────────────────────────────────────
// Public widgets
// ─────────────────────────────────────────────────────────────────────────────

/// Just the 3D illustration, no tile, no label. Use this when the icon sits on
/// a custom background (e.g. a wide gradient card).
class QuickActionIcon3D extends StatelessWidget {
  final QuickIcon3DKind kind;
  final double size;
  const QuickActionIcon3D({super.key, required this.kind, this.size = 56});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: SvgPicture.string(_svgFor(kind), fit: BoxFit.contain),
    );
  }
}

/// Home-row square tile: gradient background, 3D glyph, 2-line label below.
class QuickActionTile3D extends StatelessWidget {
  final QuickIcon3DKind kind;
  final String? label;
  final VoidCallback onTap;
  final double tileSize;
  final double iconSize;

  const QuickActionTile3D({
    super.key,
    required this.kind,
    required this.onTap,
    this.label,
    this.tileSize = 72,
    this.iconSize = 56,
  });

  @override
  Widget build(BuildContext context) {
    final colors = tileGradient3D[kind]!;
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: tileSize,
            height: tileSize,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: const Alignment(-0.6, -0.9),
                end: const Alignment(0.6, 0.9),
                colors: colors,
              ),
              borderRadius: BorderRadius.circular(22),
              boxShadow: [
                BoxShadow(
                  color: colors[1].withValues(alpha: 0.27),
                  blurRadius: 16,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            alignment: Alignment.center,
            child: QuickActionIcon3D(kind: kind, size: iconSize),
          ),
          const SizedBox(height: 8),
          Text(
            label ?? tileLabel3D[kind]!,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFFE9E9EC),
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
              height: 1.15,
            ),
          ),
        ],
      ),
    );
  }
}

/// Wide gradient card for the Games-tab 2×2 grid: big 3D object pinned
/// top-right, multi-line bold label bottom-left, soft circular sheen.
class QuickActionWideCard3D extends StatelessWidget {
  final QuickIcon3DKind kind;
  final String? label;
  final VoidCallback onTap;
  final double height;
  final double iconSize;

  /// Override the default per-kind gradient. Useful where the same glyph is
  /// reused on a card with a different brand colour (e.g. Games-tab tournaments
  /// reuses the gold trophy on a purple card).
  final List<Color>? gradientColors;

  const QuickActionWideCard3D({
    super.key,
    required this.kind,
    required this.onTap,
    this.label,
    this.height = 200,
    this.iconSize = 116,
    this.gradientColors,
  });

  @override
  Widget build(BuildContext context) {
    final colors = gradientColors ?? tileGradient3D[kind]!;
    // Compact mode: when the card is shorter than ~120, the original tall
    // layout (icon top-right, big label bottom-left) doesn't fit. Switch to a
    // horizontal banner: label left-centered, icon right-centered, tighter
    // typography and corner radius.
    final compact = height < 120;
    final radius = compact ? 14.0 : 26.0;
    final sheenSize = compact ? 90.0 : 160.0;
    final sheenOffset = compact ? -28.0 : -40.0;
    final labelFontSize = compact ? 13.0 : 22.0;
    final labelLeftPad = compact ? 14.0 : 20.0;

    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: Container(
          height: height,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: const Alignment(-0.7, -0.8),
              end: const Alignment(0.7, 0.8),
              colors: colors,
            ),
            borderRadius: BorderRadius.circular(radius),
            boxShadow: [
              BoxShadow(
                color: colors[1].withValues(alpha: 0.27),
                blurRadius: compact ? 18 : 36,
                offset: Offset(0, compact ? 6 : 14),
              ),
            ],
          ),
          child: Stack(
            clipBehavior: Clip.hardEdge,
            children: [
              // Sheen — soft blurred white disc, sized to match the card.
              Positioned(
                top: sheenOffset,
                right: sheenOffset * 0.75,
                child: Container(
                  width: sheenSize,
                  height: sheenSize,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              // 3D illustration — top-right in tall mode, right-centered in compact.
              if (compact)
                Positioned(
                  right: 6,
                  top: 0,
                  bottom: 0,
                  child: Center(
                    child: SizedBox(
                      width: iconSize,
                      height: iconSize,
                      child: QuickActionIcon3D(kind: kind, size: iconSize),
                    ),
                  ),
                )
              else
                Positioned(
                  top: 18,
                  right: 14,
                  child: SizedBox(
                    width: iconSize,
                    height: iconSize,
                    child: QuickActionIcon3D(kind: kind, size: iconSize),
                  ),
                ),
              // Label — bottom-left in tall mode, left-centered in compact.
              if (compact)
                Positioned(
                  left: labelLeftPad,
                  top: 0,
                  bottom: 0,
                  right: iconSize + 8,
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      label ?? tileLabel3D[kind]!,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: labelFontSize,
                        fontWeight: FontWeight.w700,
                        height: 1.1,
                        shadows: const [
                          Shadow(
                            color: Color(0x4D000000),
                            blurRadius: 4,
                            offset: Offset(0, 1),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
              else
                Positioned(
                  left: labelLeftPad,
                  bottom: 20,
                  child: Text(
                    label ?? tileLabel3D[kind]!,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: labelFontSize,
                      fontWeight: FontWeight.w700,
                      height: 1.15,
                      shadows: const [
                        Shadow(
                          color: Color(0x4D000000),
                          blurRadius: 4,
                          offset: Offset(0, 1),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
