# Quick Redeployment Guide - PataBima Insurance Backend

**Last Updated:** November 17, 2025  
**EC2 Instance:** i-0d0f116005d812275  
**Public IP:** 44.200.182.180  
**Deployment Method:** Direct SSH with manual extraction

---

## When to Use This Guide

Use this guide when you've made **code changes** to the insurance-app and need to deploy them to production. This covers:

- ✅ Bug fixes in Django views/models
- ✅ New API endpoints
- ✅ Database model changes (migrations)
- ✅ Frontend updates (static files)
- ✅ Configuration changes in settings.py
- ✅ New Python package dependencies

---

## Prerequisites

Before redeploying, ensure:

- [ ] Code changes are committed to Git
- [ ] Local testing completed successfully
- [ ] New migrations created (if models changed): `python manage.py makemigrations`
- [ ] requirements.txt updated (if new packages added)

---

## Redeployment Methods

### Method 1: Quick Deploy (Recommended - 5 minutes)

**When to use:** Small code changes, no database changes

#### Step 1: Create Fresh Deployment Package (Local PowerShell)

```powershell
# Navigate to project root
cd C:\Users\USER\Desktop\PATABIMA01

# Create timestamped deployment package
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$zipFile = "patabima-backend-$timestamp.zip"

# Compress insurance-app directory
Compress-Archive -Path insurance-app\* -DestinationPath $zipFile -Force

# Upload to S3
aws s3 cp $zipFile "s3://patabima-media-prod/deployment/$zipFile" --region us-east-1

# Display the filename (you'll need this)
Write-Host "Uploaded: $zipFile" -ForegroundColor Green
```

#### Step 2: Deploy to EC2 (CloudShell or Local Terminal)

```bash
# Set variables
EC2_IP="44.200.182.180"
ZIP_FILE="patabima-backend-20251117-XXXXXX.zip"  # Use your actual timestamp

# Download from S3
aws s3 cp "s3://patabima-media-prod/deployment/$ZIP_FILE" ./

# Upload to EC2
scp "$ZIP_FILE" "ec2-user@$EC2_IP:/tmp/"

# SSH into EC2
ssh ec2-user@$EC2_IP
```

#### Step 3: Extract and Deploy (On EC2 Server)

```bash
# Stop services
sudo systemctl stop patabima nginx

# Backup current deployment
cd /var/www/patabima
sudo mv insurance-app "insurance-app.backup.$(date +%Y%m%d-%H%M%S)"

# Extract new deployment
sudo unzip "/tmp/patabima-backend-*.zip" -d ./insurance-app/
sudo chown -R ec2-user:ec2-user /var/www/patabima

# Activate virtualenv
source venv/bin/activate

# Install any new dependencies
pip install -r insurance-app/requirements.txt

# Navigate to app
cd insurance-app

# Set environment variables
export DEBUG=False
export SECRET_KEY="JqBr7F59HcizXuTdh4s5rMYRUxtPegb3l_UQ1EvL3C5MwUz_oqin1Tjs9QV8LwHwd5vmmNBKOpR4QYz3KfIbwg"
export ALLOWED_HOSTS="44.200.182.180,api.patabima.co.ke"
export RDS_HOSTNAME="patabima-production-db.ca5qwoi4lxw.us-east-1.rds.amazonaws.com"
export RDS_PORT="5432"
export RDS_DB_NAME="patabimadb"
export RDS_USERNAME="patabimaadmin"
export RDS_PASSWORD="PataB1ma2025Secure"
export USE_S3_MEDIA="1"
export AWS_STORAGE_BUCKET_NAME="patabima-media-prod"
export AWS_S3_REGION_NAME="us-east-1"

# Run migrations (if any)
python manage.py migrate --noinput

# Collect static files
python manage.py collectstatic --noinput --clear

# Restart services
sudo systemctl start patabima nginx

# Verify
curl http://localhost/api/v1/health/
```

**Total Time:** ~5 minutes

---

### Method 2: Automated Script Deploy (Coming Soon)

