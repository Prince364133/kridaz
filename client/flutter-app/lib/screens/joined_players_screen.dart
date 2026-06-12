import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../core/constants/app_colors.dart';
import '../services/game_service.dart';

/// Joined Players list for a hosted game.
///
/// Accepts a `gameId` and an optional snapshot `game` via route `extra`.
/// Refreshes from `GET /hosted-game/:id` so slot statuses and joined-user
/// info reflect the live database.
class JoinedPlayersScreen extends StatefulWidget {
  final String gameId;
  final Map<String, dynamic>? initialGame;

  const JoinedPlayersScreen({
    super.key,
    required this.gameId,
    this.initialGame,
  });

  @override
  State<JoinedPlayersScreen> createState() => _JoinedPlayersScreenState();
}

class _JoinedPlayersScreenState extends State<JoinedPlayersScreen> {
  Map<String, dynamic>? _game;
  bool _loading = true;
  // Tracks userIds for which an approve/reject call is in flight so the
  // buttons can show a spinner and we can debounce repeat taps.
  final Set<String> _processing = {};

  bool get _isViewerHost {
    final host = _game?['host'];
    if (host is! Map) return false;
    final hostId = (host['id'] ?? host['_id'])?.toString();
    final me = GameService().currentUserId;
    return hostId != null && hostId.isNotEmpty && hostId == me;
  }

