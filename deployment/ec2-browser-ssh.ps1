# Quick EC2 SSH Setup using Browser Instance Connect
# No SSH key needed - use AWS Console browser SSH

Write-Host "`n🔐 EC2 SSH Setup - Simplified Method`n" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════`n" -ForegroundColor DarkGray

Write-Host "✨ EASIEST METHOD: Use Browser SSH (No keys needed!)`n" -ForegroundColor Green

Write-Host "Step 1: Open EC2 Instance Connect" -ForegroundColor Cyan
Write-Host "  Opening AWS Console in browser...`n" -ForegroundColor Yellow

Start-Process "https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#ConnectToInstance:instanceId=i-0d0f116005d812275"

Write-Host "Step 2: Once connected, you can run commands directly!" -ForegroundColor Cyan
Write-Host "  No SSH setup required!`n" -ForegroundColor Green

Write-Host "═══════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "📋 Quick Commands to Run on EC2:" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════`n" -ForegroundColor DarkGray

Write-Host "🔐 Create Admin User:" -ForegroundColor Cyan
Write-Host @"
cd /var/www/patabima && source venv/bin/activate && export `$(grep -v '^#' .env | xargs) && python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); user, created = User.objects.get_or_create(phonenumber='0741590055'); user.set_password('Best254#'); user.is_staff = True; user.is_admin = True; user.email = 'admin@patabima.com'; user.save(); print(f'Admin: {user.phonenumber}, Staff: {user.is_staff}, Admin: {user.is_admin}')"
"@ -ForegroundColor White

Write-Host "`n📊 Check Service Status:" -ForegroundColor Cyan
Write-Host "sudo systemctl status patabima --no-pager" -ForegroundColor White

Write-Host "`n📋 View Logs:" -ForegroundColor Cyan
Write-Host "sudo journalctl -u patabima -n 50 --no-pager" -ForegroundColor White

Write-Host "`n🔄 Restart Service:" -ForegroundColor Cyan
Write-Host "sudo systemctl restart patabima" -ForegroundColor White

Write-Host "`n🔄 Update Code:" -ForegroundColor Cyan
Write-Host @"
cd /var/www/patabima
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
export `$(grep -v '^#' .env | xargs)
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart patabima
"@ -ForegroundColor White

Write-Host "`n═══════════════════════════════════════════`n" -ForegroundColor DarkGray

Write-Host "💡 Test Admin Login After Creating User:" -ForegroundColor Yellow
Write-Host "  URL: http://44.200.182.180/admin/" -ForegroundColor White
Write-Host "  Username: 0741590055" -ForegroundColor White
Write-Host "  Password: Best254#`n" -ForegroundColor White

Write-Host "═══════════════════════════════════════════`n" -ForegroundColor DarkGray
