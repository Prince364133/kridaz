# One-shot sweep: replace raw hex Color() literals with AppColors tokens.
# Safe to re-run — already-tokenised files are no-ops.
#
# NEVER touches:
#   - Colors.white / Colors.whiteNN / 0xFFFFFFFF / withValues on white
#   - app_colors.dart itself (the source of truth)

$ErrorActionPreference = 'Stop'
$libDir = "C:\Users\Hp\Desktop\bms\bms\lib"

# Hex literal -> AppColors token. Array of pairs (not hashtable) because
# PowerShell hashtable keys are case-insensitive and 0xFF1A1A1A / 0xFF1a1a1a
# would collide.
$pairs = @(
    @("Color(0xFF55DEE8)", "AppColors.gradientStart"),
    @("Color(0xFFBFF367)", "AppColors.gradientEnd"),
    @("Color(0xFF94EA01)", "AppColors.primary"),
    @("Color(0xFFA1FF00)", "AppColors.accentLimeBright"),
    @("Color(0xFF7CFE6A)", "AppColors.accentLime"),
    @("Color(0xFF4ECDC4)", "AppColors.accentTeal"),
    @("Color(0xFF00E5A0)", "AppColors.accentNeonGreen"),
    @("Color(0xFFFF4444)", "AppColors.errorRed"),
    @("Color(0xFFB0B0B0)", "AppColors.textLightGray"),
    @("Color(0xFF666666)", "AppColors.textGray"),
    @("Color(0xFF2A2A2A)", "AppColors.backgroundCard"),
    @("Color(0xFF1a1a1a)", "AppColors.surfaceL3"),
    @("Color(0xFF1A1A1A)", "AppColors.surfaceL3"),
    @("Color(0xFFFFC107)", "AppColors.accentGoldWarm"),
    @("Color(0xFF141414)", "AppColors.surfaceL2"),
    @("Color(0xFF0D0D0D)", "AppColors.surfaceL0"),
    @("Color(0xFF1E1E1E)", "AppColors.surfaceL4"),
    @("Color(0xFF1C1C1E)", "AppColors.surfaceL3"),
    @("Color(0xFF1C1C1C)", "AppColors.surfaceL3"),
    @("Color(0xFF242424)", "AppColors.surfaceL4"),
    @("Color(0xFF222222)", "AppColors.surfaceL4"),
    @("Color(0xFF252525)", "AppColors.surfaceL4"),
    @("Color(0xFF424242)", "AppColors.borderGray"),

    # --- Second pass: greys + accent families ---
    @("Color(0xFF8A8A8A)", "AppColors.textDarkGray"),
    @("Color(0xFF888888)", "AppColors.textDarkGray"),
    @("Color(0xFF9E9E9E)", "AppColors.textLightGray"),
    @("Color(0xFFE5E5E5)", "AppColors.textLightGray"),
    @("Color(0xFF555555)", "AppColors.textGray"),
    @("Color(0xFF5A5A5A)", "AppColors.textGray"),
    @("Color(0xFF3A3A3A)", "AppColors.borderGray"),
    @("Color(0xFF2C2C2E)", "AppColors.backgroundCard"),
    @("Color(0xFF2C2C2C)", "AppColors.backgroundCard"),
    @("Color(0xFF2E2E2E)", "AppColors.backgroundCard"),
    @("Color(0xFF2a2a2a)", "AppColors.backgroundCard"),
    @("Color(0xFF121212)", "AppColors.surfaceL0"),
    @("Color(0xFFFFD956)", "AppColors.accentYellow"),
    @("Color(0xFFFFD700)", "AppColors.accentGold"),
    @("Color(0xFFFFC403)", "AppColors.accentGold"),
    @("Color(0xFFFF9800)", "AppColors.accentOrange"),
    @("Color(0xFFFF5722)", "AppColors.accentOrangeDeep"),
    @("Color(0xFFFF5252)", "AppColors.errorRed"),
    @("Color(0xFF1565C0)", "AppColors.accentBlue"),
    @("Color(0xFF0D47A1)", "AppColors.accentBlueDark"),
    @("Color(0xFF2196F3)", "AppColors.accentBlueLight"),
    @("Color(0xFF4FC3F7)", "AppColors.accentBlueLight"),
    @("Color(0xFF7CFED9)", "AppColors.accentCyan"),
    @("Color(0xFF00D66B)", "AppColors.accentGreen"),
    @("Color(0xFF00C9A7)", "AppColors.accentTeal"),
    @("Color(0xFFC8F069)", "AppColors.accentLime"),

    # --- Third pass: long-tail exact/near snaps + pink/purple/indigo family ---
    @("Color(0xFF3BE8B0)", "AppColors.accentCyan"),
    @("Color(0xFFFFCC00)", "AppColors.accentYellow"),
    @("Color(0xFFFFEB3B)", "AppColors.accentYellow"),
    @("Color(0xFFFFA726)", "AppColors.accentOrange"),
    @("Color(0xFFE65100)", "AppColors.accentOrangeDeep"),
    @("Color(0xFFFF6B35)", "AppColors.accentOrangeDeep"),
    @("Color(0xFFFF6B6B)", "AppColors.errorRed"),
    @("Color(0xFFD63031)", "AppColors.errorRed"),
    @("Color(0xFFE91E63)", "AppColors.accentPink"),
    @("Color(0xFF880E4F)", "AppColors.accentPink"),
    @("Color(0xFFFF1493)", "AppColors.accentPink"),
    @("Color(0xFF9C27B0)", "AppColors.accentPurple"),
    @("Color(0xFFAB47BC)", "AppColors.accentPurple"),
    @("Color(0xFF6366F1)", "AppColors.accentIndigo"),
    @("Color(0xFF22C55E)", "AppColors.accentGreen"),
    @("Color(0xFF25D366)", "AppColors.accentGreen"),
    @("Color(0xFF1B5E20)", "AppColors.accentGreen"),
    @("Color(0xFF9AFF00)", "AppColors.accentLimeBright"),
    @("Color(0xFF2DD4D4)", "AppColors.accentTeal"),
    @("Color(0xFF2B2B2B)", "AppColors.backgroundCard"),
    @("Color(0xFF3b4754)", "AppColors.borderGray"),
    @("Color(0xFF2A3A2A)", "AppColors.backgroundCard"),

    # --- Fourth pass: sport-card tints, blue gradient, long-tail ---
    @("Color(0xFF1A2332)", "AppColors.surfaceSlate"),
    @("Color(0xFF1E293B)", "AppColors.surfaceSlate"),
    @("Color(0xFF1E2D3D)", "AppColors.surfaceSlate"),
    @("Color(0xFF263348)", "AppColors.surfaceSlate"),
    @("Color(0xFF293038)", "AppColors.surfaceSlate"),
    @("Color(0xFF1A2340)", "AppColors.surfaceSlate"),
    @("Color(0xFF16213E)", "AppColors.surfaceSlate"),
    @("Color(0xFF1A1A2E)", "AppColors.surfaceSlateDeep"),
    @("Color(0xFF0B1220)", "AppColors.surfaceSlateDeep"),
    @("Color(0xFF1A2A1A)", "AppColors.surfaceForest"),
    @("Color(0xFF1B6B3A)", "AppColors.surfaceForest"),
    @("Color(0xFF0A1A0A)", "AppColors.surfaceForestDeep"),
    @("Color(0xFF0D3D20)", "AppColors.surfaceForestDeep"),

    # Exact / near snaps still remaining
    @("Color(0xFF1459CF)", "AppColors.blueGradientStart"),
    @("Color(0xFF0132A1)", "AppColors.blueGradientEnd"),
    @("Color(0xFF2060C0)", "AppColors.blueGradientStart"),
    @("Color(0xFF7C3AED)", "AppColors.accentPurple"),
    @("Color(0xFF757575)", "AppColors.textGray"),
    @("Color(0xFF66BB6A)", "AppColors.accentGreen"),
    @("Color(0xFF2ECC71)", "AppColors.accentGreen"),
    @("Color(0xFF42A5F5)", "AppColors.accentBlueLight"),
    @("Color(0xFF3a3a3a)", "AppColors.borderGray"),
    @("Color(0xFF3A3A3C)", "AppColors.borderGray"),
    @("Color(0xFF3DD9C5)", "AppColors.accentTeal"),
    @("Color(0xFF333333)", "AppColors.surfaceL4"),
    @("Color(0xFF0E0E0E)", "AppColors.surfaceL0"),
    @("Color(0xFF00E5B6)", "AppColors.accentNeonGreen"),

    # One-offs
    @("Color(0xFFFFCC80)", "AppColors.accentOrange"),
    @("Color(0xFFFFC371)", "AppColors.accentOrange"),
    @("Color(0xFFFFBB00)", "AppColors.accentGold"),
    @("Color(0xFFFF9F43)", "AppColors.accentOrange"),
    @("Color(0xFFFF7700)", "AppColors.accentOrangeDeep"),
    @("Color(0xFFFF730F)", "AppColors.accentOrangeDeep"),
    @("Color(0xFFFF7043)", "AppColors.accentOrangeDeep"),
    @("Color(0xFFFF6BF7)", "AppColors.purpleGradientStart"),
    @("Color(0xFFFF6B9D)", "AppColors.accentPink"),
    @("Color(0xFFFF6B8A)", "AppColors.accentPink"),
    @("Color(0xFFFF3939)", "AppColors.errorRed"),

    # --- Fifth pass: long-tail one-offs snapped to nearest token ---
    # greens / limes / teals
    @("Color(0xFFA5D6A7)", "AppColors.accentGreen"),
    @("Color(0xFF74C69D)", "AppColors.accentGreen"),
    @("Color(0xFF7CFE64)", "AppColors.accentLime"),
    @("Color(0xFF7ACC00)", "AppColors.accentLimeBright"),
    @("Color(0xFFA3FF05)", "AppColors.accentLimeBright"),
    @("Color(0xFFB5F23D)", "AppColors.accentLime"),
    @("Color(0xFF4DB6AC)", "AppColors.accentTeal"),
    @("Color(0xFF4DD0E1)", "AppColors.accentTeal"),
    @("Color(0xFF006064)", "AppColors.accentTeal"),
    # yellows / oranges
    @("Color(0xFFFBBC05)", "AppColors.accentGold"),
    @("Color(0xFFF5A623)", "AppColors.accentOrange"),
    @("Color(0xFFF57F17)", "AppColors.accentOrangeDeep"),
    @("Color(0xFFF4A261)", "AppColors.accentOrange"),
    @("Color(0xFF7B4F00)", "AppColors.accentOrangeDeep"),
    # reds / pinks
    @("Color(0xFFFF0F3B)", "AppColors.errorRed"),
    @("Color(0xFFEA4335)", "AppColors.errorRed"),
    @("Color(0xFFE91E8C)", "AppColors.accentPink"),
    @("Color(0xFFF06292)", "AppColors.accentPink"),
    # purples / indigos
    @("Color(0xFFE040FB)", "AppColors.accentPurple"),
    @("Color(0xFFCFB6E8)", "AppColors.accentPurple"),
    @("Color(0xFFCE93D8)", "AppColors.accentPurple"),
    @("Color(0xFFC084FC)", "AppColors.accentPurple"),
    @("Color(0xFFB48EF5)", "AppColors.accentPurple"),
    @("Color(0xFF8E6EF7)", "AppColors.accentIndigo"),
    @("Color(0xFF8B5CF6)", "AppColors.accentPurple"),
    @("Color(0xFF8A85FF)", "AppColors.accentIndigo"),
    @("Color(0xFF7986CB)", "AppColors.accentIndigo"),
    @("Color(0xFF6C63FF)", "AppColors.accentIndigo"),
    @("Color(0xFF6A1B9A)", "AppColors.accentPurple"),
    @("Color(0xFF6A0572)", "AppColors.purpleGradientEnd"),
    @("Color(0xFF667EEA)", "AppColors.accentIndigo"),
    @("Color(0xFF5C0078)", "AppColors.purpleGradientEnd"),
    @("Color(0xFF555580)", "AppColors.accentIndigo"),
    # blues
    @("Color(0xFF60A5FA)", "AppColors.accentBlueLight"),
    @("Color(0xFF5BA4F5)", "AppColors.accentBlueLight"),
    @("Color(0xFF9BB5F6)", "AppColors.accentBlueLight"),
    @("Color(0xFF90CAF9)", "AppColors.accentBlueLight"),
    @("Color(0xFFAECBFA)", "AppColors.accentBlueLight"),
    @("Color(0xFFB3E5FC)", "AppColors.accentBlueLight"),
    @("Color(0xFF9eabba)", "AppColors.textLightGray"),
    @("Color(0xFF9EA3AE)", "AppColors.textLightGray"),
    @("Color(0xFF607D8B)", "AppColors.textGray"),
    # greys
    @("Color(0xFFE5E6EB)", "AppColors.textLightGray"),
    @("Color(0xFFAAAAAA)", "AppColors.textLightGray"),
    @("Color(0xFF797979)", "AppColors.textGray"),
    @("Color(0xFF707070)", "AppColors.borderLight"),

    # --- Sixth pass: final single-use snaps ---
    @("Color(0xFF4DAAFF)", "AppColors.accentBlueLight"),
    @("Color(0xFF4A4A4A)", "AppColors.borderGray"),
    @("Color(0xFF4A148C)", "AppColors.accentPurple"),
    @("Color(0xFF464646)", "AppColors.borderGray"),
    @("Color(0xFF444444)", "AppColors.borderGray"),
    @("Color(0xFF4285F4)", "AppColors.accentBlueLight"),
    @("Color(0xFF3F3D9A)", "AppColors.accentIndigo"),
    @("Color(0xFF3BEDB0)", "AppColors.accentCyan"),
    @("Color(0xFF3BE8D0)", "AppColors.accentCyan"),
    @("Color(0xFF3B82F6)", "AppColors.accentBlueLight"),
    @("Color(0xFF3A1C71)", "AppColors.accentPurple"),
    @("Color(0xFF388E3C)", "AppColors.accentGreen"),
    @("Color(0xFF34A853)", "AppColors.accentGreen"),
    @("Color(0xFF3070D0)", "AppColors.accentBlue"),
    @("Color(0xFF2E7D32)", "AppColors.accentGreen"),
    @("Color(0xFF2D6A00)", "AppColors.accentGreen"),
    @("Color(0xFF2AD4A0)", "AppColors.accentNeonGreen"),
    @("Color(0xFF2A4A2A)", "AppColors.surfaceForest"),
    @("Color(0xFF26C6DA)", "AppColors.accentTeal"),
    @("Color(0xFF263238)", "AppColors.surfaceSlate"),
    @("Color(0xFF262626)", "AppColors.backgroundCard"),
    @("Color(0xFF2050A0)", "AppColors.accentBlue"),
    @("Color(0xFF1F2937)", "AppColors.surfaceSlate"),
    @("Color(0xFF1E3A8A)", "AppColors.accentBlueDark"),
    @("Color(0xFF1A2E1A)", "AppColors.surfaceForest"),
    @("Color(0xFF1A2B1A)", "AppColors.surfaceForest"),
    @("Color(0xFF1A1F1A)", "AppColors.surfaceL3"),
    @("Color(0xFF1A0A0A)", "AppColors.surfaceL0"),
    @("Color(0xFF18A87A)", "AppColors.accentGreen"),
    @("Color(0xFF1877F2)", "AppColors.accentBlue"),
    @("Color(0xFF171717)", "AppColors.surfaceL3"),
    @("Color(0xFF111C38)", "AppColors.surfaceSlateDeep"),
    @("Color(0xFF0F1923)", "AppColors.surfaceSlateDeep"),
    @("Color(0xFF0E1D45)", "AppColors.surfaceSlateDeep"),
    @("Color(0xFF0D3B7C)", "AppColors.accentBlueDark"),
    @("Color(0xFF0D1B3E)", "AppColors.surfaceSlateDeep"),
    @("Color(0xFF0D1520)", "AppColors.surfaceSlateDeep"),
    @("Color(0xFF0A2D68)", "AppColors.blueGradientEnd"),
    @("Color(0xFF071229)", "AppColors.surfaceSlateDeep"),
    @("Color(0xFF03A9F4)", "AppColors.accentBlueLight"),
    @("Color(0xFF03080F)", "AppColors.surfaceL0"),
    @("Color(0xFF01579B)", "AppColors.accentBlueDark"),
    @("Color(0xFF00D4A3)", "AppColors.accentNeonGreen"),
    @("Color(0xFF00BCD4)", "AppColors.accentTeal"),
    @("Color(0xFF00A86B)", "AppColors.accentGreen"),
    @("Color(0xFF006B4F)", "AppColors.accentGreen"),
    @("Color(0xFF00695C)", "AppColors.accentTeal"),
    @("Color(0xFF004D41)", "AppColors.greenGradientEnd"),
    @("Color(0xFF003A00)", "AppColors.accentGreen"),
    @("Color(0xFF3A0000)", "AppColors.accentRed")
)

