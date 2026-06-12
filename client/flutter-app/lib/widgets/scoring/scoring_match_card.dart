import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'scoring_theme.dart';

/// A list-row card representing a scoring match (LIVE / PAUSED / SCHEDULED /
/// COMPLETED). Used on match-listing screens. Port of `ScoringMatchCard.jsx`.
class ScoringMatchCard extends StatelessWidget {
  final String matchName;
  final String sportType;
  final String status; // LIVE | PAUSED | SCHEDULED | SETUP | COMPLETED
  final String teamAName;
  final String teamBName;
  final String? teamALogo;
  final String? teamBLogo;
  final String? youtubeStreamUrl;
  final VoidCallback onLaunchScoring;
  final VoidCallback onViewDetails;
  final VoidCallback? onWatchLive;

  const ScoringMatchCard({
    super.key,
    required this.matchName,
    this.sportType = 'Cricket',
    required this.status,
    required this.teamAName,
    required this.teamBName,
    this.teamALogo,
    this.teamBLogo,
    this.youtubeStreamUrl,
    required this.onLaunchScoring,
    required this.onViewDetails,
    this.onWatchLive,
  });

  bool get _isLive => status == 'LIVE';
  bool get _isPaused => status == 'PAUSED';
  bool get _isUpcoming => status == 'SCHEDULED' || status == 'SETUP';

  @override
  Widget build(BuildContext context) {
    final Gradient? wrapper = _isLive
        ? const LinearGradient(
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
            colors: [
              Color(0xFFEF4444),
              ScoringTheme.accentSky,
              Color(0xFFBFF367),
            ],
          )
        : _isPaused
            ? const LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                colors: [
                  Color(0xFFF97316),
                  Color(0xFFEAB308),
                  Color(0xFFFB923C),
                ],
              )
            : null;

    return Container(
      padding: const EdgeInsets.all(1),
      decoration: BoxDecoration(
        gradient: wrapper,
        color: wrapper == null ? Colors.white.withValues(alpha: 0.1) : null,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFF0F0F0F),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(sportType.toUpperCase(),
                          style: const TextStyle(
                              color: ScoringTheme.accentSky,
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 2.4)),
                      const SizedBox(height: 2),
                      Text(matchName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
                _statusChip(),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.02),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
              ),
              child: Row(
                children: [
                  Expanded(child: _teamCol(teamAName, teamALogo)),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12),
                    child: Text('VS',
                        style: TextStyle(
                            color: Color(0xFFBFF367),
                            fontSize: 14,
                            fontStyle: FontStyle.italic,
                            fontWeight: FontWeight.w900)),
                  ),
                  Expanded(child: _teamCol(teamBName, teamBLogo)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _primaryAction()),
                const SizedBox(width: 8),
                Expanded(child: _secondaryAction()),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _teamCol(String name, String? logoUrl) {
    final initials = name.length >= 2
        ? name.substring(0, 2).toUpperCase()
        : name.toUpperCase();
    return Column(
      children: [
        Container(
          width: 48,
          height: 48,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: logoUrl != null && logoUrl.isNotEmpty
              ? ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: Image.network(logoUrl,
                      fit: BoxFit.cover,
                      width: 44,
                      height: 44,
                      errorBuilder: (_, __, ___) => _initials(initials)))
              : _initials(initials),
        ),
        const SizedBox(height: 8),
        Text(name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w700)),
      ],
    );
  }

  Widget _initials(String s) => Text(s,
      style: TextStyle(
          color: Colors.white.withValues(alpha: 0.4),
          fontSize: 18,
          fontWeight: FontWeight.w900));

  Widget _statusChip() {
    Color bg;
    Color fg;
    Color border;
    Widget child;
    if (_isLive) {
      bg = const Color(0xFFEF4444).withValues(alpha: 0.1);
      fg = const Color(0xFFEF4444);
      border = const Color(0xFFEF4444).withValues(alpha: 0.3);
      child = const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(LucideIcons.activity, size: 10, color: Color(0xFFEF4444)),
          SizedBox(width: 4),
          Text('LIVE',
              style: TextStyle(
                  color: Color(0xFFEF4444),
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2.4)),
        ],
      );
    } else if (_isPaused) {
      bg = const Color(0xFFF97316).withValues(alpha: 0.1);
      fg = const Color(0xFFFB923C);
      border = const Color(0xFFF97316).withValues(alpha: 0.3);
      child = Row(
        mainAxisSize: MainAxisSize.min,
        children: const [
          Icon(LucideIcons.clock, size: 10, color: Color(0xFFFB923C)),
          SizedBox(width: 4),
          Text('PAUSED',
              style: TextStyle(
                  color: Color(0xFFFB923C),
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2.4)),
        ],
      );
    } else if (status == 'COMPLETED') {
      bg = Colors.white.withValues(alpha: 0.05);
      fg = Colors.white.withValues(alpha: 0.4);
      border = Colors.white.withValues(alpha: 0.1);
      child = Text(status,
          style: TextStyle(
              color: fg,
              fontSize: 9,
              fontWeight: FontWeight.w900,
              letterSpacing: 2.4));
    } else {
      bg = ScoringTheme.accentSky.withValues(alpha: 0.1);
      fg = ScoringTheme.accentSky;
      border = ScoringTheme.accentSky.withValues(alpha: 0.3);
      child = Text(status,
          style: const TextStyle(
              color: ScoringTheme.accentSky,
              fontSize: 9,
              fontWeight: FontWeight.w900,
              letterSpacing: 2.4));
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: border),
      ),
      child: child,
    );
  }

  Widget _primaryAction() {
    final hasStream = youtubeStreamUrl != null && youtubeStreamUrl!.isNotEmpty;
    if ((_isLive || _isPaused) && hasStream && onWatchLive != null) {
      return _actionButton(
          icon: LucideIcons.tv,
          label: 'WATCH LIVE',
          onTap: onWatchLive!,
          color: const Color(0xFFEF4444),
          bg: const Color(0xFFEF4444).withValues(alpha: 0.1),
          border: const Color(0xFFEF4444).withValues(alpha: 0.3));
    }
    return _actionButton(
        icon: LucideIcons.eye,
        label: 'VIEW DETAILS',
        onTap: onViewDetails,
        color: Colors.white,
        bg: Colors.white.withValues(alpha: 0.05),
        border: Colors.white.withValues(alpha: 0.1));
  }

  Widget _secondaryAction() {
    final ctaActive = _isLive || _isPaused || _isUpcoming;
    if (ctaActive) {
      return GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          onLaunchScoring();
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [ScoringTheme.accentSky, Color(0xFFBFF367)],
            ),
            borderRadius: BorderRadius.circular(8),
            boxShadow: [
              BoxShadow(
                  color: ScoringTheme.accentSky.withValues(alpha: 0.2),
                  blurRadius: 16),
            ],
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(LucideIcons.play, size: 12, color: Colors.black),
              SizedBox(width: 6),
              Text('LAUNCH APP',
                  style: TextStyle(
                      color: Colors.black,
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2.4)),
            ],
          ),
        ),
      );
    }
    return _actionButton(
        icon: LucideIcons.trophy,
        label: 'SCORECARD',
        onTap: onLaunchScoring,
        color: Colors.white,
        bg: Colors.white.withValues(alpha: 0.05),
        border: Colors.white.withValues(alpha: 0.1));
  }

  Widget _actionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    required Color color,
    required Color bg,
    required Color border,
  }) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 6),
            Text(label,
                style: TextStyle(
                    color: color,
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2.4)),
          ],
        ),
      ),
    );
  }
}
