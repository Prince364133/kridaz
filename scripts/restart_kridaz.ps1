# Stop all running node processes
Write-Host "🛑 Stopping existing Node.js processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait a moment for ports to clear
Start-Sleep -Seconds 2

# Start the whole project using Turbo
Write-Host "🚀 Starting Kridaz Monorepo (Backend + Frontend)..." -ForegroundColor Green
pnpm run dev
