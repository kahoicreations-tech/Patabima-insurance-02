# AWS Textract Lambda Deployment Guide

## Overview

This guide covers deploying the PataBima Textract document processing Lambda function to AWS. The Lambda function:

1. Receives document upload notifications via SQS
2. Calls AWS Textract to extract text/form data
3. Saves results to S3 for Django backend to retrieve
4. Optionally sends HTTP callback to Django

## Prerequisites

### 1. AWS Account Setup

- Active AWS account with billing enabled
- AWS CLI installed and configured with credentials
- Sufficient IAM permissions to create:
  - Lambda functions
  - IAM roles and policies
  - SQS queues
  - S3 buckets (or access to existing bucket)

### 2. AWS CLI Installation

**Windows (PowerShell):**

```powershell
# Install via MSI installer from https://aws.amazon.com/cli/
# Or via Chocolatey:
choco install awscli
```

**macOS:**

```bash
brew install awscli
```

**Linux:**

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### 3. AWS CLI Configuration

```bash
aws configure
```

Enter:

- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format: `json`

**Verify configuration:**

```bash
aws sts get-caller-identity
```

Should return your account ID and user ARN.

## Deployment Methods

### Method 1: Automated Deployment (Recommended)

#### Windows (PowerShell)

```powershell
cd C:\Users\USER\Desktop\PATABIMA01\aws-config\scripts

# Dry run (preview changes without applying)
.\deploy-textract-lambda.ps1 -DryRun

# Deploy to default region with existing bucket
.\deploy-textract-lambda.ps1

# Deploy to specific region with custom bucket
.\deploy-textract-lambda.ps1 -Region "eu-west-1" -S3Bucket "my-custom-bucket"

# Deploy with SQS queue creation
.\deploy-textract-lambda.ps1 -CreateQueue

# Full deployment with all options
.\deploy-textract-lambda.ps1 `
    -Region "us-east-1" `
    -S3Bucket "patabima-backend-dev-uploads" `
    -FunctionName "patabima-textract-processor" `
    -CreateQueue
```

#### Linux/macOS (Bash)

```bash
cd ~/PATABIMA01/aws-config/scripts

# Make script executable
chmod +x deploy-textract-lambda.sh

# Deploy with defaults
./deploy-textract-lambda.sh

# Deploy to specific region and bucket
./deploy-textract-lambda.sh us-east-1 patabima-backend-dev-uploads
```

### Method 2: Manual AWS Console Deployment

#### Step 1: Create IAM Role

1. Go to **IAM Console** → **Roles** → **Create role**
2. Select **Lambda** as trusted entity
3. Attach managed policies:
   - `AWSLambdaBasicExecutionRole` (for CloudWatch Logs)
   - `AmazonTextractFullAccess` (for Textract API)
4. Create inline policy for S3 and SQS:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::patabima-backend-dev-uploads/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "arn:aws:sqs:us-east-1:*:patabima-textract-queue"
    }
  ]
}
```

5. Name role: `PatabimaTextractLambdaRole`

#### Step 2: Create SQS Queue

1. Go to **SQS Console** → **Create queue**
2. Queue type: **Standard**
3. Name: `patabima-textract-queue`
4. Configuration:
   - Visibility timeout: **300 seconds** (match Lambda timeout)
   - Message retention: **4 days**
   - Receive message wait time: **0 seconds** (short polling)
5. Create queue
6. **Copy Queue URL** (needed for Django .env)

#### Step 3: Package Lambda Function

```bash
cd C:\Users\USER\Desktop\PATABIMA01\lambda_build

# Create package directory
mkdir package
cd package

# Copy Lambda source
cp ../lambda_textract.py lambda_function.py

# Create ZIP (boto3 included in Lambda runtime)
zip -r ../lambda_textract.zip .
# OR on Windows:
Compress-Archive -Path * -DestinationPath ..\lambda_textract.zip
```

#### Step 4: Create Lambda Function

1. Go to **Lambda Console** → **Create function**
2. Function name: `patabima-textract-processor`
3. Runtime: **Python 3.11**
4. Architecture: **x86_64**
5. Execution role: **Use existing role** → `PatabimaTextractLambdaRole`
6. Click **Create function**

#### Step 5: Upload Code

1. In function page, scroll to **Code** section
2. Click **Upload from** → **.zip file**
3. Upload `lambda_textract.zip`
4. Click **Save**

#### Step 6: Configure Function

1. Go to **Configuration** tab → **General configuration**
   - Timeout: **5 minutes** (300 seconds)
   - Memory: **512 MB**
2. Go to **Environment variables**

   - Add: `S3_BUCKET` = `patabima-backend-dev-uploads`
   - Add: `AWS_REGION` = `us-east-1`

3. Go to **Triggers** → **Add trigger**
   - Source: **SQS**
   - Queue: `patabima-textract-queue`
   - Batch size: **10**
   - Enable trigger: **Yes**

## Django Backend Configuration

After deploying the Lambda function, update your Django environment:

### 1. Update .env file

```bash
cd C:\Users\USER\Desktop\PATABIMA01\insurance-app
```

Edit `.env` (or create if missing):

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET=patabima-backend-dev-uploads

# SQS Queue URL (from SQS Console)
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/<account-id>/patabima-textract-queue

# Optional: Callback HMAC secret for security
CALLBACK_SECRET=your_random_secret_string_here

# Optional: Custom results location
RESULTS_S3_BUCKET=patabima-backend-dev-uploads
RESULTS_S3_PREFIX=textract-results
```

