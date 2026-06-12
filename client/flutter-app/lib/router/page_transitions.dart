import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// A subtle fade-through page transition for GoRouter. Use in place of the
/// default `builder:` to give screens a softer entry/exit than the platform
/// Material/Cupertino slide.
///
///   GoRoute(
///     path: '/foo',
///     pageBuilder: (c, s) => bmsFadePage(const FooScreen()),
///   ),
Page<T> bmsFadePage<T>(Widget child,
    {Duration duration = const Duration(milliseconds: 220)}) {
  return CustomTransitionPage<T>(
    child: child,
    transitionDuration: duration,
    reverseTransitionDuration: duration,
    transitionsBuilder: (context, animation, secondary, c) {
      final curved = CurvedAnimation(
        parent: animation,
        curve: Curves.easeOutCubic,
        reverseCurve: Curves.easeInCubic,
      );
      return FadeTransition(
        opacity: curved,
        child: SlideTransition(
          // Tiny upward slide so it doesn't feel static.
          position: Tween<Offset>(
            begin: const Offset(0, 0.015),
            end: Offset.zero,
          ).animate(curved),
          child: c,
        ),
      );
    },
  );
}
