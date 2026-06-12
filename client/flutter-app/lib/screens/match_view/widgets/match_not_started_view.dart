import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// Neutral empty state shown by each scoring tab when the match exists but
/// scoring hasn't started yet (backend returns 404 / SCORING_NOT_FOUND /
/// SCORING_NOT_SETUP). Without this the tabs would surface a raw "Network
/// error (404)" toast, which reads like a real failure.
class MatchNotStartedView extends StatelessWidget {
  const MatchNotStartedView({
    super.key,
    required this.label,
    this.onRetry,
  });

  /// Tab-specific copy, e.g. "Scorecard appears once the match starts."
  final String label;

  /// Optional pull-down retry. When provided, a small "Try again" affordance
  /// sits below the label so the user isn't stuck if the state changes
  /// before the next natural poll.
  final Future<void> Function()? onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.04),
                shape: BoxShape.circle,
              ),
              child: const Icon(LucideIcons.clock,
                  color: Colors.white38, size: 28),
            ),
            const SizedBox(height: 16),
            const Text(
              'Match hasn\'t started',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w600,
                fontFamily: 'Poppins',
              ),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.55),
                fontSize: 13,
                height: 1.4,
                fontFamily: 'Poppins',
              ),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 14),
              TextButton.icon(
                onPressed: onRetry,
                icon: const Icon(LucideIcons.refreshCw,
                    size: 14, color: Color(0xFF7CFE6A)),
                label: const Text(
                  'Try again',
                  style: TextStyle(
                    color: Color(0xFF7CFE6A),
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Poppins',
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Returns true when the backend response indicates the match exists but
/// scoring hasn't been set up yet. Centralised here so every tab agrees on
/// what "not started" means and the polling-pause heuristic stays in sync.
///
/// Checks three signals in order:
///   1. stable backend `code` (preferred)
///   2. HTTP `statusCode == 404` — these four endpoints only exist once a
///      scoring session has been created, so 404 means "not started yet"
///      by contract. Without this we'd surface "Network error (404)" on
///      a perfectly normal "match isn't being scored" state.
///   3. message substrings as a final fallback for legacy responses
bool isMatchNotStartedCode(String? code, String? message, {int? statusCode}) {
  if (code != null) {
    const notStarted = {
      'SCORING_NOT_FOUND',
      'SCORING_NOT_SETUP',
      'MATCH_NOT_STARTED',
      'NOT_FOUND',
      'SCORING_SESSION_NOT_FOUND',
    };
    if (notStarted.contains(code)) return true;
  }
  if (statusCode == 404) return true;
  final m = message?.toLowerCase() ?? '';
  if (m.contains('not started') ||
      m.contains('not setup') ||
      m.contains('not set up') ||
      m.contains('no scoring') ||
      m.contains('not found')) {
    return true;
  }
  return false;
}
