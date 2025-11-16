# Complete EC2 Deployment Script - PataBima Insurance Backend
# Run this from PowerShell on your Windows machine
# Requires: AWS CLI configured with KAHOI-KREATIONS credentials

$ErrorActionPreference = "Stop"

# Configuration
$INSTANCE_ID = "i-0d0f116005d812275"
$PUBLIC_IP = "44.200.182.180"
$AWS_REGION = "us-east-1"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "PataBima EC2 Deployment Completion Script" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify instance is running
Write-Host "[1/6] Verifying EC2 instance status..." -ForegroundColor Yellow
$instance = aws ec2 describe-instances `
    --instance-ids $INSTANCE_ID `
    --region $AWS_REGION `
    --query 'Reservations[0].Instances[0].{State:State.Name,PublicIp:PublicIpAddress}' `
    --output json | ConvertFrom-Json

if ($instance.State -ne "running") {
    Write-Host "ERROR: Instance is not running. Current state: $($instance.State)" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Instance is running at $($instance.PublicIp)" -ForegroundColor Green
Write-Host ""

# Step 2: Create deployment script
Write-Host "[2/6] Creating deployment script..." -ForegroundColor Yellow

$deploymentScript = @'
#!/bin/bash
set -euo pipefail

echo "=== PataBima Deployment Script ==="
echo "Started at: $(date)"
echo ""

PUBIP=44.200.182.180
APP_DIR="/var/www/patabima"

# 1. Backup current .env
echo "[1/5] Backing up .env file..."
if [ -f $APP_DIR/.env ]; then
    sudo cp $APP_DIR/.env $APP_DIR/.env.bak.$(date +%s)
    echo "✓ Backup created"
else
    echo "! No existing .env found"
fi

# 2. Update .env with correct settings
echo "[2/5] Updating environment variables..."
cd $APP_DIR

# Remove old SSL redirect settings
sudo sed -i '/^ENABLE_SSL_REDIRECT=/d' .env
sudo sed -i '/^SECURE_SSL_REDIRECT=/d' .env

# Add proper settings (disable SSL redirect for now)
echo "ENABLE_SSL_REDIRECT=0" | sudo tee -a .env >/dev/null
echo "SECURE_SSL_REDIRECT=0" | sudo tee -a .env >/dev/null

# Verify ALLOWED_HOSTS includes current IP
if ! grep -q "$PUBIP" .env; then
    HOSTNAME_FQDN=$(hostname -f)
    sudo sed -i "s/^ALLOWED_HOSTS=.*/ALLOWED_HOSTS=$PUBIP,api.patabima.co.ke,localhost,127.0.0.1,$HOSTNAME_FQDN/" .env
fi

echo "✓ Environment updated"
echo "Current ALLOWED_HOSTS: $(grep ALLOWED_HOSTS .env)"
echo "SSL Redirect disabled: ENABLE_SSL_REDIRECT=0"

# 3. Run Django migrations
echo "[3/5] Running database migrations..."
source venv/bin/activate
export $(grep -v '^#' .env | xargs) 2>/dev/null || true

python manage.py migrate --noinput || {
    echo "! Migration warning (may need RDS security group update)"
}

# 4. Collect static files
echo "[4/5] Collecting static files..."
python manage.py collectstatic --noinput || {
    echo "! Static collection warning"
}

# 5. Restart services
echo "[5/5] Restarting Gunicorn and Nginx..."
sudo systemctl restart patabima
sleep 2
sudo systemctl restart nginx

echo "✓ Services restarted"
echo ""

# Final status check
echo "=== Service Status ==="
sudo systemctl is-active patabima && echo "✓ Gunicorn: Running" || echo "✗ Gunicorn: Failed"
sudo systemctl is-active nginx && echo "✓ Nginx: Running" || echo "✗ Nginx: Failed"
echo ""

# Test endpoints locally
echo "=== Testing Endpoints ==="
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://$PUBIP/" || echo "000")
echo "GET / returned: $HTTP_STATUS"

API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://$PUBIP/api/motor2/categories/" || echo "000")
echo "GET /api/motor2/categories/ returned: $API_STATUS"

if [ "$HTTP_STATUS" = "301" ]; then
    echo "⚠ Still getting 301 redirect - check Django settings"
elif [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "302" ]; then
    echo "✓ Root endpoint responding"
fi

if [ "$API_STATUS" = "200" ] || [ "$API_STATUS" = "401" ]; then
    echo "✓ API endpoint responding correctly"
elif [ "$API_STATUS" = "301" ]; then
    echo "⚠ API still redirecting to HTTPS"
else
    echo "⚠ API returned unexpected status: $API_STATUS"
fi

echo ""
echo "=== Deployment Complete ==="
echo "Finished at: $(date)"
'@

$scriptPath = Join-Path $env:TEMP "patabima_deploy_$(Get-Date -Format 'yyyyMMdd_HHmmss').sh"
[IO.File]::WriteAllText($scriptPath, $deploymentScript, [System.Text.Encoding]::UTF8)
Write-Host "✓ Script created: $scriptPath" -ForegroundColor Green
Write-Host ""

# Step 3: Send script via SSM (preferred) or provide SSH instructions
Write-Host "[3/6] Attempting deployment via AWS Systems Manager..." -ForegroundColor Yellow

try {
    # Check if instance is SSM-managed
    $ssmInfo = aws ssm describe-instance-information `
        --region $AWS_REGION `
        --query "InstanceInformationList[?InstanceId=='$INSTANCE_ID']" `
        --output json | ConvertFrom-Json

    if ($ssmInfo.Count -eq 0) {
        Write-Host "! SSM not available for this instance" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please run the deployment script manually via EC2 Instance Connect:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Open AWS Console → EC2 → Instances" -ForegroundColor White
        Write-Host "2. Select instance: $INSTANCE_ID" -ForegroundColor White
        Write-Host "3. Click 'Connect' → 'EC2 Instance Connect' → 'Connect'" -ForegroundColor White
        Write-Host "4. Paste and run the following:" -ForegroundColor White
        Write-Host ""
        Write-Host $deploymentScript -ForegroundColor Gray
        Write-Host ""
        Write-Host "After running, press Enter to continue with verification..." -ForegroundColor Yellow
        Read-Host
    }
    else {
        Write-Host "✓ SSM available, sending commands..." -ForegroundColor Green
        
        # Upload script content via SSM RunShellScript
        $commandId = aws ssm send-command `
            --instance-ids $INSTANCE_ID `
            --region $AWS_REGION `
            --document-name "AWS-RunShellScript" `
            --parameters "commands=[$deploymentScript]" `
            --query 'Command.CommandId' `
            --output text

        Write-Host "✓ Command sent: $commandId" -ForegroundColor Green
        Write-Host "Waiting for execution (30s)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30

        # Get command output
        $output = aws ssm get-command-invocation `
            --command-id $commandId `
            --instance-id $INSTANCE_ID `
            --region $AWS_REGION `
            --query 'StandardOutputContent' `
            --output text

        Write-Host $output
    }
}
catch {
    Write-Host "! SSM command failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Falling back to manual instructions..." -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Test HTTP endpoint from local machine
Write-Host "[4/6] Testing HTTP endpoint from local machine..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://$PUBLIC_IP/" -UseBasicParsing -TimeoutSec 10 -MaximumRedirection 0 -ErrorAction Stop
    Write-Host "✓ GET / returned: $($response.StatusCode)" -ForegroundColor Green
}
catch {
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        if ($statusCode -eq 301 -or $statusCode -eq 302) {
            Write-Host "⚠ Still getting $statusCode redirect to HTTPS" -ForegroundColor Yellow
            Write-Host "  This may require checking Django settings.py manually" -ForegroundColor Yellow
        }
        else {
            Write-Host "✓ GET / returned: $statusCode" -ForegroundColor Green
        }
    }
    else {
        Write-Host "✗ Connection failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Step 5: Test API endpoint
Write-Host "[5/6] Testing API endpoint..." -ForegroundColor Yellow

try {
    $apiResponse = Invoke-WebRequest -Uri "http://$PUBLIC_IP/api/motor2/categories/" -UseBasicParsing -TimeoutSec 10 -MaximumRedirection 0 -ErrorAction Stop
    Write-Host "✓ API returned: $($apiResponse.StatusCode)" -ForegroundColor Green
    
    if ($apiResponse.StatusCode -eq 200) {
        Write-Host "Response preview:" -ForegroundColor Cyan
        $preview = $apiResponse.Content.Substring(0, [Math]::Min(300, $apiResponse.Content.Length))
        Write-Host $preview -ForegroundColor Gray
    }
}
catch {
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        if ($statusCode -eq 301 -or $statusCode -eq 302) {
            Write-Host "⚠ API still redirecting ($statusCode)" -ForegroundColor Yellow
        }
        elseif ($statusCode -eq 401) {
            Write-Host "✓ API requires authentication (401) - this is normal" -ForegroundColor Green
        }
        else {
            Write-Host "API returned: $statusCode" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "✗ API test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Step 6: Summary and next steps
Write-Host "[6/6] Deployment Summary" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Instance ID: $INSTANCE_ID" -ForegroundColor White
Write-Host "Public IP: $PUBLIC_IP" -ForegroundColor White
Write-Host "Access URLs:" -ForegroundColor White
Write-Host "  - HTTP: http://$PUBLIC_IP/" -ForegroundColor Cyan
Write-Host "  - API: http://$PUBLIC_IP/api/motor2/categories/" -ForegroundColor Cyan
Write-Host "  - Admin: http://$PUBLIC_IP/admin/" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. If still getting 301 redirects:" -ForegroundColor White
Write-Host "     - Check insurance/settings.py line 154" -ForegroundColor Gray
Write-Host "     - Verify .env has ENABLE_SSL_REDIRECT=0" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Set up DNS:" -ForegroundColor White
Write-Host "     - Point api.patabima.co.ke → $PUBLIC_IP" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Install SSL certificate:" -ForegroundColor White
Write-Host "     - sudo certbot --nginx -d api.patabima.co.ke" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Create Django superuser:" -ForegroundColor White
Write-Host "     - cd /var/www/patabima && source venv/bin/activate" -ForegroundColor Gray
Write-Host "     - python manage.py createsuperuser" -ForegroundColor Gray
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Deployment script completed!" -ForegroundColor Green
Write-Host ""
