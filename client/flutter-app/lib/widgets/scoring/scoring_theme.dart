import 'package:flutter/material.dart';

/// Shared design tokens for the scoring console (Flutter parity port of
/// `kridaz/client/user/src/features/scoring/*`). Centralised so every modal
/// stays visually in sync with the main scoring screen.
class ScoringTheme {
  ScoringTheme._();

  static const Color theme = Color(0xFF00C187); // #00C187 — primary teal-green
  static const Color bgRoot = Color(0xFF121212);
  static const Color bgPanel = Color(0xFF1E1E1E);
  static const Color bgPanelDeep = Color(0xFF1C1B1B);
  static const Color bgPanelSoft = Color(0xFF222222);
  static const Color bgSheet = Color(0xFF111111);
  static const Color bgControlBar = Color(0xFF1A1A1A);
  static const Color bgTabBar = Color(0xFF1C1C1C);

  static const Color accentMint = Color(0xFF81FBB8);
  static const Color accentTeal = Color(0xFF2FD1C6);
  static const Color accentTealDeep = Color(0xFF00BBBC);
  static const Color accentSky = Color(0xFF55DEE8);
  static const Color accentLime = Color(0xFFA1FF00);
  static const Color accentYellow = Color(0xFFFFC403);
  static const Color accentRed = Color(0xFFF40000);
  static const Color tossPrimary = Color(0xFF7BF090);
  static const Color tossAccent = Color(0xFF45DADA);

  static const Color textMuted = Color(0xFF879485);
  static const Color textSubtle = Color(0xFFBDCABA);
  static const Color borderSubtle = Color(0xFF3E4A3E);

  static BoxDecoration get panel => BoxDecoration(
        color: bgPanel,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      );

  static BoxDecoration get panelDeep => BoxDecoration(
        color: bgPanelDeep,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderSubtle),
      );

  static TextStyle label({double size = 10, double letter = 2}) => TextStyle(
        color: Colors.white54,
        fontSize: size,
        fontWeight: FontWeight.w900,
        letterSpacing: letter,
      );

  static TextStyle heading({double size = 24, Color color = Colors.white}) =>
      TextStyle(
        color: color,
        fontSize: size,
        fontWeight: FontWeight.w900,
        letterSpacing: 1.5,
      );
}
