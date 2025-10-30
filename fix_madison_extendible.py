#!/usr/bin/env python
"""
Update Madison Insurance extendible_config to correct values via Django ORM
"""
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

print("\n" + "="*80)
print("UPDATE MADISON INSURANCE - PRIVATE_THIRD_PARTY_EXT")
print("="*80)

try:
    madison = InsuranceProvider.objects.get(code='MADISON')
    
    # Get current config
    features = madison.features or {}
    pricing = features.get('pricing', {})
    ext_product = pricing.get('PRIVATE_THIRD_PARTY_EXT', {})
    
    print("\n📋 CURRENT VALUES:")
    print(f"  Base Premium: {ext_product.get('base_premium', 'NOT SET')}")
    current_ext = ext_product.get('extendible_config', {})
    print(f"  Initial Amount: {current_ext.get('initial_amount', 'NOT SET')}")
    print(f"  Balance Amount: {current_ext.get('balance_amount', 'NOT SET')}")
    print(f"  Total Annual: {current_ext.get('total_annual_premium', 'NOT SET')}")
    
    # Set correct values (base amounts without levies - backend will add them)
    ext_product['base_premium'] = 7000
    ext_product['extendible_config'] = {
        'initial_amount': 4200,
        'balance_amount': 2800,
        'total_annual_premium': 7000,
        'initial_period_days': 30,
        'extension_deadline_days': 30,
        'grace_period_days': 7,
        'penalty_for_late_extension': 0,
        'allow_partial_extension': False
    }
    
    # Update the full features structure
    pricing['PRIVATE_THIRD_PARTY_EXT'] = ext_product
    features['pricing'] = pricing
    madison.features = features
    madison.save()
    
    print("\n✅ UPDATED TO:")
    print(f"  Base Premium: 7000")
    print(f"  Initial Amount: 4200 (backend will add +45 levies → 4245)")
    print(f"  Balance Amount: 2800 (backend will add +30 levies → 2830)")
    print(f"  Total Annual: 7000 (backend will add +75 levies → 7075)")
    
    print("\n💡 NOTE: Backend automatically adds mandatory levies:")
    print("  - ITL (0.25%): 7000 × 0.0025 = 17.50")
    print("  - PCF (0.25%): 7000 × 0.0025 = 17.50")
    print("  - Stamp Duty: 40.00")
    print("  - Total Levies: 75.00")
    print("  - Initial gets 60%: 45.00")
    print("  - Balance gets 40%: 30.00")
    
    print("\n🎯 API WILL RETURN:")
    print("  - Initial Payment: KSh 4,245")
    print("  - Balance Payment: KSh 2,830")
    print("  - Total Annual Premium: KSh 7,075")
    
    print("\n" + "="*80)
    print("✅ SUCCESS - Database updated!")
    print("="*80 + "\n")
    
except InsuranceProvider.DoesNotExist:
    print("❌ ERROR: Madison Insurance not found in database")
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
