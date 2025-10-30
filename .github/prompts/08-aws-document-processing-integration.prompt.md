# 08 — AWS Document Processing Integration (S3 + Textract + Secure Pipeline)

This prompt consolidates and supersedes the following documents:

- aws-document-upload-textract-implementation.md
- aws-hybrid-document-processing-prompt.md
- aws-implementation-checklist.md
- aws-implementation-completed.md
- lambda-textract-processor.py

Deliver a production-grade, secure, and observable AWS-backed document processing pipeline for the PataBima app, aligned with Expo RN (SDK 53) and Django REST. Implement with least-privilege IAM, IaC-first, and clear environment isolation.

## Objectives

- Upload, store, and manage insurance documents securely in S3
- Extract structured data from documents via Textract (sync for small, async for large)
- Orchestrate via Lambda + SQS/SNS or Step Functions with retries and DLQs
- Expose clean REST endpoints for mobile/web; abstract clients behind service layer
- Provide robust observability (CloudWatch, traces, metrics) and admin tooling
- Ship a safe rollout plan with feature flags, canary, and reversible changes

## Architecture Overview

- Mobile Frontend (Expo RN):
  - Document picker (expo-document-picker)
  - Direct S3 upload via pre-signed URL (no AWS SDK in-app)
  - Polling or webhook-driven update for extraction status
- Backend (Django REST):
  - Endpoints for: presign upload, submit for extraction, check status, get results
  - Writes job records to PostgreSQL with states (UPLOADED → PROCESSING → DONE/FAILED)
  - Emits messages to SQS to trigger processing
- AWS Services:
  - S3 (private bucket, object-level KMS encryption)
  - SQS (standard queue for jobs; DLQ)
  - Lambda(s): Textract processor, post-processing, callback to API
  - Textract: AnalyzeDocument / StartDocumentAnalysis
  - SNS (optional): async completion notification
  - CloudWatch Logs + Metrics + Alarms
  - Parameter Store/Secrets Manager for config
- Optional: Step Functions for long-running orchestrations

## Data Contract

- UploadRequest → { filename, mimeType, sizeBytes, docType, agentId, quoteId? }
- PresignResponse → { uploadUrl, objectKey, headers, expiresInSec }
- SubmitExtraction → { objectKey, docType, correlationId }
- JobStatus → { jobId, state: UPLOADED|PROCESSING|DONE|FAILED, progress?, error? }
- ExtractionResult → { jobId, objectKey, docType, fields: Record<string, string|number>, rawJsonUrl?, confidenceScores? }

## Security & Compliance

- Buckets private by default; no public ACLs; Block Public Access
- SSE-KMS enforced; separate CMK per env
- Presigned URL scope: PUT only, 5–10 min expiry, content-length-range
- Input validation and size/mime limits
- IAM least privilege: function roles scoped to required actions
- PII handling: redact where needed; restrict logs; enable CloudTrail
- GDPR/DP regs: data retention policy, delete on request; S3 lifecycle rules

## Environment & Configuration

- Envs: dev, staging, prod (separate accounts or prefixes)
- Parameters:
  - S3_BUCKET, S3_PREFIX
  - KMS_KEY_ID
  - SQS_QUEUE_URL, DLQ_URL
  - DJANGO_API_URL, CALLBACK_SECRET
  - TEXTRACT_FEATURES: ["FORMS","TABLES"]
  - MAX_UPLOAD_MB per env
- Store in Parameter Store/Secrets Manager; load via IAM roles

## Django REST Endpoints

- POST /api/docs/presign
  - Auth required; validates filename/mime/size
  - Generates presigned PUT URL and objectKey: {env}/{agentId}/{yyyy}/{mm}/{uuid}/{slugified_filename}
- POST /api/docs/submit
  - Body: { objectKey, docType, correlationId? }
  - Creates Job row, enqueues SQS message
- GET /api/docs/status/:jobId
  - Returns state + progress/error
- GET /api/docs/result/:jobId
  - Returns normalized result and links

## Database Schema (simplified)

- documents
  - id, object_key, doc_type, agent_id, quote_id, size_bytes, mime, checksum, created_at
- extraction_jobs
  - id (uuid), object_key, state, engine (textract), correlation_id, attempts, last_error, created_at, updated_at, completed_at
- extraction_results
  - id, job_id (fk), fields (jsonb), raw_json_s3_key, confidence (jsonb)
- indexes for state and created_at

## AWS IaC (CloudFormation/CDK/Terraform)

- S3 bucket with:
  - block Public Access, bucket policy denies non-TLS
  - lifecycle: transition raw JSON to infrequent access after 30d, delete after 365d (configurable)
- KMS key with key policy for Lambda + API role
- SQS + DLQ; redrive policy; visibility timeout > max processing time
- Lambda(s):
  - textract-processor: reads SQS messages, calls Textract; writes results to S3 and callback to API
  - post-processor (optional): normalizes fields, applies mapping per docType
