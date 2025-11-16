#!/usr/bin/env pwsh
# Sync local code changes to EC2 via S3

param(
    [string]$EC2IP = "44.200.182.180",
    [switch]$RestartServices
)

Write-Host "🔄 Syncing code to EC2..." -ForegroundColor Cyan

# 1. Upload entire app directory to S3
Write-Host "`n📤 Uploading to S3..." -ForegroundColor Yellow
aws s3 sync insurance-app/app s3://patabima-media-prod/deployment/app/ `
    --exclude "*.pyc" `
    --exclude "__pycache__/*" `
    --exclude "*.log" `
    --delete `
    --region us-east-1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ S3 upload failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Uploaded to S3" -ForegroundColor Green

# 2. Generate EC2 commands
$ec2Commands = @"
cd /var/www/patabima

# Backup current code
cp -r app app_backup_`$(date +%Y%m%d_%H%M%S)

# Download from S3
aws s3 sync s3://patabima-media-prod/deployment/app/ app/ --delete

# Clear Python cache
find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true

echo "✅ Code synced successfully"
"@

if ($RestartServices) {
    $ec2Commands += @"

# Restart services
sudo systemctl restart patabima
sudo systemctl status patabima --no-pager -l

echo "✅ Services restarted"
"@
}

Write-Host "`n📋 Run these commands on EC2:" -ForegroundColor Cyan
Write-Host $ec2Commands -ForegroundColor White

Write-Host "`n💡 To apply automatically, run:" -ForegroundColor Yellow
Write-Host "   ./sync_code_to_ec2.ps1 -RestartServices" -ForegroundColor White
