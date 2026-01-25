"""
Test OTP API Endpoints
Run this script to test the OTP send/verify/resend endpoints locally
"""
import requests
import time

BASE_URL = "http://localhost:8000/api/v1/public_app/otp"

def test_send_otp():
    """Test sending OTP"""
    print("\n" + "="*60)
    print("TEST 1: Send OTP")
    print("="*60)
    
    payload = {
        "phone_number": "+254712345678",
        "purpose": "login"
    }
    
    response = requests.post(f"{BASE_URL}/send/", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        print("✅ OTP sent successfully! Check console for the code.")
    else:
        print("❌ Failed to send OTP")
    
    return response.json()

def test_verify_otp(phone_number, otp_code):
    """Test verifying OTP"""
    print("\n" + "="*60)
    print("TEST 2: Verify OTP")
    print("="*60)
    
    payload = {
        "phone_number": phone_number,
        "otp_code": otp_code,
        "purpose": "login"
    }
    
    response = requests.post(f"{BASE_URL}/verify/", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        print("✅ OTP verified successfully!")
    else:
        print("❌ Failed to verify OTP")
    
    return response.json()

def test_verify_wrong_otp(phone_number):
    """Test verifying with wrong OTP"""
    print("\n" + "="*60)
    print("TEST 3: Verify Wrong OTP (should fail)")
    print("="*60)
    
    payload = {
        "phone_number": phone_number,
        "otp_code": "000000",  # Wrong code
        "purpose": "login"
    }
    
    response = requests.post(f"{BASE_URL}/verify/", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 400:
        print("✅ Correctly rejected wrong OTP")
    else:
        print("❌ Should have rejected wrong OTP")
    
    return response.json()

def test_resend_otp(phone_number):
    """Test resending OTP"""
    print("\n" + "="*60)
    print("TEST 4: Resend OTP")
    print("="*60)
    
    payload = {
        "phone_number": phone_number,
        "purpose": "login"
    }
    
    response = requests.post(f"{BASE_URL}/resend/", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        print("✅ OTP resent successfully! Check console for new code.")
    else:
        print("❌ Failed to resend OTP")
    
    return response.json()

def test_rate_limiting(phone_number):
    """Test rate limiting (send OTP twice quickly)"""
    print("\n" + "="*60)
    print("TEST 5: Rate Limiting (send OTP twice)")
    print("="*60)
    
    payload = {
        "phone_number": phone_number,
        "purpose": "login"
    }
    
    # First send
    response1 = requests.post(f"{BASE_URL}/send/", json=payload)
    print(f"First Send - Status: {response1.status_code}")
    
    # Immediate second send (should be rate limited)
    response2 = requests.post(f"{BASE_URL}/send/", json=payload)
    print(f"Second Send - Status: {response2.status_code}")
    print(f"Response: {response2.json()}")
    
    if response2.status_code == 429:
        print("✅ Rate limiting working correctly")
    else:
        print("⚠️ Rate limiting may not be enforced")

def run_all_tests():
    """Run all OTP tests"""
    print("\n" + "="*60)
    print("🧪 OTP API ENDPOINT TESTS")
    print("="*60)
    print("Testing OTP endpoints at:", BASE_URL)
    print("Server should be running at http://localhost:8000")
    print("\nNOTE: Check the Django server console to see the OTP codes!")
    print("="*60)
    
    phone_number = "+254712345678"
    
    try:
        # Test 1: Send OTP
        send_response = test_send_otp()
        
        # Wait a moment
        time.sleep(1)
        
        # Test 2: Verify wrong OTP
        test_verify_wrong_otp(phone_number)
        
        # Test 3: Resend OTP (wait 6 seconds to avoid rate limit)
        print("\nWaiting 6 seconds to test resend (avoid rate limit)...")
        time.sleep(6)
        test_resend_otp(phone_number)
        
        # Test 4: Rate limiting
        print("\nWaiting 6 seconds before rate limit test...")
        time.sleep(6)
        test_rate_limiting(phone_number)
        
        # Final message
        print("\n" + "="*60)
        print("✅ TESTS COMPLETED!")
        print("="*60)
        print("\nTo verify OTP manually:")
        print("1. Check the Django server console for the OTP code")
        print("2. Use Postman/curl to POST to /api/v1/public_app/auth/otp/verify/")
        print("3. Body: {\"phone_number\": \"+254712345678\", \"otp_code\": \"XXXXXX\", \"purpose\": \"login\"}")
        print("="*60)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to Django server")
        print("Make sure the server is running: python manage.py runserver")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")

if __name__ == "__main__":
    run_all_tests()
