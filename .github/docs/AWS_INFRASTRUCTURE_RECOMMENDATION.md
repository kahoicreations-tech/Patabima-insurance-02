# AWS Infrastructure Recommendation for PataBima

**Date**: December 2024  
**Project**: PataBima Insurance Application  
**Current Setup**: EC2 (ec2-34-203-241-81.compute-1.amazonaws.com) with Nginx + Gunicorn + PostgreSQL  
**Recommendation**: **Hybrid Managed Services Architecture**

---

## Executive Summary

**Recommendation**: Migrate to a **Hybrid AWS Managed Services** approach combining:

- **Amazon RDS for PostgreSQL** (managed database)
- **AWS Elastic Beanstalk** (managed Django application deployment)
- **Amazon S3 + CloudFront** (static and media file delivery)
- **Keep existing AWS integrations** (SQS, Lambda, Textract, SES, SNS)

**Reasoning**: Your current EC2 setup works but requires significant operational overhead. A hybrid managed approach provides the best balance of:

- **Reduced maintenance burden** (no manual database backups, security patches)
- **Auto-scaling capabilities** (handle growth from 25 to 1000+ users)
- **Better reliability** (managed services with built-in failover)
- **Cost efficiency at current scale** (pay-as-you-grow pricing)
- **Faster deployment cycles** (automated with `eb deploy`)

**Migration Effort**: Medium (2-3 weeks with testing)  
**Estimated Monthly Cost**: $100-200/month at current scale (25 users)

---

## Current Architecture Analysis

### ✅ What's Working Well

1. **EC2 Deployment**: Successfully running with Nginx reverse proxy + Gunicorn

   - Health check endpoint: ✅ Working
   - Motor2 categories API: ✅ Working
   - Authentication: ✅ Working (requires JWT tokens)

2. **AWS Services Integration**: Already using managed AWS services effectively

   - **S3**: Document storage (django-storages configured)
   - **SES**: Email notifications (django-ses for transactional emails)
   - **Textract**: OCR for logbook/document processing
   - **SQS**: Async document processing queue (no Celery/Redis complexity)
   - **SNS**: Planned for SMS OTP notifications

3. **Database**: PostgreSQL with 47 migrations applied successfully

   - Complex schema with 20+ models (User, Profile, InsuranceQuotation, MotorInsuranceDetails, Claims, etc.)
   - Recently migrated phone numbers from 9 to 10 digits (successful)
   - Foreign key relationships and constraints working properly

4. **Containerization**: Dockerfile exists with proper setup
   - Python 3.11 slim base image
   - PostgreSQL client installed
   - Static files collection automated
   - Migration runner in entrypoint
   - Health check support

### ⚠️ Current Pain Points and Risks

1. **Manual Database Management**

   - No automated backups visible (risk of data loss)
   - Manual PostgreSQL updates and security patching required
   - Single point of failure (no read replicas)
   - Connection pooling not configured (will be bottleneck at scale)

