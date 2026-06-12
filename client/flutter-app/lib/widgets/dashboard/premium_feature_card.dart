import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter/services.dart';

class PremiumFeatureCard extends StatefulWidget {
  final String title;
  final String subtitle;
  final String? iconPath;
  final IconData? fallbackIcon;
  final List<Color> gradientColors;
  final VoidCallback onTap;
  final bool isTopRow;

  const PremiumFeatureCard({
    super.key,
    required this.title,
    required this.subtitle,
    this.iconPath,
    this.fallbackIcon,
    required this.gradientColors,
    required this.onTap,
    this.isTopRow = false,
  });

  @override
  State<PremiumFeatureCard> createState() => _PremiumFeatureCardState();
}

class _PremiumFeatureCardState extends State<PremiumFeatureCard> {
  bool _isPressed = false;

  void _handleTapDown(TapDownDetails details) {
    setState(() => _isPressed = true);
    HapticFeedback.lightImpact();
  }

  void _handleTapUp(TapUpDetails details) {
    setState(() => _isPressed = false);
    widget.onTap();
  }

  void _handleTapCancel() {
    setState(() => _isPressed = false);
  }

  @override
  Widget build(BuildContext context) {
    // Hierarchy: top row cards are slightly taller
    final cardHeight = widget.isTopRow ? 128.0 : 118.0;
    final shadowBlur = widget.isTopRow ? 28.0 : 22.0;

    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      child: AnimatedScale(
        scale: _isPressed ? 0.97 : 1.0,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOutCubic,
        child: Container(
          height: cardHeight,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            boxShadow: [
              // Primary colored shadow for depth
              BoxShadow(
                color: widget.gradientColors.last.withValues(alpha: 0.35),
                blurRadius: shadowBlur,
                offset: const Offset(0, 12),
                spreadRadius: -4,
              ),
              // Subtle ambient shadow
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.25),
                blurRadius: 16,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(22),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                // Base gradient layer
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: widget.gradientColors,
                    ),
                  ),
                ),

                // Soft light overlay (top-left glow)
                Positioned(
                  top: -50,
                  left: -50,
                  child: Container(
                    width: 140,
                    height: 140,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          Colors.white.withValues(alpha: 0.18),
                          Colors.white.withValues(alpha: 0.0),
                        ],
                      ),
                    ),
                  ),
                ),

                // Vignette overlay (bottom darkening for depth)
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.black.withValues(alpha: 0.28),
                      ],
                      stops: const [0.25, 1.0],
                    ),
                  ),
                ),

                // Glass border effect (white 6%)
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.06),
                      width: 1,
                    ),
                  ),
                ),

                // Text content - bottom-left aligned
                Positioned(
                  left: 16,
                  bottom: 14,
                  right: 75,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        widget.title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.w600,
                          letterSpacing: -0.3,
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        widget.subtitle,
                        maxLines: 2,
                        overflow: TextOverflow.fade,
                        softWrap: true,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.72),
                          fontSize: 11,
                          fontWeight: FontWeight.w400,
                          height: 1.35,
                        ),
                      ),
                    ],
                  ),
                ),

                // 3D Icon - top-right, overflowing with shadow
                Positioned(
                  top: -12,
                  right: -12,
                  child: _buildIcon(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildIcon() {
    if (widget.iconPath != null) {
      return Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 14,
              offset: const Offset(3, 5),
            ),
          ],
        ),
        child: Opacity(
          opacity: 0.85,
          child: Image.asset(
            widget.iconPath!,
            height: 76,
            width: 76,
            fit: BoxFit.contain,
            filterQuality: FilterQuality.high,
            errorBuilder: (context, error, stackTrace) {
              return _buildFallbackIcon();
            },
          ),
        ),
      );
    }
    return _buildFallbackIcon();
  }

  Widget _buildFallbackIcon() {
    return Opacity(
      opacity: 0.85,
      child: Container(
        height: 72,
        width: 72,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.white.withValues(alpha: 0.22),
              Colors.white.withValues(alpha: 0.08),
            ],
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.25),
              blurRadius: 14,
              offset: const Offset(3, 5),
            ),
          ],
        ),
        child: Icon(
          widget.fallbackIcon ?? LucideIcons.layoutGrid,
          size: 34,
          color: Colors.white.withValues(alpha: 0.92),
        ),
      ),
    );
  }
}
