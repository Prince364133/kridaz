import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_dimensions.dart';
import '../../models/slot_model.dart';
import '../../providers/host_game_provider.dart';
import '../../services/auth_manager.dart';

class Step4QuickWidget extends ConsumerStatefulWidget {
  final VoidCallback onNext;
  final VoidCallback onBack;
  const Step4QuickWidget(
      {super.key, required this.onNext, required this.onBack});

  @override
  ConsumerState<Step4QuickWidget> createState() => _Step4QuickWidgetState();
}

class _Step4QuickWidgetState extends ConsumerState<Step4QuickWidget> {
  bool _slotsInitialised = false;

  int? _inviteTargetIdx;
  final _inviteNameCtrl = TextEditingController();
  final _inviteEmailCtrl = TextEditingController();

  @override
  void dispose() {
    _inviteNameCtrl.dispose();
    _inviteEmailCtrl.dispose();
    super.dispose();
  }

  void _initSlots() {
    final user = AuthManager().currentUser;
    final userId = user?['id']?.toString() ?? user?['_id']?.toString() ?? '';
    final userName = user?['name']?.toString() ?? 'You';
    ref.read(hostGameFormProvider.notifier).initQuickSlots(userId, userName);
    setState(() => _slotsInitialised = true);
  }

  @override
  Widget build(BuildContext context) {
    final form = ref.watch(hostGameFormProvider);
    final notifier = ref.read(hostGameFormProvider.notifier);

    if (!_slotsInitialised) {
      return Padding(
        padding: const EdgeInsets.symmetric(
            horizontal: AppDimensions.screenHorizontalPadding),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(LucideIcons.users, size: 60, color: AppColors.primary),
            const SizedBox(height: 24),
            const Text('How many players?',
                style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 24)),
            const SizedBox(height: 8),
            const Text('Including yourself',
                style: TextStyle(color: Colors.white38, fontSize: 14)),
            const SizedBox(height: 40),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _CounterButton(
                  icon: LucideIcons.minus,
                  onTap: () {
                    if (form.quickPlayerCount > 2) {
                      notifier.setQuickPlayerCount(form.quickPlayerCount - 1);
                    }
                  },
                ),
                const SizedBox(width: 32),
                Text(
                  '${form.quickPlayerCount}',
                  style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 56),
                ),
                const SizedBox(width: 32),
                _CounterButton(
                  icon: LucideIcons.plus,
                  onTap: () {
                    if (form.quickPlayerCount < 22) {
                      notifier.setQuickPlayerCount(form.quickPlayerCount + 1);
                    }
                  },
                ),
              ],
            ),
            const SizedBox(height: 48),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _initSlots,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: const Text('SET UP SLOTS',
                    style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                        letterSpacing: 1)),
              ),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(
          horizontal: AppDimensions.screenHorizontalPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 16),
          const Text('Assign Players to Slots',
              style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 18)),
          const Text(
              'Tap a slot to assign a player — or leave it open for the community.',
              style: TextStyle(color: Colors.white38, fontSize: 12)),
          const SizedBox(height: 20),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.1,
            ),
            itemCount: form.quickSlots.length,
            itemBuilder: (context, idx) {
              final slot = form.quickSlots[idx];
              final isHost = idx == 0;
              return _SlotCard(
                slot: slot,
                slotNumber: idx + 1,
                isHost: isHost,
                onTap: isHost
                    ? null
                    : () => _showSlotOptions(context, idx, notifier),
                onClear: isHost ? null : () => notifier.clearQuickSlot(idx),
              );
            },
          ),
          if (_inviteTargetIdx != null) _buildInviteForm(notifier),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: widget.onNext,
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
            onPressed: () {
              setState(() => _slotsInitialised = false);
              widget.onBack();
            },
            child: const Text('Back', style: TextStyle(color: Colors.white38)),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  void _showSlotOptions(
      BuildContext context, int idx, HostGameFormNotifier notifier) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceL3,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading:
                  const Icon(LucideIcons.userPlus, color: AppColors.primary),
              title: const Text('Invite by email',
                  style: TextStyle(
                      color: Colors.white, fontWeight: FontWeight.w700)),
              onTap: () {
                context.pop();
                setState(() => _inviteTargetIdx = idx);
              },
            ),
            ListTile(
              leading: const Icon(LucideIcons.globe, color: Colors.white38),
              title: const Text('Leave open for community',
                  style: TextStyle(color: Colors.white60)),
              onTap: () {
                notifier.clearQuickSlot(idx);
                context.pop();
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInviteForm(HostGameFormNotifier notifier) {
    return Container(
      margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceL3,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Invite to Slot ${_inviteTargetIdx! + 1}',
              style: const TextStyle(
                  color: Colors.white, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          TextField(
            controller: _inviteNameCtrl,
            style: const TextStyle(color: Colors.white),
            decoration: _inputDecoration('Player name'),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _inviteEmailCtrl,
            keyboardType: TextInputType.emailAddress,
            style: const TextStyle(color: Colors.white),
            decoration: _inputDecoration('Email address'),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => setState(() => _inviteTargetIdx = null),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.white24),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text('Cancel',
                      style: TextStyle(color: Colors.white38)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    if (_inviteEmailCtrl.text.isNotEmpty) {
                      notifier.assignQuickSlot(
                        _inviteTargetIdx!,
                        customName: _inviteNameCtrl.text,
                        customEmail: _inviteEmailCtrl.text,
                      );
                      _inviteNameCtrl.clear();
                      _inviteEmailCtrl.clear();
                      setState(() => _inviteTargetIdx = null);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text('Send Invite',
                      style: TextStyle(fontWeight: FontWeight.w800)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) => InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Colors.white38),
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.05),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide.none,
        ),
      );
}

class _SlotCard extends StatelessWidget {
  final SlotData slot;
  final int slotNumber;
  final bool isHost;
  final VoidCallback? onTap;
  final VoidCallback? onClear;

  const _SlotCard({
    required this.slot,
    required this.slotNumber,
    required this.isHost,
    this.onTap,
    this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    final isFilled = slot.userId != null || slot.customPlayerEmail != null;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: isFilled || isHost
              ? AppColors.primary.withValues(alpha: 0.08)
              : AppColors.surfaceL3,
          border: Border.all(
            color: isHost
                ? AppColors.primary
                : isFilled
                    ? AppColors.primary.withValues(alpha: 0.5)
                    : Colors.white10,
            width: 2,
          ),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Stack(
          children: [
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    isHost
                        ? LucideIcons.shield
                        : isFilled
                            ? LucideIcons.user
                            : LucideIcons.plus,
                    size: 32,
                    color:
                        isFilled || isHost ? AppColors.primary : Colors.white24,
                  ),
                  const SizedBox(height: 8),
                  Text('Slot $slotNumber',
                      style: const TextStyle(
                          color: Colors.white38,
                          fontSize: 10,
                          fontWeight: FontWeight.w800)),
                  const SizedBox(height: 2),
                  Text(
                    isHost
                        ? 'You (Host)'
                        : slot.userName ??
                            slot.customPlayerName ??
                            slot.customPlayerEmail ??
                            'Open',
                    textAlign: TextAlign.center,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: isFilled || isHost ? Colors.white : Colors.white38,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            if (!isHost && isFilled && onClear != null)
              Positioned(
                top: 6,
                right: 6,
                child: GestureDetector(
                  onTap: onClear,
                  child: Container(
                    width: 22,
                    height: 22,
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(LucideIcons.x,
                        size: 14, color: Colors.white),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _CounterButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _CounterButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: Colors.white10,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Icon(icon, color: Colors.white, size: 28),
      ),
    );
  }
}
