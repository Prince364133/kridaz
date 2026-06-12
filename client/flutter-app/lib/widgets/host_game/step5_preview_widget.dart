import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_dimensions.dart';
import '../../providers/host_game_provider.dart';
import '../common/primary_gradient_button.dart';

class Step5PreviewWidget extends ConsumerWidget {
  final Future<void> Function()? onSubmit;
  final VoidCallback onBack;
  final bool loading;

  const Step5PreviewWidget({
    super.key,
    required this.onSubmit,
    required this.onBack,
    required this.loading,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final form = ref.watch(hostGameFormProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(
          horizontal: AppDimensions.screenHorizontalPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 16),

          // Hero summary card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.primary.withValues(alpha: 0.2),
                  Colors.transparent
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              border:
                  Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    _Badge(
                      label: form.gameMode == GameMode.quick
                          ? 'Quick Game'
                          : 'Professional',
                      color: AppColors.primary,
                      textColor: Colors.black,
                    ),
                    if (form.isFreeGame)
                      const _Badge(
                          label: 'Free',
                          color: Colors.green,
                          textColor: Colors.white),
                    _Badge(
                      label: form.isPublic ? 'Public' : 'Private',
                      color: form.isPublic
                          ? Colors.blue.withValues(alpha: 0.3)
                          : Colors.white10,
                      textColor:
                          form.isPublic ? Colors.blue.shade200 : Colors.white38,
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  '${form.selectedSport ?? 'Sport'} Match',
                  style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 26),
                ),
                const SizedBox(height: 8),
                if (form.selectedDate != null)
                  _PreviewRow(
                    icon: LucideIcons.calendar,
                    text:
                        '${form.selectedDate!.day}/${form.selectedDate!.month}/${form.selectedDate!.year}',
                  ),
                if (form.startTime != null)
                  _PreviewRow(
                    icon: LucideIcons.clock,
                    text: _formatTime(form.startTime!),
                  ),
                if (form.selectedLocation != null)
                  _PreviewRow(
                    icon: LucideIcons.mapPin,
                    text: form.selectedLocation!,
                  ),
                if (form.selectedGround != null)
                  _PreviewRow(
                    icon: Icons.sports,
                    text: form.selectedGround!.name,
                  ),
                if (form.selectedUmpire != null)
                  _PreviewRow(
                    icon: Icons.person_pin,
                    text: 'Umpire: ${form.selectedUmpire!.name}',
                  ),
                if (form.customUmpireName != null)
                  _PreviewRow(
                    icon: LucideIcons.mail,
                    text: 'Custom umpire: ${form.customUmpireName}',
                  ),
                if (form.selectedStreamer != null)
                  _PreviewRow(
                    icon: LucideIcons.video,
                    text: 'Streamer: ${form.selectedStreamer!.name}',
                  ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Cost breakdown
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surfaceL3,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                if (form.totalCost > 0) ...[
                  if (form.selectedGround != null)
                    _CostRow(
                        label: 'Ground cost',
                        value: form.selectedGround!.pricePerHour),
                  if (form.selectedUmpire != null)
                    _CostRow(
                        label: 'Umpire cost',
                        value: form.selectedUmpire!.price),
                  if (form.selectedStreamer != null)
                    _CostRow(
                        label: 'Streamer cost',
                        value: form.selectedStreamer!.price),
                  const Divider(color: Colors.white10),
                ],
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total reserved from wallet',
                        style: TextStyle(
                            color: Colors.white70,
                            fontWeight: FontWeight.w700)),
                    Text(
                      '₹${form.totalCost.toStringAsFixed(0)} coins',
                      style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w900,
                          fontSize: 18),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                const Text(
                  'Coins are reserved now and deducted once the match is confirmed.',
                  style: TextStyle(color: Colors.white24, fontSize: 11),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          PrimaryGradientButton(
            label: 'CONFIRM & HOST GAME',
            isLoading: loading,
            onPressed: onSubmit == null ? null : () => onSubmit!.call(),
            height: 56,
          ),

          TextButton(
            onPressed: onBack,
            child: const Text('Back', style: TextStyle(color: Colors.white38)),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  String _formatTime(TimeOfDay t) {
    final ampm = t.hour < 12 ? 'AM' : 'PM';
    final displayHour = t.hourOfPeriod == 0 ? 12 : t.hourOfPeriod;
    return '${displayHour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')} $ampm';
  }
}

class _Badge extends StatelessWidget {
  final String label;
  final Color color;
  final Color textColor;
  const _Badge(
      {required this.label, required this.color, required this.textColor});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label,
          style: TextStyle(
              color: textColor, fontWeight: FontWeight.w900, fontSize: 11)),
    );
  }
}

class _PreviewRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _PreviewRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Row(
        children: [
          Icon(icon, size: 15, color: Colors.white38),
          const SizedBox(width: 8),
          Expanded(
            child: Text(text,
                style: const TextStyle(color: Colors.white60, fontSize: 13)),
          ),
        ],
      ),
    );
  }
}

class _CostRow extends StatelessWidget {
  final String label;
  final double value;
  const _CostRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(color: Colors.white38, fontSize: 13)),
          Text('₹${value.toStringAsFixed(0)}',
              style: const TextStyle(
                  color: Colors.white60,
                  fontWeight: FontWeight.w700,
                  fontSize: 13)),
        ],
      ),
    );
  }
}
