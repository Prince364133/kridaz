/// Returns true when [value] is a fully-qualified http(s) URL with a host.
///
/// Use this as the gate before constructing `NetworkImage` /
/// `CachedNetworkImage`. The bare null/empty/whitespace checks aren't
/// enough — legacy backend rows occasionally return a filename
/// (`"turf_wembley.jpg"`) in an image field, and `NetworkImage` will then
/// try to resolve `file:///turf_wembley.jpg` and throw
/// `Invalid argument(s): No host specified in URI file:///`. That
/// exception spams the log every frame because Image rebuilds on every
/// layout pass.
bool isHttpUrl(String? value) {
  if (value == null) return false;
  final trimmed = value.trim();
  if (trimmed.isEmpty) return false;
  final uri = Uri.tryParse(trimmed);
  if (uri == null) return false;
  return (uri.scheme == 'http' || uri.scheme == 'https') && uri.host.isNotEmpty;
}

/// Returns a raster image URL safe to pass to `NetworkImage` /
/// `CachedNetworkImage`, or `null` when no usable URL is available.
///
/// Flutter's image codec can't decode SVG, so backend rows that return
/// DiceBear avatar URLs like
/// `https://api.dicebear.com/7.x/avataaars/svg?seed=...` would throw
/// `ImageDecoder$DecodeException: 'unimplemented'` and spam the log on
/// every rebuild. DiceBear serves the same avatar as PNG when the format
/// segment is `/png`, so we rewrite the URL transparently.
String? safeAvatarUrl(String? value) {
  if (!isHttpUrl(value)) return null;
  final trimmed = value!.trim();
  if (trimmed.contains('api.dicebear.com') && trimmed.contains('/svg')) {
    return trimmed.replaceFirst('/svg', '/png');
  }
  return trimmed;
}
