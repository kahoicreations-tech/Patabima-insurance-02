import boto3
import os
import uuid
import json
from typing import Any
from botocore.config import Config
from django.utils.text import slugify
from django.utils.timezone import now
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

# Document types that support Textract auto-extraction (logbook only)
EXTRACTABLE_DOC_TYPES = {"logbook", "vehicle_logbook", "rc"}

# All allowed document types for upload
ALLOWED_DOC_TYPES = {"logbook", "vehicle_logbook", "rc", "national_id", "id_copy", "kra_pin", "kra", "generic"}


def _boto_session(region: str):
    """Create a boto3 Session, optionally using AWS_PROFILE.

    This helps local/dev setups where the default shared-credentials profile
    does not have permission to PUT into the uploads bucket.
    """
    profile = os.environ.get('AWS_PROFILE')
    if not profile:
        return boto3.Session(region_name=region)
    try:
        return boto3.Session(profile_name=profile, region_name=region)
    except Exception as e:
        print(f"[AWS] Failed to use AWS_PROFILE={profile!r}: {e}")
        return boto3.Session(region_name=region)


def _build_docs_object_key(user_id: str, filename: str) -> str:
        """Build an S3 object key compatible with existing bucket policies and tooling.

        Historically we stored uploads under:
            {S3_PREFIX}/{ENV}/{userId}/{YYYY}/{MM}/{uuid}/{slugifiedFilename}
        """
        env_prefix = os.environ.get('ENV', 'dev')
        ts = now()
        uid = uuid.uuid4()
        safe_name = slugify(filename) or 'document'
        key = f"{env_prefix}/{user_id}/{ts.strftime('%Y')}/{ts.strftime('%m')}/{uid}/{safe_name}"
        s3_prefix = (os.environ.get('S3_PREFIX') or 'uploads').strip().strip('/')
        return f"{s3_prefix}/{key}" if s3_prefix else key

def _get_s3_client():
    """Lazy-load S3 client to avoid initialization errors"""
    try:
        region = (
            os.environ.get('S3_REGION')
            or os.environ.get('AWS_REGION')
            or os.environ.get('AWS_DEFAULT_REGION')
            or 'us-east-1'
        )
        # Force SigV4. SigV2-style presigns often break with modern bucket policies
        # and will not include X-Amz-* query params (frontend logs showed SignedHeaders missing).
        cfg = Config(signature_version='s3v4')
        session = _boto_session(region)
        return session.client('s3', region_name=region, config=cfg)
    except Exception as e:
        print(f"[AWS] Failed to initialize S3 client: {e}")
        return None

def _get_bucket_sse_defaults(s3_client, bucket_name: str) -> tuple[str | None, str | None]:
    """Best-effort detection of the bucket's default SSE settings.

    Returns (sse_algorithm, kms_key_id). Both may be None if not detected.
    """
    try:
        enc = s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = (enc or {}).get('ServerSideEncryptionConfiguration', {}).get('Rules', [])
        if not rules:
            return (None, None)
        by_default = rules[0].get('ApplyServerSideEncryptionByDefault', {})
        algo = by_default.get('SSEAlgorithm')
        kms_key = by_default.get('KMSMasterKeyID') or by_default.get('KMSMasterKeyId')
        return (algo, kms_key)
    except Exception:
        return (None, None)

def _get_sqs_client():
    """Lazy-load SQS client to avoid initialization errors"""
    try:
        region = os.environ.get('AWS_REGION', 'us-east-1')
        session = _boto_session(region)
        return session.client('sqs', region_name=region)
    except Exception as e:
        print(f"[AWS] Failed to initialize SQS client: {e}")
        return None

def _env_int(name: str, default: int) -> int:
    try:
        v = os.environ.get(name)
        return int(v) if v is not None and str(v).strip() != '' else default
    except Exception:
        return default

def _normalize_doc_type(dt: str | None) -> str:
    if not dt:
        return "generic"
    s = str(dt).strip().lower()
    # Map common aliases to canonical keys
    if s in {"vehicle logbook", "vehicle_logbook", "rc"}:
        return "logbook"
    if s in {"national_id", "id_copy", "id"}:
        return "id_copy"
    if s in {"kra_pin", "kra"}:
        return "kra_pin"
    return s

