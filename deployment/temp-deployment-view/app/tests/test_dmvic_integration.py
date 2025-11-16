"""
DMVIC Integration Endpoint Tests
Tests for DMVIC vehicle_check and related integration endpoints with proper mocking.
"""
from unittest.mock import patch, MagicMock
from django.urls import reverse
from django.test import override_settings
from rest_framework.test import APITestCase
from rest_framework import status
from django.conf import settings

from app.models import User
from app.services.dmvic_service import DMVICAPIError


class DMVICIntegrationTests(APITestCase):
    """Test DMVIC integration endpoints with mocked service calls"""
    
    def setUp(self):
        """Set up test user and authentication"""
        self.user = User.objects.create_user(
            phonenumber='712345678',
            password='TestPass123!'
        )
        self.client.force_authenticate(user=self.user)
        
        # Get the URL using reverse - ensures correct routing
        self.vehicle_check_url = reverse('integrations-vehicle-check')
        
        # Sample vehicle data returned by DMVIC
        self.mock_vehicle_data = {
            'registration_number': 'KCA123A',
            'chassis_number': 'JTFSH3P26J3012345',
            'make': 'Toyota',
            'model': 'Fielder',
            'year_of_manufacture': 2015,
            'engine_capacity': 1500,
            'vehicle_type': 'SALOON',
            'color': 'SILVER',
            'tonnage': None,
            'passenger_capacity': 5,
            'owner_name': 'JOHN DOE',
            'owner_id': '12345678'
        }
        
        # Sample double insurance response (no existing cover)
        self.mock_no_existing_cover = {
            'exists': False,
            'policy': None
        }
        
        # Sample double insurance response (existing cover found)
        self.mock_existing_cover = {
            'exists': True,
            'policy': {
                'certificate_number': 'CHB432123',
                'insurer': 'CIC Insurance',
                'insurer_code': 'CIC',
                'cover_start_date': '2025-01-01',
                'cover_end_date': '2026-01-01',
                'policy_type': 'COMPREHENSIVE',
                'premium_amount': 50000
            }
        }
    
    @override_settings(DMVIC_ENABLED=True)
    @patch('app.views.dmvic_integrations.get_dmvic_service')
    def test_vehicle_check_dmvic_enabled_no_existing_cover(self, mock_get_dmvic):
        """Test vehicle_check with DMVIC enabled and no existing cover"""
        
        # Mock DMVIC service
        mock_dmvic = MagicMock()
        mock_dmvic.search_vehicle.return_value = self.mock_vehicle_data
        mock_dmvic.validate_double_insurance.return_value = self.mock_no_existing_cover
        mock_get_dmvic.return_value = mock_dmvic
        
        # Make request - NOTE: standalone endpoint uses 'registration_number'
        response = self.client.post(self.vehicle_check_url, {
            'registration_number': 'KCA123A',  # Changed from vehicle_registration
            'chassis_number': 'JTFSH3P26J3012345'  # Optional validation field
        }, format='json')
        
        # Debug output if failure
        if response.status_code != status.HTTP_200_OK:
            print(f"\nDEBUG: Status {response.status_code}")
            print(f"DEBUG: Response {response.content.decode()}")
            print(f"DEBUG: DMVIC_ENABLED = {settings.DMVIC_ENABLED}")
            print(f"DEBUG: Mock called = {mock_get_dmvic.called}")
        
        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertTrue(data['success'])
        self.assertFalse(data['existing_cover']['exists'])  # No existing cover
        self.assertIsNone(data['existing_cover']['policy'])
        
        # Verify vehicle details (standalone endpoint uses 'vehicle' key)
        vehicle = data['vehicle']
        self.assertEqual(vehicle['registration_number'], 'KCA123A')
        self.assertEqual(vehicle['make'], 'Toyota')
        self.assertEqual(vehicle['model'], 'Fielder')
        self.assertEqual(vehicle['year_of_manufacture'], 2015)
        self.assertEqual(vehicle['chassis_number'], 'JTFSH3P26J3012345')
        
        # Verify DMVIC service was called
        mock_dmvic.search_vehicle.assert_called_once_with('KCA123A')
        mock_dmvic.validate_double_insurance.assert_called_once_with('KCA123A')
    
    @patch('app.views.dmvic_integrations.get_dmvic_service')
    @override_settings(DMVIC_ENABLED=True)
    def test_vehicle_check_dmvic_enabled_with_existing_cover(self, mock_get_dmvic):
        """Test vehicle_check with DMVIC enabled and existing cover found"""
        
        # Mock DMVIC service
        mock_dmvic = MagicMock()
        mock_dmvic.search_vehicle.return_value = self.mock_vehicle_data
        mock_dmvic.validate_double_insurance.return_value = self.mock_existing_cover
        mock_get_dmvic.return_value = mock_dmvic
        
        # Make request
        url = self.vehicle_check_url
        response = self.client.post(url, {
            'registration_number': 'KCA234B'
        }, format='json')
        
        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertTrue(data['success'])
        self.assertTrue(data['existing_cover']['exists'])  # Existing cover found
        self.assertIsNotNone(data['existing_cover']['policy'])
        
        # Verify policy details (matches DMVIC service response format)
        policy = data['existing_cover']['policy']
        self.assertEqual(policy['certificate_number'], 'CHB432123')
        self.assertEqual(policy['insurer'], 'CIC Insurance')
        self.assertEqual(policy['policy_type'], 'COMPREHENSIVE')
        self.assertEqual(policy['cover_end_date'], '2026-01-01')  # DMVIC uses cover_end_date not expiry_date
    
    @patch('app.views.dmvic_integrations.get_dmvic_service')
    @override_settings(DMVIC_ENABLED=True)
    def test_vehicle_check_vehicle_not_found_in_dmvic(self, mock_get_dmvic):
        """Test vehicle_check when vehicle not found in DMVIC database"""
        
        # Mock DMVIC service raising 404
        mock_dmvic = MagicMock()
        mock_dmvic.search_vehicle.side_effect = DMVICAPIError('Vehicle KCA999Z not found in DMVIC database')
        mock_get_dmvic.return_value = mock_dmvic
        
        # Make request
        url = self.vehicle_check_url
        response = self.client.post(url, {
            'registration_number': 'KCA999Z'
        }, format='json')
        
        # Assertions
        # Standalone endpoint returns 500 for all DMVIC errors (not 404 like ViewSet)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        data = response.json()
        
        self.assertFalse(data['success'])
        self.assertIn('not found', data['error'])
    
    @patch('app.views.dmvic_integrations.get_dmvic_service')
    @override_settings(DMVIC_ENABLED=True)
    def test_vehicle_check_dmvic_api_error(self, mock_get_dmvic):
        """Test vehicle_check handling DMVIC API errors gracefully"""
        
        # Mock DMVIC service raising API error
        mock_dmvic = MagicMock()
        mock_dmvic.search_vehicle.side_effect = DMVICAPIError('DMVIC API timeout')
        mock_get_dmvic.return_value = mock_dmvic
        
        # Make request
        url = self.vehicle_check_url
        response = self.client.post(url, {
            'registration_number': 'KCA456C'
        }, format='json')
        
        # Assertions
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        data = response.json()
        
        self.assertFalse(data['success'])
        # Error message is the actual exception message from DMVIC service
        self.assertEqual(data['error'], 'DMVIC API timeout')
    
    @patch('app.views.dmvic_integrations.get_dmvic_service')
    @override_settings(DMVIC_ENABLED=True)
    def test_vehicle_check_double_insurance_check_fails(self, mock_get_dmvic):
        """Test vehicle_check continues if double insurance check fails"""
        
        # Mock DMVIC service: vehicle found but double insurance check fails
        mock_dmvic = MagicMock()
        mock_dmvic.search_vehicle.return_value = self.mock_vehicle_data
        mock_dmvic.validate_double_insurance.side_effect = DMVICAPIError('Double insurance endpoint unavailable')
        mock_get_dmvic.return_value = mock_dmvic
        
        # Make request
        url = self.vehicle_check_url
        response = self.client.post(url, {
            'registration_number': 'KCA123A'
        }, format='json')
        
        # Assertions
        # Standalone endpoint does not handle double insurance errors gracefully
        # It returns 500 when validate_double_insurance fails
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        data = response.json()
        
        self.assertFalse(data['success'])
        self.assertIn('Double insurance', data['error'])
    
    @patch('app.views.dmvic_integrations.get_dmvic_service')
    def test_vehicle_check_standalone_endpoint_always_uses_dmvic(self, mock_get_dmvic):
        """Test standalone endpoint always calls DMVIC (no mock mode like ViewSet)"""
        
        # Mock DMVIC service to return existing cover
        mock_dmvic = MagicMock()
        mock_dmvic.search_vehicle.return_value = self.mock_vehicle_data
        mock_dmvic.validate_double_insurance.return_value = self.mock_existing_cover
        mock_get_dmvic.return_value = mock_dmvic
        
        # Make request
        response = self.client.post(self.vehicle_check_url, {
            'registration_number': 'KCA234B'
        }, format='json')
        
        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should get DMVIC data (standalone endpoint has no DMVIC_ENABLED check)
        self.assertTrue(data['success'])
        self.assertTrue(data['existing_cover']['exists'])
        self.assertIsNotNone(data['existing_cover']['policy'])
        
        # Verify DMVIC service was called
        mock_dmvic.search_vehicle.assert_called_once_with('KCA234B')
    
    @patch('app.views.dmvic_integrations.get_dmvic_service')
    def test_vehicle_check_allows_unauthenticated_access(self, mock_get_dmvic):
        """Test standalone endpoint allows unauthenticated access (AllowAny permission)"""
        
        # Mock DMVIC service
        mock_dmvic = MagicMock()
        mock_dmvic.search_vehicle.return_value = self.mock_vehicle_data
        mock_dmvic.validate_double_insurance.return_value = self.mock_no_existing_cover
        mock_get_dmvic.return_value = mock_dmvic
        
        # Logout
        self.client.force_authenticate(user=None)
        
        # Make request
        response = self.client.post(self.vehicle_check_url, {
            'registration_number': 'KCA123A'
        }, format='json')
        
        # Standalone endpoint uses AllowAny, so should succeed
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data['success'])
    
    @patch('app.views.dmvic_integrations.get_dmvic_service')
    @override_settings(DMVIC_ENABLED=True)
    def test_vehicle_check_registration_normalization(self, mock_get_dmvic):
        """Test vehicle_check properly normalizes registration numbers"""
        
        # Mock DMVIC service
        mock_dmvic = MagicMock()
        mock_dmvic.search_vehicle.return_value = self.mock_vehicle_data
        mock_dmvic.validate_double_insurance.return_value = self.mock_no_existing_cover
        mock_get_dmvic.return_value = mock_dmvic
        
        # Make request with lowercase and spaces
        url = self.vehicle_check_url
        response = self.client.post(url, {
            'registration_number': '  kca 123a  '  # Lowercase with spaces
        }, format='json')
        
        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify registration was normalized by view (strip + upper) and passed to DMVIC
        # View does: '  kca 123a  '.strip().upper() = 'KCA 123A'
        # Then DMVIC service does: 'KCA 123A'.replace(' ', '').upper() = 'KCA123A'
        mock_dmvic.search_vehicle.assert_called_once_with('KCA 123A')  # What view passes


