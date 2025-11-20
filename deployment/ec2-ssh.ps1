# EC2 Direct SSH Workflow
# Quick commands to connect and work directly on EC2 instance

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet("connect", "logs", "restart", "status", "shell", "migrate", "collectstatic")]
    [string]$Action = "connect"
)

$EC2_IP = "44.200.182.180"
$EC2_USER = "ec2-user"
$INSTANCE_ID = "i-0d0f116005d812275"
$PROJECT_PATH = "/var/www/patabima"

Write-Host "`n🔧 EC2 Direct Management - $Action`n" -ForegroundColor Cyan
Write-Host "Instance: $INSTANCE_ID ($EC2_IP)" -ForegroundColor DarkGray
Write-Host ""

switch ($Action) {
    "connect" {
        Write-Host "📡 Opening EC2 Instance Connect..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Option 1: Browser SSH (No key needed) ✨" -ForegroundColor Green
        Write-Host "  1. Go to: https://console.aws.amazon.com/ec2/" -ForegroundColor White
        Write-Host "  2. Select instance: $INSTANCE_ID" -ForegroundColor White
        Write-Host "  3. Click 'Connect' → 'EC2 Instance Connect'" -ForegroundColor White
        Write-Host "  4. Username: ec2-user" -ForegroundColor White
        Write-Host "  5. Click 'Connect'" -ForegroundColor White
        Write-Host ""
        Write-Host "Once connected, navigate to project:" -ForegroundColor Cyan
        Write-Host "  cd $PROJECT_PATH" -ForegroundColor DarkGray
        Write-Host ""
        
        # Open browser to EC2 console
        Start-Process "https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#Instances:instanceId=$INSTANCE_ID"
    }
    
    "logs" {
        Write-Host "📋 View Application Logs" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Connect to EC2 first, then run:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "# Real-time Gunicorn logs" -ForegroundColor Green
        Write-Host "sudo journalctl -u patabima -f --no-pager" -ForegroundColor White
        Write-Host ""
        Write-Host "# Last 50 log lines" -ForegroundColor Green
        Write-Host "sudo journalctl -u patabima -n 50" -ForegroundColor White
        Write-Host ""
        Write-Host "# Nginx error logs" -ForegroundColor Green
        Write-Host "sudo tail -f /var/log/nginx/error.log" -ForegroundColor White
        Write-Host ""
        Write-Host "# Nginx access logs" -ForegroundColor Green
        Write-Host "sudo tail -f /var/log/nginx/access.log" -ForegroundColor White
        Write-Host ""
    }
    
    "restart" {
        Write-Host "🔄 Restart Services" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Connect to EC2 first, then run:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "# Restart Django app (Gunicorn)" -ForegroundColor Green
        Write-Host "sudo systemctl restart patabima" -ForegroundColor White
        Write-Host ""
        Write-Host "# Restart Nginx" -ForegroundColor Green
        Write-Host "sudo systemctl restart nginx" -ForegroundColor White
        Write-Host ""
        Write-Host "# Check status" -ForegroundColor Green
        Write-Host "sudo systemctl status patabima nginx" -ForegroundColor White
        Write-Host ""
    }
    
    "status" {
        Write-Host "📊 Check Service Status" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Connect to EC2 first, then run:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "# Check all services" -ForegroundColor Green
        Write-Host "sudo systemctl status patabima nginx" -ForegroundColor White
        Write-Host ""
        Write-Host "# Test database connection" -ForegroundColor Green
        Write-Host "cd $PROJECT_PATH" -ForegroundColor White
        Write-Host "source venv/bin/activate" -ForegroundColor White
        Write-Host "export `$(grep -v '^#' .env | xargs)" -ForegroundColor White
        Write-Host "python manage.py check --database default" -ForegroundColor White
        Write-Host ""
        Write-Host "# Test API endpoint" -ForegroundColor Green
        Write-Host "curl -sS http://localhost/api/v1/motor2/categories/ | python -m json.tool | head -20" -ForegroundColor White
        Write-Host ""
    }
    
    "shell" {
        Write-Host "🐍 Django Shell Commands" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Connect to EC2 first, then run:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "# Navigate and activate" -ForegroundColor Green
        Write-Host "cd $PROJECT_PATH" -ForegroundColor White
        Write-Host "source venv/bin/activate" -ForegroundColor White
        Write-Host "export `$(grep -v '^#' .env | xargs)" -ForegroundColor White
        Write-Host ""
        Write-Host "# Open Django shell" -ForegroundColor Green
        Write-Host "python manage.py shell" -ForegroundColor White
        Write-Host ""
        Write-Host "# Quick commands in shell:" -ForegroundColor Cyan
        Write-Host ">>> from app.models import MotorCategory, User" -ForegroundColor DarkGray
        Write-Host ">>> MotorCategory.objects.count()" -ForegroundColor DarkGray
        Write-Host ">>> User.objects.filter(is_admin=True).count()" -ForegroundColor DarkGray
        Write-Host ""
    }
    
    "migrate" {
        Write-Host "🗄️  Run Database Migrations" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Connect to EC2 first, then run:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "cd $PROJECT_PATH" -ForegroundColor White
        Write-Host "source venv/bin/activate" -ForegroundColor White
        Write-Host "export `$(grep -v '^#' .env | xargs)" -ForegroundColor White
        Write-Host ""
        Write-Host "# Check pending migrations" -ForegroundColor Green
        Write-Host "python manage.py showmigrations" -ForegroundColor White
        Write-Host ""
        Write-Host "# Run migrations" -ForegroundColor Green
        Write-Host "python manage.py migrate" -ForegroundColor White
        Write-Host ""
        Write-Host "# Restart service after migrations" -ForegroundColor Green
        Write-Host "sudo systemctl restart patabima" -ForegroundColor White
        Write-Host ""
    }
    
    "collectstatic" {
        Write-Host "📦 Collect Static Files" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Connect to EC2 first, then run:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "cd $PROJECT_PATH" -ForegroundColor White
        Write-Host "source venv/bin/activate" -ForegroundColor White
        Write-Host "export `$(grep -v '^#' .env | xargs)" -ForegroundColor White
        Write-Host ""
        Write-Host "# Collect static files" -ForegroundColor Green
        Write-Host "python manage.py collectstatic --noinput" -ForegroundColor White
        Write-Host ""
        Write-Host "# Restart Nginx" -ForegroundColor Green
        Write-Host "sudo systemctl restart nginx" -ForegroundColor White
        Write-Host ""
    }
}

Write-Host "════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""
