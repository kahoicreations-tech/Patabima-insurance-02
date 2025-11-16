"""
Additional DMVIC Integration Tests
- Certificate issuance (Type A/B)
- Vehicle search response validation
- Certificate PDF download
"""

from unittest.mock import patch, MagicMock
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from app.models import MotorPolicy, DMVICCertificate
from app.services.dmvic_service import DMVICAPIError, DMVICService

User = get_user_model()


class DMVICVehicleSearchTests(TestCase):
    """Test DMVIC vehicle search response format and data transformation"""
    
    @patch('app.services.dmvic_service.DMVICService._make_authenticated_request')
    def test_vehicle_search_response_kda234h(self, mock_request):
        """Test vehicle search for KDA234H - verify response format"""
        
        # Mock DMVIC API response for KDA 234H (uses camelCase keys as per API)
        mock_request.return_value = {
            'registrationNumber': 'KDA234H',
            'chassisNumber': 'MHFCV3907JK123456',
            'make': 'HONDA',
            'model': 'FIT',
            'yearOfManufacture': 2018,
            'engineCapacity': 1300,
            'bodyType': 'SD',  # Sedan
            'color': 'BLUE',
            'vehicleType': 'SALOON',
            'tonnage': None,
            'passengerCapacity': 5,
            'ownerName': 'JANE SMITH',
            'ownerIdNumber': '87654321'
        }
        
        service = DMVICService()
        result = service.search_vehicle('KDA 234H')
        
        # Assertions - verify data transformation
        self.assertEqual(result['registration_number'], 'KDA234H')
        self.assertEqual(result['chassis_number'], 'MHFCV3907JK123456')
        self.assertEqual(result['make'], 'HONDA')
        self.assertEqual(result['model'], 'FIT')
        self.assertEqual(result['year_of_manufacture'], 2018)
        self.assertEqual(result['engine_capacity'], 1300)
        self.assertEqual(result['vehicle_type'], 'SALOON')
        self.assertEqual(result['color'], 'BLUE')
        self.assertEqual(result['passenger_capacity'], 5)
        self.assertEqual(result['owner_name'], 'JANE SMITH')
        
        # Verify service was called with cleaned registration (no spaces, uppercase)
        mock_request.assert_called_once()
        call_args = mock_request.call_args
        payload = call_args[1]['data']
        self.assertEqual(payload['registration_number'], 'KDA234H')
    
    @patch('app.services.dmvic_service.DMVICService._make_authenticated_request')
    def test_vehicle_search_commercial_vehicle(self, mock_request):
        """Test vehicle search for commercial vehicle with tonnage"""
        
        # Mock commercial vehicle response (camelCase keys)
        mock_request.return_value = {
            'registrationNumber': 'KBZ789T',
            'chassisNumber': 'MH8FCV3907JK654321',
            'make': 'ISUZU',
            'model': 'NQR',
            'yearOfManufacture': 2020,
            'engineCapacity': 5200,
            'bodyType': 'TR',  # Truck
            'color': 'WHITE',
            'vehicleType': 'COMMERCIAL',
            'tonnage': 5.0,
            'passengerCapacity': None,
            'ownerName': 'ABC LOGISTICS LTD',
            'ownerIdNumber': '23456789'
        }
        
        service = DMVICService()
        result = service.search_vehicle('KBZ789T')
        
        # Verify commercial-specific fields
        self.assertEqual(result['vehicle_type'], 'COMMERCIAL')
        self.assertEqual(result['tonnage'], 5.0)
        self.assertIsNone(result['passenger_capacity'])
        self.assertEqual(result['make'], 'ISUZU')
        self.assertEqual(result['model'], 'NQR')


