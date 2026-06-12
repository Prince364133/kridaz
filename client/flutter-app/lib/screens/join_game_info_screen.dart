import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../core/constants/app_colors.dart';
import '../services/game_service.dart';
import '../services/turf_service.dart';
import '../widgets/common/bms_toast.dart';

/// Full-screen "Game Details" view that opens when a user taps a card in
/// the Join Games tab.
///
/// Receives an [initialGame] map (the snapshot the list already has) so the
/// first frame paints instantly, then re-fetches the canonical record from
/// `GET /hosted-game/:gameId` so player counts and other dynamic fields
/// reflect the live database.
class JoinGameInfoScreen extends StatefulWidget {
  final Map<String, dynamic> initialGame;
  final VoidCallback? onJoin;
  final bool isJoining;

  const JoinGameInfoScreen({
    super.key,
    required this.initialGame,
    this.onJoin,
    this.isJoining = false,
  });

  @override
  State<JoinGameInfoScreen> createState() => _JoinGameInfoScreenState();
}

class _JoinGameInfoScreenState extends State<JoinGameInfoScreen> {
  late Map<String, dynamic> _game;
  bool _refreshing = false;
  bool _joining = false;

  @override
  void initState() {
    super.initState();
    _game = Map<String, dynamic>.from(widget.initialGame);
    _refreshFromServer();
  }

  Future<void> _refreshFromServer() async {
    final id = (_game['id'] ?? _game['_id'])?.toString();
    if (id == null || id.isEmpty) return;
    setState(() => _refreshing = true);
    final fresh = await GameService().getGame(id);
    if (!mounted) return;
    if (fresh != null) {
      // Backend wraps the game in `{ game: {...} }` for the single-fetch
      // endpoint; if it's flat we accept that too.
      final inner = (fresh['game'] is Map<String, dynamic>)
          ? fresh['game'] as Map<String, dynamic>
          : fresh;
      setState(() {
        _game = inner;
        _refreshing = false;
      });
      await _enrichTurfCoords();
    } else {
      setState(() => _refreshing = false);
    }
  }

  /// The hosted-game endpoints only select `{id, name, city, state, images}`
  /// from the turf — no coordinates, so the map can never resolve. Fetch the
  /// full turf record by id and graft lat/lng onto `_game.turf` so the map
  /// can centre on the venue.
  Future<void> _enrichTurfCoords() async {
    final turf = _game['turf'];
    if (turf is! Map) return;
    final turfId = (turf['id'] ?? turf['_id'])?.toString();
    if (turfId == null || turfId.isEmpty) return;
    // Skip if the payload already has usable coordinates (future-proof in
    // case the backend select changes).
    if (turf['latitude'] != null && turf['longitude'] != null) return;
    final detail = await TurfService().getTurfDetails(turfId);
    if (!mounted || detail == null) return;
    if (detail.latitude == null || detail.longitude == null) return;
    setState(() {
      final updated = Map<String, dynamic>.from(turf.cast<String, dynamic>())
        ..['latitude'] = detail.latitude
        ..['longitude'] = detail.longitude;
      _game = {..._game, 'turf': updated};
    });
  }

  // ── Field accessors ──────────────────────────────────────────────────
  String get _sport =>
      (_game['sport'] ?? _game['gameType'] ?? 'Game').toString();
  Map<String, dynamic>? get _turf => _game['turf'] as Map<String, dynamic>?;
  String get _venueName => _turf?['name']?.toString() ?? 'Venue TBD';
  String get _location {
    final city = _turf?['city']?.toString() ?? _game['city']?.toString() ?? '';
    final state =
        _turf?['state']?.toString() ?? _game['state']?.toString() ?? '';
    return [city, state].where((s) => s.isNotEmpty).join(', ');
  }

  String get _hostName {
    final host = _game['host'];
    if (host is Map) {
      return (host['name'] ?? host['username'] ?? '—').toString();
    }
    return _game['hostName']?.toString() ?? '—';
  }

