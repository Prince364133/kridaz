import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import 'back_button.dart';

/// Canonical Scaffold for the app — keeps backgrounds, app-bar styling, and
/// status-bar look consistent without every screen rewriting the same chrome.
///
/// Use [BmsScaffold] for any screen with a standard app-bar; pass [title] (or
/// [titleWidget] for richer headers) and the page body in [child]. Screens
/// that need a fully custom layout (no app-bar) can still use raw [Scaffold]
/// with `backgroundColor: AppColors.surfaceCanvas` to stay on-palette.
class BmsScaffold extends StatelessWidget {
  final String? title;
  final Widget? titleWidget;
  final List<Widget>? actions;
  final bool centerTitle;
  final Widget child;
  final Widget? bottomNavigationBar;
  final Widget? floatingActionButton;
  final FloatingActionButtonLocation? floatingActionButtonLocation;
  final Color? backgroundColor;
  final bool resizeToAvoidBottomInset;

  /// When true, omit the AppBar entirely (the screen draws its own header).
  final bool noAppBar;

  const BmsScaffold({
    super.key,
    this.title,
    this.titleWidget,
    this.actions,
    this.centerTitle = true,
    required this.child,
    this.bottomNavigationBar,
    this.floatingActionButton,
    this.floatingActionButtonLocation,
    this.backgroundColor,
    this.resizeToAvoidBottomInset = true,
    this.noAppBar = false,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor ?? AppColors.surfaceCanvas,
      resizeToAvoidBottomInset: resizeToAvoidBottomInset,
      appBar: noAppBar
          ? null
          : AppBar(
              backgroundColor: AppColors.surfaceCanvas,
              elevation: 0,
              scrolledUnderElevation: 0,
              centerTitle: centerTitle,
              leading: const BmsBackButton(),
              title: titleWidget ??
                  (title == null
                      ? null
                      : Text(
                          title!,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Poppins',
                          ),
                        )),
              actions: actions,
            ),
      body: child,
      bottomNavigationBar: bottomNavigationBar,
      floatingActionButton: floatingActionButton,
      floatingActionButtonLocation: floatingActionButtonLocation,
    );
  }
}
