#!/usr/bin/env python
import requests
import json

print("=== TESTING ERROR RESPONSES ===")

print("\n1. Testing old cover_type approach:")
try:
    payload = {
        "category": "PRIVATE",
        "cover_type": "THIRD_PARTY",
        "vehicle_registration": "KBC 345h",
        "cover_start_date": "2025-09-29"
    }
    
    response = requests.post(
        "http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
        
except Exception as e:
    print(f"Error: {e}")

print("\n2. Testing with no subcategory:")
try:
    payload = {
        "category": "PRIVATE",
        "vehicle_registration": "KBC 345h",
        "cover_start_date": "2025-09-29"
    }
    
    response = requests.post(
        "http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
        
except Exception as e:
    print(f"Error: {e}")