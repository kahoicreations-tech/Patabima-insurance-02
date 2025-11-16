# S3 PDF Upload Implementation Status

**Date:** November 10, 2025  
**Status:** ⚠️ INFRASTRUCTURE IN PLACE - CONFIGURATION INCOMPLETE

---

## Executive Summary

The S3 PDF upload infrastructure is **implemented but NOT operational** due to missing AWS credentials and environment configuration. All code components are ready, but deployment requires AWS environment variable setup.

---

## What's Implemented ✅

### 1. Dependencies Installed

```txt
# requirements.txt
boto3==1.35.23        # AWS SDK for Python
reportlab==4.0.7      # PDF generation library
django-storages==1.14 # Django S3 storage backend
```

### 2. PDF Generation Service (`app/services/pdf_generator.py`)

**Complete Implementation:**

- ✅ `generate_motor_policy_pdf(policy)` - Full PDF document generator
- ✅ Uses ReportLab to create professional policy certificates
- ✅ Includes policy details, client info, vehicle info, premium breakdown
- ✅ PataBima branding and styling
- ✅ Returns S3 URL or None on failure

**Key Features:**

```python
def generate_motor_policy_pdf(policy):
    """
    Generate comprehensive PDF policy document for a motor insurance policy.

    Args:
        policy: MotorPolicy instance

    Returns:
        str: S3 URL of the generated PDF, or None if generation fails
    """
    # 1. Create PDF with ReportLab (A4 size, PataBima branding)
    # 2. Add policy details table (number, dates, status)
    # 3. Add client information section
    # 4. Add vehicle details section
    # 5. Add premium breakdown table (base, levies, total)
    # 6. Add underwriter information
    # 7. Add terms and conditions
    # 8. Upload to S3
    # 9. Return S3 URL
```

### 3. S3 Upload Function (`app/services/pdf_generator.py`)

**Complete Implementation:**

```python
def upload_pdf_to_s3(pdf_content, policy_number):
    """
    Upload generated PDF to AWS S3.

    Args:
        pdf_content (bytes): PDF file content
        policy_number (str): Policy number for filename

    Returns:
        str: S3 URL of uploaded file, or None if upload fails
    """
    try:
        import boto3
        from django.conf import settings

        # Check if S3 is configured
        if not hasattr(settings, 'AWS_STORAGE_BUCKET_NAME'):
            logger.warning("AWS S3 not configured - skipping upload")
            return None

        s3_client = boto3.client(
            's3',
            aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
            aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
            region_name=getattr(settings, 'AWS_S3_REGION_NAME', 'us-east-1')
        )

        bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        file_key = f"policies/{policy_number}/{policy_number}_certificate.pdf"

        # Upload to S3 with private ACL
        s3_client.put_object(
            Bucket=bucket_name,
            Key=file_key,
            Body=pdf_content,
            ContentType='application/pdf',
            ACL='private'
        )

        # Generate S3 URL
        s3_url = f"https://{bucket_name}.s3.amazonaws.com/{file_key}"

        logger.info(f"PDF uploaded to S3: {s3_url}")
        return s3_url

    except ImportError:
        logger.warning("boto3 not installed - skipping S3 upload")
        return None

    except Exception as e:
        logger.error(f"Error uploading PDF to S3: {e}")
        return None
```

**Upload Path Structure:**

```
S3_BUCKET/
├── policies/
│   ├── POL-2025-123456/
│   │   └── POL-2025-123456_certificate.pdf
│   ├── POL-2025-123457/
│   │   └── POL-2025-123457_certificate.pdf
│   └── ...
└── dmvic/
    └── certificates/
        ├── POL-2025-123456_A1020701.pdf
        └── ...
```

### 4. Django Settings Configuration (`insurance/settings.py`)

**S3 Configuration Structure:**

