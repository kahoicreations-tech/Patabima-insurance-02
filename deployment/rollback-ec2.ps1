#!/usr/bin/env pwsh
#########################################################
# PataBima EC2 Rollback - PowerShell Remote Executor
# Connects to EC2 and runs the rollback script
#########################################################

param(
    [Parameter(Mandatory = $false)]
    [string]$InstanceIP = "44.200.182.180",
    
    [Parameter(Mandatory = $false)]
    [string]$KeyPath = "$HOME\.ssh\aws-eb",
    
    [Parameter(Mandatory = $false)]
    [switch]$ConfirmFirst = $true
)

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  PataBima EC2 Deployment Rollback" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Show what will be rolled back
Write-Host "This will remove the following from EC2 ($InstanceIP):" -ForegroundColor Yellow
Write-Host "  • Gunicorn service (patabima)" -ForegroundColor White
Write-Host "  • Nginx configuration for PataBima" -ForegroundColor White
Write-Host "  • Application files (/var/www/patabima)" -ForegroundColor White
Write-Host "  • Application logs" -ForegroundColor White
Write-Host ""
Write-Host "The EC2 instance itself will remain running." -ForegroundColor Green
Write-Host "System packages (Python, Nginx, PostgreSQL client) will remain installed." -ForegroundColor Green
Write-Host ""

if ($ConfirmFirst) {
    $response = Read-Host "Do you want to proceed? (yes/no)"
    if ($response -ne "yes") {
        Write-Host "Rollback cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "Starting rollback..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload rollback script to EC2
Write-Host "[1/3] Uploading rollback script to EC2..." -ForegroundColor Yellow
$scriptPath = Join-Path $PSScriptRoot "rollback_ec2_deployment.sh"

if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ Error: Rollback script not found at $scriptPath" -ForegroundColor Red
    exit 1
}

scp -i $KeyPath -o StrictHostKeyChecking=no $scriptPath "ec2-user@${InstanceIP}:/tmp/rollback_ec2_deployment.sh"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload rollback script" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Script uploaded" -ForegroundColor Green
Write-Host ""

# Step 2: Make script executable
Write-Host "[2/3] Making script executable..." -ForegroundColor Yellow
ssh -i $KeyPath -o StrictHostKeyChecking=no "ec2-user@${InstanceIP}" "chmod +x /tmp/rollback_ec2_deployment.sh"
Write-Host "✓ Done" -ForegroundColor Green
Write-Host ""

# Step 3: Execute rollback script
Write-Host "[3/3] Executing rollback on EC2..." -ForegroundColor Yellow
Write-Host ""
Write-Host "─────────────────────────────────────────" -ForegroundColor DarkGray

ssh -i $KeyPath -o StrictHostKeyChecking=no "ec2-user@${InstanceIP}" "bash /tmp/rollback_ec2_deployment.sh"

Write-Host "─────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

if ($LASTEXITCODE -eq 0) {
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "✓ Rollback Completed Successfully!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your EC2 instance is now in a clean state." -ForegroundColor White
    Write-Host "You can redeploy anytime with:" -ForegroundColor White
    Write-Host "  .\deployment\complete_ec2_deployment.ps1" -ForegroundColor Cyan
    Write-Host ""
}
else {
    Write-Host "❌ Rollback encountered errors" -ForegroundColor Red
    Write-Host "Check the output above for details." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can manually connect and investigate:" -ForegroundColor White
    Write-Host "  ssh -i $KeyPath ec2-user@${InstanceIP}" -ForegroundColor Cyan
    exit 1
}
