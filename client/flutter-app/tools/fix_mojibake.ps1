# Fix Windows-1252→UTF-8 double-encoding mojibake in lib/.
#
# Source files contain visible sequences like `â‚¹` (3 Unicode chars) where
# the original was `₹` (1 char, U+20B9). This happens when a file is read
# as UTF-8 but had previously been interpreted as Windows-1252 and re-saved
# — every multi-byte character gets re-expanded into ASCII+symbol triples.
#
# IMPORTANT: PowerShell treats `[char] + [char]` as integer addition. Use
# `-join @([char]..., [char]...)` to build multi-char strings.

$ErrorActionPreference = 'Stop'
$libDir = "C:\Users\Hp\Desktop\bms\bms\lib"

# Helper to make codepoint sequence strings.
function S { param([int[]]$codes); -join ($codes | ForEach-Object { [char]$_ }) }

# Ordered list of (mojibake -> real char) pairs. Longer-prefix patterns
# should come first when they share the `â€` prefix.
$pairs = @(
    # `â€<x>` family: original UTF-8 was E2 80 <x>. <x> got reinterpreted
    # as Windows-1252 then re-encoded — see comments for the third
    # codepoint each one collapses to.
    @((S 0x00E2,0x20AC,0x201D), (S 0x2014)),  # em dash — (third byte 0x94 → U+201D)
    @((S 0x00E2,0x20AC,0x201C), (S 0x2013)),  # en dash – (third byte 0x93 → U+201C)
    @((S 0x00E2,0x20AC,0x00A2), (S 0x2022)),  # bullet • (third byte 0xA2 → U+00A2)
    @((S 0x00E2,0x20AC,0x00A6), (S 0x2026)),  # ellipsis … (third byte 0xA6 → U+00A6)
    @((S 0x00E2,0x20AC,0x2122), (S 0x2019)),  # right single quote ' (0x99 → U+2122)
    @((S 0x00E2,0x20AC,0x02DC), (S 0x2018)),  # left single quote ' (0x98 → U+02DC)
    @((S 0x00E2,0x20AC,0x0153), (S 0x201C)),  # left double quote " (0x9C → U+0153)
    @((S 0x00E2,0x20AC,0x017E), (S 0x201D)),  # right double quote " (0x9E → U+017E)

    # Rupee sign: original E2 82 B9 → bytes C3 A2 E2 80 9A C2 B9 → chars
    # U+00E2 U+201A U+00B9 → render as `â‚¹`.
    @((S 0x00E2,0x201A,0x00B9), (S 0x20B9)),

    # Middle dot: original C2 B7 → bytes C3 82 C2 B7 → chars U+00C2 U+00B7
    # → render as `Â·`.
    @((S 0x00C2,0x00B7), (S 0x00B7)),

    # Latin-1 accented letters (uncommon but cheap to fix)
    @((S 0x00C3,0x00A9), (S 0x00E9)),  # é
    @((S 0x00C3,0x00A8), (S 0x00E8)),  # è
    @((S 0x00C3,0x00A1), (S 0x00E1)),  # á
    @((S 0x00C3,0x00B3), (S 0x00F3)),  # ó
    @((S 0x00C3,0x00B1), (S 0x00F1))   # ñ
)

$files = Get-ChildItem -Path $libDir -Recurse -Filter *.dart -File
$totalReplacements = 0
$filesChanged = 0
$byPattern = @{}

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName,
        [System.Text.UTF8Encoding]::new($false))
    if ([string]::IsNullOrEmpty($content)) { continue }
    $original = $content
    foreach ($pair in $pairs) {
        $bad = $pair[0]
        $good = $pair[1]
        if ($content.Contains($bad)) {
            $count = ([regex]::Matches($content, [regex]::Escape($bad))).Count
            $content = $content.Replace($bad, $good)
            $totalReplacements += $count
            if (-not $byPattern.ContainsKey($bad)) { $byPattern[$bad] = 0 }
            $byPattern[$bad] = $byPattern[$bad] + $count
        }
    }
    if ($content -ne $original) {
        $filesChanged++
        [System.IO.File]::WriteAllText($file.FullName, $content,
            [System.Text.UTF8Encoding]::new($false))
    }
}

Write-Output "Fixed $totalReplacements mojibake sequences in $filesChanged files."
Write-Output ""
Write-Output "Per-pattern breakdown:"
$byPattern.GetEnumerator() | ForEach-Object {
    Write-Output ("  {0} -> {1,5} occurrences" -f $_.Key, $_.Value)
}
