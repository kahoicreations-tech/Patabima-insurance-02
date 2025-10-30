# Switch PataBima Backend to EC2
# Usage: .\switch-to-ec2.ps1

Write-Host "🔄 Switching to EC2 backend..." -ForegroundColor Yellow

$frontendPath = "$PSScriptRoot"
$envFile = "$frontendPath\.env"
$ec2Env = "$frontendPath\.env.ec2"

if (Test-Path $ec2Env) {
    Copy-Item $ec2Env $envFile -Force
    Write-Host "✅ Switched to EC2 backend (http://ec2-34-203-241-81.compute-1.amazonaws.com)" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  Remember to:" -ForegroundColor Yellow
    Write-Host "   1. Reload Expo app: Press 'r' in Metro terminal" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Current backend URL:" -ForegroundColor White
    Get-Content $envFile
}
else {
    Write-Host "❌ .env.ec2 file not found!" -ForegroundColor Red
    exit 1
}
