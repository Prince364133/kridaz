import 'package:flutter/material.dart';
import 'app_colors.dart';

class PremiumGradients {
  // Nearby Players - Blue gradient
  static const LinearGradient nearbyPlayers = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF0A4D8C),
      Color(0xFF1E88E5),
    ],
  );

  // Host a Game - Green gradient
  static const LinearGradient hostGame = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      AppColors.accentGreen,
      AppColors.accentGreen,
    ],
  );

  // My Bookings - Purple gradient
  static const LinearGradient myBookings = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      AppColors.accentPurple,
      AppColors.accentPurple,
    ],
  );

  // Shop Here - Orange gradient
  static const LinearGradient shopHere = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      AppColors.accentOrangeDeep,
      AppColors.accentOrange,
    ],
  );
}
