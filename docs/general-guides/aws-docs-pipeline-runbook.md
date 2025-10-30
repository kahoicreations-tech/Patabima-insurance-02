# AWS Docs Pipeline Runbook

This document summarizes the new document processing pipeline endpoints and required environment variables.

## Environment

Set these environment variables for the Django service (e.g., insurance-app/.env):

- S3_BUCKET=<your-bucket>
- S3_PREFIX=patabima
- KMS_KEY_ID=<kms-key-id or empty>
- SQS_QUEUE_URL=<sqs-queue-url>
- CALLBACK_SECRET=<shared-secret>
- DJANGO_API_URL=http://127.0.0.1:8000
- PRESIGN_EXPIRES_SEC=600
- MAX_UPLOAD_MB=15

For the Expo app (e.g., app.config or via env at build/run time):

- EXPO_PUBLIC_ENABLE_AWS_DOCS=true

## Endpoints (scoped under /api/v1/public_app)

- POST /docs/presign -> { uploadUrl, objectKey, headers, expiresInSec }
- POST /docs/submit -> { jobId, state }
- GET /docs/status/:jobId -> { jobId, state, error? }
- GET /docs/result/:jobId -> { jobId, objectKey, docType, fields, confidenceScores? }
- POST /docs/callback -> HMAC-validated callback from Lambda

## Smoke Test

1. Presign

Body:
{
"filename": "id.jpg",
"mimeType": "image/jpeg",
"sizeBytes": 1024,
"docType": "national_id"
}

2. Upload to S3 via PUT using uploadUrl, with Content-Type header from response.

3. Submit

Body:
{
"objectKey": "<from presign>",
"docType": "national_id"
}

4. Poll status then get result.

## Lambda

- Deploy scripts/aws/textract_processor.py as an SQS-triggered Lambda with permissions to Textract, S3 (bucket/key prefixes), and SQS.
- Provide environment:
  - S3_BUCKET, TEXTRACT_FEATURES, CALLBACK_SECRET
