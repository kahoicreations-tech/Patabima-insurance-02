# AWS Textract Document Processing - Deployment Guide

**Date:** October 2, 2025  
**Status:** Ready for Deployment

---

## Prerequisites

### 1. AWS CLI Configuration

Ensure AWS CLI is installed and configured:

```powershell
# Check AWS CLI installation
aws --version

# Configure AWS credentials (if not already done)
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: us-east-1
# - Default output format: json
```

### 2. S3 Bucket

Verify the S3 bucket exists:

```powershell
aws s3 ls s3://patabima-backend-dev-uploads --region us-east-1
```

If bucket doesn't exist, create it:

```powershell
aws s3 mb s3://patabima-backend-dev-uploads --region us-east-1
```

### 3. Generate Callback Secret

Generate a secure random secret for HMAC validation:

```powershell
# Generate a random 32-character secret
$secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Write-Host "Generated Callback Secret: $secret"
# Save this secret - you'll need it for both Lambda and Django
```

---

## Deployment Steps

### Step 1: Deploy AWS Infrastructure

Run the deployment script:

```powershell
cd "c:\Users\USER\Desktop\PATABIMA\PATABIMA FRONT\PATA BIMA AGENCY - Copy"

# Deploy with your callback secret
.\scripts\aws\deploy-textract.ps1 -CallbackSecret "YOUR_GENERATED_SECRET_HERE"
```

**What this does:**

1. ✅ Zips the Lambda function (`textract_processor.py`)
2. ✅ Uploads zip to S3: `s3://patabima-backend-dev-uploads/lambda/textract_processor-dev.zip`
3. ✅ Deploys CloudFormation stack: `patabima-textract-dev`
4. ✅ Creates:
   - SQS Queue: `patabima-textract-dev`
   - DLQ: `patabima-textract-dlq-dev`
   - Lambda Function: `patabima-textract-processor-dev`
   - IAM Role with necessary permissions
5. ✅ Configures Lambda trigger from SQS
6. ✅ Returns SQS Queue URL

**Expected Output:**

```
Zipping Lambda code...
Uploading code to s3://patabima-backend-dev-uploads/lambda/textract_processor-dev.zip
Deploying CloudFormation stack...
Done. SQS QueueUrl: https://sqs.us-east-1.amazonaws.com/XXXX/patabima-textract-dev
Set these in Django env and restart:
  SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/XXXX/patabima-textract-dev
  DOCS_MOCK_AWS=false
  DOCS_HMAC_SECRET=(same CallbackSecret)
  DJANGO_API_URL=http://10.0.2.2:8000
```

---

### Step 2: Configure Django Environment

Update `insurance-app/.env` with the outputs:

```bash
# S3 Configuration
S3_BUCKET=patabima-backend-dev-uploads
S3_PREFIX=patabima
AWS_REGION=us-east-1

# Results Storage
RESULTS_S3_BUCKET=patabima-backend-dev-uploads
RESULTS_S3_PREFIX=results
RESULTS_KEY_TEMPLATE=results/{jobId}.json

# SQS Configuration (from deployment output)
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/XXXX/patabima-textract-dev

# Callback Security (same secret used in deployment)
CALLBACK_SECRET=YOUR_GENERATED_SECRET_HERE

# Django API URL (for Lambda callbacks)
DJANGO_API_URL=http://YOUR_PUBLIC_IP:8000
# For local testing with Expo: http://10.0.2.2:8000
# For production: https://your-domain.com

# Presign Configuration
PRESIGN_EXPIRES_SEC=600
MAX_UPLOAD_MB=15

# Feature Flags
DOCS_MOCK_AWS=false
```

---

### Step 3: Restart Django Server

```bash
cd insurance-app

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate  # Windows

# Restart server
python manage.py runserver 0.0.0.0:8000
```

---

### Step 4: Configure Frontend (Optional)

Enable AWS docs pipeline in Expo config:

**File:** `app.json` or `.env`

```json
{
  "extra": {
    "docsPipelineEnabled": true
  }
}
```

Or set environment variable:

```bash
EXPO_PUBLIC_ENABLE_AWS_DOCS=true
```

---

## Verification & Testing

### Test 1: Check Lambda Deployment