```python
# Lines 170-197
USE_S3_MEDIA = os.getenv('USE_S3_MEDIA', '0') in ('1', 'true', 'True')
AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME') or os.getenv('S3_BUCKET')
AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME') or os.getenv('AWS_REGION')
AWS_S3_CUSTOM_DOMAIN = os.getenv('AWS_S3_CUSTOM_DOMAIN') or (
    f"{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com"
)

if USE_S3_MEDIA and AWS_STORAGE_BUCKET_NAME:
    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }
    AWS_QUERYSTRING_AUTH = False
    AWS_S3_FILE_OVERWRITE = False
    # ACLs disabled - using bucket policy instead

    if AWS_S3_CUSTOM_DOMAIN:
        MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/"

# Credentials (lines 262-265)
# If not set, boto3 will use AWS CLI credentials or EC2 instance role
```

### 5. MotorPolicy Model Integration (`app/models.py`)

**Auto-Generation on Activation:**

```python
# Line 1155-1177
def _generate_policy_document(self):
    """Generate PDF certificate and policy schedule"""
    import logging
    logger = logging.getLogger(__name__)

    try:
        # Import PDF generator service
        from .services.pdf_generator import generate_motor_policy_pdf

        # Generate PDF and get S3 URL
        pdf_url = generate_motor_policy_pdf(self)

        if pdf_url:
            self.policy_document_url = pdf_url
            self.save(update_fields=['policy_document_url'])
            logger.info(f"Generated policy document for {self.policy_number}: {pdf_url}")
        else:
            logger.warning(f"PDF generation returned None for {self.policy_number}")

    except ImportError:
        logger.warning(f"PDF generator service not available - skipping document generation")
    except Exception as e:
        logger.error(f"Error generating policy document: {e}")
        # Don't raise - document generation failure shouldn't block activation
```

**Triggered by:**

- `MotorPolicy.activate_policy()` method (line 1132)
- Called when policy status changes to ACTIVE
- Non-blocking - policy activates even if PDF fails

### 6. DMVIC Certificate PDF Handling (`app/views/dmvic_views.py`)

**Current Implementation (lines 447-540):**

```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_certificate_pdf(request):
    """Get certificate PDF from DMVIC and optionally upload to S3"""
    # 1. Validate request (certificate_number or policy_id)
    # 2. Fetch PDF bytes from DMVIC API
    # 3. COMMENTED OUT: Upload to S3 (lines 494-500)
    # 4. Persist placeholder URL to policy
    # 5. Return base64 PDF data for immediate download
```

**Commented Out S3 Upload (lines 494-500):**

```python
# TODO: Upload to S3 and get URL
# For now, we'll store a placeholder URL that can be implemented later
# When S3 integration is ready, replace this with actual upload:
# from app.services.s3_service import upload_dmvic_certificate_pdf
# pdf_url = upload_dmvic_certificate_pdf(
#     pdf_data,
#     f"dmvic/certificates/{policy.policy_number}_{certificate_number}.pdf"
# )

# Placeholder for demonstration
pdf_url = f"/api/insurance/dmvic/certificates/{certificate_number}/download"
```

---

## What's Missing ❌

### 1. Environment Variables NOT Set

**Required `.env` Configuration:**

```bash
# AWS S3 Configuration
AWS_STORAGE_BUCKET_NAME=patabima-insurance-docs  # ❌ NOT SET
AWS_ACCESS_KEY_ID=AKIA...                         # ❌ NOT SET
AWS_SECRET_ACCESS_KEY=...                         # ❌ NOT SET
AWS_S3_REGION_NAME=us-east-1                      # ❌ NOT SET (defaults to us-east-1)
USE_S3_MEDIA=true                                 # ❌ NOT SET (defaults to false)
```

**Current State:**

- `settings.AWS_STORAGE_BUCKET_NAME` → Returns `None`
- `upload_pdf_to_s3()` → Returns `None` with warning log
- `policy.policy_document_url` → Remains `NULL` in database

### 2. S3 Bucket NOT Created

**Required AWS Resources:**

- ❌ S3 bucket (e.g., `patabima-insurance-docs`)
- ❌ Bucket policy for PataBima backend access
- ❌ IAM user/role with S3 permissions
- ❌ CORS configuration (if frontend needs direct access)

### 3. DMVIC S3 Service NOT Created

**Missing File:** `app/services/s3_service.py`

**Required Function:**

