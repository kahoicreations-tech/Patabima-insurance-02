# views/integrations.py
"""
DMVIC Integration Views
Handles vehicle verification and DMVIC API integration endpoints.
"""

import random
import string
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet


class IntegrationsViewSet(ViewSet):
    """ViewSet for DMVIC and other external integrations"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['POST'])
    def vehicle_check(self, request):
        """
        Combined DMVIC + existing cover lookup.
        
        Uses real DMVIC API if DMVIC_ENABLED=true, otherwise falls back to mock.
        
        Request Body:
            - vehicle_registration: Vehicle registration number (required)
            - vehicle_make: Vehicle make (optional)
            - vehicle_model: Vehicle model (optional)
            - vehicle_year: Vehicle year (optional)
        
        Response:
            {
                "exists": boolean,  // True if existing cover found
                "vehicle_details": {...},  // Vehicle information from DMVIC
                "policy": {...} or null  // Existing policy details if found
            }
        """
        from django.conf import settings
        from app.services.dmvic_service import get_dmvic_service, DMVICAPIError
        
        reg = request.data.get('vehicle_registration', '').upper().strip()
        
        # Check if DMVIC integration is enabled
        dmvic_enabled = getattr(settings, 'DMVIC_ENABLED', False)
        
        if dmvic_enabled:
            # Use real DMVIC API
            try:
                dmvic = get_dmvic_service()
                
                # Step 1: Search for vehicle in DMVIC database
                try:
                    vehicle_data = dmvic.search_vehicle(reg)
                except DMVICAPIError as e:
                    # Vehicle not found in DMVIC
                    if 'not found' in str(e).lower() or '404' in str(e):
                        return Response({
                            'success': False,
                            'error': f'Vehicle {reg} not found in DMVIC database',
                            'vehicle_details': None,
                            'exists': False,
                            'policy': None
                        }, status=status.HTTP_404_NOT_FOUND)
                    else:
                        # Other API error
                        raise
                
                # Step 2: Check for existing cover (double insurance validation)
                try:
                    double_insurance_check = dmvic.validate_double_insurance(reg)
                    has_existing_cover = double_insurance_check.get('exists', False)
                    existing_policy = double_insurance_check.get('policy')
                except DMVICAPIError as e:
                    # If double insurance check fails, continue without it
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Double insurance check failed for {reg}: {str(e)}")
                    has_existing_cover = False
                    existing_policy = None
                
                # Build response
                resp = {
                    'success': True,
                    'exists': has_existing_cover,
                    'vehicle_details': {
                        'registration': vehicle_data.get('registration_number', reg),
                        'chassis_number': vehicle_data.get('chassis_number'),
                        'make': vehicle_data.get('make') or request.data.get('vehicle_make', ''),
                        'model': vehicle_data.get('model') or request.data.get('vehicle_model', ''),
                        'year': vehicle_data.get('year_of_manufacture') or request.data.get('vehicle_year', ''),
                        'engine_capacity': vehicle_data.get('engine_capacity'),
                        'vehicle_type': vehicle_data.get('vehicle_type'),
                        'color': vehicle_data.get('color'),
                        'tonnage': vehicle_data.get('tonnage'),
                        'passenger_capacity': vehicle_data.get('passenger_capacity'),
                        'owner_name': vehicle_data.get('owner_name'),
                        'owner_id': vehicle_data.get('owner_id'),
                        'source': 'DMVIC_PRODUCTION'
                    },
                    'policy': None,
                }
                
                if has_existing_cover and existing_policy:
                    resp['policy'] = {
                        'certificate_number': existing_policy.get('certificate_number'),
                        'insurer': existing_policy.get('insurer'),
                        'insurer_code': existing_policy.get('insurer_code'),
                        'expiry_date': existing_policy.get('cover_end_date'),
                        'cover_start_date': existing_policy.get('cover_start_date'),
                        'policy_type': existing_policy.get('policy_type'),
                    }
                
                return Response(resp, status=status.HTTP_200_OK)
                
            except DMVICAPIError as e:
                # DMVIC API error - return error response
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"DMVIC API error for {reg}: {str(e)}")
                
                return Response({
                    'success': False,
                    'error': f'DMVIC API error: {str(e)}',
                    'vehicle_details': None,
                    'exists': False,
                    'policy': None
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            except Exception as e:
                # Unexpected error
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Unexpected error in vehicle_check for {reg}: {str(e)}")
                
                return Response({
                    'success': False,
                    'error': f'Unexpected error: {str(e)}',
                    'vehicle_details': None,
                    'exists': False,
                    'policy': None
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        else:
            # DMVIC disabled - use mock data (legacy behavior)
            is_insured = '234' in reg
            resp = {
                'success': True,
                'exists': is_insured,
                'vehicle_details': {
                    'registration': reg,
                    'make': request.data.get('vehicle_make', ''),
                    'model': request.data.get('vehicle_model', ''),
                    'year': request.data.get('vehicle_year', ''),
                    'source': 'MOCK_SIMULATION'
                },
                'policy': None,
            }
            if is_insured:
                resp['policy'] = {
                    'policy_number': 'POL' + ''.join(random.choice(string.digits + string.ascii_uppercase) for _ in range(6)),
                    'insurer': 'APA Insurance',
                    'expiry_date': (timezone.now() + timedelta(days=90)).date().isoformat(),
                }
            return Response(resp, status=status.HTTP_200_OK)
