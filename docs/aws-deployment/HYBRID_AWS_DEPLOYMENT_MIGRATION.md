# PataBima Hybrid AWS Deployment Migration Plan

**Document Version**: 2.0  
**Date**: November 3, 2025  
**Status**: ✅ **COMPLETE & READY FOR EXECUTION**

---

## 📋 Executive Summary

This comprehensive migration plan covers the complete transition from a single-server EC2 deployment to a **fully managed AWS hybrid architecture** for the PataBima Insurance platform.

### Migration Scope

**11 AWS Services** integrated across **8 migration phases** over **4-6 weeks**:

1. **Amazon RDS PostgreSQL** - Managed database with Multi-AZ failover
2. **AWS Elastic Beanstalk** - Auto-scaling Django application hosting
3. **Amazon S3** - Scalable object storage for static files, media, policy PDFs
4. **Amazon CloudFront** - Global CDN for sub-100ms asset delivery
5. **Amazon SNS** - SMS notifications (OTP, policy confirmations, renewals)
6. **Amazon SES** - Transactional emails (policy documents, receipts)
7. **AWS Lambda** - Serverless background processing (4 functions):
   - Renewal reminder scheduler
   - M-PESA payment callback processor
   - Async PDF certificate generator
   - Textract document OCR processor (already deployed)
8. **Amazon EventBridge** - Scheduled job orchestration
9. **Amazon Textract** - AI-powered document text extraction (already deployed)
10. **API Gateway** - Payment webhook protection and rate limiting
11. **Amazon SQS** - Message queues for Lambda job distribution

### Business Impact

- **Uptime**: 99.5% → **99.95%** (Multi-AZ, auto-healing)
- **Performance**: API latency **<200ms** globally (CloudFront CDN)
- **Scalability**: Auto-scale from **2 to 10 instances** based on load
- **Cost**: **~$503/month** (vs $150/month EC2-only) - +$353 for managed services
- **Deployment**: Manual SSH → **Automated CI/CD** via GitHub Actions
- **Disaster Recovery**: **<5 minutes** RTO with automated failover

### Timeline

- **Week 1**: Database migration to RDS
- **Week 2**: S3 + CloudFront + SNS/SES setup
- **Week 3**: Elastic Beanstalk deployment + Lambda functions
- **Week 4**: Monitoring, testing, and go-live

### Key Features Enabled

- ✅ **Real-time SMS notifications** via Amazon SNS (OTP codes, policy confirmations)
- ✅ **Professional email delivery** via Amazon SES (policy documents, renewal reminders)
- ✅ **Async PDF generation** via Lambda (no request timeouts)
- ✅ **Document OCR** via Textract (already deployed, updated for production)
- ✅ **Auto-scaling** via Elastic Beanstalk (handle traffic spikes)
- ✅ **Global CDN** via CloudFront (fast static asset delivery)
- ✅ **Automated deployments** via GitHub Actions (zero-downtime releases)
- ✅ **Comprehensive monitoring** via CloudWatch (alerts, logs, metrics)

---

## Current Architecture (EC2-Based)

### Existing Setup

- **Backend**: Django REST API on EC2 instance
- **Database**: PostgreSQL on EC2 (should be RDS)
- **Frontend**: React Native Expo app (mobile)
- **Static Files**: Served from EC2
- **Deployment**: Manual SSH deployment to EC2

### Current Issues

- ❌ Single point of failure (EC2)
- ❌ No auto-scaling
- ❌ Manual deployment process
- ❌ Database on EC2 (not best practice)
- ❌ No CDN for static assets
- ❌ Limited monitoring and logging

---

## Target Hybrid Architecture (AWS Managed Services)

### New Hybrid Setup

```
┌─────────────────────────────────────────────────────────────┐
│                     CLOUDFRONT (CDN)                        │
│  - Global edge locations for static assets                 │
│  - SSL/TLS termination                                      │
│  - Caching for Django static files, media, API responses    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├──────────────┬─────────────────┐
                            │              │                 │
                            ▼              ▼                 ▼
┌─────────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   S3 BUCKET         │  │ ELASTIC BEANSTALK│  │  API GATEWAY     │
│  - Static files     │  │ - Django app     │  │ (Optional)       │
│  - Media uploads    │  │ - Auto-scaling   │  │ - API management │
│  - Policy PDFs      │  │ - Load balancer  │  │ - Rate limiting  │
└─────────────────────┘  └──────────────────┘  └──────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   RDS POSTGRES   │
                         │ - Multi-AZ       │
                         │ - Auto backups   │
                         │ - Read replicas  │
                         └──────────────────┘
```

### Architecture Components

#### 1. **Amazon S3 + CloudFront**

- **Static Files**: CSS, JS, images, fonts from Django
- **Media Files**: User uploads (ID scans, policy documents)
- **Policy PDFs**: Generated insurance certificates
- **Benefits**:
  - ✅ 99.99% availability
  - ✅ Automatic scaling
  - ✅ Pay per use (no idle costs)
  - ✅ Global CDN distribution via CloudFront

#### 2. **AWS Elastic Beanstalk**

- **Django Backend**: Managed platform for Django apps
- **Auto-scaling**: Automatically adds/removes instances based on load
- **Load Balancing**: Distributes traffic across multiple instances
- **Benefits**:
  - ✅ Zero-downtime deployments (blue/green)
  - ✅ Automatic health monitoring
  - ✅ Built-in logging to CloudWatch
  - ✅ Easy rollback to previous versions

#### 3. **Amazon RDS PostgreSQL**

- **Database**: Managed PostgreSQL (replace EC2 Postgres)
- **Multi-AZ**: Automatic failover to standby replica
- **Automated Backups**: Daily snapshots + point-in-time recovery
- **Benefits**:
  - ✅ No manual database maintenance
  - ✅ Automatic minor version patches
  - ✅ Read replicas for analytics/reporting

#### 4. **Amazon SNS (Simple Notification Service)**

- **SMS Notifications**: OTP codes, policy confirmations, renewal reminders
- **Email Notifications**: Policy documents, payment receipts
- **Multi-Channel**: SMS + Email + Push notifications
- **Benefits**:
  - ✅ 99.99% message delivery SLA
  - ✅ Global SMS coverage (Kenya included)
  - ✅ Pay-per-message pricing (no upfront costs)
  - ✅ Two-way SMS for OTP verification

#### 5. **Amazon SES (Simple Email Service)**

- **Transactional Emails**: Policy documents, receipts, confirmations
- **Marketing Emails**: Newsletters, campaigns (10k free/month)
- **Email Templates**: HTML templates for branded communications
- **Benefits**:
  - ✅ $0.10 per 1,000 emails sent
  - ✅ 62,000 free emails/month (via EC2/EB)
  - ✅ High deliverability rates
  - ✅ DKIM/SPF/DMARC support

#### 6. **AWS Lambda** (For Background Tasks)

- **Scheduled Tasks**: Daily renewal reminders, policy expiry checks
- **Event-Driven**: Process M-PESA callbacks, generate PDFs
- **Async Processing**: Send bulk SMS/emails without blocking API
- **Benefits**:
  - ✅ No idle server costs
  - ✅ Auto-scaling to handle spikes
  - ✅ 1M free requests/month
  - ✅ Integrates with SNS, SES, S3

#### 7. **Amazon API Gateway** (Optional)

- **API Management**: REST API routing and versioning
- **Rate Limiting**: Protect against abuse (prevent M-PESA spam)
- **API Keys**: Manage third-party integrations (DPO Pay, M-PESA)
- **Benefits**:
  - ✅ Request throttling (protect payment endpoints)
  - ✅ API usage analytics
  - ✅ Request/response transformation

#### 8. **Amazon EventBridge** (Optional)

- **Scheduled Events**: Cron jobs for renewals, reminders
- **Event Bus**: Connect Lambda, SNS, SES for workflows
- **Benefits**:
  - ✅ Reliable cron replacement
  - ✅ Event-driven architecture
  - ✅ No server management

#### 9. **Amazon Textract** (Document OCR - Already Implemented)

**Purpose:** Extract text and data from scanned documents using machine learning OCR.

**Current Implementation Status:**

- ✅ **Backend Integration**: Django views in `app/views_docs.py` with Textract normalization
- ✅ **Lambda Function**: `patabima-textract-processor-dev` for async document processing
- ✅ **SQS Queue**: `patabima-textract-dev` for job queuing with DLQ for failures
- ✅ **S3 Integration**: Upload documents → trigger Textract → store results in S3
- ✅ **Frontend Integration**: Document upload components with extraction status tracking
- ✅ **Data Models**: `textract_data` JSONField in MotorPolicy model

**Use Cases:**

- **Logbook Scanning**: Extract vehicle registration, make, model, year, chassis number
- **KRA PIN Extraction**: Read KRA PIN from uploaded ID/PIN certificates
- **ID Card Scanning**: Extract client name, ID number from national IDs
- **Insurance Certificate Validation**: Read policy numbers, expiry dates

**Architecture (Already Deployed):**

```
Mobile App → Upload Document → S3 (patabima-backend-dev-uploads)
                                 ↓
                            Django API → SQS Message
                                         ↓
                                    Lambda Function
                                         ↓
                                 AWS Textract API
                                         ↓
                         Results → S3 (results/ prefix)
                                         ↓
                          Callback → Django (updates policy)
                                         ↓
                            Frontend (displays extracted data)
```

