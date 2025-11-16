import requests
import json

# Test the exact API call that Motor 2 screen would make
payload = {
    'category_code': 'PRIVATE',
    'subcategory_code': 'PRIVATE_COMPREHENSIVE',
    'sum_insured': 1000000,
    'vehicle_year': 2020,
    'cover_start_date': '2025-10-01'
}

print('=== TESTING COMPARE_PRICING API ===')
print('Payload:', json.dumps(payload, indent=2))

try:
    response = requests.post(
        'http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing/',
        headers={'Content-Type': 'application/json'},
        json=payload,
        timeout=10
    )
    
    print(f'Status Code: {response.status_code}')
    
    if response.status_code == 200:
        result = response.json()
        count = result.get('count', 0)
        print(f'Number of comparisons returned: {count}')
        
        if result.get('comparisons'):
            print('\n=== UNDERWRITER RESULTS ===')
            for comp in result['comparisons']:
                underwriter_code = comp.get('underwriter_code')
                result_data = comp.get('result', {})
                
                underwriter_name = result_data.get('underwriter_name')
                total_premium = result_data.get('total_premium', 0)
                market_position = result_data.get('market_position')
                pricing_source = result_data.get('pricing_source')
                error = result_data.get('error')
                
                print(f'Underwriter: {underwriter_name} ({underwriter_code})')
                print(f'  Total Premium: KSh {total_premium:,}')
                print(f'  Market Position: {market_position}')
                print(f'  Pricing Source: {pricing_source}')
                if error:
                    print(f'  ERROR: {error}')
                print('---')
        else:
            print('No comparisons in response')
    else:
        print(f'Error Response: {response.text}')
        
except Exception as e:
    print(f'Request failed: {e}')