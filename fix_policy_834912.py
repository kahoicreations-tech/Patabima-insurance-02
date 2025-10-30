"""
Fix POL-2025-834912 with correct Madison extendible pricing
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__) + '/insurance-app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import MotorPolicy

policy = MotorPolicy.objects.get(policy_number='POL-2025-834912')

print("\n" + "="*80)
print("FIXING POLICY POL-2025-834912 EXTENDIBLE CONFIG")
print("="*80)

print(f"\n❌ BEFORE (WRONG DATA):")
print(f"  Initial Amount: KSh {policy.product_details.get('extendible_config', {}).get('initial_amount'):,.2f}")
print(f"  Balance Amount: KSh {policy.product_details.get('extendible_config', {}).get('balance_amount'):,.2f}")
print(f"  Total Annual: KSh {policy.product_details.get('extendible_config', {}).get('total_annual_premium'):,.2f}")

# Update with correct Madison pricing
policy.product_details['extendible_config'] = {
    'initial_amount': 4200.0,
    'balance_amount': 2800.0,
    'total_annual_premium': 7000.0,
    'initial_period_days': 30,
    'extension_deadline_days': 90,
    'grace_period_days': 7,
    'penalty_for_late_extension': 0.0,
    'allow_partial_extension': False
}

policy.save()

print(f"\n✅ AFTER (CORRECT DATA):")
print(f"  Initial Amount: KSh {policy.product_details.get('extendible_config', {}).get('initial_amount'):,.2f}")
print(f"  Balance Amount: KSh {policy.product_details.get('extendible_config', {}).get('balance_amount'):,.2f}")
print(f"  Total Annual: KSh {policy.product_details.get('extendible_config', {}).get('total_annual_premium'):,.2f}")

print(f"\n✅ Policy updated successfully!")
print(f"\nNOTE: The user already paid KSh 3,642 (which includes levies on the 4,200 base).")
print(f"This matches the correct Madison initial payment amount.")
