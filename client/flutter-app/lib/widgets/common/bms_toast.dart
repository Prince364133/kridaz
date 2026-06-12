import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

/// Canonical app snackbar — three flavors (success / error / info) with
/// consistent typography, color, and duration. Replaces the ad-hoc
/// `ScaffoldMessenger.of(context).showSnackBar(SnackBar(...))` blocks that
/// each picked their own red/green/durations.
///
/// Usage:
///   BmsToast.success(context, 'Booking confirmed');
///   BmsToast.error(context, 'Could not load');
///   BmsToast.info(context, 'Connecting…');
class BmsToast {
  BmsToast._();

  static const _success = AppColors.accentGreen;
  static const _error = AppColors.accentRed;
  static const _info = AppColors.borderGray;

  static void success(BuildContext context, String message,
          {Duration duration = const Duration(seconds: 3)}) =>
      _show(context, message, _success, duration);

  static void error(BuildContext context, String message,
          {Duration duration = const Duration(seconds: 4)}) =>
      _show(context, message, _error, duration);

  static void info(BuildContext context, String message,
          {Duration duration = const Duration(seconds: 3)}) =>
      _show(context, message, _info, duration);

  /// Toast with a tap-able action button (Undo, View Cart, etc.). The action
  /// label is rendered in [AppColors.primary] so it reads as a CTA. Defaults
  /// to the neutral [_info] colour; pass [isError]/[isSuccess] to recolor.
  static void action(
    BuildContext context,
    String message, {
    required String actionLabel,
    required VoidCallback onAction,
    Duration duration = const Duration(seconds: 4),
    bool isError = false,
    bool isSuccess = false,
    EdgeInsets? margin,
  }) {
    final bg = isError ? _error : (isSuccess ? _success : _info);
    _show(context, message, bg, duration,
        actionLabel: actionLabel, onAction: onAction, margin: margin);
  }

  static void _show(
    BuildContext context,
    String message,
    Color bg,
    Duration d, {
    String? actionLabel,
    VoidCallback? onAction,
    EdgeInsets? margin,
  }) {
    final messenger = ScaffoldMessenger.maybeOf(context);
    if (messenger == null) return;

    // Floating SnackBars assert "presented off screen" when the supplied
    // margin pushes them beyond the viewport — happens on screens whose
    // bottom inset (nav bar / keyboard / no Scaffold body) leaves less
    // room than our fixed 16-bottom margin. Detection rule of thumb: only
    // use floating + custom margin when the route actually has a Scaffold
    // ancestor that can host it; otherwise fall back to fixed so the
    // toast always renders.
    final hasScaffold = Scaffold.maybeOf(context) != null;
    final useFloating = hasScaffold && margin == null;

    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(
            message,
            style: const TextStyle(
              color: Colors.white,
              fontFamily: 'Poppins',
              fontWeight: FontWeight.w500,
            ),
          ),
          backgroundColor: bg,
          duration: d,
          behavior:
              useFloating ? SnackBarBehavior.floating : SnackBarBehavior.fixed,
          // Only pass margin when explicitly requested AND we're floating.
          // Default-floating computes its own margin against viewInsets.
          margin: useFloating ? null : (hasScaffold ? margin : null),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(useFloating ? 10 : 0),
          ),
          elevation: 6,
          action: (actionLabel == null || onAction == null)
              ? null
              : SnackBarAction(
                  label: actionLabel,
                  textColor: AppColors.primary,
                  onPressed: onAction,
                ),
        ),
      );
  }
}
