#!/usr/bin/env python
import requests
import json

print("=== TESTING VARIOUS REQUEST PATTERNS ===")

# Test 1: What the app might be sending (wrong subcategory)
print("\n1. Testing with subcategory='PRIVATE' (likely what app sends)")
try:
    payload = {
        "category": "PRIVATE",
        "subcategory": "PRIVATE",  # Wrong - this is just the category
        "sum_insured": 1000000
    }
    
    response = requests.post(
        "http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Count: {data.get('count', 'N/A')}")
    if data.get('count', 0) == 0:
        print("❌ NO RESULTS - This is likely what the app is experiencing")
    
except Exception as e:
    print(f"Error: {e}")

# Test 2: Correct subcategory
print("\n2. Testing with subcategory='PRIVATE_THIRD_PARTY' (correct)")
try:
    payload = {
        "category": "PRIVATE",
        "subcategory": "PRIVATE_THIRD_PARTY",  # Correct
        "sum_insured": 1000000
    }
    
    response = requests.post(
        "http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Count: {data.get('count', 'N/A')}")
    if data.get('count', 0) > 0:
        print("✅ RESULTS FOUND")
        first = data['comparisons'][0]
        print(f"First: {first['result']['underwriter_name']} - {first['result']['total_premium']}")
    
except Exception as e:
    print(f"Error: {e}")

# Test 3: Check available subcategories
print("\n3. Available PRIVATE subcategories:")
try:
    response = requests.get("http://127.0.0.1:8000/api/v1/motor/subcategories/?category=PRIVATE")
    data = response.json()
    print(f"Response type: {type(data)}")
    if isinstance(data, list):
        for item in data:
            print(f"   - {item.get('subcategory_code')} ({item.get('display_name')})")
    else:
        print(f"Unexpected response format: {data}")
except Exception as e:
    print(f"Error: {e}")

# Test 4: Test with missing parameters
print("\n4. Testing with missing sum_insured (might cause 0 results)")
try:
    payload = {
        "category": "PRIVATE", 
        "subcategory": "PRIVATE_THIRD_PARTY"
        # Missing sum_insured
    }
    
    response = requests.post(
        "http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Count: {data.get('count', 'N/A')}")
    if 'error' in data or 'detail' in data:
        print(f"Error: {data}")
        
except Exception as e:
    print(f"Error: {e}")

# Test 5: Check for cross-origin or network issues
print("\n5. Testing CORS headers")
try:
    response = requests.options("http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing")
    print(f"OPTIONS Status: {response.status_code}")
    print(f"CORS Headers: {dict(response.headers)}")
except Exception as e:
    print(f"Error: {e}")