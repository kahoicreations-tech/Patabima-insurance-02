"""
Check extendible pricing configuration for all underwriters
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import InsuranceProvider
import json

print("\n" + "="*80)
print("EXTENDIBLE PRICING CONFIGURATION")
print("="*80)

for uw_code in ['MADISON', 'UAP', 'BRITAM']:
    uw = InsuranceProvider.objects.get(code=uw_code)
    pricing = uw.features.get('pricing', {}).get('PRIVATE_THIRD_PARTY_EXT', {})
    
    print(f"\n{uw.name} ({uw_code}):")
    print(f"  pricing_type: {pricing.get('pricing_type')}")
    print(f"  base_premium: {pricing.get('base_premium')}")
    
    ext_cfg = pricing.get('extendible_config', {})
    if ext_cfg:
        print(f"  extendible_config:")
        print(f"    initial_amount: {ext_cfg.get('initial_amount')}")
        print(f"    balance_amount: {ext_cfg.get('balance_amount')}")
        print(f"    total_annual_premium: {ext_cfg.get('total_annual_premium')}")
    else:
        print(f"  ❌ No extendible_config!")
