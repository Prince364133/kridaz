import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../core/constants/app_text_styles.dart';
import '../core/constants/app_dimensions.dart';
import '../providers/host_game_provider.dart';
import '../services/auth_manager.dart';
import '../services/game_service.dart';
import '../widgets/host_game/step3_venue_widget.dart';
import '../widgets/host_game/step4_professional_widget.dart';
import '../widgets/host_game/step4_quick_widget.dart';
import '../widgets/host_game/step5_preview_widget.dart';
import '../widgets/common/back_button.dart';
import '../widgets/common/bms_toast.dart';
import '../widgets/common/primary_gradient_button.dart';

class HostGameScreen extends ConsumerStatefulWidget {
  const HostGameScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<HostGameScreen> createState() => _HostGameScreenState();
}

class _HostGameScreenState extends ConsumerState<HostGameScreen> {
  int _step = 1; // 1=Mode, 2=Details, 3=Venue, 4=Players, 5=Preview
  bool _loading = false;

  void _goTo(int step) => setState(() => _step = step);

  Future<void> _selectSport() async {
    final result = await context.push<String>('/pick-sports');
    if (result != null) {
      final notifier = ref.read(hostGameFormProvider.notifier);
      notifier.setSport(result);
      notifier.initSlotsForSport(result);
    }
  }

  Future<void> _selectDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date != null) ref.read(hostGameFormProvider.notifier).setDate(date);
  }

  Future<void> _selectTime(bool isEnd) async {
    final t = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (t == null) return;
    if (isEnd) {
      ref.read(hostGameFormProvider.notifier).setEndTime(t);
    } else {
      ref.read(hostGameFormProvider.notifier).setStartTime(t);
    }
  }

  Future<void> _selectLocation() async {
    final result = await context.push<String>('/select-location');
    if (result != null) {
      ref.read(hostGameFormProvider.notifier).setLocation(result);
    }
  }

  Future<void> _submitGame() async {
    final form = ref.read(hostGameFormProvider);
    final user = AuthManager().currentUser;
    final userId = user?['id']?.toString() ?? user?['_id']?.toString() ?? '';

    setState(() => _loading = true);
    final payload = form.toCreatePayload(userId);
    final result = await GameService().createHostedGame(payload);
    setState(() => _loading = false);

    if (!mounted) return;
    if (result != null) {
      BmsToast.success(context, 'Game hosted successfully!');
      ref.read(hostGameFormProvider.notifier).reset();
      context.pop();
    } else {
      BmsToast.error(
          context, 'Failed to create game. Check your wallet balance.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final form = ref.watch(hostGameFormProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundBlack,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(form),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: KeyedSubtree(
                  key: ValueKey(_step),
                  child: _buildStep(form),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(HostGameFormState form) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppDimensions.screenHorizontalPadding,
        vertical: 12,
      ),
      child: Row(
        children: [
          if (_step > 1)
            IconButton(
              icon: const Icon(LucideIcons.chevronLeft,
                  color: Colors.white, size: 20),
              onPressed: () => _goTo(_step - 1),
            )
          else
            const AppBackButton(),
          Expanded(
            child: Text(
              _stepTitle(),
              textAlign: TextAlign.center,
              style: AppTextStyles.h2.copyWith(fontSize: 18),
            ),
          ),
          Row(
            children: List.generate(
              5,
              (i) => Container(
                margin: const EdgeInsets.only(left: 4),
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _step > i
                      ? AppColors.primary
                      : Colors.white.withValues(alpha: 0.2),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _stepTitle() {
    switch (_step) {
      case 1:
        return 'Game Mode';
      case 2:
        return 'Match Details';
      case 3:
        return 'Venue & Officials';
      case 4:
        return 'Player Setup';
      case 5:
        return 'Preview';
      default:
        return 'Host a Game';
    }
  }

  Widget _buildStep(HostGameFormState form) {
    switch (_step) {
      case 1:
        return _Step1ModeSelect(form: form, onNext: () => _goTo(2));
      case 2:
        return _Step2Details(
          form: form,
          onSelectSport: _selectSport,
          onSelectDate: _selectDate,
          onSelectStartTime: () => _selectTime(false),
          onSelectEndTime: () => _selectTime(true),
          onSelectLocation: _selectLocation,
          onNext: () => _goTo(3),
        );
      case 3:
        return Step3VenueWidget(onNext: () => _goTo(4), onBack: () => _goTo(2));
      case 4:
        return form.gameMode == GameMode.professional
            ? Step4ProfessionalWidget(
                onNext: () => _goTo(5), onBack: () => _goTo(3))
            : Step4QuickWidget(onNext: () => _goTo(5), onBack: () => _goTo(3));
      case 5:
        return Step5PreviewWidget(
          onSubmit: _loading ? null : _submitGame,
          onBack: () => _goTo(4),
          loading: _loading,
        );
      default:
        return const SizedBox.shrink();
    }
  }
}

// â”€â”€ Step 1: Mode Selection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _Step1ModeSelect extends ConsumerWidget {
  final HostGameFormState form;
  final VoidCallback onNext;
  const _Step1ModeSelect({required this.form, required this.onNext});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(hostGameFormProvider.notifier);

    return Padding(
      padding: const EdgeInsets.all(AppDimensions.screenHorizontalPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 24),
          Text(
            'How do you want to organise players?',
            style:
                AppTextStyles.h3.copyWith(fontSize: 14, color: Colors.white60),
          ),
          const SizedBox(height: 24),
          _ModeCard(
            title: 'Quick Game',
            subtitle:
                'One pool of players — no team split. Best for casual matches.',
            icon: Icons.flash_on_rounded,
            selected: form.gameMode == GameMode.quick,
            onTap: () => notifier.setGameMode(GameMode.quick),
          ),
          const SizedBox(height: 16),
          _ModeCard(
            title: 'Professional',
            subtitle: 'Two balanced teams (A vs B) with assigned roles.',
            icon: LucideIcons.shield,
            selected: form.gameMode == GameMode.professional,
            onTap: () => notifier.setGameMode(GameMode.professional),
          ),
          const Spacer(),
          PrimaryGradientButton(
            label: 'NEXT: MATCH DETAILS',
            onPressed: onNext,
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

class _ModeCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _ModeCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primary.withValues(alpha: 0.1)
              : AppColors.surfaceL3,
          border: Border.all(
            color: selected ? AppColors.primary : Colors.white12,
            width: 2,
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: selected ? AppColors.primary : Colors.white10,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon,
                  color: selected ? Colors.black : Colors.white38, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: selected ? Colors.white : Colors.white60,
                      fontWeight: FontWeight.w900,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(subtitle,
                      style:
                          const TextStyle(color: Colors.white38, fontSize: 12)),
                ],
              ),
            ),
            if (selected)
              const Icon(LucideIcons.checkCircle,
                  color: AppColors.primary, size: 22),
          ],
        ),
      ),
    );
  }
}

