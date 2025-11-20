# EC2 Quick Commands Cheatsheet

## Connect to EC2

### Browser SSH (No key needed) ⭐ RECOMMENDED

1. Open: https://console.aws.amazon.com/ec2/
2. Select instance: `i-0d0f116005d812275`
3. Click **Connect** → **EC2 Instance Connect**
4. Click **Connect**

### Navigate to Project

```bash
cd /var/www/patabima
source venv/bin/activate
export $(grep -v '^#' .env | xargs)
```

---

## Update Code on EC2

### Pull Latest Changes

```bash
cd /var/www/patabima
git pull origin main
```

### Install Dependencies (if updated)

```bash
pip install -r requirements.txt
```

### Run Migrations (if models changed)

```bash
python manage.py migrate
```

### Collect Static Files (if admin/static changed)

```bash
python manage.py collectstatic --noinput
```

### Restart Services

```bash
sudo systemctl restart patabima
sudo systemctl restart nginx
```

---

## Service Management

### Check Status

```bash
sudo systemctl status patabima nginx
```

### View Logs

```bash
# Real-time Gunicorn logs
sudo journalctl -u patabima -f --no-pager

# Last 50 lines
sudo journalctl -u patabima -n 50

# Nginx errors
sudo tail -f /var/log/nginx/error.log

# Nginx access
sudo tail -f /var/log/nginx/access.log
```

### Restart Services

```bash
sudo systemctl restart patabima
sudo systemctl restart nginx
```

---

## Database Operations

### Django Shell

```bash
cd /var/www/patabima
source venv/bin/activate
export $(grep -v '^#' .env | xargs)
python manage.py shell
```

```python
# Quick commands in shell
from app.models import MotorCategory, User, InsuranceProvider
from django.contrib.auth import get_user_model

# Count records
MotorCategory.objects.count()  # Should be 6
User.objects.filter(is_admin=True).count()

# Check admin users
User = get_user_model()
User.objects.filter(is_admin=True).values('phonenumber', 'email')
```

### Create Admin User

```bash
python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
user, created = User.objects.get_or_create(phonenumber='0741590055');
user.set_password('Best254#');
user.is_staff = True;
user.is_admin = True;
user.email = 'admin@patabima.com';
user.save();
print(f'Admin: {user.phonenumber}, Staff: {user.is_staff}')
"
```

### Database Connection Test

```bash
python manage.py check --database default
```

---

## API Testing

### Test from EC2

```bash
# Categories endpoint
curl -sS http://localhost/api/v1/motor2/categories/ | python -m json.tool | head -30

# Subcategories
curl -sS "http://localhost/api/v1/motor2/subcategories/?category=PRIVATE" | python -m json.tool

# Health check
curl -sS http://localhost/api/v1/health/
```

### Test from Browser

- Categories: http://44.200.182.180/api/v1/motor2/categories/
- Admin: http://44.200.182.180/admin/

---

## Common Tasks

### After Code Changes (Standard Workflow)

```bash
cd /var/www/patabima
git pull origin main
source venv/bin/activate
export $(grep -v '^#' .env | xargs)
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart patabima
sudo systemctl status patabima
```

### Check What Changed

```bash
git log -5 --oneline
git diff HEAD~1
```

### View Environment Variables

```bash
cat .env | grep -v '^#'
```

### Disk Space Check

```bash
df -h
du -sh /var/www/patabima/*
```

---

## PowerShell Helpers (From Local Machine)

```powershell
# Connect to EC2
.\deployment\ec2-ssh.ps1 -Action connect

# View logs
.\deployment\ec2-ssh.ps1 -Action logs

# Restart services
.\deployment\ec2-ssh.ps1 -Action restart

# Check status
.\deployment\ec2-ssh.ps1 -Action status

# Django shell
.\deployment\ec2-ssh.ps1 -Action shell

# Full update workflow
.\deployment\update-ec2-code.ps1
```

---

## Emergency Commands

### Service Down

```bash
sudo systemctl restart patabima nginx
sudo systemctl status patabima nginx
sudo journalctl -u patabima -n 100
```

### Database Connection Issues

```bash
cd /var/www/patabima
source venv/bin/activate
export $(grep -v '^#' .env | xargs)
python manage.py dbshell
# Then: \q to quit
```

### Nginx 502 Error

```bash
sudo systemctl restart patabima
sudo systemctl status patabima
ls -la /var/www/patabima/gunicorn.sock
```

---

## EC2 Instance Details

- **Instance ID**: i-0d0f116005d812275
- **Public IP**: 44.200.182.180
- **Region**: us-east-1
- **Project Path**: /var/www/patabima
- **User**: ec2-user
- **Database**: RDS PostgreSQL (patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com)

---

**Last Updated**: November 16, 2025  
**Quick Access**: `.\deployment\ec2-ssh.ps1 -Action connect`
