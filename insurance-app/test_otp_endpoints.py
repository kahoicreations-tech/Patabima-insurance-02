"""
Test Script for OTP Endpoints
Tests send, verify, and resend OTP functionality
"""
import requests
import json

# Base URL (using /api/insurance/ path from insurance/urls.py)
BASE_URL = 'http://127.0.0.1:8000/api/insurance'

# Test data
TEST_PHONE = '0712345678'
TEST_PURPOSE = 'LOGIN'


def print_response(title, response):
    """Pretty print API response"""
    print(f"\n{'='*60}")
    print(f"{title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    print(f"Response:")
    print(json.dumps(response.json(), indent=2))
    print(f"{'='*60}\n")


def test_send_otp():
    """Test sending OTP"""
    print("\n🔵 TEST 1: Send OTP")
    
    payload = {
        "phone_number": TEST_PHONE,
        "purpose": TEST_PURPOSE
    }
    
    response = requests.post(f'{BASE_URL}/auth/otp/send', json=payload)
    print_response("SEND OTP RESPONSE", response)
    
    if response.status_code == 200:
        data = response.json()
        otp_code = data.get('otp_code')
        print(f"✅ OTP Code (for testing): {otp_code}")
        return otp_code
    else:
        print(f"❌ Failed to send OTP")
        return None


def test_verify_otp(otp_code):
    """Test verifying OTP"""
    print("\n🔵 TEST 2: Verify OTP")
    
    payload = {
        "phone_number": TEST_PHONE,
        "code": otp_code,
        "purpose": TEST_PURPOSE
    }
    
    response = requests.post(f'{BASE_URL}/auth/otp/verify', json=payload)
    print_response("VERIFY OTP RESPONSE", response)
    
    if response.status_code == 200:
        print(f"✅ OTP verified successfully")
        return True
    else:
        print(f"❌ Failed to verify OTP")
        return False


def test_verify_wrong_otp():
    """Test verifying with wrong OTP"""
    print("\n🔵 TEST 3: Verify with Wrong OTP (should fail)")
    
    payload = {
        "phone_number": TEST_PHONE,
        "code": "999999",  # Wrong code
        "purpose": TEST_PURPOSE
    }
    
    response = requests.post(f'{BASE_URL}/auth/otp/verify', json=payload)
    print_response("VERIFY WRONG OTP RESPONSE", response)
    
    if response.status_code == 400:
        print(f"✅ Correctly rejected wrong OTP")
        return True
    else:
        print(f"❌ Should have rejected wrong OTP")
        return False


def test_resend_otp():
    """Test resending OTP"""
    print("\n🔵 TEST 4: Resend OTP")
    
    payload = {
        "phone_number": TEST_PHONE,
        "purpose": TEST_PURPOSE
    }
    
    response = requests.post(f'{BASE_URL}/auth/otp/resend', json=payload)
    print_response("RESEND OTP RESPONSE", response)
    
    if response.status_code == 200:
        data = response.json()
        otp_code = data.get('otp_code')
        print(f"✅ OTP Resent. New Code: {otp_code}")
        return otp_code
    else:
        print(f"❌ Failed to resend OTP")
        return None


def test_phone_validation():
    """Test phone number validation"""
    print("\n🔵 TEST 5: Phone Validation (invalid phone)")
    
    test_cases = [
        {"phone_number": "123", "purpose": TEST_PURPOSE},  # Too short
        {"phone_number": "abcdefghij", "purpose": TEST_PURPOSE},  # Non-numeric
        {"phone_number": "+1234567890", "purpose": TEST_PURPOSE},  # Non-Kenyan
    ]
    
    for i, payload in enumerate(test_cases, 1):
        print(f"\n  Test Case {i}: {payload['phone_number']}")
        response = requests.post(f'{BASE_URL}/auth/otp/send', json=payload)
        print(f"  Status: {response.status_code}")
        if response.status_code == 400:
            print(f"  ✅ Correctly rejected invalid phone")
        else:
            print(f"  ❌ Should have rejected invalid phone")


def test_different_formats():
    """Test different phone number formats"""
    print("\n🔵 TEST 6: Different Phone Formats (all should work)")
    
    test_phones = [
        "0712345678",      # Standard format
        "712345678",       # Without leading 0
        "+254712345678",   # International format
        "254712345678",    # International without +
    ]
    
    for phone in test_phones:
        print(f"\n  Testing: {phone}")
        payload = {
            "phone_number": phone,
            "purpose": "VERIFY"
        }
        response = requests.post(f'{BASE_URL}/auth/otp/send', json=payload)
        if response.status_code == 200:
            print(f"  ✅ Accepted {phone}")
        else:
            print(f"  ❌ Rejected {phone}: {response.json().get('detail')}")


if __name__ == '__main__':
    print("\n" + "="*60)
    print("OTP ENDPOINT TESTING")
    print("="*60)
    
    try:
        # Test 1: Send OTP
        otp_code = test_send_otp()
        
        if otp_code:
            # Test 2: Verify correct OTP
            test_verify_otp(otp_code)
            
            # Test 3: Verify wrong OTP
            test_verify_wrong_otp()
            
            # Test 4: Resend OTP
            new_otp = test_resend_otp()
            
            # Test 5: Phone validation
            test_phone_validation()
            
            # Test 6: Different formats
            test_different_formats()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS COMPLETED")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
