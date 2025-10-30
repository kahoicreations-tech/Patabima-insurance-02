# ============================================
# PataBima Backend Redeployment Script (PowerShell)
# ============================================
# This script redeploys the insurance-app backend to EC2
# with all motor2 endpoints and database seeding

$ErrorActionPreference = "Stop"

# Configuration
$EC2_HOST = "ec2-34-203-241-81.compute-1.amazonaws.com"
$EC2_USER = "ubuntu"
$EC2_KEY_PATH = "$env:USERPROFILE\.ssh\patabima-key.pem"  # Update this path
$REMOTE_APP_PATH = "/home/ubuntu/insurance-app"
$LOCAL_APP_PATH = ".\insurance-app"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "PataBima Backend Redeployment to EC2" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if SSH key exists
if (-not (Test-Path $EC2_KEY_PATH)) {
    Write-Host "❌ Error: SSH key not found at: $EC2_KEY_PATH" -ForegroundColor Red
    Write-Host "Please update the EC2_KEY_PATH variable in this script" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can use PuTTY/WinSCP instead:" -ForegroundColor Yellow
    Write-Host "1. Open WinSCP and connect to: $EC2_HOST" -ForegroundColor Yellow
    Write-Host "2. Upload the insurance-app folder" -ForegroundColor Yellow
    Write-Host "3. Open PuTTY and connect to EC2" -ForegroundColor Yellow
    Write-Host "4. Run the deployment commands manually" -ForegroundColor Yellow
    exit 1
}

