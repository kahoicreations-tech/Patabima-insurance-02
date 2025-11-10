"""
Test Motor2 Metadata Version Endpoint
Tests the new /api/v1/motor2/metadata/version/ endpoint

Run: python test_motor2_metadata_endpoint.py
"""

import requests
import json
from datetime import datetime

# Test configuration
BASE_URLS = [
    'http://127.0.0.1:8000',  # Local development
    'http://10.0.2.2:8000',   # Android emulator
]

ENDPOINT = '/api/v1/motor2/metadata/version/'

def test_metadata_endpoint():
    """Test the Motor2 metadata version endpoint"""
    
    print("🔍 Testing Motor2 Metadata Version Endpoint")
    print("=" * 60)
    
    for base_url in BASE_URLS:
        url = f"{base_url}{ENDPOINT}"
        print(f"\n📍 Testing: {url}")
        
        try:
            # Make GET request (no auth required - AllowAny)
            response = requests.get(url, timeout=5)
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                print("   ✅ SUCCESS - Response:")
                print(f"      Version: {data.get('version')}")
                print(f"      Last Updated: {data.get('last_updated')}")
                print(f"      Total Categories: {data.get('total_categories')}")
                print(f"      Total Subcategories: {data.get('total_subcategories')}")
                print(f"      Schema Version: {data.get('schema_version')}")
                
                # Validate expected fields
                required_fields = ['version', 'last_updated', 'total_categories', 
                                 'total_subcategories', 'category_versions', 'schema_version']
                
                missing_fields = [f for f in required_fields if f not in data]
                if missing_fields:
                    print(f"   ⚠️  Missing fields: {missing_fields}")
                else:
                    print("   ✅ All required fields present")
                
                # Pretty print full response
                print("\n   📦 Full Response:")
                print("   " + json.dumps(data, indent=6))
                
                return True
                
            else:
                print(f"   ❌ ERROR - Status {response.status_code}")
                print(f"      Response: {response.text[:200]}")
                
        except requests.exceptions.ConnectionError:
            print(f"   ⚠️  Connection failed (server not running?)")
        except requests.exceptions.Timeout:
            print(f"   ⚠️  Request timeout")
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
    
    print("\n" + "=" * 60)
    print("❌ All endpoints failed. Is the Django server running?")
    print("   Start server: python insurance-app/manage.py runserver")
    return False

if __name__ == '__main__':
    success = test_metadata_endpoint()
    exit(0 if success else 1)
