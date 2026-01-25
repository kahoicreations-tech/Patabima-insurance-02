"""
Test Motor3 Third-Party Policy Submission
Simulates the frontend Step8_Submission.js payload
"""

import requests
import json
from datetime import datetime, timedelta
import os

# Backend URL (adjust if needed)
BASE_URL = "http://localhost:8000"

# Test credentials (set via env vars; do NOT hardcode real credentials)
TEST_PHONE = os.getenv("PB_TEST_PHONE", "0700000000")  # 10 digits, no country code
TEST_PASSWORD = os.getenv("PB_TEST_PASSWORD", "CHANGE_ME")
TEST_EMAIL = os.getenv("PB_TEST_EMAIL", "motor3test@example.com")

def ensure_test_user_exists():
    """Create test user if doesn't exist"""
    signup_url = f"{BASE_URL}/api/v1/public_app/auth/signup"
    payload = {
        "phonenumber": TEST_PHONE,
        "password": TEST_PASSWORD,
        "email": TEST_EMAIL,
        "first_name": "Test",
        "last_name": "Agent"
    }
    
    print(f"📝 Creating/verifying test user {TEST_PHONE}...")
    response = requests.post(signup_url, json=payload)
    
    if response.status_code in [200, 201]:
        print(f"✅ Test user ready")
        return True
    elif response.status_code == 400:
        # User likely already exists
        print(f"ℹ️  Test user exists (signup returned 400)")
        return True
    else:
        print(f"⚠️  Signup response: {response.status_code}")
        print(response.text[:200])
        return True  # Proceed anyway, maybe user exists

