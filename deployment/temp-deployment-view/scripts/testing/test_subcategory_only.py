#!/usr/bin/env python
import requests
import json

print("=== TESTING SIMPLIFIED SUBCATEGORY-ONLY API ===")

# Test 1: Direct subcategory approach (what we want)
print("\n1. Testing direct subcategory approach:")
try:
    payload = {
        "category": "PRIVATE",
        "subcategory": "PRIVATE_THIRD_PARTY",
        "vehicle_registration": "KBC 345h",
        "cover_start_date": "2025-09-29",
        "customer_first_name": "John",
        "customer_last_name": "Doe",
        "customer_phone": "254712345678",
        "customer_email": "john.doe@email.com"
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
        print("✅ SUCCESS! Provider results:")
        for i, comp in enumerate(data['comparisons'][:3]):
            result = comp['result']
            print(f"{i+1}. {result['underwriter_name']}: KSH {result['total_premium']}")
        print(f"Cover type in response: {data['comparisons'][0]['result']['cover_type']}")
    else:
        print("❌ No results")
        
except Exception as e:
    print(f"Error: {e}")

# Test 2: Other subcategories
print("\n2. Testing PRIVATE_COMPREHENSIVE:")
try:
    payload = {
        "category": "PRIVATE", 
        "subcategory": "PRIVATE_COMPREHENSIVE",
        "sum_insured": 2000000,
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
        first_result = data['comparisons'][0]['result']
        print(f"✅ First provider: {first_result['underwriter_name']} - KSH {first_result['total_premium']}")
        print(f"Cover type: {first_result['cover_type']}")
    else:
        print("❌ No comprehensive results")
        
except Exception as e:
    print(f"Error: {e}")

# Test 3: TOR
print("\n3. Testing PRIVATE_TOR:")
try:
    payload = {
        "category": "PRIVATE",
        "subcategory": "PRIVATE_TOR", 
        "duration_days": 30,
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
        first_result = data['comparisons'][0]['result'] 
        print(f"✅ First provider: {first_result['underwriter_name']} - KSH {first_result['total_premium']}")
        print(f"Cover type: {first_result['cover_type']}")
    else:
        print("❌ No TOR results")
        
except Exception as e:
    print(f"Error: {e}")

print("\n✅ API now uses subcategory codes directly - no more cover_type confusion!")