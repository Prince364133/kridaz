import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../services/game_service.dart';
import '../widgets/common/bms_toast.dart';

/// Host-side join request inbox. Lists every PENDING slot on a private
/// game and exposes approve/reject. Driven by `GET /hosted-game/:id`
/// — we scan the slot tree for `status == 'PENDING'` and build a list.
class PendingRequestsScreen extends StatefulWidget {
  const PendingRequestsScreen({super.key, required this.gameId});
  final String gameId;

  @override
  State<PendingRequestsScreen> createState() => _PendingRequestsScreenState();
}

class _PendingRequestsScreenState extends State<PendingRequestsScreen> {
  final _service = GameService();
  bool _loading = true;
  String? _error;
  List<_PendingRequest> _items = const [];
  // Tracks which slot is currently being approved/rejected so the user
  // can see per-row loading feedback instead of a screen-level spinner.
  final Set<String> _busy = {};

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final detail = await _service.getGame(widget.gameId);
    if (!mounted) return;
    if (detail == null) {
      setState(() {
        _loading = false;
        _error = 'Could not load game.';
      });
      return;
    }
    setState(() {
      _loading = false;
      _items = _scan(detail);
    });
  }

  /// Walk the game JSON looking for PENDING slots. Backend shape:
  /// `game.teams[team].slots[]` for TEAMS mode, `game.slots[]` for QUICK.
  List<_PendingRequest> _scan(Map<String, dynamic> raw) {
    final game = (raw['game'] is Map)
        ? Map<String, dynamic>.from(raw['game'] as Map)
        : raw;
    final result = <_PendingRequest>[];

    void consume(Iterable slots, {String? teamKey}) {
      for (final s in slots) {
        if (s is! Map) continue;
        if ((s['status']?.toString().toUpperCase() ?? '') != 'PENDING')
          continue;
        final user =
            s['user'] is Map ? Map<String, dynamic>.from(s['user']) : null;
        if (user == null) continue;
        result.add(_PendingRequest(
          slotId: s['id']?.toString() ?? '',
          userId: (user['id'] ?? user['_id'])?.toString() ?? '',
          name: user['name']?.toString() ?? 'Player',
          profilePicture: user['profilePicture']?.toString(),
          role: s['role']?.toString(),
          teamKey: teamKey,
        ));
      }
    }

    if (game['slots'] is List) consume(game['slots']);
    final teams = game['teams'];
    if (teams is Map) {
      for (final key in const ['teamA', 'teamB']) {
        final t = teams[key];
        if (t is Map && t['slots'] is List) {
          consume(t['slots'], teamKey: key);
        }
      }
    } else if (teams is List) {
      for (var i = 0; i < teams.length; i++) {
        final t = teams[i];
        if (t is Map && t['slots'] is List) {
          consume(t['slots'], teamKey: i == 0 ? 'teamA' : 'teamB');
        }
      }
    }
    return result;
  }

  Future<void> _approve(_PendingRequest r) async {
    HapticFeedback.mediumImpact();
    setState(() => _busy.add(r.slotId));
    final ok = await _service.approveJoinRequest(
      gameId: widget.gameId,
      userId: r.userId,
      slotId: r.slotId.isEmpty ? null : r.slotId,
    );
    if (!mounted) return;
    setState(() => _busy.remove(r.slotId));
    if (ok) {
      BmsToast.success(context, '${r.name} approved');
      _refresh();
    } else {
      BmsToast.error(context, 'Could not approve ${r.name}');
    }
  }

  Future<void> _reject(_PendingRequest r) async {
    HapticFeedback.mediumImpact();
    setState(() => _busy.add(r.slotId));
    final ok = await _service.rejectJoinRequest(
      gameId: widget.gameId,
      userId: r.userId,
    );
    if (!mounted) return;
    setState(() => _busy.remove(r.slotId));
    if (ok) {
      BmsToast.success(context, '${r.name} declined');
      _refresh();
    } else {
      BmsToast.error(context, 'Could not decline ${r.name}');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Join Requests',
            style: TextStyle(color: Colors.white, fontFamily: 'Poppins')),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        color: Colors.white,
        child: _loading && _items.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : _items.isEmpty
                ? ListView(
                    children: [
                      const SizedBox(height: 120),
                      Center(
                        child: Text(
                          _error ?? 'No pending requests.',
                          style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.6),
                              fontFamily: 'Poppins'),
                        ),
                      ),
                    ],
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) {
                      final r = _items[i];
                      return _RequestTile(
                        request: r,
                        busy: _busy.contains(r.slotId),
                        onApprove: () => _approve(r),
                        onReject: () => _reject(r),
                      );
                    },
                  ),
      ),
    );
  }
}

class _PendingRequest {
  _PendingRequest({
    required this.slotId,
    required this.userId,
    required this.name,
    this.profilePicture,
    this.role,
    this.teamKey,
  });
  final String slotId;
  final String userId;
  final String name;
  final String? profilePicture;
  final String? role;
  final String? teamKey;
}

class _RequestTile extends StatelessWidget {
  const _RequestTile({
    required this.request,
    required this.busy,
    required this.onApprove,
    required this.onReject,
  });
  final _PendingRequest request;
  final bool busy;
  final VoidCallback onApprove;
  final VoidCallback onReject;

  @override
  Widget build(BuildContext context) {
    final image = request.profilePicture;
    final hasImage = image != null && image.isNotEmpty;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF0E0E10),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Row(
        children: [
          ClipOval(
            child: hasImage
                ? CachedNetworkImage(
                    imageUrl: image,
                    width: 44,
                    height: 44,
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => _placeholder(),
                  )
                : _placeholder(),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  request.name,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'Poppins'),
                ),
                if (request.role != null || request.teamKey != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    [
                      if (request.teamKey == 'teamA') 'Team A',
                      if (request.teamKey == 'teamB') 'Team B',
                      if (request.role != null && request.role!.isNotEmpty)
                        request.role!,
                    ].join(' · '),
                    style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.55),
                        fontSize: 12,
                        fontFamily: 'Poppins'),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          if (busy)
            const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                  strokeWidth: 2, color: Colors.white),
            )
          else ...[
            GestureDetector(
              onTap: onReject,
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.06),
                  shape: BoxShape.circle,
                  border:
                      Border.all(color: Colors.white.withValues(alpha: 0.15)),
                ),
                child: const Icon(LucideIcons.x,
                    color: Color(0xFFEF4444), size: 18),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: onApprove,
              child: Container(
                width: 36,
                height: 36,
                decoration: const BoxDecoration(
                  color: Color(0xFF7CFE6A),
                  shape: BoxShape.circle,
                ),
                child: const Icon(LucideIcons.check,
                    color: Colors.black, size: 18),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _placeholder() => Container(
        width: 44,
        height: 44,
        color: Colors.white.withValues(alpha: 0.08),
        child: const Icon(LucideIcons.user, color: Colors.white60, size: 22),
      );
}
