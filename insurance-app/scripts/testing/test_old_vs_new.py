#!/usr/bin/env python
import requests
import json

print("=== TESTING THAT OLD COVER_TYPE APPROACH NO LONGER WORKS ===")

# Test that old cover_type approach is no longer supported
print("\n1. Testing old cover_type approach (should not work):")
try:
    payload = {
        "category": "PRIVATE",
        "cover_type": "THIRD_PARTY",  # Old approach
        "vehicle_registration": "KBC 345h",
        "cover_start_date": "2025-09-29"
    }
    
    response = requests.post(
        "http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Count: {data.get('count', 'N/A')}")
    
    if data.get('comparisons'):
        first = data['comparisons'][0]['result']
        print(f"Cover type resolved to: {first['cover_type']}")
        print(f"❌ Old approach still works - this is not what we want")
    else:
        print("✅ Old approach correctly disabled")
        
except Exception as e:
    print(f"Error: {e}")

print("\n2. Testing new subcategory approach (should work):")
try:
    payload = {
        "category": "PRIVATE",
        "subcategory": "PRIVATE_THIRD_PARTY",  # New approach
        "vehicle_registration": "KBC 345h", 
        "cover_start_date": "2025-09-29"
    }
    
    response = requests.post(
        "http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Count: {data.get('count', 'N/A')}")
    
    if data.get('comparisons'):
        first = data['comparisons'][0]['result']
        print(f"✅ New approach works: {first['underwriter_name']} - KSH {first['total_premium']}")
    else:
        print("❌ New approach broken")
        
except Exception as e:
    print(f"Error: {e}")

print("\n3. Testing default behavior (no subcategory specified):")
try:
    payload = {
        "category": "PRIVATE",
        # No subcategory - should default to PRIVATE_THIRD_PARTY
        "vehicle_registration": "KBC 345h",
        "cover_start_date": "2025-09-29" 
    }
    
    response = requests.post(
        "http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Count: {data.get('count', 'N/A')}")
    
    if data.get('comparisons'):
        first = data['comparisons'][0]['result']
        print(f"Default subcategory: {first['cover_type']}")
    
except Exception as e:
    print(f"Error: {e}")