  Future<void> _approve(String userId, String? slotId) async {
    if (_processing.contains(userId)) return;
    setState(() => _processing.add(userId));
    final ok = await GameService().approveJoinRequest(
      gameId: widget.gameId,
      userId: userId,
      slotId: slotId,
    );
    if (!mounted) return;
    setState(() => _processing.remove(userId));
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(ok ? 'Player approved' : 'Could not approve player'),
      backgroundColor: ok ? AppColors.surfaceL3 : Colors.red.shade900,
      duration: const Duration(seconds: 2),
    ));
    if (ok) _refresh();
  }

  Future<void> _reject(String userId) async {
    if (_processing.contains(userId)) return;
    setState(() => _processing.add(userId));
    final ok = await GameService().rejectJoinRequest(
      gameId: widget.gameId,
      userId: userId,
    );
    if (!mounted) return;
    setState(() => _processing.remove(userId));
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(ok ? 'Request declined' : 'Could not decline request'),
      backgroundColor: ok ? AppColors.surfaceL3 : Colors.red.shade900,
      duration: const Duration(seconds: 2),
    ));
    if (ok) _refresh();
  }

  @override
  void initState() {
    super.initState();
    if (widget.initialGame != null) {
      _game = Map<String, dynamic>.from(widget.initialGame!);
      _loading = false;
    }
    _refresh();
  }

  Future<void> _refresh() async {
    if (widget.gameId.isEmpty) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    final fresh = await GameService().getGame(widget.gameId);
    if (!mounted) return;
    if (fresh != null) {
      final inner = (fresh['game'] is Map<String, dynamic>)
          ? fresh['game'] as Map<String, dynamic>
          : fresh;
      setState(() {
        _game = inner;
        _loading = false;
      });
    } else {
      setState(() => _loading = false);
    }
  }

  List<_Player> get _players {
    final game = _game;
    if (game == null) return const [];

    final players = <_Player>[];
    final seenUserIds = <String>{};

    // Host is always shown first when known.
    final host = game['host'];
    if (host is Map) {
      final id = (host['id'] ?? host['_id'])?.toString();
      players.add(_Player(
        name: host['name']?.toString() ?? 'Host',
        role: 'Host',
        avatarUrl: host['profilePicture']?.toString(),
        isHost: true,
      ));
      if (id != null && id.isNotEmpty) seenUserIds.add(id);
    }

    List<Map> _slotsFromTeam(dynamic team) {
      if (team is! Map) return const [];
      final raw = team['slots'];
      if (raw is! List) return const [];
      return raw.whereType<Map>().toList();
    }

    final teams = game['teams'];
    final teamSlots = <Map>[
      ..._slotsFromTeam(teams is Map ? teams['teamA'] : null),
      ..._slotsFromTeam(teams is Map ? teams['teamB'] : null),
    ];
    final quickSlots = (game['quickSlots'] is List)
        ? (game['quickSlots'] as List).whereType<Map>().toList()
        : <Map>[];
    final allSlots = teamSlots.isNotEmpty ? teamSlots : quickSlots;

    // Treat any non-OPEN, non-CANCELLED slot as "added" — mirrors the web
    // client (`slot.status !== 'OPEN'`). The mobile previously only matched
    // JOINED/HELD, which silently dropped PENDING (approval-required joins)
    // and CONFIRMED slots so players were invisible on this screen.
    for (final slot in allSlots) {
      final status = slot['status']?.toString().toUpperCase() ?? '';
      if (status == 'OPEN' || status == 'CANCELLED') continue;

      final user = slot['user'];
      final custom = slot['customPlayer'];
      // Fallback for backends that send userId on the slot without the
      // hydrated `user` relation.
      final slotUserId = slot['userId']?.toString();
      final slotId = slot['id']?.toString();
      String? name;
      String? avatar;
      String? resolvedUserId;
      String? subRole = slot['role']?.toString();
      if (user is Map) {
        final uid = (user['id'] ?? user['_id'])?.toString();
        // Skip if this is the host (already added above).
        if (uid != null && seenUserIds.contains(uid)) continue;
        if (uid != null) seenUserIds.add(uid);
        name = user['name']?.toString();
        avatar = user['profilePicture']?.toString();
        resolvedUserId = uid;
      } else if (custom is Map) {
        name = custom['name']?.toString();
      } else if (slotUserId != null && slotUserId.isNotEmpty) {
        if (seenUserIds.contains(slotUserId)) continue;
        seenUserIds.add(slotUserId);
        name = 'Player'; // backend didn't hydrate the relation
        resolvedUserId = slotUserId;
      }
      if (name == null || name.isEmpty) name = 'Player';

      // Pending and Held slots are shown but flagged so the host can tell
      // them apart from confirmed joins.
      final pending = status == 'PENDING';
      final held = status == 'HELD';
      final roleLabel = pending
          ? '${subRole ?? 'Player'} · Pending approval'
          : held
              ? '${subRole ?? 'Player'} · Invited'
              : (subRole ?? 'Player');

      players.add(_Player(
        name: name,
        role: roleLabel,
        avatarUrl: avatar,
        isHost: false,
        status: status,
        userId: resolvedUserId,
        slotId: slotId,
      ));
    }

    return players;
  }

  int get _maxMembers {
    final game = _game;
    if (game == null) return 0;
    // Host form writes the cap as `playerCount`; older payloads used
    // `maxMembers` / `maxPlayers`. Try all three.
    final raw = game['playerCount'] ?? game['maxMembers'] ?? game['maxPlayers'];
    if (raw is num) return raw.toInt();
    if (raw != null) return int.tryParse(raw.toString()) ?? 0;

    // Fallback: total slot count when the top-level field is missing.
    List<Map> _teamSlots(dynamic team) {
      if (team is! Map) return const [];
      final raw = team['slots'];
      if (raw is! List) return const [];
      return raw.whereType<Map>().toList();
    }

    final teams = game['teams'];
    final all = <Map>[
      ..._teamSlots(teams is Map ? teams['teamA'] : null),
      ..._teamSlots(teams is Map ? teams['teamB'] : null),
      ...((game['quickSlots'] is List)
          ? (game['quickSlots'] as List).whereType<Map>()
          : const []),
    ];
    return all.length;
  }

  @override
  Widget build(BuildContext context) {
    final players = _players;
    final max = _maxMembers;
    final slotsLeft = max > players.length ? max - players.length : 0;

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft,
              color: AppColors.accentLime, size: 20),
          onPressed: () {
            HapticFeedback.lightImpact();
            context.pop();
          },
        ),
        title: const Text(
          'Joined Players',
          style: TextStyle(
            color: Colors.white,
            fontSize: 17,
            fontWeight: FontWeight.w600,
            fontFamily: 'Poppins',
          ),
        ),
        centerTitle: true,
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        color: AppColors.accentLime,
        backgroundColor: AppColors.surfaceL1,
        child: _loading && players.isEmpty
            ? const Center(
                child: CircularProgressIndicator(
                    color: AppColors.accentLime, strokeWidth: 2))
            : Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                    child: Row(
                      children: [
                        ShaderMask(
                          shaderCallback: (bounds) => const LinearGradient(
                            colors: [
                              AppColors.gradientStart,
                              AppColors.gradientEnd
                            ],
                          ).createShader(bounds),
                          child: Text(
                            '${players.length}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 28,
                              fontWeight: FontWeight.w800,
                              fontFamily: 'Poppins',
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          max > 0 ? '/ $max Players' : 'Players',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.45),
                            fontSize: 15,
                            fontWeight: FontWeight.w500,
                            fontFamily: 'Poppins',
                          ),
                        ),
                        const Spacer(),
                        if (max > 0)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceL3,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              slotsLeft == 0
                                  ? 'Full'
                                  : '$slotsLeft slot${slotsLeft == 1 ? '' : 's'} left',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.6),
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                fontFamily: 'Poppins',
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Expanded(
                    child: players.isEmpty
                        ? ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            children: [
                              const SizedBox(height: 80),
                              Center(
                                child: Text(
                                  'No players have joined yet.',
                                  style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.5),
                                    fontSize: 13,
                                    fontFamily: 'Poppins',
                                  ),
                                ),
                              ),
                            ],
                          )
                        : ListView.separated(
                            physics: const AlwaysScrollableScrollPhysics(),
                            padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                            itemCount: players.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              final p = players[index];
                              return _PlayerCard(
                                player: p,
                                number: index + 1,
                                viewerIsHost: _isViewerHost,
                                isProcessing: p.userId != null &&
                                    _processing.contains(p.userId),
                                onApprove: (p.userId != null)
                                    ? () => _approve(p.userId!, p.slotId)
                                    : null,
                                onReject: (p.userId != null)
                                    ? () => _reject(p.userId!)
                                    : null,
                              );
                            },
                          ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _Player {
  final String name;
  final String role;
  final String? avatarUrl;
  final bool isHost;
  // Fields below are only populated for non-host slot entries; they're
  // what the host needs to approve / reject a pending join request.
  final String? status; // raw slot status (PENDING / JOINED / HELD / …)
  final String? userId;
  final String? slotId;
  const _Player({
    required this.name,
    required this.role,
    required this.isHost,
    this.avatarUrl,
    this.status,
    this.userId,
    this.slotId,
  });
}

