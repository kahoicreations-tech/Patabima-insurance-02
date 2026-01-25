#!/usr/bin/env python
import requests
import json

print("=== TESTING APP'S ACTUAL PAYLOAD STRUCTURE ===")

# Test the exact payload structure the app is sending
print("\n1. Testing app's payload structure:")
try:
    # This is what the app log shows it's sending
    payload = {
        "cover_type": "THIRD_PARTY",  # App sends just "THIRD_PARTY", not "PRIVATE_THIRD_PARTY"
        "vehicle_registration": "KBC 345h",
        "cover_start_date": "2025-09-29", 
        "customer_first_name": "John",
        "customer_last_name": "Doe",
        "customer_phone": "254712345678",
        "customer_email": "john.doe@email.com",
        "duration_days": 30
    }
    
    response = requests.post(
        "http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Count: {data.get('count', 'N/A')}")
    print(f"Full response: {json.dumps(data, indent=2)[:500]}...")
    
    if data.get('comparisons'):
        first = data['comparisons'][0]['result']
        print(f"Cover type used: {first.get('cover_type', 'N/A')}")
    
except Exception as e:
    print(f"Error: {e}")

print("\n2. Testing with correct full subcategory code:")
try:
    # What should work
    payload = {
        "category": "PRIVATE",
        "subcategory": "PRIVATE_THIRD_PARTY",  # Full code
        "vehicle_registration": "KBC 345h",
        "cover_start_date": "2025-09-29",
        "customer_first_name": "John",
        "customer_last_name": "Doe", 
        "customer_phone": "254712345678",
        "customer_email": "john.doe@email.com",
        "duration_days": 30
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
        print(f"Cover type used: {first.get('cover_type', 'N/A')}")
        print(f"First provider: {first.get('underwriter_name')} - KSH {first.get('total_premium')}")
        
except Exception as e:
    print(f"Error: {e}")

print("\n3. Testing with cover_type = PRIVATE_THIRD_PARTY:")
try:
    # Test if the API can handle just the full product code in cover_type
    payload = {
        "cover_type": "PRIVATE_THIRD_PARTY",  # Full product code
        "vehicle_registration": "KBC 345h",
        "cover_start_date": "2025-09-29",
        "customer_first_name": "John",
        "customer_last_name": "Doe",
        "customer_phone": "254712345678",
        "customer_email": "john.doe@email.com", 
        "duration_days": 30
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
        print(f"Cover type used: {first.get('cover_type', 'N/A')}")
        print(f"First provider: {first.get('underwriter_name')} - KSH {first.get('total_premium')}")
        
except Exception as e:
    print(f"Error: {e}")