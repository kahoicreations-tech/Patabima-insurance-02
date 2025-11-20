# Redeploy via AWS Systems Manager (No SSH Key Required)
# Uses AWS SSM to execute deployment commands

param(
    [string]$InstanceId = "i-0d0f116005d812275",
    [string]$ZipFile = ""
)

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 PataBima Backend Redeployment via SSM" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor DarkGray

# 1. Find latest deployment ZIP
if ([string]::IsNullOrEmpty($ZipFile)) {
    $ZipFile = Get-Item "patabima-backend-*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty Name
}

Write-Host "`n📦 Deployment Package:" -ForegroundColor Yellow
Write-Host "  File: $ZipFile" -ForegroundColor White

# 2. Ensure it's uploaded to S3
Write-Host "`n☁️  Verifying S3 upload..." -ForegroundColor Yellow
$s3Check = aws s3 ls "s3://patabima-media-prod/deployment/$ZipFile" --region us-east-1 2>$null

if (-not $s3Check) {
    Write-Host "  ⬆️  Uploading to S3..." -ForegroundColor Cyan
    aws s3 cp $ZipFile "s3://patabima-media-prod/deployment/" --region us-east-1
    Write-Host "  ✅ Uploaded" -ForegroundColor Green
}
else {
    Write-Host "  ✅ Already in S3" -ForegroundColor Green
}

# 3. Create deployment commands as array (avoids PowerShell parsing issues)
$commands = @(
    "set -e",
    "echo '🚀 PataBima Backend Deployment'",
    "echo '=============================='",
    "echo ''",
    "echo '⏸️  Stopping services...'",
    "sudo systemctl stop patabima 2>/dev/null || true",
    "sudo systemctl stop nginx 2>/dev/null || true",
    "echo ''",
    "echo '💾 Creating backup...'",
    'if [ -d /var/www/patabima/insurance-app ]; then sudo mv /var/www/patabima/insurance-app /var/www/patabima/insurance-app.backup.$(date +%Y%m%d_%H%M%S) || true; fi',
    "echo ''",
    "echo '⬇️  Downloading deployment...'",
    "cd /tmp",
    "aws s3 cp s3://patabima-media-prod/deployment/$ZipFile ./ --region us-east-1",
    "echo ''",
    "echo '📂 Extracting...'",
    "sudo mkdir -p /var/www/patabima/insurance-app",
    "sudo unzip -qo $ZipFile -d /var/www/patabima/insurance-app/",
    "echo ''",
    "echo '🔒 Setting permissions...'",
    "sudo chown -R ec2-user:ec2-user /var/www/patabima",
    "sudo chmod -R 755 /var/www/patabima",
    "echo ''",
    "echo '📦 Installing dependencies...'",
    "cd /var/www/patabima",
    "if [ ! -d venv ]; then python3.11 -m venv venv; fi",
    "source venv/bin/activate",
    "pip install --quiet --upgrade pip",
    "pip install --quiet -r insurance-app/requirements.txt",
    "echo ''",
    "echo '🗄️  Running migrations...'",
    "cd insurance-app",
    "python manage.py migrate --noinput",
    "echo ''",
    "echo '📁 Collecting static files...'",
    "python manage.py collectstatic --noinput",
    "echo ''",
    "echo '▶️  Starting services...'",
    "sudo systemctl start patabima",
    "sudo systemctl start nginx",
    "echo ''",
    "sleep 3",
    "echo '✅ Service Status:'",
    "sudo systemctl is-active patabima",
    "sudo systemctl is-active nginx",
    "echo ''",
    "echo '🏥 Health check:'",
    "sleep 2",
    "curl -s http://localhost/api/v1/health/ | python -m json.tool || echo '⚠️  Health check failed'",
    "echo ''",
    "echo '✅ Deployment complete!'",
    "rm -f /tmp/$ZipFile"
)

# 4. Execute via SSM
Write-Host "`n🔧 Executing deployment via SSM..." -ForegroundColor Cyan
Write-Host "  Instance: $InstanceId" -ForegroundColor White

try {
    # Convert commands array to JSON for SSM
    $commandsJson = $commands | ConvertTo-Json -Compress
    
    $result = aws ssm send-command `
        --instance-ids $InstanceId `
        --document-name "AWS-RunShellScript" `
        --parameters commands=$commandsJson `
        --region us-east-1 `
        --output json | ConvertFrom-Json
    
    $commandId = $result.Command.CommandId
    
    Write-Host "  ✅ Command sent: $commandId" -ForegroundColor Green
    Write-Host ""
    Write-Host "⏳ Waiting for deployment to complete..." -ForegroundColor Yellow
    Write-Host "   This may take 2-3 minutes..." -ForegroundColor DarkGray
    
    # Wait for command to complete
    $status = "Pending"
    $attempts = 0
    $maxAttempts = 40  # 40 x 5 seconds = 3 minutes max
    
    while (($status -eq "Pending" -or $status -eq "InProgress") -and $attempts -lt $maxAttempts) {
        Start-Sleep -Seconds 5
        $attempts++
        
        $statusResult = aws ssm get-command-invocation `
            --command-id $commandId `
            --instance-id $InstanceId `
            --region us-east-1 `
            --output json 2>$null | ConvertFrom-Json
        
        $status = $statusResult.Status
        
        Write-Host "  [$attempts/$maxAttempts] Status: $status" -ForegroundColor Cyan
    }
    
    # Get final output
    Write-Host ""
    Write-Host "📄 Deployment Output:" -ForegroundColor Yellow
    Write-Host "-" * 60 -ForegroundColor DarkGray
    
    $finalResult = aws ssm get-command-invocation `
        --command-id $commandId `
        --instance-id $InstanceId `
        --region us-east-1 `
        --output json | ConvertFrom-Json
    
    Write-Host $finalResult.StandardOutputContent -ForegroundColor White
    
    if ($finalResult.StandardErrorContent) {
        Write-Host "`n⚠️  Errors:" -ForegroundColor Yellow
        Write-Host $finalResult.StandardErrorContent -ForegroundColor Red
    }
    
    if ($finalResult.Status -eq "Success") {
        Write-Host ""
        Write-Host "=" * 60 -ForegroundColor Green
        Write-Host "✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green -BackgroundColor DarkGreen
        Write-Host "=" * 60 -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 Your API is live at:" -ForegroundColor Cyan
        Write-Host "   http://44.200.182.180/api/v1/health/" -ForegroundColor White
        Write-Host ""
        Write-Host "🧪 Test endpoints:" -ForegroundColor Cyan
        Write-Host "   curl http://44.200.182.180/api/v1/motor2/categories/" -ForegroundColor DarkGray
        Write-Host ""
    }
    else {
        Write-Host ""
        Write-Host "❌ DEPLOYMENT FAILED!" -ForegroundColor Red
        Write-Host "   Status: $($finalResult.Status)" -ForegroundColor Yellow
        Write-Host "   Check the output above for errors" -ForegroundColor Yellow
        exit 1
    }
    
}
catch {
    Write-Host ""
    Write-Host "❌ SSM Command Failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 Troubleshooting:" -ForegroundColor Cyan
    Write-Host "   1. Check if SSM agent is running on EC2" -ForegroundColor White
    Write-Host "   2. Verify IAM permissions for SSM" -ForegroundColor White
    Write-Host "   3. Check instance ID: $InstanceId" -ForegroundColor White
    exit 1
}

Write-Host ""
