/// Current shipping app version. Keep in sync with `version:` in pubspec.yaml.
/// We embed it as a const rather than reading via package_info_plus to avoid
/// the extra dependency — bump this whenever you bump pubspec.
class AppVersion {
  static const String current = '1.0.0';

  /// Returns true when [current] is at least [minimum].
  /// Compares major.minor.patch numerically; missing segments are treated
  /// as 0. Pre-release / build suffixes are ignored.
  ///
  /// Examples:
  ///   isAtLeast('1.0.0')   → true   (1.0.0 >= 1.0.0)
  ///   isAtLeast('1.1.0')   → false  (1.0.0 <  1.1.0)
  ///   isAtLeast('0.9')     → true   (1.0.0 >= 0.9.0)
  static bool isAtLeast(String minimum) {
    final a = _parse(current);
    final b = _parse(minimum);
    for (var i = 0; i < 3; i++) {
      if (a[i] > b[i]) return true;
      if (a[i] < b[i]) return false;
    }
    return true;
  }

  static List<int> _parse(String v) {
    // Drop pre-release / build metadata before splitting.
    final clean = v.split(RegExp(r'[-+]')).first;
    final parts = clean.split('.');
    return [
      parts.length > 0 ? int.tryParse(parts[0]) ?? 0 : 0,
      parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0,
      parts.length > 2 ? int.tryParse(parts[2]) ?? 0 : 0,
    ];
  }
}
