# EC2 Code Update Workflow
# Steps to update code directly on EC2 after making local changes

Write-Host "`n🚀 EC2 Code Update Workflow`n" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════`n" -ForegroundColor DarkGray

Write-Host "📝 Step 1: Commit Your Changes Locally" -ForegroundColor Yellow
Write-Host "   cd insurance-app" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor White
Write-Host "   git commit -m 'Your commit message'" -ForegroundColor White
Write-Host "   git push origin main" -ForegroundColor White
Write-Host ""

Write-Host "📡 Step 2: Connect to EC2" -ForegroundColor Yellow
Write-Host "   Option A: Use Browser SSH (Recommended)" -ForegroundColor Green
Write-Host "   1. Go to: https://console.aws.amazon.com/ec2/" -ForegroundColor White
Write-Host "   2. Select instance: i-0d0f116005d812275" -ForegroundColor White
Write-Host "   3. Click 'Connect' → 'EC2 Instance Connect'" -ForegroundColor White
Write-Host "   4. Click 'Connect'" -ForegroundColor White
Write-Host ""
Write-Host "   Opening browser now..." -ForegroundColor Cyan
Start-Process "https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#Instances:instanceId=i-0d0f116005d812275"
Start-Sleep -Seconds 2
Write-Host ""

Write-Host "🔄 Step 3: Update Code on EC2" -ForegroundColor Yellow
Write-Host "   Copy and paste these commands in EC2 terminal:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   # Navigate to project" -ForegroundColor Green
Write-Host "   cd /var/www/patabima" -ForegroundColor White
Write-Host ""
Write-Host "   # Pull latest code" -ForegroundColor Green
Write-Host "   git pull origin main" -ForegroundColor White
Write-Host ""
Write-Host "   # Activate virtual environment" -ForegroundColor Green
Write-Host "   source venv/bin/activate" -ForegroundColor White
Write-Host ""
Write-Host "   # Install any new dependencies (if needed)" -ForegroundColor Green
Write-Host "   pip install -r requirements.txt" -ForegroundColor White
Write-Host ""
Write-Host "   # Load environment variables" -ForegroundColor Green
Write-Host "   export `$(grep -v '^#' .env | xargs)" -ForegroundColor White
Write-Host ""
Write-Host "   # Run migrations (if model changes)" -ForegroundColor Green
Write-Host "   python manage.py migrate" -ForegroundColor White
Write-Host ""
Write-Host "   # Collect static files (if admin/static changes)" -ForegroundColor Green
Write-Host "   python manage.py collectstatic --noinput" -ForegroundColor White
Write-Host ""
Write-Host "   # Restart Django service" -ForegroundColor Green
Write-Host "   sudo systemctl restart patabima" -ForegroundColor White
Write-Host ""
Write-Host "   # Check service status" -ForegroundColor Green
Write-Host "   sudo systemctl status patabima" -ForegroundColor White
Write-Host ""

Write-Host "✅ Step 4: Verify Changes" -ForegroundColor Yellow
Write-Host "   # Test API from EC2" -ForegroundColor Green
Write-Host "   curl -sS http://localhost/api/v1/motor2/categories/ | python -m json.tool | head -20" -ForegroundColor White
Write-Host ""
Write-Host "   # Check logs for errors" -ForegroundColor Green
Write-Host "   sudo journalctl -u patabima -n 50" -ForegroundColor White
Write-Host ""
Write-Host "   # Test from browser" -ForegroundColor Green
Write-Host "   http://44.200.182.180/api/v1/motor2/categories/" -ForegroundColor White
Write-Host "   http://44.200.182.180/admin/" -ForegroundColor White
Write-Host ""

Write-Host "════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""
Write-Host "💡 Quick Reference:" -ForegroundColor Cyan
Write-Host "   View logs:    .\deployment\ec2-ssh.ps1 -Action logs" -ForegroundColor White
Write-Host "   Restart:      .\deployment\ec2-ssh.ps1 -Action restart" -ForegroundColor White
Write-Host "   Check status: .\deployment\ec2-ssh.ps1 -Action status" -ForegroundColor White
Write-Host "   Django shell: .\deployment\ec2-ssh.ps1 -Action shell" -ForegroundColor White
Write-Host ""
