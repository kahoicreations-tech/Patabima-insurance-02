# AWS Textract Lambda Deployment Summary

## ✅ Deployment Completed Successfully

**Date:** November 6, 2025  
**AWS Account:** 313530061018  
**Region:** us-east-1

---

## Resources Created

### 1. IAM Role

- **Name:** `PatabimaTextractLambdaRole`
- **ARN:** `arn:aws:iam::313530061018:role/PatabimaTextractLambdaRole`
- **Permissions:**
  - CloudWatch Logs (create log groups/streams, write logs)
  - S3 Read/Write on `patabima-backend-dev-uploads/*`
  - AWS Textract (AnalyzeDocument, DetectDocumentText)
  - SQS Read/Delete on `patabima-textract-queue`

### 2. SQS Queue

- **Name:** `patabima-textract-queue`
- **URL:** `https://sqs.us-east-1.amazonaws.com/313530061018/patabima-textract-queue`
- **ARN:** `arn:aws:sqs:us-east-1:313530061018:patabima-textract-queue`
- **Configuration:**
  - Visibility Timeout: 900 seconds (15 minutes)
  - Message Retention: 4 days
  - Queue Type: Standard

### 3. Lambda Function

- **Name:** `patabima-textract-processor`
- **ARN:** `arn:aws:lambda:us-east-1:313530061018:function:patabima-textract-processor`
- **Runtime:** Python 3.11
- **Handler:** `lambda_function.lambda_handler`
- **Timeout:** 300 seconds (5 minutes)
- **Memory:** 512 MB
- **Environment Variables:**
  - `S3_BUCKET=patabima-backend-dev-uploads`

### 4. Event Source Mapping

- **UUID:** `5e93e56e-7564-44fb-8476-4f9783f7bc6d`
- **Source:** SQS Queue (`patabima-textract-queue`)
- **Batch Size:** 10 messages
- **Status:** Creating (will be Enabled shortly)

---

## Django Configuration Updated

**File:** `insurance-app/.env`

```env
AWS_REGION=us-east-1
S3_BUCKET=patabima-backend-dev-uploads
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/313530061018/patabima-textract-queue
AWS_ACCOUNT_ID=313530061018
```

---

## How It Works

### Document Processing Flow

1. **User uploads document** in PataBima app (Step 5 - Documents)
2. **Frontend calls** `POST /api/v1/public_app/docs/presign`

   - Django generates presigned S3 URL
   - Returns upload URL + object key

3. **Frontend uploads** document directly to S3

   - Uses presigned URL (no backend proxy)
   - Faster upload, reduces Django load

4. **Frontend calls** `POST /api/v1/public_app/docs/submit`

   - Django creates `DocumentUpload` record (status: PROCESSING)
   - Sends message to SQS queue:
     ```json
     {
       "jobId": "uuid-of-document",
       "objectKey": "dev/agent-id/2025/11/filename.jpg",
       "docType": "logbook",
       "callbackUrl": "https://your-domain.com/api/v1/public_app/docs/callback"
     }
     ```

5. **Lambda function triggered** by SQS message

   - Reads document from S3
   - Calls AWS Textract AnalyzeDocument
   - Extracts form fields (key-value pairs)
   - Saves results to S3: `textract-results/{jobId}.json`

6. **Frontend polls** `GET /api/v1/public_app/docs/status/{jobId}`

   - Django checks `DocumentUpload.processing_status`
   - If still PROCESSING, checks S3 for results file
   - If results found, updates status to DONE
   - Returns: `{"state": "DONE"}`

7. **Frontend fetches** `GET /api/v1/public_app/docs/result/{jobId}`

   - Django returns extracted canonical fields:
     ```json
     {
       "fields": {
         "owner_name": "JOHN DOE",
         "registration_number": "KDA234H",
         "chassis_number": "ABC123XYZ",
         "make": "TOYOTA",
         "model": "COROLLA"
       }
     }
     ```

8. **Frontend auto-fills** client form
   - `EnhancedClientForm` receives `extractedData` prop
   - Maps fields: `owner_name` → `first_name` + `last_name`
   - User sees pre-filled form, can edit if needed

---

## Testing the Integration

### 1. Verify Lambda Deployment

```powershell
aws lambda get-function --function-name patabima-textract-processor --region us-east-1
```

### 2. Check SQS Queue Status

```powershell
aws sqs get-queue-url --queue-name patabima-textract-queue --region us-east-1
```

### 3. Verify Event Source Mapping

```powershell
aws lambda list-event-source-mappings --function-name patabima-textract-processor --region us-east-1
```

Expected output: `"State": "Enabled"`

### 4. Test End-to-End

1. **Restart Django server:**

   ```bash
   cd C:\Users\USER\Desktop\PATABIMA01\insurance-app
   .\venv\Scripts\Activate.ps1
   python manage.py runserver 0.0.0.0:8000
   ```

2. **Upload document in app:**

   - Navigate to Motor 2 flow
   - Reach Step 5 (Documents)
   - Upload logbook image

3. **Monitor Django logs** for:

   ```
   [06/Nov/2025 00:XX:XX] "POST /api/v1/public_app/docs/presign HTTP/1.1" 200
   [06/Nov/2025 00:XX:XX] "POST /api/v1/public_app/docs/submit HTTP/1.1" 200
   Docs pipeline: SQS send successful
   [06/Nov/2025 00:XX:XX] "GET /api/v1/public_app/docs/status/{jobId} HTTP/1.1" 200
   ✅ Docs pipeline: Found results at s3://...
   ```

