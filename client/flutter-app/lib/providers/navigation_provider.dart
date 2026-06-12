import 'package:flutter_riverpod/flutter_riverpod.dart';

// Bottom navigation index
class NavigationNotifier extends StateNotifier<int> {
  NavigationNotifier() : super(0);

  void setIndex(int index) {
    state = index;
  }
}

final navigationProvider =
    StateNotifierProvider<NavigationNotifier, int>((ref) {
  return NavigationNotifier();
});

// Arena tab: true = Play, false = Book
class ArenaTabNotifier extends StateNotifier<bool> {
  ArenaTabNotifier() : super(true);
  void setPlayTab() => state = true;
  void setBookTab() => state = false;
}

final arenaTabProvider = StateNotifierProvider<ArenaTabNotifier, bool>((ref) {
  return ArenaTabNotifier();
});

// Side profile drawer open/closed. Lifted out of NewHomeDashboard so the
// drawer can be opened from any tab's HomeHeader and rendered above the
// whole MainContainer (instead of only over the Home tab's body).
final profileDrawerOpenProvider = StateProvider<bool>((ref) => false);