  String get _playersJoined {
    // Backend returns slot arrays (per-slot status), never a precomputed
    // count. Match the web client (`slot.status !== 'OPEN'`) so PENDING and
    // CONFIRMED slots are counted alongside JOINED/HELD.
    List<Map> _teamSlots(dynamic team) {
      if (team is! Map) return const [];
      final raw = team['slots'];
      if (raw is! List) return const [];
      return raw.whereType<Map>().toList();
    }

    final teams = _game['teams'];
    final teamSlots = <Map>[
      ..._teamSlots(teams is Map ? teams['teamA'] : null),
      ..._teamSlots(teams is Map ? teams['teamB'] : null),
    ];
    final quickSlots = (_game['quickSlots'] is List)
        ? (_game['quickSlots'] as List).whereType<Map>().toList()
        : <Map>[];
    final allSlots = teamSlots.isNotEmpty ? teamSlots : quickSlots;

    int? joined;
    if (allSlots.isNotEmpty) {
      joined = allSlots.where((s) {
        final st = s['status']?.toString().toUpperCase() ?? '';
        return st.isNotEmpty && st != 'OPEN' && st != 'CANCELLED';
      }).length;
    } else {
      final raw = _game['playersJoinedCount'] ??
          _game['joinedCount'] ??
          _game['playersCount'] ??
          (_game['players'] is List ? (_game['players'] as List).length : null);
      if (raw is num)
        joined = raw.toInt();
      else if (raw != null) joined = int.tryParse(raw.toString());
    }

    final maxRaw =
        _game['playerCount'] ?? _game['maxMembers'] ?? _game['maxPlayers'];
    int? max = maxRaw is num
        ? maxRaw.toInt()
        : (maxRaw == null ? null : int.tryParse(maxRaw.toString()));
    if ((max == null || max == 0) && allSlots.isNotEmpty) {
      max = allSlots.length;
    }

    if (joined == null && max == null) return '—';
    return '${joined ?? 0}/${max ?? '—'}';
  }

  bool get _isHost {
    final me = GameService().currentUserId;
    if (me == null || me.isEmpty) return false;
    final host = _game['host'];
    final hostId = (host is Map
            ? (host['id'] ?? host['_id'])
            : (_game['hostId'] ?? _game['host_id']))
        ?.toString();
    return hostId != null && hostId == me;
  }

  /// True when the current user is either the host or has already joined.
  /// These users see the management tiles ("Joined Players", chat) and the
  /// "INVITE PLAYERS" bottom CTA instead of "JOIN GAME".
  bool get _isParticipant => _isHost || _alreadyJoined;

  String get _perPlayerShare {
    final charge = _game['perPlayerCharge'];
    if (charge == null) return '—';
    final asNum = double.tryParse(charge.toString());
    if (asNum == null) return charge.toString();
    if (asNum == 0) return 'Free';
    return asNum.toStringAsFixed(0);
  }

  String get _gameType =>
      (_game['gameMode'] ?? _game['matchType'] ?? 'Friendly').toString();

  String get _shortId =>
      (_game['shortId'] ?? _game['id'] ?? _game['_id'] ?? '—').toString();

  LatLng? get _mapPosition {
    double? toD(dynamic v) =>
        v is num ? v.toDouble() : double.tryParse(v?.toString() ?? '');

    // Preferred: flat latitude/longitude (set by _enrichTurfCoords or future
    // backend payloads that include them).
    double? lat = toD(_turf?['latitude']) ?? toD(_game['latitude']);
    double? lng = toD(_turf?['longitude']) ?? toD(_game['longitude']);

    // Fallback: GeoJSON `locationData.coordinates = [lng, lat]`.
    if (lat == null || lng == null) {
      for (final src in <Map?>[_turf, _game]) {
        final loc = src == null ? null : src['locationData'];
        final coords = loc is Map ? loc['coordinates'] : null;
        if (coords is List && coords.length >= 2) {
          lng ??= toD(coords[0]);
          lat ??= toD(coords[1]);
          if (lat != null && lng != null) break;
        }
      }
    }

    if (lat == null || lng == null) return null;
    return LatLng(lat, lng);
  }

