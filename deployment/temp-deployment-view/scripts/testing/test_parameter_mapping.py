#!/usr/bin/env python
import requests
import json

print("=== TESTING PARAMETER MAPPING ISSUE ===")

# Test what happens when we send the wrong parameter name
print("\n1. Testing with 'subcategory' parameter (likely what app sends)")
try:
    payload = {
        "category": "PRIVATE",
        "subcategory": "PRIVATE_THIRD_PARTY",  # App likely sends this
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
    
    # Check which cover_type was actually used
    if data.get('comparisons'):
        first = data['comparisons'][0]['result']
        print(f"Cover type used: {first.get('cover_type', 'N/A')}")
        
except Exception as e:
    print(f"Error: {e}")

print("\n2. Testing with 'subcategory_code' parameter (correct API param)")
try:
    payload = {
        "category": "PRIVATE",
        "subcategory_code": "PRIVATE_THIRD_PARTY",  # Correct parameter name
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
    
    # Check which cover_type was actually used
    if data.get('comparisons'):
        first = data['comparisons'][0]['result']
        print(f"Cover type used: {first.get('cover_type', 'N/A')}")
        
except Exception as e:
    print(f"Error: {e}")

print("\n3. Testing with 'cover_type' parameter (alternative API param)")
try:
    payload = {
        "category": "PRIVATE",
        "cover_type": "PRIVATE_THIRD_PARTY",  # Alternative parameter name
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
    
    # Check which cover_type was actually used  
    if data.get('comparisons'):
        first = data['comparisons'][0]['result']
        print(f"Cover type used: {first.get('cover_type', 'N/A')}")
        
except Exception as e:
    print(f"Error: {e}")

print("\n4. Testing with no subcategory parameter (should default to PRIVATE_TOR)")
try:
    payload = {
        "category": "PRIVATE",
        # No subcategory parameter - should default to PRIVATE_TOR
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
    
    # Check which cover_type was actually used
    if data.get('comparisons'):
        first = data['comparisons'][0]['result']
        print(f"Cover type used: {first.get('cover_type', 'N/A')}")
        print(f"Default behavior - all results are for TOR")
        
except Exception as e:
    print(f"Error: {e}")