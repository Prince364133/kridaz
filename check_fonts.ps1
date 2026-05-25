$files = Get-ChildItem -Recurse "d:\Kridaz\kridaz\client\user\src" -Filter "*.jsx" | 
    Where-Object { $_.FullName -match "\\pages\\" -and $_.FullName -notmatch "\\hooks\\" -and $_.FullName -notmatch "\\layouts\\" -and $_.FullName -notmatch "\\ui\\" -and $_.FullName -notmatch "\\components\\" } |
    Select-Object -ExpandProperty FullName

foreach ($f in $files) {
    $found = (Select-String -Path $f -Pattern "Inter 28pt|SUBHEADING_STYLE|global-subheading").Count
    if ($found -eq 0) {
        Write-Output "MISSING: $f"
    }
}
Write-Output "Check complete."
