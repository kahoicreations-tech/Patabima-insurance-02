import requests
import json

# Test different scenarios to see which underwriters are being filtered out

test_cases = [
    {
        'name': 'PRIVATE_COMPREHENSIVE',
        'payload': {
            'category_code': 'PRIVATE',
            'subcategory_code': 'PRIVATE_COMPREHENSIVE',
            'sum_insured': 1000000,
            'vehicle_year': 2020,
            'cover_start_date': '2025-10-01'
        }
    },
    {
        'name': 'PRIVATE_THIRD_PARTY',
        'payload': {
            'category_code': 'PRIVATE',
            'subcategory_code': 'PRIVATE_THIRD_PARTY',
            'vehicle_year': 2020,
            'cover_start_date': '2025-10-01'
        }
    },
    {
        'name': 'COMMERCIAL_GENERAL_CARTAGE_COMP',
        'payload': {
            'category_code': 'COMMERCIAL',
            'subcategory_code': 'COMMERCIAL_GENERAL_CARTAGE_COMP',
            'sum_insured': 2000000,
            'tonnage': '3.1 - 5 Tons',
            'vehicle_year': 2019,
            'cover_start_date': '2025-10-01'
        }
    }
]

print('=== TESTING UNDERWRITER AVAILABILITY BY CATEGORY ===')

for test_case in test_cases:
    print(f"\n--- Testing {test_case['name']} ---")
    print(f"Payload: {json.dumps(test_case['payload'], indent=2)}")
    
    try:
        response = requests.post(
            'http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing/',
            headers={'Content-Type': 'application/json'},
            json=test_case['payload'],
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            count = result.get('count', 0)
            print(f"✅ SUCCESS: {count} underwriters found")
            
            if result.get('comparisons'):
                for comp in result['comparisons']:
                    result_data = comp.get('result', {})
                    underwriter_name = result_data.get('underwriter_name')
                    total_premium = result_data.get('total_premium', 0)
                    market_position = result_data.get('market_position')
                    pricing_source = result_data.get('pricing_source')
                    error = result_data.get('error')
                    
                    status = "✅" if not error else "❌"
                    print(f"  {status} {underwriter_name}: KSh {total_premium:,} ({market_position}) [{pricing_source}]")
                    if error:
                        print(f"      ERROR: {error}")
            else:
                print("  No comparisons in response")
        else:
            print(f"❌ ERROR: Status {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ REQUEST FAILED: {e}")

# Check if specific underwriters have pricing for all categories
print('\n=== CHECKING UNDERWRITER COVERAGE ===')
try:
    response = requests.post(
        'http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing/',
        headers={'Content-Type': 'application/json'},
        json={
            'category_code': 'PRIVATE',
            'subcategory_code': 'PRIVATE_COMPREHENSIVE',
            'sum_insured': 1000000,
            'vehicle_year': 2020,
            'cover_start_date': '2025-10-01'
        },
        timeout=10
    )
    
    if response.status_code == 200:
        result = response.json()
        underwriter_codes = []
        
        for comp in result.get('comparisons', []):
            result_data = comp.get('result', {})
            code = result_data.get('underwriter_code')
            if code:
                underwriter_codes.append(code)
        
        print(f"Underwriters with PRIVATE_COMPREHENSIVE pricing: {underwriter_codes}")
        
        # Now test each underwriter for other products
        for code in underwriter_codes:
            print(f"\nTesting {code} across different products:")
            
            test_products = [
                ('PRIVATE_THIRD_PARTY', {'category_code': 'PRIVATE', 'subcategory_code': 'PRIVATE_THIRD_PARTY'}),
                ('COMMERCIAL_OWN_GOODS_TP', {'category_code': 'COMMERCIAL', 'subcategory_code': 'COMMERCIAL_OWN_GOODS_TP'}),
                ('MOTORCYCLE_PRIVATE_TP', {'category_code': 'MOTORCYCLE', 'subcategory_code': 'MOTORCYCLE_PRIVATE_TP'})
            ]
            
            for product_name, payload in test_products:
                payload['cover_start_date'] = '2025-10-01'
                
                try:
                    response = requests.post(
                        'http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing/',
                        headers={'Content-Type': 'application/json'},
                        json=payload,
                        timeout=5
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        found = False
                        for comp in result.get('comparisons', []):
                            result_data = comp.get('result', {})
                            if result_data.get('underwriter_code') == code:
                                found = True
                                total = result_data.get('total_premium', 0)
                                print(f"  ✅ {product_name}: KSh {total:,}")
                                break
                        
                        if not found:
                            print(f"  ❌ {product_name}: Not available")
                    else:
                        print(f"  ❌ {product_name}: API Error {response.status_code}")
                        
                except Exception as e:
                    print(f"  ❌ {product_name}: Request failed - {e}")
                    
except Exception as e:
    print(f"Failed to get base underwriter list: {e}")