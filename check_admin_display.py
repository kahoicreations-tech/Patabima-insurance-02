"""
Check admin display data
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
print("ADMIN DISPLAY CHECK")
print("="*80)

print(f"\n📋 Policy: {policy.policy_number}")
print(f"\n💳 payment_details type: {type(policy.payment_details)}")
print(f"   payment_details value: {policy.payment_details}")

if policy.payment_details:
    txn_id = policy.payment_details.get('transactionId') or policy.payment_details.get('transaction_id')
    print(f"\n   Transaction ID extracted: {txn_id}")
    print(f"   Admin should show: {txn_id}")
else:
    print(f"\n   ❌ payment_details is None or empty!")

print(f"\n🏢 underwriter_details type: {type(policy.underwriter_details)}")
print(f"   underwriter_details value: {policy.underwriter_details}")

print(f"\n📦 product_details.is_extendible: {policy.product_details.get('is_extendible')}")

print("\n" + "="*80)
print("EXPECTED ADMIN DISPLAY")
print("="*80)
print(f"UNDERWRITER column: ⏳ Extendible - Initial Payment")
print(f"TRANSACTION ID column: SIM-1761578604786")
