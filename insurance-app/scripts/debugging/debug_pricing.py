#!/usr/bin/env python
import requests
import json

print("=== DEBUGGING PRICING COMPUTATION ===")

# Test with verbose output
payload = {
    "category": "PRIVATE",
    "subcategory": "PRIVATE_THIRD_PARTY",
    "vehicle_registration": "KBC 345h",
    "cover_start_date": "2025-09-29"
}

response = requests.post(
    "http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing",
    json=payload,
    headers={"Content-Type": "application/json"}
)

data = response.json()
print(f"Full response structure:")
print(json.dumps(data, indent=2)[:2000])

if data.get('comparisons'):
    first_comp = data['comparisons'][0]
    result = first_comp['result']
    
    print(f"\nFirst provider details:")
    print(f"Name: {result.get('underwriter_name')}")
    print(f"Code: {result.get('underwriter_code')}")
    print(f"Pricing source: {result.get('pricing_source')}")
    print(f"Base premium: {result.get('base_premium')}")
    print(f"Total premium: {result.get('total_premium')}")
    print(f"Error: {result.get('error')}")
    
    if 'premium_breakdown' in result:
        breakdown = result['premium_breakdown']
        print(f"\nPremium breakdown:")
        for key, value in breakdown.items():
            print(f"  {key}: {value}")
    
    # Check if features are available
    if 'features' in result and 'pricing' in result['features']:
        pricing = result['features']['pricing']
        print(f"\nAvailable pricing features:")
        for key in pricing.keys():
            print(f"  {key}: {pricing[key]}")
            
        if 'PRIVATE_THIRD_PARTY' in pricing:
            print(f"\nPRIVATE_THIRD_PARTY config: {pricing['PRIVATE_THIRD_PARTY']}")
        else:
            print(f"\n❌ PRIVATE_THIRD_PARTY not found in features")
    else:
        print(f"\n❌ No features.pricing found")