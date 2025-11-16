import os
import uuid
from datetime import datetime

from django.conf import settings
from django.utils.timezone import now
from django.db import transaction
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

import boto3

from ..models import Claim, ClaimDocument, User
from ..serializers import ClaimSerializer


def _env(name: str, default=None):
    return os.environ.get(name, getattr(settings, name, default))


def _claims_key(user_id: str, filename: str) -> str:
    env = _env('ENV', 'dev')
    ts = now()
    uid = uuid.uuid4()
    safe = filename.replace(' ', '-') if filename else 'file'
    return f"claims/{env}/{user_id}/{ts.strftime('%Y')}/{ts.strftime('%m')}/{uid}/{safe}"


class ClaimsPresignView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        file_name = request.data.get('fileName') or request.data.get('filename')
        content_type = request.data.get('contentType') or 'application/octet-stream'
        doc_type = request.data.get('docType') or 'ATTACHMENT'
        if not file_name:
            return Response({'detail': 'fileName is required'}, status=400)

        bucket = _env('S3_BUCKET')
        if not bucket:
            return Response({'detail': 'S3_BUCKET not configured in .env file'}, status=500)

        # Check if we're in mock mode (for development without AWS credentials)
        mock_mode = _env('DOCS_MOCK_AWS', 'false').lower() in ('true', '1', 'yes')
        
        if mock_mode:
            # Return a mock presign response for development
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"[MOCK MODE] Presign request for {file_name} ({content_type})")
            
            key = _claims_key(str(request.user.id), file_name)
            return Response({
                'url': 'https://mock-s3-upload.example.com/upload',
                'fields': {
                    'key': key,
                    'Content-Type': content_type,
                    'x-amz-server-side-encryption': 'AES256',
                },
                'key': key,
                'docType': doc_type,
                'mock': True,  # Indicate this is a mock response
            })

        key = _claims_key(str(request.user.id), file_name)
        
        try:
            s3 = boto3.client('s3', region_name=_env('AWS_REGION', 'us-east-1'))
        except Exception as e:
            return Response({
                'detail': f'Failed to create S3 client (AWS credentials missing?): {str(e)}'
            }, status=500)
        
        try:
            # Enforce SSE at rest. If KMS key is configured, require aws:kms with specific key; else default to AES256.
            kms_key = _env('KMS_KEY_ID')
            fields = {"Content-Type": content_type}
            conditions = [["content-length-range", 0, 20 * 1024 * 1024], {"Content-Type": content_type}]
            if kms_key:
                fields["x-amz-server-side-encryption"] = "aws:kms"
                fields["x-amz-server-side-encryption-aws-kms-key-id"] = kms_key
                conditions.append({"x-amz-server-side-encryption": "aws:kms"})
                conditions.append({"x-amz-server-side-encryption-aws-kms-key-id": kms_key})
            else:
                fields["x-amz-server-side-encryption"] = "AES256"
                conditions.append({"x-amz-server-side-encryption": "AES256"})

            presign = s3.generate_presigned_post(
                Bucket=bucket,
                Key=key,
                Fields=fields,
                Conditions=conditions,
                ExpiresIn=int(_env('PRESIGN_EXPIRES_SEC', 600)),
            )
            return Response({
                'url': presign['url'],
                'fields': presign['fields'],
                'key': key,
                'docType': doc_type,
            })
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"S3 presign error: {str(e)}", exc_info=True)
            return Response({
                'detail': f'S3 presign failed: {str(e)}. Check AWS credentials or set DOCS_MOCK_AWS=true in .env'
            }, status=500)


class ClaimsSubmitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        data = request.data or {}
        documents = data.pop('documents', []) or []

        # Create claim
        serializer = ClaimSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        claim: Claim = serializer.save(user=request.user, status='SUBMITTED')

        # Attach documents
        for d in documents:
            ClaimDocument.objects.create(
                claim=claim,
                doc_type=d.get('doc_type') or d.get('type') or 'ATTACHMENT',
                s3_key=d.get('s3_key') or d.get('key') or '',
                file_name=d.get('file_name') or d.get('fileName') or 'file',
                file_size=d.get('file_size') or d.get('size') or 0,
                content_type=d.get('content_type') or d.get('contentType'),
            )

        return Response({'success': True, 'claim': ClaimSerializer(claim).data}, status=201)


class ClaimsListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Claim.objects.filter(user=request.user).order_by('-date_created')
        return Response({'results': ClaimSerializer(qs, many=True).data})


class ClaimsDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, claim_id: str):
        try:
            claim = Claim.objects.get(id=claim_id, user=request.user)
        except Claim.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)
        return Response({'claim': ClaimSerializer(claim).data})
