import '../core/constants/app_colors.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/services.dart';
import '../services/game_service.dart';
import '../widgets/common/bms_toast.dart';

class JoinGameHostViewScreen extends StatelessWidget {
  /// Optional — when provided, the Host Tools sheet is wired to real endpoints.
  final String? gameId;
  final String gameTitle;
  final String sport;
  final String date;
  final String time;
  final String location;

  const JoinGameHostViewScreen({
    super.key,
    this.gameId,
    this.gameTitle = 'Weekend Cricket Match',
    this.sport = 'Cricket',
    this.date = 'Saturday, July 20',
    this.time = '10:00 AM - 1:00 PM',
    this.location = 'Central Park, New York',
  });

  void _openHostTools(BuildContext context) {
    if (gameId == null || gameId!.isEmpty) {
      BmsToast.error(context, 'Host tools need a game id');
      return;
    }
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.surfaceL1,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _HostToolsSheet(gameId: gameId!),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: Colors.white),
          onPressed: () {
            HapticFeedback.lightImpact();
            context.pop();
          },
        ),
        title: const Text(
          'Game Details',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Map section
            Container(
              height: 200,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.grey.shade800,
              ),
              child: Stack(
                children: [
                  // Map placeholder
                  Image.asset(
                    'assets/images/map_placeholder.png',
                    fit: BoxFit.cover,
                    width: double.infinity,
                    height: 200,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        color: Colors.grey.shade800,
                        child: const Center(
                          child: Icon(
                            LucideIcons.map,
                            size: 60,
                            color: Colors.white54,
                          ),
                        ),
                      );
                    },
                  ),

                  // Location badge
                  Positioned(
                    left: 16,
                    bottom: 16,
                    right: 16,
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.8),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            LucideIcons.mapPin,
                            color: AppColors.primary,
                            size: 18,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              location,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // View Messages button
                  GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      // Navigate to messages
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.backgroundGray,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Image.asset(
                            'assets/icons/ant_message_outlined.png',
                            width: 28,
                            height: 28,
                          ),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Text(
                              'View Messages',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          Icon(
                            LucideIcons.chevronRight,
                            color: Colors.white.withValues(alpha: 0.5),
                            size: 16,
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Game title
                  Text(
                    gameTitle,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                    ),
                  ),

                  const SizedBox(height: 4),

                  // Sport and date/time
                  Text(
                    '$sport · $date · $time',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.6),
                      fontSize: 13,
                      fontWeight: FontWeight.w400,
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Game Summary section
                  const Text(
                    'Game Summary',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Summary cards
                  Row(
                    children: [
                      Expanded(
                        child: _buildSummaryCard(
                          'Host',
                          'Sampad',
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildSummaryCard(
                          'Players Joined',
                          '8/11',
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  Row(
                    children: [
                      Expanded(
                        child: _buildSummaryCard(
                          'Per Player Share',
                          '2500',
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildSummaryCard(
                          'Game Type',
                          'Friendly',
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Manage Players section
                  const Text(
                    'Manage Players',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Joined Players button
                  GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      // Navigate to joined players list
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 16,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.backgroundGray,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Joined Players',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          Icon(
                            LucideIcons.chevronRight,
                            color: Colors.white.withValues(alpha: 0.5),
                            size: 16,
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Host Tools — opens a sheet with invite officials,
                  // request scorer/streamer/umpire, approve/reject joiners.
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        HapticFeedback.lightImpact();
                        _openHostTools(context);
                      },
                      icon: const Icon(LucideIcons.sliders,
                          color: Colors.black, size: 18),
                      label: const Text(
                        'HOST TOOLS',
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Invite Players button
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: OutlinedButton(
                      onPressed: () {
                        HapticFeedback.lightImpact();
                        // Navigate to invite players
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        side: const BorderSide(
                          color: AppColors.primary,
                          width: 1.5,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'INVITE PLAYERS',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 100),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryCard(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundGray,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.6),
              fontSize: 12,
              fontWeight: FontWeight.w400,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

/// Host Tools — invite officials, broadcast requests, change venue. Each
/// row hits a real endpoint via [GameService].
class _HostToolsSheet extends StatefulWidget {
  final String gameId;
  const _HostToolsSheet({required this.gameId});

  @override
  State<_HostToolsSheet> createState() => _HostToolsSheetState();
}

class _HostToolsSheetState extends State<_HostToolsSheet> {
  final _service = GameService();
  final _inviteCtrl = TextEditingController();
  final _searchCtrl = TextEditingController();
  bool _busy = false;
  List<Map<String, dynamic>> _officialResults = const [];

  @override
  void dispose() {
    _inviteCtrl.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _request(String role) async {
    setState(() => _busy = true);
    final ok =
        await _service.requestOfficial(gameId: widget.gameId, role: role);
    if (!mounted) return;
    setState(() => _busy = false);
    if (ok) {
      BmsToast.success(context, 'Request for $role broadcast');
    } else {
      BmsToast.error(context, 'Failed to broadcast request');
    }
  }

  Future<void> _searchOfficials() async {
    final q = _searchCtrl.text.trim();
    if (q.length < 2) return;
    setState(() => _busy = true);
    final res = await _service.searchOfficials(q);
    if (!mounted) return;
    setState(() {
      _busy = false;
      _officialResults = res;
    });
  }

  Future<void> _inviteCustom() async {
    final value = _inviteCtrl.text.trim();
    if (value.isEmpty) return;
    final isEmail = value.contains('@');
    setState(() => _busy = true);
    final ok = await _service.inviteCustomPlayer(
      gameId: widget.gameId,
      email: isEmail ? value : null,
      phone: isEmail ? null : value,
    );
    if (!mounted) return;
    setState(() => _busy = false);
    if (ok) {
      _inviteCtrl.clear();
      BmsToast.success(context, 'Invite sent');
    } else {
      BmsToast.error(context, 'Invite failed');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(context).viewInsets.bottom + 24),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Host Tools',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),

            // 1) Broadcast requests
            const Text('Request an Official',
                style: TextStyle(color: Colors.white70, fontSize: 13)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _chip('Scorer', LucideIcons.activity, () => _request('scorer')),
                _chip(
                    'Streamer', LucideIcons.video, () => _request('streamer')),
                _chip('Umpire', LucideIcons.shield, () => _request('umpire')),
              ],
            ),
            const SizedBox(height: 20),

            // 2) Search & invite specific official
            const Text('Invite Specific Official',
                style: TextStyle(color: Colors.white70, fontSize: 13)),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(
                child: TextField(
                  controller: _searchCtrl,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    hintText: 'Search by name…',
                    hintStyle: TextStyle(color: Colors.white30),
                    filled: true,
                    fillColor: AppColors.surfaceL2,
                    border: OutlineInputBorder(borderSide: BorderSide.none),
                    contentPadding:
                        EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: _busy ? null : _searchOfficials,
                icon: const Icon(LucideIcons.search, color: AppColors.primary),
              ),
            ]),
            if (_officialResults.isNotEmpty) ...[
              const SizedBox(height: 8),
              ..._officialResults.take(5).map((o) => _officialRow(o)),
            ],
            const SizedBox(height: 20),

            // 3) Invite custom player
            const Text('Invite Player by Email / Phone',
                style: TextStyle(color: Colors.white70, fontSize: 13)),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(
                child: TextField(
                  controller: _inviteCtrl,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    hintText: 'you@email.com or 98765 43210',
                    hintStyle: TextStyle(color: Colors.white30),
                    filled: true,
                    fillColor: AppColors.surfaceL2,
                    border: OutlineInputBorder(borderSide: BorderSide.none),
                    contentPadding:
                        EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: _busy ? null : _inviteCustom,
                icon: const Icon(LucideIcons.send, color: AppColors.primary),
              ),
            ]),
            const SizedBox(height: 20),
            if (_busy)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(8.0),
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _chip(String label, IconData icon, VoidCallback onTap) =>
      OutlinedButton.icon(
        onPressed: _busy ? null : onTap,
        icon: Icon(icon, size: 16, color: AppColors.primary),
        label: Text(label,
            style: const TextStyle(color: Colors.white, fontSize: 13)),
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: AppColors.primary.withValues(alpha: 0.5)),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );

  Widget _officialRow(Map<String, dynamic> o) {
    final id = (o['_id'] ?? o['id'])?.toString() ?? '';
    final name = o['name']?.toString() ?? 'Official';
    final role = o['role']?.toString() ?? 'scorer';
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.surfaceL2,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name,
                  style: const TextStyle(color: Colors.white, fontSize: 13)),
              Text(role,
                  style: const TextStyle(color: Colors.white54, fontSize: 11)),
            ],
          ),
        ),
        TextButton(
          onPressed: _busy
              ? null
              : () async {
                  setState(() => _busy = true);
                  final ok = await _service.inviteOfficial(
                      gameId: widget.gameId, officialId: id, role: role);
                  if (!mounted) return;
                  setState(() => _busy = false);
                  if (ok) {
                    BmsToast.success(context, 'Invited $name');
                  } else {
                    BmsToast.error(context, 'Invite failed');
                  }
                },
          child:
              const Text('Invite', style: TextStyle(color: AppColors.primary)),
        ),
      ]),
    );
  }
}
