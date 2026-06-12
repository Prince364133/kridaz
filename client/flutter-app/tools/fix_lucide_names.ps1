# Lucide 0.257.0 uses the old naming (alertCircle / checkCircle / xCircle /
# playCircle / helpCircle) — the newer `circleAlert` etc. names appeared in
# later releases. Fix the mismatches the sweep introduced.

$ErrorActionPreference = 'Stop'
$libDir = "C:\Users\Hp\Desktop\bms\bms\lib"

$renames = @(
    @("LucideIcons.circleAlert", "LucideIcons.alertCircle"),
    @("LucideIcons.circleCheck", "LucideIcons.checkCircle"),
    @("LucideIcons.circleX", "LucideIcons.xCircle"),
    @("LucideIcons.circlePlay", "LucideIcons.playCircle"),
    @("LucideIcons.circleHelp", "LucideIcons.helpCircle"),
    @("LucideIcons.images", "LucideIcons.image"),
    @("LucideIcons.hospital", "LucideIcons.heart"),
    @("LucideIcons.cable", "LucideIcons.zap")
)

$files = Get-ChildItem -Path $libDir -Recurse -Filter *.dart -File
$total = 0
$filesChanged = 0

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    if ([string]::IsNullOrEmpty($content)) { continue }
    $original = $content
    foreach ($pair in $renames) {
        if ($content.Contains($pair[0])) {
            $count = ([regex]::Matches($content, [regex]::Escape($pair[0]))).Count
            $content = $content.Replace($pair[0], $pair[1])
            $total += $count
        }
    }
    if ($content -ne $original) {
        $filesChanged++
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.UTF8Encoding]::new($false))
    }
}

Write-Output "Renamed $total Lucide references in $filesChanged files."