A fully automated script that handles the entire deployment process.

---

## Common Deployment Scenarios

### Scenario 1: Added New Python Package

```powershell
# After adding package to requirements.txt locally

# 1. Test locally first
pip install -r insurance-app\requirements.txt

# 2. Create deployment package
Compress-Archive -Path insurance-app\* -DestinationPath "patabima-backend-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip" -Force

# 3. Follow Method 1 above
# On EC2, the `pip install -r insurance-app/requirements.txt` step will install the new package
```

### Scenario 2: Database Model Changes

```powershell
# After modifying models.py locally

# 1. Create migrations
cd insurance-app
python manage.py makemigrations

# 2. Test migrations locally
python manage.py migrate

# 3. Create deployment package (includes new migration files)
cd ..
Compress-Archive -Path insurance-app\* -DestinationPath "patabima-backend-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip" -Force

# 4. Follow Method 1 above
# On EC2, `python manage.py migrate` will apply the new migrations
```

### Scenario 3: Changed API Endpoints/Views

```powershell
# After modifying views.py or urls.py

# 1. Test locally
python manage.py runserver

# 2. Create deployment package
Compress-Archive -Path insurance-app\* -DestinationPath "patabima-backend-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip" -Force

# 3. Follow Method 1 above
# Gunicorn restart will load the new code automatically
```

### Scenario 4: Updated Static Files (CSS/JS)

```powershell
# After modifying static files

# 1. Create deployment package
Compress-Archive -Path insurance-app\* -DestinationPath "patabima-backend-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip" -Force

# 2. Follow Method 1 above
# On EC2, `collectstatic --clear` will replace old static files
```

### Scenario 5: Environment Variable Changes

```bash
# If you need to change environment variables (like DEBUG, ALLOWED_HOSTS, etc.)

# SSH into EC2
ssh ec2-user@44.200.182.180

# Edit systemd service file
sudo nano /etc/systemd/system/patabima.service

# Add/modify Environment= lines in [Service] section
# Example:
# Environment="DEBUG=False"
# Environment="ALLOWED_HOSTS=44.200.182.180,api.patabima.co.ke,patabima.com"

# Save and reload
sudo systemctl daemon-reload
sudo systemctl restart patabima

# Verify
curl http://localhost/api/v1/health/
```

---

## Rollback (If Deployment Fails)

If the new deployment breaks something, rollback to the previous version:

```bash
# SSH into EC2
ssh ec2-user@44.200.182.180

# Stop services
sudo systemctl stop patabima nginx

# Find backup
cd /var/www/patabima
ls -la | grep insurance-app.backup

# Restore backup (use the latest timestamp)
sudo rm -rf insurance-app
sudo mv insurance-app.backup.20251117-143022 insurance-app
sudo chown -R ec2-user:ec2-user /var/www/patabima

# Restart services
sudo systemctl start patabima nginx

# Verify
curl http://localhost/api/v1/health/
```

---

## Verification Checklist

After every deployment, verify:

```bash
# 1. Health check
curl http://44.200.182.180/api/v1/health/
# Expected: {"status": "ok", "service": "pata-bima-api"}

# 2. Motor categories
curl http://44.200.182.180/api/v1/motor2/categories/
# Expected: JSON with 6 categories

# 3. Admin panel
curl -I http://44.200.182.180/admin/
# Expected: HTTP 200 or 302

# 4. Check logs for errors
sudo tail -f /var/log/nginx/error.log
sudo journalctl -u patabima -n 50 --no-pager

# 5. Service status
sudo systemctl status patabima --no-pager
sudo systemctl status nginx --no-pager
```

---

## Troubleshooting Common Issues

### Issue: "ModuleNotFoundError" after deployment

**Cause:** New Python package not installed

**Fix:**

```bash
cd /var/www/patabima
source venv/bin/activate
pip install -r insurance-app/requirements.txt
sudo systemctl restart patabima
```

### Issue: "500 Internal Server Error"

**Cause:** Database connection issues or missing environment variables

**Fix:**

