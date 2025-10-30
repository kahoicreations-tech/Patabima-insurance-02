# AWS Textract Document Processing Setup Guide

## Overview

This guide sets up real AWS Textract for automatic document extraction in your PataBima insurance app.

## Architecture

```
Mobile App → Django (Presign S3) → S3 Upload → Lambda Textract → S3 Results → Django Polling
```

## Prerequisites

- AWS Account with Textract enabled in your region
- S3 bucket: `patabima-backend-dev-uploads` (already exists based on logs)
- IAM permissions for Django and Lambda

---

## Step 1: Set Backend Environment Variables

Add these to your Django `.env` file or environment:

```bash
# Required
AWS_REGION=us-east-1                                    # Your AWS region
S3_BUCKET=patabima-backend-dev-uploads                  # Bucket for uploads
S3_PREFIX=uploads                                        # Prefix for organized storage

# Optional: Use separate results location
RESULTS_S3_BUCKET=patabima-backend-dev-uploads          # Same or different bucket
RESULTS_S3_PREFIX=                                       # Leave empty or set to folder

# Optional: Custom result key pattern
# RESULTS_KEY_TEMPLATE=textract-results/{jobId}.json    # Override default

# Optional: SQS for faster processing (recommended)
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/YOUR_ACCOUNT/patabima-textract-queue

# Optional: Callback for instant completion (recommended)
DJANGO_API_URL=https://your-django-domain.com           # Or http://your-ip:8000 for dev
CALLBACK_SECRET=your-strong-random-secret-here          # For HMAC validation
```

After setting these, restart Django:

```bash
python manage.py runserver 0.0.0.0:8000
```

---

## Step 2: Create Lambda Function

### 2.1 Create Function

1. Go to AWS Lambda Console
2. Click "Create function"
3. Name: `patabima-textract-processor`
4. Runtime: **Python 3.11**
5. Architecture: x86_64
6. Execution role: Create new role with basic Lambda permissions

### 2.2 Lambda Code

Create `lambda_function.py`:

```python
import json
import boto3
import os
import urllib.parse
import hmac
import hashlib

textract = boto3.client('textract')
s3 = boto3.client('s3')

def lambda_handler(event, context):
    """
    Process document with Textract and save results to S3.
    Triggered by SQS message from Django.
    """
    print(f"Event: {json.dumps(event)}")

    # Parse SQS message
    for record in event.get('Records', []):
        try:
            body = json.loads(record['body'])
            job_id = body['jobId']
            object_key = body['objectKey']
            doc_type = body.get('docType', 'generic')
            callback_url = body.get('callbackUrl')

            print(f"Processing job {job_id}: {object_key}")

            # Extract bucket from object key or use default
            bucket = os.environ.get('S3_BUCKET', 'patabima-backend-dev-uploads')

            # Call Textract
            response = textract.analyze_document(
                Document={'S3Object': {'Bucket': bucket, 'Name': object_key}},
                FeatureTypes=['FORMS', 'TABLES']
            )

            print(f"Textract completed for {job_id}")

            # Save results to S3
            result_key = f"textract-results/{job_id}.json"
            s3.put_object(
                Bucket=bucket,
                Key=result_key,
                Body=json.dumps(response, default=str),
                ContentType='application/json'
            )

            print(f"Results saved to s3://{bucket}/{result_key}")

            # Optional: HTTP callback to Django
            if callback_url:
                try:
                    import urllib.request
                    payload = json.dumps({
                        'jobId': job_id,
                        'result': response
                    })

                    # HMAC signature
                    secret = os.environ.get('CALLBACK_SECRET', '')
                    if secret:
                        sig = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
                        headers = {
                            'Content-Type': 'application/json',
                            'X-PB-Signature': sig
                        }
                    else:
                        headers = {'Content-Type': 'application/json'}

                    req = urllib.request.Request(callback_url, data=payload.encode(), headers=headers, method='POST')
                    urllib.request.urlopen(req, timeout=10)
                    print(f"Callback sent to {callback_url}")
                except Exception as cb_err:
                    print(f"Callback failed: {cb_err}")

            return {'statusCode': 200, 'body': json.dumps({'jobId': job_id, 'status': 'completed'})}

        except Exception as e:
            print(f"Error processing record: {str(e)}")
            raise

```

### 2.3 Lambda Configuration

**Environment Variables:**

```
S3_BUCKET=patabima-backend-dev-uploads
CALLBACK_SECRET=your-strong-random-secret-here    # Same as Django
```

**Timeout:** 5 minutes (under Configuration → General)

**Memory:** 512 MB (adjust based on document sizes)

---

## Step 3: Set Up IAM Permissions

### 3.1 Lambda Execution Role

Attach this policy to your Lambda execution role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["textract:AnalyzeDocument", "textract:DetectDocumentText"],
      "Resource": "*"
    },
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
      "Resource": "arn:aws:sqs:us-east-1:YOUR_ACCOUNT:patabima-textract-queue"
    }
  ]
}
```

### 3.2 Django/Backend IAM

Your Django server (EC2/ECS/local with credentials) needs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::patabima-backend-dev-uploads/*"
    },
    {
      "Effect": "Allow",
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:us-east-1:YOUR_ACCOUNT:patabima-textract-queue"
    }
  ]
}
```

