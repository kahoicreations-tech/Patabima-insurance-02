"""
Test DMVIC Backend Endpoints
Tests the newly created DMVIC REST API endpoints
"""

import requests
import json
import sys

# Configuration
BASE_URL = "http://127.0.0.1:8000/api"
LOGIN_ENDPOINT = f"{BASE_URL}/auth/login"
DMVIC_ENDPOINTS = {
    "search_vehicle": f"{BASE_URL}/dmvic/search-vehicle/",
    "validate_double_insurance": f"{BASE_URL}/dmvic/validate-double-insurance/",
    "preview_certificate": f"{BASE_URL}/dmvic/preview-certificate/",
    "issue_certificate": f"{BASE_URL}/dmvic/issue-certificate/",
    "confirm_issuance": f"{BASE_URL}/dmvic/confirm-issuance/",
    "get_certificate_pdf": f"{BASE_URL}/dmvic/get-certificate-pdf/",
}

def login():
    """Login and get auth token"""
    print("🔐 Logging in...")
    
    # Replace with actual test credentials
    credentials = {
        "username": "test@patabima.com",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(LOGIN_ENDPOINT, json=credentials)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access')
            print(f"✅ Login successful! Token: {token[:20]}...")
            return token
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return None

def test_search_vehicle(token):
    """Test vehicle search endpoint"""
    print("\n🚗 Testing Vehicle Search...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "registration_number": "KCA123A"
    }
    
    try:
        response = requests.post(
            DMVIC_ENDPOINTS["search_vehicle"],
            json=payload,
            headers=headers
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Vehicle search endpoint working!")
        else:
            print("⚠️ Vehicle search returned non-200 status")
        
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Vehicle search error: {str(e)}")
        return False

def test_endpoint_exists(endpoint_name, token):
    """Test if endpoint exists and returns proper response"""
    print(f"\n📍 Testing {endpoint_name} endpoint...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Send minimal payload to check endpoint exists
    payload = {}
    
    try:
        response = requests.post(
            DMVIC_ENDPOINTS[endpoint_name],
            json=payload,
            headers=headers
        )
        
        print(f"Status Code: {response.status_code}")
        
        # Any response (even 400 bad request) means endpoint exists
        if response.status_code in [200, 400, 404]:
            if response.status_code == 404:
                print(f"❌ Endpoint not found: {DMVIC_ENDPOINTS[endpoint_name]}")
                return False
            else:
                print(f"✅ Endpoint exists and accessible")
                return True
        else:
            print(f"Response: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def main():
    print("=" * 60)
    print("DMVIC Backend Endpoints Test")
    print("=" * 60)
    
    # Login
    token = login()
    if not token:
        print("\n❌ Cannot proceed without authentication token")
        print("💡 Make sure Django backend is running and credentials are correct")
        sys.exit(1)
    
    # Test all endpoints
    results = {}
    
    # Test vehicle search (should work)
    results["search_vehicle"] = test_search_vehicle(token)
    
    # Test other endpoints (check they exist)
    for endpoint_name in ["validate_double_insurance", "preview_certificate", 
                          "issue_certificate", "confirm_issuance", "get_certificate_pdf"]:
        results[endpoint_name] = test_endpoint_exists(endpoint_name, token)
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Results Summary")
    print("=" * 60)
    
    for endpoint, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {endpoint}")
    
    passed_count = sum(results.values())
    total_count = len(results)
    
    print("\n" + "=" * 60)
    print(f"Total: {passed_count}/{total_count} endpoints working")
    print("=" * 60)
    
    if passed_count == total_count:
        print("\n🎉 All endpoints are accessible!")
        print("⏳ Preview/Issue endpoints may return ER001 until DMVIC enables them")
    else:
        print("\n⚠️ Some endpoints failed. Check Django backend logs.")

if __name__ == "__main__":
    main()
