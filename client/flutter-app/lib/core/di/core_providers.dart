import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/api_client.dart';
import '../network/network_info.dart';
import '../storage/cache_store.dart';
import '../storage/secure_token_store.dart';

/// Root Riverpod providers for the new networking stack.
///
/// Import this file at app bootstrap and override `apiClientProvider` in
/// tests to inject a mock.

final secureTokenStoreProvider = Provider<SecureTokenStore>((ref) {
  return SecureTokenStore();
});

final cacheStoreProvider = Provider<CacheStore>((ref) {
  return CacheStore();
});

final networkInfoProvider = Provider<NetworkInfo>((ref) {
  return NetworkInfo();
});

final networkStatusProvider = StreamProvider<bool>((ref) {
  return ref.watch(networkInfoProvider).onStatusChange;
});

final apiClientProvider = Provider<ApiClient>((ref) {
  final tokenStore = ref.watch(secureTokenStoreProvider);
  final client = ApiClient.build(tokenStore: tokenStore);

  // Repositories that depend on ApiClient should react to auth failure too.
  // Wire the global logout side-effect here so it lives in one place.
  // (Hook this to your router/auth state once you've migrated the auth
  // flow over — left as TODO so we don't fight your existing AuthManager.)
  // (client.raw.interceptors.whereType<AuthInterceptor>().first).onAuthFailure = () { ... };

  ref.onDispose(() => client.raw.close(force: true));
  return client;
});
