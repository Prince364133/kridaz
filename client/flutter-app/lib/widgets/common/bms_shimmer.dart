import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

/// A reusable shimmer block — animates a soft highlight sweeping left-to-right
/// across a dark surface. Use as a building block in skeleton screens.
class BmsShimmerBox extends StatefulWidget {
  final double? width;
  final double height;
  final double radius;

  const BmsShimmerBox({
    super.key,
    this.width,
    this.height = 16,
    this.radius = 8,
  });

  @override
  State<BmsShimmerBox> createState() => _BmsShimmerBoxState();
}

class _BmsShimmerBoxState extends State<BmsShimmerBox>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1300),
    )..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, __) {
        final dx = _ctrl.value;
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.radius),
            gradient: LinearGradient(
              begin: Alignment(-1.0 + 2 * dx, 0),
              end: Alignment(1.0 + 2 * dx, 0),
              colors: [
                AppColors.surfaceL2,
                AppColors.surfaceL3,
                AppColors.surfaceL2,
              ],
              stops: const [0.0, 0.5, 1.0],
            ),
          ),
        );
      },
    );
  }
}

/// Card-shaped shimmer placeholder — for list/grid items while data loads.
class BmsShimmerCard extends StatelessWidget {
  final double height;
  final EdgeInsetsGeometry margin;

  const BmsShimmerCard({
    super.key,
    this.height = 96,
    this.margin = const EdgeInsets.only(bottom: 12),
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: margin,
      child: Container(
        height: height,
        decoration: BoxDecoration(
          color: AppColors.surfaceL1,
          borderRadius: BorderRadius.circular(AppRadii.card),
        ),
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            const BmsShimmerBox(width: 48, height: 48, radius: 12),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  BmsShimmerBox(width: 160, height: 14),
                  SizedBox(height: 8),
                  BmsShimmerBox(width: 96, height: 12),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// A list of [BmsShimmerCard]s — drop-in replacement for a loading
/// `ListView` so users see structure instead of a spinner.
class BmsListSkeleton extends StatelessWidget {
  final int itemCount;
  final EdgeInsetsGeometry padding;
  final double cardHeight;

  const BmsListSkeleton({
    super.key,
    this.itemCount = 6,
    this.padding = const EdgeInsets.fromLTRB(16, 12, 16, 12),
    this.cardHeight = 96,
  });

  @override
  Widget build(BuildContext context) {
    // `shrinkWrap: true` is required because this skeleton is rendered
    // inside SingleChildScrollView / Column parents — without it the
    // ListView tries to fill an unbounded vertical extent and throws
    // "Vertical viewport was given unbounded height".
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: padding,
      itemCount: itemCount,
      itemBuilder: (_, __) => BmsShimmerCard(height: cardHeight),
    );
  }
}
