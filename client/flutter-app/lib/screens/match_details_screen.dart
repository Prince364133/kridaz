import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../widgets/scoring/scoring_theme.dart';

/// Match summary page — Flutter parity port of the web's `MatchDetails.jsx`.
/// Shows the match hero (teams + format + status + date/time/venue), full
/// team rosters, and an officials/host/venue sidebar.
///
/// The screen accepts a pre-fetched `game` map (the shape returned by
/// `/api/hosted-game/:matchId`). Callers are expected to load that payload
/// and pass it in via the router `extra`.
class MatchDetailsScreen extends StatelessWidget {
  final Map<String, dynamic>? game;
  final String? matchId;

  /// Optional: when the umpire is viewing this match, surface a "Launch
  /// scoring console" CTA in the hero block.
  final bool canLaunchScoring;

  /// Called when the user taps the analytics / scoring launch buttons.
  final VoidCallback? onLaunchScoring;
  final VoidCallback? onViewAnalytics;

  /// Failover hand-off: shown to *any* signed-in user (not just the host)
  /// so a backup scorer on a different device — possibly a different
  /// account — can enter the scoring password and resume. The route
  /// itself is the same as [onLaunchScoring]; the password gate is what
  /// actually authorizes the action.
  final VoidCallback? onTakeOverScoring;

  const MatchDetailsScreen({
    super.key,
    this.game,
    this.matchId,
    this.canLaunchScoring = false,
    this.onLaunchScoring,
    this.onViewAnalytics,
    this.onTakeOverScoring,
  });

  String get _shortId => (game?['shortId'] ?? 'KRZ-XXXX').toString();
  String get _status => (game?['status'] ?? 'SCHEDULED').toString();
  bool get _isCompleted => _status == 'COMPLETED';
  bool get _isCancelled => _status == 'CANCELLED';

  Map<String, dynamic>? get _teams =>
      game?['teams'] is Map ? Map<String, dynamic>.from(game!['teams']) : null;