  String _formatDate(String? iso) {
    if (iso == null) return '—';
    final dt = DateTime.tryParse(iso);
    if (dt == null) return iso;
    const days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday'
    ];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    return '${days[dt.weekday - 1]}, ${months[dt.month - 1]} ${dt.day}';
  }

  String _formatTimeRange() {
    final start = _game['startTime']?.toString() ?? _game['time']?.toString();
    final end = _game['endTime']?.toString();
    if (start == null && end == null) return '';
    if (end == null) return start ?? '';
    return '$start - $end';
  }

  bool get _alreadyJoined =>
      _game['youJoined'] == true ||
      _game['_joined'] == true ||
      _game['isJoined'] == true;

  /// Join the game without leaving this screen. After a successful join,
  /// re-fetches the canonical record so `_isParticipant` flips and the
  /// bottom CTA swaps from "Join" to "View Joined Players".
  Future<void> _joinNow() async {
    final id = (_game['id'] ?? _game['_id'])?.toString();
    if (id == null || id.isEmpty || _joining) return;
    HapticFeedback.mediumImpact();
    setState(() => _joining = true);
    final result = await GameService().joinGame(id);
    if (!mounted) return;
    setState(() => _joining = false);
    if (result.ok) {
      if (result.autoJoined) {
        // Public game — slot is JOINED immediately. Flip locally and refresh.
        setState(() => _game = {..._game, 'youJoined': true});
        BmsToast.success(context, 'Successfully joined the game!');
        widget.onJoin?.call();
        await _refreshFromServer();
      } else {
        // Private game — slot is PENDING until the host approves. Don't
        // flip `youJoined` yet; let the server's authoritative state drive
        // the next refresh.
        setState(() => _game = {..._game, 'pendingApproval': true});
        BmsToast.success(
          context,
          'Request sent. The host will review and approve your join.',
        );
        await _refreshFromServer();
      }
    } else {
      BmsToast.error(context, result.message ?? 'Could not join the game.');
    }
  }

  // ── Build ────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            _header(),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _refreshFromServer,
                color: AppColors.accentGreen,
                backgroundColor: AppColors.surfaceL1,
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                  children: [
                    _titleBlock(),
                    const SizedBox(height: 16),
                    _mapBlock(),
                    if (_isParticipant) ...[
                      const SizedBox(height: 18),
                      _viewMessagesTile(),
                    ],
                    const SizedBox(height: 28),
                    const Text(
                      'Game Summary',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'Poppins',
                      ),
                    ),
                    const SizedBox(height: 14),
                    _summaryGrid(),
                    if (_isParticipant) ...[
                      const SizedBox(height: 28),
                      const Text(
                        'Manage Players',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'Poppins',
                        ),
                      ),
                      const SizedBox(height: 14),
                      _joinedPlayersTile(),
                    ],
                  ],
                ),
              ),
            ),
            _bottomCta(),
          ],
        ),
      ),
    );
  }

  Widget _header() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
      child: Row(
        children: [
          IconButton(
            onPressed: () => context.pop(),
            icon: const Icon(LucideIcons.arrowLeft,
                color: AppColors.accentGreen, size: 22),
          ),
          const Expanded(
            child: Text(
              'Game Details',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: 17,
                fontWeight: FontWeight.w600,
                fontFamily: 'Poppins',
              ),
            ),
          ),
          // Symmetry spacer matching the IconButton width.
          const SizedBox(width: 48),
        ],
      ),
    );
  }

  Widget _titleBlock() {
    final dateLine = _formatDate(_game['date']?.toString());
    final timeLine = _formatTimeRange();
    final meta =
        [_sport, dateLine, timeLine].where((s) => s.isNotEmpty).join(' · ');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _venueName == 'Venue TBD' ? '$_sport Match' : _venueName,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 22,
            fontWeight: FontWeight.w700,
            fontFamily: 'Poppins',
          ),
        ),
        const SizedBox(height: 6),
        Text(
          meta,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.55),
            fontSize: 13,
            fontFamily: 'Poppins',
          ),
        ),
      ],
    );
  }

  Widget _mapBlock() {
    final pos = _mapPosition;

    final mapTile = ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: SizedBox(
        height: 180,
        child: Stack(
          children: [
            Positioned.fill(
              child: pos == null
                  ? _mapFallback()
                  : GoogleMap(
                      initialCameraPosition: CameraPosition(
                        target: pos,
                        zoom: 14,
                      ),
                      markers: {
                        Marker(
                          markerId: MarkerId(_shortId),
                          position: pos,
                          infoWindow: InfoWindow(title: _venueName),
                        ),
                      },
                      myLocationButtonEnabled: false,
                      zoomControlsEnabled: false,
                      liteModeEnabled: true,
                    ),
            ),
            Positioned(
              left: 12,
              bottom: 12,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.55),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(LucideIcons.navigation,
                        color: AppColors.accentGreen, size: 14),
                    const SizedBox(width: 6),
                    Text(
                      _location.isEmpty ? _venueName : _location,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        fontFamily: 'Poppins',
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (_refreshing)
              const Positioned(
                top: 8,
                right: 8,
                child: SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppColors.accentGreen,
                  ),
                ),
              ),
          ],
        ),
      ),
    );

    return mapTile;
  }

  Widget _mapFallback() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.surfaceL1, AppColors.surfaceL0],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      alignment: Alignment.center,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(LucideIcons.mapPin,
              color: Colors.white.withValues(alpha: 0.3), size: 28),
          const SizedBox(height: 6),
          Text(
            'Location not available',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.5),
              fontSize: 12,
              fontFamily: 'Poppins',
            ),
          ),
        ],
      ),
    );
  }

  Widget _summaryGrid() {
    final cells = <_SummaryCell>[
      _SummaryCell(label: 'Host', value: _hostName),
      _SummaryCell(label: 'Players Joined', value: _playersJoined),
      _SummaryCell(label: 'Per Player Share', value: _perPlayerShare),
      _SummaryCell(label: 'Game Type', value: _gameType),
      // Per request: include Game ID in the summary.
      _SummaryCell(label: 'Game ID', value: _shortId, isWide: true),
    ];

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceL1.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        children: [
          _gridRow(cells[0], cells[1]),
          _gridDivider(horizontal: true),
          _gridRow(cells[2], cells[3]),
          _gridDivider(horizontal: true),
          _wideRow(cells[4]),
        ],
      ),
    );
  }

  Widget _gridRow(_SummaryCell a, _SummaryCell b) {
    return IntrinsicHeight(
      child: Row(
        children: [
          Expanded(child: _cellTile(a)),
          _gridDivider(horizontal: false),
          Expanded(child: _cellTile(b)),
        ],
      ),
    );
  }

  Widget _wideRow(_SummaryCell c) {
    return SizedBox(width: double.infinity, child: _cellTile(c));
  }

  Widget _cellTile(_SummaryCell c) {
    return InkWell(
      onTap: c.label == 'Game ID'
          ? () async {
              await Clipboard.setData(ClipboardData(text: c.value));
              if (!mounted) return;
              BmsToast.success(context, 'Game ID copied');
            }
          : null,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              c.label,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.5),
                fontSize: 12,
                fontFamily: 'Poppins',
              ),
            ),
            const SizedBox(height: 6),
            Text(
              c.value,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.w600,
                fontFamily: 'Poppins',
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _gridDivider({required bool horizontal}) {
    return Container(
      width: horizontal ? double.infinity : 1,
      height: horizontal ? 1 : null,
      color: Colors.white.withValues(alpha: 0.06),
    );
  }

  // ── Joined-state tiles ──────────────────────────────────────────────
  Widget _viewMessagesTile() {
    return _ActionTile(
      icon: LucideIcons.messageCircle,
      iconColor: AppColors.accentGreen,
      label: 'View Messages',
      onTap: _openGameChat,
    );
  }

  Widget _joinedPlayersTile() {
    return _ActionTile(
      label: 'Joined Players',
      onTap: _openJoinedPlayers,
    );
  }

  void _openGameChat() {
    final id = (_game['id'] ?? _game['_id'])?.toString() ?? '';
    if (id.isEmpty) return;
    final players = (_game['players'] as List?) ?? const [];
    context.push('/chat', extra: {
      'chatId': id,
      'friendId': id,
      'friendName': _venueName == 'Venue TBD' ? '$_sport Match' : _venueName,
      'isGroup': true,
      'members': players.whereType<Map<String, dynamic>>().toList(),
    });
  }

  void _openJoinedPlayers() {
    context.push('/join-game/joined-players', extra: {
      'gameId': (_game['id'] ?? _game['_id'])?.toString(),
      'game': _game,
    });
  }

  void _invitePlayers() {
    HapticFeedback.lightImpact();
    final id = (_game['id'] ?? _game['_id'])?.toString();
    final shortId = _shortId;
    // Reuse the platform share sheet via Clipboard fallback. Inviting a
    // player by deep link mirrors the web's "Copy invite" CTA — the host
    // pastes it into WhatsApp / SMS. If the project later wires a deep
    // link service, swap the body for `share_plus.Share.share(...)`.
    final link = id == null
        ? 'Join my game on Kridaz (ID: $shortId)'
        : 'Join my game on Kridaz: $shortId\nhttps://kridaz.app/game/$id';
    Clipboard.setData(ClipboardData(text: link));
    BmsToast.success(context, 'Invite link copied — paste into chat');
  }

  Widget _bottomCta() {
    if (_isParticipant) {
      // Primary CTA after join: open the joined-players roster. Invite is
      // kept as a secondary icon on the right so the existing "share invite
      // link" affordance isn't lost.
      return Padding(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
        child: Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: _openJoinedPlayers,
                child: Container(
                  height: 54,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF6FE7C3), Color(0xFFCAE96A)],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF6FE7C3).withValues(alpha: 0.3),
                        blurRadius: 18,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  alignment: Alignment.center,
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(LucideIcons.users, color: Colors.black, size: 18),
                      SizedBox(width: 8),
                      Text(
                        'VIEW JOINED PLAYERS',
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.2,
                          fontFamily: 'Poppins',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            GestureDetector(
              onTap: _invitePlayers,
              child: Container(
                width: 54,
                height: 54,
                decoration: BoxDecoration(
                  color: AppColors.surfaceL1.withValues(alpha: 0.7),
                  borderRadius: BorderRadius.circular(16),
                  border:
                      Border.all(color: Colors.white.withValues(alpha: 0.08)),
                ),
                alignment: Alignment.center,
                child: const Icon(LucideIcons.userPlus,
                    color: Color(0xFF6FE7C3), size: 20),
              ),
            ),
          ],
        ),
      );
    }
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
      child: GestureDetector(
        onTap: (widget.isJoining || _joining) ? null : _joinNow,
        child: Container(
          height: 54,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [
                Color(0xFF6FE7C3), // mint
                Color(0xFFCAE96A), // lime
              ],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF6FE7C3).withValues(alpha: 0.3),
                blurRadius: 18,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          alignment: Alignment.center,
          child: (widget.isJoining || _joining)
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: Colors.black,
                  ),
                )
              : const Text(
                  'JOIN GAME',
                  style: TextStyle(
                    color: Colors.black,
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                    fontFamily: 'Poppins',
                  ),
                ),
        ),
      ),
    );
  }
}

class _SummaryCell {
  final String label;
  final String value;
  final bool isWide;
  const _SummaryCell({
    required this.label,
    required this.value,
    this.isWide = false,
  });
}

/// Dark rounded row with optional leading icon, label, and a chevron.
/// Used for "View Messages" and "Joined Players" in the joined-state view.
class _ActionTile extends StatelessWidget {
  final IconData? icon;
  final Color? iconColor;
  final String label;
  final VoidCallback onTap;

  const _ActionTile({
    this.icon,
    this.iconColor,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        height: 56,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: AppColors.surfaceL1.withValues(alpha: 0.55),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
        ),
        child: Row(
          children: [
            if (icon != null) ...[
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: (iconColor ?? AppColors.accentGreen)
                      .withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Icon(icon,
                    size: 16, color: iconColor ?? AppColors.accentGreen),
              ),
              const SizedBox(width: 12),
            ],
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  fontFamily: 'Poppins',
                ),
              ),
            ),
            Icon(LucideIcons.chevronRight,
                color: Colors.white.withValues(alpha: 0.4), size: 20),
          ],
        ),
      ),
    );
  }
}
