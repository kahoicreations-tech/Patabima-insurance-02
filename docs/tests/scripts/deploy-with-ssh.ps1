# EC2 SSH Key Setup and Deployment Script
# ==========================================

$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "EC2 SSH Key Setup & Deployment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$EC2_HOST = "ec2-34-203-241-81.compute-1.amazonaws.com"
$EC2_USER = "ubuntu"

# Step 1: Find or request SSH key
Write-Host "Step 1: Locating SSH Key..." -ForegroundColor Yellow
Write-Host ""

$possibleKeyLocations = @(
    "$env:USERPROFILE\.ssh\*.pem",
    "$env:USERPROFILE\Downloads\*.pem",
    "$env:USERPROFILE\Documents\*.pem",
    ".\*.pem"
)

$foundKeys = @()
foreach ($location in $possibleKeyLocations) {
    $keys = Get-ChildItem -Path $location -ErrorAction SilentlyContinue
    if ($keys) {
        $foundKeys += $keys
    }
}

if ($foundKeys.Count -gt 0) {
    Write-Host "Found the following .pem files:" -ForegroundColor Green
    for ($i = 0; $i -lt $foundKeys.Count; $i++) {
        Write-Host "  [$i] $($foundKeys[$i].FullName)" -ForegroundColor White
    }
    Write-Host ""
    $selection = Read-Host "Enter the number of your EC2 key file (or press Enter to specify path manually)"
    
    if ($selection -match '^\d+$' -and [int]$selection -lt $foundKeys.Count) {
        $EC2_KEY_PATH = $foundKeys[[int]$selection].FullName
    } else {
        $EC2_KEY_PATH = Read-Host "Enter the full path to your .pem file"
    }
} else {
    Write-Host "No .pem files found automatically." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please provide your EC2 SSH key (.pem file):" -ForegroundColor Yellow
    Write-Host "1. Download it from AWS Console (EC2 > Key Pairs)" -ForegroundColor Gray
    Write-Host "2. Or enter the path if you already have it" -ForegroundColor Gray
    Write-Host ""
    $EC2_KEY_PATH = Read-Host "Enter the full path to your .pem file"
}

