import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/user_service.dart';
import '../services/auth_manager.dart';
import '../services/wallet_service.dart';
import 'auth_provider.dart';

// User service provider
final userServiceProvider = Provider((ref) => UserService());

// Cached user profile state
class UserProfileNotifier
    extends StateNotifier<AsyncValue<Map<String, dynamic>?>> {
  final Ref ref;
  bool _hasFetched = false;
  bool _isFetching = false;

  UserProfileNotifier(this.ref) : super(const AsyncValue.loading()) {
    _init();
  }

  void _init() {
    ref.listen(currentUserProvider, (previous, next) {
      if (next == true && !_hasFetched && !_isFetching) {
        fetchProfile();
      } else if (next == false) {
        state = const AsyncValue.data(null);
        _hasFetched = false;
        _isFetching = false;
      }
    });

    // Initial fetch if user is already logged in
    final user = ref.read(currentUserProvider);
    if (user == true && !_hasFetched && !_isFetching) {
      fetchProfile();
    }
  }

  Future<void> fetchProfile({bool forceRefresh = false}) async {
    // Prevent concurrent fetches
    if (_isFetching) return;

    if (_hasFetched && !forceRefresh && state.hasValue && state.value != null) {
      return; // Already have data, don't refetch
    }

    _isFetching = true;

    try {
      final userService = ref.read(userServiceProvider);
      final profile = await userService.getUserProfile();
      state = AsyncValue.data(profile);
      _hasFetched = true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    } finally {
      _isFetching = false;
    }
  }

  void updateProfile(Map<String, dynamic> updates) {
    if (state.hasValue && state.value != null) {
      final current = Map<String, dynamic>.from(state.value!);
      current.addAll(updates);
      state = AsyncValue.data(current);
    }
  }

  void refresh() {
    _hasFetched = false;
    fetchProfile(forceRefresh: true);
  }
}

final userProfileNotifierProvider = StateNotifierProvider<UserProfileNotifier,
    AsyncValue<Map<String, dynamic>?>>((ref) {
  return UserProfileNotifier(ref);
});

// Convenience provider for accessing profile data (backwards compatible)
final userProfileProvider = Provider<AsyncValue<Map<String, dynamic>?>>((ref) {
  return ref.watch(userProfileNotifierProvider);
});

String _nameFromAuth() {
  final user = AuthManager().currentUser;
  if (user == null) return '';
  // Backend may store as 'name', 'fullName', or split 'firstName'
  for (final key in ['firstName', 'name', 'fullName']) {
    final raw = user[key] as String? ?? '';
    if (raw.isNotEmpty) return raw.split(' ').first;
  }
  return '';
}

String _locationFromAuth() {
  final user = AuthManager().currentUser;
  for (final key in ['city', 'location']) {
    final v = user?[key] as String? ?? '';
    if (v.isNotEmpty) return v;
  }
  return '';
}

// User display name
final userDisplayNameProvider = Provider<String>((ref) {
  final profileAsync = ref.watch(userProfileProvider);
  return profileAsync.when(
    data: (profile) {
      // Try every field the backend might use
      for (final key in ['firstName', 'name', 'fullName']) {
        final raw = profile?[key] as String? ?? '';
        if (raw.isNotEmpty) return raw.split(' ').first;
      }
      final authName = _nameFromAuth();
      return authName.isNotEmpty ? authName : 'User';
    },
    loading: () {
      final authName = _nameFromAuth();
      return authName.isNotEmpty ? authName : 'User';
    },
    error: (_, __) => _nameFromAuth().isNotEmpty ? _nameFromAuth() : 'User',
  );
});

// Location override state - null means use profile location
class LocationOverrideNotifier extends StateNotifier<String?> {
  LocationOverrideNotifier() : super(null);

  void setLocation(String location) {
    state = location;
  }

  void clearOverride() {
    state = null;
  }
}

final locationOverrideProvider =
    StateNotifierProvider<LocationOverrideNotifier, String?>((ref) {
  return LocationOverrideNotifier();
});

// User location - uses override if set, otherwise profile location
final userLocationProvider = Provider<String>((ref) {
  // Check for location override first
  final override = ref.watch(locationOverrideProvider);
  if (override != null && override.isNotEmpty) {
    return override;
  }

  // Fall back to profile location from database
  final profileAsync = ref.watch(userProfileProvider);
  return profileAsync.when(
    data: (profile) {
      // Backend may store as 'location' or 'city'
      for (final key in ['location', 'city']) {
        final loc = profile?[key] as String? ?? '';
        if (loc.isNotEmpty) return loc;
      }
      final authLoc = _locationFromAuth();
      return authLoc.isNotEmpty ? authLoc : '';
    },
    loading: () => _locationFromAuth(),
    error: (_, __) => _locationFromAuth(),
  );
});

// User photo URL
final userPhotoUrlProvider = Provider<String?>((ref) {
  final profileAsync = ref.watch(userProfileProvider);
  return profileAsync.when(
    data: (profile) => profile?['photoURL'],
    loading: () => null,
    error: (_, __) => null,
  );
});

// Wallet balance — re-fetches whenever auth state changes (login/logout).
// Returns `usableBalance` (total minus reserved minus pending) so the home
// coin matches what the user can actually spend on joins/bookings. Falls
// back to `balance` for legacy backend payloads.
final walletBalanceProvider = FutureProvider<double>((ref) async {
  // Watch auth state so this re-runs on login/logout, but fall back to the
  // sync isLoggedIn check because the broadcast stream may not have emitted
  // yet when the home screen first subscribes (login event arrives before mount).
  final streamState = ref.watch(currentUserProvider);
  final isLoggedIn = streamState ?? AuthManager().isLoggedIn;
  if (!isLoggedIn) return 0.0;
  final data = await WalletService().getWalletData();
  final raw = data?['usableBalance'] ?? data?['balance'];
  if (raw == null) return 0.0;
  if (raw is num) return raw.toDouble();
  return double.tryParse(raw.toString()) ?? 0.0;
});
