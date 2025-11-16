#!/usr/bin/env pwsh
# Switch Frontend API Backend Configuration
# Usage: .\switch_backend.ps1 -Environment production|local|staging

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("local", "staging", "production")]
    [string]$Environment
)

$ErrorActionPreference = "Stop"

# Define API endpoints
$API_ENDPOINTS = @{
    local      = @{
        url         = "http://10.0.2.2:8000"
        description = "Local Django server (Android emulator)"
    }
    staging    = @{
        url         = "http://44.200.182.180"
        description = "EC2 staging server (HTTP)"
    }
    production = @{
        url         = "https://api.patabima.co.ke"
        description = "Production server (HTTPS with SSL)"
    }
}

# File to update
$serviceFile = "frontend\services\DjangoAPIService.js"

if (-not (Test-Path $serviceFile)) {
    Write-Host "❌ Error: $serviceFile not found!" -ForegroundColor Red
    Write-Host "   Are you in the project root directory?" -ForegroundColor Yellow
    exit 1
}

# Get selected endpoint
$selectedEndpoint = $API_ENDPOINTS[$Environment]
$newUrl = $selectedEndpoint.url

Write-Host "`n🔄 Switching Backend Environment..." -ForegroundColor Cyan
Write-Host "   Target: $Environment" -ForegroundColor White
Write-Host "   URL: $newUrl" -ForegroundColor White
Write-Host "   Description: $($selectedEndpoint.description)`n" -ForegroundColor Gray

# Read current file
$content = Get-Content $serviceFile -Raw

# Find current BASE_URL
if ($content -match "BASE_URL:\s*['\`"]([^'\`"]+)['\`"]") {
    $currentUrl = $matches[1]
    Write-Host "📍 Current Backend: $currentUrl" -ForegroundColor Yellow
}
else {
    Write-Host "⚠️  Could not detect current backend URL" -ForegroundColor Yellow
}

# Replace BASE_URL
$pattern = "(const\s+API_CONFIG\s*=\s*\{[^}]*BASE_URL:\s*)['\`"]([^'\`"]+)['\`"]"
$replacement = "`${1}'$newUrl'"

if ($content -match $pattern) {
    $newContent = $content -replace $pattern, $replacement
    
    # Write back to file
    Set-Content -Path $serviceFile -Value $newContent -NoNewline
    
    Write-Host "✅ Backend switched successfully!`n" -ForegroundColor Green
    
    # Show the updated section
    Write-Host "📝 Updated Configuration:" -ForegroundColor Cyan
    $newContent -split "`n" | Select-String -Pattern "API_CONFIG|BASE_URL" -Context 1, 1 | ForEach-Object {
        Write-Host "   $($_.Line)" -ForegroundColor White
    }
    
    Write-Host "`n💡 Next Steps:" -ForegroundColor Yellow
    
    if ($Environment -eq "local") {
        Write-Host "   1. Start local Django server:" -ForegroundColor White
        Write-Host "      cd insurance-app" -ForegroundColor Gray
        Write-Host "      python manage.py runserver 0.0.0.0:8000`n" -ForegroundColor Gray
        Write-Host "   2. Start React Native:" -ForegroundColor White
        Write-Host "      cd frontend" -ForegroundColor Gray
        Write-Host "      npm start`n" -ForegroundColor Gray
    }
    elseif ($Environment -eq "staging") {
        Write-Host "   1. Verify EC2 is running:" -ForegroundColor White
        Write-Host "      curl http://44.200.182.180/api/v1/motor2/categories/`n" -ForegroundColor Gray
        Write-Host "   2. Start React Native:" -ForegroundColor White
        Write-Host "      cd frontend" -ForegroundColor Gray
        Write-Host "      npm start`n" -ForegroundColor Gray
    }
    else {
        Write-Host "   1. Verify SSL is configured:" -ForegroundColor White
        Write-Host "      curl https://api.patabima.co.ke/api/v1/motor2/categories/`n" -ForegroundColor Gray
        Write-Host "   2. Start React Native:" -ForegroundColor White
        Write-Host "      cd frontend" -ForegroundColor Gray
        Write-Host "      npm start`n" -ForegroundColor Gray
    }
    
    Write-Host "🔍 Test Backend Connection:" -ForegroundColor Cyan
    Write-Host "   curl $newUrl/api/v1/motor2/categories/`n" -ForegroundColor Gray
    
}
else {
    Write-Host "❌ Error: Could not find API_CONFIG in $serviceFile" -ForegroundColor Red
    Write-Host "   The file format may have changed. Please update manually.`n" -ForegroundColor Yellow
    exit 1
}
