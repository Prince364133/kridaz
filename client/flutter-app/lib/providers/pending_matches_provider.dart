import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/pending_match_model.dart';

/// Persisted list of matches the user has created via the 5-step Start
/// Scoring wizard but hasn't actually started yet. The Games screen renders
/// these above "Recent Scores"; tapping one opens the review + password screen
/// which is what finally calls `/scoring/auth/:gameId` and navigates to the
/// live scorer.
///
/// SharedPreferences is the persistence backend — this state has to survive a
/// process kill (user creates a match, closes the app, comes back to start
/// it). It does NOT persist across reinstall or logout; that's fine, because
/// the canonical record lives on the backend at /scoring/status/:matchId.
class PendingMatchesNotifier extends StateNotifier<List<PendingMatch>> {
  PendingMatchesNotifier() : super(const []) {
    _hydrate();
  }

  static const _prefsKey = 'pending_scoring_matches_v1';

  Future<void> _hydrate() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_prefsKey);
      if (raw == null || raw.isEmpty) return;
      final list = jsonDecode(raw);
      if (list is! List) return;
      state = list
          .whereType<Map>()
          .map((m) => PendingMatch.fromJson(Map<String, dynamic>.from(m)))
          .toList();
    } catch (_) {
      // Corrupted blob — drop it and start fresh.
      state = const [];
    }
  }

  Future<void> _persist() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        _prefsKey,
        jsonEncode(state.map((m) => m.toJson()).toList()),
      );
    } catch (_) {
      // Best-effort persistence — the in-memory copy is still correct.
    }
  }

  Future<void> add(PendingMatch match) async {
    // Newest first; de-dupe by matchId so a quick retry doesn't double-list.
    final existing = state.where((m) => m.matchId != match.matchId);
    state = [match, ...existing];
    await _persist();
  }

  Future<void> remove(String matchId) async {
    state = state.where((m) => m.matchId != matchId).toList();
    await _persist();
  }

  Future<void> clear() async {
    state = const [];
    await _persist();
  }
}

final pendingMatchesProvider =
    StateNotifierProvider<PendingMatchesNotifier, List<PendingMatch>>(
  (_) => PendingMatchesNotifier(),
);
