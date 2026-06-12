import 'dart:async';
import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Lightweight key/value cache for offline-first reads (profile snapshots,
/// last-known booking list, etc.). Backed by SharedPreferences — fine for
/// small JSON blobs (< a few KB).
///
/// For larger datasets (chat history, reels feed) swap the implementation
/// for Hive without changing the call sites — the surface here is
/// deliberately small.
class CacheStore {
  static const _ttlSuffix = ':ttl';

  final Future<SharedPreferences> _prefs;

  CacheStore([Future<SharedPreferences>? prefs])
      : _prefs = prefs ?? SharedPreferences.getInstance();

  Future<void> putJson(
    String key,
    Map<String, dynamic> value, {
    Duration? ttl,
  }) async {
    final p = await _prefs;
    await p.setString(key, jsonEncode(value));
    if (ttl != null) {
      final expiresAt = DateTime.now().add(ttl).millisecondsSinceEpoch;
      await p.setInt('$key$_ttlSuffix', expiresAt);
    } else {
      await p.remove('$key$_ttlSuffix');
    }
  }

  Future<Map<String, dynamic>?> getJson(String key) async {
    final p = await _prefs;
    final exp = p.getInt('$key$_ttlSuffix');
    if (exp != null && DateTime.now().millisecondsSinceEpoch > exp) {
      await remove(key);
      return null;
    }
    final raw = p.getString(key);
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      await remove(key);
      return null;
    }
  }

  Future<void> remove(String key) async {
    final p = await _prefs;
    await Future.wait([p.remove(key), p.remove('$key$_ttlSuffix')]);
  }

  Future<void> clearAll() async {
    final p = await _prefs;
    final keys = p.getKeys().where(
        (k) => !k.startsWith('flutter.')); // leave plugin-managed keys alone
    await Future.wait(keys.map(p.remove));
  }
}
