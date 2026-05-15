# Stop all running node processes (Server and Vite)
Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow
Stop-Process -Name "node" -ErrorAction SilentlyContinue

# Navigate to TurfSpot directory
$rootDir = Get-Location
$turfSpotDir = Join-Path $rootDir "TurfSpot"

if (Test-Path $turfSpotDir) {
    Set-Location $turfSpotDir
} else {
    Write-Host "Error: TurfSpot directory not found at $turfSpotDir" -ForegroundColor Red
    return
}

# 1. Seed the data
Write-Host "`nStep 1: Seeding Tactical Data..." -ForegroundColor Green
Set-Location "server"
node master_seed.js
Set-Location ".."

# 2. Start the Backend
Write-Host "`nStep 2: Starting Backend Server (Port 1234)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; pnpm dev" -WindowStyle Normal

# 3. Start the User Portal
Write-Host "Step 3: Starting User Portal (Port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client/user; pnpm dev" -WindowStyle Normal

# 4. Start the Owner/Admin Portal
Write-Host "Step 4: Starting Owner Hub (Port 5174)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client/owner; pnpm dev" -WindowStyle Normal

Write-Host "`nAll systems initiated. Check the separate terminal windows for logs." -ForegroundColor Cyan
Write-Host "User Portal: http://localhost:5173" -ForegroundColor White
Write-Host "Admin Hub: http://localhost:5174/admin" -ForegroundColor White
