import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../constants/app_text_styles.dart';

class AppTheme {
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      fontFamily: 'Poppins', // Default font for entire app

      colorScheme: ColorScheme.dark(
        primary: AppColors.primary,
        secondary: AppColors.accentCyan,
        surface: AppColors.backgroundBlack,
        error: Colors.red,
      ),

      scaffoldBackgroundColor: AppColors.backgroundBlack,

      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.backgroundBlack,
        elevation: 0,
        titleTextStyle: AppTextStyles.h2,
      ),

      textTheme: TextTheme(
        displayLarge: AppTextStyles.h1,
        displayMedium: AppTextStyles.h2,
        displaySmall: AppTextStyles.h3,
        bodyLarge: AppTextStyles.bodyLarge,
        bodyMedium: AppTextStyles.bodyMedium,
        bodySmall: AppTextStyles.bodySmall,
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.backgroundGray,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        hintStyle: AppTextStyles.bodyMedium.copyWith(
          color: AppColors.textGray,
        ),
      ),

      cardTheme: CardThemeData(
        color: AppColors.backgroundCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),

      iconTheme: const IconThemeData(
        color: AppColors.textWhite,
        size: 24,
      ),
    );
  }
}
