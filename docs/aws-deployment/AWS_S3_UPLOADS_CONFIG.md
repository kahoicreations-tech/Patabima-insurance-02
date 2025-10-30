# PataBima S3 Uploads – Configuration Cheat Sheet

This doc summarizes the recommended setup for secure presigned uploads used by Claims and Motor2 document flows.

## Environment variables (Django)

- S3_BUCKET: Name of your uploads bucket
- AWS_REGION: e.g., us-east-1
- PRESIGN_EXPIRES_SEC: (optional) default 600
- KMS_KEY_ID: (optional) KMS key ID; if set, presigned uploads will require SSE-KMS
- S3_PREFIX: (optional) shared prefix for doc uploads (used by views_docs)
- ENV: dev | staging | prod (used in key paths)

## IAM (signer principal)

Attach `claims-signer-inline-policy.json` to the IAM role/user your Django app runs as.

- PutObject on:
  - arn:aws:s3:::${PATABIMA_UPLOADS_BUCKET}/claims/\*
  - arn:aws:s3:::${PATABIMA_UPLOADS_BUCKET}/dev/_, /staging/_, /prod/\*
  - arn:aws:s3:::${PATABIMA_UPLOADS_BUCKET}/${PATABIMA_S3_PREFIX}/\* (optional)
- If using SSE-KMS, allow kms:Encrypt/GenerateDataKey/DescribeKey on your KMS key

## Bucket policy (defense-in-depth)

Use `s3-bucket-policy-uploads.json` to enforce:

- HTTPS only (deny aws:SecureTransport = false)
- Server-side encryption (AES256 or aws:kms)
- If KMS, enforce the exact key ARN

Replace placeholders and apply via AWS Console or CLI.

## CORS

Apply `s3-cors-uploads.json` with your frontend origins.

- AllowedMethods: POST, PUT, GET, HEAD
- AllowedHeaders: \*
- ExposeHeaders: ETag, x-amz-request-id, x-amz-id-2, x-amz-server-side-encryption, x-amz-version-id

## Code paths

- Claims presign: `insurance-app/app/views/claims.py` uses S3 POST with enforced SSE
- Motor2/doc presign: `insurance-app/app/views_docs.py` uses S3 PUT with AES256 or KMS

## Verification

- Try a small PNG/PDF; ensure 200 on POST/PUT and object has SSE in its metadata
- If presign fails, check env vars and IAM permissions