### 2. Restart Django Server

```bash
# Stop current server (Ctrl+C)

# Restart with new environment
.\venv\Scripts\Activate.ps1
python manage.py runserver 0.0.0.0:8000
```

## Testing the Deployment

### 1. Test Lambda Function Directly

**Via AWS Console:**

1. Go to Lambda Console → Select `patabima-textract-processor`
2. Click **Test** tab → **Create new event**
3. Event name: `test-document`
4. Event JSON:

```json
{
  "Records": [
    {
      "body": "{\"jobId\": \"test-123\", \"objectKey\": \"dev/agent-001/2025/11/test-logbook.jpg\", \"docType\": \"logbook\"}"
    }
  ]
}
```

5. Click **Test** → Check execution result

**Via AWS CLI:**

```bash
aws lambda invoke \
  --function-name patabima-textract-processor \
  --payload file://test-event.json \
  response.json

cat response.json
```

### 2. Test End-to-End Flow

1. **Upload document in PataBima app:**

   - Navigate to Motor 2 flow
   - Reach Documents step
   - Upload a logbook image

2. **Monitor Django logs:**

   ```
   [06/Nov/2025 00:40:00] "POST /api/v1/public_app/docs/presign HTTP/1.1" 200
   [06/Nov/2025 00:40:01] "POST /api/v1/public_app/docs/submit HTTP/1.1" 200
   Docs pipeline: SQS send successful
   ```

3. **Check CloudWatch Logs:**

   - Go to CloudWatch Console → Log groups
   - Find `/aws/lambda/patabima-textract-processor`
   - Look for:
     ```
     Lambda invoked with event: ...
     Processing job <job-id>
     Calling Textract for s3://...
     Textract completed successfully
     Results saved to s3://...
     ```

4. **Verify results in S3:**

   ```bash
   aws s3 ls s3://patabima-backend-dev-uploads/textract-results/
   ```

5. **Check app UI:**
   - Client Details form should auto-fill with extracted data
   - Console should show: `✅ Client form auto-filled from extracted data`

## Troubleshooting

### Lambda Errors

**Error: "Unable to import module 'lambda_function'"**

- **Cause:** Incorrect file name in ZIP
- **Fix:** Ensure Lambda source is renamed to `lambda_function.py` before zipping

**Error: "Task timed out after 3.00 seconds"**

- **Cause:** Default Lambda timeout too short for Textract
- **Fix:** Increase timeout to 300 seconds in Configuration

**Error: "An error occurred (AccessDeniedException) when calling Textract"**

- **Cause:** IAM role missing Textract permissions
- **Fix:** Add `textract:AnalyzeDocument` permission to role

### SQS Issues

**Messages stuck in queue (not being processed)**

- **Cause:** Lambda trigger not configured or disabled
- **Fix:** Check Triggers tab in Lambda console, ensure SQS trigger enabled

**Error: "Failed to send SQS message"**

- **Cause:** Invalid queue URL or permissions
- **Fix:** Verify `SQS_QUEUE_URL` in Django .env matches queue URL exactly

### S3 Access Issues

**Error: "Access Denied" when reading/writing S3**

- **Cause:** Bucket policy or IAM role missing permissions
- **Fix:** Add S3 permissions to Lambda role:
  ```json
  {
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:PutObject"],
    "Resource": "arn:aws:s3:::patabima-backend-dev-uploads/*"
  }
  ```

### Django Not Finding Results

**Status polling returns "UPLOADED" forever**

- **Cause:** Lambda not writing results or Django looking in wrong location
- **Fix:**
  1. Check Lambda CloudWatch logs for errors
  2. Verify `RESULTS_S3_PREFIX` matches Lambda result path
  3. Check S3 bucket for `textract-results/<job-id>.json`

**Console shows "No results found for job" warnings**

