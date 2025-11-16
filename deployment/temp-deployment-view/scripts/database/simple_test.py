#!/usr/bin/env python
import requests
import json

print("=== SIMPLE TEST ===")

try:
    payload = {
        "category": "PRIVATE"
        # No subcategory - should trigger our error
    }
    
    response = requests.post(
        "http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    
    # Try to get JSON response
    try:
        data = response.json()
        print(f"JSON Response: {json.dumps(data, indent=2)}")
    except:
        print(f"Raw Response: {response.text[:1000]}...")
        
except Exception as e:
    print(f"Request Error: {e}")