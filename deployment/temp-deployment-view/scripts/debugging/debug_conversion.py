#!/usr/bin/env python
import requests
import json

print("=== DEBUGGING COVER_TYPE CONVERSION ===")

# Add debug logging to see exactly what's happening
print("\n1. Testing what the API receives with cover_type:")
try:
    payload = {
        "category": "PRIVATE",
        "cover_type": "THIRD_PARTY",  # Old approach
        "vehicle_registration": "KBC 345h",
        "cover_start_date": "2025-09-29",
        "_debug": True  # Add debug flag
    }
    
    response = requests.post(
        "http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:500]}...")
    
    if response.status_code == 200:
        data = response.json()
        if data.get('comparisons'):
            first = data['comparisons'][0]['result']
            print(f"\n🔍 API resolved:")
            print(f"  - Cover Type: {first.get('cover_type')}")
            print(f"  - Category: {first.get('category')}")
            print(f"  - Subcategory: {first.get('subcategory_code')}")
        
except Exception as e:
    print(f"Error: {e}")

print("\n2. Testing with explicit subcategory:")
try:
    payload = {
        "category": "PRIVATE",
        "subcategory": "PRIVATE_COMPREHENSIVE",  # Explicit subcategory
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
    if response.status_code == 200:
        data = response.json()
        if data.get('comparisons'):
            first = data['comparisons'][0]['result']
            print(f"\n🔍 API resolved:")
            print(f"  - Cover Type: {first.get('cover_type')}")
            print(f"  - Premium: KSH {first.get('total_premium')}")
        
except Exception as e:
    print(f"Error: {e}")