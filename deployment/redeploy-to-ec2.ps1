# Redeploy PataBima Backend to EC2
# Updates the running EC2 instance with latest code

param(
    [string]$ZipFile = "",
    [string]$EC2IP = "44.200.182.180",
    [string]$KeyFile = "patabima-ec2-key.pem"
)

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 PataBima Backend Redeployment to EC2" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor DarkGray

# 1. Find latest deployment ZIP
if ([string]::IsNullOrEmpty($ZipFile)) {
    $ZipFile = Get-Item "..\patabima-backend-*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty Name
    if (-not $ZipFile) {
        Write-Host "❌ No deployment ZIP found!" -ForegroundColor Red
        Write-Host "   Run: cd insurance-app; Compress-Archive ... " -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "`n📦 Deployment Package:" -ForegroundColor Yellow
Write-Host "  File: $ZipFile" -ForegroundColor White
Write-Host "  Size: $([math]::Round((Get-Item "..\$ZipFile").Length/1MB, 2)) MB" -ForegroundColor White

# 2. Check if already uploaded to S3
Write-Host "`n☁️  Checking S3..." -ForegroundColor Yellow
$s3Check = aws s3 ls "s3://patabima-media-prod/deployment/$ZipFile" --region us-east-1 2>$null

if (-not $s3Check) {
    Write-Host "  ⬆️  Uploading to S3..." -ForegroundColor Cyan
    aws s3 cp "..\$ZipFile" "s3://patabima-media-prod/deployment/" --region us-east-1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ Upload failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✅ Uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "  ✅ Already in S3" -ForegroundColor Green
}

# 3. Create deployment script for EC2
Write-Host "`n📝 Creating deployment script..." -ForegroundColor Yellow

$deployScript = @"
#!/bin/bash
set -e

echo ""
echo "🚀 PataBima Backend Deployment"
echo "=============================="

# Stop services
echo ""
echo "⏸️  Stopping services..."
sudo systemctl stop patabima 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true

# Backup current deployment
echo ""
echo "💾 Creating backup..."
if [ -d /var/www/patabima/insurance-app ]; then
    sudo mv /var/www/patabima/insurance-app /var/www/patabima/insurance-app.backup.\$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
fi

# Download new deployment
echo ""
echo "⬇️  Downloading new deployment..."
cd /tmp
aws s3 cp s3://patabima-media-prod/deployment/$ZipFile ./ --region us-east-1

# Extract
echo ""
echo "📂 Extracting..."
sudo mkdir -p /var/www/patabima/insurance-app
sudo unzip -o $ZipFile -d /var/www/patabima/insurance-app/

# Set permissions
echo ""
echo "🔒 Setting permissions..."
sudo chown -R ec2-user:ec2-user /var/www/patabima
sudo chmod -R 755 /var/www/patabima

# Activate venv and install requirements
echo ""
echo "📦 Installing dependencies..."
cd /var/www/patabima
if [ ! -d venv ]; then
    python3.11 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r insurance-app/requirements.txt

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
cd insurance-app
python manage.py migrate --noinput

# Collect static files
echo ""
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Start services
echo ""
echo "▶️  Starting services..."
sudo systemctl start patabima
sudo systemctl start nginx

# Wait and check status
sleep 3
echo ""
echo "✅ Deployment Status:"
sudo systemctl status patabima --no-pager | head -10
echo ""
sudo systemctl status nginx --no-pager | head -10

# Test health endpoint
echo ""
echo "🏥 Testing health endpoint..."
sleep 2
curl -s http://localhost/api/v1/health/ || echo "⚠️  Health check failed"

echo ""
echo "✅ Deployment complete!"
echo ""

# Cleanup
rm -f /tmp/$ZipFile
"@

$deployScript | Out-File -FilePath ".\redeploy-script.sh" -Encoding ASCII -NoNewline

# 4. Check EC2 connectivity
Write-Host "`n🌐 Checking EC2 connectivity..." -ForegroundColor Yellow
$pingResult = Test-Connection -ComputerName $EC2IP -Count 1 -Quiet
if (-not $pingResult) {
    Write-Host "  ⚠️  EC2 instance not responding to ping" -ForegroundColor Yellow
    Write-Host "  This is normal if ICMP is blocked. Continuing..." -ForegroundColor DarkGray
}

# 5. Upload and execute deployment script
Write-Host "`n🚀 Deploying to EC2..." -ForegroundColor Cyan
Write-Host "  Instance: $EC2IP" -ForegroundColor White

# Check for SSH key
if (-not (Test-Path $KeyFile)) {
    Write-Host "  ❌ SSH key not found: $KeyFile" -ForegroundColor Red
    Write-Host "  Please ensure the key file is in the current directory" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Alternative: Run deployment via AWS Systems Manager (SSM)" -ForegroundColor Cyan
    Write-Host "  Command:" -ForegroundColor White
    Write-Host "  aws ssm send-command --instance-ids i-0d0f116005d812275 --document-name `"AWS-RunShellScript`" --parameters commands=`"$(Get-Content .\redeploy-script.sh | Out-String)`"" -ForegroundColor DarkGray
    exit 1
}

# Execute via SSH
Write-Host "`n  📤 Uploading deployment script..." -ForegroundColor Cyan
scp -i $KeyFile -o StrictHostKeyChecking=no .\redeploy-script.sh ec2-user@${EC2IP}:/tmp/

Write-Host "  🔧 Executing deployment..." -ForegroundColor Cyan
ssh -i $KeyFile -o StrictHostKeyChecking=no ec2-user@$EC2IP "chmod +x /tmp/redeploy-script.sh && /tmp/redeploy-script.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green -BackgroundColor DarkGreen
    Write-Host ""
    Write-Host "🌐 Your API is now live at:" -ForegroundColor Cyan
    Write-Host "   http://$EC2IP/api/v1/health/" -ForegroundColor White
    Write-Host ""
    Write-Host "🧪 Test Motor 2 endpoints:" -ForegroundColor Cyan
    Write-Host "   curl http://$EC2IP/api/v1/motor2/categories/" -ForegroundColor DarkGray
    Write-Host ""
} else {
    Write-Host "`n❌ DEPLOYMENT FAILED!" -ForegroundColor Red
    Write-Host "   Check the error messages above" -ForegroundColor Yellow
    exit 1
}

# Cleanup
Remove-Item .\redeploy-script.sh -Force -ErrorAction SilentlyContinue

Write-Host ""