- **Cause:** Results written to different S3 path than expected
- **Fix:** Update `RESULTS_KEY_TEMPLATE` in Django .env:
  ```env
  RESULTS_KEY_TEMPLATE=textract-results/{jobId}.json
  ```

## Cost Estimation

### AWS Textract Pricing (us-east-1)

- **AnalyzeDocument (Forms):** $50 per 1,000 pages
- **First 1 million pages/month:** $1.50 per 1,000 pages

**Example:**

- 100 logbook uploads/day = 3,000/month
- Cost: 3 × $1.50 = **$4.50/month**

### Lambda Pricing

- **Requests:** $0.20 per 1 million requests
- **Compute:** $0.0000166667 per GB-second
- **512 MB, 30 seconds average:**
  - 3,000 requests × 30s × 0.5GB = 45,000 GB-seconds
  - Cost: 45,000 × $0.0000166667 = **$0.75/month**

### SQS Pricing

- **Standard queue:** $0.40 per 1 million requests
- **3,000 messages/month:** Effectively **free** (well under 1M)

### S3 Storage

- **Standard storage:** $0.023 per GB/month
- **Textract results:** ~50 KB per document
- **3,000 documents:** 150 MB = **$0.003/month**

**Total Estimated Cost: ~$5.25/month for 100 documents/day**

## Security Best Practices

1. **Enable encryption:**

   - S3: Server-side encryption (SSE-S3 or SSE-KMS)
   - SQS: Enable server-side encryption

2. **Use HMAC signatures:**

   - Set `CALLBACK_SECRET` in Django and Lambda env
   - Validates callback authenticity

3. **Restrict IAM permissions:**

   - Use least-privilege principle
   - Scope S3 permissions to specific bucket/prefix

4. **Enable CloudWatch Logs encryption:**

   ```bash
   aws logs associate-kms-key \
     --log-group-name /aws/lambda/patabima-textract-processor \
     --kms-key-id arn:aws:kms:region:account:key/key-id
   ```

5. **Use VPC for Lambda (optional):**
   - If Django backend in VPC, configure Lambda VPC access

## Monitoring and Alerts

### CloudWatch Alarms

**Lambda Errors:**

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name patabima-textract-errors \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=patabima-textract-processor
```

**SQS Dead Letter Queue:**

1. Create DLQ: `patabima-textract-dlq`
2. Configure main queue to send failed messages to DLQ after 3 retries
3. Set alarm on DLQ message count

### Dashboard

Create CloudWatch Dashboard:

- Lambda invocations (success/error)
- Lambda duration (avg/max)
- SQS messages sent/received
- Textract API calls

## Maintenance

### Updating Lambda Code

**Via Script:**

```powershell
.\deploy-textract-lambda.ps1 -SkipPackaging:$false
```

**Manually:**

```bash
cd lambda_build/package
# Update lambda_function.py
zip -r ../lambda_textract.zip .

aws lambda update-function-code \
  --function-name patabima-textract-processor \
  --zip-file fileb://../lambda_textract.zip
```

### Viewing Logs

```bash
# Recent logs
aws logs tail /aws/lambda/patabima-textract-processor --follow

# Specific time range
aws logs filter-log-events \
  --log-group-name /aws/lambda/patabima-textract-processor \
  --start-time $(date -u -d '1 hour ago' +%s)000
```

## Rollback Plan

If deployment fails or causes issues:

1. **Disable Lambda trigger:**

   ```bash
   aws lambda list-event-source-mappings \
     --function-name patabima-textract-processor \
     --query 'EventSourceMappings[0].UUID' --output text | \
     xargs -I {} aws lambda update-event-source-mapping \
       --uuid {} --enabled false
   ```

2. **Revert to previous version:**

   ```bash
   aws lambda update-function-code \
     --function-name patabima-textract-processor \
     --s3-bucket my-lambda-versions \
     --s3-key lambda_textract_v1.0.0.zip
   ```

3. **Disable feature in Django:**
   ```env
   # .env
   EXPO_PUBLIC_ENABLE_AWS_DOCS=false
   ```

## Next Steps

After successful deployment:

1. ✅ Lambda function deployed and tested
2. ✅ SQS queue created and configured
3. ✅ Django .env updated with SQS_QUEUE_URL
4. ✅ End-to-end test successful

**Proceed to:**

- Test in production with real documents
- Configure monitoring and alerts
- Set up DLQ for failed messages
- Implement retry logic in Django for timeout scenarios
- Add document type validation and enhancement

## Support

For issues or questions:

- Check CloudWatch Logs: `/aws/lambda/patabima-textract-processor`
- Review Django logs for SQS send errors
- Verify IAM permissions and S3 bucket access
- Test Lambda function directly in AWS Console
