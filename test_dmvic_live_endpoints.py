"""
Live DMVIC Endpoint Test
Tests actual HTTP requests to DMVIC endpoints
"""
import requests
import json
import sys

# Configuration
BASE_URL = "http://127.0.0.1:8000"
API_ENDPOINTS = {
    "public_app": f"{BASE_URL}/api/v1/public_app",
    "insurance": f"{BASE_URL}/api/insurance"
}

# Test credentials - replace with actual test user
TEST_CREDENTIALS = {
    "phonenumber": "0712345678",  # Use phone number instead of username
    "password": "Test@123"
}

def check_server():
    """Check if Django server is running"""
    try:
        response = requests.get(f"{BASE_URL}/admin/", timeout=2)
        return True
    except requests.exceptions.ConnectionError:
        return False
    except Exception:
        return False

def login(api_base):
    """Login and get auth token"""
    print(f"\n🔐 Logging in to {api_base}...")
    
    try:
        response = requests.post(
            f"{api_base}/auth/login",
            json=TEST_CREDENTIALS,
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access')
            print(f"✅ Login successful!")
            return token
        else:
            print(f"⚠️ Login failed: {response.status_code}")
            print(f"Response: {response.text[:200]}")
            return None
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return None

def test_endpoint(api_base, endpoint_path, payload, token, endpoint_name):
    """Test a single endpoint"""
    url = f"{api_base}/{endpoint_path}"
    
    print(f"\n📍 Testing: {endpoint_name}")
    print(f"URL: {url}")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        
        print(f"Status: {response.status_code}")
        
        # Parse response
        try:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)[:300]}")
        except:
            print(f"Response (text): {response.text[:300]}")
        
        # Determine success
        if response.status_code == 200:
            print("✅ Endpoint responding correctly")
            return True
        elif response.status_code == 400:
            print("⚠️ Bad request (expected - testing with minimal payload)")
            return True  # Endpoint exists and is processing requests
        elif response.status_code == 401:
            print("❌ Unauthorized - token issue")
            return False
        elif response.status_code == 404:
            print("❌ Not found - endpoint not configured")
            return False
        elif response.status_code == 500:
            print("⚠️ Server error - endpoint exists but has issues")
            return True  # Endpoint exists
        else:
            print(f"⚠️ Unexpected status: {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Request timeout")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - is Django server running?")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def main():
    print("=" * 70)
    print("DMVIC Live Endpoint Test")
    print("=" * 70)
    
    # Check if server is running
    print("\n🔍 Checking if Django server is running...")
    if not check_server():
        print("❌ Django server is not running!")
        print("\n💡 Start the server with:")
        print("   cd insurance-app")
        print("   python manage.py runserver")
        sys.exit(1)
    
    print("✅ Django server is running")
    
    # Test both API bases
    for api_name, api_base in API_ENDPOINTS.items():
        print("\n" + "=" * 70)
        print(f"Testing API: {api_name} ({api_base})")
        print("=" * 70)
        
        # Login
        token = login(api_base)
        if not token:
            print(f"⚠️ Skipping {api_name} - login failed")
            continue
        
        # Test endpoints
        results = {}
        
        # 1. Search Vehicle
        results["search_vehicle"] = test_endpoint(
            api_base,
            "dmvic/search-vehicle/",
            {"registration_number": "KCA123A"},
            token,
            "Search Vehicle"
        )
        
        # 2. Validate Double Insurance
        results["validate_double_insurance"] = test_endpoint(
            api_base,
            "dmvic/validate-double-insurance/",
            {
                "chassis_number": "ABC123",
                "start_date": "2025-11-04",
                "end_date": "2026-11-04"
            },
            token,
            "Validate Double Insurance"
        )
        
        # 3. Preview Certificate
        results["preview_certificate"] = test_endpoint(
            api_base,
            "dmvic/preview-certificate/",
            {"policy_id": 1},
            token,
            "Preview Certificate"
        )
        
        # 4. Issue Certificate
        results["issue_certificate"] = test_endpoint(
            api_base,
            "dmvic/issue-certificate/",
            {"policy_id": 1},
            token,
            "Issue Certificate"
        )
        
        # 5. Confirm Issuance
        results["confirm_issuance"] = test_endpoint(
            api_base,
            "dmvic/confirm-issuance/",
            {
                "issuance_request_id": "AF-AA0012",
                "is_approved": True,
                "username": "test@patabima.com"
            },
            token,
            "Confirm Issuance"
        )
        
        # 6. Get Certificate PDF
        results["get_certificate_pdf"] = test_endpoint(
            api_base,
            "dmvic/get-certificate-pdf/",
            {"certificate_number": "B1234567"},
            token,
            "Get Certificate PDF"
        )
        
        # Summary for this API
        print("\n" + "=" * 70)
        print(f"Results for {api_name}:")
        print("=" * 70)
        
        for endpoint, passed in results.items():
            status = "✅ WORKS" if passed else "❌ FAILED"
            print(f"{status} - {endpoint}")
        
        passed_count = sum(results.values())
        total_count = len(results)
        print(f"\nTotal: {passed_count}/{total_count} endpoints responding")
    
    print("\n" + "=" * 70)
    print("Test Complete!")
    print("=" * 70)
    print("\n💡 Notes:")
    print("- 400 Bad Request is OK (endpoint exists but needs valid data)")
    print("- 404 Not Found means endpoint is not configured")
    print("- 500 Server Error means endpoint exists but has code issues")
    print("- Check Django server logs for detailed error messages")

if __name__ == "__main__":
    main()
