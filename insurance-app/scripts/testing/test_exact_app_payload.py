#!/usr/bin/env python
import requests
import json

print("=== TESTING EXACT APP PAYLOAD ===")

# Test with the exact payload structure from the app logs
payload = {
    "cover_type": "THIRD_PARTY",
    "vehicle_registration": "KBC 345h", 
    "cover_start_date": "2025-09-29",
    "customer_first_name": "John",
    "customer_last_name": "Doe",
    "customer_phone": "254712345678",
    "customer_email": "john.doe@email.com",
    "duration_days": 30
}

print(f"Payload: {json.dumps(payload, indent=2)}")

response = requests.post(
    "http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing",
    json=payload,
    headers={"Content-Type": "application/json"}
)

print(f"Response Status: {response.status_code}")
data = response.json()
print(f"Count: {data.get('count', 'N/A')}")

if data.get('comparisons'):
    print("\n✅ SUCCESS! Provider results:")
    for i, comp in enumerate(data['comparisons'][:3]):  # Show first 3
        result = comp['result']
        print(f"{i+1}. {result['underwriter_name']}: KSH {result['total_premium']}")
    print(f"\nCover type resolved to: {data['comparisons'][0]['result']['cover_type']}")
else:
    print("❌ No results returned")
    print(f"Response: {data}")