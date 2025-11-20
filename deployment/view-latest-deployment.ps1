# View Latest EC2 Deployment
# Shows what was deployed on November 14, 2025

Write-Host "`n🔍 Checking Latest EC2 Deployment..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor DarkGray

# Check S3 deployment metadata
Write-Host "`n📦 S3 Deployment Archive:" -ForegroundColor Yellow
aws s3api head-object --bucket patabima-media-prod --key deployment/patabima-backend.zip --region us-east-1 --query '{LastModified:LastModified,Size:ContentLength}' --output table

Write-Host "`n📁 Local Backend ZIP:" -ForegroundColor Yellow
if (Test-Path ".\patabima-backend.zip") {
    $localZip = Get-Item ".\patabima-backend.zip"
    Write-Host "  File: $($localZip.Name)" -ForegroundColor White
    Write-Host "  Date: $($localZip.LastWriteTime)" -ForegroundColor White
    Write-Host "  Size: $([math]::Round($localZip.Length/1MB, 2)) MB" -ForegroundColor White
}
elseif (Test-Path "..\patabima-backend.zip") {
    $localZip = Get-Item "..\patabima-backend.zip"
    Write-Host "  File: $($localZip.Name)" -ForegroundColor White
    Write-Host "  Date: $($localZip.LastWriteTime)" -ForegroundColor White
    Write-Host "  Size: $([math]::Round($localZip.Length/1MB, 2)) MB" -ForegroundColor White
}
else {
    Write-Host "  ⚠️  No local backend ZIP found" -ForegroundColor Red
}

Write-Host "`n🚀 Deployment Scripts:" -ForegroundColor Yellow
Get-ChildItem -Path "." -Filter "*.sh" | Where-Object { $_.Name -like "*deploy*" -or $_.Name -like "*setup*" } | 
Sort-Object LastWriteTime -Descending | 
Select-Object -First 5 Name, LastWriteTime | 
Format-Table -AutoSize

Write-Host "`n⚙️  Configuration Files:" -ForegroundColor Yellow
Get-ChildItem -Path ".\systemd\", ".\nginx\" -ErrorAction SilentlyContinue | 
Sort-Object LastWriteTime -Descending | 
Select-Object Name, DirectoryName, LastWriteTime | 
Format-Table -AutoSize

Write-Host "`n🌐 Live EC2 Instance:" -ForegroundColor Yellow
aws ec2 describe-instances --instance-ids i-0d0f116005d812275 --region us-east-1 --query 'Reservations[0].Instances[0].[InstanceId,State.Name,PublicIpAddress,LaunchTime]' --output table

Write-Host "`n✅ API Health Check:" -ForegroundColor Yellow
try {
    $health = curl -s http://44.200.182.180/api/v1/health/ 2>$null | ConvertFrom-Json
    Write-Host "  Status: $($health.status)" -ForegroundColor Green
    Write-Host "  Service: $($health.service)" -ForegroundColor Green
}
catch {
    Write-Host "  ⚠️  Could not reach API" -ForegroundColor Red
}

Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor DarkGray

# Offer to download and inspect the deployed code
Write-Host "`n📥 Options:" -ForegroundColor Cyan
Write-Host "  1. Download latest deployment from S3" -ForegroundColor White
Write-Host "  2. Extract and view file list" -ForegroundColor White
Write-Host "  3. Compare with current local code" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter option (1-3) or press Enter to skip"

switch ($choice) {
    "1" {
        Write-Host "`n⬇️  Downloading from S3..." -ForegroundColor Yellow
        aws s3 cp s3://patabima-media-prod/deployment/patabima-backend.zip ./latest-deployment.zip --region us-east-1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Downloaded to: latest-deployment.zip" -ForegroundColor Green
            Write-Host "  Size: $([math]::Round((Get-Item latest-deployment.zip).Length/1MB, 2)) MB" -ForegroundColor White
        }
    }
    "2" {
        Write-Host "`n📂 Extracting deployment archive..." -ForegroundColor Yellow
        
        # Download if not exists
        if (-not (Test-Path "latest-deployment.zip")) {
            aws s3 cp s3://patabima-media-prod/deployment/patabima-backend.zip ./latest-deployment.zip --region us-east-1
        }
        
        # Extract to temp directory
        $tempDir = ".\temp-deployment-view"
        if (Test-Path $tempDir) {
            Remove-Item -Path $tempDir -Recurse -Force
        }
        Expand-Archive -Path "latest-deployment.zip" -DestinationPath $tempDir -Force
        
        Write-Host "`n📋 Deployed Files:" -ForegroundColor Cyan
        Get-ChildItem -Path $tempDir -Recurse -File | 
        Select-Object -First 50 @{N = 'File'; E = { $_.FullName.Replace($tempDir, '').TrimStart('\') } } | 
        Format-Table -AutoSize
        
        Write-Host "`n✅ Extracted to: $tempDir" -ForegroundColor Green
        Write-Host "  You can now inspect the deployed code" -ForegroundColor White
    }
    "3" {
        Write-Host "`n🔍 Comparing deployments..." -ForegroundColor Yellow
        Write-Host "  This feature requires the deployment to be extracted first" -ForegroundColor White
        Write-Host "  Run option 2, then manually compare files" -ForegroundColor White
    }
    default {
        Write-Host "`nℹ️  Skipping file inspection" -ForegroundColor DarkGray
    }
}

Write-Host ""