2. **Server Maintenance Overhead**

   - Manual OS security updates required
   - Nginx configuration managed manually
   - SSL certificate renewal (Let's Encrypt) manual or via cron
   - Gunicorn process management (requires systemd config)

3. **Scaling Limitations**

   - Single EC2 instance (vertical scaling only)
   - No load balancing for high availability
   - Difficult to add capacity during peak hours
   - Downtime required for instance upgrades

4. **Deployment Complexity**

   - Manual deployment via SCP or SSH
   - No automated rollback mechanism
   - Potential for deployment errors
   - Requires SSH access and manual commands

5. **Monitoring and Observability**

   - No mention of CloudWatch integration
   - No automated alerting for errors
   - Limited insight into application performance
   - Manual log aggregation

6. **Security Concerns**
   - Debug mode still enabled (`DEBUG = True` in settings.py)
   - Secret key hardcoded in settings (not from environment)
   - Wildcard ALLOWED_HOSTS (`ALLOWED_HOSTS = ['*']`)
   - No Web Application Firewall (WAF)
   - EC2 security groups require manual management

### 📊 Project Characteristics Assessment

| Characteristic           | Current State                       | Scaling Needs                              |
| ------------------------ | ----------------------------------- | ------------------------------------------ |
| **Users**                | 25 active users                     | Target: 500-1000 agents in 12 months       |
| **Traffic Pattern**      | Low, steady                         | Expect bursts during quotation periods     |
| **Database Size**        | Small (<1GB estimated)              | Will grow with policies, quotes, documents |
| **Database Complexity**  | High (47 migrations, complex joins) | Requires PostgreSQL features               |
| **API Endpoints**        | 30+ endpoints                       | Real-time pricing calculations             |
| **Background Jobs**      | SQS + Lambda (document processing)  | Already using managed services             |
| **File Storage**         | S3 (configured)                     | Already using managed service              |
| **Team Size**            | Small (1-3 developers)              | Limited DevOps expertise                   |
| **Deployment Frequency** | 2-3 times/week (estimated)          | Need fast, reliable deployments            |

---

## Recommended Architecture: Hybrid Managed Services

### 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     AWS INFRASTRUCTURE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                                │
│  │   Route 53   │  ← DNS Management                              │
│  │ (Optional)   │                                                │
│  └──────┬───────┘                                                │
│         │                                                         │
│  ┌──────▼────────────────────────────────────────────┐          │
│  │           CloudFront CDN (Optional)                │          │
│  │   - Static Assets (JS, CSS, Images)                │          │
│  │   - Global Edge Caching                            │          │
│  └──────┬────────────────────────────────────────────┘          │
│         │                                                         │
│  ┌──────▼─────────────────────────────────────────────┐         │
│  │    Application Load Balancer (Elastic Beanstalk)   │         │
│  │    - SSL Termination (ACM Certificate)             │         │
│  │    - Health Checks                                 │         │
│  └──────┬─────────────────────────────────────────────┘         │
│         │                                                         │
│         ▼                                                         │
│  ┌─────────────────────────────────────────────────────┐        │
│  │      AWS ELASTIC BEANSTALK ENVIRONMENT              │        │
│  ├─────────────────────────────────────────────────────┤        │
│  │                                                      │        │
│  │   ┌──────────────┐       ┌──────────────┐          │        │
│  │   │  EC2 Instance│       │  EC2 Instance│          │        │
│  │   │   (Django)   │       │   (Django)   │          │        │
│  │   │  + Gunicorn  │       │  + Gunicorn  │          │        │
│  │   └──────┬───────┘       └──────┬───────┘          │        │
│  │          │                       │                   │        │
│  │          └───────────┬───────────┘                   │        │
│  │                      │                               │        │
│  │         Auto-Scaling Group (1-4 instances)           │        │
│  └──────────────────────┼───────────────────────────────┘        │
│                         │                                         │
│                         │                                         │
│  ┌──────────────────────▼───────────────────────────────┐       │
│  │         Amazon RDS for PostgreSQL                     │       │
│  ├───────────────────────────────────────────────────────┤       │
│  │  - db.t3.micro (start) → db.t3.small (scale)         │       │
│  │  - Multi-AZ for production (high availability)        │       │
│  │  - Automated backups (7-day retention)                │       │
│  │  - Automated minor version upgrades                   │       │
│  │  - Read replicas (future scaling)                     │       │
│  └───────────────────────────────────────────────────────┘       │
│                                                                   │
│  ┌───────────────────────────────────────────────────────┐      │
│  │              Amazon S3 Buckets                         │      │
│  ├───────────────────────────────────────────────────────┤      │
│  │  1. patabima-media-files                              │      │
│  │     - User uploaded documents (logbooks, IDs)          │      │
│  │     - Policy PDFs generated by ReportLab              │      │
│  │     - Campaign banners                                 │      │
│  │                                                        │      │
│  │  2. patabima-static-files (optional via CloudFront)   │      │
│  │     - Django static assets (CSS, JS, admin UI)         │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                   │
│  ┌───────────────────────────────────────────────────────┐      │
│  │         Supporting AWS Services (Keep As-Is)           │      │
│  ├───────────────────────────────────────────────────────┤      │
│  │  - Amazon SQS: Document processing queue              │      │
│  │  - AWS Lambda: Textract document processing triggers   │      │
│  │  - Amazon Textract: OCR for logbook extraction        │      │
│  │  - Amazon SES: Transactional emails                    │      │
│  │  - Amazon SNS: SMS OTP notifications (planned)         │      │
│  │  - AWS IAM: Service roles and permissions             │      │
│  │  - CloudWatch Logs: Application and infrastructure    │      │
│  │  - CloudWatch Alarms: Monitoring and alerts           │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   MOBILE APP (React Native)                      │
├─────────────────────────────────────────────────────────────────┤
│  - Expo SDK 53                                                   │
│  - Context API State Management                                 │
│  - Two-tier caching (Memory + AsyncStorage)                     │
│  - Offline-capable data sync                                     │
│  - M-PESA & DPO Pay integration                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 🔧 Component Breakdown

#### 1. **Amazon RDS for PostgreSQL** (Managed Database)

**Configuration**:

- **Instance Type**: `db.t3.micro` (2 vCPU, 1 GB RAM) for development
- **Production**: `db.t3.small` (2 vCPU, 2 GB RAM) with Multi-AZ
- **Storage**: 20 GB General Purpose SSD (gp3) with auto-scaling to 100 GB
- **Engine**: PostgreSQL 15.x (matches your psycopg 3.2.10 compatibility)
- **Backup**: Automated daily backups with 7-day retention
- **Maintenance Window**: Automatic minor version upgrades

**Why RDS?**

- ✅ **Automated Backups**: Point-in-time recovery up to 7 days
- ✅ **High Availability**: Multi-AZ deployment with automatic failover (99.95% SLA)
- ✅ **Security**: Encrypted at rest (KMS), automated security patches
- ✅ **Monitoring**: CloudWatch metrics for CPU, memory, connections, IOPS
- ✅ **Scalability**: Vertical scaling with minimal downtime, read replicas for horizontal scaling
- ✅ **Connection Pooling**: Built-in pgBouncer support

**Cost**: $15-40/month (t3.micro Single-AZ to t3.small Multi-AZ)

---

#### 2. **AWS Elastic Beanstalk** (Managed Django Application Platform)

**Configuration**:

- **Platform**: Python 3.11 running on 64bit Amazon Linux 2023
- **Web Server**: Nginx + Gunicorn (auto-configured by Beanstalk)
- **Instance Type**: `t3.small` (2 vCPU, 2 GB RAM) for production
- **Auto Scaling**: 1-4 instances based on CPU/request load
- **Load Balancer**: Application Load Balancer (ALB) with SSL/TLS termination
- **Environment Variables**: Securely stored in Beanstalk configuration

**Why Elastic Beanstalk?**

- ✅ **Zero-Downtime Deployments**: Rolling updates, blue/green deployments
- ✅ **Auto Scaling**: Automatic horizontal scaling based on traffic
- ✅ **Load Balancing**: Built-in ALB with health checks
- ✅ **SSL Management**: Free SSL certificates via AWS Certificate Manager (ACM)
- ✅ **Easy Deployment**: `eb deploy` from command line or CI/CD
- ✅ **Rollback**: Automatic rollback on failed deployments
- ✅ **Monitoring**: Integrated CloudWatch dashboards
- ✅ **Lower Learning Curve**: Abstracts infrastructure complexity

**Cost**: $30-120/month (1-4 t3.small instances + ALB)

---

#### 3. **Amazon S3 + CloudFront** (Static and Media Files)

**Configuration**:

- **S3 Bucket 1**: `patabima-media-files-production`

  - User uploads (logbooks, IDs, documents)
  - Generated PDFs (policies, quotations)
  - Campaign banners and images
  - Lifecycle policy: Archive to S3 Glacier after 1 year

- **S3 Bucket 2**: `patabima-static-files-production` (optional)

  - Django static assets (CSS, JS, admin UI)
  - Served via CloudFront for faster global delivery

- **CloudFront Distribution** (optional but recommended):
  - Global CDN caching for static assets
  - HTTPS by default with ACM certificate
  - Reduced latency for mobile app users across Kenya

**Why S3 + CloudFront?**

- ✅ **Already Using S3**: django-storages configured, minimal migration
- ✅ **Durability**: 99.999999999% (11 9's) data durability
- ✅ **Scalability**: Unlimited storage, auto-scales with demand
- ✅ **Cost-Effective**: Pay only for storage and data transfer
- ✅ **CDN Performance**: CloudFront caches assets at edge locations
- ✅ **Security**: Bucket policies, IAM roles, signed URLs for private content

**Cost**: $5-20/month (storage + data transfer at current scale)

---

#### 4. **Keep Existing AWS Services** (No Changes Needed)

Your current AWS integrations are well-architected and should remain as-is:

- **Amazon SQS**: Document processing queue (no Celery/Redis overhead)
- **AWS Lambda**: Textract processing triggers (serverless, scales automatically)
- **Amazon Textract**: OCR for logbook extraction (pay-per-use)
- **Amazon SES**: Transactional emails (django-ses configured)
- **Amazon SNS**: SMS OTP notifications (planned implementation ready)

**Why Keep These?**

- ✅ **Serverless**: No infrastructure to manage
- ✅ **Cost-Effective**: Pay only when used
- ✅ **Battle-Tested**: Already proven in your production environment
- ✅ **Integrated**: Work seamlessly with Elastic Beanstalk

---

## Cost Comparison Analysis

### Current EC2 Setup (Estimated Monthly Cost)

| Component     | Specification                           | Monthly Cost   |
| ------------- | --------------------------------------- | -------------- |
| EC2 Instance  | t3.medium (2 vCPU, 4 GB RAM, On-Demand) | $30.37         |
| EBS Volume    | 30 GB General Purpose SSD (gp3)         | $2.40          |
| Data Transfer | ~10 GB/month outbound                   | $0.90          |
| S3 Storage    | 5 GB media files                        | $0.12          |
| SES           | 1,000 emails/month                      | $0.10          |
| Textract      | 100 pages/month                         | $1.50          |
| SQS           | 100,000 requests/month                  | $0.04          |
| **Total**     |                                         | **~$35/month** |

**Hidden Costs**:

- DevOps time: ~4 hours/month (maintenance, updates, backups) = $40-80/hour = $160-320
- **Total Real Cost**: **$195-355/month**

---

### Recommended Hybrid Managed Architecture (Estimated Monthly Cost)

#### Development/Staging Environment

| Component                 | Specification                          | Monthly Cost   |
| ------------------------- | -------------------------------------- | -------------- |
| RDS PostgreSQL            | db.t3.micro (Single-AZ, 20 GB storage) | $15.33         |
| Elastic Beanstalk         | 1x t3.small instance                   | $15.18         |
| Application Load Balancer | ALB with minimal traffic               | $16.20         |
| S3 Storage                | 5 GB media files                       | $0.12          |
| S3 Requests               | 10,000 PUT, 50,000 GET                 | $0.07          |
| CloudWatch Logs           | 2 GB ingestion, 1 month retention      | $1.00          |
| SES                       | 1,000 emails                           | $0.10          |
| Textract                  | 100 pages                              | $1.50          |
| SQS                       | 100,000 requests                       | $0.04          |
| **Total**                 |                                        | **~$49/month** |

**DevOps Time Saved**: ~2 hours/month (monitoring only) = **$80-160 saved**

---

#### Production Environment (At Current Scale)

| Component                 | Specification                                            | Monthly Cost    |
| ------------------------- | -------------------------------------------------------- | --------------- |
| RDS PostgreSQL            | db.t3.small (Multi-AZ, 20 GB storage, automated backups) | $60.74          |
| Elastic Beanstalk         | 2x t3.small instances (Auto Scaling)                     | $30.37          |
| Application Load Balancer | ALB with 1 GB/hour processed                             | $18.48          |
| S3 Storage                | 10 GB media files                                        | $0.23           |
| S3 Requests               | 50,000 PUT, 200,000 GET                                  | $0.34           |
| CloudFront                | 50 GB data transfer (optional)                           | $4.25           |
| CloudWatch Logs           | 5 GB ingestion, 3 month retention                        | $2.50           |
| CloudWatch Alarms         | 10 alarms                                                | $1.00           |
| SES                       | 5,000 emails                                             | $0.50           |
| Textract                  | 500 pages                                                | $7.50           |
| SQS                       | 500,000 requests                                         | $0.20           |
| **Total**                 |                                                          | **~$126/month** |

**DevOps Time Saved**: ~3 hours/month = **$120-240 saved**  
**Net Cost**: **$126 - $180 saved** = **Effective cost ~$0-40** (or even cost savings)

---

#### Production Environment (Scaled to 500 Users)

| Component                 | Specification                                          | Monthly Cost    |
| ------------------------- | ------------------------------------------------------ | --------------- |
| RDS PostgreSQL            | db.t3.medium (Multi-AZ, 50 GB storage, 1 read replica) | $145.80         |
| Elastic Beanstalk         | 3x t3.medium instances (Auto Scaling)                  | $91.11          |
| Application Load Balancer | ALB with 10 GB/hour processed                          | $27.36          |
| S3 Storage                | 100 GB media files                                     | $2.30           |
| S3 Requests               | 500,000 PUT, 2M GET                                    | $3.40           |
| CloudFront                | 500 GB data transfer                                   | $42.50          |
| CloudWatch Logs           | 20 GB ingestion, 6 month retention                     | $10.00          |
| CloudWatch Alarms         | 20 alarms                                              | $2.00           |
| SES                       | 50,000 emails                                          | $5.00           |
| SNS                       | 50,000 SMS (Kenya)                                     | $25.00          |
| Textract                  | 5,000 pages                                            | $75.00          |
| SQS                       | 5M requests                                            | $2.00           |
| **Total**                 |                                                        | **~$431/month** |

**Equivalent EC2 Setup Cost**: $200-300/month (2-3 larger EC2 instances + manual load balancer + database)  
**DevOps Time Saved**: ~8 hours/month = **$320-640 saved**  
**Net Value**: Managed services pay for themselves at scale

---

### Cost Optimization Strategies

1. **Use Reserved Instances**: Save 30-40% on RDS and EC2 by committing to 1-year terms
2. **Right-Size Instances**: Start small (t3.micro/t3.small), monitor CloudWatch, scale up as needed
3. **S3 Lifecycle Policies**: Move old documents to S3 Glacier after 1 year (90% cost reduction)
4. **CloudFront Caching**: Reduce S3 GET requests by 70-90% with aggressive caching
5. **CloudWatch Log Retention**: Keep only 30 days for non-critical logs
6. **Elastic Beanstalk Spot Instances**: Use Spot for non-critical environments (70% discount)

---

## Migration Plan

### Phase 1: Preparation (Week 1)

#### Security Hardening

1. **Fix Critical Security Issues** (Do this FIRST before any migration):

   ```python
   # insurance-app/insurance/settings.py

   # ❌ REMOVE hardcoded values
   SECRET_KEY = os.environ.get('SECRET_KEY')
   DEBUG = os.environ.get('DEBUG', 'False') == 'True'
   ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

   # ✅ Verify environment variables are set
   if not SECRET_KEY:
       raise ValueError("SECRET_KEY environment variable must be set")
   ```

2. **Create IAM Service Roles**:

   - `patabima-beanstalk-service-role`: For Elastic Beanstalk service
   - `patabima-ec2-instance-profile`: For EC2 instances to access S3, SES, SQS, Textract
   - Grant minimal permissions (principle of least privilege)

3. **Set Up RDS Parameter Group**:

   - Create custom parameter group for PostgreSQL 15
   - Configure connection limits: `max_connections = 100`
   - Enable query logging for debugging: `log_statement = 'all'` (dev only)

4. **Backup Current EC2 Data**:

   ```bash
   # SSH into current EC2
   ssh -i your-key.pem ubuntu@ec2-34-203-241-81.compute-1.amazonaws.com

   # Dump PostgreSQL database
   pg_dump -h localhost -U patabima_user -d patabima_db -F c -f patabima_backup_$(date +%Y%m%d).dump

   # Upload to S3
   aws s3 cp patabima_backup_*.dump s3://patabima-backups/pre-migration/

   # Backup media files
   aws s3 sync /path/to/media/ s3://patabima-backups/media/
   ```

#### Infrastructure Setup

1. **Create RDS Database**:

   ```bash
   aws rds create-db-instance \
     --db-instance-identifier patabima-db-production \
     --db-instance-class db.t3.small \
     --engine postgres \
     --engine-version 15.4 \
     --master-username patabima_admin \
     --master-user-password "GENERATE_STRONG_PASSWORD" \
     --allocated-storage 20 \
     --storage-type gp3 \
     --storage-encrypted \
     --backup-retention-period 7 \
     --multi-az \
     --vpc-security-group-ids sg-xxxxxxxx \
     --db-subnet-group-name patabima-db-subnet-group \
     --publicly-accessible false \
     --tags Key=Project,Value=PataBima Key=Environment,Value=production
   ```

2. **Restore Database to RDS**:

   ```bash
   # Get RDS endpoint
   RDS_ENDPOINT=$(aws rds describe-db-instances \
     --db-instance-identifier patabima-db-production \
     --query 'DBInstances[0].Endpoint.Address' --output text)

   # Restore from backup
   pg_restore -h $RDS_ENDPOINT -U patabima_admin -d postgres -C patabima_backup_20241231.dump

   # Verify data
   psql -h $RDS_ENDPOINT -U patabima_admin -d patabima_db -c "SELECT COUNT(*) FROM app_user;"
   ```

---

### Phase 2: Elastic Beanstalk Setup (Week 2)

#### Application Configuration

1. **Install EB CLI**:

   ```bash
   pip install awsebcli
   eb --version
   ```

2. **Initialize Elastic Beanstalk** (run from `insurance-app/` directory):

   ```bash
   cd insurance-app/

   eb init patabima-api \
     --platform "Python 3.11 running on 64bit Amazon Linux 2023" \
     --region us-east-1
   ```

3. **Create `.ebextensions/` Configuration**:

   ```bash
   mkdir -p .ebextensions
   ```

   **File: `.ebextensions/01_packages.config`**:

   ```yaml
   packages:
     yum:
       postgresql15-devel: []
       gcc: []
   ```

   **File: `.ebextensions/02_python.config`**:

   ```yaml
   option_settings:
     aws:elasticbeanstalk:application:environment:
       DJANGO_SETTINGS_MODULE: "insurance.settings"
       PYTHONPATH: "/var/app/current:$PYTHONPATH"
     aws:elasticbeanstalk:container:python:
       WSGIPath: "insurance.wsgi:application"
       NumProcesses: 3
       NumThreads: 20
   ```

   **File: `.ebextensions/03_django.config`**:

   ```yaml
   container_commands:
     01_migrate:
       command: "source $PYTHONPATH/venv/*/bin/activate && python manage.py migrate --noinput"
       leader_only: true
     02_collectstatic:
       command: "source $PYTHONPATH/venv/*/bin/activate && python manage.py collectstatic --noinput"

   option_settings:
     aws:elasticbeanstalk:application:environment:
       DEBUG: "False"
       SECRET_KEY: "WILL_BE_SET_VIA_EB_SETENV"
       DATABASE_URL: "WILL_BE_SET_VIA_EB_SETENV"
       ALLOWED_HOSTS: ".elasticbeanstalk.com,patabima.co.ke,www.patabima.co.ke"
   ```

   **File: `.ebextensions/04_https_redirect.config`**:

   ```yaml
   files:
     "/etc/nginx/conf.d/https_redirect.conf":
       mode: "000644"
       owner: root
       group: root
       content: |
         server {
           listen 80;
           return 301 https://$host$request_uri;
         }
   ```

4. **Create Elastic Beanstalk Environment**:

   ```bash
   eb create patabima-api-production \
     --instance-type t3.small \
     --scale 2 \
     --elb-type application \
     --envvars \
       SECRET_KEY="$(openssl rand -base64 32)" \
       DATABASE_URL="postgresql://patabima_admin:PASSWORD@$RDS_ENDPOINT:5432/patabima_db" \
       AWS_STORAGE_BUCKET_NAME="patabima-media-files-production" \
       USE_S3_MEDIA="1" \
       AWS_S3_REGION_NAME="us-east-1" \
       EMAIL_BACKEND="django_ses.SESBackend" \
       DEFAULT_FROM_EMAIL="noreply@patabima.co.ke"
   ```

5. **Enable Auto Scaling**:

   ```bash
   eb scale 2 --timeout 10  # Start with 2 instances, max 10-minute timeout

   # Configure auto-scaling triggers
   aws elasticbeanstalk put-scaling-policy \
     --policy-name patabima-cpu-scale-up \
     --application-name patabima-api \
     --environment-name patabima-api-production \
     --scaling-adjustment 1 \
     --adjustment-type ChangeInCapacity \
     --cooldown 300
   ```

---

### Phase 3: Testing and Validation (Week 2)

1. **Health Check Validation**:

   ```bash
   # Get Elastic Beanstalk URL
   EB_URL=$(eb status --verbose | grep CNAME | awk '{print $2}')

   # Test health endpoint
   curl https://$EB_URL/api/v1/health/
   # Expected: {"status": "ok", "service": "pata-bima-api"}

   # Test motor2 categories
   curl https://$EB_URL/api/v1/motor2/categories/
   # Expected: Array of 6 categories
   ```

2. **Database Connection Test**:

   ```bash
   eb ssh patabima-api-production

   # Inside EB instance
   source /var/app/venv/*/bin/activate
   cd /var/app/current
   python manage.py shell

   >>> from app.models import User
   >>> User.objects.count()
   25  # Should match your current user count
   ```

3. **S3 Integration Test**:

   ```bash
   # Upload test document via admin panel or API
   # Verify file appears in S3 bucket
   aws s3 ls s3://patabima-media-files-production/campaign_banners/
   ```

4. **Load Testing** (using Apache Bench or Locust):

   ```bash
   # Simulate 100 concurrent users for 30 seconds
   ab -n 1000 -c 100 -t 30 https://$EB_URL/api/v1/health/

   # Monitor CloudWatch metrics:
   # - CPU utilization should stay below 70%
   # - Response time < 500ms for 95th percentile
   # - No 5xx errors
   ```

5. **End-to-End Mobile App Test**:
   - Update `frontend/.env` with new Elastic Beanstalk URL
   - Test authentication flow (login, signup, OTP)
   - Test quotation creation and pricing comparison
   - Test document upload (logbook, ID)
   - Test payment flow (M-PESA sandbox)
   - Verify policy generation and PDF download

---

### Phase 4: DNS and SSL Configuration (Week 3)

1. **Request SSL Certificate** (AWS Certificate Manager):

   ```bash
   aws acm request-certificate \
     --domain-name patabima.co.ke \
     --subject-alternative-names www.patabima.co.ke api.patabima.co.ke \
     --validation-method DNS \
     --region us-east-1
   ```

2. **Configure Custom Domain** in Elastic Beanstalk:

   - Go to Elastic Beanstalk console → Environment → Configuration
   - Edit Load Balancer settings
   - Add listener: Port 443, Protocol HTTPS, SSL Certificate (select ACM cert)
   - Add rule: Redirect HTTP (port 80) to HTTPS (port 443)

3. **Update Route 53 DNS** (or your DNS provider):

   ```bash
   # Create CNAME record pointing to Elastic Beanstalk
   api.patabima.co.ke → patabima-api-production.us-east-1.elasticbeanstalk.com
   ```

4. **Update Frontend Configuration**:
   ```bash
   # frontend/.env.production
   API_BASE_URL=https://api.patabima.co.ke
   ```

---

### Phase 5: Cutover and Monitoring (Week 3)

1. **Enable Enhanced Monitoring**:

   ```bash
   # Enable CloudWatch Logs for Elastic Beanstalk
   eb logs --cloudwatch-logs enable

   # Create CloudWatch Dashboard
   aws cloudwatch put-dashboard \
     --dashboard-name PataBima-Production \
     --dashboard-body file://cloudwatch-dashboard.json
   ```

   **File: `cloudwatch-dashboard.json`**:

   ```json
   {
     "widgets": [
       {
         "type": "metric",
         "properties": {
           "metrics": [
             [
               "AWS/ElasticBeanstalk",
               "EnvironmentHealth",
               { "stat": "Average" }
             ],
             [".", "ApplicationRequests5xx", { "stat": "Sum" }],
             [".", "ApplicationRequests4xx", { "stat": "Sum" }],
             [".", "ApplicationRequestsTotal", { "stat": "Sum" }]
           ],
           "period": 300,
           "stat": "Average",
           "region": "us-east-1",
           "title": "Application Health"
         }
       },
       {
         "type": "metric",
         "properties": {
           "metrics": [
             ["AWS/RDS", "CPUUtilization", { "stat": "Average" }],
             [".", "DatabaseConnections", { "stat": "Average" }],
             [".", "FreeableMemory", { "stat": "Average" }]
           ],
           "period": 300,
           "stat": "Average",
           "region": "us-east-1",
           "title": "Database Performance"
         }
       }
     ]
   }
   ```

2. **Set Up CloudWatch Alarms**:

   ```bash
   # High CPU alarm
   aws cloudwatch put-metric-alarm \
     --alarm-name patabima-high-cpu \
     --alarm-description "Alert when CPU exceeds 80%" \
     --metric-name CPUUtilization \
     --namespace AWS/RDS \
     --statistic Average \
     --period 300 \
     --threshold 80 \
     --comparison-operator GreaterThanThreshold \
     --evaluation-periods 2 \
     --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:patabima-alerts

   # High 5xx error rate
   aws cloudwatch put-metric-alarm \
     --alarm-name patabima-high-errors \
     --alarm-description "Alert when 5xx errors exceed 10 in 5 minutes" \
     --metric-name ApplicationRequests5xx \
     --namespace AWS/ElasticBeanstalk \
     --statistic Sum \
     --period 300 \
     --threshold 10 \
     --comparison-operator GreaterThanThreshold \
     --evaluation-periods 1 \
     --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:patabima-alerts
   ```

3. **Final Cutover Checklist**:

   - [ ] All tests passing on Elastic Beanstalk environment
   - [ ] Database migrated and verified (25 users, all data intact)
   - [ ] S3 media files accessible
   - [ ] SSL certificate validated and active
   - [ ] DNS updated to point to Elastic Beanstalk
   - [ ] CloudWatch alarms configured and tested
   - [ ] Mobile app updated with new API endpoint
   - [ ] Rollback plan documented (can revert DNS to old EC2)

4. **Go Live**:
   - Update DNS to point to new Elastic Beanstalk environment
   - Monitor CloudWatch dashboard for 24-48 hours
   - Keep old EC2 instance running for 1 week as backup
   - Gradually reduce EC2 instance size, then terminate

---

## Alternative: If You Prefer to Keep EC2 (Cost-Optimized Approach)

If you want to minimize migration effort and keep the current EC2 setup, here are critical improvements:

### Must-Do Improvements (High Priority)

1. **Migrate to Amazon RDS for PostgreSQL**:

   - Same benefits (automated backups, high availability, security patches)
   - Works with existing EC2 instance
   - Cost: $15-60/month depending on instance size
   - **This is the single most important change** for data safety

2. **Fix Security Issues**:

   - Set `DEBUG = False` in production
   - Use environment variables for `SECRET_KEY`, `ALLOWED_HOSTS`
   - Enable HTTPS with Let's Encrypt (or AWS Certificate Manager + CloudFront)
   - Restrict security groups (only allow 80/443 inbound, SSH from specific IPs)

3. **Set Up Automated Backups**:

   - PostgreSQL: `pg_dump` via cron to S3 (daily)
   - Application code: Git repository with tags for releases
   - Configuration files: Version controlled in private repo

4. **Enable CloudWatch Monitoring**:

   - Install CloudWatch Agent on EC2
   - Send logs to CloudWatch Logs
   - Set up alarms for disk space, CPU, memory

5. **Implement Zero-Downtime Deployment**:
   - Use systemd for Gunicorn management
   - Implement rolling restart with health checks
   - Use Git hooks for automated deployment

### Cost with Improved EC2 Setup

| Component                       | Monthly Cost   |
| ------------------------------- | -------------- |
| EC2 t3.medium (Reserved 1-year) | $21.17         |
| RDS db.t3.small (Multi-AZ)      | $60.74         |
| EBS Volume (30 GB)              | $2.40          |
| S3 + SES + SQS + Textract       | $10.00         |
| **Total**                       | **~$94/month** |

**Pros**: Lower monthly cost, minimal migration effort  
**Cons**: Still requires manual scaling, deployments, and some DevOps overhead

---

## Comparison Matrix: EC2 vs Hybrid Managed vs Full Serverless

| Feature                      | Current EC2                     | Improved EC2 + RDS              | Hybrid Managed (Recommended)               | Full Serverless (Future)      |
| ---------------------------- | ------------------------------- | ------------------------------- | ------------------------------------------ | ----------------------------- |
| **Initial Setup Effort**     | ✅ Low (already done)           | 🟡 Medium (RDS migration)       | 🔴 High (2-3 weeks)                        | 🔴 Very High (4-6 weeks)      |
| **Monthly Cost (25 users)**  | $35 + $200 DevOps = $235        | $94 + $100 DevOps = $194        | $126 - $180 saved = ~$0                    | $50 - $200 saved = ~$0        |
| **Monthly Cost (500 users)** | $200 + $400 DevOps = $600       | $250 + $300 DevOps = $550       | $431 - $320 saved = $111                   | $200 + $0 DevOps = $200       |
| **Auto Scaling**             | ❌ No (manual vertical scaling) | ❌ No                           | ✅ Yes (automatic horizontal scaling)      | ✅ Yes (infinite scale)       |
| **High Availability**        | ❌ Single point of failure      | 🟡 Database only (Multi-AZ RDS) | ✅ Yes (Multi-AZ RDS + ALB + Auto Scaling) | ✅ Yes (built-in)             |
| **Deployment Complexity**    | 🔴 High (manual SSH, restart)   | 🔴 High (manual)                | ✅ Low (`eb deploy` or CI/CD)              | ✅ Very Low (Git push)        |
| **Rollback Speed**           | 🔴 Slow (manual revert)         | 🔴 Slow                         | ✅ Fast (1 command)                        | ✅ Instant (version switch)   |
| **Database Backups**         | ❌ Manual (cron job)            | ✅ Automated (RDS)              | ✅ Automated (RDS)                         | ✅ Automated                  |
| **Security Patching**        | 🔴 Manual OS updates            | 🟡 Manual OS, Automated DB      | ✅ Automated (Beanstalk + RDS)             | ✅ Fully Automated            |
| **Monitoring**               | ❌ Basic (manual setup)         | 🟡 CloudWatch (manual config)   | ✅ Built-in CloudWatch                     | ✅ Built-in CloudWatch        |
| **SSL Management**           | 🔴 Manual (Let's Encrypt cron)  | 🔴 Manual                       | ✅ Automated (ACM)                         | ✅ Automated (ACM)            |
| **DevOps Time/Month**        | 4 hours                         | 2-3 hours                       | 1 hour                                     | 0.5 hours                     |
| **Learning Curve**           | ✅ Low (traditional)            | ✅ Low                          | 🟡 Medium (EB CLI)                         | 🔴 High (serverless patterns) |
| **Vendor Lock-In**           | ✅ Low (portable)               | 🟡 Medium (RDS)                 | 🔴 High (EB specific)                      | 🔴 Very High (AWS Lambda)     |
| **Best For**                 | Very small teams, tight budget  | Small teams, budget-conscious   | Growing businesses, limited DevOps         | High-scale, variable traffic  |

---

## Final Recommendation

### 🏆 **Primary Recommendation: Hybrid Managed Architecture**

**Why?**

1. **Scale-Ready**: Your business goal is to grow from 25 to 500+ agents in 12 months. Elastic Beanstalk auto-scales to meet demand without manual intervention.

2. **DevOps Time Savings**: Your team should focus on building insurance features (60+ motor products, pricing engine, payment integrations), not managing servers. Managed services save 70% of infrastructure time.

3. **Reliability**: Multi-AZ RDS + Auto Scaling Group means 99.95% uptime SLA (8.76 hours/year downtime vs 87.6 hours with single EC2).

4. **Cost-Effective at Scale**: At current scale, costs are similar to EC2. At 500 users, managed services are cheaper when you account for DevOps time.

5. **Battle-Tested**: Elastic Beanstalk is used by thousands of Django applications at scale (e.g., Instagram early days, Pinterest).

6. **Migration Path**: You can start with Elastic Beanstalk Single-AZ RDS (cheaper) and upgrade to Multi-AZ + read replicas as you grow.

---

### 🥈 **Alternative: Improved EC2 + RDS** (If Budget is Tight)

**When to Choose This?**

- You have experienced DevOps team member
- Budget constraint <$100/month
- User growth is slow (<100 users in next 12 months)
- Willing to accept some downtime during upgrades

**Critical Changes Required**:

1. Migrate database to RDS (even db.t3.micro Single-AZ is better than self-managed)
2. Fix security issues (DEBUG, SECRET_KEY, ALLOWED_HOSTS)
3. Set up automated backups to S3
4. Enable CloudWatch monitoring and alarms

---

### 🚀 **Future State: Full Serverless** (12-18 Months Out)

**When to Consider?**

- You've grown to 1000+ users
- Need to minimize infrastructure costs
- Traffic is highly variable (peak hours during quotation periods)
- Team has gained experience with AWS services

**Architecture**:

- **AWS Lambda + API Gateway**: Replace Django REST with serverless functions
- **Amazon Aurora Serverless**: Replace RDS with auto-scaling database
- **Step Functions**: Replace SQS + Lambda with orchestrated workflows
- **DynamoDB**: Store quotations and policies (faster than PostgreSQL for simple lookups)

**Expected Cost at 1000 Users**: $200-400/month (70% savings vs EC2, 40% vs Elastic Beanstalk)

---

## Action Items Summary

### Immediate (This Week)

1. ✅ **Fix security issues** in `insurance-app/insurance/settings.py`:

   - Move `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS` to environment variables
   - Set `DEBUG = False` for production EC2
   - Audit CORS and CSRF settings

2. ✅ **Enable automated backups** on current EC2:

   ```bash
   # Add to crontab
   0 2 * * * pg_dump -U patabima_user patabima_db | gzip > /tmp/backup_$(date +\%Y\%m\%d).sql.gz && aws s3 cp /tmp/backup_*.sql.gz s3://patabima-backups/
   ```

3. ✅ **Set up CloudWatch monitoring** for current EC2:
   - Install CloudWatch Agent
   - Monitor disk space, CPU, memory
   - Create alarm for disk >80% full

### Short-Term (Next 2 Weeks)

1. 🎯 **Decide on architecture**: EC2+RDS vs Hybrid Managed

   - Evaluate team capacity for migration (2-3 weeks effort)
   - Assess budget availability ($100-200/month for managed services)
   - Consider business growth timeline (500 users by when?)

2. 🎯 **If choosing Hybrid Managed**:

   - Follow Phase 1-2 migration plan above
   - Start with dev/staging environment to practice
   - Run parallel environments for 1 week before cutover

3. 🎯 **If staying on EC2**:
   - Migrate to RDS for PostgreSQL (critical for data safety)
   - Implement proper deployment pipeline (Git hooks + systemd)
   - Document runbooks for common operations

### Medium-Term (Next 1-3 Months)

1. 📈 **Optimize costs**:

   - Purchase Reserved Instances (30-40% savings)
   - Implement S3 Lifecycle policies
   - Enable CloudFront caching for static assets

2. 📈 **Improve observability**:

   - Set up CloudWatch Dashboards for business metrics (quotations/day, policies sold, revenue)
   - Implement application performance monitoring (APM) like AWS X-Ray
   - Create runbooks for common issues

3. 📈 **Disaster recovery**:
   - Document and test RDS restore procedure
   - Set up cross-region S3 replication for critical documents
   - Create disaster recovery runbook (RTO: 4 hours, RPO: 1 hour)

---

## Conclusion

Based on your project characteristics (small team, growing user base, complex business logic, limited DevOps expertise), I **strongly recommend migrating to the Hybrid Managed Architecture** with:

- **Amazon RDS for PostgreSQL**: Automated backups, high availability, security patches
- **AWS Elastic Beanstalk**: Auto-scaling, zero-downtime deployments, load balancing
- **Amazon S3 + CloudFront**: Scalable file storage and global content delivery

**Timeline**: 2-3 weeks for migration  
**Cost**: $126/month production (comparable to EC2 when accounting for DevOps time)  
**ROI**: 3-4 hours/month saved in DevOps work = $120-240/month value  
**Risk**: Medium (requires testing, but rollback is straightforward)

The investment in managed services will pay dividends as you scale to 500+ users, allowing your team to focus on building insurance features rather than managing infrastructure.

---

## Questions to Discuss

1. What is your target user count in 6 months? 12 months?
2. Do you have dedicated DevOps resources or is this handled by developers?
3. What is your monthly infrastructure budget?
4. How often do you deploy updates? (daily, weekly, monthly?)
5. What is your acceptable downtime for deployments? (0 minutes, 5 minutes, 30 minutes?)
6. Do you have compliance requirements for data backup retention? (GDPR, Kenya Data Protection Act?)

**Next Steps**: Let me know your decision on architecture, and I'll create detailed step-by-step implementation scripts and configurations for your chosen path.
