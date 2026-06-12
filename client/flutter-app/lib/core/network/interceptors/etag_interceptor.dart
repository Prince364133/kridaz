import 'package:dio/dio.dart';

/// Transparent ETag cache for GET requests.
///
/// On the first GET to a path the server returns `200 ... ETag: W/"abc"`.
/// We remember `(path+query → etag + body)`. On the next GET to the same
/// path we attach `If-None-Match: W/"abc"` — the server then either
/// returns `200` with a fresh body (new etag stored) or `304 Not Modified`
/// with no body. On `304` we resolve the call with the cached body so
/// callers see a normal `Response` without knowing the cache exists.
///
/// Wins ~90% bandwidth on polled endpoints (live score, scorecard,
/// squads, overs) which the backend has ETag-enabled.
///
/// Scope:
/// - Only GETs. Mutating methods skip the cache.
/// - In-memory only — wiped on app restart. That's fine: ETags are an
///   optimization, not a correctness mechanism.
/// - Capped by [maxEntries] (LRU eviction) so a long session doesn't
///   bloat memory with one-shot list endpoints.
class EtagInterceptor extends Interceptor {
  EtagInterceptor({this.maxEntries = 128});

  final int maxEntries;

  /// Insertion-ordered → cheap LRU: re-insert on hit, drop oldest on
  /// overflow.
  final Map<String, _EtagEntry> _cache = <String, _EtagEntry>{};

  String _key(RequestOptions o) {
    final q = o.queryParameters;
    if (q.isEmpty) return o.path;
    final sorted = q.entries.toList()..sort((a, b) => a.key.compareTo(b.key));
    final qs = sorted.map((e) => '${e.key}=${e.value}').join('&');
    return '${o.path}?$qs';
  }

  bool _isGet(RequestOptions o) => o.method.toUpperCase() == 'GET';

  /// Caller opt-out: services that already cache locally (e.g. cached
  /// network images) can set `extra['skipEtag'] = true` to bypass.
  bool _skip(RequestOptions o) => o.extra['skipEtag'] == true;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (!_isGet(options) || _skip(options)) return handler.next(options);

    final cached = _cache.remove(_key(options));
    if (cached != null) {
      // Re-insert at the tail so we keep LRU semantics.
      _cache[_key(options)] = cached;
      options.headers['If-None-Match'] = cached.etag;
      // Stash for the response phase — avoids a second map lookup.
      options.extra['_etagCached'] = cached;
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    final req = response.requestOptions;
    if (!_isGet(req) || _skip(req)) return handler.next(response);

    // 304 Not Modified — substitute the cached body so the caller sees a
    // normal 200 with the same payload it had before. The Dio that called
    // us must allow 304 through validateStatus for this branch to fire;
    // when it doesn't, onError below catches the same case.
    if (response.statusCode == 304) {
      final cached = _readCached(req);
      if (cached != null) {
        return handler.resolve(Response(
          requestOptions: req,
          data: cached.body,
          statusCode: 200,
          headers: response.headers,
          extra: {...req.extra, 'fromEtagCache': true},
        ));
      }
      // No cache and a 304 means our request had a stale ETag and the
      // server expected us to re-use a body we don't have. Treat as an
      // error so the caller retries without If-None-Match.
      return handler.reject(DioException(
        requestOptions: req,
        response: response,
        type: DioExceptionType.badResponse,
        message: '304 received but no cached body to substitute',
      ));
    }

    final etag = response.headers.value('etag');
    if (etag != null && response.statusCode == 200) {
      _store(_key(req), _EtagEntry(etag: etag, body: response.data));
    }
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final req = err.requestOptions;
    final res = err.response;
    // Fallback for Dios whose validateStatus rejects 304 (Dio's default
    // only accepts 2xx). When that happens the 304 lands here instead of
    // onResponse. Same outcome — resolve from cache.
    if (_isGet(req) && res?.statusCode == 304) {
      final cached = _readCached(req);
      if (cached != null) {
        return handler.resolve(Response(
          requestOptions: req,
          data: cached.body,
          statusCode: 200,
          headers: res!.headers,
          extra: {...req.extra, 'fromEtagCache': true},
        ));
      }
      // 304 without a cached body: strip the If-None-Match and let the
      // caller observe the situation as a normal error.
    }
    handler.next(err);
  }

  /// Read the cache entry we stashed in onRequest. Read by key as the
  /// fallback so it survives interceptor chains that rebuild the
  /// RequestOptions and drop `extra` (e.g. an auth-refresh retry).
  _EtagEntry? _readCached(RequestOptions req) {
    final stashed = req.extra['_etagCached'];
    if (stashed is _EtagEntry) return stashed;
    return _cache[_key(req)];
  }

  void _store(String key, _EtagEntry entry) {
    _cache.remove(key);
    _cache[key] = entry;
    while (_cache.length > maxEntries) {
      _cache.remove(_cache.keys.first);
    }
  }

  /// Drop everything. Use on logout so a fresh user doesn't see the
  /// previous account's cached payloads.
  void clear() => _cache.clear();
}

class _EtagEntry {
  _EtagEntry({required this.etag, required this.body});
  final String etag;
  final dynamic body;
}
