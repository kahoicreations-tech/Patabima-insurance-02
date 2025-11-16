# views/document_upload.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.files.storage import default_storage
from django.conf import settings
import uuid
import os
from datetime import datetime


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_kyc_document(request):
    """
    Simulate AWS S3 document upload for KYC documents
    """
    document_type = request.data.get('document_type')  # 'national_id', 'kra_pin', 'logbook'
    document_file = request.FILES.get('document')
    policy_reference = request.data.get('policy_reference')
    
    if not all([document_type, document_file, policy_reference]):
        return Response({
            'error': 'document_type, document file, and policy_reference are required'
        }, status=400)
    
    # Validate document type
    allowed_types = ['national_id', 'kra_pin', 'logbook', 'driving_license']
    if document_type not in allowed_types:
        return Response({
            'error': f'Invalid document_type. Allowed: {allowed_types}'
        }, status=400)
    
    # Validate file format
    allowed_formats = ['pdf', 'jpg', 'jpeg', 'png']
    file_extension = document_file.name.split('.')[-1].lower()
    if file_extension not in allowed_formats:
        return Response({
            'error': f'Invalid file format. Allowed: {allowed_formats}'
        }, status=400)
    
    # Validate file size (max 5MB)
    max_size = 5 * 1024 * 1024  # 5MB
    if document_file.size > max_size:
        return Response({
            'error': 'File size must be less than 5MB'
        }, status=400)
    
    try:
        # Generate unique filename
        file_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"kyc_documents/{policy_reference}/{document_type}_{timestamp}_{file_id}.{file_extension}"
        
        # Simulate S3 upload (save locally for simulation)
        file_path = default_storage.save(filename, document_file)
        
        # Simulate OCR processing for document verification
        ocr_results = simulate_ocr_processing(document_type, document_file)
        
        return Response({
            'success': True,
            'document': {
                'document_id': file_id,
                'document_type': document_type,
                'filename': document_file.name,
                'file_size': document_file.size,
                'file_path': file_path,
                'upload_timestamp': datetime.now().isoformat(),
                'policy_reference': policy_reference,
                'storage_provider': 'S3_SIMULATION',
                'verification_status': 'PENDING',
                'ocr_results': ocr_results,
                'download_url': f"{getattr(settings, 'MEDIA_URL', '/media/')}{file_path}"
            }
        })
        
    except Exception as e:
        return Response({
            'error': f'Upload failed: {str(e)}'
        }, status=500)


def simulate_ocr_processing(document_type, document_file):
    """
    Simulate OCR processing of uploaded documents
    """
    mock_ocr_results = {
        'national_id': {
            'id_number': '12345678',
            'full_name': 'JOHN DOE SMITH',
            'date_of_birth': '1990-05-15',
            'place_of_issue': 'NAIROBI',
            'confidence_score': 0.95,
            'verification_status': 'VALID'
        },
        'kra_pin': {
            'pin_number': 'A001234567P',
            'taxpayer_name': 'JOHN DOE SMITH',
            'registration_date': '2020-01-15',
            'status': 'ACTIVE',
            'confidence_score': 0.92,
            'verification_status': 'VALID'
        },
        'logbook': {
            'registration_number': 'KDD123A',
            'owner_name': 'JOHN DOE SMITH',
            'make': 'TOYOTA',
            'model': 'HIACE',
            'year_of_manufacture': '2018',
            'engine_number': 'E123456789',
            'chassis_number': 'JTFSH3P26J3012345',
            'confidence_score': 0.88,
            'verification_status': 'VALID'
        },
        'driving_license': {
            'license_number': 'DL001234567',
            'full_name': 'JOHN DOE SMITH',
            'license_class': 'BCE',
            'issue_date': '2018-03-20',
            'expiry_date': '2025-03-20',
            'confidence_score': 0.91,
            'verification_status': 'VALID'
        }
    }
    
    return mock_ocr_results.get(document_type, {
        'extraction_status': 'PROCESSED',
        'confidence_score': 0.85,
        'verification_status': 'PENDING_REVIEW'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_document_status(request, document_id):
    """
    Get document verification status
    """
    # Simulate document status check
    return Response({
        'document_id': document_id,
        'verification_status': 'VERIFIED',
        'verification_timestamp': datetime.now().isoformat(),
        'verification_notes': 'Document verified successfully via OCR',
        'manual_review_required': False
    })