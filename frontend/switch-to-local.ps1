# Switch PataBima Backend to LOCAL
# Usage: .\switch-to-local.ps1

Write-Host "🔄 Switching to LOCAL backend..." -ForegroundColor Yellow

$frontendPath = "$PSScriptRoot"
$envFile = "$frontendPath\.env"
$localEnv = "$frontendPath\.env.local"

if (Test-Path $localEnv) {
    Copy-Item $localEnv $envFile -Force
    Write-Host "✅ Switched to LOCAL backend (http://127.0.0.1:8000)" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  Remember to:" -ForegroundColor Yellow
    Write-Host "   1. Start your local Django server: python manage.py runserver" -ForegroundColor Cyan
    Write-Host "   2. Reload Expo app: Press 'r' in Metro terminal" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Current backend URL:" -ForegroundColor White
    Get-Content $envFile
}
else {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
    exit 1
}