4. **Check CloudWatch Logs:**

   ```powershell
   aws logs tail /aws/lambda/patabima-textract-processor --follow
   ```

5. **Verify S3 results:**

   ```powershell
   aws s3 ls s3://patabima-backend-dev-uploads/textract-results/ --recursive
   ```

6. **Check Client Form:**
   - Step 6 (Client Details) should show auto-filled fields
   - Console log: `✅ Client form auto-filled from extracted data`

---

## Troubleshooting

### Lambda Not Triggering

**Check Event Source Mapping Status:**

```powershell
aws lambda get-event-source-mapping --uuid 5e93e56e-7564-44fb-8476-4f9783f7bc6d
```

If `"State": "Creating"`, wait 1-2 minutes for AWS to enable it.

**If still not working:**

```powershell
# Update to ensure it's enabled
aws lambda update-event-source-mapping --uuid 5e93e56e-7564-44fb-8476-4f9783f7bc6d --enabled
```

### SQS Messages Not Being Consumed

**Check queue for messages:**

```powershell
aws sqs get-queue-attributes --queue-url https://sqs.us-east-1.amazonaws.com/313530061018/patabima-textract-queue --attribute-names ApproximateNumberOfMessages,ApproximateNumberOfMessagesNotVisible
```

**Manually receive message:**

```powershell
aws sqs receive-message --queue-url https://sqs.us-east-1.amazonaws.com/313530061018/patabima-textract-queue --max-number-of-messages 1
```

### Lambda Errors

**View recent errors:**

```powershell
aws logs filter-log-events --log-group-name /aws/lambda/patabima-textract-processor --filter-pattern "ERROR" --max-items 10
```

**Common errors:**

- **"Unable to import module"** → Check ZIP package structure
- **"Access Denied (S3)"** → Verify IAM role has S3 permissions
- **"Access Denied (Textract)"** → Add Textract permissions to role

### Django Not Finding Results

**Check S3 for results file:**

```powershell
aws s3 ls s3://patabima-backend-dev-uploads/textract-results/ --recursive --human-readable
```

**If file exists but Django not finding it:**

- Verify `.env` has correct `S3_BUCKET` and `AWS_REGION`
- Check Django logs for "No results found for job" warnings
- Ensure AWS credentials in Django `.env` match deployed resources

---

## Next Steps

### 1. Monitor CloudWatch Metrics

Create dashboard to track:

- Lambda invocations (success/failure)
- Lambda duration and errors
- SQS messages (sent/received/deleted)
- Textract API calls and costs

### 2. Set Up Alerts

**Lambda Errors:**

```powershell
aws cloudwatch put-metric-alarm --alarm-name patabima-textract-errors --metric-name Errors --namespace AWS/Lambda --statistic Sum --period 300 --evaluation-periods 1 --threshold 5 --comparison-operator GreaterThanThreshold --dimensions Name=FunctionName,Value=patabima-textract-processor
```

**SQS Dead Letter Queue:**

- Create DLQ for failed messages
- Set alarm on DLQ message count

### 3. Production Optimizations

- [ ] Add callback HMAC secret for security
- [ ] Enable S3 server-side encryption
- [ ] Configure Lambda VPC access (if needed)
- [ ] Set up Lambda versioning and aliases
- [ ] Implement retry logic with exponential backoff
- [ ] Add CloudWatch dashboard

### 4. Cost Optimization

**Current estimates (100 docs/day):**

- Textract: ~$4.50/month
- Lambda: ~$0.75/month
- SQS: <$0.01/month
- S3 storage: ~$0.003/month
- **Total: ~$5.25/month**

**To reduce costs:**

- Use S3 lifecycle policies to archive old results
- Optimize Lambda memory allocation
- Batch process during off-peak hours

---

## Deployment Commands Reference

### Deploy/Update Lambda

```powershell
cd C:\Users\USER\Desktop\PATABIMA01\aws-config\scripts
.\deploy-textract-lambda.ps1 -CreateQueue
```

### View Lambda Logs

```powershell
aws logs tail /aws/lambda/patabima-textract-processor --follow
```

### Check Queue Status

```powershell
aws sqs get-queue-attributes --queue-url https://sqs.us-east-1.amazonaws.com/313530061018/patabima-textract-queue --attribute-names All
```

### Test Lambda Manually

```powershell
aws lambda invoke --function-name patabima-textract-processor --payload file://test-event.json response.json --region us-east-1
```

---

## Rollback Procedure

If issues occur:

1. **Disable Lambda trigger:**

   ```powershell
   aws lambda update-event-source-mapping --uuid 5e93e56e-7564-44fb-8476-4f9783f7bc6d --enabled false
   ```

2. **Revert Django .env:**

   ```env
   SQS_QUEUE_URL=  # Leave empty to skip SQS sending
   ```

3. **Delete Lambda (if needed):**
   ```powershell
   aws lambda delete-function --function-name patabima-textract-processor
   ```

---

## Support Resources

- **CloudWatch Logs:** `/aws/lambda/patabima-textract-processor`
- **S3 Results Location:** `s3://patabima-backend-dev-uploads/textract-results/`
- **SQS Console:** https://console.aws.amazon.com/sqs/v2/home?region=us-east-1#/queues
- **Lambda Console:** https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/patabima-textract-processor

---

**Status:** ✅ **DEPLOYED AND READY TO TEST**

Upload a logbook document in the Motor 2 flow to test the complete integration!
