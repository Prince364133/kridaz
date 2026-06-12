# Fix 4-byte emoji mojibake. Same root cause as fix_mojibake.ps1 but emojis
# are 4-byte UTF-8 sequences, so the double-encoded source contains 4
# Unicode chars each. We rebuild the mojibake strings by codepoint and
# replace them with the proper emoji.

$ErrorActionPreference = 'Stop'
$libDir = "C:\Users\Hp\Desktop\bms\bms\lib"

# Build a mojibake string from N codepoints, all from a 4-byte emoji
# of the form F0 9F XX YY. The prefix is always U+00F0 U+0178.
function MojibakeFourByte {
    param([int]$third, [int]$fourth)
    return -join @([char]0x00F0, [char]0x0178, [char]$third, [char]$fourth)
}

# For 3-byte emojis like ⚽ (E2 9A BD), the prefix differs.
function MojibakeThreeByte {
    param([int]$first, [int]$second, [int]$third)
    return -join @([char]$first, [char]$second, [char]$third)
}

# Helper to produce the real emoji (handles surrogate pairs for >U+FFFF).
function Emoji { param([int]$codepoint); [char]::ConvertFromUtf32($codepoint) }

# Mapping: each row = (mojibake source string, real emoji string).
$pairs = @(
    # 4-byte emojis (F0 9F XX YY). [3rd, 4th, codepoint]
    @((MojibakeFourByte 0x008F 0x008F), (Emoji 0x1F3CF)),  # 🏏 cricket
    @((MojibakeFourByte 0x008F 0x0090), (Emoji 0x1F3D0)),  # 🏐 volleyball
    @((MojibakeFourByte 0x008F 0x00AA), (Emoji 0x1F3EA)),  # 🏪 store
    @((MojibakeFourByte 0x008F 0x00B8), (Emoji 0x1F3F8)),  # 🏸 badminton
    @((MojibakeFourByte 0x008F 0x0160), (Emoji 0x1F3CA)),  # 🏊 swimmer
    @((MojibakeFourByte 0x008F 0x0178), (Emoji 0x1F3DF)),  # 🏟 stadium
    @((MojibakeFourByte 0x008F 0x0192), (Emoji 0x1F3C3)),  # 🏃 runner
    @((MojibakeFourByte 0x008F 0x20AC), (Emoji 0x1F3C0)),  # 🏀 basketball
    @((MojibakeFourByte 0x008F 0x2018), (Emoji 0x1F3D1)),  # 🏑 hockey
    @((MojibakeFourByte 0x008F 0x2020), (Emoji 0x1F3C6)),  # 🏆 trophy

    @((MojibakeFourByte 0x00A4 0x009D), (Emoji 0x1F91D)),  # 🤝 handshake
    @((MojibakeFourByte 0x00A4 0x00BC), (Emoji 0x1F93C)),  # 🤼 wrestlers

    @((MojibakeFourByte 0x017D 0x00AE), (Emoji 0x1F3AE)),  # 🎮 gamepad
    @((MojibakeFourByte 0x017D 0x00AF), (Emoji 0x1F3AF)),  # 🎯 dart
    @((MojibakeFourByte 0x017D 0x00BE), (Emoji 0x1F3BE)),  # 🎾 tennis

    # 4-byte emojis whose 3rd source-byte is a 3-byte UTF-8 char
    # (E2 80 9C = U+201C "). Those are 5 source chars total.
    @((-join @([char]0x00F0, [char]0x0178, [char]0x201C, [char]0x00B8)), (Emoji 0x1F4F8)),  # 📸 camera
    @((-join @([char]0x00F0, [char]0x0178, [char]0x201C, [char]0x017D)), (Emoji 0x1F4CE)),  # 📎 paperclip

    # 3-byte non-emoji symbols
    @((MojibakeThreeByte 0x00E2 0x0161 0x00BD), (Emoji 0x26BD)),   # ⚽ football
    @((MojibakeThreeByte 0x00E2 0x203A 0x00B3), (Emoji 0x26F3)),   # ⛳ golf flag
    @((MojibakeThreeByte 0x00E2 0x0153 0x201C), (Emoji 0x2713)),   # ✓ check mark

    # 6-char heart-with-variation-selector ❤️ (E2 9D A4 EF B8 8F)
    @((-join @([char]0x00E2, [char]0x009D, [char]0x00A4,
               [char]0x00EF, [char]0x00B8, [char]0x008F)),
      ([char]::ConvertFromUtf32(0x2764) + [char]::ConvertFromUtf32(0xFE0F))),

    # 6-char warning ⚠️ (E2 9A A0 EF B8 8F)
    @((-join @([char]0x00E2, [char]0x0161, [char]0x00A0,
               [char]0x00EF, [char]0x00B8, [char]0x008F)),
      ([char]::ConvertFromUtf32(0x26A0) + [char]::ConvertFromUtf32(0xFE0F)))
)

$files = Get-ChildItem -Path $libDir -Recurse -Filter *.dart -File
$totalReplacements = 0
$filesChanged = 0
$perPattern = @{}

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName,
        [System.Text.UTF8Encoding]::new($false))
    if ([string]::IsNullOrEmpty($content)) { continue }
    $original = $content
    foreach ($pair in $pairs) {
        $bad = $pair[0]; $good = $pair[1]
        if ($content.Contains($bad)) {
            $count = ([regex]::Matches($content, [regex]::Escape($bad))).Count
            $content = $content.Replace($bad, $good)
            $totalReplacements += $count
            if (-not $perPattern.ContainsKey($good)) { $perPattern[$good] = 0 }
            $perPattern[$good] = $perPattern[$good] + $count
        }
    }
    if ($content -ne $original) {
        $filesChanged++
        [System.IO.File]::WriteAllText($file.FullName, $content,
            [System.Text.UTF8Encoding]::new($false))
    }
}

Write-Output "Fixed $totalReplacements emoji mojibake sequences in $filesChanged files."
Write-Output ""
Write-Output "Per-emoji breakdown:"
$perPattern.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
    Write-Output ("  {0}  -> {1,4} occurrences" -f $_.Key, $_.Value)
}