def get_auth_token():
    """Authenticate and get JWT token"""
    login_url = f"{BASE_URL}/api/v1/public_app/auth/login"
    payload = {
        "phonenumber": TEST_PHONE,
        "password": TEST_PASSWORD
    }
    
    print(f"🔐 Step 1: Requesting OTP for {TEST_PHONE}...")
    response = requests.post(login_url, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        otp_code = data.get('otp_code')
        
        if otp_code:
            print(f"✅ OTP received: {otp_code}")
            
            # Step 2: Verify OTP
            verify_url = f"{BASE_URL}/api/v1/public_app/auth/auth_login"
            verify_payload = {
                "phonenumber": TEST_PHONE,
                "password": TEST_PASSWORD,
                "code": otp_code
            }
            
            print(f"🔐 Step 2: Verifying OTP...")
            verify_response = requests.post(verify_url, json=verify_payload)
            
            if verify_response.status_code == 200:
                verify_data = verify_response.json()
                token = verify_data.get('access') or verify_data.get('token') or verify_data.get('access_token')
                print(f"✅ Authentication successful - Token obtained")
                return token
            else:
                print(f"❌ OTP verification failed: {verify_response.status_code}")
                print(verify_response.text)
                return None
        else:
            # Direct login without OTP (shouldn't happen but handle it)
            token = data.get('access') or data.get('token') or data.get('access_token')
            if token:
                print(f"✅ Direct authentication successful")
                return token
            else:
                print(f"❌ No token or OTP in response")
                return None
    else:
        print(f"❌ Authentication failed: {response.status_code}")
        print(response.text)
        return None

def test_policy_creation(token):
    """Test policy creation endpoint"""
    create_url = f"{BASE_URL}/api/v1/policies/motor/create/"
    
    # Prepare test payload (matching Step8_Submission.js structure)
    cover_start = datetime.now().strftime('%Y-%m-%d')
    
    # Generate unique registration to avoid duplicate policy errors
    import random
    unique_num = random.randint(100, 999)
    test_registration = f"KDA{unique_num}A"
    
    payload = {
        "quoteId": None,
        "clientDetails": {
            "fullName": "John Doe Test",
            "phone": "0792865542",
            "email": "john.doe.test@example.com",
            "idNumber": "12345678",
            "kraPin": "A001234567P",
            "address": "Nairobi, Kenya"
        },
        "vehicleDetails": {
            "registration": test_registration,
            "make": "Toyota",
            "model": "Corolla",
            "year": 2020,
            "coverStartDate": cover_start,
            "chasisNumber": "CHASSIS123456789",
            "engineNumber": "ENGINE123456"
        },
        "productDetails": {
            "category": "PRIVATE",
            "subcategory": "PRIVATE_THIRD_PARTY",
            "coverageType": "THIRD_PARTY"
        },
        "underwriterDetails": {
            "name": "Madison Insurance",
            "code": "MADISON"
        },
        "premiumBreakdown": {
            "base_premium": 2975,
            "training_levy": 7.44,
            "pcf_levy": 7.44,
            "stamp_duty": 40,
            "total_amount": 3029.88
        },
        "paymentDetails": {
            "method": "MPESA",
            "amount": 3029.88,
            "status": "SUCCESS",
            "transaction_id": "TXN-TEST-" + datetime.now().strftime('%Y%m%d%H%M%S')
        },
        "documents": []
    }
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print(f"\n📤 Sending policy creation request...")
    print(f"Endpoint: {create_url}")
    print(f"\nPayload Preview:")
    print(json.dumps(payload, indent=2))
    print("\n" + "="*80)
    
    response = requests.post(create_url, json=payload, headers=headers)
    
    print(f"\n📥 Response Status: {response.status_code}")
    print("="*80)
    
    try:
        response_data = response.json()
        print(json.dumps(response_data, indent=2))
        
        if response.status_code in [200, 201]:
            print("\n✅ Policy creation successful!")
            return response_data
        else:
            print(f"\n❌ Policy creation failed")
            return None
            
    except json.JSONDecodeError:
        print("Response is not JSON:")
        print(response.text)
        return None

def test_policy_activation(token, policy_number):
    """Test policy activation endpoint"""
    activate_url = f"{BASE_URL}/api/v1/policies/motor/{policy_number}/activate/"
    
    payload = {
        "transaction_id": "TXN-TEST-" + datetime.now().strftime('%Y%m%d%H%M%S'),
        "payment_method": "MPESA",
        "status": "SUCCESS"
    }
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print(f"\n📤 Sending policy activation request...")
    print(f"Endpoint: {activate_url}")
    print(f"Policy Number: {policy_number}")
    print("\n" + "="*80)
    
    response = requests.post(activate_url, json=payload, headers=headers)
    
    print(f"\n📥 Response Status: {response.status_code}")
    print("="*80)
    
    try:
        response_data = response.json()
        print(json.dumps(response_data, indent=2))
        
        if response.status_code == 200:
            print("\n✅ Policy activation successful!")
            
            # Check if documents are available
            documents = response_data.get('documents', {})
            if documents:
                print("\n📄 Documents Generated:")
                for doc_type, url in documents.items():
                    status = "✓" if url else "✗"
                    print(f"  {status} {doc_type}: {url or 'Not available'}")
            
            return response_data
        else:
            print(f"\n❌ Policy activation failed")
            return None
            
    except json.JSONDecodeError:
        print("Response is not JSON:")
        print(response.text)
        return None

def main():
    print("="*80)
    print("Motor3 Third-Party Policy Submission Test")
    print("="*80)
    
    # Step 0: Ensure test user exists
    ensure_test_user_exists()
    
    # Step 1: Authenticate
    token = get_auth_token()
    if not token:
        print("\n❌ Cannot proceed without authentication")
        return
    
    # Step 2: Create policy
    created_policy = test_policy_creation(token)
    if not created_policy:
        print("\n❌ Policy creation failed, stopping test")
        return
    
    policy_number = created_policy.get('policyNumber')
    if not policy_number:
        print("\n❌ No policy number returned, stopping test")
        return
    
    # Step 3: Activate policy
    activated_policy = test_policy_activation(token, policy_number)
    
    # Summary
    print("\n" + "="*80)
    print("Test Summary")
    print("="*80)
    if created_policy and activated_policy:
        print("✅ Policy creation: SUCCESS")
        print("✅ Policy activation: SUCCESS")
        print(f"\nPolicy Number: {policy_number}")
        print(f"Status: {activated_policy.get('status', 'UNKNOWN')}")
    elif created_policy:
        print("✅ Policy creation: SUCCESS")
        print("❌ Policy activation: FAILED")
    else:
        print("❌ Policy creation: FAILED")
    print("="*80)

if __name__ == "__main__":
    main()
