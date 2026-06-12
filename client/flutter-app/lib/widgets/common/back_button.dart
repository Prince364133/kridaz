import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

/// Routes the back action through GoRouter and falls back to `/dashboard`
/// when the current page can't be popped (e.g. it's the first route on the
/// stack after a deep-link or fresh launch). Prevents the "Nothing to pop"
/// GoRouter assertion that bit the login screen.
void _smartBack(BuildContext context, [VoidCallback? override]) {
  HapticFeedback.lightImpact();
  if (override != null) {
    override();
    return;
  }
  if (context.canPop()) {
    context.pop();
  } else {
    context.go('/dashboard');
  }
}

/// A standalone circular back button — for screens that don't use an AppBar.
class AppBackButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Color? iconColor;
  final Color? backgroundColor;
  final double size;

  const AppBackButton({
    Key? key,
    this.onPressed,
    this.iconColor,
    this.backgroundColor,
    this.size = 40,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _smartBack(context, onPressed),
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: backgroundColor ?? Colors.white.withValues(alpha: 0.1),
          shape: BoxShape.circle,
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.2),
            width: 1,
          ),
        ),
        child: Icon(
          LucideIcons.chevronLeft,
          color: iconColor ?? Colors.white,
          size: size * 0.45,
        ),
      ),
    );
  }
}

/// A back button drop-in for `AppBar.leading`.
class AppBarBackButton extends StatelessWidget {
  final VoidCallback? onPressed;

  const AppBarBackButton({Key? key, this.onPressed}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: () => _smartBack(context, onPressed),
      icon: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.1),
          shape: BoxShape.circle,
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.2),
            width: 1,
          ),
        ),
        child: const Icon(
          LucideIcons.chevronLeft,
          color: Colors.white,
          size: 16,
        ),
      ),
    );
  }
}

/// New canonical back button — same `_smartBack` behavior, lighter visual
/// (no circle background, just the chevron). Use this for new screens; the
/// older [AppBackButton] / [AppBarBackButton] remain for existing call sites.
class BmsBackButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Color color;
  final double size;

  const BmsBackButton({
    super.key,
    this.onPressed,
    this.color = Colors.white,
    this.size = 22,
  });

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: () => _smartBack(context, onPressed),
      icon: Icon(LucideIcons.chevronLeft, color: color, size: size),
      tooltip: 'Back',
    );
  }
}
