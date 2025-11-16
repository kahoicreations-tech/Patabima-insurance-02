# Switch PataBima Backend to EC2
# Usage: .\switch-to-ec2.ps1

Write-Host "🔄 Switching to EC2 backend..." -ForegroundColor Yellow

$frontendPath = "$PSScriptRoot"
$envLocal = "$frontendPath\.env.local"
$backupLocal = "$frontendPath\.env.local.backup"
$ec2Env = "$frontendPath\.env.ec2"

# Backup current .env.local
if (Test-Path $envLocal) {
    Copy-Item $envLocal $backupLocal -Force
}

if (Test-Path $ec2Env) {
    Copy-Item $ec2Env $envLocal -Force
    Write-Host "✅ Switched to EC2 backend (http://44.200.182.180)" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Backend Details:" -ForegroundColor Cyan
    Write-Host "   Instance: i-0d0f116005d812275" -ForegroundColor White
    Write-Host "   Region: us-east-1" -ForegroundColor White
    Write-Host "   Database: RDS PostgreSQL" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Reload Expo app: Press 'r' in Metro terminal" -ForegroundColor Cyan
    Write-Host "   2. Test API: curl http://44.200.182.180/api/v1/motor2/categories/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Current backend URL:" -ForegroundColor White
    Get-Content $envLocal | Select-String "EXPO_PUBLIC_API_BASE_URL"
}
else {
    Write-Host "❌ .env.ec2 file not found!" -ForegroundColor Red
    exit 1
}