- IAM policies scoped to specific bucket/key prefixes and resources
- CloudWatch alarms for DLQ depth, Lambda errors, Textract throttles

## Lambda: Textract Processor (Node/Python)

- Handler responsibilities:

  1. Parse SQS message: { jobId, objectKey, docType, callbackUrl, callbackSecret }
  2. If small PDF/image → AnalyzeDocument sync; else StartDocumentAnalysis + poll or event-based completion
  3. Store raw Textract JSON under s3://bucket/results/{jobId}.json
  4. Normalize fields using mapping per docType; produce { fields, confidence }
  5. PUT callback to API: /api/docs/callback with HMAC signature header
  6. Update Job state on success/failure; respect retries with idempotency keys

- Pseudocode (Python, based on prior lambda-textract-processor.py):

```python
import boto3, json, os, hmac, hashlib, base64
s3 = boto3.client('s3')
textract = boto3.client('textract')

def handler(event, context):
    for record in event['Records']:
        msg = json.loads(record['body'])
        job_id = msg['jobId']
        bucket = os.environ['S3_BUCKET']
        key = msg['objectKey']
        try:
            # choose sync/async by size or flag
            resp = textract.analyze_document(
                Document={'S3Object': {'Bucket': bucket, 'Name': key}},
                FeatureTypes=['FORMS','TABLES']
            )
            # write raw
            s3.put_object(Bucket=bucket, Key=f"results/{job_id}.json", Body=json.dumps(resp))
            # normalize (domain-specific mapping)
            normalized = normalize(resp, msg.get('docType'))
            # callback
            post_callback(msg['callbackUrl'], { 'jobId': job_id, 'result': normalized }, os.environ['CALLBACK_SECRET'])
        except Exception as e:
            # raise to retry; DLQ if exceeded
            raise
```

## Django Callback Endpoint

- POST /api/docs/callback
  - Validates HMAC signature (shared secret)
  - Updates job state and stores results
  - Idempotent (jobId uniqueness, upsert semantics)

## Frontend Integration (Expo)

- No aws-amplify in app. Use presigned PUT flow:
  1. Request presign: send file meta to backend
  2. Upload with fetch PUT to S3 using presign headers
  3. Call submit to kick off extraction; get jobId
  4. Poll status endpoint or subscribe to in-app event channel
- Keep existing placeholder HybridDocumentService; add feature flag to switch to live service when enabled

## Error Handling & Retries

- SQS + Lambda automatic retries; DLQ for manual inspection
- Django endpoints return typed errors with codes (VALIDATION, AUTH, LIMIT, TEMPORARY)
- Client: exponential backoff on polling; max wait cap; user-visible states

## Observability & Ops

- Structured JSON logs (Lambda + Django)
- Metrics:
  - Job throughput, success rate, p95 latency
  - DLQ depth, retries, throttles
  - Extraction accuracy by docType
- Alarms: DLQ > 0, error rate > threshold
- Dashboards: CloudWatch widgets; optional S3 Athena for result analysis

## Testing Strategy

- Unit tests: mappers, validators, Django serializers/views
- Integration tests: presign → upload (mock) → submit → SQS → Lambda (localstack) → callback
- E2E smoke on staging with real Textract for 2-3 sample docs
- Security tests: presign abuse, over-size, mime spoofing, signature validation

## Rollout Plan

- Phase 0: Keep AWS disabled in app (current state) using placeholders
- Phase 1: Backend-only behind feature flag; run synthetic jobs
- Phase 2: Internal beta for a small agent cohort
- Phase 3: Gradual rollout; monitor; enable for all users
- Rollback: Disable flag; drain queue; preserve data

## Migration Notes (re-enable services)

- Replace placeholder services:
  - frontend/services/aws/AWSAuthService.js and AWSDataService.js → real implementations or remove if unused
  - frontend/services/HybridDocumentService.js and HybridTextractService.js → wire to presign/submit/status API
  - backend/aws/\* → ensure no direct aws-amplify in React Native bundle
- Confirm package.json and metro.config do not import aws-amplify on mobile
- Add .env handling and secrets provisioning per env

## Acceptance Criteria

- Users can upload a document and see extraction results within SLA
- No aws-amplify bundled in the app; mobile uses presigned URLs only
- Security controls verified (KMS, IAM, HMAC, private buckets)
- Observability in place with actionable alarms
- Tests pass and staging E2E succeeds

## Checklist (DoD)

- [ ] IaC applied: S3, KMS, SQS, Lambda, policies, alarms
- [ ] Django endpoints implemented + docs
- [ ] Lambda function deployed + mapping logic
- [ ] Frontend integrated with feature flag
- [ ] CI/CD updates and secrets stored
- [ ] Runbook for DLQ and failures
