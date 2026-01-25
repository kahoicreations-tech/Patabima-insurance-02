import logging

from django.conf import settings
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


logger = logging.getLogger(__name__)


class IntegrationsViewSet(viewsets.ViewSet):
	permission_classes = [IsAuthenticated]

	@action(detail=False, methods=['POST'])
	def vehicle_check(self, request):
		"""DMVIC vehicle lookup + (optional) double-insurance validation.

		This endpoint is intentionally strict: if DMVIC is disabled, it returns 503
		and does not fall back to any mock/simulated data.
		"""

		from app.services.dmvic_service import DMVICAPIError, get_dmvic_service

		reg = (request.data.get('vehicle_registration') or '').upper().strip()
		if not reg:
			return Response({'success': False, 'error': 'vehicle_registration is required'}, status=status.HTTP_400_BAD_REQUEST)

		if not getattr(settings, 'DMVIC_ENABLED', False):
			return Response(
				{
					'success': False,
					'error': 'DMVIC integration is disabled',
					'vehicle_details': None,
					'exists': False,
					'policy': None,
				},
				status=status.HTTP_503_SERVICE_UNAVAILABLE,
			)

		try:
			dmvic = get_dmvic_service()

			# Step 1: Search for vehicle in DMVIC database
			try:
				vehicle_data = dmvic.search_vehicle(reg)
			except DMVICAPIError as e:
				if 'not found' in str(e).lower() or '404' in str(e):
					return Response(
						{
							'success': False,
							'error': f'Vehicle {reg} not found in DMVIC database',
							'vehicle_details': None,
							'exists': False,
							'policy': None,
						},
						status=status.HTTP_404_NOT_FOUND,
					)
				raise

			# Step 2: Check for existing cover (double insurance validation)
			try:
				double_insurance_check = dmvic.validate_double_insurance(reg)
				has_existing_cover = bool(double_insurance_check.get('exists', False))
				existing_policy = double_insurance_check.get('policy')
			except DMVICAPIError as e:
				logger.warning('Double insurance check failed for %s: %s', reg, e)
				has_existing_cover = False
				existing_policy = None

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
					'source': 'DMVIC',
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
			logger.error('DMVIC API error for %s: %s', reg, e)
			return Response(
				{
					'success': False,
					'error': f'DMVIC API error: {str(e)}',
					'vehicle_details': None,
					'exists': False,
					'policy': None,
				},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR,
			)
		except Exception as e:
			logger.error('Unexpected error in vehicle_check for %s: %s', reg, e, exc_info=True)
			return Response(
				{
					'success': False,
					'error': f'Unexpected error: {str(e)}',
					'vehicle_details': None,
					'exists': False,
					'policy': None,
				},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR,
			)