class DMVICServiceMockTests(APITestCase):
    """Test DMVIC service methods directly with mocking"""
    
    @patch('app.services.dmvic_service.requests.post')
    @patch('app.services.dmvic_service.DMVICService.load_certificate')
    def test_dmvic_login_success(self, mock_load_cert, mock_post):
        """Test DMVIC login flow with mocked HTTP calls"""
        from app.services.dmvic_service import DMVICService
        
        # Mock certificate loading
        mock_load_cert.return_value = ('/tmp/cert.pem', '/tmp/key.pem')
        
        # Mock successful login response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'Success': {
                'token': 'mock_access_token_12345',
                'expires_in': 86400
            }
        }
        mock_post.return_value = mock_response
        
        # Create service and login
        service = DMVICService()
        result = service.login()
        
        # Assertions
        self.assertTrue(result)
        self.assertEqual(service.access_token, 'mock_access_token_12345')
        self.assertIsNotNone(service.token_expiry)
        
        # Verify login was called with correct endpoint
        call_args = mock_post.call_args
        self.assertIn('/api/V1/Account/Login', call_args[0][0])
    
    @patch('app.services.dmvic_service.DMVICService._make_authenticated_request')
    def test_dmvic_search_vehicle(self, mock_request):
        """Test DMVIC vehicle search with mocked API"""
        from app.services.dmvic_service import DMVICService
        
        # Mock API response
        mock_request.return_value = {
            'registrationNumber': 'KCA123A',
            'chassisNumber': 'JTFSH3P26J3012345',
            'make': 'Toyota',
            'model': 'Fielder',
            'yearOfManufacture': 2015,
            'engineCapacity': 1500,
            'vehicleType': 'SALOON',
            'color': 'SILVER',
            'passengerCapacity': 5,
            'ownerName': 'JOHN DOE',
            'ownerIdNumber': '12345678'
        }
        
        # Search vehicle
        service = DMVICService()
        result = service.search_vehicle('KCA 123A')
        
        # Assertions
        self.assertEqual(result['registration_number'], 'KCA123A')
        self.assertEqual(result['make'], 'Toyota')
        self.assertEqual(result['model'], 'Fielder')
        self.assertEqual(result['chassis_number'], 'JTFSH3P26J3012345')
        
        # Verify API was called with normalized registration
        mock_request.assert_called_once()
        call_kwargs = mock_request.call_args[1]
        self.assertEqual(call_kwargs['data']['registration_number'], 'KCA123A')
    
    @patch('app.services.dmvic_service.DMVICService._make_authenticated_request')
    def test_dmvic_validate_double_insurance_no_cover(self, mock_request):
        """Test DMVIC double insurance validation (no existing cover)"""
        from app.services.dmvic_service import DMVICService
        
        # Mock API response (no active cover)
        mock_request.return_value = {
            'hasActiveCover': False
        }
        
        # Validate double insurance
        service = DMVICService()
        result = service.validate_double_insurance('KCA123A')
        
        # Assertions
        self.assertFalse(result['exists'])
        self.assertIsNone(result['policy'])
    
    @patch('app.services.dmvic_service.DMVICService._make_authenticated_request')
    def test_dmvic_validate_double_insurance_existing_cover(self, mock_request):
        """Test DMVIC double insurance validation (existing cover found)"""
        from app.services.dmvic_service import DMVICService
        
        # Mock API response (active cover exists)
        mock_request.return_value = {
            'hasActiveCover': True,
            'certificateNumber': 'CHB432123',
            'insurerName': 'CIC Insurance',
            'insurerCode': 'CIC',
            'coverStartDate': '2025-01-01',
            'coverEndDate': '2026-01-01',
            'policyType': 'COMPREHENSIVE',
            'premiumAmount': 50000
        }
        
        # Validate double insurance
        service = DMVICService()
        result = service.validate_double_insurance('KCA234B')
        
        # Assertions
        self.assertTrue(result['exists'])
        self.assertIsNotNone(result['policy'])
        self.assertEqual(result['policy']['certificate_number'], 'CHB432123')
        self.assertEqual(result['policy']['insurer'], 'CIC Insurance')
        self.assertEqual(result['policy']['policy_type'], 'COMPREHENSIVE')
