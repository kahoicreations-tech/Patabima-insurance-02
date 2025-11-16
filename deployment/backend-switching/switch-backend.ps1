# PataBima Backend Switcher
# Switch between local development and EC2 production backend
# Usage: .\switch-backend.ps1 -Environment [local|ec2|staging]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("local", "ec2", "staging", "production")]
    [string]$Environment
)

# Get paths relative to project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptPath)
$frontendPath = Join-Path $projectRoot "frontend"
$envLocal = Join-Path $frontendPath ".env.local"
$backupLocal = Join-Path $frontendPath ".env.local.backup"

# Backend configurations
$backends = @{
    local = @{
        url = "http://10.0.2.2:8000"
        description = "Local Django development server"
        color = "Cyan"
    }
    ec2 = @{
        url = "http://44.200.182.180"
        description = "EC2 production instance (i-0d0f116005d812275)"
        color = "Green"
    }
    staging = @{
        url = "http://44.200.182.180"
        description = "EC2 staging server (same as production for now)"
        color = "Yellow"
    }
    production = @{
        url = "https://api.patabima.co.ke"
        description = "Production with SSL (DNS + HTTPS)"
        color = "Magenta"
    }
}

$config = $backends[$Environment]

Write-Host ""
Write-Host "🔄 Switching Backend Environment..." -ForegroundColor Cyan
Write-Host "   Target: $Environment" -ForegroundColor White
Write-Host "   URL: $($config.url)" -ForegroundColor White
Write-Host "   Description: $($config.description)" -ForegroundColor DarkGray
Write-Host ""

# Backup current config
if (Test-Path $envLocal) {
    $currentUrl = (Get-Content $envLocal | Select-String "EXPO_PUBLIC_API_BASE_URL").ToString()
    Write-Host "📍 Current Backend: $($currentUrl -replace '.*=', '')" -ForegroundColor DarkGray
    Copy-Item $envLocal $backupLocal -Force
}

# Create new .env.local with selected backend
$envContent = @"
# Backend Environment: $Environment
# Last updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
EXPO_PUBLIC_API_BASE_URL=$($config.url)
"@

Set-Content -Path $envLocal -Value $envContent -Force

Write-Host "✅ Backend switched successfully!" -ForegroundColor $config.color
Write-Host ""
Write-Host "📝 Updated Configuration:" -ForegroundColor Cyan
Write-Host "   const API_CONFIG = {" -ForegroundColor DarkGray
Write-Host "     BASE_URL: '$($config.url)'," -ForegroundColor White
Write-Host "     TIMEOUT: 30000," -ForegroundColor DarkGray
Write-Host "   }" -ForegroundColor DarkGray
Write-Host ""

# Environment-specific next steps
switch ($Environment) {
    "local" {
        Write-Host "💡 Next Steps:" -ForegroundColor Yellow
        Write-Host "   1. Start Django server:" -ForegroundColor White
        Write-Host "      cd insurance-app" -ForegroundColor DarkGray
        Write-Host "      python manage.py runserver 0.0.0.0:8000" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "   2. Verify backend is running:" -ForegroundColor White
        Write-Host "      curl http://localhost:8000/api/v1/motor2/categories/" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "   3. Reload Expo app: Press 'r' in Metro terminal" -ForegroundColor White
    }
    "ec2" {
        Write-Host "💡 Next Steps:" -ForegroundColor Yellow
        Write-Host "   1. Verify EC2 is running:" -ForegroundColor White
        Write-Host "      curl http://44.200.182.180/api/v1/motor2/categories/" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "   2. Check EC2 status:" -ForegroundColor White
        Write-Host "      aws ec2 describe-instances --instance-ids i-0d0f116005d812275 --query 'Reservations[0].Instances[0].State.Name'" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "   3. Reload Expo app: Press 'r' in Metro terminal" -ForegroundColor White
        Write-Host ""
        Write-Host "   4. If API fails, check EC2 services:" -ForegroundColor White
        Write-Host "      ssh ec2-user@44.200.182.180" -ForegroundColor DarkGray
        Write-Host "      sudo systemctl status patabima nginx" -ForegroundColor DarkGray
    }
    "staging" {
        Write-Host "💡 Next Steps:" -ForegroundColor Yellow
        Write-Host "   1. Test API connection:" -ForegroundColor White
        Write-Host "      curl http://44.200.182.180/api/v1/motor2/categories/" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "   2. Reload Expo app: Press 'r' in Metro terminal" -ForegroundColor White
    }
    "production" {
        Write-Host "⚠️  Production backend requires:" -ForegroundColor Red
        Write-Host "   1. DNS configured: api.patabima.co.ke → 44.200.182.180" -ForegroundColor White
        Write-Host "   2. SSL certificate installed (Let's Encrypt)" -ForegroundColor White
        Write-Host "   3. DEBUG=False in backend settings" -ForegroundColor White
        Write-Host ""
        Write-Host "   See: docs/EC2_FRONTEND_INTEGRATION_GUIDE.md" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "   For now, use: -Environment ec2" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""
