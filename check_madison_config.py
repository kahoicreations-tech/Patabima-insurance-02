#!/usr/bin/env python
"""Check extendible config values for Madison Insurance"""
import os
import sys
import django

# Setup Django
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(project_root, 'insurance-app'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import InsuranceProvider
import json

try:
    madison = InsuranceProvider.objects.get(code='MADISON')
    pricing = madison.features.get('pricing', {})
    ext_product = pricing.get('PRIVATE_THIRD_PARTY_EXT', {})
    ext_cfg = ext_product.get('extendible_config', {})
    
    print("\n" + "="*80)
    print("MADISON INSURANCE - PRIVATE_THIRD_PARTY_EXT Configuration")
    print("="*80)
    print(f"\nBase Premium: KSh {ext_product.get('base_premium', 'NOT SET')}")
    print("\nExtendible Config:")
    print(json.dumps(ext_cfg, indent=2))
    print("\n" + "="*80)
    
    # Check if values match admin screenshot
    initial = ext_cfg.get('initial_amount', 0)
    balance = ext_cfg.get('balance_amount', 0)
    total = ext_cfg.get('total_annual_premium', 0)
    
    print("\nComparison with Admin Screenshot:")
    print(f"  Initial Amount: {initial} (Admin shows: 4200)")
    print(f"  Balance Amount: {balance} (Admin shows: 2800)")
    print(f"  Total Annual: {total} (Admin shows: 7000)")
    
    if initial == 4200 and balance == 2800 and total == 7000:
        print("\n✅ Database values MATCH admin screenshot!")
    else:
        print("\n⚠️ Database values DO NOT match admin screenshot!")
        print("   This means the admin form changes haven't been saved yet.")
        
except InsuranceProvider.DoesNotExist:
    print("❌ Madison Insurance not found in database")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
