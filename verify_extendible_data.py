"""
Test extensions endpoint data directly
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
print("POLICY DATA THAT SHOULD BE IN API RESPONSE")
print("="*80)

# Simulate what the API should return
print(f"\nPolicy: {policy.policy_number}")

# Payment details
payment_details = policy.payment_details or {}
print(f"\n💳 PAYMENT DETAILS (from database):")
print(f"  Transaction ID: {payment_details.get('transactionId') or payment_details.get('transaction_id')}")
print(f"  Payment Method: {payment_details.get('method')}")
print(f"  Amount Paid: {payment_details.get('amount')}")
print(f"  Payment Status: {payment_details.get('status')}")

# Underwriter
print(f"\n🏢 UNDERWRITER:")
if policy.underwriter_details:
    print(f"  Name: {policy.underwriter_details.get('name')}")
else:
    if policy.product_details and policy.product_details.get('is_extendible'):
        print(f"  Status: Pending (Balance Payment)")
        print(f"  Transaction Proof: {payment_details.get('transactionId') or payment_details.get('transaction_id')}")
    else:
        print(f"  Status: Not Selected")

# Extendible config
if policy.product_details:
    ext_config = policy.product_details.get('extendible_config')
    if ext_config:
        print(f"\n💰 EXTENDIBLE CONFIG:")
        print(f"  Initial Amount: {ext_config.get('initial_amount')}")
        print(f"  Balance Amount: {ext_config.get('balance_amount')}")
        print(f"  Total Annual: {ext_config.get('total_annual_premium')}")
        print(f"  Initial Period: {ext_config.get('initial_period_days')} days")
        print(f"  Extension Deadline: {ext_config.get('extension_deadline_days')} days")

print("\n" + "="*80)
print("EXPECTED API FIELDS:")
print("="*80)
print("✅ transactionId: Should be in response")
print("✅ paymentMethod: Should be in response")
print("✅ paidAmount: Should be in response")
print("✅ paymentStatus: Should be in response")
print("✅ underwriterName: Should be 'Pending (Balance Payment)'")
print("✅ initialAmount: From extendible_config")
print("✅ balanceAmount: From extendible_config")
