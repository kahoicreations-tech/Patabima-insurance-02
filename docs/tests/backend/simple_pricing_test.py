import requests

print('=== Testing Underwriter Pricing Comparison ===')

# Test 1: Simple pricing comparison
print('1. Testing compare pricing API...')
response = requests.post('http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing/', 
                        json={'subcategory': 'PRIVATE_THIRD_PARTY', 'underwriters': ['BRITISH', 'UAP']})

print(f'Status: {response.status_code}')

if response.status_code == 200:
    result = response.json()
    print(f'Response keys: {list(result.keys())}')
    
    if 'pricing_comparison' in result:
        comparisons = result['pricing_comparison']
        print(f'Number of comparisons: {len(comparisons)}')
        
        for comp in comparisons:
            name = comp.get('underwriter_name', 'Unknown')
            base = comp.get('base_premium', 'N/A')
            total = comp.get('total_premium', 'N/A')
            print(f'  - {name}: Base KSh {base}, Total KSh {total}')
    else:
        print(f'Response: {result}')
else:
    print(f'Error: {response.text[:200]}')

# Test 2: Individual calculations for comparison
print('\n2. Testing individual calculations...')
for underwriter in ['BRITISH', 'UAP']:
    response = requests.post('http://127.0.0.1:8000/api/v1/public_app/insurance/calculate_motor_premium/', 
                           json={'subcategory': 'PRIVATE_THIRD_PARTY', 'underwriter': underwriter})
    
    if response.status_code == 200:
        result = response.json()
        base = result.get('base_premium', 'N/A')
        total = result.get('total_premium', 'N/A')
        print(f'  {underwriter}: Base KSh {base}, Total KSh {total}')
    else:
        print(f'  {underwriter}: Error {response.status_code}')

print('\n✅ Pricing comparison test completed')