class _PlayerCard extends StatelessWidget {
  final _Player player;
  final int number;
  final bool viewerIsHost;
  final bool isProcessing;
  final VoidCallback? onApprove;
  final VoidCallback? onReject;

  const _PlayerCard({
    required this.player,
    required this.number,
    this.viewerIsHost = false,
    this.isProcessing = false,
    this.onApprove,
    this.onReject,
  });

  bool get _showApprovalActions =>
      viewerIsHost &&
      player.status == 'PENDING' &&
      player.userId != null &&
      onApprove != null &&
      onReject != null;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surfaceL3,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                padding:
                    player.isHost ? const EdgeInsets.all(2) : EdgeInsets.zero,
                decoration: player.isHost
                    ? const BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [
                            AppColors.gradientStart,
                            AppColors.gradientEnd
                          ],
                        ),
                      )
                    : null,
                child: ClipOval(
                  child: SizedBox(
                    width: 44,
                    height: 44,
                    child: player.avatarUrl != null &&
                            player.avatarUrl!.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: player.avatarUrl!,
                            fit: BoxFit.cover,
                            placeholder: (_, __) => _initialBubble(player.name),
                            errorWidget: (_, __, ___) =>
                                _initialBubble(player.name),
                          )
                        : _initialBubble(player.name),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            player.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              fontFamily: 'Poppins',
                            ),
                          ),
                        ),
                        if (player.isHost) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [
                                  AppColors.gradientStart,
                                  AppColors.gradientEnd
                                ],
                              ),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Text(
                              'Host',
                              style: TextStyle(
                                color: Colors.black,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                fontFamily: 'Poppins',
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      player.role,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.45),
                        fontSize: 12,
                        fontFamily: 'Poppins',
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                '#$number',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.25),
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Poppins',
                ),
              ),
            ],
          ),
          if (_showApprovalActions) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _ActionButton(
                    label: 'Approve',
                    isPrimary: true,
                    busy: isProcessing,
                    onTap: onApprove,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _ActionButton(
                    label: 'Decline',
                    isPrimary: false,
                    busy: isProcessing,
                    onTap: onReject,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _initialBubble(String name) {
    return Container(
      color: AppColors.backgroundCard,
      alignment: Alignment.center,
      child: Text(
        name.isNotEmpty ? name[0].toUpperCase() : '?',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          fontFamily: 'Poppins',
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final bool isPrimary;
  final bool busy;
  final VoidCallback? onTap;

  const _ActionButton({
    required this.label,
    required this.isPrimary,
    required this.busy,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final disabled = busy || onTap == null;
    final fg = isPrimary ? Colors.black : Colors.white;
    return Opacity(
      opacity: disabled ? 0.6 : 1,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: disabled
              ? null
              : () {
                  HapticFeedback.selectionClick();
                  onTap!();
                },
          child: Container(
            height: 36,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              gradient: isPrimary
                  ? const LinearGradient(
                      colors: [
                        AppColors.gradientStart,
                        AppColors.gradientEnd,
                      ],
                    )
                  : null,
              border: isPrimary
                  ? null
                  : Border.all(color: Colors.white.withValues(alpha: 0.18)),
            ),
            child: busy
                ? SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation(fg),
                    ),
                  )
                : Text(
                    label,
                    style: TextStyle(
                      color: fg,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Poppins',
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}
