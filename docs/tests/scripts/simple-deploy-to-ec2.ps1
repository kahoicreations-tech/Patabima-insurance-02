# ============================================
# PataBima Simple EC2 Deployment Script
# ============================================
# This script helps you deploy to EC2 step by step

$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "PataBima Backend Deployment to EC2" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$EC2_HOST = "ec2-34-203-241-81.compute-1.amazonaws.com"

Write-Host "This script will guide you through deployment." -ForegroundColor Yellow
Write-Host ""

# Step 1: Create deployment package
Write-Host "Step 1/4: Creating deployment package..." -ForegroundColor Yellow

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$zipFile = "insurance-app-deploy-$timestamp.zip"

Write-Host "Packaging insurance-app folder..." -ForegroundColor Gray

# Exclude unnecessary files
$excludePatterns = @("*.pyc", "__pycache__", ".git", "venv", "env", ".env", "*.sqlite3", "media", "staticfiles")

# Create temporary folder
$tempFolder = ".\temp-deploy"
if (Test-Path $tempFolder) {
    Remove-Item -Recurse -Force $tempFolder
}
New-Item -ItemType Directory -Path $tempFolder -Force | Out-Null

# Copy insurance-app to temp folder
Write-Host "Copying files..." -ForegroundColor Gray
Copy-Item -Path ".\insurance-app\*" -Destination $tempFolder -Recurse -Force

# Remove excluded files
Write-Host "Cleaning up unnecessary files..." -ForegroundColor Gray
Get-ChildItem -Path $tempFolder -Recurse -Include "*.pyc" | Remove-Item -Force
Get-ChildItem -Path $tempFolder -Recurse -Directory -Filter "__pycache__" | Remove-Item -Recurse -Force
if (Test-Path "$tempFolder\venv") { Remove-Item -Recurse -Force "$tempFolder\venv" }
if (Test-Path "$tempFolder\.git") { Remove-Item -Recurse -Force "$tempFolder\.git" }

# Create zip file
Write-Host "Creating ZIP archive..." -ForegroundColor Gray
Compress-Archive -Path "$tempFolder\*" -DestinationPath $zipFile -Force

# Clean up temp folder
Remove-Item -Recurse -Force $tempFolder

Write-Host "✅ Deployment package created: $zipFile" -ForegroundColor Green
Write-Host "   Size: $((Get-Item $zipFile).Length / 1MB | ForEach-Object { [math]::Round($_, 2) }) MB" -ForegroundColor Gray
Write-Host ""

# Step 2: Display upload instructions
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Step 2/4: Upload to EC2" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please choose one of these methods to upload:" -ForegroundColor Yellow
Write-Host ""
Write-Host "METHOD 1 - AWS Systems Manager (Recommended if SSH not available):" -ForegroundColor Cyan
Write-Host "  1. Go to EC2 Console → Select your instance" -ForegroundColor White
Write-Host "  2. Click 'Connect' → Choose 'Session Manager' → Click 'Connect'" -ForegroundColor White
Write-Host "  3. In the terminal, run:" -ForegroundColor White
Write-Host "     cd /home/ubuntu" -ForegroundColor Gray
Write-Host "     wget http://your-temporary-hosting-url/$zipFile" -ForegroundColor Gray
Write-Host "     (or use S3, see below)" -ForegroundColor Gray
Write-Host ""
Write-Host "METHOD 2 - Using FileZilla/WinSCP:" -ForegroundColor Cyan
Write-Host "  1. Download FileZilla: https://filezilla-project.org/" -ForegroundColor White
Write-Host "  2. Configure:" -ForegroundColor White
Write-Host "     Host: $EC2_HOST" -ForegroundColor Gray
Write-Host "     Protocol: SFTP" -ForegroundColor Gray
Write-Host "     Port: 22" -ForegroundColor Gray
Write-Host "     User: ubuntu" -ForegroundColor Gray
Write-Host "     Keyfile: Your .pem/.ppk file" -ForegroundColor Gray
Write-Host "  3. Upload $zipFile to /home/ubuntu/" -ForegroundColor White
Write-Host ""
Write-Host "METHOD 3 - Using SCP (if you have SSH key):" -ForegroundColor Cyan
Write-Host "  scp -i path\to\your-key.pem $zipFile ubuntu@${EC2_HOST}:/home/ubuntu/" -ForegroundColor Gray
Write-Host ""
Write-Host "METHOD 4 - Using AWS S3:" -ForegroundColor Cyan
Write-Host "  1. Upload to S3:" -ForegroundColor White
Write-Host "     aws s3 cp $zipFile s3://your-bucket-name/" -ForegroundColor Gray
Write-Host "  2. Download on EC2:" -ForegroundColor White
Write-Host "     aws s3 cp s3://your-bucket-name/$zipFile /home/ubuntu/" -ForegroundColor Gray
Write-Host ""

