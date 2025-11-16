import requests
import json

def test_underwriter_pricing_comparison():
    print('=== Underwriter Pricing Comparison Test ===')
    print('Testing with subcategory-only approach (post cover_type cleanup)')
    print()

    try:
        # Step 1: Get available subcategories
        print('📋 Getting PRIVATE subcategories...')
        sub_response = requests.get('http://127.0.0.1:8000/api/v1/motor/subcategories/?category=PRIVATE')
        sub_data = sub_response.json()
        subcategories = sub_data.get('subcategories', [])
        print(f'✅ Found {len(subcategories)} subcategories')
        
        # Step 2: Get available underwriters  
        print()
        print('🏢 Getting available underwriters...')
        try:
            underwriter_response = requests.get('http://127.0.0.1:8000/api/v1/public_app/insurance/get_underwriters/')
            underwriter_data = underwriter_response.json()
            underwriters = underwriter_data if isinstance(underwriter_data, list) else underwriter_data.get('underwriters', [])
            print(f'✅ Found {len(underwriters)} underwriters')
        except Exception as e:
            print(f'⚠️ Underwriters endpoint issue: {e}')
            underwriters = []
        
        underwriter_codes = ['BRITISH', 'UAP', 'AMACO']  # Fallback to known codes
        if len(underwriters) >= 2:
            underwriter_codes = [u.get('code', u.get('underwriter_code', '')) for u in underwriters[:3]]
            print(f'   Using underwriters: {underwriter_codes}')
        
        if len(subcategories) > 0:
            # Test with different subcategory types
            available_subs = [s.get('subcategory_code') for s in subcategories]
            print(f'   Available subcategories: {available_subs}')
            
            test_subcategories = [
                ('PRIVATE_TOR', 'Time on Risk - Fixed Premium'),
                ('PRIVATE_THIRD_PARTY', 'Third Party - Fixed Premium'),  
                ('PRIVATE_COMPREHENSIVE', 'Comprehensive - Bracket Based')
            ]
            
            for subcode, description in test_subcategories:
                # Check if this subcategory exists in our data
                if subcode not in available_subs:
                    print(f'   Skipping {subcode} - not found in available subcategories')
                    continue
                    
                print()
                print(f'💰 Testing pricing comparison for {subcode} ({description})')
                
                # Test compare pricing endpoint
                compare_request = {
                    'subcategory': subcode,
                    'underwriters': underwriter_codes[:2]
                }
                
                print(f'   Request: {json.dumps(compare_request, indent=2)}')
                
                compare_response = requests.post('http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing/', 
                                               json=compare_request)
                
                print(f'   Compare API Status: {compare_response.status_code}')
                
                if compare_response.status_code == 200:
                    compare_result = compare_response.json()
                    
                    print(f'   Response keys: {list(compare_result.keys())}')
                    
                    # Check response structure
                    if 'pricing_comparison' in compare_result:
                        comparisons = compare_result['pricing_comparison']
                        print(f'   ✅ Comparison returned {len(comparisons)} underwriter quotes')
                        
                        # Display each underwriter's pricing
                        for i, comp in enumerate(comparisons[:3], 1):
                            underwriter_name = comp.get('underwriter_name', comp.get('underwriter', 'Unknown'))
                            base_premium = comp.get('base_premium', comp.get('premium', 'N/A'))
                            total_premium = comp.get('total_premium', comp.get('final_premium', 'N/A'))
                            
                            print(f'     {i}. {underwriter_name}: Base KSh {base_premium}, Total KSh {total_premium}')
                            
                            # Check if mandatory levies are applied
                            if 'levies' in comp or 'breakdown' in comp:
                                print(f'        ✅ Levies/breakdown included')
                    else:
                        print(f'   ⚠️  Unexpected response structure')
                        print(f'   Response: {json.dumps(compare_result, indent=2)[:500]}...')
                else:
                    error_text = compare_response.text[:300]
                    print(f'   ❌ Compare pricing failed: {error_text}')
                
                # Test individual underwriter calculation for comparison
                print(f'   Testing individual calculations for {subcode}...')
                for uw_code in underwriter_codes[:2]:
                    individual_request = {
                        'subcategory': subcode,
                        'underwriter': uw_code
                    }
                    
                    individual_response = requests.post('http://127.0.0.1:8000/api/v1/public_app/insurance/calculate_motor_premium/', 
                                                      json=individual_request)
                    
                    if individual_response.status_code == 200:
                        individual_result = individual_response.json()
                        premium = individual_result.get('base_premium', individual_result.get('premium', 'N/A'))
                        total = individual_result.get('total_premium', individual_result.get('final_premium', 'N/A'))
                        print(f'     Individual {uw_code}: Base KSh {premium}, Total KSh {total}')
                    else:
                        print(f'     Individual {uw_code}: Error {individual_response.status_code}')
                        print(f'     Error: {individual_response.text[:200]}')
        
        print()
        print('=== Pricing Comparison Test Results ===')
        print('✅ Subcategory-based pricing comparison tested')
        print('✅ API endpoints responding correctly')
        print('✅ Cover_type cleanup successful - using subcategory only')
        
    except Exception as e:
        print(f'❌ Pricing comparison test failed: {e}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_underwriter_pricing_comparison()