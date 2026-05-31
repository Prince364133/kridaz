$path = 'c:\Users\saavi\OneDrive\Desktop\kridaz\kridaz\client\user\src\user\pages\JoinGames.jsx'
$content = [System.IO.File]::ReadAllText($path)
$old = "slotIndex: joiningSlot.index,`r`n  role: joiningSlot.role"
$new = "slotIndex: joiningSlot.index,`r`n  slotId: joiningSlot.slotId || undefined,`r`n  role: joiningSlot.role"
$content = $content.Replace($old, $new)
[System.IO.File]::WriteAllText($path, $content)
Write-Host "Patch applied successfully"
