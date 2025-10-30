# AWS Textract Lambda Fixed - Deployment Complete

## Issue Diagnosed

The AWS Textract document processing pipeline was deployed successfully, but the Lambda function was failing to process documents. After investigation, we found:

### Root Cause

- **Lambda Import Error**: The Lambda function had an old deployment package that couldn't import `textract_processor` module
- **Test Result**: 17 messages ended up in the dead letter queue due to repeated failures
- **Callback Timeout**: Lambda times out when trying to callback to `http://10.0.2.2:8000` (Android emulator localhost address)

## Solution Applied

### 1. Lambda Code Update

```bash
aws lambda update-function-code \
  --function-name patabima-textract-processor-dev \
  --s3-bucket patabima-backend-dev-uploads \
  --s3-key lambda/textract_processor-dev.zip
```

### 2. Test Results

✅ **Lambda Import**: Fixed - module now imports correctly  
✅ **Textract Processing**: Works - documents are analyzed successfully  
✅ **S3 Results Storage**: Works - results saved to `results/{jobId}.json`  
⚠️ **Callback**: Times out (expected in dev) - Lambda can't reach Android emulator localhost

### 3. Dead Letter Queue Cleanup

Purged 17 failed messages from the DLQ to start fresh.

## Current Architecture

```
Mobile App Upload
    ↓
Django Backend (Presigned URL)
    ↓
S3 Upload (uploads/dev/...)
    ↓
Django sends SQS message
    ↓
SQS Queue (patabima-textract-dev)
    ↓ Lambda Event Source Mapping
Lambda Function (textract_processor)
    ├─→ Textract Analysis
    ├─→ Store results/
{jobId}.json in S3
    └─→ Callback (times out in dev)
    ↓
Django Polls S3 for results
    ↓
Return extracted data to app
```

## How Document Processing Works Now

### Upload Flow (Already Working)

1. User uploads document in app
2. Django generates presigned S3 URL
3. App uploads directly to S3
4. Django sends SQS message with job details

### Processing Flow (Now Fixed)

5. SQS triggers Lambda automatically
6. Lambda downloads document from S3
7. Lambda calls AWS Textract to analyze document
8. Lambda stores raw results in `s3://patabima-backend-dev-uploads/results/{jobId}.json`
9. Lambda attempts callback (times out in dev environment)

### Retrieval Flow (Existing Django Logic)

10. Django `/api/v1/public_app/docs/status/{jobId}` endpoint polls S3 for results
11. Django tries multiple path patterns:
    - `results/{jobId}.json`
    - `results/results/{jobId}.json`
    - `results/textract/results/{jobId}.json`
    - etc.
12. When found, Django returns extracted data to app

## Testing the Fixed Pipeline

### Upload a New Document

From your React Native app:

1. Go to Motor Insurance flow
2. Select a category and subcategory
3. Complete pricing comparison
4. Upload documents (logbook, ID, KRA PIN)
5. Wait 10-30 seconds for processing
6. Check document status

### Expected Behavior

**Immediately after upload:**

```
POST /api/v1/public_app/docs/presign - 200 OK
POST /api/v1/public_app/docs/submit - 200 OK
```

**Status polling (every 2-5 seconds):**

```
GET /api/v1/public_app/docs/status/{jobId} - 200 OK
Response: {"status": "processing"}
```

**After Lambda processes (10-30 seconds):**

```
GET /api/v1/public_app/docs/status/{jobId} - 200 OK
Response: {
  "status": "completed",
  "result": {
    "fields": { ... extracted data ... },
    "confidence": 0.95
  }
}
```

### Monitor Processing in Real-Time

#### Watch Lambda Logs

```bash
aws logs tail /aws/lambda/patabima-textract-processor-dev --follow
```

#### Check SQS Queue Status

```bash
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/313530061018/patabima-textract-dev \
  --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible
```

#### List Processed Results in S3

```bash
aws s3 ls s3://patabima-backend-dev-uploads/results/ --recursive
```

#### Check Dead Letter Queue (should stay at 0)

```bash
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/313530061018/patabima-textract-dlq-dev \
  --attribute-names ApproximateNumberOfMessages
```

