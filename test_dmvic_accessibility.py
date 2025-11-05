"""
DMVIC Endpoint Accessibility Test
Tests if DMVIC endpoints are accessible (without authentication)
"""
import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def check_server():
    """Check if Django server is running"""
    try:
        response = requests.get(f"{BASE_URL}/admin/", timeout=2)
        return True
    except:
        return False

def test_endpoint_exists(url, endpoint_name):
    """Test if endpoint exists by checking response"""
    print(f"\n📍 {endpoint_name}")
    print(f"   URL: {url}")
    
    try:
        # Send request without auth (should get 401 or 403, not 404)
        response = requests.post(url, json={}, timeout=5)
        
        print(f"   Status: {response.status_code}", end=" ")
        
        if response.status_code == 404:
            print("❌ NOT FOUND - Endpoint not configured")
            return False
        elif response.status_code in [401, 403]:
            print("✅ EXISTS - Authentication required (expected)")
            return True
        elif response.status_code == 400:
            print("✅ EXISTS - Bad request (endpoint is processing)")
            return True
        elif response.status_code == 200:
            print("✅ EXISTS - Endpoint working!")
            return True
        elif response.status_code == 500:
            print("⚠️ EXISTS - Server error (endpoint exists but has code issue)")
            return True
        else:
            print(f"⚠️ UNKNOWN - Status {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print("   ❌ Timeout")
        return False
    except requests.exceptions.ConnectionError:
        print("   ❌ Connection error")
        return False
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False

def main():
    print("=" * 80)
    print("DMVIC Endpoint Accessibility Test")
    print("=" * 80)
    
    # Check server
    print("\n🔍 Checking Django server...")
    if not check_server():
        print("❌ Django server not running!")
        print("\n💡 Start server: cd insurance-app && python manage.py runserver")
        sys.exit(1)
    print("✅ Server is running\n")
    
    # Test endpoints on both API paths
    apis = [
        ("public_app", f"{BASE_URL}/api/v1/public_app/dmvic"),
        ("insurance", f"{BASE_URL}/api/insurance/dmvic")
    ]
    
    all_results = {}
    
    for api_name, api_base in apis:
        print("=" * 80)
        print(f"API: {api_name} ({api_base})")
        print("=" * 80)
        
        endpoints = [
            ("search-vehicle/", "Search Vehicle"),
            ("validate-double-insurance/", "Validate Double Insurance"),
            ("preview-certificate/", "Preview Certificate"),
            ("issue-certificate/", "Issue Certificate"),
            ("confirm-issuance/", "Confirm Certificate Issuance"),
            ("get-certificate-pdf/", "Get Certificate PDF"),
        ]
        
        results = {}
        for path, name in endpoints:
            url = f"{api_base}/{path}"
            results[name] = test_endpoint_exists(url, name)
        
        all_results[api_name] = results
        
        # Summary
        print("\n" + "-" * 80)
        passed = sum(results.values())
        total = len(results)
        print(f"Summary: {passed}/{total} endpoints accessible")
        print("-" * 80)
    
    # Final summary
    print("\n" + "=" * 80)
    print("FINAL SUMMARY")
    print("=" * 80)
    
    for api_name, results in all_results.items():
        print(f"\n{api_name.upper()}:")
        for endpoint, status in results.items():
            symbol = "✅" if status else "❌"
            print(f"  {symbol} {endpoint}")
    
    # Overall result
    all_passed = all(all(r.values()) for r in all_results.values())
    
    print("\n" + "=" * 80)
    if all_passed:
        print("🎉 ALL ENDPOINTS ARE ACCESSIBLE!")
        print("✅ DMVIC backend URLs are properly configured")
    else:
        print("⚠️ SOME ENDPOINTS ARE NOT ACCESSIBLE")
        print("Check Django URL configuration")
    print("=" * 80)
    
    print("\n💡 Expected Status Codes:")
    print("   • 401/403 = Authentication required (endpoint exists)")
    print("   • 400 = Bad request (endpoint exists and processing)")
    print("   • 404 = Not found (endpoint not configured)")
    print("   • 500 = Server error (endpoint exists but code issue)")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
