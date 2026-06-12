import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../widgets/common/bms_toast.dart';
import '../core/constants/app_colors.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:intl/intl.dart';
import '../services/game_service.dart';

class JoinGameDetailScreen extends StatefulWidget {
  // Legacy fields — used when navigated from home dashboard static cards
  final String gameTitle;
  final String sport;
  final String date;
  final String time;
  final String location;

  // Live-data fields — used when a real game is passed
  final Map<String, dynamic>? game;

  const JoinGameDetailScreen({
    super.key,
    this.gameTitle = 'Weekend Cricket Match',
    this.sport = 'Cricket',
    this.date = 'Saturday, July 20',
    this.time = '10:00 AM - 1:00 PM',
    this.location = 'Central Park, New York',
    this.game,
  });

  @override
  State<JoinGameDetailScreen> createState() => _JoinGameDetailScreenState();
}

class _JoinGameDetailScreenState extends State<JoinGameDetailScreen> {
  final _service = GameService();

  Map<String, dynamic>? _game;
  bool _isLoading = false;
  bool _isJoining = false;
  bool _hasJoined = false;

  String? get _gameId => (_game?['id'] ?? _game?['_id'])?.toString();

  @override
  void initState() {
    super.initState();
    if (widget.game != null) {
      _game = widget.game;
      _hasJoined =
          widget.game?['_joined'] == true || widget.game?['isJoined'] == true;
      final id = (_game?['id'] ?? _game?['_id'])?.toString();
      if (id != null && id.isNotEmpty) {
        _fetchDetails(id);
      }
    }
  }

  Future<void> _fetchDetails(String id) async {
    setState(() => _isLoading = true);
    final result = await _service.getGame(id);
    if (mounted && result != null) {
      setState(() {
        _game = result;
        _hasJoined = result['_joined'] == true || result['isJoined'] == true;
        _isLoading = false;
      });
    } else if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _joinGame() async {
    final id = _gameId;
    HapticFeedback.mediumImpact();
    if (id == null || id.isEmpty) {
      BmsToast.error(context, 'Missing game ID — cannot join this game.');
      return;
    }
    setState(() => _isJoining = true);
    final result = await _service.joinGame(id);
    if (!mounted) return;
    setState(() => _isJoining = false);
    if (result.ok) {
      setState(() {
        if (result.autoJoined) {
          _hasJoined = true;
          if (_game != null) {
            // Public game: slot is JOINED — bump the local count so the
            // "X/Y players" label reflects the join immediately.
            final raw = _game!['currentMembers'];
            final current = raw is num
                ? raw.toInt()
                : int.tryParse((raw ?? '').toString()) ?? 0;
            _game = {..._game!, 'currentMembers': current + 1};
          }
        } else if (_game != null) {
          // Private game: slot is PENDING until the host approves.
          _game = {..._game!, 'pendingApproval': true};
        }
      });
      BmsToast.success(
        context,
        result.autoJoined
            ? 'Successfully joined the game!'
            : 'Request sent. The host will review and approve your join.',
      );
    } else {
      BmsToast.error(context, result.message ?? 'Could not join the game.');
    }
  }

  // â”€â”€ Data helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  String get _title {
    if (_game != null) {
      final sport = _game!['sport']?.toString() ??
          _game!['gameType']?.toString() ??
          widget.sport;
      final host = _game!['host'] as Map?;
      final hostName =
          host?['name']?.toString() ?? host?['username']?.toString() ?? '';
      return hostName.isNotEmpty ? '$hostName\'s $sport Game' : '$sport Game';
    }
    return widget.gameTitle;
  }

  String get _sportLabel =>
      _game?['sport']?.toString() ??
      _game?['gameType']?.toString() ??
      widget.sport;

  String get _dateLabel {
    if (_game != null) {
      final raw = _game!['date']?.toString();
      if (raw != null) {
        try {
          return DateFormat('EEE, dd MMM')
              .format(DateTime.parse(raw).toLocal());
        } catch (_) {}
      }
    }
    return widget.date;
  }

  String get _timeLabel {
    if (_game != null) {
      final start = _game!['startTime']?.toString() ?? '';
      final end = _game!['endTime']?.toString() ?? '';
      if (start.isNotEmpty && end.isNotEmpty) return '$start – $end';
      if (start.isNotEmpty) return start;
    }
    return widget.time;
  }