## Development vs Production Differences

### Development Environment (Current)

- **Callback URL**: `http://10.0.2.2:8000` (Android emulator localhost)
- **Callback Result**: Times out (Lambda can't reach it)
- **Workaround**: Django polls S3 for results
- **Performance**: Slight delay due to polling interval

### Production Environment (Future)

- **Callback URL**: `https://api.yourdomain.com`
- **Callback Result**: Success (Lambda can reach public URL)
- **Method**: Real-time callback notifications
- **Performance**: Instant updates when processing completes

## Cost Monitoring

Current usage in development is well within AWS free tier:

- **Textract**: ~$1.50 per 1,000 pages
- **Lambda**: 1M requests/month free, then $0.20 per 1M
- **S3**: 5GB storage free, 20,000 GET requests free
- **SQS**: 1M requests/month free

## Troubleshooting

### Documents Not Processing

**Check 1: Are messages reaching SQS?**

```bash
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/313530061018/patabima-textract-dev \
  --attribute-names ApproximateNumberOfMessages
```

- If 0: Django isn't sending messages (check `SQS_QUEUE_URL` in `.env`)
- If >0: Messages are queued but Lambda isn't processing them

**Check 2: Is Lambda being triggered?**

```bash
aws lambda get-event-source-mapping --uuid 5d52435f-32a4-445a-ac1f-8cecf54fce88
```

- State should be "Enabled"
- If "Disabled": Run `aws lambda update-event-source-mapping --uuid ... --enabled`

**Check 3: Are there errors?**

```bash
aws logs tail /aws/lambda/patabima-textract-processor-dev --follow
```

- Look for error messages
- Check for timeout errors (increase Lambda timeout if needed)

**Check 4: Check dead letter queue**

```bash
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/313530061018/patabima-textract-dlq-dev \
  --attribute-names ApproximateNumberOfMessages
```

- If >0: Lambda is failing repeatedly
- Use `aws sqs receive-message` to inspect failed messages

### Django Not Finding Results

Django tries multiple S3 paths. If results aren't found:

**Check where Lambda stored the result:**

```bash
aws s3 ls s3://patabima-backend-dev-uploads/results/ --recursive
```

**Verify the path matches Django's expectations:**
Lambda stores at: `results/{jobId}.json`  
Django checks: `results/{jobId}.json` (primary path) ✅

If mismatch, update either:

- Lambda code to change storage path
- Django code to add more path patterns

## Production Deployment Checklist

When deploying to production:

- [ ] Generate secure callback secret: `openssl rand -base64 32`
- [ ] Update `.env` with production values:
  - `DJANGO_API_URL=https://api.yourdomain.com`
  - `CALLBACK_SECRET=<generated-secret>`
  - `DOCS_HMAC_SECRET=<same-as-callback-secret>`
- [ ] Deploy CloudFormation stack with prod environment:
  ```bash
  cd scripts/aws
  .\deploy-textract.ps1 -Env prod -CallbackSecret "<your-secret>"
  ```
- [ ] Update Django production `.env` with new SQS queue URL
- [ ] Restart Django production server
- [ ] Test document upload end-to-end
- [ ] Monitor Lambda logs for any errors
- [ ] Set up CloudWatch alarms for Lambda errors
- [ ] Set up billing alerts for unexpected AWS charges

## Summary

✅ **Lambda Function**: Fixed and working  
✅ **Textract Processing**: Analyzing documents successfully  
✅ **S3 Results Storage**: Storing results in correct location  
✅ **Django Integration**: Polling S3 for results (works in dev)  
⚠️ **Callback**: Times out in dev (expected, will work in production)  
✅ **Dead Letter Queue**: Cleaned up and monitoring  
✅ **Documentation**: Complete deployment and troubleshooting guide

**Status**: System is fully operational for development testing. Upload documents in the app and they will be processed automatically!

---

**Deployment Date**: October 2, 2025  
**Environment**: Development (`dev`)  
**Lambda Function**: `patabima-textract-processor-dev`  
**SQS Queue**: `patabima-textract-dev`  
**S3 Bucket**: `patabima-backend-dev-uploads`
