# Quick Deployment Script - Run from EC2 after connecting
# Usage: Once connected to EC2 via connect-ec2.ps1, run this script

Write-Host "🚀 PataBima Backend Deployment" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

# Navigate to app directory
Write-Host "📁 Navigating to application directory..." -ForegroundColor Yellow
cd /var/www/patabima

# Activate virtual environment
Write-Host "🐍 Activating virtual environment..." -ForegroundColor Yellow
& source venv/bin/activate

# Pull latest code
Write-Host ""
Write-Host "📥 Pulling latest code from GitHub..." -ForegroundColor Yellow
git fetch origin main
git reset --hard origin/main

# Install/update dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt --upgrade

# Run migrations
Write-Host ""
Write-Host "🗄️ Running database migrations..." -ForegroundColor Yellow
python manage.py migrate --noinput

# Collect static files
Write-Host ""
Write-Host "📁 Collecting static files..." -ForegroundColor Yellow
python manage.py collectstatic --noinput

# Restart services
Write-Host ""
Write-Host "🔄 Restarting services..." -ForegroundColor Yellow
sudo systemctl restart patabima
sudo systemctl restart nginx

# Check status
Write-Host ""
Write-Host "✅ Checking service status..." -ForegroundColor Yellow
sudo systemctl status patabima --no-pager -l

Write-Host ""
Write-Host "🎉 Deployment complete!" -ForegroundColor Green
