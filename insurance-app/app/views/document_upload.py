"""Legacy module kept for import compatibility.

This module previously exposed simulated KYC/OCR upload endpoints.
Those simulation endpoints have been removed.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_kyc_document(request):
    return Response({'detail': 'KYC upload endpoint has been removed.'}, status=410)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_document_status(request, document_id):
    return Response({'detail': 'Document status endpoint has been removed.'}, status=410)