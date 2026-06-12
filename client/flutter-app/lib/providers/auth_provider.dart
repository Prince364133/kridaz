import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/auth_manager.dart';

// Auth state stream: true = logged in, false = logged out
final authStateProvider = StreamProvider<bool>((ref) {
  return AuthManager().authStateChanges;
});

// Sync auth check: null = loading, true = logged in, false = logged out
final currentUserProvider = Provider<bool?>((ref) {
  return ref.watch(authStateProvider).valueOrNull;
});