**Migration Considerations:**

- **Keep Existing Setup**: Textract Lambda and SQS already deployed and working
- **Update S3 Bucket**: Migrate to production bucket during Phase 2 (S3 setup)
- **Update Lambda ENV**: Point to RDS database URL (Phase 1)
- **Update Callback URL**: Change `DJANGO_API_URL` from EC2 IP to Elastic Beanstalk URL (Phase 3)
- **Monitor Costs**: Track Textract usage (~$1.50 per 100 pages)

**Cost Estimate:**

- **Textract API**: $1.50 per 100 pages processed (Detect Document Text)
- **Monthly Volume**: ~200 document uploads = **$3.00/month**
- **S3 Storage**: Results stored as JSON (~10KB each) = negligible
- **Lambda Invocations**: Included in free tier (1M requests/month)

**Documentation:**

- Deployment Guide: `docs/aws-deployment/AWS_TEXTRACT_DEPLOYMENT_GUIDE.md`
- Lambda Fixes: `docs/aws-deployment/AWS_TEXTRACT_LAMBDA_FIXED.md`
- Frontend Integration: `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/MotorInsuranceScreen.js`

---

## Additional Services Inventory

### Already Implemented (Not in Migration Scope)

#### 1. **AWS Amplify** (Archive Status - Not Used in Production)

- **Location**: `amplify/` directory
- **Services Configured**:
  - AWS Cognito (authentication - archived, not used)
  - AWS AppSync (GraphQL API - archived)
  - Amazon Pinpoint (analytics - not active)
  - S3 Storage (configured but using direct boto3 instead)
- **Status**: ⚠️ **Legacy configuration** - PataBima uses Django REST API + JWT authentication instead
- **Migration Action**: **None required** - Can be safely ignored or deleted post-migration
- **Note**: Frontend uses `DjangoAPIService` not AWS Amplify SDK

#### 2. **PDF Generation Service** (Needs Lambda Migration)

- **Current Implementation**: `insurance-app/app/services/pdf_generator.py`
- **Function**: `generate_motor_policy_pdf()` - creates policy certificates using ReportLab
- **Current Process**:
  1. Django generates PDF synchronously (blocks request)
  2. Uploads to S3 using boto3
  3. Returns S3 URL to frontend
- **Issue**: Synchronous PDF generation can timeout for complex policies
- **Migration Recommendation**: **Convert to Lambda function**
  ```python
  # New Lambda: patabima-pdf-generator
  # Triggered by: SQS message from Django or S3 event
  # Output: Upload PDF to S3, send callback to Django with URL
  ```
- **Benefits**:
  - Async processing (no request timeout)
  - Auto-scaling for bulk PDF generation
  - Separate from main Django workers
  - Free tier: 1M requests/month

#### 3. **DMVIC Integration** (External API - Not AWS)

- **Purpose**: Kenya NTSA vehicle validation service
- **Data Model**: `dmvic_data` JSONField in MotorPolicy model
- **Status**: Placeholder for future integration
- **Migration Action**: **None** - Third-party API, not AWS service

#### 4. **M-PESA & DPO Pay** (External APIs - Already in Migration Doc)

- **Status**: Already covered in Lambda section (Step 4.4)
- **Implementation**: Payment callback Lambda function included

---

## Services Summary

### ✅ Covered in Migration Document

1. **Amazon RDS PostgreSQL** - Database migration (Phase 1)
2. **AWS Elastic Beanstalk** - Django application hosting (Phase 3)
3. **Amazon S3** - Static files, media uploads, policy PDFs (Phase 2)
4. **Amazon CloudFront** - Global CDN for static/media (Phase 2)
5. **Amazon SNS** - SMS notifications (OTP, policy confirmations) (Phase 4)
6. **Amazon SES** - Transactional emails (Phase 4)
7. **AWS Lambda** - Background tasks:
   - Renewal reminders (EventBridge trigger)
   - M-PESA payment callbacks (API Gateway trigger)
   - PDF generation for policy certificates (SQS trigger)
   - Textract document processing (SQS trigger - already deployed)
8. **Amazon EventBridge** - Scheduled jobs (daily renewals, weekly campaigns) (Phase 4)
9. **Amazon Textract** - Document OCR (already deployed, update in Phase 4.6)
10. **API Gateway** - Payment webhook protection (optional, Phase 4.4)
11. **Amazon SQS** - Message queues:
    - `patabima-textract-dev` - Textract jobs (already deployed)
    - `patabima-pdf-generation` - Async PDF generation (Phase 4.5)
    - Dead Letter Queues for both

### ❌ Not Applicable / Archived

- **AWS Amplify** - Legacy, not used in production
- **AWS Cognito** - Not used (Django JWT authentication instead)
- **AWS AppSync** - Not used (Django REST API instead)
- **Amazon Pinpoint** - Not configured/used
- **DMVIC API** - External third-party service (Kenya NTSA)

---

## Migration Strategy

### Phase 1: Database Migration (Week 1)

#### Step 1.1: Create RDS PostgreSQL Instance

```bash
# Using AWS CLI
aws rds create-db-instance \
  --db-instance-identifier patabima-prod-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username patabima_admin \
  --master-user-password <SECURE_PASSWORD> \
  --allocated-storage 100 \
  --storage-type gp3 \
  --backup-retention-period 7 \
  --multi-az \
  --publicly-accessible false \
  --vpc-security-group-ids sg-xxxxxxxx \
  --db-subnet-group-name patabima-db-subnet \
  --tags Key=Project,Value=PataBima Key=Environment,Value=Production
```

**RDS Configuration:**

- **Instance Type**: `db.t3.medium` (2 vCPU, 4GB RAM) - start small, scale later
- **Storage**: 100GB SSD (auto-scaling enabled to 500GB)
- **Multi-AZ**: Enabled (automatic failover)
- **Backup Window**: 2:00 AM - 3:00 AM EAT (low traffic period)
- **Maintenance Window**: Sunday 3:00 AM - 4:00 AM EAT

#### Step 1.2: Migrate Database Data

```bash
# On current EC2 instance
# 1. Dump current PostgreSQL database
pg_dump -h localhost -U patabima_user -d patabima_db -F c -f patabima_backup.dump

# 2. Upload to S3 for safe storage
aws s3 cp patabima_backup.dump s3://patabima-backups/migrations/$(date +%Y%m%d)/

# 3. Restore to RDS instance
pg_restore -h patabima-prod-db.xxxxxx.us-east-1.rds.amazonaws.com \
  -U patabima_admin -d patabima_db -v patabima_backup.dump

# 4. Verify data integrity
psql -h patabima-prod-db.xxxxxx.us-east-1.rds.amazonaws.com \
  -U patabima_admin -d patabima_db -c "SELECT COUNT(*) FROM app_motorpolicy;"
```

#### Step 1.3: Update Django Database Settings

```python
# insurance-app/insurance/settings.py
import os

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('RDS_DB_NAME', 'patabima_db'),
        'USER': os.environ.get('RDS_USERNAME', 'patabima_admin'),
        'PASSWORD': os.environ.get('RDS_PASSWORD'),
        'HOST': os.environ.get('RDS_HOSTNAME', 'patabima-prod-db.xxxxxx.us-east-1.rds.amazonaws.com'),
        'PORT': os.environ.get('RDS_PORT', '5432'),
        'OPTIONS': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000'  # 30 second query timeout
        },
        'CONN_MAX_AGE': 600,  # Connection pooling (10 minutes)
    }
}

# Enable connection pooling for production
if not DEBUG:
    DATABASES['default']['CONN_MAX_AGE'] = 600
```

**Environment Variables (Elastic Beanstalk):**

```bash
RDS_DB_NAME=patabima_db
RDS_USERNAME=patabima_admin
RDS_PASSWORD=<SECURE_PASSWORD>
RDS_HOSTNAME=patabima-prod-db.xxxxxx.us-east-1.rds.amazonaws.com
RDS_PORT=5432
```

---

### Phase 2: S3 + CloudFront Setup (Week 1-2)

#### Step 2.1: Create S3 Buckets

```bash
# Static files bucket (CSS, JS, images)
aws s3 mb s3://patabima-static-files --region us-east-1

# Media files bucket (uploads, policy PDFs)
aws s3 mb s3://patabima-media-files --region us-east-1

# Backups bucket (database dumps, archives)
aws s3 mb s3://patabima-backups --region us-east-1
```

**Bucket Policies:**

```json
// patabima-static-files bucket policy (public read)
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::patabima-static-files/*"
    }
  ]
}

// patabima-media-files bucket policy (authenticated access only)
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyPublicAccess",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::patabima-media-files/*",
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalArn": "arn:aws:iam::ACCOUNT_ID:role/patabima-eb-role"
        }
      }
    }
  ]
}
```

#### Step 2.2: Configure Django for S3 Storage

**Install boto3 and django-storages:**

```bash
# Add to insurance-app/requirements.txt
boto3==1.34.34
django-storages[s3]==1.14.2
```

**Update Django settings:**

