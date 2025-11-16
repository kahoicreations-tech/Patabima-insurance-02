# AWS Deployment Options for PataBima Insurance Backend

**Date:** November 8, 2025  
**Project:** PataBima Insurance Django Backend  
**Current Status:** Deployed on EC2 at http://34.203.241.81

---

## Table of Contents

1. [Overview](#overview)
2. [Option 1: EC2 Manual Deployment (Current)](#option-1-ec2-manual-deployment-current)
3. [Option 2: Elastic Beanstalk + RDS](#option-2-elastic-beanstalk--rds)
4. [Option 3: Hybrid EC2 + RDS](#option-3-hybrid-ec2--rds)
5. [Cost Comparison](#cost-comparison)
6. [Deployment Speed Comparison](#deployment-speed-comparison)
7. [Recommended Approach](#recommended-approach)

---

## Overview

This document compares three AWS deployment strategies for the PataBima Insurance Django backend, including step-by-step deployment guides, cost analysis, and recommendations.

**Project Requirements:**

- Django 4.2.16 backend
- PostgreSQL 16 database
- React Native Expo frontend (separate deployment)
- Motor insurance quotation system with 60+ products
- DMVIC integration, AWS Textract, M-PESA payments
- Target: Kenya market with 100-1000 daily users initially

---

## Option 1: EC2 Manual Deployment (Current)

### Architecture

```
Internet → Nginx (EC2:80) → Gunicorn (EC2:8000) → Django App
                                                    ↓
                                            PostgreSQL (EC2:5432)
```

### What We Have Now

- **EC2 Instance:** i-0041c3db00d399836 (t3.micro)
- **Public IP:** 34.203.241.81
- **OS:** Ubuntu 22.04 LTS
- **Database:** PostgreSQL 16 (on same EC2)
- **Web Server:** Nginx + Gunicorn (3 workers)
- **Status:** ✅ Fully functional

### Pros

✅ **Full Control** - Direct access to all configuration files  
✅ **Cost-Effective** - Single instance (~$10/month)  
✅ **Simple Architecture** - No complex AWS services  
✅ **Already Working** - Deployed and serving API requests  
✅ **Good for MVP** - Perfect for development/testing

### Cons

❌ **Manual Deployments** - Every update requires SSH, file upload, restart  
❌ **No Auto-Scaling** - Server crashes if traffic spikes  
❌ **Database Risk** - Single point of failure (app + DB on same instance)  
❌ **Manual Backups** - No automated database snapshots  
❌ **No Load Balancing** - Can't distribute traffic across multiple servers  
❌ **Downtime During Updates** - App goes offline during deployments

### Step-by-Step Deployment Guide (What We Did)

#### Initial Setup (One-Time)

```bash
# 1. Launch EC2 instance
# AWS Console → EC2 → Launch Instance
# - AMI: Ubuntu 22.04 LTS
# - Instance Type: t3.micro (1 vCPU, 1GB RAM)
# - Security Group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
# - Key Pair: patabima-testing-20251021.pem

# 2. Connect to EC2
ssh -i "patabima-testing-20251021.pem" ubuntu@34.203.241.81

# 3. Install dependencies
sudo apt update
sudo apt install -y python3.12 python3.12-venv python3-pip postgresql nginx

# 4. Create PostgreSQL database
sudo -u postgres psql
CREATE DATABASE patabima_insurance;
CREATE USER patabima_user WITH PASSWORD 'patabima2025';
GRANT ALL PRIVILEGES ON DATABASE patabima_insurance TO patabima_user;
\q

# 5. Create Python virtual environment
cd /home/ubuntu
mkdir insurance-app
cd insurance-app
python3.12 -m venv venv
source venv/bin/activate

# 6. Configure Nginx
sudo nano /etc/nginx/sites-available/insurance-app
# Paste configuration to proxy port 80 → 8000
sudo ln -s /etc/nginx/sites-available/insurance-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Deployment Workflow (Every Update)

```bash
# LOCAL MACHINE: Package application
cd C:\Users\USER\Desktop\PATABIMA01\insurance-app
tar -czf insurance-app-working.tar.gz \
  app/ insurance/ manage.py requirements.txt .env

# LOCAL MACHINE: Upload to EC2
scp -i "patabima-testing-20251021.pem" \
  insurance-app-working.tar.gz \
  ubuntu@34.203.241.81:/home/ubuntu/

# EC2: Extract and deploy
ssh -i "patabima-testing-20251021.pem" ubuntu@34.203.241.81
cd /home/ubuntu/insurance-app
tar -xzf ../insurance-app-working.tar.gz

# EC2: Install dependencies
source venv/bin/activate
pip install -r requirements.txt

# EC2: Run migrations
python manage.py migrate

# EC2: Collect static files
python manage.py collectstatic --noinput

# EC2: Restart Gunicorn
pkill -9 gunicorn
gunicorn --workers 3 --bind 127.0.0.1:8000 'insurance.wsgi:application' --daemon

# EC2: Verify deployment
curl http://localhost:8000/api/v1/health/
```

#### Database Seeding (After Deployment)

```bash
# EC2: Seed motor insurance data
python manage.py seed_comprehensive_motor

# Output:
# ✓ Created: 6 motor categories
# ✓ Created: 62 motor subcategories
# ✓ Created: 8 insurance providers
```

#### Troubleshooting Issues We Encountered

**Problem 1: Model/Migration Mismatch**

```bash
# Error: FieldError: Invalid field name 'pricing_type'
# Cause: Migration added field to DB but model code wasn't updated

# Solution:
# 1. Added pricing_type to MotorCategory model (models.py line 862)
# 2. Uploaded corrected models.py
# 3. Restarted Gunicorn to reload models
```

**Problem 2: Missing display_mode Column**

```bash
# Error: column app_insuranceprovider.display_mode does not exist
# Cause: Migration was faked, column not created in DB

# Solution: Manually add column
sudo -u postgres psql -d patabima_insurance -c \
  "ALTER TABLE app_insuranceprovider ADD COLUMN display_mode VARCHAR(10) DEFAULT 'GROSS';"
```

**Problem 3: Subcategories Not Showing in API**

```bash
# Issue: API returned total_count: 0 despite 62 records in DB
# Cause: show_in_public flag was false for all subcategories

# Solution: Update flag
sudo -u postgres psql -d patabima_insurance -c \
  "UPDATE app_motorsubcategory SET show_in_public = true;"
```

### Monthly Cost Breakdown

- **EC2 t3.micro:** $8.50/month (730 hours)
- **EBS Storage (30GB):** $2.40/month
- **Data Transfer:** ~$1/month (first 1GB free)
- **Total:** **~$12/month**

### When to Use This Option

- ✅ MVP/testing phase
- ✅ Budget under $50/month
- ✅ Low traffic (<100 users/day)
- ✅ Development/staging environments
- ✅ Learning AWS fundamentals

---

## Option 2: Elastic Beanstalk + RDS

### Architecture

```
Internet → Route 53 (DNS) → Application Load Balancer
                                    ↓
                            [EC2 Auto-Scaling Group]
                            ├── Instance 1 (Django)
                            ├── Instance 2 (Django)
                            └── Instance 3 (Django)
                                    ↓
                            RDS PostgreSQL (Managed DB)
                                    ↓
                            [Automated Backups to S3]
```

### What You Get

- **Elastic Beanstalk:** Managed platform for deploying Django apps
- **RDS PostgreSQL:** Managed database with automatic backups
- **Load Balancer:** Distributes traffic across multiple instances
- **Auto-Scaling:** Automatically adds/removes servers based on load
- **CloudWatch:** Monitoring and logging
- **Zero Downtime Deployments:** Rolling updates

### Pros

✅ **One-Command Deployments** - `eb deploy` updates everything  
✅ **Auto-Scaling** - Handles traffic spikes automatically  
✅ **Managed Database** - RDS handles backups, patches, failover  
✅ **High Availability** - Multiple instances across availability zones  
✅ **Built-in Monitoring** - CloudWatch metrics and alarms  
✅ **HTTPS/SSL** - Free SSL certificates via AWS Certificate Manager  
✅ **Rolling Updates** - Zero downtime during deployments  
✅ **Easy Rollback** - Revert to previous version in one command  
✅ **Environment Variables** - Managed via AWS Console (no SSH)  
✅ **CI/CD Ready** - Integrates with GitHub Actions, CodePipeline

### Cons

❌ **Higher Cost** - ~$50-70/month vs $12 for EC2  
❌ **Learning Curve** - Need to understand EB CLI, environments, load balancers  
❌ **Less Direct Control** - AWS manages infrastructure (but customizable)  
❌ **Overkill for Small Apps** - Too complex for simple MVPs

### Step-by-Step Deployment Guide

#### Prerequisites

```bash
# Install EB CLI
pip install awsebcli

# Verify installation
eb --version
# Output: EB CLI 3.20.x (Python 3.x)

# Configure AWS credentials
aws configure
# AWS Access Key ID: [Your Key]
# AWS Secret Access Key: [Your Secret]
# Default region: us-east-1
# Default output format: json
```

#### Initial Setup (One-Time)

```bash
# 1. Initialize Elastic Beanstalk application
cd C:\Users\USER\Desktop\PATABIMA01\insurance-app

eb init
# Application name: patabima-insurance
# Platform: Python 3.12
# Region: us-east-1
# SSH keypair: patabima-testing-20251021

# 2. Create .ebextensions directory for configuration
mkdir .ebextensions

# 3. Create Django configuration file
# .ebextensions/01_django.config
```

**File: `.ebextensions/01_django.config`**

```yaml
option_settings:
  aws:elasticbeanstalk:container:python:
    WSGIPath: insurance.wsgi:application
  aws:elasticbeanstalk:application:environment:
    DJANGO_SETTINGS_MODULE: insurance.settings
    PYTHONPATH: /var/app/current:$PYTHONPATH
  aws:elasticbeanstalk:environment:proxy:staticfiles:
    /static: staticfiles

container_commands:
  01_migrate:
    command: "source /var/app/venv/*/bin/activate && python manage.py migrate --noinput"
    leader_only: true
  02_collectstatic:
    command: "source /var/app/venv/*/bin/activate && python manage.py collectstatic --noinput"
  03_seed_data:
    command: "source /var/app/venv/*/bin/activate && python manage.py seed_comprehensive_motor"
    leader_only: true
```

**File: `.ebextensions/02_packages.config`**

```yaml
packages:
  yum:
    postgresql-devel: []
    gcc: []
```

#### Create RDS Database

```bash
# Option A: Via EB CLI (creates DB within Beanstalk environment)
eb create patabima-prod \
  --database \
  --database.engine postgres \
  --database.username patabima_user \
  --database.password patabima2025_secure \
  --instance t3.small \
  --scale 2

# Option B: Via AWS Console (recommended for production)
# AWS Console → RDS → Create Database
# - Engine: PostgreSQL 16
# - Template: Free tier (or Production for auto-failover)
# - DB Instance: db.t3.micro (1 vCPU, 1GB RAM)
# - Storage: 20GB SSD (auto-scaling enabled)
# - Username: patabima_user
# - Password: patabima2025_secure
# - VPC: Same as Elastic Beanstalk
# - Public access: No
# - Backup retention: 7 days
# - Automated backups: Yes
# - Multi-AZ: Yes (for production)
```

#### Configure Environment Variables

```bash
# Set database connection via EB CLI
eb setenv \
  DATABASE_URL="postgresql://patabima_user:patabima2025_secure@<rds-endpoint>:5432/patabima_insurance" \
  DJANGO_SECRET_KEY="<your-secret-key>" \
  DEBUG="False" \
  ALLOWED_HOSTS="*"

# Or via AWS Console:
# Elastic Beanstalk → Environments → Configuration → Software → Environment Properties
```

#### Deploy Application

```bash
# First deployment (creates environment)
eb create patabima-prod \
  --instance-type t3.small \
  --scale 2 \
  --envvars DATABASE_URL=postgresql://...,DEBUG=False

# Subsequent deployments (updates code)
git add .
git commit -m "Deploy new features"
eb deploy

# Monitor deployment
eb status
eb health
eb logs

# Open application in browser
eb open
```

#### Update Workflow (Every Code Change)

```bash
# 1. Make code changes locally
# 2. Test locally
python manage.py runserver

# 3. Commit to git
git add .
git commit -m "Add new feature"

# 4. Deploy to Elastic Beanstalk
eb deploy
# ✓ Uploads code
# ✓ Creates new application version
# ✓ Deploys to instances (rolling update)
# ✓ Runs migrations automatically
# ✓ Collects static files
# ✓ Health checks pass
# ✓ Switches traffic to new version
# Total time: 2-5 minutes

# 5. Verify deployment
eb open
curl https://your-app.elasticbeanstalk.com/api/v1/health/
```

#### Rollback to Previous Version

```bash
# List all deployed versions
eb appversion

# Rollback to previous version
eb deploy --version <previous-version-label>
# Or via AWS Console: Elastic Beanstalk → Application versions → Deploy
```

#### Set Up Custom Domain

```bash
# 1. Create CNAME record in Route 53
# AWS Console → Route 53 → Hosted Zones → Create Record
# Name: api.patabima.com
# Type: CNAME
# Value: patabima-prod.us-east-1.elasticbeanstalk.com

# 2. Request SSL certificate
# AWS Console → Certificate Manager → Request Certificate
# Domain: api.patabima.com
# Validation: DNS (auto-validates via Route 53)

# 3. Add HTTPS listener to Load Balancer
# Elastic Beanstalk → Configuration → Load Balancer → Add Listener
# Protocol: HTTPS
# Port: 443
# SSL Certificate: (select from ACM)
```

#### Set Up Auto-Scaling

```bash
# Via EB CLI
eb scale 3  # Set to 3 instances

# Via AWS Console: Elastic Beanstalk → Configuration → Capacity
# Environment type: Load balanced
# Min instances: 2
# Max instances: 5
# Scaling triggers:
#   - CPU > 70% → Add instance
#   - CPU < 30% → Remove instance
```

#### Database Backup and Restore

```bash
# Backups are automatic (configured during RDS creation)
# Manual snapshot via AWS Console:
# RDS → Databases → patabima-insurance → Actions → Take Snapshot

# Restore from snapshot:
# RDS → Snapshots → Select snapshot → Restore Snapshot
# Creates new RDS instance from backup

# Point-in-time recovery (if enabled):
# RDS → Databases → Actions → Restore to Point in Time
# Can restore to any second within backup retention period (7-35 days)
```

### Monthly Cost Breakdown

- **Elastic Beanstalk Environment:** Free (pay for underlying resources)
- **EC2 t3.small (2 instances):** $30/month
- **Application Load Balancer:** $22/month
- **RDS db.t3.micro:** $18/month
- **EBS Storage (60GB total):** $6/month
- **RDS Backup Storage (20GB):** $2/month
- **Data Transfer:** $5/month
- **Total:** **~$83/month**

### Cost Optimization Tips

1. **Use Reserved Instances:** Save 30-40% by committing to 1-year term
2. **Right-size instances:** Start with t3.small, downgrade if CPU < 20%
3. **Enable auto-scaling min=1 for dev:** Scale to 0 instances during off-hours
4. **Use RDS Aurora Serverless:** Pay per second instead of 24/7 instance

### When to Use This Option

- ✅ Production deployments
- ✅ Need high availability (99.9% uptime)
- ✅ Expecting traffic growth
- ✅ Multiple deployments per week
- ✅ Team of 2+ developers
- ✅ Budget allows $80-100/month

---

## Option 3: Hybrid EC2 + RDS

### Architecture

```
Internet → Nginx (EC2:80) → Gunicorn (EC2:8000) → Django App
                                                    ↓
                                            RDS PostgreSQL (Managed)
                                                    ↓
                                            [Automated Backups to S3]
```

### What You Get

- **EC2 for Application:** Manual deployment (same as Option 1)
- **RDS for Database:** Managed PostgreSQL with backups
- **Best of Both Worlds:** Cost-effective + production-grade database

### Pros

✅ **Affordable** - ~$35/month (between EC2-only and full Beanstalk)  
✅ **Database Security** - Automated backups, no data loss risk  
✅ **Separation of Concerns** - App crashes don't affect database  
✅ **Easy Migration Path** - Can upgrade to Beanstalk later  
✅ **RDS Features** - Read replicas, point-in-time recovery, monitoring

### Cons

❌ **Manual App Deployments** - Still need to SSH and upload code  
❌ **No Auto-Scaling** - Single EC2 instance (but can add later)  
❌ **More Complex Setup** - Need to configure VPC security groups

### Step-by-Step Deployment Guide

#### Step 1: Create RDS PostgreSQL Database

```bash
# AWS Console → RDS → Create Database

# Configuration:
# - Engine: PostgreSQL 16.1
# - Template: Free tier (or Dev/Test for production)
# - DB Instance: db.t3.micro (1 vCPU, 1GB RAM, 2GB storage)
# - Master username: patabima_admin
# - Master password: patabima_rds_2025_secure
# - DB name: patabima_insurance
# - VPC: Same as your EC2 (default VPC is fine)
# - Subnet group: default
# - Public access: No (secure - only EC2 can connect)
# - VPC Security Group: Create new → Name: patabima-rds-sg
# - Backup retention: 7 days (free tier allows up to 7 days)
# - Automated backups: Enabled
# - Backup window: 03:00-04:00 UTC (adjust to your timezone)
# - Maintenance window: Sun 04:00-05:00 UTC
# - Enable auto minor version upgrade: Yes
# - Monitoring: Enhanced monitoring (1 minute granularity)

# Click "Create Database"
# Wait 5-10 minutes for RDS to provision
```

#### Step 2: Configure Security Groups

```bash
# AWS Console → EC2 → Security Groups

# 1. Create/Edit RDS Security Group (patabima-rds-sg)
# Inbound Rules:
# Type: PostgreSQL
# Protocol: TCP
# Port: 5432
# Source: <EC2-security-group-id>  # Only allow EC2 to connect
# Description: Allow PostgreSQL from EC2

# 2. Edit EC2 Security Group
# Outbound Rules (if restricted):
# Type: PostgreSQL
# Protocol: TCP
# Port: 5432
# Destination: <RDS-security-group-id>
# Description: Allow connection to RDS
```

#### Step 3: Get RDS Endpoint

```bash
# AWS Console → RDS → Databases → patabima-insurance
# Copy the "Endpoint" value (looks like):
# patabima-insurance.abcdef123456.us-east-1.rds.amazonaws.com

# Also note:
# - Port: 5432
# - Master username: patabima_admin
# - Master password: patabima_rds_2025_secure
```

#### Step 4: Update Django Settings on EC2

```bash
# SSH to EC2
ssh -i "patabima-testing-20251021.pem" ubuntu@34.203.241.81

# Update .env file
cd /home/ubuntu/insurance-app
nano .env
```

**File: `.env` (on EC2)**

```bash
# Old (local PostgreSQL on EC2)
# DATABASE_URL=postgresql://patabima_user:patabima2025@localhost:5432/patabima_insurance

# New (RDS PostgreSQL)
DATABASE_URL=postgresql://patabima_admin:patabima_rds_2025_secure@patabima-insurance.abcdef123456.us-east-1.rds.amazonaws.com:5432/patabima_insurance

DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=34.203.241.81,api.patabima.com
```

#### Step 5: Migrate Data from EC2 to RDS

```bash
# EC2: Export current database
sudo -u postgres pg_dump patabima_insurance > /tmp/patabima_backup.sql

# EC2: Test RDS connection
psql "postgresql://patabima_admin:patabima_rds_2025_secure@patabima-insurance.abcdef123456.us-east-1.rds.amazonaws.com:5432/patabima_insurance"
# Should connect successfully

# EC2: Import data to RDS
psql "postgresql://patabima_admin:patabima_rds_2025_secure@patabima-insurance.abcdef123456.us-east-1.rds.amazonaws.com:5432/patabima_insurance" < /tmp/patabima_backup.sql

# Verify data imported
psql "postgresql://patabima_admin:patabima_rds_2025_secure@patabima-insurance.abcdef123456.us-east-1.rds.amazonaws.com:5432/patabima_insurance"
\dt  # List tables
SELECT COUNT(*) FROM app_motorcategory;  # Should show 6
SELECT COUNT(*) FROM app_motorsubcategory;  # Should show 62
\q
```

#### Step 6: Restart Django with RDS Connection

```bash
# EC2: Activate virtual environment
cd /home/ubuntu/insurance-app
source venv/bin/activate

# Test Django can connect to RDS
python manage.py check --database default
# Should show: System check identified no issues (0 silenced).

# Restart Gunicorn
pkill -9 gunicorn
gunicorn --workers 3 --bind 127.0.0.1:8000 'insurance.wsgi:application' --daemon

# Verify API works with RDS
curl http://localhost:8000/api/v1/health/
curl http://localhost:8000/api/v1/motor2/categories/
```

#### Step 7: Decommission Local PostgreSQL (Optional)

```bash
# EC2: Stop local PostgreSQL to save memory
sudo systemctl stop postgresql
sudo systemctl disable postgresql

# Frees up ~200MB RAM on t3.micro
free -h  # Check available memory
```

#### Step 8: Set Up Automated Backups (Already Done)

RDS automatically creates daily backups (configured during creation). You can:

```bash
# AWS Console → RDS → Databases → patabima-insurance → Maintenance & backups

# View automated backups:
# - Daily snapshots at 03:00 UTC
# - Retention: 7 days
# - Point-in-time recovery: Up to 5 minutes ago

# Create manual snapshot (before major updates):
# Actions → Take Snapshot
# Snapshot name: patabima-pre-deployment-2025-11-08
```

#### Step 9: Monitor RDS Performance

```bash
# AWS Console → RDS → Databases → patabima-insurance → Monitoring

# Key metrics to watch:
# - CPU Utilization: Should be <50%
# - Database Connections: Should be <80 (RDS t3.micro max: 100)
# - Free Storage Space: Alert if <5GB
# - Read/Write IOPS: Spikes indicate heavy queries

# Set up CloudWatch alarms:
# RDS → Databases → patabima-insurance → Actions → Manage Alarms
# - CPU > 80% for 5 minutes → Email alert
# - Free Storage < 2GB → Email alert
# - Database Connections > 90 → Email alert
```

#### Future Deployment Workflow

```bash
# Deployments remain the same as Option 1 (manual SCP)
# But database changes go through RDS migrations:

# LOCAL: Make model changes
# Edit app/models.py

# LOCAL: Create migration
python manage.py makemigrations

# LOCAL: Package and upload
tar -czf deploy.tar.gz app/ insurance/ manage.py requirements.txt
scp -i patabima.pem deploy.tar.gz ubuntu@34.203.241.81:/home/ubuntu/

# EC2: Extract and migrate
ssh -i patabima.pem ubuntu@34.203.241.81
cd /home/ubuntu/insurance-app
tar -xzf ../deploy.tar.gz
source venv/bin/activate
python manage.py migrate  # Runs against RDS
pkill -9 gunicorn
gunicorn --workers 3 --bind 127.0.0.1:8000 'insurance.wsgi:application' --daemon
```

### Monthly Cost Breakdown

- **EC2 t3.micro:** $8.50/month
- **EBS Storage (30GB):** $2.40/month
- **RDS db.t3.micro:** $18/month
- **RDS Backup Storage (20GB):** $2/month
- **Data Transfer:** $2/month
- **Total:** **~$33/month**

### When to Use This Option

- ✅ Production data needs protection (insurance records!)
- ✅ Budget is $30-50/month
- ✅ Want automated backups without full Beanstalk
- ✅ Planning to migrate to Beanstalk later
- ✅ Need database read replicas (add later)
- ✅ Compliance requires 7-day backup retention

---

## Cost Comparison

| Component              | EC2 Only               | EC2 + RDS           | Elastic Beanstalk + RDS |
| ---------------------- | ---------------------- | ------------------- | ----------------------- |
| **Application Server** | EC2 t3.micro: $8.50    | EC2 t3.micro: $8.50 | 2x t3.small: $30        |
| **Database**           | PostgreSQL on EC2: $0  | RDS t3.micro: $18   | RDS t3.micro: $18       |
| **Load Balancer**      | None: $0               | None: $0            | ALB: $22                |
| **Backups**            | Manual: $0 (risky)     | RDS Auto: $2        | RDS Auto: $2            |
| **Storage**            | EBS 30GB: $2.40        | EBS 30GB: $2.40     | EBS 60GB: $6            |
| **Data Transfer**      | $1                     | $2                  | $5                      |
| **Auto-Scaling**       | ❌ No                  | ❌ No               | ✅ Yes                  |
| **High Availability**  | ❌ No                  | ⚠️ Partial          | ✅ Yes                  |
| **Deployment Speed**   | 15-30 min              | 15-30 min           | 2-3 min                 |
| **HTTPS/SSL**          | Manual (Let's Encrypt) | Manual              | ✅ Automated (ACM)      |
| **Monitoring**         | Manual                 | CloudWatch RDS      | Full CloudWatch         |
| **TOTAL/month**        | **$12**                | **$33**             | **$83**                 |

---

## Deployment Speed Comparison

| Task                   | EC2 Only               | EC2 + RDS        | Beanstalk + RDS  |
| ---------------------- | ---------------------- | ---------------- | ---------------- |
| **Initial Setup**      | 2-4 hours              | 3-5 hours        | 1-2 hours        |
| **First Deploy**       | 2 hours                | 2 hours          | 30 mins          |
| **Code Update**        | 15-30 mins             | 15-30 mins       | **2-3 mins**     |
| **Database Migration** | 5-10 mins              | 5-10 mins        | Automated        |
| **Rollback**           | 30 mins (manual)       | 30 mins (manual) | **1 min**        |
| **Add New Instance**   | N/A (single)           | N/A (single)     | **Auto**         |
| **SSL Certificate**    | 1 hour (Let's Encrypt) | 1 hour           | **5 mins (ACM)** |
| **Database Backup**    | Manual (risky)         | **Automated**    | **Automated**    |
| **Disaster Recovery**  | 2-4 hours              | **30 mins**      | **10 mins**      |

---

## Recommended Approach

### Phase 1: MVP/Testing (Current - Next 3 Months)

**Use: EC2 Only (Option 1)**

- ✅ You're already deployed and working
- ✅ Cost: $12/month (affordable)
- ✅ Good for 0-100 users/day
- ⚠️ **Critical:** Set up manual database backups weekly!

```bash
# Weekly backup script (run on EC2)
#!/bin/bash
# /home/ubuntu/backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
sudo -u postgres pg_dump patabima_insurance > /tmp/backup_$DATE.sql
# Upload to S3 (optional)
aws s3 cp /tmp/backup_$DATE.sql s3://patabima-backups/
rm /tmp/backup_$DATE.sql

# Schedule with cron:
# crontab -e
# 0 2 * * 0 /home/ubuntu/backup.sh  # Every Sunday 2 AM
```

### Phase 2: Pre-Launch (Before First Paying Customer)

**Migrate to: EC2 + RDS (Option 3)**

- ✅ Cost: $33/month (still affordable)
- ✅ **Automated database backups** (critical for insurance data!)
- ✅ Data protected even if EC2 crashes
- ✅ Easy migration path (follow Step-by-Step guide above)
- ✅ Compliance-ready (7-day backup retention)

**Timeline:** 1-2 hours migration, $21/month increase

### Phase 3: Production Launch (When You Have Paying Customers)

**Migrate to: Elastic Beanstalk + RDS (Option 2)**

- ✅ Cost: $83/month (justified by revenue)
- ✅ Auto-scaling for traffic spikes
- ✅ Zero downtime deployments
- ✅ High availability (99.9% uptime)
- ✅ Fast iterations (deploy in 2 mins)

**Timeline:** 2-3 hours migration, $50/month increase

---

## Migration Paths

### Path A: EC2 → EC2 + RDS → Elastic Beanstalk + RDS

```
Month 1-3: EC2 Only ($12/month)
           ↓ Add RDS (1-2 hours migration)
Month 4-6: EC2 + RDS ($33/month)
           ↓ Add Elastic Beanstalk (2-3 hours migration)
Month 7+:  Beanstalk + RDS ($83/month)
```

### Path B: EC2 → Elastic Beanstalk + RDS (Skip Hybrid)

```
Month 1-3: EC2 Only ($12/month)
           ↓ Full migration (3-4 hours)
Month 4+:  Beanstalk + RDS ($83/month)
```

**Recommendation:** Use Path A (incremental migration)

- Lower risk (test each step)
- Spread cost increases over time
- Learn AWS services gradually

---

## Quick Start Commands Reference

### EC2 Manual Deployment

```bash
# Deploy new code
tar -czf app.tar.gz app/ insurance/ manage.py requirements.txt
scp -i patabima.pem app.tar.gz ubuntu@34.203.241.81:/home/ubuntu/
ssh -i patabima.pem ubuntu@34.203.241.81
cd /home/ubuntu/insurance-app && tar -xzf ../app.tar.gz
source venv/bin/activate
python manage.py migrate
pkill -9 gunicorn
gunicorn --workers 3 --bind 127.0.0.1:8000 'insurance.wsgi:application' --daemon
```

### Elastic Beanstalk Deployment

```bash
# Initialize (one-time)
eb init -p python-3.12 patabima-insurance

# Deploy
eb deploy

# View logs
eb logs

# Rollback
eb deploy --version <previous-version>
```

### RDS Database Operations

```bash
# Connect to RDS
psql "postgresql://user:pass@endpoint.rds.amazonaws.com:5432/dbname"

# Create backup snapshot
aws rds create-db-snapshot \
  --db-instance-identifier patabima-insurance \
  --db-snapshot-identifier patabima-backup-2025-11-08

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier patabima-restored \
  --db-snapshot-identifier patabima-backup-2025-11-08
```

---

## Troubleshooting Common Issues

### Issue 1: EC2 Can't Connect to RDS

```bash
# Check security groups
aws ec2 describe-security-groups --group-ids <rds-sg-id>

# Test connection from EC2
telnet <rds-endpoint> 5432
# Should connect (Ctrl+C to exit)

# If fails, add EC2 security group to RDS inbound rules
```

### Issue 2: Elastic Beanstalk Health Red

```bash
# Check logs
eb logs

# Common causes:
# - Missing environment variables
# - Database connection failed
# - Migration errors
# - Static files not collected

# Fix: Update .ebextensions/01_django.config
```

### Issue 3: RDS Out of Storage

```bash
# Check storage
aws rds describe-db-instances \
  --db-instance-identifier patabima-insurance \
  --query 'DBInstances[0].AllocatedStorage'

# Increase storage (no downtime)
aws rds modify-db-instance \
  --db-instance-identifier patabima-insurance \
  --allocated-storage 40 \
  --apply-immediately
```

---

## Next Steps

### Immediate (This Week)

1. ✅ **Done:** EC2 deployment working
2. ⚠️ **Critical:** Set up weekly database backups (see script above)
3. 📝 Test all motor2 API endpoints with Postman

### Short-term (Next Month)

1. 🔄 Migrate to **EC2 + RDS** (Option 3)
2. 🔒 Set up SSL/HTTPS with Let's Encrypt
3. 📊 Configure CloudWatch monitoring
4. 🧪 Load test with 100 concurrent users

### Long-term (Before Launch)

1. 🚀 Migrate to **Elastic Beanstalk + RDS** (Option 2)
2. 🌐 Set up custom domain (api.patabima.com)
3. 🔄 Configure CI/CD with GitHub Actions
4. 📈 Set up auto-scaling policies

---

## Conclusion

**Current Status:** ✅ Successfully deployed on EC2  
**Recommended Next Step:** Migrate to EC2 + RDS for database protection  
**Timeline:** 1-2 hours migration  
**Cost Increase:** +$21/month  
**Risk Reduction:** 95% (automated backups protect insurance data)

**Questions?** Contact the DevOps team or review AWS documentation:

- [Elastic Beanstalk Django Tutorial](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create-deploy-python-django.html)
- [RDS PostgreSQL Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [EC2 Instance Types](https://aws.amazon.com/ec2/instance-types/)
