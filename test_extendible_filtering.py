#!/usr/bin/env python
"""
Test script to verify extendible underwriter filtering.
Tests that only underwriters with extendible_config are returned for EXT products.
"""

import os
import sys
import django

# Setup Django environment
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(project_root, 'insurance-app'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from django.test import RequestFactory
from app.views.motor_flow import compare_pricing

def test_extendible_filtering():
    """Test that EXT products only show underwriters with extendible_config"""
    
    factory = RequestFactory()
    
    # Test payload for PRIVATE_THIRD_PARTY_EXT
    payload = {
        'category': 'PRIVATE',
        'subcategory': 'PRIVATE_THIRD_PARTY_EXT',
        'subcategory_code': 'PRIVATE_THIRD_PARTY_EXT',
        'vehicle_year': 2020,
        'sum_insured': 0,  # Not needed for third-party
        'cover_start_date': '2025-10-27',
        'duration_days': 365
    }
    
    print("\n" + "="*80)
    print("Testing Extendible Underwriter Filtering")
    print("="*80)
    print(f"\nRequesting comparisons for: {payload['subcategory_code']}")
    print(f"Category: {payload['category']}")
    print("-"*80)
    
    # Make request
    request = factory.post('/api/v1/public_app/insurance/compare_motor_pricing/', 
                          data=payload, 
                          content_type='application/json')
    
    # Call the view
    response = compare_pricing(request)
    
    print(f"\nResponse Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.data
        comparisons = data.get('comparisons', [])
        count = data.get('count', 0)
        
        print(f"\n✅ Total underwriters returned: {count}")
        print("-"*80)
        
        if count == 0:
            print("⚠️ WARNING: No underwriters returned!")
            print("This could mean:")
            print("  1. No underwriters have extendible_config for this product")
            print("  2. No underwriters have pricing for this subcategory")
            return False
        
        print("\nUnderwriter Details:")
        print("-"*80)
        
        all_have_config = True
        for i, comp in enumerate(comparisons, 1):
            result = comp.get('result', {})
            name = result.get('underwriter_name', 'Unknown')
            has_config = 'extendible_config' in result
            is_extendible = result.get('is_extendible', False)
            premium = result.get('total_premium', 0)
            
            status = "✅" if has_config else "❌"
            print(f"\n{i}. {status} {name}")
            print(f"   - Has extendible_config: {has_config}")
            print(f"   - is_extendible: {is_extendible}")
            print(f"   - Total Premium: KSh {premium:,.2f}")
            
            if has_config:
                config = result['extendible_config']
                print(f"   - Initial Amount: KSh {config.get('initial_amount', 0):,.2f}")
                print(f"   - Balance Amount: KSh {config.get('balance_amount', 0):,.2f}")
                print(f"   - Total Annual: KSh {config.get('total_annual_premium', 0):,.2f}")
            else:
                all_have_config = False
                print(f"   ⚠️ WARNING: This underwriter should have been filtered out!")
        
        print("\n" + "="*80)
        if all_have_config:
            print("✅ SUCCESS: All returned underwriters have extendible_config")
            print("="*80)
            return True
        else:
            print("❌ FAILURE: Some underwriters missing extendible_config")
            print("="*80)
            return False
    else:
        print(f"❌ ERROR: Request failed with status {response.status_code}")
        print(f"Response: {response.data}")
        return False

if __name__ == '__main__':
    success = test_extendible_filtering()
    sys.exit(0 if success else 1)