  String get _locationLabel {
    if (_game != null) {
      final turf = _game!['turf'] as Map?;
      final name = turf?['name']?.toString() ?? '';
      final city =
          turf?['city']?.toString() ?? _game!['city']?.toString() ?? '';
      if (name.isNotEmpty && city.isNotEmpty) return '$name, $city';
      if (name.isNotEmpty) return name;
      if (city.isNotEmpty) return city;
    }
    return widget.location;
  }

  String get _hostName {
    if (_game != null) {
      final host = _game!['host'] as Map?;
      return host?['name']?.toString() ?? host?['username']?.toString() ?? '—';
    }
    return 'Sampad';
  }

  String get _playersLabel {
    if (_game != null) {
      int _toInt(dynamic v) {
        if (v is num) return v.toInt();
        if (v == null) return 0;
        return int.tryParse(v.toString()) ?? 0;
      }

      final max = _toInt(_game!['playerCount']) > 0
          ? _toInt(_game!['playerCount'])
          : (_toInt(_game!['maxMembers']) > 0
              ? _toInt(_game!['maxMembers'])
              : _toInt(_game!['maxPlayers']));
      final current = _game!['currentMembers'] != null
          ? _toInt(_game!['currentMembers'])
          : (_game!['members'] as List?)?.length ?? 0;
      if (max > 0) return '$current/$max';
    }
    return '8/11';
  }

  String get _chargeLabel {
    if (_game != null) {
      final isFree = _game!['isFree'] == true ||
          (double.tryParse(_game!['perPlayerCharge']?.toString() ?? '') ?? 0) ==
              0;
      if (isFree) return 'Free';
      final charge = _game!['perPlayerCharge'];
      if (charge != null) {
        return '₹${double.tryParse(charge.toString())?.toStringAsFixed(0) ?? charge}';
      }
    }
    return '₹2500';
  }

  String get _gameModeLabel {
    if (_game != null) {
      final mode = _game!['gameMode']?.toString() ?? '';
      if (mode.isNotEmpty) {
        return mode[0].toUpperCase() + mode.substring(1).toLowerCase();
      }
    }
    return 'Friendly';
  }