$continue = Read-Host "Have you uploaded the file to EC2? (yes/no)"
if ($continue -ne "yes") {
    Write-Host ""
    Write-Host "Please upload the file and run this script again." -ForegroundColor Yellow
    Write-Host "Or continue with the manual deployment commands below." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Step 3/4: Deployment Commands for EC2" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Copy and paste these commands in your EC2 terminal:" -ForegroundColor Yellow
Write-Host ""

$commands = @"
# Navigate to home directory
cd /home/ubuntu

# Backup existing deployment
if [ -d "insurance-app" ]; then
    BACKUP_DIR="insurance-app-backup-`$(date +%Y%m%d-%H%M%S)"
    echo "Creating backup at: `$BACKUP_DIR"
    cp -r insurance-app "`$BACKUP_DIR"
fi

# Extract new deployment
unzip -o $zipFile -d insurance-app/

# Navigate to app directory
cd /home/ubuntu/insurance-app

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate --noinput

# Collect static files
python manage.py collectstatic --noinput

# Seed database with motor2 data
echo "Seeding motor categories..."
python manage.py seed_motor_categories

echo "Seeding motor pricing..."
python manage.py seed_motor_pricing

echo "Seeding underwriters..."
python manage.py seed_underwriters

# Create superuser (optional - you'll be prompted)
# python manage.py createsuperuser

# Restart Django service
echo "Restarting Django..."
if sudo systemctl list-units --type=service | grep -q gunicorn; then
    sudo systemctl restart gunicorn
    sudo systemctl status gunicorn --no-pager
elif sudo systemctl list-units --type=service | grep -q django; then
    sudo systemctl restart django
    sudo systemctl status django --no-pager
elif command -v pm2 &> /dev/null; then
    pm2 restart django || pm2 restart all
    pm2 status
else
    # If no service manager, start dev server
    pkill -f "manage.py runserver" || true
    nohup python manage.py runserver 0.0.0.0:8000 > /home/ubuntu/django.log 2>&1 &
    echo "Django dev server started"
fi

echo "✅ Deployment complete!"
"@

Write-Host $commands -ForegroundColor Gray
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Save commands to file for easy copy
$commandsFile = "ec2-deployment-commands.sh"
$commands | Out-File -FilePath $commandsFile -Encoding UTF8
Write-Host "✅ Commands saved to: $commandsFile" -ForegroundColor Green
Write-Host "   You can copy these commands from this file" -ForegroundColor Gray
Write-Host ""

# Step 4: Verification
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Step 4/4: Verification" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$verify = Read-Host "Have you run the deployment commands on EC2? (yes/no)"
if ($verify -eq "yes") {
    Write-Host ""
    Write-Host "Testing endpoints..." -ForegroundColor Yellow
    Write-Host ""
    
    # Test health endpoint
    Write-Host "1. Testing health endpoint..." -ForegroundColor Cyan
    try {
        $health = Invoke-RestMethod -Uri "http://${EC2_HOST}:8000/api/v1/health/" -Method Get -TimeoutSec 10
        Write-Host "   ✅ Health: $($health.status)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 2
    
    # Test motor2 categories
    Write-Host "2. Testing motor2 categories..." -ForegroundColor Cyan
    try {
        $categories = Invoke-RestMethod -Uri "http://${EC2_HOST}:8000/api/v1/motor2/categories/" -Method Get -TimeoutSec 10
        $count = if ($categories.categories) { $categories.categories.Count } else { $categories.total_count }
        Write-Host "   ✅ Categories loaded: $count items" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Motor2 categories failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 2
    
    # Test underwriters
    Write-Host "3. Testing underwriters..." -ForegroundColor Cyan
    try {
        $underwriters = Invoke-RestMethod -Uri "http://${EC2_HOST}:8000/api/v1/public_app/insurance/get_underwriters/" -Method Get -TimeoutSec 10
        Write-Host "   ✅ Underwriters loaded: $($underwriters.count) items" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Underwriters failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "✅ Deployment Verification Complete!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Test login from your mobile app" -ForegroundColor White
    Write-Host "2. Create a test user on EC2 if needed:" -ForegroundColor White
    Write-Host "   python manage.py createsuperuser" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Monitor logs:" -ForegroundColor Yellow
    Write-Host "   tail -f /home/ubuntu/django.log" -ForegroundColor Gray
    Write-Host "   OR" -ForegroundColor Gray
    Write-Host "   sudo journalctl -u gunicorn -f" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Please run the commands on EC2 and then run this script again to verify." -ForegroundColor Yellow
}

Write-Host "Backend URL: http://$EC2_HOST:8000" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Deployment package: $zipFile" -ForegroundColor Gray
Write-Host "Commands file: $commandsFile" -ForegroundColor Gray
Write-Host ""
