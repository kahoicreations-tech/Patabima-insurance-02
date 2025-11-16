"""
DMVIC Endpoint Diagnostic Tool
Tests different endpoint variations to find the correct DMVIC login URL
"""
import requests
import json

# Base URLs to test
BASE_URLS = [
    'https://uat.dmvic.com',
    'https://api.dmvic.com',
    'https://dmvic.com',
]

# Endpoint paths to test
ENDPOINT_PATHS = [
    '/api/V1/Account/Login',  # Current path (getting 404)
    '/api/v1/Account/Login',  # lowercase v1
    '/api/Account/Login',     # No version
    '/Account/Login',         # No api prefix
    '/api/V1/account/login',  # lowercase account/login
    '/api/v1/account/login',  # All lowercase
]

print("=" * 80)
print("DMVIC ENDPOINT DIAGNOSTIC")
print("=" * 80)
print()

results = []

for base_url in BASE_URLS:
    print(f"\nTesting base URL: {base_url}")
    print("-" * 80)
    
    for path in ENDPOINT_PATHS:
        full_url = f"{base_url}{path}"
        
        try:
            # Test with minimal payload (will get auth error but not 404 if endpoint exists)
            response = requests.post(
                full_url,
                json={"Username": "test", "Password": "test", "ClientID": "test"},
                timeout=10,
                verify=False  # Skip SSL verification for testing
            )
            
            status = response.status_code
            
            if status == 404:
                result = "❌ NOT FOUND (404)"
            elif status == 401:
                result = "✅ FOUND! (401 Unauthorized - endpoint exists)"
            elif status == 400:
                result = "✅ FOUND! (400 Bad Request - endpoint exists)"
            elif status == 200:
                result = "✅ FOUND! (200 OK)"
            else:
                result = f"⚠️  STATUS {status}"
            
            print(f"  {path:30} → {result}")
            
            if status != 404:
                results.append({
                    'url': full_url,
                    'status': status,
                    'response': response.text[:200] if response.text else None
                })
                
        except requests.exceptions.Timeout:
            print(f"  {path:30} → ⏱️  TIMEOUT")
        except requests.exceptions.ConnectionError:
            print(f"  {path:30} → 🔌 CONNECTION ERROR")
        except Exception as e:
            print(f"  {path:30} → ❌ ERROR: {str(e)[:50]}")

print()
print("=" * 80)
print("WORKING ENDPOINTS FOUND:")
print("=" * 80)

if results:
    for result in results:
        print(f"\n✅ {result['url']}")
        print(f"   Status: {result['status']}")
        if result['response']:
            print(f"   Response: {result['response']}")
else:
    print("\n❌ NO WORKING ENDPOINTS FOUND!")
    print("\nPossible issues:")
    print("  1. DMVIC UAT environment is down")
    print("  2. API endpoint has changed")
    print("  3. Firewall/network blocking access")
    print("  4. SSL certificate issue")
    print("\nNext steps:")
    print("  - Contact DMVIC support for current UAT endpoint")
    print("  - Check DMVIC API documentation for updates")
    print("  - Verify network/firewall settings")
