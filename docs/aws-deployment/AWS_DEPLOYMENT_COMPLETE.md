# AWS Textract Deployment Complete

## Deployment Summary

✅ **CloudFormation Stack**: `patabima-textract-dev` successfully deployed
✅ **Lambda Function**: Textract processor uploaded and configured
✅ **SQS Queue**: Created and linked to Lambda trigger
✅ **Django Environment**: Updated with production values

## Deployed Resources

### CloudFormation Stack

- **Stack Name**: `patabima-textract-dev`
- **Region**: `us-east-1`
- **Status**: Successfully created/updated

### SQS Queue

- **Queue URL**: `https://sqs.us-east-1.amazonaws.com/313530061018/patabima-textract-dev`
- **Purpose**: Triggers Lambda function when documents are uploaded to S3

### Lambda Function

- **Code Location**: `s3://patabima-backend-dev-uploads/lambda/textract_processor-dev.zip`
- **Function**: Processes documents using AWS Textract and stores results in S3

## Django Environment Configuration

The following environment variables have been set in `insurance-app/.env`:

```env
# AWS Region
AWS_REGION=us-east-1

# S3 Configuration
S3_BUCKET=patabima-backend-dev-uploads
S3_PREFIX=uploads
RESULTS_S3_BUCKET=patabima-backend-dev-uploads
RESULTS_S3_PREFIX=results
RESULTS_KEY_TEMPLATE=results/{jobId}.json

# SQS Queue URL (from deployment)
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/313530061018/patabima-textract-dev

# Django API URL (for Lambda callbacks)
DJANGO_API_URL=http://10.0.2.2:8000

# Security Secrets (synchronized)
CALLBACK_SECRET=your-secure-callback-secret
DOCS_HMAC_SECRET=your-secure-callback-secret

# AWS Mock Mode (disabled for production)
DOCS_MOCK_AWS=false
```

## Next Steps

### 1. Restart Django Server

Restart your Django development server to load the new environment variables:

```bash
# Stop the current server (Ctrl+C if running)
cd insurance-app
python manage.py runserver
```

### 2. Test Document Upload Pipeline

Test the complete document upload and processing flow:

1. **Upload a document** through your React Native app
2. **Monitor the upload** - Should show success message
3. **Check S3 bucket** - Document should appear in `uploads/` folder
4. **Wait for processing** - Lambda triggered automatically via SQS
5. **Check results** - Processed results appear in `results/` folder
6. **Verify extraction** - Document data should be extracted and available in app

### 3. Monitor AWS Resources

#### Check Lambda Logs

```bash
aws logs tail /aws/lambda/patabima-textract-dev --follow
```

#### Check SQS Queue

```bash
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/313530061018/patabima-textract-dev \
  --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible
```

#### List S3 Bucket Contents

```bash
# Check uploaded documents
aws s3 ls s3://patabima-backend-dev-uploads/uploads/ --recursive

# Check processed results
aws s3 ls s3://patabima-backend-dev-uploads/results/ --recursive
```

### 4. Debugging Tips

If document processing fails:

1. **Check Django logs** for upload errors
2. **Check Lambda logs** in CloudWatch for processing errors
3. **Check SQS queue** for stuck messages
4. **Verify S3 permissions** - Lambda must have read/write access
5. **Verify HMAC secrets** match between Django and Lambda

#### Common Issues

**Issue**: Documents upload but don't get processed

- **Solution**: Check SQS queue has messages, verify Lambda trigger is configured

**Issue**: Lambda processes document but results don't appear

- **Solution**: Check Lambda has write permissions to S3 results bucket

**Issue**: HMAC signature verification fails

- **Solution**: Ensure `CALLBACK_SECRET` and `DOCS_HMAC_SECRET` match the deployment

## Production Deployment

For production deployment with a real domain:

1. **Update DJANGO_API_URL** to your production domain:

   ```env
   DJANGO_API_URL=https://api.yourdomain.com
   ```

2. **Generate a strong callback secret**:

   ```bash
   # Generate a secure random secret
   openssl rand -base64 32
   ```

3. **Redeploy with production environment**:

   ```bash
   cd scripts/aws
   .\deploy-textract.ps1 -Env prod -CallbackSecret "your-new-secure-secret"
   ```

4. **Update Django production .env** with the new values

## Security Notes

⚠️ **Important**: The current callback secret `your-secure-callback-secret` is a placeholder. For production:

1. Generate a cryptographically secure random secret
2. Never commit secrets to version control
3. Use environment-specific secrets for dev/staging/production
4. Rotate secrets regularly
5. Consider using AWS Secrets Manager for production secrets

## Architecture Overview

```
Mobile App (React Native)
    ↓ Upload Request
Django Backend (insurance-app)
    ↓ Generate Presigned URL
    ↓ Upload Document
S3 Bucket (patabima-backend-dev-uploads)
    ↓ ObjectCreated Event
SQS Queue (patabima-textract-dev)
    ↓ Trigger
Lambda Function (textract_processor)
    ↓ Process with Textract
    ↓ Store Results
S3 Bucket (results/{jobId}.json)
    ↓ Poll/Callback
Django Backend
    ↓ Return Extracted Data
Mobile App
```

## Cost Monitoring

Monitor your AWS usage to avoid unexpected charges:

- **Textract**: ~$1.50 per 1,000 pages processed
- **Lambda**: Free tier includes 1M requests/month
- **S3**: Free tier includes 5GB storage
- **SQS**: Free tier includes 1M requests/month

Set up AWS CloudWatch billing alarms to get notified of unexpected charges.

## Support

If you encounter issues:

1. Check the deployment logs in this conversation
2. Review AWS CloudWatch logs for Lambda errors
3. Check Django logs for upload/processing errors
4. Consult the deployment guides:
   - `AWS_TEXTRACT_DEPLOYMENT_GUIDE.md`
   - `insurance-app/TEXTRACT_SETUP.md`
   - `insurance-app/TEXTRACT_QUICKSTART.md`

---

**Deployment Date**: October 2, 2025
**Environment**: Development (`dev`)
**Status**: ✅ Complete and Ready for Testing
