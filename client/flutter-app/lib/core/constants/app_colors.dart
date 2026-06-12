import 'package:flutter/material.dart';

/// Centralised colour tokens for the bms app.
///
/// **Use these instead of raw `Color(0xFF...)` literals** so the app can
/// shift palette without a global find-and-replace. New screens should never
/// introduce a hex literal that isn't first added here.
class AppColors {
  // ── Accent ────────────────────────────────────────────────────────────────
  static const primary = Color(0xFF94EA01);
  static const accentCyan = Color(0xFF3BE8B0);
  static const accentCyanLight = Color(0xFF3BF8D2);
  static const accentYellow = Color(0xFFFFD956);
  static const accentGold = Color(0xFFFFC403);
  static const accentGoldWarm = Color(0xFFFFC107); // Material amber 500
  static const accentRed = Color(0xFFEF5350);
  static const errorRed = Color(0xFFFF4444);
  static const accentGreen = Color(0xFF4CAF50);
  static const accentNeonGreen = Color(0xFF00E5A0);
  static const accentLime = Color(0xFF7CFE6A);
  static const accentLimeBright = Color(0xFFA1FF00);
  static const accentTeal = Color(0xFF4ECDC4);
  static const accentOrange = Color(0xFFFF9800);
  static const accentOrangeDeep = Color(0xFFFF5722);
  static const accentBlue = Color(0xFF1565C0);
  static const accentBlueDark = Color(0xFF0D47A1);
  static const accentBlueLight = Color(0xFF4FC3F7);
  static const accentPink = Color(0xFFE91E63);
  static const accentPurple = Color(0xFF9C27B0);
  static const accentIndigo = Color(0xFF6366F1);

  /// Endpoints of [AppGradients.primary] surfaced as standalone tokens —
  /// some places use just one half of the gradient as a solid colour.
  static const gradientStart = Color(0xFF55DEE8);
  static const gradientEnd = Color(0xFFBFF367);

  // ── Web-parity tokens (match the Kridaz web frontend's CSS vars) ─────────
  /// Lime glow used for focus rings, button hover halos — `--primary-glow`
  /// on the web (`rgba(191, 243, 103, 0.4)`).
  static Color get primaryGlow => gradientEnd.withValues(alpha: 0.4);

  /// Slightly darker lime — `--primary-dark` on the web. Use for pressed
  /// states or shadows on lime CTAs.
  static const primaryDark = Color(0xFFA2D152);

  /// Hairline card border matching the web's `--card-border` (`#2D2D2D`).
  /// Use when you want a more subtle card edge than [borderGray].
  static const cardBorderWeb = Color(0xFF2D2D2D);

  // ── Surfaces (dark theme — pick by visual elevation) ─────────────────────
  /// Pure black — the canvas under everything.
  static const surfaceCanvas = Color(0xFF000000);

  /// L0 — page background just above canvas. Slightly lifted off pure black.
  static const surfaceL0 = Color(0xFF0A0A0A);

  /// L1 — primary card / sheet surface.
  static const surfaceL1 = Color(0xFF111111);

  /// L2 — input fields, secondary cards.
  static const surfaceL2 = Color(0xFF151515);

  /// L3 — hover / pressed / elevated card. Same as legacy [backgroundGray].
  static const surfaceL3 = Color(0xFF1A1A1A);

  /// L4 — most-elevated surface (popups, picked-up cards).
  static const surfaceL4 = Color(0xFF1F1F1F);

  /// Slate-blue tinted card background (used for cricket/league cards).
  static const surfaceSlate = Color(0xFF1A2332);

  /// Deep navy card background (used for premium / featured sport cards).
  static const surfaceSlateDeep = Color(0xFF0B1220);

  /// Forest-green tinted card background (used for football/turf cards).
  static const surfaceForest = Color(0xFF1A2A1A);

  /// Deep forest card background.
  static const surfaceForestDeep = Color(0xFF0A1A0A);

  // ── Legacy aliases (don't introduce in new code; here for back-compat) ──
  static const backgroundBlack = surfaceCanvas;
  static const backgroundDark = Color(0xFF151515);
  static const backgroundGray = surfaceL3;
  static const backgroundCard = Color(0xFF2A2A2A);

  // ── Text ─────────────────────────────────────────────────────────────────
  static const textWhite = Color(0xFFFFFFFF);
  static const textGray = Color(0xFF666666);
  static const textLightGray = Color(0xFFB0B0B0);
  static const textDarkGray = Color(0xFF828282);

  /// 0.45 white — secondary labels, captions, hints.
  static Color get dimText => Colors.white.withValues(alpha: 0.45);

  /// 0.55 white — body copy on dark surfaces when full white is too loud.
  static Color get mutedText => Colors.white.withValues(alpha: 0.55);

  /// 0.08 white — hairline dividers between rows / sections.
  static Color get divider => Colors.white.withValues(alpha: 0.08);

  // ── Borders ──────────────────────────────────────────────────────────────
  static const borderGray = Color(0xFF434343);
  static const borderLight = Color(0xFF707070);

  /// 0.08 white — soft border for cards / chips on dark backgrounds.
  static Color get borderSoft => Colors.white.withValues(alpha: 0.08);

  /// 0.15 white — slightly stronger soft border.
  static Color get borderMid => Colors.white.withValues(alpha: 0.15);

  // ── Legacy gradient endpoints (single-purpose; prefer [AppGradients]) ───
  static const blueGradientStart = Color(0xFF1459CF);
  static const blueGradientEnd = Color(0xFF0A2D68);
  static const greenGradientStart = Color(0xFF7CFE64);
  static const greenGradientEnd = Color(0xFF004D41);
  static const purpleGradientStart = Color(0xFFFF6BF7);
  static const purpleGradientEnd = Color(0xFF5C0078);
  static const orangeGradientStart = Color(0xFFFF914D);
  static const orangeGradientEnd = Color(0xFF8B2500);
}

/// Centralised gradient tokens. The cyan→lime [primary] pair is the most-
/// used gradient in the app (header bands, CTAs, badge backgrounds, text
/// shaders) — defining it once means a future palette tweak is one line.
class AppGradients {
  AppGradients._();

  /// The signature cyan → lime gradient. Use everywhere we currently
  /// hand-roll `LinearGradient(colors: [Color(0xFF55DEE8), Color(0xFFBFF367)])`.
  static const LinearGradient primary = LinearGradient(
    colors: [Color(0xFF55DEE8), Color(0xFFBFF367)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Horizontal variant of [primary] — used in long header bands.
  static const LinearGradient primaryHorizontal = LinearGradient(
    colors: [Color(0xFF55DEE8), Color(0xFFBFF367)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  /// Gold gradient for "hosted by you" / award badges.
  static const LinearGradient gold = LinearGradient(
    colors: [Color(0xFFFFC107), Color(0xFFFFD956)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Red gradient for live / urgent states.
  static const LinearGradient live = LinearGradient(
    colors: [Color(0xFFFF5252), Color(0xFFE91E63)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

/// Canonical radii so every card / button / chip uses the same curve.
class AppRadii {
  AppRadii._();

  static const double chip = 10;
  static const double card = 14; // user-chosen canonical card radius
  static const double sheet = 24;
  static const double button = 12;
  static const double pill = 999;
}