```python
# insurance-app/insurance/settings.py

# AWS S3 Configuration
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME', 'patabima-static-files')
AWS_S3_REGION_NAME = 'us-east-1'
AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'

# Static files (CSS, JavaScript, Images)
STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/static/'
STATICFILES_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

# Media files (uploads)
MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

# S3 settings
AWS_S3_OBJECT_PARAMETERS = {
    'CacheControl': 'max-age=86400',  # 1 day cache
}
AWS_DEFAULT_ACL = 'public-read'
AWS_QUERYSTRING_AUTH = False  # Don't add auth to public URLs
```

**Collect static files to S3:**

```bash
# Run this during deployment
python manage.py collectstatic --noinput
```

#### Step 2.3: Create CloudFront Distribution

```bash
# Create CloudFront distribution using AWS CLI
aws cloudfront create-distribution \
  --origin-domain-name patabima-static-files.s3.us-east-1.amazonaws.com \
  --default-root-object index.html \
  --comment "PataBima Static Files CDN" \
  --enabled
```

**CloudFront Configuration:**

- **Origins**:
  - S3 Static Files: `patabima-static-files.s3.amazonaws.com`
  - S3 Media Files: `patabima-media-files.s3.amazonaws.com`
  - Elastic Beanstalk API: `patabima-api.us-east-1.elasticbeanstalk.com`
- **Behaviors**:
  - `/static/*` → S3 Static Files (cache 1 year)
  - `/media/*` → S3 Media Files (cache 1 week)
  - `/api/*` → Elastic Beanstalk (no cache, forward all headers)
  - `/*` → Elastic Beanstalk (default)
- **SSL Certificate**: Request ACM certificate for `cdn.patabima.com`
- **GZIP Compression**: Enabled
- **HTTP/2**: Enabled

**Update Django to use CloudFront URL:**

```python
# After CloudFront setup
STATIC_URL = 'https://d1234abcd.cloudfront.net/static/'
MEDIA_URL = 'https://d1234abcd.cloudfront.net/media/'
```

---

### Phase 3: Elastic Beanstalk Setup (Week 2)

#### Step 3.1: Prepare Django App for Elastic Beanstalk

**Create `.ebextensions/` directory:**

```bash
mkdir -p insurance-app/.ebextensions
```

**File: `insurance-app/.ebextensions/01_packages.config`**

```yaml
packages:
  yum:
    git: []
    postgresql-devel: []
    python3-devel: []
    gcc: []
```

**File: `insurance-app/.ebextensions/02_python.config`**

```yaml
option_settings:
  aws:elasticbeanstalk:container:python:
    WSGIPath: insurance.wsgi:application
  aws:elasticbeanstalk:application:environment:
    DJANGO_SETTINGS_MODULE: insurance.settings
    PYTHONPATH: /var/app/current:$PYTHONPATH
  aws:elasticbeanstalk:environment:proxy:staticfiles:
    /static: static
```

**File: `insurance-app/.ebextensions/03_django.config`**

```yaml
container_commands:
  01_migrate:
    command: "source /var/app/venv/*/bin/activate && python manage.py migrate --noinput"
    leader_only: true
  02_collectstatic:
    command: "source /var/app/venv/*/bin/activate && python manage.py collectstatic --noinput"
  03_createsu:
    command: "source /var/app/venv/*/bin/activate && python manage.py createsu"
    leader_only: true
    ignoreErrors: true

option_settings:
  aws:elasticbeanstalk:application:environment:
    DJANGO_SETTINGS_MODULE: "insurance.settings"
```

**File: `insurance-app/.ebextensions/04_https_redirect.config`**

```yaml
# Redirect HTTP to HTTPS
files:
  "/etc/httpd/conf.d/ssl_rewrite.conf":
    mode: "000644"
    owner: root
    group: root
    content: |
      RewriteEngine On
      <If "-n '%{HTTP:X-Forwarded-Proto}' && %{HTTP:X-Forwarded-Proto} != 'https'">
      RewriteRule (.*) https://%{HTTP_HOST}%{REQUEST_URI} [R,L]
      </If>
```

#### Step 3.2: Initialize Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
cd insurance-app
eb init patabima-backend \
  --platform python-3.11 \
  --region us-east-1

# Create environment
eb create patabima-prod-env \
  --instance-type t3.medium \
  --scale 2 \
  --envvars \
    DJANGO_SECRET_KEY=<SECURE_SECRET_KEY>,\
    RDS_DB_NAME=patabima_db,\
    RDS_USERNAME=patabima_admin,\
    RDS_PASSWORD=<SECURE_PASSWORD>,\
    RDS_HOSTNAME=patabima-prod-db.xxxxxx.us-east-1.rds.amazonaws.com,\
    RDS_PORT=5432,\
    AWS_STORAGE_BUCKET_NAME=patabima-static-files,\
    AWS_ACCESS_KEY_ID=<ACCESS_KEY>,\
    AWS_SECRET_ACCESS_KEY=<SECRET_KEY>
```

**Elastic Beanstalk Configuration:**

- **Platform**: Python 3.11 on Amazon Linux 2023
- **Instance Type**: t3.medium (2 vCPU, 4GB RAM)
- **Auto Scaling**:
  - Min instances: 2 (high availability)
  - Max instances: 10 (handle traffic spikes)
  - Scale up when CPU > 70%
  - Scale down when CPU < 30%
- **Load Balancer**: Application Load Balancer (ALB)
  - Health check: `/api/health/`
  - Sticky sessions: Enabled
  - Idle timeout: 60 seconds

#### Step 3.3: Deploy Django App

```bash
# Deploy to Elastic Beanstalk
eb deploy patabima-prod-env

# Monitor deployment
eb logs patabima-prod-env --stream

# Check environment health
eb health patabima-prod-env --refresh
```

---

### Phase 4: SNS + SES Integration (Week 2-3)

#### Step 4.1: Set Up Amazon SNS for SMS

**Create SNS Topic for Notifications:**

```bash
# Create SNS topic
aws sns create-topic --name patabima-notifications

# Enable SMS spending limit (prevent billing surprises)
aws sns set-sms-attributes \
  --attributes MonthlySpendLimit=500  # $500/month max

# Set SMS type to Transactional (higher priority)
aws sns set-sms-attributes \
  --attributes DefaultSMSType=Transactional