```python
def upload_dmvic_certificate_pdf(pdf_data: bytes, s3_key: str) -> str:
    """
    Upload DMVIC certificate PDF to S3.

    Args:
        pdf_data: PDF file bytes
        s3_key: S3 object key (e.g., "dmvic/certificates/POL-2025-123_A1020701.pdf")

    Returns:
        str: S3 URL or pre-signed URL
    """
    # Implementation needed
    pass
```

### 4. DMVIC View S3 Upload Commented Out

**File:** `app/views/dmvic_views.py` (lines 494-500)

- S3 upload code is COMMENTED OUT
- Using placeholder URL instead
- Needs to be uncommented and tested

---

## Current Behavior

### Policy PDF Generation Flow

```
MotorPolicy.activate_policy() called
   ↓
MotorPolicy._generate_policy_document()
   ↓
generate_motor_policy_pdf(policy)
   ├─ Create PDF with ReportLab ✅
   ├─ Generate 5-10 KB PDF content ✅
   └─ upload_pdf_to_s3(pdf_content, policy_number)
        ├─ Check settings.AWS_STORAGE_BUCKET_NAME
        ├─ Returns None (not configured) ❌
        └─ Log: "AWS S3 not configured - skipping upload"
   ↓
policy.policy_document_url = None ❌
Response: { "pdfUrl": null }
```

### DMVIC Certificate PDF Flow

```
Frontend: DjangoAPIService.dmvicGetCertificatePdf(policyId, certificateNumber)
   ↓
Backend: POST /api/dmvic/get-certificate-pdf/
   ↓
dmvic_service.get_certificate_pdf(certificate_number)
   ├─ Download from DMVIC API ✅
   └─ Returns PDF bytes (5-50 KB) ✅
   ↓
S3 Upload (COMMENTED OUT) ❌
Placeholder URL created:
   pdf_url = "/api/insurance/dmvic/certificates/A1020701/download"
   ↓
Policy updated:
   policy.dmvic_certificate_pdf_url = placeholder_url ✅
   policy.certificate_url = placeholder_url ✅
   ↓
Response:
{
  "success": true,
  "pdf_data": "JVBERi0xLjQKJeLjz9M...",  // base64 ✅
  "pdf_url": "/api/insurance/dmvic/certificates/A1020701/download",
  "filename": "DMVIC_A1020701.pdf",
  "note": "PDF URL persistence requires S3 integration"
}
   ↓
Frontend: Decodes base64, saves to device, shares with user ✅
```

---

## Implementation Checklist

### Phase 1: AWS Setup (DevOps/Infrastructure)

- [ ] **Create S3 Bucket**

  ```bash
  aws s3 mb s3://patabima-insurance-docs --region us-east-1
  ```

- [ ] **Create IAM Policy**

  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ],
        "Resource": [
          "arn:aws:s3:::patabima-insurance-docs/*",
          "arn:aws:s3:::patabima-insurance-docs"
        ]
      }
    ]
  }
  ```

- [ ] **Create IAM User or Role**

  - User: Create access keys for Django app
  - Role: For EC2/Lambda deployment (no keys needed)

- [ ] **Configure Bucket Policy**

  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "AllowBackendAccess",
        "Effect": "Allow",
        "Principal": {
          "AWS": "arn:aws:iam::ACCOUNT_ID:user/patabima-backend"
        },
        "Action": ["s3:PutObject", "s3:GetObject"],
        "Resource": "arn:aws:s3:::patabima-insurance-docs/*"
      }
    ]
  }
  ```

- [ ] **Set CORS (Optional - if frontend needs direct access)**
  ```json
  [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedOrigins": ["https://patabima.co.ke"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
  ```

### Phase 2: Environment Configuration

- [ ] **Update `.env` file**

  ```bash
  # Development
  AWS_STORAGE_BUCKET_NAME=patabima-insurance-docs
  AWS_ACCESS_KEY_ID=AKIA...
  AWS_SECRET_ACCESS_KEY=...
  AWS_S3_REGION_NAME=us-east-1
  USE_S3_MEDIA=true
  ```