```bash
# Check Gunicorn logs
sudo journalctl -u patabima -n 100 --no-pager

# Verify environment variables are set
sudo systemctl cat patabima | grep Environment

# Restart with fresh environment
sudo systemctl daemon-reload
sudo systemctl restart patabima
```

### Issue: Static files not loading

**Cause:** collectstatic not run or Nginx misconfiguration

**Fix:**

```bash
cd /var/www/patabima
source venv/bin/activate
cd insurance-app
python manage.py collectstatic --noinput --clear
sudo systemctl restart nginx
```

### Issue: Database migrations fail

**Cause:** Migration conflicts or database connection issues

**Fix:**

```bash
# Check which migrations are applied
python manage.py showmigrations

# Try running specific app migrations
python manage.py migrate app --fake-initial

# Check database connectivity
python manage.py dbshell
# Then: \dt  (shows tables)
# Then: \q   (quit)
```

---

## Best Practices

1. **Always test locally first** - Run `python manage.py runserver` and test all changes
2. **Create migrations before deploying** - Run `makemigrations` locally, commit them
3. **Use timestamped filenames** - Makes it easy to identify deployment versions
4. **Keep backups** - The deployment script auto-creates backups before replacing code
5. **Check logs after deployment** - Monitor logs for 5-10 minutes after deployment
6. **Test immediately** - Verify health check and critical endpoints right after deploy
7. **Deploy during low-traffic periods** - Minimize user impact

---

## Quick Reference Commands

### One-Liner: Create and Upload Package

```powershell
# PowerShell (Local)
$zip = "patabima-backend-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"; Compress-Archive -Path insurance-app\* -DestinationPath $zip -Force; aws s3 cp $zip "s3://patabima-media-prod/deployment/$zip" --region us-east-1; Write-Host "`nUploaded: $zip`n" -ForegroundColor Green
```

### One-Liner: Full Deployment (On EC2)

```bash
# Bash (EC2 Server)
sudo systemctl stop patabima nginx && cd /var/www/patabima && sudo mv insurance-app "insurance-app.backup.$(date +%Y%m%d-%H%M%S)" && sudo unzip "/tmp/patabima-backend-*.zip" -d ./insurance-app/ && sudo chown -R ec2-user:ec2-user /var/www/patabima && source venv/bin/activate && pip install -r insurance-app/requirements.txt && cd insurance-app && export RDS_HOSTNAME="patabima-production-db.ca5qwoi4lxw.us-east-1.rds.amazonaws.com" RDS_PORT="5432" RDS_DB_NAME="patabimadb" RDS_USERNAME="patabimaadmin" RDS_PASSWORD="PataB1ma2025Secure" && python manage.py migrate --noinput && python manage.py collectstatic --noinput --clear && sudo systemctl start patabima nginx && curl http://localhost/api/v1/health/
```

---

## Deployment Checklist Template

Copy this for each deployment:

```
□ Local changes tested
□ Migrations created (if needed)
□ requirements.txt updated (if needed)
□ Deployment package created
□ Uploaded to S3
□ Uploaded to EC2 /tmp/
□ Services stopped
□ Backup created
□ New code extracted
□ Dependencies installed
□ Migrations run
□ Static files collected
□ Services restarted
□ Health check passed
□ Critical endpoints tested
□ Logs checked for errors
```

---

## Contact & Support

**AWS Account:** KAHOI-KREATIONS (804686432477)  
**Region:** us-east-1  
**EC2 Instance ID:** i-0d0f116005d812275  
**RDS Endpoint:** patabima-production-db.ca5qwoi4lxw.us-east-1.rds.amazonaws.com

**Emergency Contacts:**

- SSH Access: `ssh ec2-user@44.200.182.180`
- CloudShell: AWS Console > CloudShell (top right)
- Database: Connect via PostgreSQL client on port 5432

---

**Last Successful Deployment:** November 16, 2025 20:57 UTC  
**Deployment Package:** patabima-backend-20251116-210558.zip  
**Status:** ✅ Production Stable
