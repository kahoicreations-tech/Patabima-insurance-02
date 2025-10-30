"""
Test script for Motor 2 Policy Creation Endpoint
Tests the POST /policies/motor/create endpoint with sample data
"""

import requests
import json
from datetime import datetime

# Django backend URL
BASE_URL = "http://127.0.0.1:8000"  # Adjust if different
LOGIN_URL = f"{BASE_URL}/api/v1/auth/login/"
POLICY_CREATE_URL = f"{BASE_URL}/api/v1/policies/motor/create/"

# Test credentials - replace with actual test user
TEST_CREDENTIALS = {
    "phonenumber": "792865547",  # 9 digits without leading 0
    "password": "Best254#"
}

# Sample policy data matching frontend format
SAMPLE_POLICY_DATA = {
    "quoteId": f"QUOTE-TEST-{datetime.now().strftime('%Y%m%d%H%M%S')}",
    "clientDetails": {
        "fullName": "John Doe",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "phone": "+254712345678",
        "idNumber": "12345678",
        "kraPin": "A001234567Z",
        "postalAddress": "P.O. Box 12345, Nairobi"
    },
    "vehicleDetails": {
        "registration": "KDD 123A",
        "make": "Toyota",
        "model": "Corolla",
        "year": 2020,
        "value": 2000000,
        "chassisNumber": "JT2BG22K0X0123456",
        "engineNumber": "2ZRFE123456",
        "coverStartDate": "2024-10-10"
    },
    "productDetails": {
        "category": "Private",
        "subcategory": "Comprehensive",
        "coverageType": "Comprehensive"
    },
    "underwriterDetails": {
        "id": 1,
        "name": "APA Insurance",
        "code": "APA"
    },
    "premiumBreakdown": {
        "base_premium": 45000,
        "ira_levy": 112.5,
        "training_levy": 112.5,
        "stamp_duty": 40,
        "total_levies": 265,
        "total_amount": 45265
    },
    "paymentDetails": {
        "method": "mpesa",
        "amount": 45265,
        "reference": "TEST-PAYMENT-001"
    },
    "addons": [
        {
            "name": "Excess Protector",
            "amount": 500
        }
    ],
    "documents": [
        {
            "type": "logbook",
            "url": "https://example.com/logbook.pdf",
            "status": "uploaded"
        }
    ]
}


def login():
    """Login and get authentication token"""
    print("\n🔐 Attempting login...")
    try:
        response = requests.post(LOGIN_URL, json=TEST_CREDENTIALS)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('token') or data.get('access')
            print(f"✅ Login successful! Token: {token[:20]}...")
            return token
        else:
            print(f"❌ Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return None


def create_policy(token):
    """Create a motor policy using the API"""
    print("\n📋 Creating motor policy...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        print(f"\n📤 Sending request to: {POLICY_CREATE_URL}")
        print(f"📦 Payload preview:")
        print(f"   - Quote ID: {SAMPLE_POLICY_DATA['quoteId']}")
        print(f"   - Client: {SAMPLE_POLICY_DATA['clientDetails']['fullName']}")
        print(f"   - Vehicle: {SAMPLE_POLICY_DATA['vehicleDetails']['registration']}")
        print(f"   - Premium: KSh {SAMPLE_POLICY_DATA['premiumBreakdown']['total_amount']:,.2f}")
        
        response = requests.post(
            POLICY_CREATE_URL,
            headers=headers,
            json=SAMPLE_POLICY_DATA
        )
        
        print(f"\n📥 Response Status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            data = response.json()
            print("\n✅ Policy created successfully!")
            print(f"\n📄 Policy Details:")
            print(f"   - Policy Number: {data.get('policyNumber')}")
            print(f"   - Policy ID: {data.get('policyId')}")
            print(f"   - Status: {data.get('status')}")
            print(f"   - Submitted At: {data.get('submittedAt')}")
            print(f"   - Message: {data.get('message')}")
            return data
        else:
            print(f"\n❌ Policy creation failed!")
            print(f"Response: {response.text}")
            
            # Try to parse error details
            try:
                error_data = response.json()
                if 'details' in error_data:
                    print(f"\n🔍 Validation Errors:")
                    for field, errors in error_data['details'].items():
                        print(f"   - {field}: {errors}")
            except:
                pass
            
            return None
            
    except Exception as e:
        print(f"\n❌ Request error: {str(e)}")
        return None


def main():
    """Main test function"""
    print("=" * 60)
    print("Motor 2 Policy Creation API Test")
    print("=" * 60)
    
    # Step 1: Login
    token = login()
    if not token:
        print("\n⚠️ Cannot proceed without authentication token")
        print("Please check:")
        print("  1. Django server is running (python manage.py runserver)")
        print("  2. Test credentials are correct")
        print("  3. Login endpoint is accessible")
        return
    
    # Step 2: Create Policy
    policy_data = create_policy(token)
    if policy_data:
        print("\n" + "=" * 60)
        print("✅ TEST PASSED - Policy creation endpoint working!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("❌ TEST FAILED - Check error messages above")
        print("=" * 60)


if __name__ == "__main__":
    main()