  Map<String, dynamic>? get _teamA => _teams?['teamA'] is Map
      ? Map<String, dynamic>.from(_teams!['teamA'])
      : null;
  Map<String, dynamic>? get _teamB => _teams?['teamB'] is Map
      ? Map<String, dynamic>.from(_teams!['teamB'])
      : null;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF050505),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _header(context),
            Expanded(
              child: game == null
                  ? const Center(
                      child:
                          CircularProgressIndicator(color: ScoringTheme.theme),
                    )
                  : SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _hero(context),
                          const SizedBox(height: 24),
                          _rostersHeading(),
                          const SizedBox(height: 16),
                          _rosterGrid(),
                          const SizedBox(height: 24),
                          _umpireCard(context),
                          const SizedBox(height: 16),
                          if (game?['host'] is Map) ...[
                            _hostCard(),
                            const SizedBox(height: 16),
                          ],
                          _venueCard(),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _header(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.6),
        border: Border(
          bottom: BorderSide(color: Colors.white.withValues(alpha: 0.05)),
        ),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              if (context.canPop()) context.pop();
            },
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(LucideIcons.arrowLeft,
                  color: Colors.white, size: 18),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('MATCH DETAILS',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.3)),
                const SizedBox(height: 2),
                Text('ID: $_shortId',
                    style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 2)),
              ],
            ),
          ),
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              Clipboard.setData(
                  ClipboardData(text: 'kridaz://match/${matchId ?? _shortId}'));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Link copied'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(LucideIcons.share2,
                  color: Colors.white54, size: 16),
            ),
          ),
        ],
      ),
    );
  }

  Widget _hero(BuildContext context) {
    final gameType = (game?['gameType'] ?? 'T20').toString();
    final teamAName = (_teamA?['name'] ?? 'TBD').toString();
    final teamBName = (_teamB?['name'] ?? 'TBD').toString();
    final dateStr = game?['date']?.toString();
    final time = (game?['time'] ?? '').toString();
    final venueName =
        (game?['ground']?['name'] ?? game?['customVenue'] ?? 'Self-Arranged')
            .toString();

    Color statusColor;
    if (_isCompleted) {
      statusColor = const Color(0xFF3B82F6);
    } else if (_isCancelled) {
      statusColor = const Color(0xFFEF4444);
    } else {
      statusColor = const Color(0xFFF97316);
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.white.withValues(alpha: 0.03),
            Colors.transparent,
          ],
        ),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Stack(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  _chip(text: '$gameType CRICKET', filled: ScoringTheme.theme),
                  const SizedBox(width: 8),
                  _chip(text: _status, filled: statusColor),
                ],
              ),
              const SizedBox(height: 16),
              RichText(
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: teamAName.toUpperCase(),
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.8),
                    ),
                    const TextSpan(
                      text: '  vs  ',
                      style: TextStyle(
                          color: ScoringTheme.theme,
                          fontSize: 26,
                          fontWeight: FontWeight.w900),
                    ),
                    TextSpan(
                      text: teamBName.toUpperCase(),
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.8),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 16,
                runSpacing: 8,
                children: [
                  if (dateStr != null && dateStr.isNotEmpty)
                    _metaLine(LucideIcons.calendar, _formatDate(dateStr)),
                  if (time.isNotEmpty) _metaLine(LucideIcons.clock, time),
                  _metaLine(LucideIcons.mapPin, venueName),
                ],
              ),
              const SizedBox(height: 20),
              _heroActions(context),
            ],
          ),
        ],
      ),
    );
  }

  Widget _heroActions(BuildContext context) {
    if (_isCompleted) {
      return _bigButton(
        label: 'VIEW FULL ANALYTICS',
        icon: LucideIcons.activity,
        onTap: onViewAnalytics,
      );
    }
    return Column(
      children: [
        if (canLaunchScoring)
          _bigButton(
            label: 'LAUNCH SCORING CONSOLE',
            icon: LucideIcons.zap,
            onTap: onLaunchScoring,
          ),
        if (canLaunchScoring) const SizedBox(height: 8),
        if (canLaunchScoring && matchId != null)
          _bigButton(
            label: 'JOIN REQUESTS',
            icon: LucideIcons.userPlus,
            onTap: () => context.push('/pending-requests/$matchId'),
          ),
        if (canLaunchScoring && matchId != null) const SizedBox(height: 8),

        // Failover entry point — visible to non-hosts too. The route is
        // password-gated on the next screen, so showing the button to
        // everyone is safe; only someone with the scoring password (set
        // by the host) can actually take over.
        if (!canLaunchScoring && onTakeOverScoring != null) ...[
          _secondaryButton(
            label: "I'M THE SCORER — TAKE OVER",
            icon: LucideIcons.keyRound,
            onTap: onTakeOverScoring,
          ),
          const SizedBox(height: 8),
        ],

        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 16),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              Icon(LucideIcons.clock, color: Colors.white, size: 18),
              SizedBox(width: 8),
              Text('MATCH IN PROGRESS',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2.4)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _secondaryButton(
      {required String label, required IconData icon, VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap == null
          ? null
          : () {
              HapticFeedback.mediumImpact();
              onTap();
            },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 16),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: ScoringTheme.theme.withValues(alpha: 0.6)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: ScoringTheme.theme, size: 18),
            const SizedBox(width: 10),
            Text(label,
                style: TextStyle(
                    color: ScoringTheme.theme,
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2.4)),
          ],
        ),
      ),
    );
  }

  Widget _bigButton(
      {required String label, required IconData icon, VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap == null
          ? null
          : () {
              HapticFeedback.mediumImpact();
              onTap();
            },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 18),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: ScoringTheme.theme,
          borderRadius: BorderRadius.circular(8),
          boxShadow: [
            BoxShadow(
                color: ScoringTheme.theme.withValues(alpha: 0.3),
                blurRadius: 40),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(label,
                style: const TextStyle(
                    color: Colors.black,
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2.4)),
            const SizedBox(width: 12),
            Icon(icon, color: Colors.black, size: 18),
          ],
        ),
      ),
    );
  }

  Widget _metaLine(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: ScoringTheme.theme, size: 14),
        const SizedBox(width: 6),
        Text(text.toUpperCase(),
            style: const TextStyle(
                color: Colors.white54,
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 1)),
      ],
    );
  }

  Widget _chip({required String text, required Color filled}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: filled,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(text.toUpperCase(),
          style: TextStyle(
              color: filled == ScoringTheme.theme ? Colors.black : Colors.white,
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 2.4)),
    );
  }

  Widget _rostersHeading() {
    return Row(
      children: const [
        Icon(LucideIcons.users, color: ScoringTheme.theme, size: 18),
        SizedBox(width: 8),
        Text('TEAM ROSTERS',
            style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.3)),
      ],
    );
  }

  Widget _rosterGrid() {
    return Column(
      children: [
        _rosterCard(team: _teamA, label: 'TEAM A'),
        const SizedBox(height: 12),
        _rosterCard(team: _teamB, label: 'TEAM B'),
      ],
    );
  }

  Widget _rosterCard({Map<String, dynamic>? team, required String label}) {
    final name = (team?['name'] ?? 'TBD').toString();
    final slots = (team?['slots'] is List)
        ? (team!['slots'] as List).whereType<Map>().toList()
        : const [];
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.02),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(name.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.3)),
              ),
              Text(label,
                  style: const TextStyle(
                      color: Colors.white54,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2.4)),
            ],
          ),
          const SizedBox(height: 12),
          Container(height: 1, color: Colors.white.withValues(alpha: 0.05)),
          const SizedBox(height: 12),
          if (slots.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Text('NO PLAYERS YET',
                    style: TextStyle(
                        color: Colors.white38,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2)),
              ),
            )
          else
            ...slots.map(_rosterRow),
        ],
      ),
    );
  }

  Widget _rosterRow(dynamic slotRaw) {
    final slot = slotRaw is Map ? slotRaw : const <String, dynamic>{};
    final user =
        slot['user'] is Map ? Map<String, dynamic>.from(slot['user']) : null;
    final name = (user?['name'] ?? 'Empty Slot').toString();
    final role = (slot['role'] ?? 'PLAYER').toString();
    final occupied = (slot['status'] ?? '') == 'OCCUPIED';
    final pic = user?['profilePicture']?.toString();
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.02),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: const Color(0xFF222222),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
            ),
            child: pic != null && pic.isNotEmpty
                ? ClipOval(
                    child: Image.network(pic,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const Icon(
                            LucideIcons.user,
                            color: Color(0xFF666666),
                            size: 18)),
                  )
                : const Icon(LucideIcons.user,
                    color: Color(0xFF666666), size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.2)),
                const SizedBox(height: 2),
                Text(role.toUpperCase(),
                    style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 8,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 2.4)),
              ],
            ),
          ),
          if (occupied)
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: ScoringTheme.theme,
                shape: BoxShape.circle,
              ),
            ),
        ],
      ),
    );
  }

  Widget _umpireCard(BuildContext context) {
    final umpire = game?['umpire'] is Map
        ? Map<String, dynamic>.from(game!['umpire'])
        : null;
    final invites = (game?['invites'] is List)
        ? (game!['invites'] as List)
            .whereType<Map>()
            .where((m) => m['isProfessional'] == true && m['role'] == 'UMPIRE')
            .toList()
        : const [];

    return _sidebarCard(
      icon: LucideIcons.shield,
      title: 'OFFICIAL UMPIRE',
      child: umpire != null
          ? _officialTile(
              name: (umpire['name'] ?? 'Unknown').toString(),
              caption: 'VERIFIED OFFICIAL',
              pic: umpire['profilePicture']?.toString(),
              accent: ScoringTheme.theme,
            )
          : invites.isNotEmpty
              ? Column(
                  children: invites
                      .map((m) => _officialTile(
                            name: (m['name'] ?? 'Unnamed').toString(),
                            caption: 'CUSTOM UMPIRE',
                            pic: null,
                            accent: Colors.white,
                          ))
                      .toList(),
                )
              : _emptyTile(
                  icon: LucideIcons.shield,
                  text: 'NO OFFICIAL HIRED YET',
                ),
    );
  }

  Widget _hostCard() {
    final host = Map<String, dynamic>.from(game!['host']);
    return _sidebarCard(
      icon: LucideIcons.user,
      title: 'MATCH HOST',
      child: _officialTile(
        name: (host['name'] ?? 'Host').toString(),
        caption: 'GAME HOST',
        pic: host['profilePicture']?.toString(),
        accent: ScoringTheme.theme,
      ),
    );
  }

  Widget _venueCard() {
    final ground = game?['ground'] is Map
        ? Map<String, dynamic>.from(game!['ground'])
        : null;
    final customVenue = game?['customVenue']?.toString();
    return _sidebarCard(
      icon: LucideIcons.mapPin,
      title: 'VENUE DETAILS',
      child: ground != null
          ? _groundTile(ground)
          : customVenue != null && customVenue.isNotEmpty
              ? _customVenueTile(customVenue)
              : _emptyTile(
                  icon: LucideIcons.mapPin,
                  text: 'SELF-ARRANGED VENUE',
                ),
    );
  }

  Widget _groundTile(Map<String, dynamic> ground) {
    final images = (ground['images'] is List)
        ? (ground['images'] as List).whereType<String>().toList()
        : const <String>[];
    final imageUrl = images.isNotEmpty ? images.first : null;
    final name = (ground['name'] ?? 'Venue').toString();
    final location = (ground['location'] ?? '').toString();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          height: 140,
          width: double.infinity,
          decoration: BoxDecoration(
            color: const Color(0xFF222222),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
          ),
          clipBehavior: Clip.antiAlias,
          child: imageUrl != null
              ? Image.network(imageUrl,
                  fit: BoxFit.cover,
                  color: Colors.black.withValues(alpha: 0.4),
                  colorBlendMode: BlendMode.darken,
                  errorBuilder: (_, __, ___) => const Center(
                      child: Icon(LucideIcons.mapPin,
                          color: Colors.white24, size: 32)))
              : const Center(
                  child: Icon(LucideIcons.mapPin,
                      color: Colors.white24, size: 32)),
        ),
        const SizedBox(height: 12),
        Text(name.toUpperCase(),
            style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.3)),
        if (location.isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(location.toUpperCase(),
              style: const TextStyle(
                  color: Colors.white54,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.6)),
        ],
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 12),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Text('VIEW ON MAPS',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2.4)),
        ),
      ],
    );
  }

  Widget _customVenueTile(String venue) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          height: 140,
          width: double.infinity,
          decoration: BoxDecoration(
            color: const Color(0xFF222222),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
          ),
          child: const Center(
              child: Icon(LucideIcons.mapPin, color: Colors.white24, size: 32)),
        ),
        const SizedBox(height: 12),
        Text(venue.toUpperCase(),
            style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w900)),
        const SizedBox(height: 4),
        const Text('CUSTOM VENUE',
            style: TextStyle(
                color: Colors.white54,
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.6)),
      ],
    );
  }

  Widget _emptyTile({required IconData icon, required String text}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 32),
      width: double.infinity,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
            color: Colors.white.withValues(alpha: 0.1),
            style: BorderStyle.solid),
      ),
      child: Column(
        children: [
          Icon(icon, color: Colors.white24, size: 28),
          const SizedBox(height: 8),
          Text(text,
              style: const TextStyle(
                  color: Colors.white54,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2.4)),
        ],
      ),
    );
  }

  Widget _officialTile({
    required String name,
    required String caption,
    required String? pic,
    required Color accent,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: accent.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: accent.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border:
                  Border.all(color: accent.withValues(alpha: 0.3), width: 2),
            ),
            child: pic != null && pic.isNotEmpty
                ? ClipOval(
                    child: Image.network(pic,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) =>
                            Icon(LucideIcons.user, color: accent, size: 22)),
                  )
                : Icon(LucideIcons.user, color: accent, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.3)),
                const SizedBox(height: 2),
                Text(caption,
                    style: TextStyle(
                        color: accent,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 2.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _sidebarCard(
      {required IconData icon, required String title, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.02),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: ScoringTheme.theme, size: 16),
              const SizedBox(width: 8),
              Text(title,
                  style: const TextStyle(
                      color: Colors.white54,
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2.4)),
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }

  String _formatDate(String iso) {
    final dt = DateTime.tryParse(iso);
    if (dt == null) return iso;
    const months = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC'
    ];
    return '${dt.day.toString().padLeft(2, '0')} ${months[dt.month - 1]} ${dt.year}';
  }
}