```powershell
# List Lambda functions
aws lambda list-functions --region us-east-1 | ConvertFrom-Json | Select-Object -ExpandProperty Functions | Where-Object { $_.FunctionName -like "*textract*" }

# Get function details
aws lambda get-function --function-name patabima-textract-processor-dev --region us-east-1

# Check environment variables
aws lambda get-function-configuration --function-name patabima-textract-processor-dev --region us-east-1
```

### Test 2: Check SQS Queue

```powershell
# Get queue URL
aws sqs list-queues --region us-east-1 | ConvertFrom-Json | Select-Object -ExpandProperty QueueUrls | Where-Object { $_ -like "*textract*" }

# Get queue attributes
$queueUrl = "https://sqs.us-east-1.amazonaws.com/XXXX/patabima-textract-dev"
aws sqs get-queue-attributes --queue-url $queueUrl --attribute-names All --region us-east-1
```

### Test 3: End-to-End Document Upload

1. **Start Django Server:**

   ```bash
   cd insurance-app
   python manage.py runserver 0.0.0.0:8000
   ```

2. **Start Expo App:**

   ```bash
   cd frontend
   npm start
   ```

3. **Upload Document via Motor2 Flow:**

   - Navigate to Motor 2 Insurance
   - Complete vehicle details
   - Upload a document (logbook/ID)
   - Watch backend logs

4. **Check Backend Logs:**

   ```
   POST /api/v1/public_app/docs/presign → 200
   POST /api/v1/public_app/docs/submit → 200
   Docs pipeline: Sending SQS message to {queue_url}
   GET /api/v1/public_app/docs/status/{jobId} → state: PROCESSING
   ... (wait for Lambda processing)
   GET /api/v1/public_app/docs/status/{jobId} → state: DONE
   ```

5. **Check Lambda CloudWatch Logs:**

   ```powershell
   aws logs tail /aws/lambda/patabima-textract-processor-dev --follow --region us-east-1
   ```

   Expected logs:

   ```
   Processing job {jobId}: {objectKey}
   Textract completed for {jobId}
   Results saved to s3://patabima-backend-dev-uploads/results/{jobId}.json
   Callback posted to {django_url}
   ```

6. **Check S3 Results:**

   ```powershell
   # List results
   aws s3 ls s3://patabima-backend-dev-uploads/results/ --region us-east-1

   # Download a result
   aws s3 cp s3://patabima-backend-dev-uploads/results/{jobId}.json ./test-result.json --region us-east-1
   ```

---

## Troubleshooting

### Issue: CloudFormation Deployment Fails

**Check:**

```powershell
# View stack events
aws cloudformation describe-stack-events --stack-name patabima-textract-dev --region us-east-1 --max-items 20

# Check stack status
aws cloudformation describe-stacks --stack-name patabima-textract-dev --region us-east-1
```

**Common Fixes:**

- Ensure IAM permissions to create resources
- Check if stack already exists (delete and redeploy)
- Verify S3 bucket exists and is accessible

### Issue: Lambda Not Triggered

**Check SQS Trigger:**

```powershell
aws lambda list-event-source-mappings --function-name patabima-textract-processor-dev --region us-east-1
```

**Manually Send Test Message:**

```powershell
$queueUrl = "YOUR_QUEUE_URL"
$testMessage = @{
    jobId = "test-123"
    objectKey = "uploads/dev/test.jpg"
    docType = "national_id"
    callbackUrl = "http://10.0.2.2:8000/api/v1/public_app/docs/callback"
} | ConvertTo-Json

aws sqs send-message --queue-url $queueUrl --message-body $testMessage --region us-east-1
```

### Issue: Lambda Execution Errors

**Check CloudWatch Logs:**

```powershell
# Get latest log stream
aws logs describe-log-streams --log-group-name /aws/lambda/patabima-textract-processor-dev --order-by LastEventTime --descending --max-items 1 --region us-east-1

# View logs
aws logs tail /aws/lambda/patabima-textract-processor-dev --follow --region us-east-1
```

**Common Issues:**

- Textract permissions not granted
- S3 read/write permissions missing
- Invalid callback URL (not reachable from Lambda)

### Issue: Results Not Found in S3

**Check Lambda Writes:**

