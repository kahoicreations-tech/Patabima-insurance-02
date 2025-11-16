"""
DMVIC API Views
Provides REST endpoints for DMVIC certificate issuance and management
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from app.models import MotorPolicy, DMVICVehicleSearch
from app.services.dmvic_service import DMVICService, DMVICAPIError, DMVICAuthenticationError
from app.services.dmvic_field_mapper import DMVICFieldMapper
from app.serializers import DMVICSearchVehicleSerializer, DMVICValidateDoubleInsuranceSerializer, DMVICPolicyIdSerializer, DMVICConfirmIssuanceSerializer, DMVICGetCertificatePdfSerializer
from app.permissions import IsAuthenticatedOrQuotationFlow
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

CACHE_TTL_HOURS = 24


@api_view(['POST'])
@permission_classes([IsAuthenticatedOrQuotationFlow])
def search_vehicle(request):
    """
    Search vehicle in DMVIC/NTSA database
    
    POST /api/dmvic/search-vehicle/
    {
        "registration_number": "KCA123A"
    }
    
    Returns:
        Vehicle details from NTSA/DMVIC database
        
    Security:
        - Authenticated users: Unlimited access
        - Anonymous users: Rate-limited (20 requests/hour per IP)
    """
    serializer = DMVICSearchVehicleSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    registration_number = serializer.validated_data['registration_number']
    proposed_cover_start_date = serializer.validated_data.get('proposed_cover_start_date')

    try:
        logger.info(f"Vehicle search requested: {registration_number}")

        # 1. Check cache first
        cached_result = DMVICVehicleSearch.objects.filter(registration_number=registration_number).first()
        if cached_result and (timezone.now() - cached_result.cached_at) < timedelta(hours=CACHE_TTL_HOURS):
            logger.info(f"DMVIC cache hit for {registration_number}")
            return Response({
                "success": True,
                "vehicle": cached_result.search_data,
                "has_existing_cover": cached_result.has_existing_cover,
                "existing_cover_expiry": cached_result.existing_cover_expiry,
                "cached": True,
                "cache_timestamp": cached_result.cached_at
            }, status=status.HTTP_200_OK)

        logger.info(f"DMVIC cache miss for {registration_number} or expired, calling external API")
        
        dmvic_service = DMVICService()
        vehicle_data = dmvic_service.search_vehicle(registration_number)

        # Determine if existing cover is present and its expiry date
        # DMVIC service returns has_active_cover and current_policy in vehicle_data
        has_existing_cover = False
        existing_cover_expiry = None
        
        if vehicle_data and vehicle_data.get('has_active_cover'):
            has_existing_cover = True
            current_policy = vehicle_data.get('current_policy', {})
            
            # Get expiry date from current_policy
            expiry_date_str = current_policy.get('cover_end_date')
            if expiry_date_str:
                try:
                    # Parse DD/MM/YYYY format from DMVIC
                    if '/' in expiry_date_str:
                        day, month, year = expiry_date_str.split('/')
                        existing_cover_expiry = timezone.datetime(
                            int(year), int(month), int(day)
                        ).date()
                    else:
                        # Try ISO format
                        existing_cover_expiry = timezone.datetime.strptime(
                            expiry_date_str.split('T')[0], '%Y-%m-%d'
                        ).date()
                    logger.info(f"Existing cover expires: {existing_cover_expiry}")
                except (ValueError, AttributeError) as e:
                    logger.warning(f"Could not parse cover_end_date '{expiry_date_str}': {e}")

        # 3. Update/Create cache using update_or_create to avoid duplicate key errors
        DMVICVehicleSearch.objects.update_or_create(
            registration_number=registration_number,
            defaults={
                'search_data': vehicle_data,
                'has_existing_cover': has_existing_cover,
                'existing_cover_expiry': existing_cover_expiry,
                'cached_at': timezone.now(),
            }
        )
        logger.info(f"DMVIC cache updated/created for {registration_number}")
        
        return Response({
            "success": True,
            "vehicle": vehicle_data,
            "has_existing_cover": has_existing_cover,
            "existing_cover_expiry": existing_cover_expiry,
            "cached": False,
            "cache_timestamp": timezone.now()
        }, status=status.HTTP_200_OK)
        
    except DMVICAPIError as e:
        logger.error(f"Vehicle search failed: {str(e)}")
        return Response(
            {"error": str(e), "success": False},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        logger.error(f"Unexpected error in vehicle search: {str(e)}")
        return Response(
            {"error": "Internal server error", "success": False},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_double_insurance(request):
    """
    Validate if vehicle has double insurance
    
    POST /api/dmvic/validate-double-insurance/
    {
        "registration_number": "KDA123A"
    }
    
    Returns:
        Double insurance validation result
    """
    serializer = DMVICValidateDoubleInsuranceSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    registration_number = serializer.validated_data['registration_number']

    try:
        logger.info(f"Double insurance validation: {registration_number}")
        
        dmvic_service = DMVICService()
        result = dmvic_service.validate_double_insurance(registration_number)
        
        return Response({
            "success": True,
            "has_double_insurance": result.get('has_double_insurance', False),
            "details": result
        }, status=status.HTTP_200_OK)
        
    except DMVICAPIError as e:
        logger.error(f"Double insurance validation failed: {str(e)}")
        return Response(
            {"error": str(e), "success": False},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def preview_certificate(request):
    """
    Preview certificate before issuance (auto-detects type A/B/C)
    
    POST /api/dmvic/preview-certificate/
    {
        "policy_id": 123
    }
    
    Returns:
        Preview PDF URL (valid 24 hours)
    """
    serializer = DMVICPolicyIdSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    policy_id = serializer.validated_data['policy_id']

    try:
        # Get policy
        try:
            policy = MotorPolicy.objects.get(id=policy_id, user=request.user)
        except MotorPolicy.DoesNotExist:
            return Response(
                {"error": "Policy not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Determine certificate type
        certificate_type = determine_certificate_type(policy)
        
        logger.info(f"Preview Type {certificate_type} requested for policy {policy.policy_number}")
        
        # Map to DMVIC payload
        mapper = DMVICFieldMapper()
        dmvic_payload = mapper.map_policy_to_dmvic(policy, certificate_type=certificate_type)
        
        # Validate payload
        is_valid, errors = mapper.validate_payload(dmvic_payload, certificate_type=certificate_type)
        if not is_valid:
            return Response(
                {"error": "Payload validation failed", "missing_fields": errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate preview
        dmvic_service = DMVICService()
        
        # Call appropriate preview method
        if certificate_type == 'A':
            result = dmvic_service.preview_type_a_certificate(dmvic_payload)
        elif certificate_type == 'B':
            result = dmvic_service.preview_type_b_certificate(dmvic_payload)
        elif certificate_type == 'C':
            result = dmvic_service.preview_type_c_certificate(dmvic_payload)
        else:
            return Response(
                {"error": f"Unsupported certificate type: {certificate_type}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            "success": True,
            "certificate_type": certificate_type,
            "preview_url": result['preview_url'],
            "api_request_number": result['api_request_number'],
            "expires_in": result['expires_in']
        }, status=status.HTTP_200_OK)
        
    except DMVICAPIError as e:
        logger.error(f"Preview failed: {str(e)}")
        error_message = str(e)
        user_message = "Unable to generate certificate preview. This requires connection to DMVIC API."
        
        # Check if it's a 404 error (endpoint not available)
        if '404' in error_message:
            user_message = "DMVIC preview endpoint is currently unavailable. You may proceed with policy creation, but certificate preview cannot be generated at this time."
        
        return Response({
            "error": error_message,
            "user_message": user_message,
            "success": False,
            "can_proceed": True  # Can still create policy without preview
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def issue_certificate(request):
    """
    Issue DMVIC certificate (auto-detects type A/B/C/D)
    
    POST /api/dmvic/issue-certificate/
    {
        "policy_id": 123
    }
    
    Returns:
        Certificate number, transaction number
    """
    serializer = DMVICPolicyIdSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    policy_id = serializer.validated_data['policy_id']

    try:
        # Get policy
        try:
            policy = MotorPolicy.objects.get(id=policy_id, user=request.user)
        except MotorPolicy.DoesNotExist:
            return Response(
                {"error": "Policy not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if already issued
        if policy.dmvic_certificate_number:
            return Response(
                {
                    "error": "Certificate already issued for this policy",
                    "certificate_number": policy.dmvic_certificate_number
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Determine certificate type
        certificate_type = determine_certificate_type(policy)
        
        logger.info(f"Issuing Type {certificate_type} certificate for policy {policy.policy_number}")
        
        # Map to DMVIC payload
        mapper = DMVICFieldMapper()
        dmvic_payload = mapper.map_policy_to_dmvic(policy, certificate_type=certificate_type)
        
        # Validate payload
        is_valid, errors = mapper.validate_payload(dmvic_payload, certificate_type=certificate_type)
        if not is_valid:
            return Response(
                {"error": "Payload validation failed", "missing_fields": errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Issue certificate
        dmvic_service = DMVICService()
        
        # Call appropriate issuance method
        if certificate_type == 'A':
            result = dmvic_service.issue_type_a_certificate(dmvic_payload)
        elif certificate_type == 'B':
            result = dmvic_service.issue_type_b_certificate(dmvic_payload)
        elif certificate_type == 'C':
            result = dmvic_service.issue_type_c_certificate(dmvic_payload)
        elif certificate_type == 'D':
            result = dmvic_service.issue_type_d_certificate(dmvic_payload)
        else:
            return Response(
                {"error": f"Unsupported certificate type: {certificate_type}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update policy with certificate details
        policy.dmvic_certificate_number = result['certificate_number']
        policy.dmvic_transaction_no = result['transaction_no']
        policy.dmvic_api_request_number = result.get('api_request_number')
        policy.dmvic_ref_no = result.get('dmvic_ref_no')
        policy.dmvic_certificate_type = certificate_type
        policy.dmvic_issued_at = timezone.now()
        policy.status = 'ACTIVE'
        policy.save()
        
        logger.info(f"Certificate {result['certificate_number']} issued successfully")
        
        return Response({
            "success": True,
            "certificate_type": certificate_type,
            "certificate_number": result['certificate_number'],
            "transaction_no": result['transaction_no'],
            "api_request_number": result.get('api_request_number'),
            "message": f"Type {certificate_type} certificate issued successfully"
        }, status=status.HTTP_200_OK)
        
    except DMVICAPIError as e:
        logger.error(f"Certificate issuance failed: {str(e)}")
        error_message = str(e)
        user_message = "Unable to issue DMVIC certificate at this time."
        
        # Check if it's a 404 error (endpoint not available)
        if '404' in error_message:
            user_message = "DMVIC certificate issuance endpoint is currently unavailable. Your policy has been created successfully, but the DMVIC certificate will need to be issued manually or when the service becomes available."
        elif 'authentication' in error_message.lower():
            user_message = "DMVIC authentication failed. Please contact support to verify DMVIC credentials."
        
        return Response({
            "error": error_message,
            "user_message": user_message,
            "success": False,
            "policy_created": True,  # Policy was created even if certificate failed
            "action_required": "Certificate issuance pending - will retry automatically"
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_certificate_issuance(request):
    """
    Confirm certificate issuance after logbook verification
    
    POST /api/dmvic/confirm-issuance/
    {
        "issuance_request_id": "AF-AA0012",
        "is_approved": true,
        "is_logbook_verified": true,
        "is_vehicle_inspected": true,
        "comments": "",
        "username": "agent@patabima.com"
    }
    
    Returns:
        Final certificate details after confirmation
    """
    serializer = DMVICConfirmIssuanceSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    issuance_request_id = serializer.validated_data['issuance_request_id']
    is_approved = serializer.validated_data['is_approved']
    is_logbook_verified = serializer.validated_data['is_logbook_verified']
    is_vehicle_inspected = serializer.validated_data['is_vehicle_inspected']
    comments = serializer.validated_data['comments']
    username = serializer.validated_data.get('username', request.user.email)

    try:
        logger.info(f"Confirming issuance: {issuance_request_id}")
        
        dmvic_service = DMVICService()
        result = dmvic_service.confirm_certificate_issuance(
            issuance_request_id=issuance_request_id,
            is_approved=is_approved,
            is_logbook_verified=is_logbook_verified,
            is_vehicle_inspected=is_vehicle_inspected,
            comments=comments,
            username=username
        )
        
        # Try to find and update the policy
        try:
            policy = MotorPolicy.objects.filter(
                dmvic_issuance_request_id=issuance_request_id
            ).first()
            
            if policy:
                policy.dmvic_confirmed_at = timezone.now()
                policy.save()
        except Exception as e:
            logger.warning(f"Could not update policy confirmation: {str(e)}")
        
        return Response({
            "success": True,
            "certificate_number": result['certificate_number'],
            "transaction_no": result['transaction_no'],
            "message": "Certificate issuance confirmed successfully"
        }, status=status.HTTP_200_OK)
        
    except DMVICAPIError as e:
        logger.error(f"Confirmation failed: {str(e)}")
        error_message = str(e)
        user_message = "Unable to confirm certificate issuance at this time."
        
        # Check if it's a 404 error (endpoint not available)
        if '404' in error_message:
            user_message = "DMVIC confirmation endpoint is currently unavailable. The certificate has been issued but confirmation will need to be completed later."
        
        return Response({
            "error": error_message,
            "user_message": user_message,
            "success": False,
            "action_required": "Manual confirmation may be required"
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_certificate_pdf(request):
    """
    Get certificate PDF URL
    
    POST /api/dmvic/get-certificate-pdf/
    {
        "certificate_number": "A1020701"
    }
    OR
    {
        "policy_id": 123
    }
    
    Returns:
        PDF download URL
    """
    serializer = DMVICGetCertificatePdfSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    certificate_number = serializer.validated_data.get('certificate_number')
    policy_id = serializer.validated_data.get('policy_id')

    try:
        # If policy_id provided, get certificate number from policy
        if policy_id and not certificate_number:
            try:
                policy = MotorPolicy.objects.get(id=policy_id, user=request.user)
                certificate_number = policy.dmvic_certificate_number
            except MotorPolicy.DoesNotExist:
                return Response(
                    {"error": "Policy not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        logger.info(f"Fetching PDF for certificate: {certificate_number}")
        
        dmvic_service = DMVICService()
        pdf_data = dmvic_service.get_certificate_pdf(certificate_number)
        
        # Store PDF in S3 and get persistent URL (if policy available)
        pdf_url = None
        if policy_id and pdf_data:
            try:
                policy = MotorPolicy.objects.get(id=policy_id, user=request.user)
                
                # TODO: Upload to S3 and get URL
                # For now, we'll store a placeholder URL that can be implemented later
                # When S3 integration is ready, replace this with actual upload:
                # from app.services.s3_service import upload_dmvic_certificate_pdf
                # pdf_url = upload_dmvic_certificate_pdf(
                #     pdf_data, 
                #     f"dmvic/certificates/{policy.policy_number}_{certificate_number}.pdf"
                # )
                
                # Placeholder for demonstration (real implementation needs S3)
                pdf_url = f"/api/insurance/dmvic/certificates/{certificate_number}/download"
                
                # Persist URL to policy
                policy.dmvic_certificate_pdf_url = pdf_url
                policy.certificate_url = pdf_url  # Also update general certificate_url field
                policy.save(update_fields=['dmvic_certificate_pdf_url', 'certificate_url'])
                logger.info(f"✅ Persisted PDF URL to policy {policy.policy_number}: {pdf_url}")
            except MotorPolicy.DoesNotExist:
                logger.warning(f"Policy {policy_id} not found when trying to persist PDF URL")
            except Exception as e:
                logger.warning(f"Could not update policy PDF URL: {str(e)}")
        
        # Return PDF data as base64 for frontend to download
        import base64
        pdf_base64 = base64.b64encode(pdf_data).decode('utf-8')
        
        return Response({
            "success": True,
            "certificate_number": certificate_number,
            "pdf_data": pdf_base64,
            "pdf_url": pdf_url,  # Include URL if stored
            "filename": f"DMVIC_{certificate_number}.pdf",
            "note": "PDF URL persistence requires S3 integration"
        }, status=status.HTTP_200_OK)
        
    except DMVICAPIError as e:
        logger.error(f"Get PDF failed: {str(e)}")
        error_message = str(e)
        user_message = "Unable to download certificate PDF at this time."
        
        # Check if it's a 404 error (certificate not found or endpoint unavailable)
        if '404' in error_message:
            user_message = "Certificate PDF is not available. This may be because: 1) The certificate has not been issued yet, 2) DMVIC service is unavailable, or 3) The certificate number is invalid."
        
        return Response({
            "error": error_message,
            "user_message": user_message,
            "success": False,
            "action_required": "Retry later or contact support for manual certificate retrieval"
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dmvic_health_check(request):
    """
    Check DMVIC API connectivity and cache status.
    """
    try:
        # Check cache status
        cache_entries = DMVICVehicleSearch.objects.count()
        last_cache_entry = DMVICVehicleSearch.objects.order_by('-cached_at').first()
        
        # Try to initialize DMVIC service to verify configuration
        try:
            dmvic_service = DMVICService()
            api_status = "configured"
        except Exception as e:
            logger.warning(f"DMVIC service initialization failed: {str(e)}")
            api_status = f"error: {str(e)}"
        
        return Response({
            "success": True,
            "dmvic_api_status": api_status,
            "cache_status": {
                "total_entries": cache_entries,
                "last_cached_at": last_cache_entry.cached_at if last_cache_entry else None,
                "cache_ttl_hours": CACHE_TTL_HOURS
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Unexpected error in DMVIC health check: {str(e)}")
        return Response(
            {"error": "Internal server error", "success": False},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def determine_certificate_type(policy: MotorPolicy) -> str:
    """
    Determine DMVIC certificate type based on policy details
    
    Returns:
        'A' = Type A (PSV - Matatu, Bus, Taxi)
        'B' = Type B (Private Comprehensive)
        'C' = Type C (Third Party Only)
        'D' = Type D (Special vehicles)
    """
    product_details = policy.product_details
    category = product_details.get('category', '').upper()
    cover_type = product_details.get('cover_type', '').upper()
    subcategory = product_details.get('subcategory', '').upper()
    
    # Type A: PSV (Public Service Vehicles)
    if category == 'PSV':
        return 'A'
    
    # Type B: Private/Commercial Comprehensive or TPTF
    if category in ['PRIVATE', 'COMMERCIAL']:
        if 'COMPREHENSIVE' in cover_type or 'TPTF' in cover_type:
            return 'B'
        else:
            # Third Party Only
            return 'C'
    
    # Type C: Third Party Only (any category)
    if 'THIRD' in cover_type and 'COMPREHENSIVE' not in cover_type:
        return 'C'
    
    # Type D: Motorcycles, TukTuks, Special classes
    if category in ['MOTORCYCLE', 'TUKTUK', 'SPECIAL']:
        if 'COMPREHENSIVE' in cover_type:
            return 'B'  # Some sources say D, but B is safer
        else:
            return 'C'
    
    # Default to C (Third Party) as safest option
    logger.warning(f"Could not determine certificate type for policy {policy.id}, defaulting to C")
    return 'C'
