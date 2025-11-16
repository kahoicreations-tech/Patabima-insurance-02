import boto3
import os
import uuid
import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

# Document types that support Textract auto-extraction (logbook only)
EXTRACTABLE_DOC_TYPES = {"logbook", "vehicle_logbook", "rc"}

# All allowed document types for upload
ALLOWED_DOC_TYPES = {"logbook", "vehicle_logbook", "rc", "national_id", "id_copy", "kra_pin", "kra", "generic"}

def _get_s3_client():
    """Lazy-load S3 client to avoid initialization errors"""
    try:
        region = os.environ.get('AWS_REGION', 'us-east-1')
        return boto3.client('s3', region_name=region)
    except Exception as e:
        print(f"[AWS] Failed to initialize S3 client: {e}")
        return None

def _get_sqs_client():
    """Lazy-load SQS client to avoid initialization errors"""
    try:
        region = os.environ.get('AWS_REGION', 'us-east-1')
        return boto3.client('sqs', region_name=region)
    except Exception as e:
        print(f"[AWS] Failed to initialize SQS client: {e}")
        return None

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
        file_type = request.data.get('fileType')
        doc_type = request.data.get('docType') or request.data.get('documentType') or "generic"
        norm_doc_type = _normalize_doc_type(doc_type)
        
        if not file_name or not file_type:
            return Response({'error': 'filename and fileType are required.'}, status=status.HTTP_400_BAD_REQUEST)

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
        
        object_key = f"uploads/{uuid.uuid4()}-{file_name}"

        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={'Bucket': bucket_name, 'Key': object_key, 'ContentType': file_type},
            ExpiresIn=3600
        )
        
        # Indicate if this document type supports extraction
        supports_extraction = _is_extractable(norm_doc_type)
        
        return Response({
            'uploadUrl': presigned_url, 
            'objectKey': object_key,
            'docType': norm_doc_type,
            'supportsExtraction': supports_extraction
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
        
        if not object_key:
            return Response({'error': 'objectKey is required.'}, status=status.HTTP_400_BAD_REQUEST)

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