# Step 1: Test SSH Connection
Write-Host "Step 1/8: Testing SSH connection to EC2..." -ForegroundColor Yellow
try {
    ssh -i $EC2_KEY_PATH -o ConnectTimeout=10 "$EC2_USER@$EC2_HOST" "echo 'SSH connection successful'"
    Write-Host "✅ SSH connection verified" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Cannot connect to EC2. Please check:" -ForegroundColor Red
    Write-Host "   - EC2 instance is running" -ForegroundColor Yellow
    Write-Host "   - SSH key path is correct: $EC2_KEY_PATH" -ForegroundColor Yellow
    Write-Host "   - Security group allows SSH from your IP" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 2: Backup existing deployment
Write-Host "Step 2/8: Creating backup of existing deployment..." -ForegroundColor Yellow
$backupScript = @'
    if [ -d "/home/ubuntu/insurance-app" ]; then
        BACKUP_DIR="/home/ubuntu/insurance-app-backup-$(date +%Y%m%d-%H%M%S)"
        echo "Creating backup at: $BACKUP_DIR"
        cp -r /home/ubuntu/insurance-app "$BACKUP_DIR"
        echo "✅ Backup created successfully"
    else
        echo "⚠️  No existing deployment found, skipping backup"
    fi
'@
ssh -i $EC2_KEY_PATH "$EC2_USER@$EC2_HOST" $backupScript
Write-Host ""

# Step 3: Sync application files using SCP
Write-Host "Step 3/8: Syncing application files to EC2..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

# Use scp to copy files (requires OpenSSH on Windows 10+)
# For better progress, we'll use scp in recursive mode
scp -i $EC2_KEY_PATH -r "$LOCAL_APP_PATH\*" "${EC2_USER}@${EC2_HOST}:${REMOTE_APP_PATH}/"

Write-Host "✅ Files synced successfully" -ForegroundColor Green
Write-Host ""

# Step 4: Install/Update dependencies
Write-Host "Step 4/8: Installing Python dependencies..." -ForegroundColor Yellow
$dependenciesScript = @'
    cd /home/ubuntu/insurance-app
    
    # Activate virtual environment or create if doesn't exist
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install dependencies
    pip install -r requirements.txt
    
    echo "✅ Dependencies installed"
'@
ssh -i $EC2_KEY_PATH "$EC2_USER@$EC2_HOST" $dependenciesScript
Write-Host ""

# Step 5: Run database migrations
Write-Host "Step 5/8: Running database migrations..." -ForegroundColor Yellow
$migrationsScript = @'
    cd /home/ubuntu/insurance-app
    source venv/bin/activate
    
    # Run migrations
    python manage.py migrate --noinput
    
    echo "✅ Migrations completed"
'@
ssh -i $EC2_KEY_PATH "$EC2_USER@$EC2_HOST" $migrationsScript
Write-Host ""

# Step 6: Collect static files
Write-Host "Step 6/8: Collecting static files..." -ForegroundColor Yellow
$staticScript = @'
    cd /home/ubuntu/insurance-app
    source venv/bin/activate
    
    # Collect static files
    python manage.py collectstatic --noinput
    
    echo "✅ Static files collected"
'@
ssh -i $EC2_KEY_PATH "$EC2_USER@$EC2_HOST" $staticScript
Write-Host ""

# Step 7: Seed database with motor data
Write-Host "Step 7/8: Seeding database with motor2 data..." -ForegroundColor Yellow
$seedingScript = @'
    cd /home/ubuntu/insurance-app
    source venv/bin/activate
    
    # Check if seed scripts exist and run them
    echo "Seeding motor categories..."
    python manage.py seed_motor_categories || echo "⚠️  seed_motor_categories command not found"
    
    echo "Seeding motor pricing..."
    python manage.py seed_motor_pricing || echo "⚠️  seed_motor_pricing command not found"
    
    echo "Seeding underwriters..."
    python manage.py seed_underwriters || echo "⚠️  seed_underwriters command not found"
    
    echo "✅ Database seeding attempted"
'@
ssh -i $EC2_KEY_PATH "$EC2_USER@$EC2_HOST" $seedingScript
Write-Host ""

# Step 8: Restart Django application
Write-Host "Step 8/8: Restarting Django application..." -ForegroundColor Yellow
$restartScript = @'
    cd /home/ubuntu/insurance-app
    
    # Try different restart methods based on what's running
    if sudo systemctl list-units --type=service | grep -q gunicorn; then
        echo "Restarting gunicorn service..."
        sudo systemctl restart gunicorn
        sudo systemctl status gunicorn --no-pager
    elif sudo systemctl list-units --type=service | grep -q django; then
        echo "Restarting django service..."
        sudo systemctl restart django
        sudo systemctl status django --no-pager
    elif command -v pm2 &> /dev/null; then
        echo "Restarting with pm2..."
        pm2 restart django || pm2 restart all
        pm2 status
    elif pgrep -f "manage.py runserver" > /dev/null; then
        echo "Stopping existing Django dev server..."
        pkill -f "manage.py runserver"
        sleep 2
        echo "Starting Django dev server..."
        cd /home/ubuntu/insurance-app
        source venv/bin/activate
        nohup python manage.py runserver 0.0.0.0:8000 > /home/ubuntu/django.log 2>&1 &
        echo "Django dev server started"
    else
        echo "⚠️  Could not detect running service. Please start Django manually:"
        echo "   cd /home/ubuntu/insurance-app"
        echo "   source venv/bin/activate"
        echo "   python manage.py runserver 0.0.0.0:8000"
    fi
    
    echo "✅ Application restart attempted"
'@
ssh -i $EC2_KEY_PATH "$EC2_USER@$EC2_HOST" $restartScript
Write-Host ""

# Step 9: Verify deployment
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Verifying deployment..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Testing health endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://${EC2_HOST}:8000/api/v1/health/" -Method Get
    Write-Host ($health | ConvertTo-Json) -ForegroundColor Green
} catch {
    Write-Host "⚠️  Health check failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing motor2 categories endpoint..." -ForegroundColor Yellow
try {
    $categories = Invoke-RestMethod -Uri "http://${EC2_HOST}:8000/api/v1/motor2/categories/" -Method Get
    Write-Host ($categories | ConvertTo-Json) -ForegroundColor Green
} catch {
    Write-Host "⚠️  Motor2 categories endpoint failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing underwriters endpoint..." -ForegroundColor Yellow
try {
    $underwriters = Invoke-RestMethod -Uri "http://${EC2_HOST}:8000/api/v1/public_app/insurance/get_underwriters/" -Method Get
    Write-Host ($underwriters | ConvertTo-Json -Depth 3) -ForegroundColor Green
} catch {
    Write-Host "⚠️  Underwriters endpoint failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ Redeployment Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test login from mobile app" -ForegroundColor White
Write-Host "2. Create test user if needed:" -ForegroundColor White
Write-Host "   ssh -i $EC2_KEY_PATH $EC2_USER@$EC2_HOST" -ForegroundColor Gray
Write-Host "   cd /home/ubuntu/insurance-app" -ForegroundColor Gray
Write-Host "   source venv/bin/activate" -ForegroundColor Gray
Write-Host "   python manage.py createsuperuser" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Monitor logs:" -ForegroundColor White
Write-Host "   ssh -i $EC2_KEY_PATH $EC2_USER@$EC2_HOST" -ForegroundColor Gray
Write-Host "   tail -f /home/ubuntu/django.log" -ForegroundColor Gray
Write-Host "   # or" -ForegroundColor Gray
Write-Host "   sudo journalctl -u gunicorn -f" -ForegroundColor Gray
Write-Host ""
Write-Host "Backend URL: http://$EC2_HOST:8000" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
