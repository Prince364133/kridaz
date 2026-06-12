import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_dimensions.dart';
import '../../core/util/image_url.dart';
import '../../models/ground_model.dart';
import '../../models/official_model.dart';
import '../../providers/host_game_provider.dart';
import '../../services/game_service.dart';

class Step3VenueWidget extends ConsumerStatefulWidget {
  final VoidCallback onNext;
  final VoidCallback onBack;
  const Step3VenueWidget(
      {super.key, required this.onNext, required this.onBack});

  @override
  ConsumerState<Step3VenueWidget> createState() => _Step3VenueWidgetState();
}

class _Step3VenueWidgetState extends ConsumerState<Step3VenueWidget> {
  List<GroundModel> _grounds = [];
  List<OfficialModel> _umpires = [];
  List<OfficialModel> _scorers = [];
  List<OfficialModel> _streamers = [];
  bool _loading = true;

  bool _showCustomUmpireForm = false;
  final _umpireNameCtrl = TextEditingController();
  final _umpireEmailCtrl = TextEditingController();
  final _umpirePhoneCtrl = TextEditingController();
  final _scoringPasswordCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final form = ref.read(hostGameFormProvider);
    final parts = form.selectedLocation?.split(',');
    final city = parts?.first.trim();
    final state = parts?.length == 2 ? parts!.last.trim() : null;

    final svc = GameService();
    final results = await Future.wait([
      svc.getGrounds(city: city, state: state, sportType: form.selectedSport),
      svc.getUmpires(city: city, state: state, gameType: form.selectedSport),
      svc.getScorers(city: city, state: state, gameType: form.selectedSport),
      svc.getStreamers(city: city, state: state, gameType: form.selectedSport),
    ]);

    if (mounted) {
      setState(() {
        _grounds = results[0] as List<GroundModel>;
        _umpires = results[1] as List<OfficialModel>;
        _scorers = results[2] as List<OfficialModel>;
        _streamers = results[3] as List<OfficialModel>;
        _loading = false;
      });
    }
  }

  @override
  void dispose() {
    _umpireNameCtrl.dispose();
    _umpireEmailCtrl.dispose();
    _umpirePhoneCtrl.dispose();
    _scoringPasswordCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final form = ref.watch(hostGameFormProvider);
    final notifier = ref.read(hostGameFormProvider.notifier);

    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(
          horizontal: AppDimensions.screenHorizontalPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 16),

          // â”€â”€ Grounds â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          _SectionHeader(label: 'Select Ground', optional: true),
          if (_grounds.isEmpty)
            _EmptyHint(
                'No grounds found for ${form.selectedSport} in your area.')
          else
            ..._grounds.map((g) => _GroundCard(
                  ground: g,
                  selected: form.selectedGround?.id == g.id,
                  onTap: () => notifier.setGround(
                    form.selectedGround?.id == g.id ? null : g,
                  ),
                )),
          const SizedBox(height: 24),

          // â”€â”€ Umpire â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          Row(
            children: [
              const Expanded(
                  child: _SectionHeader(label: 'Hire Umpire', optional: true)),
              TextButton.icon(
                onPressed: () => setState(
                    () => _showCustomUmpireForm = !_showCustomUmpireForm),
                icon: const Icon(LucideIcons.plus,
                    size: 16, color: AppColors.primary),
                label: const Text('Custom',
                    style: TextStyle(
                        color: AppColors.primary,
                        fontSize: 12,
                        fontWeight: FontWeight.w800)),
              ),
            ],
          ),
          if (_showCustomUmpireForm) _buildCustomUmpireForm(form, notifier),
          if (_umpires.isEmpty && !_showCustomUmpireForm)
            const _EmptyHint('No umpires available in your area.')
          else
            ..._umpires.map((u) => _OfficialCard(
                  official: u,
                  selected: form.selectedUmpire?.id == u.id,
                  onTap: () => notifier.setUmpire(
                    form.selectedUmpire?.id == u.id ? null : u,
                  ),
                )),
          const SizedBox(height: 24),

          // ── Scorer ───────────────────────────────────────────────────
          // Required for cricket (where the scoring engine lives); optional
          // for other sports. Backed by GET /hosted-game/scorers and stamps
          // scorerId on POST /hosted-game/create.
          _SectionHeader(label: 'Hire Scorer', optional: true),
          if (_scorers.isEmpty)
            const _EmptyHint('No scorers available in your area.')
          else
            ..._scorers.map((s) => _OfficialCard(
                  official: s,
                  selected: form.selectedScorer?.id == s.id,
                  onTap: () => notifier.setScorer(
                    form.selectedScorer?.id == s.id ? null : s,
                  ),
                )),
          const SizedBox(height: 24),

          // ── Scoring password (cricket-only) ─────────────────────────
          // Stored on the hosted game and used by POST /scoring/auth/:gameId
          // to mint a SCORER JWT for the umpire/scorer running the scoring
          // app. Optional — leave blank if only assigned user accounts will
          // score (they auth via normal login).
          if ((form.selectedSport ?? '').toLowerCase() == 'cricket') ...[
            _SectionHeader(label: 'Scoring Password', optional: true),
            TextField(
              controller: _scoringPasswordCtrl,
              style: const TextStyle(color: Colors.white),
              onChanged: (v) =>
                  notifier.setScoringPassword(v.isEmpty ? null : v),
              decoration: _inputDecoration(
                  'Password the scorer enters to open the console'),
            ),
            const SizedBox(height: 24),
          ],

          // â”€â”€ Streamer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          _SectionHeader(label: 'Hire Streamer', optional: true),
          if (_streamers.isEmpty)
            const _EmptyHint('No streamers available in your area.')
          else
            ..._streamers.map((s) => _OfficialCard(
                  official: s,
                  selected: form.selectedStreamer?.id == s.id,
                  onTap: () => notifier.setStreamer(
                    form.selectedStreamer?.id == s.id ? null : s,
                  ),
                )),
          const SizedBox(height: 24),

          // Cost preview
          if (form.totalCost > 0)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
                border:
                    Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Total Hosting Cost',
                      style: TextStyle(
                          color: Colors.white70, fontWeight: FontWeight.w700)),
                  Text(
                    '₹${form.totalCost.toStringAsFixed(0)} coins',
                    style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w900,
                        fontSize: 18),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 16),

          ElevatedButton(
            onPressed: widget.onNext,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14)),
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: const Text('NEXT: PLAYER SETUP',
                style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                    letterSpacing: 1)),
          ),
          TextButton(
            onPressed: widget.onBack,
            child: const Text('Back', style: TextStyle(color: Colors.white38)),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildCustomUmpireForm(
      HostGameFormState form, HostGameFormNotifier notifier) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceL3,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          TextField(
            controller: _umpireNameCtrl,
            style: const TextStyle(color: Colors.white),
            decoration: _inputDecoration('Full Name'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _umpireEmailCtrl,
            keyboardType: TextInputType.emailAddress,
            style: const TextStyle(color: Colors.white),
            decoration: _inputDecoration('Email Address'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _umpirePhoneCtrl,
            keyboardType: TextInputType.phone,
            style: const TextStyle(color: Colors.white),
            decoration: _inputDecoration('Phone (optional)'),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                if (_umpireNameCtrl.text.isNotEmpty &&
                    _umpireEmailCtrl.text.isNotEmpty) {
                  notifier.setCustomUmpire(
                    _umpireNameCtrl.text,
                    _umpireEmailCtrl.text,
                    _umpirePhoneCtrl.text.isEmpty
                        ? null
                        : _umpirePhoneCtrl.text,
                  );
                  notifier.setUmpire(null);
                  setState(() => _showCustomUmpireForm = false);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                        content: Text(
                            'Custom umpire ${_umpireNameCtrl.text} added')),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('Confirm Umpire',
                  style: TextStyle(fontWeight: FontWeight.w800)),
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
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
}

// â”€â”€ Supporting widgets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _SectionHeader extends StatelessWidget {
  final String label;
  final bool optional;
  const _SectionHeader({required this.label, this.optional = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Text(label,
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 13)),
          if (optional) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.white10,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text('Optional',
                  style: TextStyle(
                      color: Colors.white38,
                      fontSize: 10,
                      fontWeight: FontWeight.w700)),
            ),
          ],
        ],
      ),
    );
  }
}