- [ ] **Update EC2/Lambda Environment Variables**

  - For EC2: Add to `/etc/environment` or systemd service file
  - For Lambda: Use Lambda environment variables or AWS Secrets Manager

- [ ] **Verify Credentials**
  ```bash
  # Test AWS credentials
  aws s3 ls s3://patabima-insurance-docs --profile patabima
  ```

### Phase 3: Code Updates

- [ ] **Create `app/services/s3_service.py`**

  ```python
  import boto3
  import logging
  from django.conf import settings

  logger = logging.getLogger(__name__)

  def upload_dmvic_certificate_pdf(pdf_data: bytes, s3_key: str) -> str:
      """Upload DMVIC certificate PDF to S3"""
      try:
          s3_client = boto3.client(
              's3',
              aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
              aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
              region_name=settings.AWS_S3_REGION_NAME
          )

          bucket_name = settings.AWS_STORAGE_BUCKET_NAME

          s3_client.put_object(
              Bucket=bucket_name,
              Key=s3_key,
              Body=pdf_data,
              ContentType='application/pdf',
              ACL='private'
          )

          s3_url = f"https://{bucket_name}.s3.amazonaws.com/{s3_key}"
          logger.info(f"DMVIC certificate uploaded to S3: {s3_url}")

          return s3_url

      except Exception as e:
          logger.error(f"S3 upload failed: {e}")
          raise
  ```

- [ ] **Uncomment S3 Upload in `dmvic_views.py`** (lines 494-500)

  ```python
  # Replace placeholder with actual S3 upload
  from app.services.s3_service import upload_dmvic_certificate_pdf
  pdf_url = upload_dmvic_certificate_pdf(
      pdf_data,
      f"dmvic/certificates/{policy.policy_number}_{certificate_number}.pdf"
  )
  ```

- [ ] **Add Pre-signed URL Generator**
  ```python
  # In pdf_generator.py or s3_service.py
  def generate_presigned_url(s3_url, expiration=3600):
      """Generate pre-signed URL for secure PDF downloads"""
      # Implementation in pdf_generator.py lines 330-360 (already exists)
  ```

### Phase 4: Testing

- [ ] **Test Policy PDF Generation**

  ```bash
  # Django shell
  python manage.py shell

  from app.models import MotorPolicy
  policy = MotorPolicy.objects.filter(status='ACTIVE').first()
  policy._generate_policy_document()
  print(policy.policy_document_url)  # Should print S3 URL
  ```

- [ ] **Test DMVIC Certificate Upload**

  ```bash
  # API test
  curl -X POST http://localhost:8000/api/insurance/dmvic/get-certificate-pdf/ \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"policy_id": 123, "certificate_number": "A1020701"}'

  # Verify response includes S3 URL
  ```

- [ ] **Verify S3 Storage**

  ```bash
  # List uploaded files
  aws s3 ls s3://patabima-insurance-docs/policies/ --recursive
  aws s3 ls s3://patabima-insurance-docs/dmvic/certificates/ --recursive
  ```

- [ ] **Test Pre-signed URL Downloads**
  ```python
  from app.services.pdf_generator import generate_presigned_url
  url = generate_presigned_url(policy.policy_document_url, expiration=600)
  # URL should work for 10 minutes
  ```

### Phase 5: Monitoring & Optimization

- [ ] **Add CloudWatch Metrics**

  - S3 upload success/failure rate
  - PDF generation latency
  - S3 storage costs

- [ ] **Set Up S3 Lifecycle Policies**

  ```json
  {
    "Rules": [
      {
        "Id": "ArchiveOldPolicies",
        "Status": "Enabled",
        "Transitions": [
          {
            "Days": 90,
            "StorageClass": "STANDARD_IA"
          },
          {
            "Days": 365,
            "StorageClass": "GLACIER"
          }
        ]
      }
    ]
  }
  ```

- [ ] **Enable S3 Versioning**
  ```bash
  aws s3api put-bucket-versioning \
    --bucket patabima-insurance-docs \
    --versioning-configuration Status=Enabled
  ```

---

## Cost Estimation

### S3 Storage Costs (us-east-1)