$files = Get-ChildItem -Path $libDir -Recurse -Filter *.dart -File
$totalReplacements = 0
$filesChanged = 0
$importsAdded = 0
$perFile = @()

foreach ($file in $files) {
    if ($file.FullName -like "*\app_colors.dart") { continue }

    $content = [System.IO.File]::ReadAllText($file.FullName)
    if ([string]::IsNullOrEmpty($content)) { continue }

    $original = $content
    $hadImport = $content -match "import\s+['""][^'""]*app_colors\.dart['""]"
    $fileReplacements = 0

    foreach ($pair in $pairs) {
        $key = $pair[0]
        $val = $pair[1]
        if ($content.Contains($key)) {
            $count = ([regex]::Matches($content, [regex]::Escape($key))).Count
            $content = $content.Replace($key, $val)
            $fileReplacements += $count
        }
    }

    if ($content -ne $original) {
        $filesChanged++
        $totalReplacements += $fileReplacements
        $perFile += [pscustomobject]@{
            File = $file.FullName.Substring($libDir.Length + 1)
            Replacements = $fileReplacements
        }

        if (-not $hadImport -and ($content -match 'AppColors\.')) {
            $fileDir = Split-Path -Parent $file.FullName
            $appColorsAbs = Join-Path $libDir "core\constants\app_colors.dart"
            Push-Location $fileDir
            $rel = (Resolve-Path -Relative $appColorsAbs) -replace '\\', '/'
            if ($rel.StartsWith('./')) { $rel = $rel.Substring(2) }
            Pop-Location
            $importLine = "import '$rel';`r`n"
            # Insert after the very first import statement.
            $content = [regex]::Replace($content, "(?ms)^(import\s+'[^']+';\r?\n)", "`$1$importLine", 1)
            $importsAdded++
        }

        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.UTF8Encoding]::new($false))
    }
}

Write-Output "=========================================="
Write-Output "Files changed:       $filesChanged"
Write-Output "Color replacements:  $totalReplacements"
Write-Output "Imports added:       $importsAdded"
Write-Output "=========================================="
$perFile | Sort-Object -Property Replacements -Descending | Select-Object -First 20 | Format-Table -AutoSize