# Verify key exists
if (-not (Test-Path $EC2_KEY_PATH)) {
    Write-Host ""
    Write-Host "❌ Error: Key file not found at: $EC2_KEY_PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "To get your EC2 SSH key:" -ForegroundColor Yellow
    Write-Host "1. Go to AWS Console: https://console.aws.amazon.com/ec2/" -ForegroundColor White
    Write-Host "2. Navigate to: EC2 > Network & Security > Key Pairs" -ForegroundColor White
    Write-Host "3. Find your key pair for this EC2 instance" -ForegroundColor White
    Write-Host "4. If you don't have it, you'll need to:" -ForegroundColor White
    Write-Host "   - Create a new key pair" -ForegroundColor Gray
    Write-Host "   - Stop your EC2 instance" -ForegroundColor Gray
    Write-Host "   - Detach root volume" -ForegroundColor Gray
    Write-Host "   - Attach to another instance to modify authorized_keys" -ForegroundColor Gray
    Write-Host "   OR use AWS Systems Manager Session Manager instead" -ForegroundColor Gray
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Using key: $EC2_KEY_PATH" -ForegroundColor Green
Write-Host ""

# Step 2: Test SSH Connection
Write-Host "Step 2: Testing SSH connection to EC2..." -ForegroundColor Yellow
Write-Host "Host: $EC2_HOST" -ForegroundColor Gray
Write-Host ""

try {
    $testResult = ssh -i $EC2_KEY_PATH -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" "echo 'Connection successful'" 2>&1
    
    if ($testResult -match "Connection successful") {
        Write-Host "✅ SSH connection verified!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Warning: Unexpected SSH response" -ForegroundColor Yellow
        Write-Host $testResult -ForegroundColor Gray
        $continue = Read-Host "Continue anyway? (y/n)"
        if ($continue -ne 'y') { exit 1 }
    }
} catch {
    Write-Host "❌ SSH connection failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Gray
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check EC2 Security Group allows SSH (port 22) from your IP" -ForegroundColor White
    Write-Host "2. Verify EC2 instance is running" -ForegroundColor White
    Write-Host "3. Ensure key file permissions are correct" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Step 3: Confirm deployment
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Ready to Deploy!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  • Backup current deployment on EC2" -ForegroundColor White
Write-Host "  • Upload insurance-app code to EC2" -ForegroundColor White
Write-Host "  • Install Python dependencies" -ForegroundColor White
Write-Host "  • Run database migrations" -ForegroundColor White
Write-Host "  • Seed motor2 categories and pricing" -ForegroundColor White
Write-Host "  • Restart Django server" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "Continue with deployment? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}
Write-Host ""

# Step 4: Create backup on EC2
Write-Host "Step 3/8: Creating backup..." -ForegroundColor Yellow
$backupScript = @'
if [ -d "/home/ubuntu/insurance-app" ]; then
    BACKUP_DIR="/home/ubuntu/insurance-app-backup-$(date +%Y%m%d-%H%M%S)"
    echo "Creating backup at: $BACKUP_DIR"
    cp -r /home/ubuntu/insurance-app "$BACKUP_DIR"
    echo "✅ Backup created"
else
    echo "⚠️  No existing deployment"
fi
'@
ssh -i $EC2_KEY_PATH "$EC2_USER@$EC2_HOST" $backupScript
Write-Host ""

# Step 5: Upload files
Write-Host "Step 4/8: Uploading insurance-app to EC2..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray

# Create a temporary zip to speed up transfer
$tempZip = "$env:TEMP\insurance-app-$(Get-Date -Format 'yyyyMMddHHmmss').zip"
Write-Host "Creating zip archive..." -ForegroundColor Gray
Compress-Archive -Path ".\insurance-app\*" -DestinationPath $tempZip -Force

# Upload zip file
Write-Host "Uploading to EC2..." -ForegroundColor Gray
scp -i $EC2_KEY_PATH $tempZip "${EC2_USER}@${EC2_HOST}:/home/ubuntu/insurance-app-new.zip"

# Extract on EC2
Write-Host "Extracting files on EC2..." -ForegroundColor Gray
ssh -i $EC2_KEY_PATH "$EC2_USER@$EC2_HOST" @"
cd /home/ubuntu
mkdir -p insurance-app
unzip -o insurance-app-new.zip -d insurance-app/
rm insurance-app-new.zip
echo '✅ Files uploaded and extracted'
"@

# Clean up local temp file
Remove-Item $tempZip -Force
Write-Host "✅ Upload complete!" -ForegroundColor Green
Write-Host ""

# Step 6: Install dependencies
Write-Host "Step 5/8: Installing dependencies..." -ForegroundColor Yellow
ssh -i $EC2_KEY_PATH "$EC2_USER@$EC2_HOST" @'
cd /home/ubuntu/insurance-app
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo "✅ Dependencies installed"
'@
Write-Host ""

# Step 7: Run migrations
Write-Host "Step 6/8: Running database migrations..." -ForegroundColor Yellow
ssh -i $EC2_KEY_PATH "$EC2_USER@$EC2_HOST" @'
cd /home/ubuntu/insurance-app
source venv/bin/activate
python manage.py migrate --noinput
echo "✅ Migrations complete"
'@
Write-Host ""

# Step 8: Seed database
Write-Host "Step 7/8: Seeding database..." -ForegroundColor Yellow
ssh -i $EC2_KEY_PATH "$EC2_USER@$EC2_HOST" @'
cd /home/ubuntu/insurance-app
source venv/bin/activate
echo "Seeding motor categories..."
python manage.py seed_motor_categories 2>/dev/null || echo "⚠️  seed_motor_categories not found"
echo "Seeding pricing..."
python manage.py seed_motor_pricing 2>/dev/null || echo "⚠️  seed_motor_pricing not found"
echo "Seeding underwriters..."
python manage.py seed_underwriters 2>/dev/null || echo "⚠️  seed_underwriters not found"
echo "✅ Seeding attempted"
'@
Write-Host ""

# Step 9: Restart Django
Write-Host "Step 8/8: Restarting Django..." -ForegroundColor Yellow
ssh -i $EC2_KEY_PATH "$EC2_USER@$EC2_HOST" @'
cd /home/ubuntu/insurance-app
if sudo systemctl list-units --type=service 2>/dev/null | grep -q gunicorn; then
    echo "Restarting gunicorn..."
    sudo systemctl restart gunicorn
    sudo systemctl status gunicorn --no-pager | head -5
elif sudo systemctl list-units --type=service 2>/dev/null | grep -q django; then
    echo "Restarting django service..."
    sudo systemctl restart django
elif command -v pm2 &> /dev/null; then
    echo "Restarting with pm2..."
    pm2 restart all
else
    echo "Stopping old server..."
    pkill -f "manage.py runserver" || true
    sleep 2
    echo "Starting Django server..."
    cd /home/ubuntu/insurance-app
    source venv/bin/activate
    nohup python manage.py runserver 0.0.0.0:8000 > /home/ubuntu/django.log 2>&1 &
    sleep 2
    echo "✅ Server started"
fi
'@
Write-Host ""

# Step 10: Verify deployment
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Verifying Deployment..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Testing endpoints..." -ForegroundColor Yellow

# Test health
try {
    $health = Invoke-RestMethod -Uri "http://${EC2_HOST}:8000/api/v1/health/" -Method Get -TimeoutSec 10
    Write-Host "✅ Health: " -ForegroundColor Green -NoNewline
    Write-Host ($health | ConvertTo-Json -Compress) -ForegroundColor White
} catch {
    Write-Host "❌ Health check failed" -ForegroundColor Red
}

# Test motor2 categories
try {
    $categories = Invoke-RestMethod -Uri "http://${EC2_HOST}:8000/api/v1/motor2/categories/" -Method Get -TimeoutSec 10
    Write-Host "✅ Motor2 Categories: " -ForegroundColor Green -NoNewline
    Write-Host "Found $($categories.categories.Count) categories" -ForegroundColor White
} catch {
    Write-Host "❌ Motor2 categories failed" -ForegroundColor Red
}

# Test underwriters
try {
    $underwriters = Invoke-RestMethod -Uri "http://${EC2_HOST}:8000/api/v1/public_app/insurance/get_underwriters/" -Method Get -TimeoutSec 10
    Write-Host "✅ Underwriters: " -ForegroundColor Green -NoNewline
    Write-Host "Found $($underwriters.count) underwriters" -ForegroundColor White
} catch {
    Write-Host "❌ Underwriters failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend URL: http://$EC2_HOST:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test login from your mobile app" -ForegroundColor White
Write-Host "2. If no users exist, create one:" -ForegroundColor White
Write-Host "   ssh -i `"$EC2_KEY_PATH`" $EC2_USER@$EC2_HOST" -ForegroundColor Gray
Write-Host "   cd /home/ubuntu/insurance-app && source venv/bin/activate" -ForegroundColor Gray
Write-Host "   python manage.py createsuperuser" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Monitor logs:" -ForegroundColor White
Write-Host "   ssh -i `"$EC2_KEY_PATH`" $EC2_USER@$EC2_HOST" -ForegroundColor Gray
Write-Host "   tail -f /home/ubuntu/django.log" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to exit"