// â”€â”€ Step 2: Match Details â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _Step2Details extends ConsumerWidget {
  final HostGameFormState form;
  final VoidCallback onSelectSport;
  final VoidCallback onSelectDate;
  final VoidCallback onSelectStartTime;
  final VoidCallback onSelectEndTime;
  final VoidCallback onSelectLocation;
  final VoidCallback onNext;

  const _Step2Details({
    required this.form,
    required this.onSelectSport,
    required this.onSelectDate,
    required this.onSelectStartTime,
    required this.onSelectEndTime,
    required this.onSelectLocation,
    required this.onNext,
  });

  String _formatTime(TimeOfDay? t) {
    if (t == null) return 'Not set';
    final ampm = t.hour < 12 ? 'AM' : 'PM';
    final displayHour = t.hourOfPeriod == 0 ? 12 : t.hourOfPeriod;
    return '${displayHour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')} $ampm';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(hostGameFormProvider.notifier);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(
          horizontal: AppDimensions.screenHorizontalPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 16),
          _DetailRow(
            label: 'SPORT',
            value: form.selectedSport ?? 'Select sport',
            icon: Icons.sports_cricket,
            filled: form.selectedSport != null,
            onTap: onSelectSport,
          ),
          const SizedBox(height: 14),
          _DetailRow(
            label: 'DATE',
            value: form.selectedDate != null
                ? '${form.selectedDate!.day}/${form.selectedDate!.month}/${form.selectedDate!.year}'
                : 'Select date',
            icon: LucideIcons.calendar,
            filled: form.selectedDate != null,
            onTap: onSelectDate,
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _DetailRow(
                  label: 'START',
                  value: _formatTime(form.startTime),
                  icon: LucideIcons.clock,
                  filled: form.startTime != null,
                  onTap: onSelectStartTime,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _DetailRow(
                  label: 'END',
                  value: _formatTime(form.endTime),
                  icon: Icons.access_time_filled,
                  filled: form.endTime != null,
                  onTap: onSelectEndTime,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _DetailRow(
            label: 'LOCATION',
            value: form.selectedLocation ?? 'Select location',
            icon: LucideIcons.mapPin,
            filled: form.selectedLocation != null,
            onTap: onSelectLocation,
          ),
          const SizedBox(height: 24),
          Text('Player Settings',
              style:
                  AppTextStyles.h3.copyWith(fontSize: 15, color: Colors.white)),
          const SizedBox(height: 12),
          TextField(
            keyboardType: TextInputType.number,
            style: const TextStyle(color: Colors.white),
            onChanged: (v) => notifier.setPlayerShare(double.tryParse(v) ?? 0),
            decoration: InputDecoration(
              hintText: 'Per player share (₹)',
              hintStyle: const TextStyle(color: Colors.white38),
              enabled: !form.isFreeGame,
              filled: true,
              fillColor: AppColors.surfaceL3,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide.none,
              ),
              prefixIcon:
                  const Icon(LucideIcons.indianRupee, color: Colors.amber),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Free Game',
                  style: TextStyle(
                      color: Colors.white, fontWeight: FontWeight.w700)),
              Switch(
                value: form.isFreeGame,
                onChanged: notifier.setFreeGame,
                activeColor: AppColors.primary,
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text('Match Style',
              style: TextStyle(
                  color: Colors.white60,
                  fontSize: 12,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _ToggleChip(
                  label: 'Friendly',
                  selected: form.competitionLevel == CompetitionLevel.friendly,
                  onTap: () =>
                      notifier.setCompetitionLevel(CompetitionLevel.friendly),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _ToggleChip(
                  label: 'Competitive',
                  selected:
                      form.competitionLevel == CompetitionLevel.competitive,
                  onTap: () => notifier
                      .setCompetitionLevel(CompetitionLevel.competitive),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text('Visibility',
              style: TextStyle(
                  color: Colors.white60,
                  fontSize: 12,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _ToggleChip(
                  label: 'Public',
                  selected: form.isPublic,
                  onTap: () => notifier.setPublic(true),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _ToggleChip(
                  label: 'Private',
                  selected: !form.isPublic,
                  onTap: () => notifier.setPublic(false),
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
          PrimaryGradientButton(
            label: 'NEXT: VENUE & OFFICIALS',
            onPressed: (form.selectedSport != null &&
                    form.selectedDate != null &&
                    form.startTime != null &&
                    form.selectedLocation != null)
                ? onNext
                : null,
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

// â”€â”€ Reusable widgets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final bool filled;
  final VoidCallback onTap;

  const _DetailRow({
    required this.label,
    required this.value,
    required this.icon,
    required this.filled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.surfaceL3,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: filled
                ? AppColors.primary.withValues(alpha: 0.4)
                : Colors.white10,
          ),
        ),
        child: Row(
          children: [
            Icon(icon,
                size: 20, color: filled ? AppColors.primary : Colors.white38),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: const TextStyle(
                          color: Colors.white38,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1)),
                  const SizedBox(height: 2),
                  Text(value,
                      style: TextStyle(
                          color: filled ? Colors.white : Colors.white38,
                          fontSize: 14,
                          fontWeight: FontWeight.w700)),
                ],
              ),
            ),
            const Icon(LucideIcons.chevronRight,
                size: 14, color: Colors.white24),
          ],
        ),
      ),
    );
  }
}

class _ToggleChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _ToggleChip(
      {required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : AppColors.surfaceL3,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? AppColors.primary : Colors.white12,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.black : Colors.white54,
            fontWeight: FontWeight.w800,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}