class _EmptyHint extends StatelessWidget {
  final String message;
  const _EmptyHint(this.message);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white10),
      ),
      child: Text(message,
          textAlign: TextAlign.center,
          style: const TextStyle(color: Colors.white38, fontSize: 13)),
    );
  }
}

class _GroundCard extends StatelessWidget {
  final GroundModel ground;
  final bool selected;
  final VoidCallback onTap;
  const _GroundCard(
      {required this.ground, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primary.withValues(alpha: 0.1)
              : AppColors.surfaceL3,
          border: Border.all(
              color: selected ? AppColors.primary : Colors.white10, width: 2),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: ground.images.isNotEmpty && isHttpUrl(ground.images.first)
                  ? Image.network(ground.images.first,
                      width: 70,
                      height: 70,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                            width: 70,
                            height: 70,
                            color: Colors.white10,
                            child:
                                const Icon(Icons.sports, color: Colors.white24),
                          ))
                  : Container(
                      width: 70,
                      height: 70,
                      color: Colors.white10,
                      child: const Icon(Icons.sports, color: Colors.white24),
                    ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(ground.name,
                      style: const TextStyle(
                          color: Colors.white, fontWeight: FontWeight.w800)),
                  Text('${ground.city}, ${ground.state}',
                      style:
                          const TextStyle(color: Colors.white38, fontSize: 12)),
                  const SizedBox(height: 4),
                  Text('₹${ground.pricePerHour.toStringAsFixed(0)}/hr',
                      style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w900)),
                ],
              ),
            ),
            if (selected)
              const Icon(LucideIcons.checkCircle, color: AppColors.primary),
          ],
        ),
      ),
    );
  }
}

class _OfficialCard extends StatelessWidget {
  final OfficialModel official;
  final bool selected;
  final VoidCallback onTap;
  const _OfficialCard(
      {required this.official, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primary.withValues(alpha: 0.1)
              : AppColors.surfaceL3,
          border: Border.all(
              color: selected ? AppColors.primary : Colors.white10, width: 2),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: Colors.white10,
              backgroundImage: isHttpUrl(official.profilePicture)
                  ? NetworkImage(official.profilePicture!)
                  : null,
              child: !isHttpUrl(official.profilePicture)
                  ? Text(
                      official.name[0].toUpperCase(),
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 20),
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(official.name,
                      style: const TextStyle(
                          color: Colors.white, fontWeight: FontWeight.w800)),
                  if (official.gameTypes.isNotEmpty)
                    Text(official.gameTypes.take(3).join(', '),
                        style: const TextStyle(
                            color: Colors.white38, fontSize: 11)),
                  const SizedBox(height: 4),
                  Text('₹${official.price.toStringAsFixed(0)}',
                      style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w900)),
                ],
              ),
            ),
            if (selected)
              const Icon(LucideIcons.checkCircle, color: AppColors.primary),
          ],
        ),
      ),
    );
  }
}
