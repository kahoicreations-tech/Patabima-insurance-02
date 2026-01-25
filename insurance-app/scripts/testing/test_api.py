#!/usr/bin/env python
import requests
import json

# Test motor subcategories endpoint
print("Testing /api/v1/motor/subcategories/?category=PRIVATE")
try:
    response = requests.get("http://127.0.0.1:8000/api/v1/motor/subcategories/?category=PRIVATE")
    print(f"Status Code: {response.status_code}")
    print(f"Response Length: {len(response.content)} bytes")
    if response.status_code == 200:
        data = response.json()
        print(f"Number of subcategories: {len(data)}")
        if data:
            print(f"First subcategory: {data[0].get('display_name', 'N/A')}")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Error: {e}")

print("\n" + "="*50 + "\n")

# Test compare motor pricing endpoint
print("Testing /api/v1/public_app/insurance/compare_motor_pricing")
try:
    payload = {
        "category": "PRIVATE",
        "subcategory": "PRIVATE_THIRD_PARTY",
        "sum_insured": 1000000
    }
    
    response = requests.post(
        "http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Length: {len(response.content)} bytes")
    if response.status_code == 200:
        data = response.json()
        print(f"Full response: {json.dumps(data, indent=2)}")
        print(f"Number of comparisons: {data.get('count', 'N/A')}")
        if 'comparisons' in data and data['comparisons']:
            first_comp = data['comparisons'][0]
            print(f"First provider: {first_comp.get('underwriter_name', 'N/A')}")
            print(f"Pricing source: {first_comp.get('pricing_source', 'N/A')}")
        else:
            print("No comparisons found in response")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Error: {e}")