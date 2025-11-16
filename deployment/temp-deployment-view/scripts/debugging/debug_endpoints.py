#!/usr/bin/env python
import requests
import json

print("=== DEBUG ENDPOINT ISSUES ===")

# Test field requirements
print("\n1. Testing field requirements:")
try:
    response = requests.get("http://127.0.0.1:8000/api/v1/motor/field-requirements/?category=PRIVATE&subcategory=PRIVATE_THIRD_PARTY")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:500]}...")
except Exception as e:
    print(f"Error: {e}")

# Test calculate premium with correct URL
print("\n2. Testing calculate premium:")
try:
    response = requests.post(
        "http://127.0.0.1:8000/api/v1/public_app/insurance/calculate_motor_premium",
        json={
            "category": "PRIVATE",
            "subcategory": "PRIVATE_THIRD_PARTY",
            "cover_start_date": "2025-09-30"
        },
        headers={"Content-Type": "application/json"}
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Premium: KSH {data.get('total_premium')}")
    else:
        print(f"Response: {response.text[:500]}...")
except Exception as e:
    print(f"Error: {e}")