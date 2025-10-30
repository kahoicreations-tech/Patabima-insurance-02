#!/usr/bin/env python3
"""
Test script for Medical Insurance Manual Quote Backend
Tests the Django API endpoints for manual quotes functionality
"""

import os
import sys
import django
import requests
import json
import uuid
from datetime import datetime

# Add the project directory to Python path
project_dir = r'C:\Users\USER\Desktop\PATABIMA\PATABIMA FRONT\PATA BIMA AGENCY - Copy\insurance-app'
sys.path.insert(0, project_dir)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.test import Client
from app.models import ManualQuote

User = get_user_model()

# Test configuration
# Use explicit IPv4 loopback to avoid IPv6/localhost resolution issues on Windows
BASE_URL = "http://127.0.0.1:8000"
API_BASE = f"{BASE_URL}/api/v1/public_app"

class MedicalQuoteBackendTester:
    def __init__(self):
        self.client = Client()
        self.auth_token = None
        self.test_user = None
        
    def setup_test_user(self):
        """Create or get test user for API testing"""
        try:
            # Try to get existing test user
            self.test_user = User.objects.get(phonenumber='712345678')
            # Ensure known password for authentication
            self.test_user.set_password('testpass123')
            self.test_user.role = 'AGENT'
            self.test_user.save()
            print("✓ Found existing test user")
        except User.DoesNotExist:
            # Create new test user
            self.test_user = User.objects.create_user(
                phonenumber='712345678',
                email='test@patabima.com',
                password='testpass123',
                role='AGENT'
            )
            
            # Create staff user profile if needed
            from app.models import StaffUserProfile
            if not hasattr(self.test_user, 'staff_user_profile'):
                StaffUserProfile.objects.create(
                    user=self.test_user,
                    full_names='Test Agent',
                    agent_code=99999,
                    agent_prefix='AGT'
                )
            print("✓ Created new test user")
        
        return self.test_user
    
    def authenticate_user(self):
        """Authenticate test user and get token using 2-step OTP flow"""
        base_payload = {
            'phonenumber': '712345678',
            'password': 'testpass123'
        }

        try:
            # Step 1: request OTP
            resp_login = requests.post(f"{API_BASE}/auth/login", json=base_payload)
            if resp_login.status_code != 200:
                print(f"✗ Login step failed: {resp_login.status_code} - {resp_login.text}")
                return False
            otp_code = resp_login.json().get('otp_code')
            if not otp_code:
                print("✗ No OTP code returned from login")
                return False

            # Step 2: verify OTP and obtain JWT
            verify_payload = {**base_payload, 'code': otp_code}
            resp_auth = requests.post(f"{API_BASE}/auth/auth_login", json=verify_payload)
            if resp_auth.status_code != 200:
                print(f"✗ OTP verification failed: {resp_auth.status_code} - {resp_auth.text}")
                return False
            data = resp_auth.json()
            # API returns 'access' for JWT access token
            self.auth_token = data.get('access') or data.get('access_token') or data.get('token')
            if not self.auth_token:
                print("✗ No access token in response")
                return False
            print("✓ User authenticated successfully")
            return True
        except Exception as e:
            print(f"✗ Authentication error: {e}")
            return False
    
    def test_direct_model_creation(self):
        """Test creating ManualQuote directly through Django model"""
        print("\n=== Testing Direct Model Creation ===")
        
        try:
            # Test data for medical quote
            medical_data = {
                'client_name': 'John Doe',
                'age': 35,
                'client_type': 'INDIVIDUAL',
                'cover_limit': 500000,
                'medical_conditions': 'None',
                'contact_phone': '0712345678',
                'contact_email': 'john.doe@email.com'
            }
            
            # Create manual quote with explicit reference generation
            reference = ManualQuote.generate_reference('MEDICAL')
            
            quote = ManualQuote(
                id=uuid.uuid4(),  # Explicitly set the UUID
                reference=reference,
                line_key='MEDICAL',
                agent=self.test_user,
                payload=medical_data,
                preferred_underwriters=['MADISON', 'BRITAM'],
                status='PENDING_ADMIN_REVIEW'
            )
            quote.save()
            
            print(f"✓ Created manual quote: {quote.reference}")
            print(f"  - Line Key: {quote.line_key}")
            print(f"  - Agent: {quote.agent.phonenumber}")
            print(f"  - Status: {quote.status}")
            print(f"  - Payload: {quote.payload}")
            
            # Test retrieval
            retrieved_quote = ManualQuote.objects.get(reference=quote.reference)
            print(f"✓ Successfully retrieved quote: {retrieved_quote.reference}")
            
            return quote
            
        except Exception as e:
            print(f"✗ Model creation failed: {e}")
            return None
    
    def test_api_endpoints(self):
        """Test API endpoints for manual quotes"""
        print("\n=== Testing API Endpoints ===")
        
        # Headers for authenticated requests
        headers = {}
        if self.auth_token:
            headers['Authorization'] = f'Bearer {self.auth_token}'
        
        # Test 1: Create manual quote via API
        print("Testing quote creation...")
        quote_data = {
            'line_key': 'MEDICAL',
            'payload': {
                'client_name': 'Jane Smith',
                'age': 28,
                'client_type': 'INDIVIDUAL',
                'cover_limit': 750000,
                'medical_conditions': 'Diabetes',
                'contact_phone': '0798765432',
                'contact_email': 'jane.smith@email.com'
            },
            'preferred_underwriters': ['JUBILEE', 'MADISON']
        }
        
        try:
            response = requests.post(
                f"{API_BASE}/manual_quotes",
                json=quote_data,
                headers=headers
            )
            
            if response.status_code == 201:
                created_quote = response.json()
                print(f"✓ Quote created via API: {created_quote.get('reference')}")
                quote_reference = created_quote.get('reference')
            else:
                print(f"✗ Quote creation failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"✗ API creation error: {e}")
            return False
        
        # Test 2: List quotes
        print("Testing quote listing...")
        try:
            response = requests.get(f"{API_BASE}/manual_quotes", headers=headers)
            if response.status_code == 200:
                quotes_data = response.json()
                quotes_count = len(quotes_data.get('results', []))
                print(f"✓ Retrieved {quotes_count} quotes")
                
                # Show medical quotes
                medical_quotes = [q for q in quotes_data.get('results', []) if q.get('line_key') == 'MEDICAL']
                print(f"  - Medical quotes: {len(medical_quotes)}")
                
            else:
                print(f"✗ Quote listing failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"✗ API listing error: {e}")
            return False
        
        # Test 3: Get specific quote details
        if quote_reference:
            print("Testing quote details...")
            try:
                response = requests.get(f"{API_BASE}/manual_quotes/{quote_reference}", headers=headers)
                if response.status_code == 200:
                    quote_details = response.json()
                    print(f"✓ Retrieved quote details: {quote_details.get('reference')}")
                    print(f"  - Status: {quote_details.get('status')}")
                    print(f"  - Client: {quote_details.get('payload', {}).get('client_name')}")
                else:
                    print(f"✗ Quote details failed: {response.status_code}")
                    return False
                    
            except Exception as e:
                print(f"✗ API details error: {e}")
                return False
        
        return True
    
    def test_admin_endpoints(self):
        """Test admin endpoints (if user has admin privileges)"""
        print("\n=== Testing Admin Endpoints ===")
        
        headers = {}
        if self.auth_token:
            headers['Authorization'] = f'Bearer {self.auth_token}'
        
        try:
            response = requests.get(f"{API_BASE}/admin/manual_quotes", headers=headers)
            if response.status_code == 200:
                admin_quotes = response.json()
                print(f"✓ Admin can access all quotes: {len(admin_quotes.get('results', []))}")
            elif response.status_code == 403:
                print("ℹ User doesn't have admin privileges (expected for agent)")
            else:
                print(f"? Admin endpoint response: {response.status_code}")
                
        except Exception as e:
            print(f"✗ Admin endpoint error: {e}")
    
    def verify_database_state(self):
        """Verify the database state after tests"""
        print("\n=== Database Verification ===")
        
        try:
            total_quotes = ManualQuote.objects.count()
            medical_quotes = ManualQuote.objects.filter(line_key='MEDICAL').count()
            pending_quotes = ManualQuote.objects.filter(status='PENDING_ADMIN_REVIEW').count()
            
            print(f"✓ Total quotes in database: {total_quotes}")
            print(f"✓ Medical quotes: {medical_quotes}")
            print(f"✓ Pending quotes: {pending_quotes}")
            
            # Show recent quotes
            recent_quotes = ManualQuote.objects.filter(line_key='MEDICAL').order_by('-created_at')[:3]
            print(f"\nRecent Medical Quotes:")
            for quote in recent_quotes:
                print(f"  - {quote.reference}: {quote.payload.get('client_name', 'Unknown')} ({quote.status})")
                
        except Exception as e:
            print(f"✗ Database verification error: {e}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🧪 Starting Medical Quote Backend Tests")
        print("=" * 50)
        
        # Setup
        if not self.setup_test_user():
            print("✗ Failed to setup test user")
            return False
        
        # Test direct model access
        direct_quote = self.test_direct_model_creation()
        if not direct_quote:
            print("✗ Direct model test failed")
            return False
        
        # Try authentication (optional for API tests)
        auth_success = self.authenticate_user()
        if not auth_success:
            print("⚠ API authentication failed, testing without auth")
        
        # Test API endpoints
        api_success = self.test_api_endpoints()
        if not api_success:
            print("✗ API tests failed")
        
        # Test admin endpoints
        self.test_admin_endpoints()
        
        # Verify database state
        self.verify_database_state()
        
        print("\n" + "=" * 50)
        print("🎉 Backend tests completed!")
        return True

if __name__ == '__main__':
    tester = MedicalQuoteBackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)