---

## Step 4: Create SQS Queue

1. Go to SQS Console
2. Create queue:

   - **Name:** `patabima-textract-queue`
   - **Type:** Standard
   - **Visibility timeout:** 5 minutes (match Lambda timeout)
   - **Message retention:** 4 days
   - **Receive message wait time:** 0 seconds

3. Create Dead Letter Queue (DLQ):

   - **Name:** `patabima-textract-dlq`
   - **Type:** Standard
   - Attach DLQ to main queue with max receives = 3

4. **Add Lambda Trigger:**
   - In SQS queue settings, add trigger → Select your Lambda
   - Batch size: 1
   - Enable trigger

---

## Step 5: Test the Pipeline

### 5.1 Restart Django

```bash
cd insurance-app
python manage.py runserver 0.0.0.0:8000
```

### 5.2 Upload a Document from Mobile App

1. Navigate to Motor Insurance → Documents
2. Upload a logbook or ID image
3. Watch Django logs for:
   ```
   POST /api/v1/public_app/docs/presign
   POST /api/v1/public_app/docs/submit
   ```

### 5.3 Monitor Processing

**Django logs should show:**

```
Docs pipeline: head_object missing or denied for s3://...  (initially)
# After Lambda completes:
GET /api/v1/public_app/docs/status/{jobId} → state: DONE
```

**Check Lambda CloudWatch Logs:**

- `Processing job {jobId}: {objectKey}`
- `Textract completed for {jobId}`
- `Results saved to s3://.../textract-results/{jobId}.json`

**Check S3:**

- Bucket: `patabima-backend-dev-uploads`
- Folder: `textract-results/`
- File: `{jobId}.json` should exist

---

## Step 6: Verify Extraction

### Frontend

The mobile app should:

1. Show "Processing…" progress bar
2. Automatically flip to "Document processed"
3. Display extracted fields in alert:
   ```
   registration_number ; KBZ999X
   owner_name ; John Doe
   chassis_number ; VIN123...
   ```
4. Show diagnostics panel with clarity and type match

### Backend

Query the database:

```python
from app.models import DocumentUpload
doc = DocumentUpload.objects.latest('date_created')
print(doc.processing_status)  # Should be 'DONE'
print(doc.extracted_data)      # Should show canonicalFields
```

---

## Troubleshooting

### Documents Stuck in PROCESSING

**Check 1:** SQS Queue

- Go to SQS Console → Messages available > 0?
- If yes, Lambda trigger may be disabled or failing

**Check 2:** Lambda Logs

- CloudWatch → Log Groups → `/aws/lambda/patabima-textract-processor`
- Look for errors in latest log stream

**Check 3:** S3 Results Path
Your Django logs show which paths it's checking. Lambda writes to:

```
textract-results/{jobId}.json
```

Set backend env:

```bash
RESULTS_KEY_TEMPLATE=textract-results/{jobId}.json
```

**Check 4:** IAM Permissions

- Lambda can read from S3 uploads folder?
- Lambda can write to S3 results folder?
- Django can read from S3 results folder?

### Textract Errors

**Error: Document too large**

- Textract limit: 10 MB for synchronous, 500 MB for async
- Solution: Add file size validation in presign view

**Error: Unsupported format**

- Textract supports: PDF, PNG, JPEG, TIFF
- Check `mimeType` in presign request

**Error: Access Denied**

- Lambda role missing `textract:AnalyzeDocument`
- Add Textract permissions to execution role

---

## Alternative: S3 Event Trigger (No SQS)

If you prefer S3 events over SQS:

1. **Remove SQS** from Lambda trigger
2. **Add S3 Event Notification:**
   - S3 → Properties → Event notifications
   - Event: `s3:ObjectCreated:*`
   - Prefix: `uploads/`
   - Destination: Lambda function
3. **Update Lambda to parse S3 event:**

```python
def lambda_handler(event, context):
    for record in event.get('Records', []):
        bucket = record['s3']['bucket']['name']
        key = urllib.parse.unquote_plus(record['s3']['object']['key'])
        # Extract jobId from key pattern
        # ... rest of processing
```

---

## Production Recommendations

1. **Use callback** for instant completion (set `DJANGO_API_URL` and `CALLBACK_SECRET`)
2. **Enable SQS DLQ** to catch failed jobs
3. **Monitor Lambda metrics** (duration, errors, throttles)
4. **Set up CloudWatch alarms** for Textract errors
5. **Add retry logic** in Django for transient S3 failures
6. **Implement async job cleanup** (archive old results after 30 days)

---

## Summary

✅ **Django env set** (AWS_REGION, S3_BUCKET, RESULTS_KEY_TEMPLATE, SQS_QUEUE_URL)  
✅ **Lambda created** with Textract permissions  
✅ **SQS queue created** with Lambda trigger  
✅ **IAM roles configured** for Django and Lambda  
✅ **Pipeline tested** end-to-end

Your PataBima app now has real AWS Textract document extraction!
