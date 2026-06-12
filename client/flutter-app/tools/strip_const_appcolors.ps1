# Fix-up: when `const Color(0xFF...)` was replaced with `const AppColors.X`,
# the leading `const` becomes a syntax error (const can only prefix
# constructors and collection literals, not static const field accesses).
# Strip the orphan `const ` before any `AppColors.<token>`.

$ErrorActionPreference = 'Stop'
$libDir = "C:\Users\Hp\Desktop\bms\bms\lib"
$files = Get-ChildItem -Path $libDir -Recurse -Filter *.dart -File

$totalStripped = 0
$filesChanged = 0

foreach ($file in $files) {
    if ($file.FullName -like "*\app_colors.dart") { continue }
    $content = [System.IO.File]::ReadAllText($file.FullName)
    if ([string]::IsNullOrEmpty($content)) { continue }
    $original = $content

    # Match `const AppColors.<token>` — strip just the `const ` prefix.
    # Use regex with word boundary so we don't disturb e.g. `nonconst AppColors.x`.
    $pattern = '(?<![A-Za-z0-9_])const\s+AppColors\.'
    $matches = [regex]::Matches($content, $pattern)
    if ($matches.Count -gt 0) {
        $content = [regex]::Replace($content, $pattern, 'AppColors.')
        $totalStripped += $matches.Count
        $filesChanged++
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.UTF8Encoding]::new($false))
    }
}

Write-Output "Stripped orphan 'const ' from $totalStripped AppColors references in $filesChanged files."
