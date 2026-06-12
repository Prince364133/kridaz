import 'package:cached_network_image/cached_network_image.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../core/constants/app_colors.dart';
import '../services/friends_service.dart';
import '../services/player_profile_service.dart';

/// Quick-peek profile shown when a player is tapped from nearby/search
/// lists. Half-sheet by default, draggable to ~95%. Constructor is
/// stable — five call sites pass `playerData` (snake_case from the
/// nearby-players API).
///
/// Reels are intentionally NOT rendered here. Per product, reels are an
/// admin-whitelisted creator feature; we surface them only when the
/// viewed user carries the `isReelCreator` flag. Until that flag ships,
/// nothing here ever shows a reel.
class PlayerProfileScreen extends StatefulWidget {
  final Map<String, dynamic> playerData;

  const PlayerProfileScreen({
    Key? key,
    required this.playerData,
  }) : super(key: key);

  @override
  State<PlayerProfileScreen> createState() => _PlayerProfileScreenState();
}

class _PlayerProfileScreenState extends State<PlayerProfileScreen> {
  final DraggableScrollableController _controller =
      DraggableScrollableController();
  final _friends = FriendsService();
  final _service = PlayerProfileService();

  bool _isFollowing = false;
  bool _followBusy = false;
  bool _isBlocked = false;
  List<Map<String, dynamic>> _mutuals = const [];

  String? get _playerId {
    final id = widget.playerData['_id'] ??
        widget.playerData['id'] ??
        widget.playerData['user_id'] ??
        widget.playerData['userId'];
    return id?.toString();
  }

  @override
  void initState() {
    super.initState();
    // Hydrate follow state from playerData if the discovery payload included it.
    _isFollowing = widget.playerData['is_following'] == true ||
        widget.playerData['isFollowing'] == true;
    // Fire-and-forget: backend dedupes on (viewer, viewed, UTC day).
    final id = _playerId;
    if (id != null && id.isNotEmpty) {
      _service.recordProfileView(id);
      _service.getMutualConnections(id).then((rows) {
        if (mounted && rows.isNotEmpty) {
          setState(() => _mutuals = rows);
        }
      });
    }
  }

  // ─── Data accessors (snake_case nearby-player API shape) ─────────────────

  String get _displayName =>
      widget.playerData['display_name'] ??
      widget.playerData['name'] ??
      widget.playerData['first_name'] ??
      'Unknown';

  String get _username {
    final raw = widget.playerData['username'] ?? widget.playerData['userName'];
    if (raw != null && '$raw'.isNotEmpty) return '@$raw';
    return '@${_displayName.toLowerCase().replaceAll(' ', '_')}';
  }

  String? get _photoUrl =>
      widget.playerData['photo_url'] ?? widget.playerData['avatar'];

  String? get _city =>
      widget.playerData['city'] ?? widget.playerData['location'];

  int get _level {
    final v = widget.playerData['level'];
    if (v is num) return v.toInt();
    return int.tryParse('$v') ?? 1;
  }

  bool get _verifiedId => widget.playerData['verified_id'] == true;
  bool get _isReelCreator => widget.playerData['is_reel_creator'] == true;

  int get _totalGamesPlayed => widget.playerData['total_games_played'] ?? 0;

  Map<String, dynamic> get _gamesBySport =>
      (widget.playerData['games_by_sport'] as Map<String, dynamic>?) ?? {};

  Map<String, dynamic> get _weeklyActivity =>
      (widget.playerData['weekly_activity'] as Map<String, dynamic>?) ?? {};

  String? get _mostActiveDay => widget.playerData['most_active_day'];

  List<String> get _sports =>
      (widget.playerData['sports'] as List?)?.cast<String>() ?? [];

  String get _primarySport => _sports.isNotEmpty ? _sports.first : '';

  String? get _skillForPrimary {
    final levels = widget.playerData['skill_levels'];
    if (levels is Map && _primarySport.isNotEmpty) {
      return levels[_primarySport.toLowerCase()]?.toString();
    }
    return null;
  }

  List<MapEntry<String, int>> get _topSports {
    final sports = _gamesBySport.entries
        .map((e) => MapEntry(
            e.key,
            e.value is num
                ? (e.value as num).toInt()
                : int.tryParse(e.value.toString()) ?? 0))
        .toList();
    sports.sort((a, b) => b.value.compareTo(a.value));
    return sports.take(3).toList();
  }

  int get _otherSportsCount {
    final sports = _gamesBySport.entries
        .map((e) => MapEntry(
            e.key,
            e.value is num
                ? (e.value as num).toInt()
                : int.tryParse(e.value.toString()) ?? 0))
        .toList();
    sports.sort((a, b) => b.value.compareTo(a.value));
    if (sports.length <= 3) return 0;
    return sports.skip(3).fold(0, (sum, e) => sum + e.value);
  }

