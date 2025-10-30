"""
Check specific policy POL-2025-560572
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'insurance-app'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import MotorPolicy
import json

print("\n" + "="*80)
print("CHECKING POLICY POL-2025-560572")
print("="*80 + "\n")

try:
    policy = MotorPolicy.objects.get(policy_number='POL-2025-560572')
    
    print(f"Policy Number: {policy.policy_number}")
    print(f"Status: {policy.status}")
    print(f"Cover Start: {policy.cover_start_date}")
    print(f"Cover End: {policy.cover_end_date}")
    print(f"Created: {policy.date_created}")
    
    print("\n" + "-"*80)
    print("PRODUCT DETAILS:")
    print("-"*80)
    
    pd = policy.product_details or {}
    print(json.dumps(pd, indent=2, default=str))
    
    print("\n" + "-"*80)
    print("KEY CHECKS:")
    print("-"*80)
    
    subcategory = pd.get('subcategory') or pd.get('subcategory_code')
    is_extendible_flag = pd.get('is_extendible', False)
    ext_config = pd.get('extendible_config') or pd.get('extendibleConfig')
    payment_plan = pd.get('payment_plan')
    
    print(f"Subcategory: {subcategory}")
    print(f"Contains 'EXT': {'EXT' in str(subcategory).upper() if subcategory else False}")
    print(f"is_extendible flag: {is_extendible_flag}")
    print(f"Has extendible_config: {bool(ext_config)}")
    print(f"Payment Plan: {payment_plan}")
    
    if ext_config:
        print(f"\n✅ EXTENDIBLE CONFIG FOUND:")
        print(f"   Initial Period: {ext_config.get('initial_period_days')} days")
        print(f"   Extension Deadline: {ext_config.get('extension_deadline_days')} days")
        print(f"   Initial Amount: KES {ext_config.get('initial_amount')}")
        print(f"   Balance Amount: KES {ext_config.get('balance_amount')}")
    else:
        print(f"\n❌ NO EXTENDIBLE CONFIG - This is NOT an extendible policy!")
    
    print("\n" + "-"*80)
    print("VEHICLE DETAILS:")
    print("-"*80)
    vd = policy.vehicle_details or {}
    print(f"Registration: {vd.get('registration') or vd.get('registration_number')}")
    print(f"Make: {vd.get('make')}")
    print(f"Model: {vd.get('model')}")
    
    print("\n" + "-"*80)
    print("PREMIUM BREAKDOWN:")
    print("-"*80)
    pb = policy.premium_breakdown or {}
    print(json.dumps(pb, indent=2, default=str))
    
    print("\n" + "="*80)
    
except MotorPolicy.DoesNotExist:
    print(f"❌ Policy POL-2025-560572 not found in database!")
    print("\nSearching for similar policies...")
    
    similar = MotorPolicy.objects.filter(policy_number__icontains='560572')
    print(f"Found {similar.count()} similar policies")
    
    for p in similar:
        print(f"  - {p.policy_number} (Status: {p.status})")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
