import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_dimensions.dart';
import '../../models/slot_model.dart';
import '../../providers/host_game_provider.dart';

class Step4ProfessionalWidget extends ConsumerWidget {
  final VoidCallback onNext;
  final VoidCallback onBack;
  const Step4ProfessionalWidget(
      {super.key, required this.onNext, required this.onBack});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final form = ref.watch(hostGameFormProvider);
    final notifier = ref.read(hostGameFormProvider.notifier);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(
          horizontal: AppDimensions.screenHorizontalPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 16),
          const Text(
            'Configure both teams for the match.',
            style: TextStyle(color: Colors.white60, fontSize: 13),
          ),
          const SizedBox(height: 20),
          _TeamSection(
            teamKey: 'teamA',
            team: form.teamA,
            color: Colors.blue,
            notifier: notifier,
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              const Expanded(child: Divider(color: Colors.white10)),
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 12),
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white10,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text('VS',
                    style: TextStyle(
                        color: Colors.white38,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 4)),
              ),
              const Expanded(child: Divider(color: Colors.white10)),
            ],
          ),
          const SizedBox(height: 24),
          _TeamSection(
            teamKey: 'teamB',
            team: form.teamB,
            color: Colors.red,
            notifier: notifier,
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surfaceL3,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Entry Charge / Player',
                    style: TextStyle(
                        color: Colors.white70, fontWeight: FontWeight.w700)),
                Text(
                  '₹${form.playerShare.toStringAsFixed(0)}',
                  style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w900,
                      fontSize: 18),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: onNext,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14)),
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: const Text('PREVIEW MATCH',
                style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                    letterSpacing: 1)),
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
}

class _TeamSection extends StatelessWidget {
  final String teamKey;
  final TeamConfig team;
  final Color color;
  final HostGameFormNotifier notifier;

  const _TeamSection({
    required this.teamKey,
    required this.team,
    required this.color,
    required this.notifier,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                alignment: Alignment.center,
                child: Text(
                  teamKey == 'teamA' ? 'A' : 'B',
                  style: TextStyle(
                      color: color, fontWeight: FontWeight.w900, fontSize: 18),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: TextEditingController(text: team.name),
                  style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 16),
                  onChanged: (v) => notifier.setTeamName(teamKey, v),
                  decoration: const InputDecoration(
                    hintText: 'Team name',
                    hintStyle: TextStyle(color: Colors.white38),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ),
            ],
          ),
          const Divider(color: Colors.white10, height: 24),
          ...team.slots.asMap().entries.map((entry) {
            final idx = entry.key;
            final slot = entry.value;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.04),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: TextEditingController(text: slot.role),
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w700),
                      onChanged: (v) =>
                          notifier.updateSlotRole(teamKey, idx, v),
                      decoration: const InputDecoration(
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.zero,
                        hintText: 'Role',
                        hintStyle: TextStyle(color: Colors.white24),
                      ),
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.white10,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text('OPEN',
                        style: TextStyle(
                            color: Colors.white38,
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1)),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () => notifier.removeSlot(teamKey, idx),
                    child: const Icon(LucideIcons.minusCircle,
                        color: Colors.white24, size: 20),
                  ),
                ],
              ),
            );
          }),
          GestureDetector(
            onTap: () => notifier.addSlot(teamKey),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                border: Border.all(color: color.withValues(alpha: 0.3)),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.plus,
                      color: color.withValues(alpha: 0.7), size: 18),
                  const SizedBox(width: 6),
                  Text('Add Slot',
                      style: TextStyle(
                          color: color.withValues(alpha: 0.7),
                          fontWeight: FontWeight.w800,
                          fontSize: 12)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