  List<FlSpot> get _activitySpots {
    const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    return dayOrder.asMap().entries.map((entry) {
      final raw = _weeklyActivity[entry.value];
      final value = raw is num
          ? raw.toDouble()
          : (raw == null ? 0.0 : double.tryParse(raw.toString()) ?? 0.0);
      return FlSpot(entry.key.toDouble(), value);
    }).toList();
  }

  int get _mostActiveDayIndex {
    const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    if (_mostActiveDay == null) return -1;
    return dayOrder.indexOf(_mostActiveDay!.toLowerCase());
  }

  // ─── Build ───────────────────────────────────────────────────────────────

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      controller: _controller,
      initialChildSize: 0.55,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: SingleChildScrollView(
            controller: scrollController,
            child: Column(
              children: [
                _dragHandle(),
                _headerRow(),
                const SizedBox(height: 14),
                _ctaRow(),
                if (_mutuals.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  _mutualsRow(),
                ],
                const SizedBox(height: 24),
                _gamesPlayedSection(),
                if (_weeklyActivity.isNotEmpty) ...[
                  const SizedBox(height: 28),
                  _mostActiveSection(),
                ],
                if (_isReelCreator) ...[
                  const SizedBox(height: 24),
                  _reelsPlaceholder(),
                ],
                const SizedBox(height: 28),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _dragHandle() {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 12),
      width: 40,
      height: 4,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }

  Widget _headerRow() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _avatar(),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        _displayName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    if (_verifiedId)
                      const Icon(Icons.verified,
                          color: AppColors.primary, size: 16),
                    const Spacer(),
                    _levelBadge(),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  _username,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.5),
                    fontSize: 12,
                  ),
                ),
                if (_city != null && _city!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(LucideIcons.mapPin,
                          color: AppColors.primary, size: 12),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          _city!,
                          style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.7),
                              fontSize: 11),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
                if (_primarySport.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  _sportSkillChip(),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _avatar() {
    return Container(
      width: 64,
      height: 64,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.primary, width: 2),
      ),
      child: ClipOval(
        child: _photoUrl != null && _photoUrl!.isNotEmpty
            ? CachedNetworkImage(
                imageUrl: _photoUrl!,
                fit: BoxFit.cover,
                errorWidget: (_, __, ___) => Container(
                  color: Colors.grey[800],
                  child:
                      Icon(LucideIcons.user, color: Colors.grey[600], size: 28),
                ),
              )
            : Container(
                color: Colors.grey[800],
                child:
                    Icon(LucideIcons.user, color: Colors.grey[600], size: 28),
              ),
      ),
    );
  }

  Widget _levelBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.surfaceL3,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(LucideIcons.shield, color: AppColors.primary, size: 11),
          const SizedBox(width: 4),
          Text(
            'LV $_level',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _sportSkillChip() {
    final skill = _skillForPrimary;
    final label = skill == null || skill.isEmpty
        ? _primarySport
        : '$_primarySport · ${skill[0].toUpperCase()}${skill.substring(1)}';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.gradientStart, AppColors.gradientEnd],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        label,
        style: const TextStyle(
            color: Colors.black, fontSize: 10, fontWeight: FontWeight.w700),
      ),
    );
  }

  Widget _ctaRow() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Expanded(
            child: _primaryCta(
              label: 'Challenge',
              icon: LucideIcons.swords,
              onTap: () => HapticFeedback.lightImpact(),
            ),
          ),
          const SizedBox(width: 10),
          _secondaryCta(
            icon: LucideIcons.messageCircle,
            onTap: () => HapticFeedback.selectionClick(),
          ),
          const SizedBox(width: 10),
          _secondaryCta(
            icon: _followBusy
                ? LucideIcons.loader
                : (_isFollowing ? LucideIcons.userCheck : LucideIcons.userPlus),
            onTap: _toggleFollow,
            highlight: _isFollowing,
          ),
          const SizedBox(width: 10),
          _secondaryCta(
            icon: LucideIcons.moreHorizontal,
            onTap: _openMoreMenu,
          ),
        ],
      ),
    );
  }

  Future<void> _toggleFollow() async {
    final id = _playerId;
    if (id == null || id.isEmpty || _followBusy) return;
    HapticFeedback.selectionClick();
    final wasFollowing = _isFollowing;
    setState(() {
      _followBusy = true;
      _isFollowing = !wasFollowing; // optimistic
    });
    final ok = wasFollowing
        ? await _friends.unfollowPlayer(id)
        : await _friends.followPlayer(id);
    if (!mounted) return;
    setState(() {
      _followBusy = false;
      if (!ok) _isFollowing = wasFollowing; // rollback
    });
    if (!ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.surfaceL2,
          content: Text(
            wasFollowing ? 'Couldn\'t unfollow' : 'Couldn\'t follow',
            style: const TextStyle(color: Colors.white),
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _openMoreMenu() {
    HapticFeedback.selectionClick();
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.surfaceL1,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (sheet) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 8),
            ListTile(
              leading: Icon(
                _isBlocked ? LucideIcons.unlock : LucideIcons.userX,
                color: Colors.white,
                size: 18,
              ),
              title: Text(_isBlocked ? 'Unblock' : 'Block',
                  style: const TextStyle(color: Colors.white, fontSize: 14)),
              onTap: () {
                Navigator.of(sheet).pop();
                _confirmBlock();
              },
            ),
            ListTile(
              leading: const Icon(LucideIcons.flag,
                  color: AppColors.errorRed, size: 18),
              title: const Text('Report',
                  style: TextStyle(color: Colors.white, fontSize: 14)),
              onTap: () {
                Navigator.of(sheet).pop();
                _openReportSheet();
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmBlock() async {
    final id = _playerId;
    if (id == null || id.isEmpty) return;
    final wasBlocked = _isBlocked;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceL2,
        title: Text(
          wasBlocked ? 'Unblock $_displayName?' : 'Block $_displayName?',
          style: const TextStyle(color: Colors.white, fontSize: 15),
        ),
        content: Text(
          wasBlocked
              ? 'They\'ll be able to see your profile and message you again.'
              : 'They won\'t see your profile or be able to message you. Any existing follow connections will be removed.',
          style: TextStyle(
              color: Colors.white.withValues(alpha: 0.7), fontSize: 12),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child:
                const Text('Cancel', style: TextStyle(color: Colors.white70)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(
              wasBlocked ? 'Unblock' : 'Block',
              style: const TextStyle(color: AppColors.errorRed),
            ),
          ),
        ],
      ),
    );
    if (confirm != true || !mounted) return;
    final ok = wasBlocked
        ? await _service.unblockPlayer(id)
        : await _service.blockPlayer(id);
    if (!mounted) return;
    if (ok) {
      setState(() {
        _isBlocked = !wasBlocked;
        if (!wasBlocked) _isFollowing = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.surfaceL2,
          content: Text(
            wasBlocked ? '$_displayName unblocked' : '$_displayName blocked',
            style: const TextStyle(color: Colors.white),
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
      if (!wasBlocked) Navigator.of(context).maybePop();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AppColors.surfaceL2,
          content: Text("Something went wrong. Try again.",
              style: TextStyle(color: Colors.white)),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _openReportSheet() {
    final id = _playerId;
    if (id == null || id.isEmpty) return;
    // Backend's closed reason set (player.controller.js).
    const reasons = <Map<String, String>>[
      {'code': 'harassment', 'label': 'Harassment or bullying'},
      {'code': 'inappropriate_content', 'label': 'Inappropriate content'},
      {'code': 'impersonation', 'label': 'Impersonation'},
      {'code': 'spam', 'label': 'Spam or scam'},
      {'code': 'underage', 'label': 'Underage user'},
      {'code': 'safety', 'label': 'Safety concern'},
      {'code': 'other', 'label': 'Other'},
    ];
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.surfaceL1,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (sheet) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 12),
            const Text('Why are you reporting?',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text(
              'Reports go to our trust & safety team.',
              style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.5), fontSize: 11),
            ),
            const SizedBox(height: 12),
            for (final r in reasons)
              ListTile(
                dense: true,
                title: Text(r['label']!,
                    style: const TextStyle(color: Colors.white, fontSize: 13)),
                onTap: () async {
                  Navigator.of(sheet).pop();
                  final ok = await _service.reportPlayer(
                    id,
                    reason: r['code']!,
                  );
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      backgroundColor: AppColors.surfaceL2,
                      content: Text(
                        ok
                            ? 'Thanks — report submitted.'
                            : 'Couldn\'t submit. Try again.',
                        style: const TextStyle(color: Colors.white),
                      ),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                },
              ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Widget _primaryCta({
    required String label,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 42,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.gradientStart, AppColors.gradientEnd],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.black, size: 15),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(
                  color: Colors.black,
                  fontSize: 13,
                  fontWeight: FontWeight.w700),
            ),
          ],
        ),
      ),
    );
  }

  Widget _secondaryCta({
    required IconData icon,
    required VoidCallback onTap,
    bool highlight = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 42,
        height: 42,
        decoration: BoxDecoration(
          color: highlight
              ? AppColors.primary.withValues(alpha: 0.18)
              : AppColors.surfaceL2,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: highlight
                ? AppColors.primary.withValues(alpha: 0.5)
                : Colors.white.withValues(alpha: 0.08),
          ),
        ),
        child: Icon(
          icon,
          color: highlight ? AppColors.primary : Colors.white,
          size: 17,
        ),
      ),
    );
  }

  Widget _gamesPlayedSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'GAMES PLAYED',
            style: TextStyle(
              color: AppColors.primary,
              fontSize: 12,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            _totalGamesPlayed.toString(),
            style: const TextStyle(
              color: AppColors.primary,
              fontSize: 72,
              fontWeight: FontWeight.w900,
              height: 0.9,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              ..._topSports.map(
                (sport) => _buildSportStat(_capitalize(sport.key), sport.value),
              ),
              if (_otherSportsCount > 0)
                _buildSportStat('Others', _otherSportsCount, isOther: true),
              if (_topSports.length < 3 && _otherSportsCount == 0)
                ...List.generate(
                    3 - _topSports.length, (_) => const SizedBox(width: 60)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _mostActiveSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'MOST ACTIVE',
            style: TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 150,
            child: LineChart(
              LineChartData(
                minX: 0,
                maxX: 6,
                minY: 0,
                gridData: const FlGridData(show: false),
                titlesData: FlTitlesData(
                  leftTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      interval: 1,
                      reservedSize: 32,
                      getTitlesWidget: (value, meta) {
                        final dayIndex = value.toInt();
                        if (dayIndex < 0 || dayIndex > 6) {
                          return const SizedBox.shrink();
                        }
                        const days = [
                          'Mon',
                          'Tue',
                          'Wed',
                          'Thu',
                          'Fri',
                          'Sat',
                          'Sun'
                        ];
                        final isActive = dayIndex == _mostActiveDayIndex;
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Container(
                            padding: isActive
                                ? const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4)
                                : null,
                            decoration: isActive
                                ? BoxDecoration(
                                    color: AppColors.accentPink,
                                    borderRadius: BorderRadius.circular(12),
                                  )
                                : null,
                            child: Text(
                              days[dayIndex],
                              style: TextStyle(
                                color: isActive
                                    ? Colors.white
                                    : Colors.white.withValues(alpha: 0.5),
                                fontSize: 10,
                                fontWeight: isActive
                                    ? FontWeight.w600
                                    : FontWeight.w400,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: _activitySpots,
                    isCurved: true,
                    color: AppColors.accentIndigo,
                    barWidth: 3,
                    dotData: FlDotData(
                      show: true,
                      getDotPainter: (spot, percent, barData, index) {
                        final isActiveDay = index == _mostActiveDayIndex;
                        return FlDotCirclePainter(
                          radius: isActiveDay ? 6 : 3,
                          color: isActiveDay
                              ? AppColors.accentPink
                              : AppColors.accentIndigo,
                          strokeWidth: 0,
                        );
                      },
                    ),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          AppColors.accentIndigo.withValues(alpha: 0.3),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _mutualsRow() {
    final shown = _mutuals.take(3).toList();
    final rest = _mutuals.length - shown.length;
    final names = shown
        .map((m) => (m['name'] ?? m['username'] ?? '').toString())
        .where((s) => s.isNotEmpty)
        .toList();
    final label = names.isEmpty
        ? 'Followed by ${_mutuals.length} mutual'
        : (rest > 0
            ? 'Followed by ${names.join(', ')} +$rest more'
            : 'Followed by ${names.join(', ')}');
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.surfaceL1,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 24.0 + (shown.length - 1) * 14,
              height: 24,
              child: Stack(
                children: [
                  for (var i = 0; i < shown.length; i++)
                    Positioned(
                      left: i * 14.0,
                      child: _mutualAvatar(shown[i]),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.75),
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _mutualAvatar(Map<String, dynamic> u) {
    final photo =
        (u['photoURL'] ?? u['profilePicture'] ?? u['photo_url'])?.toString();
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: Colors.black, width: 2),
      ),
      child: ClipOval(
        child: photo != null && photo.isNotEmpty
            ? CachedNetworkImage(imageUrl: photo, fit: BoxFit.cover)
            : Container(
                color: AppColors.surfaceL3,
                child: const Icon(LucideIcons.user,
                    color: Colors.white54, size: 12),
              ),
      ),
    );
  }

  Widget _reelsPlaceholder() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surfaceL1,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.25)),
        ),
        child: Row(
          children: [
            Icon(LucideIcons.video, color: AppColors.primary, size: 18),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                '$_displayName is a creator — view their reels',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600),
              ),
            ),
            const Icon(LucideIcons.chevronRight,
                color: Colors.white54, size: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildSportStat(String sport, int count, {bool isOther = false}) {
    return Column(
      children: [
        Text(
          sport,
          style: TextStyle(
            color: isOther
                ? Colors.white.withValues(alpha: 0.5)
                : AppColors.primary,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          count.toString(),
          style: TextStyle(
            color: isOther ? Colors.white.withValues(alpha: 0.5) : Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  String _capitalize(String text) {
    if (text.isEmpty) return text;
    return text[0].toUpperCase() + text.substring(1).toLowerCase();
  }
}