```powershell
# List all objects
aws s3 ls s3://patabima-backend-dev-uploads/ --recursive --region us-east-1 | Select-String "results"

# Check Lambda environment
aws lambda get-function-configuration --function-name patabima-textract-processor-dev --region us-east-1 | ConvertFrom-Json | Select-Object -ExpandProperty Environment
```

**Fix:** Ensure Lambda environment has:

- `S3_BUCKET=patabima-backend-dev-uploads`
- Correct IAM permissions to write to `results/*` prefix

---

## Monitoring

### CloudWatch Dashboard

Create a dashboard to monitor:

1. Lambda invocations
2. Lambda errors
3. Lambda duration
4. SQS messages sent/received
5. DLQ messages

### CloudWatch Alarms

Set up alarms for:

- Lambda error rate > 5%
- DLQ message count > 0
- Lambda duration > 50 seconds
- SQS age of oldest message > 5 minutes

---

## Cleanup (If Needed)

To remove all AWS resources:

```powershell
# Delete CloudFormation stack
aws cloudformation delete-stack --stack-name patabima-textract-dev --region us-east-1

# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name patabima-textract-dev --region us-east-1

# Delete Lambda code from S3
aws s3 rm s3://patabima-backend-dev-uploads/lambda/textract_processor-dev.zip --region us-east-1

# Delete results (optional)
aws s3 rm s3://patabima-backend-dev-uploads/results/ --recursive --region us-east-1
```

---

## Cost Estimation

### AWS Services Used:

1. **Lambda**

   - First 1M requests/month: Free
   - Additional: $0.20 per 1M requests
   - Duration: $0.0000166667 per GB-second

2. **Textract**

   - AnalyzeDocument: $1.50 per 1,000 pages
   - First 1M pages: $1.50 per 1,000 pages

3. **SQS**

   - First 1M requests/month: Free
   - Additional: $0.40 per 1M requests

4. **S3**
   - Storage: $0.023 per GB/month
   - PUT requests: $0.005 per 1,000 requests
   - GET requests: $0.0004 per 1,000 requests

**Estimated Monthly Cost (for 1,000 documents):**

- Lambda: ~$0.02
- Textract: ~$1.50
- SQS: Free (< 1M requests)
- S3: ~$0.05
- **Total: ~$1.60/month**

---

## Security Best Practices

1. **Rotate Secrets Regularly:**

   - Change `CALLBACK_SECRET` every 90 days
   - Update in both Lambda environment and Django .env

2. **Use IAM Policies:**

   - Principle of least privilege
   - Separate roles for dev/staging/prod

3. **Enable CloudTrail:**

   - Monitor API calls
   - Audit access patterns

4. **Encrypt at Rest:**

   - Enable S3 bucket encryption (already in stack)
   - Use KMS for sensitive data

5. **Network Security:**
   - Use VPC endpoints if possible
   - Restrict callback URL to known IPs

---

## Next Steps After Deployment

1. ✅ **Test with Real Documents**

   - Upload logbook
   - Upload national ID
   - Upload KRA PIN certificate

2. ✅ **Monitor Performance**

   - Check Lambda execution times
   - Monitor Textract accuracy
   - Track error rates

3. ✅ **Optimize Lambda**

   - Adjust memory/timeout if needed
   - Implement batch processing for multiple documents
   - Add retry logic for failed callbacks

4. ✅ **Deploy to Staging**

   - Run deployment with `-Env staging`
   - Test with staging data

5. ✅ **Production Deployment**
   - Run deployment with `-Env prod`
   - Update production environment variables
   - Monitor closely for first week

---

## Support & Documentation

- **CloudFormation Template:** `scripts/aws/textract-stack.yaml`
- **Lambda Function:** `scripts/aws/textract_processor.py`
- **Deployment Script:** `scripts/aws/deploy-textract.ps1`
- **Backend Integration:** `insurance-app/app/views_docs.py`
- **Frontend Service:** `frontend/services/HybridDocumentService.js`

**Troubleshooting Guide:** `docs/aws-docs-pipeline-runbook.md`  
**Setup Guide:** `insurance-app/TEXTRACT_SETUP.md`

---

**Deployment Status:** ⏳ Ready to Deploy  
**Estimated Time:** 5-10 minutes  
**Risk Level:** Low (non-breaking change, feature-flagged)
