# Backend Switching Scripts Wrapper
# This script redirects to the new location: deployment/backend-switching/
# For backwards compatibility

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("local", "ec2", "staging", "production")]
    [string]$Environment = "ec2"
)

$newScriptPath = Join-Path (Split-Path -Parent $PSScriptRoot) "deployment\backend-switching\switch-backend.ps1"

if (Test-Path $newScriptPath) {
    Write-Host "⚠️  Note: Backend switching scripts have moved to deployment/backend-switching/" -ForegroundColor Yellow
    Write-Host "   Please use: .\deployment\backend-switching\switch-backend.ps1" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Redirecting to new location..." -ForegroundColor DarkGray
    Write-Host ""
    
    & $newScriptPath -Environment $Environment
} else {
    Write-Host "❌ Error: Could not find switch-backend.ps1" -ForegroundColor Red
    Write-Host "   Expected location: $newScriptPath" -ForegroundColor DarkGray
    exit 1
}