**Assumptions:**

- 1,000 policies/month
- 50 KB per policy PDF
- 20 KB per DMVIC certificate PDF
- Total: 70 KB per policy

**Monthly Costs:**

```
Storage:
- 1,000 policies × 70 KB = 70 MB
- $0.023/GB/month × 0.07 GB = $0.0016/month

Requests:
- 1,000 PUT requests × $0.005/1000 = $0.005/month
- 5,000 GET requests × $0.0004/1000 = $0.002/month

Total: ~$0.01/month (negligible)
```

**Annual Costs (12,000 policies):**

```
Storage: 12,000 × 70 KB = 840 MB = $0.02/month
Requests: ~$0.10/month
Total: ~$0.12/month = $1.44/year
```

**Cost Optimization:**

- Use Standard-IA after 90 days: 50% savings
- Use Glacier after 1 year: 90% savings
- Enable S3 Intelligent-Tiering: Automatic optimization

---

## Security Considerations

### 1. Access Control

- ✅ Private ACL on all uploads
- ✅ Pre-signed URLs for temporary access
- ⚠️ IAM policy principle of least privilege
- ⚠️ Bucket policy restricts public access

### 2. Data Protection

- ✅ HTTPS-only access
- ⚠️ Server-side encryption (SSE-S3 or SSE-KMS)
- ⚠️ Versioning enabled for audit trail
- ⚠️ MFA delete for production bucket

### 3. Compliance

- ⚠️ Data residency requirements (Kenya insurance regulations)
- ⚠️ Retention policies (7 years for insurance documents)
- ⚠️ GDPR/data privacy considerations

---

## Troubleshooting

### Issue: "AWS S3 not configured - skipping upload"

**Cause:** `AWS_STORAGE_BUCKET_NAME` not set in environment

**Fix:**

```bash
# Add to .env
AWS_STORAGE_BUCKET_NAME=patabima-insurance-docs
USE_S3_MEDIA=true

# Restart Django
python manage.py runserver
```

### Issue: "boto3 not installed - skipping S3 upload"

**Cause:** boto3 package not in virtual environment

**Fix:**

```bash
pip install boto3==1.35.23
pip freeze > requirements.txt
```

### Issue: S3 upload fails with "Access Denied"

**Cause:** IAM credentials lack S3 permissions

**Fix:**

1. Verify IAM policy includes `s3:PutObject`
2. Check bucket policy allows backend IAM user
3. Test credentials: `aws s3 cp test.txt s3://patabima-insurance-docs/test.txt`

### Issue: Pre-signed URLs expire too quickly

**Cause:** Default expiration is 1 hour

**Fix:**

```python
# Extend expiration to 24 hours
url = generate_presigned_url(s3_url, expiration=86400)
```

---

## Deployment Recommendations

### Development Environment

- Use local boto3 with AWS CLI credentials
- Test with actual S3 bucket (separate from prod)
- Enable verbose logging for debugging

### Staging Environment

- Use IAM role for EC2 instance (no access keys)
- Configure S3 lifecycle policies
- Test pre-signed URL generation

### Production Environment

- **CRITICAL:** Use IAM role, NOT access keys
- Enable CloudWatch monitoring
- Set up S3 bucket replication (disaster recovery)
- Configure CloudFront CDN for faster downloads
- Enable S3 access logging for audit trail

---

## Conclusion

### Summary

✅ **Infrastructure Complete:** All code components for S3 PDF upload exist and are ready to use

❌ **Configuration Missing:** AWS credentials and bucket setup required

⏳ **Estimated Setup Time:** 1-2 hours (including AWS console work)

💰 **Cost Impact:** Negligible (~$2/year for 12,000 policies)

### Next Steps

1. **Immediate:** Set AWS environment variables
2. **Short-term:** Create S3 bucket with IAM policy
3. **Medium-term:** Uncomment DMVIC S3 upload code
4. **Long-term:** Implement CloudFront CDN, lifecycle policies

---

**Document Version:** 1.0  
**Last Updated:** November 10, 2025  
**Status:** S3 Infrastructure Ready - Awaiting Configuration ⚠️
