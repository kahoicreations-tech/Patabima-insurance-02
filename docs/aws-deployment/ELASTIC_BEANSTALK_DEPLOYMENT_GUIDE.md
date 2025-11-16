# AWS Elastic Beanstalk + RDS PostgreSQL Deployment Guide

## PataBima Insurance Backend - Production Deployment Best Practices

**Last Updated:** November 12, 2025  
**Status:** Production-Ready Configuration  
**Stack:** Django 4.2.16 + PostgreSQL 15 + Python 3.11

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure Required](#project-structure-required)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup (RDS PostgreSQL)](#database-setup-rds-postgresql)
7. [Security Best Practices](#security-best-practices)
8. [Monitoring & Logging](#monitoring--logging)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Route 53 (DNS)                       │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│          Application Load Balancer (ALB)                │
│                   HTTPS/SSL                             │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│           Elastic Beanstalk Environment                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  EC2 Auto Scaling Group (2-10 instances)        │   │
│  │  - Python 3.11 Platform                         │   │
│  │  - Nginx + Gunicorn                             │   │
│  │  - Django 4.2.16 Application                    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         │ RDS Connection     │ S3 Access          │ SES Email
         ▼                    ▼                    ▼
┌─────────────────┐   ┌──────────────┐   ┌──────────────┐
│  RDS PostgreSQL │   │   S3 Bucket  │   │   AWS SES    │
│  (Multi-AZ)     │   │  (Media)     │   │  (Email)     │
│  - PostgreSQL15 │   │  - PDF Files │   │  - us-east-1 │
│  - db.t3.medium │   │  - Uploads   │   └──────────────┘
│  - 100GB SSD    │   └──────────────┘
└─────────────────┘
```

**Key Components:**
- **Elastic Beanstalk**: Managed application platform with auto-scaling
- **RDS PostgreSQL**: Managed database with automated backups and Multi-AZ
- **S3**: Static files and media storage
- **SES**: Email delivery service
- **CloudWatch**: Monitoring and logging
- **Application Load Balancer**: SSL termination and load balancing

---

## Prerequisites

### 1. AWS Account Setup
- ✅ AWS Account with billing enabled
- ✅ IAM User with programmatic access
- ✅ AWS CLI installed and configured

### 2. Required IAM Permissions
Create an IAM user with these managed policies:
- `AWSElasticBeanstalkFullAccess`
- `AmazonRDSFullAccess`
- `AmazonS3FullAccess`
- `AmazonSESFullAccess`
- `CloudWatchFullAccess`

### 3. Local Environment
```bash
# Install EB CLI
pip install awsebcli

# Verify installation
eb --version
# Expected: EB CLI 3.20.x (Python 3.11.x)

# Configure AWS credentials
aws configure
# AWS Access Key ID: AKIA3WWYMRDO6RN5CNGM
# AWS Secret Access Key: [from your credentials]
# Default region: us-east-1
# Default output format: json
```

### 4. Domain & SSL
- ✅ Domain registered (e.g., patabima.co.ke)
- ✅ SSL certificate in AWS Certificate Manager (ACM)
- ✅ Route 53 hosted zone (optional, recommended)

---

## Project Structure Required

### 1. Create Required Files in `insurance-app/` Root

```
insurance-app/
├── .ebextensions/              # EB configuration
│   ├── 01_packages.config      # System packages
│   ├── 02_python.config        # Python environment
│   ├── 03_django.config        # Django setup
│   ├── 04_https.config         # HTTPS redirect
│   └── 05_logs.config          # CloudWatch logs
├── .ebignore                   # Files to exclude from deployment
├── .platform/                  # Platform hooks (Python 3.11)
│   └── hooks/
│       └── postdeploy/
│           ├── 01_migrate.sh   # Run migrations
│           └── 02_collectstatic.sh  # Collect static files
├── Procfile                    # Process configuration
├── requirements.txt            # Python dependencies
├── runtime.txt                 # Python version
├── manage.py
├── insurance/
│   ├── settings.py
│   ├── wsgi.py
│   └── ...
└── app/
    └── ...
```

---

## Step-by-Step Deployment

### Step 1: Create `.ebignore` File

```bash
# File: insurance-app/.ebignore
# Excludes files from Elastic Beanstalk deployment

# Virtual environments
venv/
.venv/
env/
.env/

# Database
*.sqlite3
db.sqlite3

# Python cache
__pycache__/
*.pyc
*.pyo
*.pyd
.Python

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Git
.git/
.gitignore

# Testing
.pytest_cache/
.coverage
htmlcov/
test_*.py

# Local environment files
.env.local
.env.development

# Temporary files
tmp/
temp/
*.log
*.bak

# Static files (collected during deployment)
staticfiles/
static_exports/

# Media files (use S3)
media/

# Documentation
docs/
*.md
README.md

# Expo (if mistakenly in backend)
.expo/
node_modules/
package.json
package-lock.json

# Backups
backups/
*.sql
*.dump

# DMVIC credentials (sensitive)
dmvic_credentials/
*.pfx

# Test files
test_*.py
*_test.py
tests/

# Scripts
scripts/
run_*.ps1
run_*.sh
cleanup_*.py
check_*.py
list_users.py
```

### Step 2: Create `Procfile`

```bash
# File: insurance-app/Procfile
# Defines process types for Elastic Beanstalk

web: gunicorn --bind :8000 --workers 3 --threads 2 --timeout 120 --access-logfile - --error-logfile - insurance.wsgi:application
```

**Explanation:**
- `--workers 3`: Number of worker processes (recommended: 2-4 per CPU core)
- `--threads 2`: Threads per worker
- `--timeout 120`: Request timeout (2 minutes for DMVIC/payment operations)
- `--access-logfile -`: Log to stdout (CloudWatch)
- `--error-logfile -`: Error logs to stdout

### Step 3: Create `runtime.txt`

```bash
# File: insurance-app/runtime.txt
python-3.11
```

### Step 4: Update `requirements.txt`

Add Gunicorn to your dependencies:

```bash
# Add to insurance-app/requirements.txt
gunicorn==21.2.0
```

Updated `requirements.txt`:
```
asgiref==3.9.1
Django==4.2.16
django-cors-headers==4.3.1
django-filter==23.3
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.1
PyJWT==2.10.1
sqlparse==0.5.3
pytz==2025.2
requests==2.32.3
dj-database-url==2.1.0
psycopg[binary]==3.2.10
python-dotenv==1.0.1
boto3==1.35.23
django-storages==1.14.4
Pillow==11.3.0
reportlab==4.0.7
django-ses==4.2.0
gunicorn==21.2.0
pyOpenSSL==24.3.0
cryptography==44.0.0
```

### Step 5: Create `.ebextensions` Configuration

#### `01_packages.config`
```yaml
# File: insurance-app/.ebextensions/01_packages.config
# System-level packages required by the application

packages:
  yum:
    git: []
    postgresql15-devel: []  # Required for psycopg compilation
    python3-devel: []
    gcc: []
    libjpeg-turbo-devel: []  # Pillow dependency
    zlib-devel: []           # Pillow dependency
```

#### `02_python.config`
```yaml
# File: insurance-app/.ebextensions/02_python.config
# Python environment configuration

option_settings:
  aws:elasticbeanstalk:container:python:
    WSGIPath: insurance.wsgi:application
  
  aws:elasticbeanstalk:application:environment:
    DJANGO_SETTINGS_MODULE: insurance.settings
    PYTHONUNBUFFERED: 1
```

#### `03_django.config`
```yaml
# File: insurance-app/.ebextensions/03_django.config
# Django-specific configuration

container_commands:
  01_migrate:
    command: "source /var/app/venv/*/bin/activate && python3 manage.py migrate --noinput"
    leader_only: true
  02_createsu:
    command: "source /var/app/venv/*/bin/activate && python3 manage.py createsu"
    leader_only: true
    ignoreErrors: true
  03_collectstatic:
    command: "source /var/app/venv/*/bin/activate && python3 manage.py collectstatic --noinput"
    leader_only: true

option_settings:
  aws:elasticbeanstalk:application:environment:
    DJANGO_SETTINGS_MODULE: insurance.settings
```

#### `04_https.config`
```yaml
# File: insurance-app/.ebextensions/04_https.config
# HTTPS redirect configuration

files:
  "/etc/nginx/conf.d/https_redirect.conf":
    mode: "000644"
    owner: root
    group: root
    content: |
      server {
          listen 80;
          server_name _;
          
          # Health check endpoint (no redirect)
          location /health {
              access_log off;
              return 200 "OK";
          }
          
          # Redirect all other HTTP traffic to HTTPS
          location / {
              if ($http_x_forwarded_proto != 'https') {
                  return 301 https://$host$request_uri;
              }
              proxy_pass http://127.0.0.1:8000;
              proxy_set_header Host $host;
              proxy_set_header X-Real-IP $remote_addr;
              proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
              proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
          }
      }
```

#### `05_logs.config`
```yaml
# File: insurance-app/.ebextensions/05_logs.config
# CloudWatch Logs configuration

option_settings:
  aws:elasticbeanstalk:cloudwatch:logs:
    StreamLogs: true
    DeleteOnTerminate: false
    RetentionInDays: 7
  
  aws:elasticbeanstalk:cloudwatch:logs:health:
    HealthStreamingEnabled: true
    DeleteOnTerminate: false
    RetentionInDays: 7
```

### Step 6: Create Platform Hooks

#### `01_migrate.sh`
```bash
#!/bin/bash
# File: insurance-app/.platform/hooks/postdeploy/01_migrate.sh
# Run database migrations after deployment

source /var/app/venv/*/bin/activate
cd /var/app/current

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Migrations completed!"
```

#### `02_collectstatic.sh`
```bash
#!/bin/bash
# File: insurance-app/.platform/hooks/postdeploy/02_collectstatic.sh
# Collect static files after deployment

source /var/app/venv/*/bin/activate
cd /var/app/current

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Static files collected!"
```

Make scripts executable:
```bash
chmod +x .platform/hooks/postdeploy/*.sh
```

### Step 7: Update Django `settings.py` for Production

```python
# File: insurance-app/insurance/settings.py

import os
import dj_database_url
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'CHANGE_ME_IN_PRODUCTION')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

# ALLOWED_HOSTS configuration
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')

# Database configuration
# Elastic Beanstalk automatically sets RDS_* environment variables when you attach an RDS database
if 'RDS_HOSTNAME' in os.environ:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ['RDS_DB_NAME'],
            'USER': os.environ['RDS_USERNAME'],
            'PASSWORD': os.environ['RDS_PASSWORD'],
            'HOST': os.environ['RDS_HOSTNAME'],
            'PORT': os.environ.get('RDS_PORT', '5432'),
            'CONN_MAX_AGE': 600,  # Persistent connections
            'OPTIONS': {
                'connect_timeout': 10,
                'options': '-c statement_timeout=30000'  # 30 second query timeout
            }
        }
    }
else:
    # Development/fallback configuration
    DATABASES = {
        'default': dj_database_url.config(
            env='DATABASE_URL',
            default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}"
        )
    }

# Static files configuration for production
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]

# Security settings for production
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# CORS configuration
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:8081').split(',')
CORS_ALLOW_CREDENTIALS = True

# Logging configuration for CloudWatch
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {name} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': os.getenv('LOG_LEVEL', 'INFO'),
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
        'app': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
```

### Step 8: Initialize Elastic Beanstalk Application

```bash
# Navigate to backend directory
cd insurance-app/

# Initialize EB application
eb init

# Select options:
# - Region: us-east-1
# - Application name: patabima-insurance-backend
# - Platform: Python 3.11 running on 64bit Amazon Linux 2023
# - Use CodeCommit: No
# - SSH: Yes (for debugging)
```

### Step 9: Create Elastic Beanstalk Environment

```bash
# Create production environment
eb create patabima-production \
  --instance-type t3.medium \
  --elb-type application \
  --envvars \
    SECRET_KEY='your-production-secret-key-here-minimum-50-chars-random' \
    DEBUG=False \
    ALLOWED_HOSTS='api.patabima.co.ke,.elasticbeanstalk.com' \
    USE_S3_MEDIA=1 \
    AWS_STORAGE_BUCKET_NAME=patabima-media \
    AWS_S3_REGION_NAME=us-east-1 \
    EMAIL_BACKEND=django_ses.SESBackend \
    DEFAULT_FROM_EMAIL=noreply@patabima.co.ke \
    DMVIC_ENABLED=True \
    DMVIC_BASE_URL=https://uat-api.dmvic.com \
    DMVIC_MEMBER_CODE=PATABIMA \
    CORS_ALLOWED_ORIGINS='https://app.patabima.co.ke,https://www.patabima.co.ke'

# This command:
# - Creates EC2 instances (t3.medium recommended for production)
# - Sets up Application Load Balancer (ALB)
# - Configures Auto Scaling (2-10 instances)
# - Sets environment variables
# - Deploys your application
```

---

## Database Setup (RDS PostgreSQL)

### Option 1: Create RDS via Elastic Beanstalk Console (Recommended for Beginners)

1. Go to AWS Elastic Beanstalk Console
2. Select your environment (`patabima-production`)
3. Click **Configuration** → **Database**
4. Configure:
   - **Engine**: `postgres`
   - **Engine version**: `15.5`
   - **Instance class**: `db.t3.medium` (production) or `db.t3.micro` (dev)
   - **Storage**: `100 GB` GP3 SSD
   - **Username**: `patabima_admin`
   - **Password**: [Strong password 20+ chars]
   - **Retention**: `7 days` (automated backups)
   - **Multi-AZ**: `Yes` (production only, adds cost)

5. Click **Apply**

**⚠️ WARNING**: Database created this way is **tied to the EB environment**. If you delete the environment, the database is also deleted. For production, use Option 2.

### Option 2: Create Standalone RDS (Recommended for Production)

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier patabima-db-prod \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.5 \
  --master-username patabima_admin \
  --master-user-password 'YourSecurePassword123!@#' \
  --allocated-storage 100 \
  --storage-type gp3 \
  --storage-encrypted \
  --backup-retention-period 7 \
  --multi-az \
  --publicly-accessible false \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name default \
  --tags Key=Name,Value=PataBima-Production-DB Key=Environment,Value=production
```

**Security Group Configuration:**
```bash
# Allow PostgreSQL access from Elastic Beanstalk security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-rds-security-group-id \
  --protocol tcp \
  --port 5432 \
  --source-group sg-eb-security-group-id
```

**Configure EB Environment Variables:**
```bash
eb setenv \
  RDS_HOSTNAME=patabima-db-prod.xxxxxxxx.us-east-1.rds.amazonaws.com \
  RDS_PORT=5432 \
  RDS_DB_NAME=patabima_insurance \
  RDS_USERNAME=patabima_admin \
  RDS_PASSWORD='YourSecurePassword123!@#'
```

### Database Migration

```bash
# Run migrations after DB is ready
eb ssh patabima-production

# Inside EC2 instance:
source /var/app/venv/*/bin/activate
cd /var/app/current
python manage.py migrate
python manage.py createsuperuser
exit
```

---

## Environment Configuration

### Required Environment Variables

```bash
# Set all environment variables
eb setenv \
  # Django Core
  SECRET_KEY='django-insecure-CHANGE-ME-TO-RANDOM-50-CHAR-STRING' \
  DEBUG=False \
  ALLOWED_HOSTS='api.patabima.co.ke,.elasticbeanstalk.com' \
  DJANGO_SETTINGS_MODULE='insurance.settings' \
  \
  # Database (RDS - auto-set if using EB-managed RDS)
  RDS_HOSTNAME='patabima-db.xxxxxxxx.us-east-1.rds.amazonaws.com' \
  RDS_PORT=5432 \
  RDS_DB_NAME='patabima_insurance' \
  RDS_USERNAME='patabima_admin' \
  RDS_PASSWORD='YourSecurePassword' \
  \
  # AWS Services
  AWS_STORAGE_BUCKET_NAME='patabima-media-prod' \
  AWS_S3_REGION_NAME='us-east-1' \
  USE_S3_MEDIA=1 \
  AWS_SES_REGION_NAME='us-east-1' \
  EMAIL_BACKEND='django_ses.SESBackend' \
  DEFAULT_FROM_EMAIL='noreply@patabima.co.ke' \
  \
  # DMVIC Integration
  DMVIC_ENABLED=True \
  DMVIC_BASE_URL='https://uat-api.dmvic.com' \
  DMVIC_USERNAME='your-dmvic-username' \
  DMVIC_PASSWORD='your-dmvic-password' \
  DMVIC_CLIENT_ID='your-client-id' \
  DMVIC_MEMBER_CODE='PATABIMA' \
  DMVIC_PFX_PATH='dmvic_credentials/PatabimaAgencyUAT.pfx' \
  DMVIC_PASSPHRASE='your-pfx-passphrase' \
  \
  # CORS
  CORS_ALLOWED_ORIGINS='https://app.patabima.co.ke,https://www.patabima.co.ke' \
  \
  # Logging
  LOG_LEVEL='INFO' \
  DJANGO_LOG_LEVEL='INFO'
```

### View Current Environment Variables

```bash
eb printenv
```

---

## Security Best Practices

### 1. Secure Secrets Management

**❌ Don't:**
- Hardcode secrets in `settings.py`
- Commit `.env` files to Git
- Use default SECRET_KEY

**✅ Do:**
- Use AWS Systems Manager Parameter Store for secrets:

```bash
# Store secrets in SSM Parameter Store
aws ssm put-parameter \
  --name "/patabima/production/SECRET_KEY" \
  --value "your-secret-key" \
  --type "SecureString"

aws ssm put-parameter \
  --name "/patabima/production/RDS_PASSWORD" \
  --value "your-db-password" \
  --type "SecureString"

aws ssm put-parameter \
  --name "/patabima/production/DMVIC_PASSWORD" \
  --value "your-dmvic-password" \
  --type "SecureString"
```

Update `settings.py` to read from SSM:
```python
import boto3

def get_secret(parameter_name):
    ssm = boto3.client('ssm', region_name='us-east-1')
    response = ssm.get_parameter(Name=parameter_name, WithDecryption=True)
    return response['Parameter']['Value']

# In production
if not DEBUG:
    SECRET_KEY = get_secret('/patabima/production/SECRET_KEY')
    # RDS password already set by EB
    DMVIC_PASSWORD = get_secret('/patabima/production/DMVIC_PASSWORD')
```

### 2. IAM Roles Best Practices

Create a custom IAM role for EC2 instances with minimal permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::patabima-media-prod/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": "arn:aws:ssm:us-east-1:*:parameter/patabima/production/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3. Database Security

```sql
-- Connect to PostgreSQL
psql -h patabima-db-prod.xxxxx.rds.amazonaws.com -U patabima_admin -d patabima_insurance

-- Create application-specific user with limited privileges
CREATE USER patabima_app WITH PASSWORD 'AppUserPassword123!';

-- Grant necessary permissions only
GRANT CONNECT ON DATABASE patabima_insurance TO patabima_app;
GRANT USAGE ON SCHEMA public TO patabima_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO patabima_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO patabima_app;

-- Revoke superuser from application
REVOKE ALL PRIVILEGES ON DATABASE postgres FROM patabima_app;
```

Update Django settings to use `patabima_app` instead of `patabima_admin`.

### 4. SSL/TLS Configuration

```bash
# Request SSL certificate in ACM
aws acm request-certificate \
  --domain-name api.patabima.co.ke \
  --subject-alternative-names www.api.patabima.co.ke \
  --validation-method DNS

# Attach certificate to Load Balancer (via EB Console)
# Configuration → Load Balancer → Listeners → Add HTTPS:443
# - Protocol: HTTPS
# - Port: 443
# - SSL Certificate: Select from ACM
```

### 5. Enable Web Application Firewall (WAF)

```bash
# Create WAF Web ACL
aws wafv2 create-web-acl \
  --scope REGIONAL \
  --region us-east-1 \
  --name patabima-waf \
  --default-action Allow={} \
  --rules file://waf-rules.json

# Attach to ALB (via AWS Console)
```

---

## Monitoring & Logging

### 1. CloudWatch Alarms

```bash
# CPU Utilization Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name patabima-high-cpu \
  --alarm-description "Alarm when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:patabima-alerts

# Database Connections Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name patabima-db-connections \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=DBInstanceIdentifier,Value=patabima-db-prod
```

### 2. Custom Django Metrics

Add to `settings.py`:
```python
import boto3

cloudwatch = boto3.client('cloudwatch', region_name='us-east-1')

def log_custom_metric(metric_name, value, unit='Count'):
    """Log custom metrics to CloudWatch"""
    try:
        cloudwatch.put_metric_data(
            Namespace='PataBima/Application',
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': unit,
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
    except Exception as e:
        logger.error(f'Failed to log metric {metric_name}: {e}')
```

Usage in views:
```python
from insurance.settings import log_custom_metric

def create_policy(request):
    # ... business logic ...
    log_custom_metric('PoliciesCreated', 1)
    return Response(...)
```

### 3. Log Analysis

```bash
# View logs in real-time
eb logs --stream

# Download logs
eb logs --all > logs.txt

# Query CloudWatch Insights
aws logs start-query \
  --log-group-name /aws/elasticbeanstalk/patabima-production/var/log/eb-engine.log \
  --start-time 1699776000 \
  --end-time 1699862400 \
  --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20'
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# File: .github/workflows/deploy-production.yml

name: Deploy to Elastic Beanstalk

on:
  push:
    branches:
      - main
    paths:
      - 'insurance-app/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd insurance-app
          pip install -r requirements.txt
          pip install awsebcli
      
      - name: Run tests
        run: |
          cd insurance-app
          python manage.py test
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy to Elastic Beanstalk
        run: |
          cd insurance-app
          eb deploy patabima-production --timeout 20
      
      - name: Run post-deployment health check
        run: |
          sleep 60
          curl -f https://api.patabima.co.ke/health || exit 1
      
      - name: Notify Slack on success
        if: success()
        uses: slackapi/slack-github-action@v1.24.0
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "✅ Production deployment successful! 🚀"
            }
      
      - name: Notify Slack on failure
        if: failure()
        uses: slackapi/slack-github-action@v1.24.0
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "❌ Production deployment failed!"
            }
```

---

## Troubleshooting

### Common Issues

#### 1. Deployment Fails - "No module named 'psycopg'"

**Solution:** Ensure `psycopg[binary]` is in `requirements.txt` and `postgresql15-devel` is in `.ebextensions/01_packages.config`.

#### 2. Static Files Not Loading

```bash
# SSH into instance
eb ssh patabima-production

# Check static files
ls -la /var/app/current/staticfiles/

# Manually collect static
source /var/app/venv/*/bin/activate
cd /var/app/current
python manage.py collectstatic --noinput
```

#### 3. Database Connection Timeout

**Check security group:**
```bash
# Verify RDS security group allows EC2 instances
aws ec2 describe-security-groups --group-ids sg-xxxxx
```

**Test connection:**
```python
# In Django shell
from django.db import connection
connection.ensure_connection()
```

#### 4. 502 Bad Gateway

**Check Gunicorn logs:**
```bash
eb ssh
sudo tail -f /var/log/eb-engine.log
sudo tail -f /var/log/web.stdout.log
```

#### 5. Environment Health Degraded

```bash
# Check health
eb health

# Detailed status
eb status --verbose

# Event logs
eb events --follow
```

### Debug Mode

**Never run DEBUG=True in production!**

For debugging, use:
```python
# settings.py
DEBUG = False
ALLOWED_HOSTS = ['*']

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
}
```

---

## Cost Optimization

### Estimated Monthly Costs (Production)

| Service | Configuration | Monthly Cost (USD) |
|---------|---------------|-------------------|
| Elastic Beanstalk Environment | t3.medium (2 instances) | $60 |
| Application Load Balancer | Standard | $22 |
| RDS PostgreSQL | db.t3.medium Multi-AZ | $130 |
| S3 Storage | 100 GB + 10,000 requests | $3 |
| Data Transfer | 100 GB outbound | $9 |
| CloudWatch Logs | 10 GB | $5 |
| **TOTAL** | | **~$229/month** |

### Cost Savings Tips

1. **Use Reserved Instances** (40-60% savings):
```bash
# Purchase 1-year reserved instance
aws ec2 purchase-reserved-instances-offering \
  --reserved-instances-offering-id xxxxxxxx \
  --instance-count 2
```

2. **Enable Auto Scaling** during low-traffic hours:
```yaml
# .ebextensions/autoscaling.config
option_settings:
  aws:autoscaling:asg:
    MinSize: 1
    MaxSize: 4
  aws:autoscaling:trigger:
    MeasureName: CPUUtilization
    Unit: Percent
    UpperThreshold: 70
    LowerThreshold: 30
```

3. **Use S3 Intelligent-Tiering**:
```python
# settings.py
AWS_S3_OBJECT_PARAMETERS = {
    'StorageClass': 'INTELLIGENT_TIERING',
}
```

4. **Optimize RDS** (switch to Single-AZ for dev/staging):
```bash
aws rds modify-db-instance \
  --db-instance-identifier patabima-db-dev \
  --no-multi-az \
  --apply-immediately
```

---

## Next Steps

### 1. Initial Deployment Checklist

- [ ] Create `.ebignore`, `Procfile`, `runtime.txt`
- [ ] Create `.ebextensions/` configuration files
- [ ] Update `requirements.txt` with `gunicorn`
- [ ] Update `settings.py` for production
- [ ] Initialize EB application: `eb init`
- [ ] Create environment: `eb create patabima-production`
- [ ] Create RDS PostgreSQL instance
- [ ] Configure environment variables: `eb setenv ...`
- [ ] Run migrations: `eb ssh` → `python manage.py migrate`
- [ ] Create superuser: `python manage.py createsuperuser`
- [ ] Test endpoints: `curl https://api.patabima.co.ke/health`

### 2. Post-Deployment Tasks

- [ ] Configure SSL certificate in ACM
- [ ] Attach SSL to Load Balancer
- [ ] Set up Route 53 DNS (if applicable)
- [ ] Configure CloudWatch Alarms
- [ ] Set up SNS notifications for alerts
- [ ] Implement CI/CD pipeline (GitHub Actions)
- [ ] Document runbooks for common issues
- [ ] Schedule regular backups (RDS automated backups enabled)

### 3. Monitoring Setup

- [ ] Create CloudWatch Dashboard
- [ ] Set up application performance monitoring (APM)
- [ ] Configure log aggregation
- [ ] Enable X-Ray tracing (optional)

---

## Additional Resources

- [AWS Elastic Beanstalk Python Documentation](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create-deploy-python-django.html)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

---

**Questions? Issues?**  
Contact: DevOps Team | admin@patabima.co.ke
