# Switch PataBima Backend to LOCAL
# Usage: .\switch-to-local.ps1

Write-Host "🔄 Switching to LOCAL backend..." -ForegroundColor Yellow

$frontendPath = "$PSScriptRoot"
$envLocal = "$frontendPath\.env.local"
$backupLocal = "$frontendPath\.env.local.backup"

if (Test-Path $backupLocal) {
    Copy-Item $backupLocal $envLocal -Force
    Write-Host "✅ Switched to LOCAL backend (http://192.168.0.100:8000)" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  Remember to:" -ForegroundColor Yellow
    Write-Host "   1. Start your local Django server: python manage.py runserver" -ForegroundColor Cyan
    Write-Host "   2. Reload Expo app: Press 'r' in Metro terminal" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Current backend URL:" -ForegroundColor White
    Get-Content $envLocal | Select-String "EXPO_PUBLIC_API_BASE_URL"
}
else {
    Write-Host "❌ .env.local.backup file not found!" -ForegroundColor Red
    Write-Host "Creating default local environment..." -ForegroundColor Yellow
    
    @"
# Local Development Backend (update to your LAN IP if using a physical device)
# For emulator, http://10.0.2.2:8000 (Android) or http://127.0.0.1:8000 (iOS simulator)
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.100:8000
"@ | Out-File -FilePath $envLocal -Encoding utf8
    
    Write-Host "✅ Created .env.local with default local backend" -ForegroundColor Green
}
