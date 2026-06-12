// Public re-exports + registration entry-point for scoring theme packs.
// Call [registerDefaultThemePacks] once at app boot (from `main()`) before
// the live overlay or theme-preview screens render — without this the
// `kThemePacks` registry stays empty and `resolveThemePack` will throw.

import 'neon_classic_pack.dart';
import 'scoring_theme_pack.dart';
import 'sports_network_pack.dart';

export 'neon_classic_pack.dart';
export 'scoring_theme_pack.dart';
export 'sports_network_pack.dart';

bool _registered = false;

void registerDefaultThemePacks() {
  if (_registered) return;
  kThemePacks['neon_classic'] = () => const NeonClassicPack();
  kThemePacks['sports_network'] = () => const SportsNetworkPack();
  _registered = true;
}
