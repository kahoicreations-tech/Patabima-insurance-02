# Complete Deployment Guide - PataBima Insurance Backend

**Last Updated:** November 17, 2025  
**EC2 Instance:** i-0d0f116005d812275  
**Public IP:** 44.200.182.180  
**Environment:** Production (AWS us-east-1)

---

## Table of Contents

1. [Quick Deployment (5 minutes)](#quick-deployment-5-minutes)
2. [Environment Configuration](#environment-configuration)
3. [DMVIC Integration Setup](#dmvic-integration-setup)
4. [Database Management](#database-management)
5. [Service Management](#service-management)
6. [Troubleshooting](#troubleshooting)
7. [Rollback Procedures](#rollback-procedures)

---

## Quick Deployment (5 Minutes)

### When to Use
Use this when you've made code changes and need to deploy updates to production.

### Prerequisites
- [ ] Code changes committed to Git
- [ ] Local testing completed
- [ ] New migrations created (if models changed)
- [ ] requirements.txt updated (if new packages added)

### Step 1: Package the Application (Local)

```powershell
# Navigate to project root
cd C:\Users\USER\Desktop\PATABIMA01

# Create timestamped deployment package
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$zipFile = "patabima-backend-$timestamp.zip"

# Compress insurance-app directory
Compress-Archive -Path insurance-app\* -DestinationPath $zipFile -Force

Write-Host "Created: $zipFile" -ForegroundColor Green
```

### Step 2: Upload to EC2 (AWS CloudShell)

```bash
# Open AWS CloudShell: https://console.aws.amazon.com/cloudshell

# Upload your ZIP file via CloudShell Actions > Upload file
# Then transfer to EC2:

# Set variables
TIMESTAMP="20251117-062000"  # Replace with your actual timestamp
ZIP_FILE="patabima-backend-${TIMESTAMP}.zip"
EC2_IP="44.200.182.180"
INSTANCE_ID="i-0d0f116005d812275"

# Connect to EC2 via SSM
aws ssm start-session --target $INSTANCE_ID --region us-east-1
```

### Step 3: Deploy on EC2

```bash
# Once connected to EC2 via SSM:

# Navigate to app directory
cd /var/www/patabima

# Stop services
sudo systemctl stop patabima nginx

# Backup current deployment
sudo mv /var/www/patabima /var/www/patabima.backup.$(date +%Y%m%d-%H%M%S)

# Create new directory
sudo mkdir -p /var/www/patabima
cd /var/www/patabima

# Download ZIP from CloudShell (if uploaded to S3)
# OR upload directly via SCP (see alternative methods below)

# Extract deployment
sudo unzip /tmp/patabima-backend-*.zip -d ./
sudo chown -R ec2-user:ec2-user /var/www/patabima

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate --noinput

# Collect static files
python manage.py collectstatic --noinput --clear

# Restart services
sudo systemctl start patabima nginx

# Verify deployment
curl http://localhost/api/v1/health/
```

### Step 4: Verify Deployment

```bash
# Check service status
sudo systemctl status patabima --no-pager

# Test health endpoint
curl http://44.200.182.180/api/v1/health/

# Test Motor categories
curl http://44.200.182.180/api/v1/motor2/categories/

# Test DMVIC
curl -X POST http://44.200.182.180/api/insurance/dmvic/search-vehicle/ \
  -H "Content-Type: application/json" \
  -d '{"registration_number": "KDA123A"}'

# Check logs for errors
sudo tail -f /var/www/patabima/logs/error.log
```

---

## Environment Configuration

### Current Production .env Configuration

Location: `/var/www/patabima/.env`

```bash
# Django Core
SECRET_KEY=y4TfsQDZdrmdqMmRXv7Gr5mrEvHfop3nfhb40UjjIufjzNrw-6eiPCga4AF6eVlN6tPdGW2OcUqmwKN_v5Lyb1knWN3vYhCGT_8j
DEBUG=True  # Set to False for production
ALLOWED_HOSTS=44.200.182.180,api.patabima.co.ke,localhost,127.0.0.1,ip-172-31-75-47.ec2.internal
DJANGO_SETTINGS_MODULE=insurance.settings

# Database (RDS PostgreSQL)
RDS_HOSTNAME=patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com
RDS_PORT=5432
RDS_DB_NAME=patabimadb
RDS_USERNAME=patabimaadmin
RDS_PASSWORD=PataB1ma2025Secure

# AWS Services
USE_S3_MEDIA=1
AWS_STORAGE_BUCKET_NAME=patabima-media-prod
AWS_S3_REGION_NAME=us-east-1

# DMVIC Integration
DMVIC_ENABLED=true
DMVIC_BASE_URL=https://uat-api.dmvic.com
DMVIC_MEMBER_CODE=PATABIMA
DMVIC_USERNAME=patabimaagencyapi@dmvic.info
DMVIC_PASSWORD=6te224oIUP3l
DMVIC_CLIENT_ID=097C69C262EF4350B89E6163E1CEB397
DMVIC_PFX_PATH=dmvic_credentials/PatabimaAgencyUAT.pfx
DMVIC_PASSPHRASE=UPfUvocVVOANLqPn

# CORS
CORS_ALLOWED_ORIGINS=https://app.patabima.co.ke,https://www.patabima.co.ke

# Logging
DJANGO_LOG_FILE=/var/www/patabima/logs/django.log
DISABLE_FILE_LOGGING=True

# Security
ENABLE_SSL_REDIRECT=0
SECURE_SSL_REDIRECT=0
```

### How to Update Environment Variables

```bash
# Connect to EC2
aws ssm start-session --target i-0d0f116005d812275 --region us-east-1

# Edit .env file
sudo nano /var/www/patabima/.env

# OR add single variable
echo "NEW_VARIABLE=value" | sudo tee -a /var/www/patabima/.env

# Restart service to apply changes
sudo systemctl restart patabima

# Verify variable loaded
sudo systemctl show patabima --property=Environment
```

---

## DMVIC Integration Setup

### Prerequisites
- PFX certificate file: `PatabimaAgencyUAT.pfx`
- DMVIC credentials (username, password, client ID)
- Certificate passphrase

### Initial Setup

```bash
# 1. Create credentials directory
cd /var/www/patabima
mkdir -p dmvic_credentials
chmod 755 dmvic_credentials

# 2. Upload PFX certificate
# Option A: Via S3
aws s3 cp s3://patabima-media-prod/dmvic/PatabimaAgencyUAT.pfx ./dmvic_credentials/

# Option B: Upload to CloudShell first, then copy
# (In CloudShell) aws s3 cp ~/PatabimaAgencyUAT.pfx s3://patabima-media-prod/dmvic/

# 3. Set correct permissions
chmod 600 dmvic_credentials/PatabimaAgencyUAT.pfx

# 4. Verify certificate
ls -la dmvic_credentials/
```

### Add DMVIC Environment Variables

```bash
# Add all required DMVIC variables to .env
cat >> /var/www/patabima/.env << 'EOF'
DMVIC_ENABLED=true
DMVIC_BASE_URL=https://uat-api.dmvic.com
DMVIC_MEMBER_CODE=PATABIMA
DMVIC_USERNAME=patabimaagencyapi@dmvic.info
DMVIC_PASSWORD=6te224oIUP3l
DMVIC_CLIENT_ID=097C69C262EF4350B89E6163E1CEB397
DMVIC_PFX_PATH=dmvic_credentials/PatabimaAgencyUAT.pfx
DMVIC_PASSPHRASE=UPfUvocVVOANLqPn
EOF

# Restart service
sudo systemctl restart patabima

# Test DMVIC endpoint
curl -X POST http://localhost/api/insurance/dmvic/search-vehicle/ \
  -H "Content-Type: application/json" \
  -d '{"registration_number": "KDA123A"}'
```

### Verify DMVIC Configuration

```bash
# Check environment variables
grep DMVIC /var/www/patabima/.env

# Check certificate exists
ls -lh /var/www/patabima/dmvic_credentials/PatabimaAgencyUAT.pfx

# Check logs for DMVIC errors
sudo journalctl -u patabima -n 100 --no-pager | grep -i dmvic
```

---

## Database Management

### Connect to PostgreSQL Database

```bash
# From EC2 instance
psql -h patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com \
     -U patabimaadmin \
     -d patabimadb \
     -p 5432

# Password: PataB1ma2025Secure
```

### Run Migrations

```bash
cd /var/www/patabima
source venv/bin/activate

# Check migration status
python manage.py showmigrations

# Create new migrations (after model changes)
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# If migrations conflict
python manage.py migrate --fake-initial
```

### Create Django Superuser

```bash
cd /var/www/patabima
source venv/bin/activate

# Method 1: Interactive
python manage.py createsuperuser

# Method 2: Programmatic (for email-based auth)
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(email='admin@patabima.co.ke').exists() or User.objects.create_superuser(email='admin@patabima.co.ke', password='Admin@2025', phonenumber='0712345678')" | python manage.py shell
```

### Database Backup

```bash
# Create backup
pg_dump -h patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com \
        -U patabimaadmin \
        -d patabimadb \
        -F c \
        -f /var/www/patabima/backups/patabimadb-$(date +%Y%m%d-%H%M%S).dump

# Restore backup
pg_restore -h patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com \
           -U patabimaadmin \
           -d patabimadb \
           -c \
           /var/www/patabima/backups/patabimadb-20251117-120000.dump
```

---

## Service Management

### Systemd Service Configuration

**Service File:** `/etc/systemd/system/patabima.service`

```ini
[Unit]
Description=PataBima Insurance Gunicorn Service
After=network.target

[Service]
Type=notify
User=ec2-user
Group=ec2-user
WorkingDirectory=/var/www/patabima
Environment="PATH=/var/www/patabima/venv/bin"
EnvironmentFile=/var/www/patabima/.env
ExecStart=/var/www/patabima/venv/bin/gunicorn \
    --bind unix:/var/www/patabima/gunicorn.sock \
    --workers 3 \
    --threads 2 \
    --timeout 120 \
    --access-logfile /var/www/patabima/logs/access.log \
    --error-logfile /var/www/patabima/logs/error.log \
    --log-level info \
    insurance.wsgi:application

ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Service Commands

```bash
# Start service
sudo systemctl start patabima

# Stop service
sudo systemctl stop patabima

# Restart service
sudo systemctl restart patabima

# Reload service (graceful restart)
sudo systemctl reload patabima

# Check status
sudo systemctl status patabima --no-pager

# Enable on boot
sudo systemctl enable patabima

# Disable on boot
sudo systemctl disable patabima

# View logs
sudo journalctl -u patabima -n 100 --no-pager

# Follow logs in real-time
sudo journalctl -u patabima -f
```

### Nginx Configuration

**Config File:** `/etc/nginx/conf.d/patabima.conf`

```bash
# Restart Nginx
sudo systemctl restart nginx

# Test Nginx configuration
sudo nginx -t

# Reload Nginx (without downtime)
sudo nginx -s reload

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Service Won't Start

```bash
# Check detailed logs
sudo journalctl -u patabima -n 200 --no-pager

# Check for Python errors
sudo tail -n 100 /var/www/patabima/logs/error.log

# Check environment variables loaded
sudo systemctl show patabima --property=Environment

# Test Gunicorn manually
cd /var/www/patabima
source venv/bin/activate
gunicorn --bind 0.0.0.0:8000 insurance.wsgi:application
```

#### Issue 2: Database Connection Errors

```bash
# Test database connectivity
psql -h patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com \
     -U patabimaadmin \
     -d patabimadb \
     -c "SELECT version();"

# Check RDS security group
# Ensure EC2 instance security group is allowed in RDS inbound rules

# Verify environment variables
grep RDS_ /var/www/patabima/.env
```

#### Issue 3: DMVIC 500 Errors

```bash
# Check DMVIC variables
grep DMVIC /var/www/patabima/.env

# Verify certificate exists
ls -lh /var/www/patabima/dmvic_credentials/PatabimaAgencyUAT.pfx

# Check DMVIC-specific logs
sudo journalctl -u patabima -n 100 --no-pager | grep -i dmvic

# Test DMVIC manually
cd /var/www/patabima
source venv/bin/activate
python manage.py shell
>>> from app.services.dmvic_service import DMVICService
>>> service = DMVICService()
>>> result = service.search_vehicle('KDA123A')
>>> print(result)
```

#### Issue 4: Static Files Not Loading

```bash
# Collect static files
cd /var/www/patabima
source venv/bin/activate
python manage.py collectstatic --noinput --clear

# Check Nginx serving static files
curl -I http://44.200.182.180/static/admin/css/base.css

# Restart Nginx
sudo systemctl restart nginx
```

#### Issue 5: ModuleNotFoundError

```bash
# Reinstall requirements
cd /var/www/patabima
source venv/bin/activate
pip install -r requirements.txt --force-reinstall

# Check Python path
python -c "import sys; print('\n'.join(sys.path))"

# Verify package installed
pip list | grep <package-name>
```

---

## Rollback Procedures

### Quick Rollback to Previous Deployment

```bash
# List backups
ls -lh /var/www/ | grep patabima.backup

# Stop services
sudo systemctl stop patabima nginx

# Restore backup
sudo rm -rf /var/www/patabima
sudo mv /var/www/patabima.backup.20251117-062000 /var/www/patabima
sudo chown -R ec2-user:ec2-user /var/www/patabima

# Restart services
sudo systemctl start patabima nginx

# Verify
curl http://localhost/api/v1/health/
```

### Database Rollback

```bash
# List database backups
ls -lh /var/www/patabima/backups/

# Restore specific backup
pg_restore -h patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com \
           -U patabimaadmin \
           -d patabimadb \
           --clean \
           /var/www/patabima/backups/patabimadb-20251117-060000.dump
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Code changes tested locally
- [ ] Database migrations created and tested
- [ ] requirements.txt updated
- [ ] .env variables documented
- [ ] Backup created

### Deployment
- [ ] Services stopped
- [ ] Code deployed
- [ ] Dependencies installed
- [ ] Migrations applied
- [ ] Static files collected
- [ ] Services restarted

### Post-Deployment
- [ ] Health check passed
- [ ] Motor endpoints tested
- [ ] DMVIC integration verified
- [ ] Logs checked for errors
- [ ] Frontend tested against API
- [ ] Backup verified

---

## Quick Reference Commands

### One-Liner: Full Deployment

```bash
cd /var/www/patabima && \
sudo systemctl stop patabima nginx && \
sudo mv /var/www/patabima /var/www/patabima.backup.$(date +%Y%m%d-%H%M%S) && \
sudo mkdir -p /var/www/patabima && \
sudo unzip /tmp/patabima-backend-*.zip -d /var/www/patabima/ && \
sudo chown -R ec2-user:ec2-user /var/www/patabima && \
source /var/www/patabima/venv/bin/activate && \
pip install -r /var/www/patabima/requirements.txt && \
python /var/www/patabima/manage.py migrate --noinput && \
python /var/www/patabima/manage.py collectstatic --noinput --clear && \
sudo systemctl start patabima nginx && \
curl http://localhost/api/v1/health/
```

### One-Liner: Quick Restart

```bash
sudo systemctl restart patabima nginx && sleep 3 && curl http://localhost/api/v1/health/
```

### One-Liner: Check All Services

```bash
echo "=== Patabima Service ===" && sudo systemctl status patabima --no-pager && \
echo "=== Nginx Service ===" && sudo systemctl status nginx --no-pager && \
echo "=== Health Check ===" && curl http://localhost/api/v1/health/
```

---

## Contact & Support

**AWS Account:** KAHOI-KREATIONS (804686432477)  
**Region:** us-east-1  
**EC2 Instance:** i-0d0f116005d812275 (44.200.182.180)  
**RDS Database:** patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com

**CloudShell Access:** https://console.aws.amazon.com/cloudshell  
**EC2 Console:** https://console.aws.amazon.com/ec2

---

**Last Successful Deployment:** November 17, 2025 06:24 UTC  
**DMVIC Status:** ✅ Working  
**Motor API Status:** ✅ Working  
**Database Status:** ✅ Connected
