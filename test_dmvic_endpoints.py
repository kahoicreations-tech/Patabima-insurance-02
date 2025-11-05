"""
Test script for DMVIC endpoints with caching
"""
import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://127.0.0.1:8000"
API_BASE = f"{BASE_URL}/api/v1/public_app"

# Pre-generated auth token (Admin: 0700000000, expires 2025-11-05 02:09 UTC)
# Generated via: python manage.py generate_test_token 0700000000
AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzYyMzA4NTg2LCJpYXQiOjE3NjIzMDEzODYsImp0aSI6IjJkYjFmNzVkZDc0MzQwNGU4NGY1NzU2M2ZmZWY0YmExIiwidXNlcl9pZCI6IjRkNWI3YjhkLWQzZmQtNGNjOC05MTVmLWEzNjJhMzVmYzY5OCJ9.K_NRdusk_xv5O8IOymchj1kfqAwpb4kGK_9RX9a1yqY"

def get_auth_token():
    """Return pre-generated JWT token"""
    print("\n🔐 Using pre-generated auth token (Admin: 0700000000)...")
    return AUTH_TOKEN

def test_search_vehicle(token, registration_number, test_number=1):
    """Test DMVIC search vehicle endpoint"""
    print(f"\n{'='*80}")
    print(f"🔍 Test {test_number}: Searching vehicle {registration_number}")
    print(f"{'='*80}")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    start_time = datetime.now()
    response = requests.post(
        f"{API_BASE}/dmvic/search-vehicle/",
        headers=headers,
        json={"registration_number": registration_number}
    )
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    print(f"⏱️  Response time: {duration:.2f} seconds")
    print(f"📊 Status code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success!")
        print(f"\n📋 Response data:")
        print(f"   - Cached: {data.get('cached', 'N/A')}")
        print(f"   - Cache timestamp: {data.get('cache_timestamp', 'N/A')}")
        print(f"   - Has existing cover: {data.get('has_existing_cover', 'N/A')}")
        print(f"   - Existing cover expiry: {data.get('existing_cover_expiry', 'N/A')}")
        
        vehicle = data.get('vehicle', {})
        if vehicle:
            print(f"\n🚗 Vehicle details:")
            print(f"   - Registration: {vehicle.get('registration_number', 'N/A')}")
            print(f"   - Make: {vehicle.get('make', 'N/A')}")
            print(f"   - Model: {vehicle.get('model', 'N/A')}")
            print(f"   - Year: {vehicle.get('year', 'N/A')}")
        
        print(f"\n📄 Full response:")
        print(json.dumps(data, indent=2))
        return data
    else:
        print(f"❌ Request failed")
        print(f"Response: {response.text}")
        return None

def test_health_check(token):
    """Test DMVIC health check endpoint"""
    print(f"\n{'='*80}")
    print(f"🏥 Testing DMVIC Health Check")
    print(f"{'='*80}")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(
        f"{API_BASE}/dmvic/health-check/",
        headers=headers
    )
    
    print(f"📊 Status code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success!")
        print(f"\n📋 Health check data:")
        print(json.dumps(data, indent=2))
        
        cache_status = data.get('cache_status', {})
        print(f"\n💾 Cache statistics:")
        print(f"   - Total entries: {cache_status.get('total_entries', 0)}")
        print(f"   - Last cached at: {cache_status.get('last_cached_at', 'N/A')}")
        print(f"   - Cache TTL hours: {cache_status.get('cache_ttl_hours', 'N/A')}")
        
        return data
    else:
        print(f"❌ Request failed")
        print(f"Response: {response.text}")
        return None

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("🧪 DMVIC Endpoint Testing Suite")
    print("="*80)
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        print("\n❌ Cannot proceed without authentication")
        return
    
    # Test vehicle search - First call (should hit API)
    test_reg = "KCA234H"
    result1 = test_search_vehicle(token, test_reg, test_number=1)
    
    if result1:
        # Test vehicle search - Second call (should hit cache)
        import time
        time.sleep(2)  # Wait a bit
        result2 = test_search_vehicle(token, test_reg, test_number=2)
        
        if result1 and result2:
            print(f"\n{'='*80}")
            print("📊 Cache Performance Comparison")
            print(f"{'='*80}")
            print(f"First call (API):   cached={result1.get('cached')}")
            print(f"Second call (Cache): cached={result2.get('cached')}")
            
            if not result1.get('cached') and result2.get('cached'):
                print("✅ Caching is working correctly!")
            else:
                print("⚠️  Caching behavior unexpected")
    
    # Test health check endpoint
    test_health_check(token)
    
    print(f"\n{'='*80}")
    print("✅ Testing complete!")
    print(f"{'='*80}\n")

if __name__ == "__main__":
    main()
