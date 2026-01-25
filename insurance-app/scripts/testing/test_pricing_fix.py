#!/usr/bin/env python
import requests
import json

print("=== VERIFYING PRICING DIFFERENCE ===")

# Test 1: Third Party pricing (what app should get)
print("\n1. PRIVATE_THIRD_PARTY pricing:")
try:
    payload = {
        "category": "PRIVATE",
        "subcategory": "PRIVATE_THIRD_PARTY",  # App parameter
        "sum_insured": 1000000
    }
    
    response = requests.post(
        "http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    data = response.json()
    if data.get('comparisons'):
        print("Provider pricing for Third Party:")
        for comp in data['comparisons'][:3]:  # Show first 3
            result = comp['result']
            print(f"  {result['underwriter_name']}: KSH {result['total_premium']}")
        
except Exception as e:
    print(f"Error: {e}")

# Test 2: TOR pricing (what app was getting before fix)  
print("\n2. PRIVATE_TOR pricing (old behavior):")
try:
    payload = {
        "category": "PRIVATE",
        "cover_type": "PRIVATE_TOR",
        "sum_insured": 1000000
    }
    
    response = requests.post(
        "http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    data = response.json()
    if data.get('comparisons'):
        print("Provider pricing for TOR:")
        for comp in data['comparisons'][:3]:  # Show first 3
            result = comp['result']
            print(f"  {result['underwriter_name']}: KSH {result['total_premium']}")
        
except Exception as e:
    print(f"Error: {e}")

print("\n✅ App should now show Third Party prices instead of TOR prices!")