  LatLng? get _mapCenter {
    if (_game != null) {
      final turf = _game!['turf'] as Map?;
      final lat = turf?['latitude'] ?? turf?['lat'];
      final lng = turf?['longitude'] ?? turf?['lng'] ?? turf?['lon'];
      if (lat != null && lng != null) {
        return LatLng(
          double.tryParse(lat.toString()) ?? 17.3725,
          double.tryParse(lng.toString()) ?? 78.5035,
        );
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final center = _mapCenter ?? const LatLng(17.3725, 78.5035);

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
          'Game Details',
          style: TextStyle(
            color: Colors.white,
            fontSize: 17,
            fontWeight: FontWeight.w600,
            fontFamily: 'Poppins',
          ),
        ),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                  color: AppColors.gradientStart, strokeWidth: 2))
          : SingleChildScrollView(
              padding: const EdgeInsets.only(bottom: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // â”€â”€ Title + subtitle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Poppins',
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '$_sportLabel · $_dateLabel · $_timeLabel',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.55),
                            fontSize: 12,
                            fontFamily: 'Poppins',
                          ),
                        ),
                      ],
                    ),
                  ),

                  // â”€â”€ Map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: SizedBox(
                        height: 190,
                        width: double.infinity,
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            AbsorbPointer(
                              child: FlutterMap(
                                options: MapOptions(
                                  initialCenter: center,
                                  initialZoom: 14,
                                  interactionOptions: const InteractionOptions(
                                    flags: InteractiveFlag.none,
                                  ),
                                ),
                                children: [
                                  TileLayer(
                                    urlTemplate:
                                        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                                    subdomains: const ['a', 'b', 'c', 'd'],
                                    userAgentPackageName: 'com.saavikdev.bms',
                                  ),
                                  MarkerLayer(
                                    markers: [
                                      Marker(
                                        point: center,
                                        child: const Icon(
                                          LucideIcons.mapPin,
                                          color: Colors.red,
                                          size: 36,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            Positioned(
                              left: 0,
                              right: 0,
                              bottom: 0,
                              height: 56,
                              child: DecoratedBox(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    begin: Alignment.bottomCenter,
                                    end: Alignment.topCenter,
                                    colors: [
                                      Colors.black.withValues(alpha: 0.70),
                                      Colors.transparent,
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            Positioned(
                              left: 12,
                              bottom: 12,
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(LucideIcons.mapPin,
                                      size: 14, color: AppColors.accentLime),
                                  const SizedBox(width: 5),
                                  Text(
                                    _locationLabel,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      fontFamily: 'Poppins',
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  // â”€â”€ View Messages (only after joining) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                  if (_hasJoined) ...[
                    const SizedBox(height: 14),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Container(
                        height: 52,
                        decoration: BoxDecoration(
                          color: AppColors.surfaceL3,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        child: Row(
                          children: [
                            Container(
                              width: 28,
                              height: 28,
                              decoration: const BoxDecoration(
                                color: AppColors.accentLime,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                LucideIcons.messageCircle,
                                color: Colors.black,
                                size: 16,
                              ),
                            ),
                            const SizedBox(width: 12),
                            const Text(
                              'View Messages',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                                fontFamily: 'Poppins',
                              ),
                            ),
                            const Spacer(),
                            const Icon(LucideIcons.chevronRight,
                                color: Colors.white38, size: 20),
                          ],
                        ),
                      ),
                    ),
                  ],

                  const SizedBox(height: 22),

                  // â”€â”€ Game Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Game Summary',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Poppins',
                          ),
                        ),
                        const SizedBox(height: 12),
                        _buildInfoPill(
                            'Host', _hostName, 'Players Joined', _playersLabel),
                        const SizedBox(height: 10),
                        _buildInfoPill('Per Player Share', _chargeLabel,
                            'Game Type', _gameModeLabel),
                      ],
                    ),
                  ),

                  // â”€â”€ Manage Players (only after joining) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                  if (_hasJoined) ...[
                    const SizedBox(height: 22),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Manage Players',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              fontFamily: 'Poppins',
                            ),
                          ),
                          const SizedBox(height: 12),
                          GestureDetector(
                            onTap: () {
                              HapticFeedback.selectionClick();
                              context.push('/join-game/joined-players');
                            },
                            child: Container(
                              height: 52,
                              decoration: BoxDecoration(
                                color: AppColors.surfaceL3,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 14),
                              child: Row(
                                children: [
                                  const Text(
                                    'Joined Players',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                      fontFamily: 'Poppins',
                                    ),
                                  ),
                                  const Spacer(),
                                  const Icon(LucideIcons.chevronRight,
                                      color: Colors.white38, size: 20),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),

      // â”€â”€ Bottom buttons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      bottomNavigationBar: Container(
        color: Colors.black,
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (!_hasJoined)
                SizedBox(
                  height: 52,
                  width: double.infinity,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [
                          AppColors.gradientStart,
                          AppColors.gradientEnd
                        ],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: ElevatedButton(
                      onPressed: _isJoining ? null : _joinGame,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        foregroundColor: Colors.black,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isJoining
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                  color: Colors.black, strokeWidth: 2))
                          : const Text(
                              'JOIN GAME',
                              style: TextStyle(
                                color: Colors.black,
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1.0,
                                fontFamily: 'Poppins',
                              ),
                            ),
                    ),
                  ),
                ),
              if (_hasJoined)
                SizedBox(
                  height: 52,
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () => HapticFeedback.lightImpact(),
                    style: OutlinedButton.styleFrom(
                      backgroundColor: AppColors.surfaceL3,
                      side: BorderSide(
                          color: Colors.white.withValues(alpha: 0.10),
                          width: 1),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: ShaderMask(
                      shaderCallback: (bounds) => const LinearGradient(
                        colors: [
                          AppColors.gradientStart,
                          AppColors.gradientEnd
                        ],
                      ).createShader(bounds),
                      child: const Text(
                        'INVITE PLAYERS',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.0,
                          fontFamily: 'Poppins',
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoPill(
    String label1,
    String value1,
    String label2,
    String value2,
  ) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surfaceL3,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label1,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.55),
                      fontSize: 12,
                      fontFamily: 'Poppins',
                    )),
                const SizedBox(height: 5),
                Text(value1,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Poppins',
                    )),
              ],
            ),
          ),
          Container(
            width: 1,
            height: 36,
            color: Colors.white12,
            margin: const EdgeInsets.symmetric(horizontal: 14),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label2,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.55),
                      fontSize: 12,
                      fontFamily: 'Poppins',
                    )),
                const SizedBox(height: 5),
                Text(value2,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Poppins',
                    )),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