```

**Configure SMS Sender ID (for Kenya):**

```bash
# Request Sender ID from AWS Support
# Sender ID: "PataBima" (approved for Kenya)
# Note: Requires AWS Support ticket and approval
```

**Install boto3 for SNS:**

```bash
# Already installed from S3 setup
pip install boto3==1.34.34
```

**Create SNS Service Module:**

**File: `insurance-app/app/services/aws_sns.py`**

```python
import boto3
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class SNSService:
    """AWS SNS service for sending SMS and notifications"""

    def __init__(self):
        self.sns_client = boto3.client(
            'sns',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        self.sender_id = settings.AWS_SNS_SENDER_ID  # "PataBima"

    def send_sms(self, phone_number, message):
        """
        Send SMS via AWS SNS

        Args:
            phone_number (str): Kenyan phone number (e.g., +254708163485)
            message (str): SMS content (max 160 chars for standard SMS)

        Returns:
            dict: SNS response with MessageId
        """
        try:
            # Ensure phone number has country code
            if not phone_number.startswith('+'):
                # Convert 0708163485 to +254708163485
                phone_number = '+254' + phone_number.lstrip('0')

            # Send SMS
            response = self.sns_client.publish(
                PhoneNumber=phone_number,
                Message=message,
                MessageAttributes={
                    'AWS.SNS.SMS.SenderID': {
                        'DataType': 'String',
                        'StringValue': self.sender_id
                    },
                    'AWS.SNS.SMS.SMSType': {
                        'DataType': 'String',
                        'StringValue': 'Transactional'  # Higher priority delivery
                    }
                }
            )

            logger.info(f"SMS sent to {phone_number}: MessageId={response['MessageId']}")
            return {'success': True, 'message_id': response['MessageId']}

        except Exception as e:
            logger.error(f"Failed to send SMS to {phone_number}: {e}")
            return {'success': False, 'error': str(e)}

    def send_otp(self, phone_number, otp_code):
        """Send OTP code via SMS"""
        message = f"PataBima OTP: {otp_code}. Valid for 5 minutes. Do not share this code."
        return self.send_sms(phone_number, message)

    def send_policy_confirmation(self, phone_number, policy_number, cover_start):
        """Send policy activation SMS"""
        message = (
            f"PolicyPro Insurance\n"
            f"Policy: {policy_number}\n"
            f"Cover starts: {cover_start}\n"
            f"Download certificate from PataBima app."
        )
        return self.send_sms(phone_number, message)

    def send_renewal_reminder(self, phone_number, policy_number, days_until_expiry):
        """Send renewal reminder SMS"""
        message = (
            f"PataBima Reminder\n"
            f"Policy {policy_number} expires in {days_until_expiry} days.\n"
            f"Renew now to avoid coverage gaps."
        )
        return self.send_sms(phone_number, message)

    def send_payment_confirmation(self, phone_number, amount, transaction_id):
        """Send M-PESA payment confirmation SMS"""
        message = (
            f"Payment Received\n"
            f"Amount: KSh {amount:,.2f}\n"
            f"Txn: {transaction_id}\n"
            f"Thank you for choosing PataBima."
        )
        return self.send_sms(phone_number, message)
```

**Update Django Settings:**

```python
# insurance-app/insurance/settings.py

# AWS SNS Configuration
AWS_REGION = 'us-east-1'
AWS_SNS_SENDER_ID = os.environ.get('AWS_SNS_SENDER_ID', 'PataBima')
AWS_SNS_TOPIC_ARN = os.environ.get('AWS_SNS_TOPIC_ARN', '')
```

**Update Notification Service to Use SNS:**

```python
# insurance-app/app/services/notifications.py

from .aws_sns import SNSService

sns_service = SNSService()

def send_policy_sms(phone_number, policy_number, cover_start_date=None):
    """Send SMS using AWS SNS instead of Africa's Talking"""
    try:
        result = sns_service.send_policy_confirmation(
            phone_number,
            policy_number,
            cover_start_date.strftime('%m/%d/%Y') if cover_start_date else 'TBD'
        )
        return result['success']
    except Exception as e:
        logger.error(f"Error sending policy SMS: {e}")
        return False
```

**Update OTP Sending (Authentication):**

```python
# insurance-app/app/views.py (or auth views)

from app.services.aws_sns import SNSService

sns_service = SNSService()

def send_otp_to_phone(phone_number, otp_code):
    """Send OTP via AWS SNS"""
    result = sns_service.send_otp(phone_number, otp_code)
    return result['success']
```

#### Step 4.2: Set Up Amazon SES for Emails

**Verify Email Domain:**

```bash
# Verify domain for sending emails
aws ses verify-domain-identity --domain patabima.com

# Add DNS records (provided by AWS) to your domain registrar:
# - TXT record for domain verification
# - DKIM CNAME records for email authentication
```

**Create Email Templates:**

**File: `insurance-app/app/templates/emails/policy_confirmation.html`**

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        font-family: Arial, sans-serif;
        color: #333;
      }
      .header {
        background: #d5222b;
        color: white;
        padding: 20px;
        text-align: center;
      }
      .content {
        padding: 20px;
      }
      .footer {
        background: #f5f5f5;
        padding: 10px;
        text-align: center;
        font-size: 12px;
      }
      .button {
        background: #d5222b;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 4px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Policy Confirmation</h1>
    </div>
    <div class="content">
      <p>Dear {{ client_name }},</p>
      <p>Your insurance policy has been successfully activated!</p>
      <h3>Policy Details:</h3>
      <ul>
        <li><strong>Policy Number:</strong> {{ policy_number }}</li>
        <li><strong>Cover Type:</strong> {{ cover_type }}</li>
        <li><strong>Cover Start:</strong> {{ cover_start }}</li>
        <li><strong>Cover End:</strong> {{ cover_end }}</li>
        <li><strong>Premium Paid:</strong> KSh {{ premium }}</li>
      </ul>
      <p>
        <a href="{{ download_link }}" class="button">Download Certificate</a>
      </p>
      <p>Thank you for choosing PataBima Insurance!</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 PataBima Insurance. All rights reserved.</p>
      <p>Contact: support@patabima.com | +254-XXX-XXXXXX</p>
    </div>
  </body>
</html>
```

**Create SES Service Module:**

**File: `insurance-app/app/services/aws_ses.py`**

```python
import boto3
from django.conf import settings
from django.template.loader import render_to_string
import logging

logger = logging.getLogger(__name__)

class SESService:
    """AWS SES service for sending emails"""

    def __init__(self):
        self.ses_client = boto3.client(
            'ses',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        self.from_email = settings.AWS_SES_FROM_EMAIL

    def send_email(self, to_email, subject, html_body, text_body=None):
        """
        Send email via AWS SES

        Args:
            to_email (str): Recipient email address
            subject (str): Email subject
            html_body (str): HTML email content
            text_body (str): Plain text fallback

        Returns:
            dict: SES response with MessageId
        """
        try:
            body_content = {'Html': {'Data': html_body, 'Charset': 'UTF-8'}}
            if text_body:
                body_content['Text'] = {'Data': text_body, 'Charset': 'UTF-8'}

            response = self.ses_client.send_email(
                Source=self.from_email,
                Destination={'ToAddresses': [to_email]},
                Message={
                    'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                    'Body': body_content
                }
            )

            logger.info(f"Email sent to {to_email}: MessageId={response['MessageId']}")
            return {'success': True, 'message_id': response['MessageId']}

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return {'success': False, 'error': str(e)}

    def send_policy_email(self, policy):
        """Send policy confirmation email with HTML template"""
        client_email = policy.client_details.get('email')
        if not client_email:
            logger.warning(f"No email for policy {policy.policy_number}")
            return {'success': False, 'error': 'No email provided'}

        # Render HTML template
        html_body = render_to_string('emails/policy_confirmation.html', {
            'client_name': policy.client_details.get('name', 'Valued Client'),
            'policy_number': policy.policy_number,
            'cover_type': policy.product_details.get('name', 'Insurance Policy'),
            'cover_start': policy.cover_start_date.strftime('%m/%d/%Y'),
            'cover_end': policy.cover_end_date.strftime('%m/%d/%Y'),
            'premium': f"{policy.premium:,.2f}",
            'download_link': f"https://app.patabima.com/policies/{policy.policy_number}/certificate"
        })

        subject = f"Policy Confirmation - {policy.policy_number}"
        return self.send_email(client_email, subject, html_body)
```

**Update Django Settings:**

```python
# insurance-app/insurance/settings.py

# AWS SES Configuration
AWS_SES_FROM_EMAIL = os.environ.get('AWS_SES_FROM_EMAIL', 'no-reply@patabima.com')
AWS_SES_REGION = 'us-east-1'

# Django Email Backend (use SES)
EMAIL_BACKEND = 'django_ses.SESBackend'
AWS_SES_REGION_NAME = AWS_SES_REGION
AWS_SES_REGION_ENDPOINT = f'email.{AWS_SES_REGION}.amazonaws.com'
```

**Install django-ses:**

```bash
# Add to requirements.txt
django-ses==3.5.2
```

#### Step 4.3: Create Lambda Functions for Background Tasks

**Lambda Function: Daily Renewal Reminders**

**File: `aws-lambdas/renewal_reminders/handler.py`**

```python
import json
import boto3
import psycopg2
from datetime import date, timedelta
import os

def lambda_handler(event, context):
    """
    Lambda function to send renewal reminders
    Triggered daily by EventBridge at 8:00 AM EAT
    """

    # Connect to RDS database
    conn = psycopg2.connect(
        host=os.environ['RDS_HOSTNAME'],
        database=os.environ['RDS_DB_NAME'],
        user=os.environ['RDS_USERNAME'],
        password=os.environ['RDS_PASSWORD']
    )

    sns_client = boto3.client('sns')
    ses_client = boto3.client('ses')

    # Find policies expiring in 30, 14, and 7 days
    cursor = conn.cursor()

    for days_ahead in [30, 14, 7, 3, 1]:
        target_date = date.today() + timedelta(days=days_ahead)

        cursor.execute("""
            SELECT policy_number, client_details, cover_end_date
            FROM app_motorpolicy
            WHERE cover_end_date = %s
              AND status = 'active'
        """, (target_date,))

        policies = cursor.fetchall()

        for policy_number, client_details, cover_end in policies:
            phone = client_details.get('phone')
            email = client_details.get('email')

            # Send SMS reminder
            if phone:
                message = f"PataBima Reminder: Policy {policy_number} expires in {days_ahead} days. Renew now to avoid gaps in coverage."
                sns_client.publish(
                    PhoneNumber=phone,
                    Message=message,
                    MessageAttributes={
                        'AWS.SNS.SMS.SenderID': {'DataType': 'String', 'StringValue': 'PataBima'}
                    }
                )

            # Send email reminder
            if email:
                ses_client.send_email(
                    Source='no-reply@patabima.com',
                    Destination={'ToAddresses': [email]},
                    Message={
                        'Subject': {'Data': f'Renewal Reminder - {policy_number}'},
                        'Body': {'Text': {'Data': f'Your policy expires in {days_ahead} days. Renew now!'}}
                    }
                )

        print(f"Sent {len(policies)} reminders for {days_ahead}-day expiry")

    conn.close()

    return {
        'statusCode': 200,
        'body': json.dumps('Renewal reminders sent successfully')
    }
```

**Deploy Lambda Function:**

```bash
# Package Lambda function
cd aws-lambdas/renewal_reminders
pip install -r requirements.txt -t .
zip -r function.zip .

# Create Lambda function
aws lambda create-function \
  --function-name patabima-renewal-reminders \
  --runtime python3.11 \
  --role arn:aws:iam::ACCOUNT_ID:role/patabima-lambda-role \
  --handler handler.lambda_handler \
  --zip-file fileb://function.zip \
  --timeout 60 \
  --memory-size 256 \
  --environment Variables="{
    RDS_HOSTNAME=patabima-prod-db.xxxxxx.us-east-1.rds.amazonaws.com,
    RDS_DB_NAME=patabima_db,
    RDS_USERNAME=patabima_admin,
    RDS_PASSWORD=<SECURE_PASSWORD>
  }"

# Create EventBridge rule (daily at 8:00 AM EAT)
aws events put-rule \
  --name patabima-daily-renewals \
  --schedule-expression "cron(0 5 * * ? *)"  # 8:00 AM EAT = 5:00 AM UTC

# Add Lambda permission for EventBridge
aws lambda add-permission \
  --function-name patabima-renewal-reminders \
  --statement-id AllowEventBridgeInvoke \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:us-east-1:ACCOUNT_ID:rule/patabima-daily-renewals

# Add Lambda target to EventBridge rule
aws events put-targets \
  --rule patabima-daily-renewals \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:ACCOUNT_ID:function:patabima-renewal-reminders"
```

#### Step 4.4: M-PESA Callback Processing with Lambda

**Lambda Function: Process M-PESA Callbacks**

**File: `aws-lambdas/mpesa_callback/handler.py`**

```python
import json
import boto3
import psycopg2
import os
from datetime import datetime

def lambda_handler(event, context):
    """
    Process M-PESA payment callbacks
    Triggered by API Gateway webhook endpoint
    """

    # Parse M-PESA callback payload
    body = json.loads(event['body'])

    transaction_id = body.get('TransID')
    amount = float(body.get('TransAmount', 0))
    phone = body.get('MSISDN')
    ref_number = body.get('BillRefNumber')  # Policy number or quote reference

    # Connect to RDS
    conn = psycopg2.connect(
        host=os.environ['RDS_HOSTNAME'],
        database=os.environ['RDS_DB_NAME'],
        user=os.environ['RDS_USERNAME'],
        password=os.environ['RDS_PASSWORD']
    )

    cursor = conn.cursor()

    # Find pending policy payment
    cursor.execute("""
        UPDATE app_motorpolicy
        SET payment_details = jsonb_set(payment_details, '{status}', '"CONFIRMED"'),
            payment_details = jsonb_set(payment_details, '{transactionId}', %s),
            payment_details = jsonb_set(payment_details, '{confirmedAt}', %s),
            status = 'active',
            updated_at = NOW()
        WHERE policy_number = %s
          AND payment_details->>'status' = 'PENDING'
        RETURNING policy_number, client_details
    """, (json.dumps(transaction_id), json.dumps(datetime.utcnow().isoformat()), ref_number))

    result = cursor.fetchone()

    if result:
        policy_number, client_details = result

        # Send confirmation SMS via SNS
        sns_client = boto3.client('sns')
        sns_client.publish(
            PhoneNumber=client_details['phone'],
            Message=f"Payment confirmed! Policy {policy_number} is now active. Download certificate from PataBima app.",
            MessageAttributes={
                'AWS.SNS.SMS.SenderID': {'DataType': 'String', 'StringValue': 'PataBima'}
            }
        )

        # Send confirmation email via SES
        if client_details.get('email'):
            ses_client = boto3.client('ses')
            ses_client.send_email(
                Source='no-reply@patabima.com',
                Destination={'ToAddresses': [client_details['email']]},
                Message={
                    'Subject': {'Data': f'Payment Confirmed - {policy_number}'},
                    'Body': {'Html': {'Data': f'<p>Your payment of KSh {amount:,.2f} has been confirmed. Policy {policy_number} is now active.</p>'}}
                }
            )

        conn.commit()
        conn.close()

        return {'statusCode': 200, 'body': json.dumps({'ResultCode': 0, 'ResultDesc': 'Accepted'})}

    else:
        conn.close()
        return {'statusCode': 400, 'body': json.dumps({'ResultCode': 1, 'ResultDesc': 'Policy not found'})}
```

**Create API Gateway Endpoint for M-PESA Webhook:**

```bash
# Create REST API
aws apigateway create-rest-api \
  --name patabima-mpesa-webhook \
  --description "M-PESA payment callback endpoint"

# Create resource and POST method
# (Requires additional API Gateway configuration - see AWS docs)
```

#### Step 4.5: PDF Generation Lambda + SQS Queue

**Create SQS Queue for PDF Generation Jobs:**

```bash
# Create SQS queue for PDF generation
aws sqs create-queue \
  --queue-name patabima-pdf-generation \
  --attributes '{
    "DelaySeconds": "0",
    "MessageRetentionPeriod": "345600",
    "VisibilityTimeout": "300",
    "ReceiveMessageWaitTimeSeconds": "0"
  }'

# Create Dead Letter Queue for failed jobs
aws sqs create-queue \
  --queue-name patabima-pdf-generation-dlq \
  --attributes MessageRetentionPeriod=1209600

# Get queue URLs
aws sqs list-queues --queue-name-prefix patabima-pdf
```

**Lambda Function: Async PDF Generator**

**File: `aws-lambdas/pdf_generator/handler.py`**

```python
import json
import boto3
import psycopg2
from io import BytesIO
from datetime import datetime
import os

# ReportLab imports
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch

def lambda_handler(event, context):
    """
    Generate policy PDF asynchronously
    Triggered by SQS message from Django
    """

    # Parse SQS message
    for record in event['Records']:
        body = json.loads(record['body'])
        policy_id = body.get('policy_id')
        policy_number = body.get('policy_number')

        print(f"Generating PDF for policy {policy_number} (ID: {policy_id})")

        # Connect to RDS to fetch policy data
        conn = psycopg2.connect(
            host=os.environ['RDS_HOSTNAME'],
            database=os.environ['RDS_DB_NAME'],
            user=os.environ['RDS_USERNAME'],
            password=os.environ['RDS_PASSWORD']
        )

        cursor = conn.cursor()
        cursor.execute("""
            SELECT policy_number, product_details, client_details,
                   pricing_details, cover_start_date, cover_end_date,
                   premium, underwriter_details
            FROM app_motorpolicy
            WHERE id = %s
        """, (policy_id,))

        policy_data = cursor.fetchone()

        if not policy_data:
            print(f"Policy {policy_number} not found")
            return {'statusCode': 404, 'body': 'Policy not found'}

        # Generate PDF
        pdf_content = generate_pdf(policy_data)

        # Upload to S3
        s3_client = boto3.client('s3')
        s3_key = f"policy-certificates/{policy_number}.pdf"

        s3_client.put_object(
            Bucket=os.environ['S3_BUCKET'],
            Key=s3_key,
            Body=pdf_content,
            ContentType='application/pdf',
            Metadata={
                'policy-number': policy_number,
                'generated-at': datetime.utcnow().isoformat()
            }
        )

        s3_url = f"https://{os.environ['S3_BUCKET']}.s3.amazonaws.com/{s3_key}"

        # Update policy record with PDF URL
        cursor.execute("""
            UPDATE app_motorpolicy
            SET certificate_url = %s,
                updated_at = NOW()
            WHERE id = %s
        """, (s3_url, policy_id))

        conn.commit()
        conn.close()

        # Send callback to Django (optional - for real-time notification)
        if os.environ.get('DJANGO_API_URL'):
            import requests
            requests.post(
                f"{os.environ['DJANGO_API_URL']}/api/motor2/policies/{policy_number}/pdf-ready",
                json={'s3_url': s3_url, 'policy_number': policy_number},
                headers={'X-Lambda-Secret': os.environ.get('CALLBACK_SECRET', '')}
            )

        print(f"PDF generated and uploaded: {s3_url}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'policy_number': policy_number,
                's3_url': s3_url
            })
        }

def generate_pdf(policy_data):
    """Generate PDF from policy data using ReportLab"""
    (policy_number, product_details, client_details, pricing_details,
     cover_start, cover_end, premium, underwriter_details) = policy_data

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    story = []
    styles = getSampleStyleSheet()

    # Header
    story.append(Paragraph("MOTOR INSURANCE POLICY CERTIFICATE", styles['Title']))
    story.append(Spacer(1, 0.3*inch))

    # Policy details table
    policy_table_data = [
        ["Policy Number:", policy_number],
        ["Cover Type:", product_details.get('name', 'N/A')],
        ["Cover Period:", f"{cover_start} to {cover_end}"],
        ["Premium (KSh):", f"{premium:,.2f}"],
    ]

    policy_table = Table(policy_table_data, colWidths=[2*inch, 4*inch])
    policy_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ]))

    story.append(policy_table)
    story.append(Spacer(1, 0.3*inch))

    # Client details
    story.append(Paragraph("INSURED PERSON", styles['Heading2']))
    client_table_data = [
        ["Name:", client_details.get('name', 'N/A')],
        ["ID Number:", client_details.get('id_number', 'N/A')],
        ["Phone:", client_details.get('phone', 'N/A')],
        ["Email:", client_details.get('email', 'N/A')],
    ]

    client_table = Table(client_table_data, colWidths=[2*inch, 4*inch])
    client_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
    ]))

    story.append(client_table)

    # Build PDF
    doc.build(story)

    return buffer.getvalue()
```

**Deploy PDF Generation Lambda:**

```bash
# Package Lambda with dependencies
cd aws-lambdas/pdf_generator
pip install reportlab psycopg2-binary requests -t .
zip -r function.zip .

# Create Lambda function
aws lambda create-function \
  --function-name patabima-pdf-generator \
  --runtime python3.11 \
  --role arn:aws:iam::ACCOUNT_ID:role/patabima-lambda-role \
  --handler handler.lambda_handler \
  --zip-file fileb://function.zip \
  --timeout 120 \
  --memory-size 512 \
  --environment Variables="{
    RDS_HOSTNAME=patabima-prod-db.xxxxxx.us-east-1.rds.amazonaws.com,
    RDS_DB_NAME=patabima_db,
    RDS_USERNAME=patabima_admin,
    RDS_PASSWORD=<SECURE_PASSWORD>,
    S3_BUCKET=patabima-prod-uploads,
    DJANGO_API_URL=http://patabima-prod-env.us-east-1.elasticbeanstalk.com,
    CALLBACK_SECRET=<SECURE_SECRET>
  }"

# Add SQS trigger
aws lambda create-event-source-mapping \
  --function-name patabima-pdf-generator \
  --batch-size 5 \
  --event-source-arn arn:aws:sqs:us-east-1:ACCOUNT_ID:patabima-pdf-generation
```

**Update Django to Use Async PDF Generation:**

```python
# insurance-app/app/services/pdf_generator.py

import boto3
import json
from django.conf import settings

def queue_pdf_generation(policy):
    """
    Queue PDF generation as async Lambda job instead of synchronous generation

    Args:
        policy: MotorPolicy instance

    Returns:
        str: SQS message ID
    """
    sqs_client = boto3.client('sqs', region_name=settings.AWS_REGION)

    message = {
        'policy_id': policy.id,
        'policy_number': policy.policy_number,
        'requested_at': datetime.utcnow().isoformat()
    }

    response = sqs_client.send_message(
        QueueUrl=settings.PDF_GENERATION_QUEUE_URL,
        MessageBody=json.dumps(message)
    )

    logger.info(f"Queued PDF generation for {policy.policy_number}: {response['MessageId']}")

    return response['MessageId']
```

**Django Settings Update:**

```python
# insurance-app/insurance/settings.py

# PDF Generation Configuration
PDF_GENERATION_QUEUE_URL = os.environ.get(
    'PDF_GENERATION_QUEUE_URL',
    'https://sqs.us-east-1.amazonaws.com/ACCOUNT_ID/patabima-pdf-generation'
)
PDF_GENERATION_ASYNC = os.environ.get('PDF_GENERATION_ASYNC', 'true') == 'true'
```

**Update `.ebextensions/03_pdf_generation.config`:**

```yaml
# .ebextensions/03_pdf_generation.config
option_settings:
  aws:elasticbeanstalk:application:environment:
    # PDF Generation Queue
    PDF_GENERATION_QUEUE_URL: "https://sqs.us-east-1.amazonaws.com/ACCOUNT_ID/patabima-pdf-generation"

    # Enable async PDF generation
    PDF_GENERATION_ASYNC: "true"
```

#### Step 4.6: Update Textract Configuration for Production

**Update Textract Lambda Environment Variables:**

The existing Textract Lambda function needs to be updated to work with the new production environment.

```bash
# Update Lambda environment variables
aws lambda update-function-configuration \
  --function-name patabima-textract-processor-dev \
  --environment Variables="{
    S3_BUCKET=patabima-prod-uploads,
    S3_PREFIX=documents,
    RESULTS_S3_BUCKET=patabima-prod-uploads,
    RESULTS_S3_PREFIX=textract-results,
    DJANGO_API_URL=http://patabima-prod-env.us-east-1.elasticbeanstalk.com,
    CALLBACK_SECRET=<SAME_SECRET_FROM_ENV>
  }"
```

**Update Django Environment Variables for Textract:**

```python
# insurance-app/insurance/settings.py

# AWS Textract Configuration (update for production)
AWS_TEXTRACT_ENABLED = True
TEXTRACT_SQS_QUEUE_URL = os.environ.get('TEXTRACT_SQS_QUEUE_URL', '')
TEXTRACT_CALLBACK_SECRET = os.environ.get('TEXTRACT_CALLBACK_SECRET', '')

# S3 Configuration for document uploads
AWS_TEXTRACT_BUCKET = os.environ.get('AWS_S3_BUCKET_NAME', 'patabima-prod-uploads')
AWS_TEXTRACT_RESULTS_PREFIX = 'textract-results'
```

**Update `.ebextensions/02_textract.config`:**

```yaml
# .ebextensions/02_textract.config
option_settings:
  aws:elasticbeanstalk:application:environment:
    # Textract SQS Queue
    TEXTRACT_SQS_QUEUE_URL: "https://sqs.us-east-1.amazonaws.com/ACCOUNT_ID/patabima-textract-dev"

    # Textract Callback Security
    TEXTRACT_CALLBACK_SECRET: "YOUR_CALLBACK_SECRET"

    # Enable Textract
    AWS_TEXTRACT_ENABLED: "true"

    # Results Storage
    TEXTRACT_RESULTS_BUCKET: "patabima-prod-uploads"
    TEXTRACT_RESULTS_PREFIX: "textract-results"
```

**Verify Textract Integration:**

```bash
# Test document upload flow
curl -X POST https://patabima-prod-env.us-east-1.elasticbeanstalk.com/api/motor2/documents/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "document=@test_logbook.jpg" \
  -F "document_type=logbook"

# Check SQS queue for message
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/ACCOUNT_ID/patabima-textract-dev \
  --attribute-names ApproximateNumberOfMessages

# Check Lambda logs
aws logs tail /aws/lambda/patabima-textract-processor-dev --follow

# Verify results in S3
aws s3 ls s3://patabima-prod-uploads/textract-results/
```

**Textract Migration Checklist:**

- [ ] Update Lambda environment variables (S3 bucket, Django URL)
- [ ] Update Django settings (SQS queue URL, callback secret)
- [ ] Create `.ebextensions/02_textract.config` for EB environment
- [ ] Test document upload → Textract processing → callback flow
- [ ] Monitor Lambda CloudWatch logs for errors
- [ ] Verify extracted data appears in Django admin
- [ ] Test frontend document upload with auto-fill functionality

---

### Phase 5: CI/CD Pipeline (Week 3)

#### Step 4.1: GitHub Actions for Automated Deployment

**File: `.github/workflows/deploy-backend.yml`**

```yaml
name: Deploy Django Backend to AWS Elastic Beanstalk

on:
  push:
    branches:
      - main
    paths:
      - "insurance-app/**"
      - ".github/workflows/deploy-backend.yml"

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: |
          cd insurance-app
          pip install -r requirements.txt

      - name: Run Django tests
        env:
          DJANGO_SETTINGS_MODULE: insurance.settings
          SECRET_KEY: ${{ secrets.DJANGO_SECRET_KEY }}
        run: |
          cd insurance-app
          python manage.py test

      - name: Install EB CLI
        run: pip install awsebcli

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to Elastic Beanstalk
        run: |
          cd insurance-app
          eb deploy patabima-prod-env --staged

      - name: Verify deployment
        run: |
          cd insurance-app
          eb health patabima-prod-env
```

**GitHub Secrets to Configure:**

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `DJANGO_SECRET_KEY`

---

### Phase 5: Monitoring & Logging (Week 3-4)

#### Step 5.1: CloudWatch Logs

**Enable CloudWatch logging in Elastic Beanstalk:**

```bash
eb config patabima-prod-env
```

Add to configuration:

```yaml
aws:elasticbeanstalk:cloudwatch:logs:
  StreamLogs: true
  DeleteOnTerminate: false
  RetentionInDays: 30
```

**View logs:**

```bash
# Stream live logs
eb logs patabima-prod-env --stream

# Download logs
eb logs patabima-prod-env --all
```

#### Step 5.2: CloudWatch Metrics & Alarms

**Create alarms for critical metrics:**

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name patabima-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:patabima-alerts

# RDS storage alarm
aws cloudwatch put-metric-alarm \
  --alarm-name patabima-low-db-storage \
  --alarm-description "Alert when DB storage < 20%" \
  --metric-name FreeStorageSpace \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 20000000000 \
  --comparison-operator LessThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:patabima-alerts
```

#### Step 5.3: Application Performance Monitoring

**Install AWS X-Ray for request tracing:**

```bash
# Add to requirements.txt
aws-xray-sdk==2.12.0
```

**Configure Django middleware:**

```python
# insurance-app/insurance/settings.py

MIDDLEWARE = [
    'aws_xray_sdk.ext.django.middleware.XRayMiddleware',
    # ... other middleware
]

# X-Ray configuration
XRAY_RECORDER = {
    'AWS_XRAY_DAEMON_ADDRESS': '127.0.0.1:2000',
    'AWS_XRAY_CONTEXT_MISSING': 'LOG_ERROR',
    'PLUGINS': ('EC2Plugin', 'ECSPlugin'),
    'SAMPLING': True,
}
```

---

## Migration Checklist

### Pre-Migration (Preparation)

- [ ] Audit current EC2 resources and dependencies
- [ ] Estimate AWS costs (RDS, S3, CloudFront, EB)
- [ ] Set up AWS IAM users and roles
- [ ] Create AWS budget alerts
- [ ] Backup current database and files
- [ ] Test migration process in staging environment

### Week 1: Database Migration

- [ ] Create RDS PostgreSQL instance
- [ ] Configure security groups and VPC
- [ ] Migrate database data from EC2 to RDS
- [ ] Verify data integrity
- [ ] Update Django settings for RDS connection
- [ ] Test database connectivity from local dev
- [ ] Enable automated backups and snapshots

### Week 2: Storage Migration

- [ ] Create S3 buckets (static, media, backups)
- [ ] Configure bucket policies and CORS
- [ ] Install django-storages and boto3
- [ ] Update Django settings for S3 storage
- [ ] Migrate existing static files to S3
- [ ] Migrate existing media files (uploads) to S3
- [ ] Create CloudFront distribution
- [ ] Update DNS records for CDN
- [ ] Test file uploads and downloads

### Week 3: Application Migration

- [ ] Create Elastic Beanstalk application
- [ ] Configure `.ebextensions/` for Django
- [ ] Set environment variables in EB
- [ ] Deploy Django app to EB
- [ ] Configure auto-scaling policies
- [ ] Set up Application Load Balancer
- [ ] Configure HTTPS with ACM certificate
- [ ] Test API endpoints and performance

### Week 4: CI/CD & Monitoring

- [ ] Set up GitHub Actions workflow
- [ ] Configure GitHub secrets
- [ ] Test automated deployment
- [ ] Enable CloudWatch logging
- [ ] Create CloudWatch alarms
- [ ] Set up SNS notifications
- [ ] Install AWS X-Ray for tracing
- [ ] Create monitoring dashboard

### Post-Migration

- [ ] Load testing with production traffic
- [ ] Monitor costs and optimize resources
- [ ] Document new deployment process
- [ ] Train team on EB and AWS services
- [ ] Decommission old EC2 instance
- [ ] Update disaster recovery plan

---

## Cost Estimation

### Monthly AWS Costs (Estimated)

| Service                       | Specification                                       | Monthly Cost (USD)       |
| ----------------------------- | --------------------------------------------------- | ------------------------ |
| **RDS PostgreSQL**            | db.t3.medium, 100GB, Multi-AZ                       | $120                     |
| **Elastic Beanstalk**         | 2x t3.medium instances                              | $120                     |
| **Application Load Balancer** | Standard ALB                                        | $23                      |
| **S3 Storage**                | 50GB static + 200GB media                           | $6                       |
| **S3 Requests**               | 1M PUT, 10M GET                                     | $5                       |
| **CloudFront**                | 500GB data transfer, 10M requests                   | $85                      |
| **CloudWatch Logs**           | 10GB ingestion, 30-day retention                    | $6                       |
| **Data Transfer**             | 500GB outbound                                      | $45                      |
| **Backups**                   | RDS snapshots + S3 backups                          | $15                      |
| **SNS (SMS)**                 | 1,500 SMS/month (Kenya)                             | $75                      |
| **SES (Email)**               | 5,000 emails/month                                  | FREE (62k free via EB)   |
| **Lambda**                    | Renewal reminders, M-PESA callbacks, PDF generation | FREE (1M free requests)  |
| **EventBridge**               | Daily/weekly schedules                              | FREE (14M events/month)  |
| **Textract**                  | 200 document scans/month                            | $3                       |
| **SQS**                       | Textract + PDF generation queues                    | FREE (1M requests/month) |
| **Total**                     |                                                     | **~$503/month**          |

**Cost Breakdown by Category:**

- **Infrastructure**: $120 (RDS) + $120 (EB) + $23 (ALB) = $263/month
- **Storage & CDN**: $6 (S3) + $85 (CloudFront) = $91/month
- **Data Transfer**: $5 (S3 requests) + $45 (outbound) = $50/month
- **Notifications**: $75 (SNS SMS) + $0 (SES email) = $75/month
- **Operations**: $6 (logs) + $15 (backups) + $3 (Textract) = $24/month

**Cost Optimization Tips:**

- Use Reserved Instances for predictable workloads (30-40% savings on RDS/EC2)
- Enable S3 Intelligent-Tiering for infrequently accessed files
- Set CloudFront cache TTL appropriately to reduce origin requests
- Use Auto Scaling to reduce instances during low traffic (night hours)
- Monitor unused resources with AWS Cost Explorer
- Consider SMS batching to reduce SNS costs (send daily digest instead of instant notifications)
- Use SES for marketing emails (free tier covers 62,000 emails/month via EB)

**Comparison with Current EC2 Setup:**

- **Current EC2**: ~$150/month (t3.medium + storage + data transfer)
- **New Hybrid Setup**: ~$503/month
- **Additional Cost**: ~$353/month
- **Value Added**: Auto-scaling, managed database, CDN, SMS/email services, document OCR, 99.95% uptime SLA

---

## Rollback Plan

### If Migration Fails

1. **Database Rollback**:

   ```bash
   # Switch Django back to EC2 database
   export RDS_HOSTNAME=localhost
   export RDS_PORT=5432
   sudo systemctl restart gunicorn
   ```

2. **Static Files Rollback**:

   ```bash
   # Serve static files from EC2 again
   python manage.py collectstatic --noinput
   sudo systemctl restart nginx
   ```

3. **Application Rollback**:

   ```bash
   # Terminate EB environment
   eb terminate patabima-prod-env

   # Redeploy to EC2
   git pull origin main
   sudo systemctl restart gunicorn
   ```

4. **DNS Rollback**:
   - Update DNS A record to point back to EC2 IP
   - Wait for DNS propagation (5-10 minutes)

---

## Best Practices

### Security

- ✅ Use IAM roles instead of access keys where possible
- ✅ Enable MFA for AWS root account
- ✅ Encrypt RDS database at rest
- ✅ Use AWS Secrets Manager for sensitive credentials
- ✅ Enable S3 bucket versioning to prevent accidental deletions
- ✅ Configure CloudFront signed URLs for private media files
- ✅ Use AWS WAF to protect against common attacks

### Performance

- ✅ Enable RDS performance insights
- ✅ Use CloudFront for global content delivery
- ✅ Configure Django connection pooling (CONN_MAX_AGE)
- ✅ Use Redis/ElastiCache for Django caching
- ✅ Optimize database queries (add indexes, use `select_related`)
- ✅ Enable gzip compression in Django middleware

### Reliability

- ✅ Deploy to Multi-AZ for high availability
- ✅ Configure health checks on Load Balancer
- ✅ Set up automated RDS backups (7-day retention)
- ✅ Enable S3 versioning for critical files
- ✅ Create CloudWatch alarms for key metrics
- ✅ Document runbooks for common incidents

### Cost Optimization

- ✅ Use Auto Scaling to match capacity with demand
- ✅ Schedule non-production environments to stop at night
- ✅ Use S3 Lifecycle policies to move old files to Glacier
- ✅ Enable CloudFront caching with appropriate TTLs
- ✅ Monitor costs with AWS Budgets
- ✅ Review Cost Explorer monthly for optimization opportunities

---

## Complete Migration Checklist

### Pre-Migration (Week 0)

- [ ] **AWS Account Setup**

  - [ ] Verify AWS account credentials and access
  - [ ] Create IAM roles for Elastic Beanstalk, Lambda, RDS
  - [ ] Set up billing alerts and budgets
  - [ ] Review current EC2 configuration and data inventory

- [ ] **Backup Current System**

  - [ ] Full PostgreSQL database dump
  - [ ] Backup static files and media uploads
  - [ ] Export environment variables from EC2
  - [ ] Document current Django settings
  - [ ] Save copy of nginx configuration

- [ ] **Code Preparation**
  - [ ] Install `django-storages` and `boto3` in requirements.txt
  - [ ] Create `.ebextensions/` directory with configuration files
  - [ ] Test S3 upload functionality locally
  - [ ] Update `settings.py` with environment-based configuration
  - [ ] Create CloudWatch log configuration

### Phase 1: Database Migration (Week 1)

- [ ] **RDS Setup**

  - [ ] Create RDS PostgreSQL instance (db.t3.medium, Multi-AZ)
  - [ ] Configure security groups (allow EB instances, restrict public)
  - [ ] Set up automated backups (7-day retention)
  - [ ] Configure maintenance window (Sunday 3am EAT)

- [ ] **Data Migration**

  - [ ] Export EC2 database with `pg_dump`
  - [ ] Upload backup to S3 for safekeeping
  - [ ] Import data to RDS with `pg_restore`
  - [ ] Verify row counts match (users, policies, quotations, claims)
  - [ ] Test database connections from local Django

- [ ] **Django Configuration**
  - [ ] Update `DATABASE_URL` environment variable
  - [ ] Run `python manage.py migrate` on RDS
  - [ ] Test admin login on RDS database
  - [ ] Verify API endpoints work with RDS

### Phase 2: S3 + CloudFront (Week 1-2)

- [ ] **S3 Bucket Setup**

  - [ ] Create `patabima-prod-static` bucket (public-read for static)
  - [ ] Create `patabima-prod-uploads` bucket (authenticated for media)
  - [ ] Configure bucket policies (static = public, media = authenticated)
  - [ ] Enable versioning on media bucket
  - [ ] Set up lifecycle policies (archive old files to Glacier after 1 year)

- [ ] **Django S3 Integration**

  - [ ] Install `django-storages==1.14` and `boto3==1.34.34`
  - [ ] Update `settings.py` with S3 storage backends
  - [ ] Run `python manage.py collectstatic` to upload static files
  - [ ] Test media uploads (policy documents, ID scans)
  - [ ] Verify S3 URLs work in admin and API responses

- [ ] **CloudFront Setup**

  - [ ] Create CloudFront distribution for static files
  - [ ] Create CloudFront distribution for media files
  - [ ] Configure cache behaviors (TTL: static=1 year, media=1 week)
  - [ ] Add custom domain (optional: static.patabima.com)
  - [ ] Update Django `STATIC_URL` and `MEDIA_URL` to CloudFront URLs

- [ ] **Verification**
  - [ ] Load admin dashboard (check CSS/JS loads from CloudFront)
  - [ ] Upload test policy document (check S3 storage)
  - [ ] Download policy PDF (check CloudFront CDN works)

### Phase 3: Elastic Beanstalk (Week 2-3)

- [ ] **EB Environment Setup**

  - [ ] Install EB CLI: `pip install awsebcli`
  - [ ] Initialize EB: `eb init patabima-prod`
  - [ ] Create environment: `eb create patabima-prod-env`
  - [ ] Configure instance type: t3.medium (2 instances minimum)
  - [ ] Set up Application Load Balancer
  - [ ] Configure auto-scaling (2-10 instances based on CPU)

- [ ] **Environment Variables**

  - [ ] `DATABASE_URL` - RDS connection string
  - [ ] `AWS_STORAGE_BUCKET_NAME` - S3 bucket name
  - [ ] `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
  - [ ] `DJANGO_SECRET_KEY` - production secret
  - [ ] `ALLOWED_HOSTS` - EB environment URL
  - [ ] `DEBUG=False` for production

- [ ] **Deploy Django Application**

  - [ ] Create `Procfile` for Gunicorn
  - [ ] Create `.ebextensions/01_packages.config` (install system deps)
  - [ ] Create `.ebextensions/02_django.config` (collectstatic, migrate)
  - [ ] Deploy: `eb deploy patabima-prod-env`
  - [ ] Monitor deployment: `eb health patabima-prod-env`

- [ ] **Verification**
  - [ ] Test health endpoint: `/api/health`
  - [ ] Test authentication: `/api/auth/login`
  - [ ] Test Motor 2 flow: create quote, get pricing, create policy
  - [ ] Test document upload: logbook scan with Textract
  - [ ] Test PDF generation: policy certificate creation

### Phase 4: SNS, SES, Lambda, EventBridge (Week 2-3)

- [ ] **Amazon SNS (SMS)**

  - [ ] Create SNS topic: `patabima-notifications`
  - [ ] Request Sender ID approval for Kenya: "PataBima"
  - [ ] Set monthly spending limit: $500
  - [ ] Create `aws_sns.py` service module
  - [ ] Update OTP sending to use SNS
  - [ ] Test SMS delivery to Kenyan number (+254...)

- [ ] **Amazon SES (Email)**

  - [ ] Verify domain: patabima.com (add DNS records)
  - [ ] Request production access (move from sandbox)
  - [ ] Create email templates (policy confirmation, renewal reminder)
  - [ ] Install `django-ses==3.5.2`
  - [ ] Update `EMAIL_BACKEND` to SES
  - [ ] Test email delivery (policy confirmation email)

- [ ] **Lambda Functions**

  - [ ] **Renewal Reminders Lambda**:

    - [ ] Create function: `patabima-renewal-reminders`
    - [ ] Configure RDS connection (environment variables)
    - [ ] Add EventBridge daily trigger (8am EAT = 5am UTC)
    - [ ] Test with sample expired policies

  - [ ] **M-PESA Callback Lambda**:

    - [ ] Create function: `patabima-mpesa-callback`
    - [ ] Create API Gateway endpoint for webhook
    - [ ] Configure callback signature validation
    - [ ] Test with M-PESA sandbox

  - [ ] **PDF Generation Lambda**:
    - [ ] Create SQS queue: `patabima-pdf-generation`
    - [ ] Create function: `patabima-pdf-generator`
    - [ ] Install ReportLab and dependencies
    - [ ] Update Django to queue PDF jobs instead of sync generation
    - [ ] Test async PDF generation flow

- [ ] **Textract Update**
  - [ ] Update Lambda environment variables (S3 bucket, Django URL)
  - [ ] Update Django `TEXTRACT_SQS_QUEUE_URL`
  - [ ] Create `.ebextensions/02_textract.config`
  - [ ] Test document upload → Textract → callback flow

### Phase 5: CI/CD Pipeline (Week 3)

- [ ] **GitHub Actions**

  - [ ] Create `.github/workflows/deploy-backend.yml`
  - [ ] Add GitHub secrets (AWS keys, Django secret)
  - [ ] Configure auto-deploy on `main` branch push
  - [ ] Test deployment by making code change

- [ ] **Deployment Verification**
  - [ ] Run Django tests before deploy
  - [ ] Check EB health after deploy
  - [ ] Verify zero-downtime deployment (rolling updates)

### Phase 6: Monitoring & Logging (Week 3-4)

- [ ] **CloudWatch Logs**

  - [ ] Enable EB log streaming to CloudWatch
  - [ ] Configure 30-day log retention
  - [ ] Set up log groups for Lambda functions
  - [ ] Test log queries (filter by error level)

- [ ] **CloudWatch Alarms**

  - [ ] RDS CPU > 80% alarm → email notification
  - [ ] RDS storage < 10GB alarm
  - [ ] EB instance count < 2 alarm
  - [ ] API error rate > 5% alarm
  - [ ] Lambda function errors alarm

- [ ] **Cost Monitoring**
  - [ ] Set up AWS Budget: $600/month
  - [ ] Enable cost anomaly detection
  - [ ] Subscribe to billing alerts

### Phase 7: Testing & Validation (Week 4)

- [ ] **Functional Testing**

  - [ ] User registration and OTP flow
  - [ ] Motor 2 quotation generation (all 60+ products)
  - [ ] Underwriter comparison and pricing calculations
  - [ ] Document upload and Textract extraction
  - [ ] Policy creation and PDF generation
  - [ ] M-PESA payment flow (sandbox)
  - [ ] Renewal reminders (trigger manually)
  - [ ] Claims submission

- [ ] **Performance Testing**

  - [ ] Load test with 100 concurrent users
  - [ ] Test auto-scaling (trigger CPU spike)
  - [ ] Measure API response times (< 500ms target)
  - [ ] Test CDN cache hit rate (> 80% target)

- [ ] **Security Testing**
  - [ ] Verify HTTPS enforcement
  - [ ] Test CORS configuration
  - [ ] Verify RDS security group (no public access)
  - [ ] Test JWT token expiration
  - [ ] Review IAM role permissions (least privilege)

### Phase 8: Go-Live Preparation (Week 4)

- [ ] **DNS Configuration**

  - [ ] Update DNS A record to point to EB Load Balancer
  - [ ] Configure SSL certificate (AWS Certificate Manager)
  - [ ] Test production domain: https://api.patabima.com

- [ ] **Data Sync** (if EC2 still running)

  - [ ] Final database sync from EC2 to RDS
  - [ ] Copy any new uploaded files to S3
  - [ ] Verify data integrity

- [ ] **Communication**
  - [ ] Notify team of migration schedule
  - [ ] Prepare rollback plan documentation
  - [ ] Schedule maintenance window (low traffic period)

### Post-Migration (Week 5+)

- [ ] **EC2 Decommissioning**

  - [ ] Verify all services running on EB/RDS/S3
  - [ ] Stop EC2 instance (keep for 1 week as backup)
  - [ ] Final database backup from EC2
  - [ ] Terminate EC2 instance after 1 week
  - [ ] Release Elastic IP

- [ ] **Optimization**

  - [ ] Review CloudWatch metrics for bottlenecks
  - [ ] Optimize database queries (add indexes if needed)
  - [ ] Fine-tune auto-scaling thresholds
  - [ ] Adjust CloudFront cache TTLs based on usage

- [ ] **Documentation**
  - [ ] Update README with new deployment instructions
  - [ ] Document EB deployment process
  - [ ] Create runbook for common incidents
  - [ ] Train team on AWS Console navigation

---

## Next Steps

1. **Week 1**: Migrate database to RDS, verify data integrity
2. **Week 2**: Set up S3 + CloudFront, migrate static/media files
3. **Week 3**: Deploy Django to Elastic Beanstalk, configure auto-scaling
4. **Week 4**: Implement CI/CD, monitoring, and alerts
5. **Week 5**: Load testing, optimization, and team training
6. **Week 6**: Decommission EC2, final documentation

---

## Support & Resources

### AWS Documentation

- [Elastic Beanstalk Django Tutorial](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create-deploy-python-django.html)
- [RDS PostgreSQL Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [S3 + Django Integration](https://django-storages.readthedocs.io/en/latest/backends/amazon-S3.html)
- [CloudFront Distribution Setup](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web.html)

### PataBima-Specific Considerations

- **Motor Insurance Policies**: Ensure policy PDF generation works with S3 storage
- **MPESA Integration**: Verify webhook endpoints are accessible through ALB
- **DPO Pay Gateway**: Configure allowed IPs for payment callbacks
- **Document Uploads**: Test ID scan uploads to S3 with proper ACLs
- **Admin Dashboard**: Ensure Django admin static files load from CloudFront
- **API Rate Limiting**: Configure AWS WAF or API Gateway for rate limits

---

**Migration Status**: ✅ Ready for execution
**Estimated Timeline**: 4-6 weeks
**Risk Level**: Medium (mitigated with rollback plan)
**Expected Benefits**: 99.9% uptime, auto-scaling, reduced maintenance, global CDN
