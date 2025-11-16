# Latest EC2 Deployment Summary

**Deployment Date:** November 14, 2025 at 7:27 AM UTC (10:27 AM Nairobi Time)

## 📦 What Was Deployed

### Deployment Archive
- **S3 Location:** `s3://patabima-media-prod/deployment/patabima-backend.zip`
- **Size:** 290.13 MB (304,228,105 bytes)
- **Last Modified:** November 14, 2025 07:27:32 UTC

### EC2 Instance Details
- **Instance ID:** `i-0d0f116005d812275`
- **Public IP:** `44.200.182.180`
- **Instance Type:** `t3.medium`
- **Launch Time:** November 14, 2025 07:23:41 UTC
- **Name Tag:** `patabima--agency`
- **Status:** Running ✅

### Deployed Components

1. **Django Backend (insurance-app)**
   - Full Django 4.2.16 application
   - PostgreSQL database connection configured
   - RDS endpoint: `patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com:5432`

2. **Web Server Stack**
   - **Gunicorn:** WSGI server running Django
   - **Nginx:** Reverse proxy on port 80/443
   - **Systemd Service:** `patabima.service` (auto-start on boot)

3. **Key Configuration Files**
   - `/etc/systemd/system/patabima.service`
   - `/etc/nginx/conf.d/patabima.conf`
   - `/var/www/patabima/` (application directory)

4. **Database Seeding Scripts**
   - Motor insurance pricing data
   - Underwriter configurations
   - Test data scripts

## 🚀 Active Services

### API Endpoints (Live)
- **Health Check:** http://44.200.182.180/api/v1/health/
  - Status: `ok`
  - Service: `pata-bima-api`

- **Motor Insurance API:** http://44.200.182.180/api/motor2/
- **Authentication:** http://44.200.182.180/api/auth/
- **Quotations:** http://44.200.182.180/api/quotations/

### Database (RDS PostgreSQL)
- **Endpoint:** patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com
- **Port:** 5432
- **Database:** patabimadb
- **Status:** Available ✅

## 📂 Deployment Structure

```
/var/www/patabima/
├── venv/                    # Python virtual environment
├── insurance-app/           # Django project root
│   ├── app/                # Main Django app
│   ├── insurance/          # Project settings
│   ├── manage.py
│   └── requirements.txt
├── logs/
│   ├── error.log
│   └── access.log
└── gunicorn.sock           # Unix socket for Nginx ↔ Gunicorn
```

## 🔧 Services Running

```bash
# Service Status
sudo systemctl status patabima  # Gunicorn + Django
sudo systemctl status nginx     # Nginx reverse proxy

# Service Control
sudo systemctl restart patabima
sudo systemctl restart nginx
```

## 🗂️ Deployment Files Included

The deployed ZIP contains:

### Core Application
- `manage.py` - Django management command
- `requirements.txt` - Python dependencies
- `app/` - Main Django application
- `insurance/` - Django project settings

### Configuration
- `.env` - Environment variables (SECRET_KEY, RDS credentials)
- `runtime.txt` - Python 3.11
- `Procfile` - Process definition
- `.ebextensions/` - AWS Elastic Beanstalk configs (legacy)

### Database & Seeding
- `motor_pricing.json` - Motor insurance pricing data
- `motor_subcategories.json` - Motor product definitions
- `insurance_providers.json` - Underwriter configurations

### Testing & Utilities
- `test_dmvic_*.py` - DMVIC integration tests
- `check_tables.py` - Database inspection
- `cleanup_duplicates.py` - Data cleanup utility

### Documentation
- `README.md` - Project documentation
- `MOTOR2_TEST_GUIDE.md` - Testing guide
- `DMVIC_SETUP_GUIDE.md` - DMVIC integration guide
- `DEPLOYMENT_QUICK_START.md` - Deployment instructions

## 🔄 What Changed Since Last Deployment

### November 14, 2025 Deployment
- ✅ Full Django application deployed to EC2
- ✅ Gunicorn + Nginx configured
- ✅ RDS PostgreSQL connection established
- ✅ Motor insurance pricing system active
- ✅ DMVIC integration configured
- ✅ API endpoints serving successfully

### Previous State (Before Nov 14)
- Empty EC2 instance (just launched)
- No application deployed
- Only basic OS installation

## 📊 Deployment Metrics

| Metric | Value |
|--------|-------|
| Deployment Size | 290 MB |
| Python Packages | 50+ (Django, DRF, psycopg, boto3, etc.) |
| Database Tables | ~30 tables |
| API Endpoints | ~20 endpoints |
| Uptime Since Deploy | ~2.5 days |

## 🎯 Next Steps Available

### If You Want to Update Deployment
1. Modify code locally
2. Create new ZIP: `Compress-Archive -Path .\insurance-app\* -DestinationPath new-backend.zip`
3. Upload to S3: `aws s3 cp new-backend.zip s3://patabima-media-prod/deployment/`
4. SSH to EC2 and redeploy

### If You Want to Rollback
1. Run: `.\deployment\rollback-ec2.ps1` (removes current deployment)
2. Redeploy from previous backup/version

### If You Want Fresh Start
1. Terminate instance: `.\deployment\terminate-ec2.ps1`
2. Launch new EC2 instance
3. Deploy from scratch

## 🔐 Environment Variables (Active)

```bash
DJANGO_SETTINGS_MODULE=insurance.settings
PYTHONUNBUFFERED=1
SECRET_KEY=[hidden - configured in .env]
DEBUG=False
ALLOWED_HOSTS=44.200.182.180,api.patabima.co.ke

# Database (RDS)
RDS_HOSTNAME=patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com
RDS_PORT=5432
RDS_DB_NAME=patabimadb
RDS_USERNAME=patabimaadmin
RDS_PASSWORD=[hidden]

# AWS Services
AWS_STORAGE_BUCKET_NAME=patabima-media-prod
AWS_REGION=us-east-1
```

## ✅ Verification

**Current Status:** All systems operational

```bash
# Health Check
curl http://44.200.182.180/api/v1/health/
# Response: {"status": "ok", "service": "pata-bima-api"}

# API Test
curl http://44.200.182.180/api/motor2/categories/
# Response: List of motor insurance categories
```

---

**Summary:** The November 14, 2025 deployment is the **CURRENT ACTIVE DEPLOYMENT** running on EC2. It includes the full Django backend with Motor 2 insurance system, RDS database integration, and all production configurations.
