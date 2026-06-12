import 'package:flutter/material.dart';
import '../../../models/scoring_models.dart';
import '../event_animation.dart';
import '../live_cards.dart';

/// A single theme pack — the set of broadcast graphics that render on the
/// live overlay + theme preview screens. Each pack provides its own ticker
/// (bottom-of-screen score strip), event banner (FOUR / SIX / WICKET pop-up),
/// and live cards (end-of-over + milestone slide-ins).
///
/// Ported from `kridaz/client/user/src/features/scoring/themes/*` — the web
/// has NeonClassic + SportsNetwork; the Flutter port mirrors both shapes.
///
/// To add a new pack:
///   1. Subclass [ScoringThemePack]
///   2. Implement [palette], [buildEventAnimation], [buildLiveCard], [buildTicker]
///   3. Register it in [kThemePacks]
abstract class ScoringThemePack {
  const ScoringThemePack();

  /// Stable id used in route query params (`?theme=neon_classic`) and stored
  /// in the user's preferences.
  String get id;

  /// Human-readable label shown in the theme store UI.
  String get name;

  /// Colors + font hint the pack uses. Surfacing this on the interface lets
  /// callers tint their own chrome (e.g. the top bar's LIVE pill).
  ScoringPalette get palette;

  /// Big-bang event banner — fires for boundaries, wickets, and milestones.
  /// `kind == null` should render nothing.
  Widget buildEventAnimation({
    required EventKind? kind,
    VoidCallback? onDone,
  });

  /// Slide-in card shown after each over (end-of-over summary) or when a
  /// batter hits 50 / 100 (milestone). `card == null` should render nothing.
  Widget buildLiveCard({
    required LiveCardData? card,
    VoidCallback? onDismissed,
  });

  /// Bottom-of-screen score strip. The full snapshot is passed in so each
  /// pack can decide which fields to surface and how.
  Widget buildTicker({required LiveScoreSnapshot snap});
}

/// Colours + font fall-back shared across a pack's widgets. Hand-rolled
/// instead of using `ThemeData` because we want explicit control of the
/// overlay typography without affecting any host app theming.
class ScoringPalette {
  final Color primary;
  final Color secondary;
  final Color bg;
  final String? fontFamily;

  const ScoringPalette({
    required this.primary,
    required this.secondary,
    required this.bg,
    this.fontFamily,
  });
}

/// Registry of all packs the app knows about. Keyed by [ScoringThemePack.id]
/// so a string from the URL / preferences can be resolved at runtime.
///
/// Each entry is a factory (zero-arg builder) instead of a singleton so the
/// pack can hold per-instance state in the future without changing this map.
Map<String, ScoringThemePack Function()> kThemePacks = {};

/// Look up a pack by id with a fallback. Returns the NeonClassic pack when
/// the id is unknown (used as the default at app boot).
ScoringThemePack resolveThemePack(String? id) {
  final fn = kThemePacks[id] ?? kThemePacks['neon_classic'];
  if (fn == null) {
    throw StateError(
      'No theme packs registered. Make sure registerDefaultThemePacks() '
      'was called from main() before the live overlay renders.',
    );
  }
  return fn();
}
