"""
Check what the extensions API is actually returning
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__) + '/insurance-app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import MotorPolicy
import json

policy = MotorPolicy.objects.get(policy_number='POL-2025-834912')

print("\n" + "="*80)
print("WHAT BACKEND API SHOULD RETURN (get_upcoming_extensions)")
print("="*80)

# This is what the API returns
extendible_config = policy.product_details.get('extendible_config', {})
payment_details = policy.payment_details or {}

print(f"\n📋 EXTENDIBLE CONFIG (from product_details):")
print(json.dumps(extendible_config, indent=2))

print(f"\n💳 PAYMENT DETAILS (from payment_details):")
print(json.dumps(payment_details, indent=2))

print(f"\n🔍 WHAT FRONTEND WILL RECEIVE:")
print(f"  initialAmount: {extendible_config.get('initial_amount')}")
print(f"  balanceAmount: {extendible_config.get('balance_amount')}")
print(f"  totalAnnualPremium: {extendible_config.get('total_annual_premium')}")
print(f"  transactionId: {payment_details.get('transactionId')}")
print(f"  paidAmount: {payment_details.get('amount')}")

print("\n" + "="*80)
print("THE PROBLEM")
print("="*80)
print(f"""
Frontend is showing:
  Initial Paid: KSh 5,000
  Balance Due: KSh 15,000
  Total: KSh 20,000

This data is WRONG! It's coming from the corrupted extendible_config saved in the database.

The policy was created when ExtendiblePricing table had wrong data (5000/15000/20000).
Now that we removed ExtendiblePricing table, new policies will get correct data from 
InsuranceProvider.features.pricing, but this old policy still has wrong data.

SOLUTION: Delete this policy and create a new one, OR manually update the 
product_details.extendible_config to have the correct Madison pricing.
""")
