#!/usr/bin/env python
"""Verify extendible config after saving admin changes"""
import os
import sys
import django

# Setup Django
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(project_root, 'insurance-app'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import InsuranceProvider
from django.test import RequestFactory
from app.views.motor_flow import compare_pricing

print("\n" + "="*80)
print("VERIFICATION: Check if admin changes were saved")
print("="*80)

# 1. Check database directly
try:
    madison = InsuranceProvider.objects.get(code='MADISON')
    ext_cfg = madison.features.get('pricing', {}).get('PRIVATE_THIRD_PARTY_EXT', {}).get('extendible_config', {})
    
    print("\n1️⃣ DATABASE VALUES:")
    print(f"   Initial Amount: KSh {ext_cfg.get('initial_amount', 0):,}")
    print(f"   Balance Amount: KSh {ext_cfg.get('balance_amount', 0):,}")
    print(f"   Total Annual: KSh {ext_cfg.get('total_annual_premium', 0):,}")
    
    expected_initial = 4200
    expected_balance = 2800
    expected_total = 7000
    
    if (ext_cfg.get('initial_amount') == expected_initial and 
        ext_cfg.get('balance_amount') == expected_balance and
        ext_cfg.get('total_annual_premium') == expected_total):
        print("\n   ✅ VALUES MATCH EXPECTED (4200/2800/7000)")
    else:
        print("\n   ⚠️ VALUES DO NOT MATCH - Need to save admin form!")
        print(f"      Expected: 4200/2800/7000")
        print(f"      Got: {ext_cfg.get('initial_amount')}/{ext_cfg.get('balance_amount')}/{ext_cfg.get('total_annual_premium')}")

except Exception as e:
    print(f"   ❌ Error: {e}")

# 2. Check compare endpoint response
print("\n2️⃣ COMPARE ENDPOINT RESPONSE:")
try:
    factory = RequestFactory()
    payload = {
        'category': 'PRIVATE',
        'subcategory': 'PRIVATE_THIRD_PARTY_EXT',
        'subcategory_code': 'PRIVATE_THIRD_PARTY_EXT',
        'vehicle_year': 2020,
        'cover_start_date': '2025-10-27',
        'duration_days': 365
    }
    request = factory.post('/api/v1/public_app/insurance/compare_motor_pricing/', 
                          data=payload, content_type='application/json')
    response = compare_pricing(request)
    
    if response.status_code == 200:
        comparisons = response.data.get('comparisons', [])
        madison_comp = next((c for c in comparisons if c['result'].get('underwriter_code') == 'MADISON'), None)
        
        if madison_comp:
            result = madison_comp['result']
            ext_config = result.get('extendible_config', {})
            
            print(f"   Initial Amount: KSh {ext_config.get('initial_amount', 0):,}")
            print(f"   Balance Amount: KSh {ext_config.get('balance_amount', 0):,}")
            print(f"   Total Annual: KSh {ext_config.get('total_annual_premium', 0):,}")
            
            if (ext_config.get('initial_amount') == 4200 and 
                ext_config.get('balance_amount') == 2800):
                print("\n   ✅ API RETURNS CORRECT VALUES")
            else:
                print("\n   ⚠️ API still returns old values")
        else:
            print("   ⚠️ Madison not found in response (might be filtered)")
    else:
        print(f"   ❌ API Error: {response.status_code}")
        
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "="*80)
print("INSTRUCTIONS:")
print("="*80)
print("1. Go to Django Admin")
print("2. Edit Madison Insurance provider")
print("3. Click 'Configure Extendible Terms: PRIVATE_THIRD_PARTY_EXT'")
print("4. Update values to: Initial=4200, Balance=2800, Total=7000")
print("5. Click 'Save Extendible Pricing'")
print("6. Run this script again to verify")
print("="*80 + "\n")