class DMVICCertificateIssuanceTests(TestCase):
    """Test DMVIC certificate issuance (Type A and Type B)"""
    
    @patch('app.services.dmvic_service.DMVICService._make_authenticated_request')
    def test_issue_type_a_certificate_third_party(self, mock_request):
        """Test Type A certificate issuance (Third-Party coverage)"""
        
        # Mock successful Type A certificate issuance
        mock_request.return_value = {
            'certificateNumber': 'CHA123456',
            'pdfUrl': 'https://dmvic.go.ke/certificates/CHA123456.pdf',
            'qrCodeUrl': 'https://dmvic.go.ke/qr/CHA123456',
            'issuedAt': '2025-11-03T10:30:00Z',
            'status': 'ACTIVE'
        }
        
        # Prepare Type A payload (Third-Party)
        type_a_payload = {
            'TypeOfCertificate': 7,  # Type A code
            'TypeofCover': 200,  # TPO (Third Party Only)
            'Chassisnumber': 'JTFSH3P26J3012345',
            'RegistrationNumber': 'KCA123A',
            'InsuredName': 'JOHN DOE',
            'Phonenumber': '254712345678',
            'InsuredPIN': 'A012345678Z',
            'Bodytype': 'SD',
            'Licensedbodycty': 5,
            'CommencingDate': '03/11/2025',
            'ExpiryDate': '03/11/2026',
            'hudumanumber': ''
        }
        
        service = DMVICService()
        result = service.issue_type_a_certificate(type_a_payload)
        
        # Assertions
        self.assertEqual(result['certificate_number'], 'CHA123456')
        self.assertIn('pdf_url', result)
        self.assertIn('qr_code_url', result)
        self.assertEqual(result['status'], 'ACTIVE')
        
        # Verify API was called with correct payload
        mock_request.assert_called_once()
        call_args = mock_request.call_args
        self.assertEqual(call_args[1]['endpoint'], '/api/v4/Integration/IssueTypeACertificate')
        self.assertEqual(call_args[1]['method'], 'POST')
    
    @patch('app.services.dmvic_service.DMVICService._make_authenticated_request')
    def test_issue_type_b_certificate_comprehensive(self, mock_request):
        """Test Type B certificate issuance (Comprehensive coverage)"""
        
        # Mock successful Type B certificate issuance (camelCase keys)
        mock_request.return_value = {
            'certificateNumber': 'CHB987654',
            'pdfDownloadUrl': 'https://dmvic.go.ke/certificates/CHB987654.pdf',  # Note: pdfDownloadUrl not pdfUrl
            'qrCodeUrl': 'https://dmvic.go.ke/qr/CHB987654',
            'issuedAt': '2025-11-03T11:00:00Z',
            'status': 'ACTIVE'
        }
        
        # Prepare Type B payload (Comprehensive)
        type_b_payload = {
            'TypeOfCertificate': 8,  # Type B code
            'TypeofCover': 110,  # Comprehensive
            'Chassisnumber': 'MHFCV3907JK123456',
            'RegistrationNumber': 'KDA234H',
            'InsuredName': 'JANE SMITH',
            'Phonenumber': '254722345678',
            'InsuredPIN': 'B098765432Y',
            'Bodytype': 'SD',
            'Licensedbodycty': 5,
            'SumInsured': 2500000,
            'CommencingDate': '03/11/2025',
            'ExpiryDate': '03/11/2026',
            'hudumanumber': '',
            'Premium': 85000
        }
        
        service = DMVICService()
        result = service.issue_type_b_certificate(type_b_payload)
        
        # Assertions
        self.assertEqual(result['certificate_number'], 'CHB987654')
        self.assertIsNotNone(result['pdf_url'])  # Mapped from pdfDownloadUrl
        self.assertIsNotNone(result['qr_code_url'])
        self.assertEqual(result['status'], 'ACTIVE')
        
        # Verify API was called with correct endpoint
        mock_request.assert_called_once()
        call_args = mock_request.call_args
        self.assertEqual(call_args[1]['endpoint'], '/api/v4/Integration/IssueTypeBCertificate')
    
    @patch('app.services.dmvic_service.DMVICService._make_authenticated_request')
    def test_issue_certificate_api_error(self, mock_request):
        """Test certificate issuance handles API errors"""
        
        # Mock API error
        mock_request.side_effect = DMVICAPIError('Certificate issuance failed: Invalid vehicle data')
        
        type_a_payload = {
            'TypeOfCertificate': 7,
            'TypeofCover': 200,
            'Chassisnumber': 'INVALID',
            'RegistrationNumber': 'INVALID',
            'InsuredName': 'TEST USER',
            'Phonenumber': '254700000000',
            'InsuredPIN': 'A000000000A',
            'Bodytype': 'SD',
            'Licensedbodycty': 5,
            'CommencingDate': '03/11/2025',
            'ExpiryDate': '03/11/2026'
        }
        
        service = DMVICService()
        
        # Should raise DMVICAPIError
        with self.assertRaises(DMVICAPIError) as context:
            service.issue_type_a_certificate(type_a_payload)
        
        self.assertIn('Certificate issuance failed', str(context.exception))
    
    @patch('app.services.dmvic_service.DMVICService._make_authenticated_request')
    def test_certificate_payload_validation(self, mock_request):
        """Test certificate issuance validates required fields"""
        
        # Incomplete payload missing required fields
        incomplete_payload = {
            'TypeOfCertificate': 7,
            'RegistrationNumber': 'KCA123A',
            # Missing: Chassisnumber, InsuredName, etc.
        }
        
        service = DMVICService()
        
        # Should raise error for missing fields
        with self.assertRaises(DMVICAPIError) as context:
            service.issue_type_a_certificate(incomplete_payload)
        
        self.assertIn('Invalid Type A payload', str(context.exception))
        self.assertIn('Missing fields', str(context.exception))