def _is_extractable(doc_type: str) -> bool:
    """Check if document type supports Textract extraction"""
    return doc_type in EXTRACTABLE_DOC_TYPES

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_presigned_url(request):
    """
    Generate a pre-signed URL for uploading a document to S3.
    Accepts all document types, but only logbook will be extracted.
    """
    try:
        # Check AWS configuration
        s3_client = _get_s3_client()
        if not s3_client:
            return Response({
                'error': 'AWS S3 not configured. Document upload unavailable.',
                'code': 'AWS_NOT_CONFIGURED'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        file_name = request.data.get('filename')
        file_type = request.data.get('fileType') or request.data.get('mimeType') or request.data.get('contentType')
        size_bytes = request.data.get('sizeBytes')
        doc_type = request.data.get('docType') or request.data.get('documentType') or "generic"
        norm_doc_type = _normalize_doc_type(doc_type)
        
        if not file_name or not file_type:
            return Response({'error': 'filename and fileType are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce upload size limit (defaults to 15MB)
        max_mb = _env_int('MAX_UPLOAD_MB', 15)
        try:
            size_int = int(size_bytes) if size_bytes is not None else None
        except Exception:
            size_int = None
        if size_int is not None:
            if size_int <= 0 or size_int > (max_mb * 1024 * 1024):
                return Response({
                    'error': f'invalid file size; max {max_mb}MB',
                    'code': 'FILE_SIZE_INVALID'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Accept all document types for upload
        if norm_doc_type not in ALLOWED_DOC_TYPES:
            # Default to generic if unknown type
            norm_doc_type = "generic"

        bucket_name = os.environ.get('S3_BUCKET')
        if not bucket_name:
            return Response({
                'error': 'S3 bucket not configured',
                'code': 'S3_BUCKET_MISSING'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # Match the existing key layout used by the docs pipeline + bucket policies.
        # (Many buckets are locked down by prefix; changing this causes AccessDenied.)
        user_id = str(getattr(request.user, 'id', 'unknown'))
        object_key = _build_docs_object_key(user_id, file_name)

        # Bucket policies commonly require server-side encryption.
        # Decide what to sign in this order:
        # 1) Explicit env override (S3_SSE_ALGO / S3_UPLOAD_SSE)
        # 2) Bucket default encryption (get_bucket_encryption)
        # 3) KMS key env (KMS_KEY_ID / AWS_KMS_KEY_ID)
        # 4) Fallback to AES256
        sse_override = (os.environ.get('S3_SSE_ALGO') or os.environ.get('S3_UPLOAD_SSE') or '').strip()
        kms_key_id = (os.environ.get('KMS_KEY_ID') or os.environ.get('AWS_KMS_KEY_ID') or '').strip() or None

        detected_algo, detected_kms = _get_bucket_sse_defaults(s3_client, bucket_name)
        if not kms_key_id and detected_kms:
            kms_key_id = detected_kms

        if sse_override:
            sse_algo = sse_override
        elif detected_algo:
            sse_algo = detected_algo
        elif kms_key_id:
            sse_algo = 'aws:kms'
        else:
            sse_algo = 'AES256'

        put_params: dict[str, Any] = {
            'Bucket': bucket_name,
            'Key': object_key,
            'ContentType': file_type,
            'ServerSideEncryption': sse_algo,
        }
        # Only include a KMS key id if using aws:kms
        if kms_key_id and sse_algo == 'aws:kms':
            put_params['SSEKMSKeyId'] = kms_key_id

        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params=put_params,
            ExpiresIn=3600
        )

        headers = {
            'Content-Type': file_type,
            'x-amz-server-side-encryption': sse_algo,
        }
        if kms_key_id and sse_algo == 'aws:kms':
            headers['x-amz-server-side-encryption-aws-kms-key-id'] = kms_key_id
        
        # Indicate if this document type supports extraction
        supports_extraction = _is_extractable(norm_doc_type)
        
        return Response({
            'uploadUrl': presigned_url, 
            'objectKey': object_key,
            'docType': norm_doc_type,
            'supportsExtraction': supports_extraction,
            'headers': headers,
        })

    except Exception as e:
        print(f"[generate_presigned_url] Error: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_extraction_job(request):
    """
    Submit a document for Textract extraction.
    Only processes logbook documents - other types return success without extraction.
    """
    try:
        object_key = request.data.get('objectKey')
        doc_type = request.data.get('docType') or request.data.get('documentType') or "generic"
        norm_doc_type = _normalize_doc_type(doc_type)
        mime_type = request.data.get('mimeType') or request.data.get('fileType') or request.data.get('contentType')
        size_bytes = request.data.get('sizeBytes')
        
        if not object_key:
            return Response({'error': 'objectKey is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Verification step BEFORE Textract enqueue
        # Ensure the object exists in S3 and matches expected size/type (when provided).
        s3_client = _get_s3_client()
        if not s3_client:
            return Response({
                'error': 'AWS S3 not configured. Document verification unavailable.',
                'code': 'AWS_NOT_CONFIGURED'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        bucket_name = os.environ.get('S3_BUCKET')
        if not bucket_name:
            return Response({
                'error': 'S3 bucket not configured',
                'code': 'S3_BUCKET_MISSING'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            head = s3_client.head_object(Bucket=bucket_name, Key=object_key)
        except Exception as e:
            return Response({
                'error': f'Uploaded file not found in S3: {e}',
                'code': 'S3_OBJECT_NOT_FOUND'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Optional checks
        try:
            expected_size = int(size_bytes) if size_bytes is not None else None
        except Exception:
            expected_size = None
        actual_size = head.get('ContentLength')
        actual_type = head.get('ContentType')
        if expected_size is not None and actual_size is not None and int(actual_size) != int(expected_size):
            return Response({
                'error': 'Uploaded file size mismatch. Please re-upload.',
                'code': 'S3_SIZE_MISMATCH',
                'expected': expected_size,
                'actual': actual_size,
            }, status=status.HTTP_400_BAD_REQUEST)
        if mime_type and actual_type and str(actual_type).lower() != str(mime_type).lower():
            return Response({
                'error': 'Uploaded file type mismatch. Please re-upload.',
                'code': 'S3_TYPE_MISMATCH',
                'expected': mime_type,
                'actual': actual_type,
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if document type supports extraction
        if not _is_extractable(norm_doc_type):
            # Non-extractable documents (ID, KRA) - return success without processing
            return Response({
                'jobId': f'skip-{uuid.uuid4()}',
                'status': 'uploaded',
                'message': f'{norm_doc_type.upper()} uploaded successfully. Extraction not applicable for this document type.',
                'supportsExtraction': False,
                'docType': norm_doc_type
            })

        # Logbook - proceed with Textract extraction
        # Check SQS configuration
        sqs_client = _get_sqs_client()
        if not sqs_client:
            return Response({
                'error': 'AWS SQS not configured. Textract extraction unavailable.',
                'code': 'AWS_NOT_CONFIGURED'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        sqs_queue_url = os.environ.get('SQS_QUEUE_URL')
        if not sqs_queue_url:
            return Response({
                'error': 'SQS queue not configured',
                'code': 'SQS_QUEUE_MISSING'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        job_id = str(uuid.uuid4())

        message_body = {
            'jobId': job_id,
            'objectKey': object_key,
            'docType': norm_doc_type,
            'callbackUrl': request.data.get('callbackUrl')
        }

        sqs_client.send_message(
            QueueUrl=sqs_queue_url,
            MessageBody=json.dumps(message_body)
        )

        return Response({
            'jobId': job_id, 
            'status': 'processing',
            'supportsExtraction': True,
            'docType': norm_doc_type
        })

    except Exception as e:
        print(f"[submit_extraction_job] Error: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_job_status(request, job_id):
    """
    Get the status of a Textract extraction job.
    """
    try:
        s3_client = _get_s3_client()
        if not s3_client:
            return Response({'error': 'AWS not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        bucket_name = os.environ.get('S3_BUCKET')
        if not bucket_name:
            return Response({'error': 'S3 bucket not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        result_key = f"textract-results/{job_id}.json"

        try:
            s3_client.head_object(Bucket=bucket_name, Key=result_key)
            return Response({'state': 'DONE'})
        except s3_client.exceptions.ClientError as e:
            if e.response['Error']['Code'] == '404':
                return Response({'state': 'PROCESSING'})
            else:
                raise

    except Exception as e:
        print(f"[get_job_status] Error: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_job_result(request, job_id):
    """
    Get the result of a Textract extraction job.
    """
    try:
        s3_client = _get_s3_client()
        if not s3_client:
            return Response({'error': 'AWS not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        bucket_name = os.environ.get('S3_BUCKET')
        if not bucket_name:
            return Response({'error': 'S3 bucket not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        result_key = f"textract-results/{job_id}.json"

        response = s3_client.get_object(Bucket=bucket_name, Key=result_key)
        result_data = json.loads(response['Body'].read().decode('utf-8'))

        return Response(result_data)

    except Exception as e:
        print(f"[get_job_result] Error: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
