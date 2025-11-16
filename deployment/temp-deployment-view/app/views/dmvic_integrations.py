# views/dmvic_integrations.py
"""
DMVIC Integration Endpoints
Handles vehicle verification, certificate issuance, and DMVIC-related API calls
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
import logging

from app.models import DMVICVehicleSearch, DMVICCertificate
from app.services.dmvic_service import get_dmvic_service, DMVICAPIError

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_vehicle_with_dmvic(request):
    """
    Step 3: DMVIC Vehicle Verification Endpoint
    
    Verifies vehicle registration with DMVIC API and checks for existing insurance cover.
    Implements 24-hour caching to reduce DMVIC API calls.
    
    Frontend POST request:
    {
        "registration_number": "KCA123A",
        "chassis_number": "JTFSH3P26J3012345"  # Optional for validation
    }
    
    Response:
    {
        "success": true,
        "vehicle": {
            "registration": "KCA123A",
            "chassis_number": "JTFSH3P26J3012345",
            "make": "Toyota",
            "model": "Fielder",
            "year": 2015,
            "engine_capacity": 1500,
            "body_type": "SD",
            "color": "SILVER"
        },
        "existing_cover": {
            "exists": true/false,
            "policy": {
                "certificate_number": "CHB432123",
                "insurer": "CIC Insurance",
                "cover_start": "2025-01-01",
                "cover_end": "2026-01-01"
            } or null
        },
        "cached": true,
        "cached_at": "2025-11-03T10:30:00Z"
    }
    """
    # Extract request data
    registration = request.data.get('registration_number', '').strip().upper()
    chassis = request.data.get('chassis_number', '').strip().upper()
    
    if not registration:
        return Response({
            'success': False,
            'error': 'Registration number is required'
        }, status=400)
    
    # Check cache first (24-hour TTL)
    try:
        cache_entry = DMVICVehicleSearch.objects.filter(
            registration_number=registration
        ).order_by('-search_timestamp').first()
        
        if cache_entry and cache_entry.is_cache_valid:
            # Return cached data
            logger.info(f"✅ Vehicle data retrieved from cache: {registration}")
            return Response({
                'success': True,
                'vehicle': cache_entry.vehicle_data,
                'existing_cover': {
                    'exists': cache_entry.has_existing_cover,
                    'policy': cache_entry.existing_cover_details
                },
                'cached': True,
                'cached_at': cache_entry.search_timestamp.isoformat()
            })
    
    except Exception as e:
        logger.warning(f"Cache lookup failed: {str(e)}")
        # Continue to DMVIC call
    
    # Cache miss or expired - call DMVIC
    dmvic_service = get_dmvic_service()
    
    try:
        logger.info(f"🔍 Calling DMVIC vehicle search for: {registration}")
        
        # Search vehicle in DMVIC
        vehicle_data = dmvic_service.search_vehicle(registration)
        
        # Validate chassis number if provided
        if chassis and vehicle_data.get('chassis_number') != chassis:
            return Response({
                'success': False,
                'error': 'Chassis number mismatch',
                'expected': vehicle_data.get('chassis_number'),
                'provided': chassis
            }, status=400)
        
        # Check for double insurance
        double_insurance = dmvic_service.validate_double_insurance(registration)
        
        # Cache the result (24 hours)
        DMVICVehicleSearch.objects.create(
            registration_number=registration,
            vehicle_data=vehicle_data,
            searched_by=request.user if request.user.is_authenticated else None,
            cache_expires_at=timezone.now() + timedelta(hours=24),
            has_existing_cover=double_insurance.get('exists', False),
            existing_cover_details=double_insurance.get('policy')
        )
        
        logger.info(f"✅ Vehicle verified and cached: {registration}")
        
        return Response({
            'success': True,
            'vehicle': vehicle_data,
            'existing_cover': double_insurance,
            'cached': False
        })
        
    except DMVICAPIError as e:
        logger.error(f"DMVIC verification failed for {registration}: {str(e)}")
        return Response({
            'success': False,
            'error': str(e),
            'message': 'Vehicle verification failed. Please try again or contact support.'
        }, status=500)
        
    except Exception as e:
        logger.error(f"Unexpected error during vehicle verification: {str(e)}")
        return Response({
            'success': False,
            'error': 'Internal server error',
            'message': 'An unexpected error occurred. Please contact support.'
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dmvic_certificate(request, policy_number):
    """
    Get DMVIC certificate for a policy
    
    Returns certificate details including PDF URL and QR code
    """
    from app.models import MotorPolicy
    
    try:
        policy = MotorPolicy.objects.get(
            policy_number=policy_number,
            user=request.user
        )
        
        dmvic_cert = DMVICCertificate.objects.filter(
            motor_policy=policy,
            status='ISSUED'
        ).first()
        
        if not dmvic_cert:
            return Response({
                'error': 'No DMVIC certificate found for this policy'
            }, status=404)
        
        return Response({
            'certificate_number': dmvic_cert.certificate_number,
            'certificate_type': dmvic_cert.get_certificate_type_display(),
            'pdf_url': dmvic_cert.dmvic_pdf_url,
            'qr_code_url': dmvic_cert.qr_code_url,
            'issued_at': dmvic_cert.issued_at,
            'status': dmvic_cert.status,
            'policy_number': policy.policy_number
        })
        
    except MotorPolicy.DoesNotExist:
        return Response({
            'error': 'Policy not found'
        }, status=404)
    except Exception as e:
        logger.error(f"Error retrieving DMVIC certificate: {str(e)}")
        return Response({
            'error': 'Internal server error'
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def download_dmvic_certificate(request, certificate_number):
    """
    Download DMVIC certificate PDF
    
    Returns PDF file content
    """
    dmvic_service = get_dmvic_service()
    
    try:
        pdf_content = dmvic_service.get_certificate_pdf(certificate_number)
        
        from django.http import HttpResponse
        response = HttpResponse(pdf_content, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="DMVIC_{certificate_number}.pdf"'
        
        return response
        
    except DMVICAPIError as e:
        logger.error(f"PDF download failed: {str(e)}")
        return Response({
            'error': str(e),
            'message': 'Certificate PDF download failed'
        }, status=500)
    except Exception as e:
        logger.error(f"Unexpected error downloading PDF: {str(e)}")
        return Response({
            'error': 'Internal server error'
        }, status=500)