class DMVICCertificatePDFTests(TestCase):
    """Test DMVIC certificate PDF download"""
    
    @patch('app.services.dmvic_service.requests.get')
    @patch('app.services.dmvic_service.DMVICService.load_certificate')
    @patch('app.services.dmvic_service.DMVICService.ensure_authenticated')
    def test_get_certificate_pdf(self, mock_auth, mock_cert, mock_get):
        """Test downloading certificate PDF"""
        
        # Mock successful auth and certificate loading
        mock_auth.return_value = None
        mock_cert.return_value = MagicMock()
        
        # Mock PDF content (binary data)
        mock_pdf_content = b'%PDF-1.4\n%fake pdf content for testing\n%%EOF'
        
        # Mock the requests.get call
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = mock_pdf_content
        mock_get.return_value = mock_response
        
        service = DMVICService()
        result = service.get_certificate_pdf('CHA123456')
        
        # Assertions
        self.assertEqual(result, mock_pdf_content)
        self.assertTrue(result.startswith(b'%PDF'))
    
    @patch('app.services.dmvic_service.requests.get')
    @patch('app.services.dmvic_service.DMVICService.load_certificate')
    @patch('app.services.dmvic_service.DMVICService.ensure_authenticated')
    def test_get_certificate_pdf_not_found(self, mock_auth, mock_cert, mock_get):
        """Test PDF download with invalid certificate number"""
        
        mock_auth.return_value = None
        mock_cert.return_value = MagicMock()
        
        # Mock 404 response
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_response.text = 'Certificate not found'
        mock_get.return_value = mock_response
        
        service = DMVICService()
        
        with self.assertRaises(DMVICAPIError) as context:
            service.get_certificate_pdf('INVALID999')
        
        # Check for actual error message format from service
        self.assertIn('404', str(context.exception))


class DMVICDoubleInsuranceTests(TestCase):
    """Additional tests for double insurance validation"""
    
    @patch('app.services.dmvic_service.DMVICService._make_authenticated_request')
    def test_validate_double_insurance_multiple_policies(self, mock_request):
        """Test double insurance check with existing cover"""
        
        # Mock response with existing cover (camelCase keys + hasActiveCover flag)
        mock_request.return_value = {
            'hasActiveCover': True,
            'certificateNumber': 'CHB222222',
            'insurerName': 'APA Insurance',
            'insurerCode': 'APA',
            'coverStartDate': '2024-11-01',
            'coverEndDate': '2025-11-01',
            'policyType': 'COMPREHENSIVE',
            'premiumAmount': 85000
        }
        
        service = DMVICService()
        result = service.validate_double_insurance('KCA999X')
        
        # Should return existing policy info
        self.assertTrue(result['exists'])
        self.assertIsNotNone(result['policy'])
        self.assertEqual(result['policy']['certificate_number'], 'CHB222222')
        self.assertEqual(result['policy']['insurer'], 'APA Insurance')
        self.assertEqual(result['policy']['policy_type'], 'COMPREHENSIVE')
