"""
Check why paid amount (3,642) differs from initial amount (5,000)
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
print("PRICING BREAKDOWN ANALYSIS")
print("="*80)

extendible_config = policy.product_details.get('extendible_config', {})
payment_details = policy.payment_details or {}

print(f"\n💰 EXTENDIBLE CONFIG:")
print(f"  Initial Amount: KSh {extendible_config.get('initial_amount'):,.2f}")
print(f"  Balance Amount: KSh {extendible_config.get('balance_amount'):,.2f}")
print(f"  Total Annual Premium: KSh {extendible_config.get('total_annual_premium'):,.2f}")

print(f"\n💳 ACTUAL PAYMENT:")
print(f"  Amount Paid: KSh {payment_details.get('amount'):,.2f}")
print(f"  Transaction ID: {payment_details.get('transactionId')}")

print(f"\n⚠️ DISCREPANCY:")
print(f"  Expected Initial Payment: KSh {extendible_config.get('initial_amount'):,.2f}")
print(f"  Actual Amount Paid: KSh {payment_details.get('amount'):,.2f}")
print(f"  Difference: KSh {extendible_config.get('initial_amount') - payment_details.get('amount'):,.2f}")

# Check if there's a pricing breakdown in product_details
pricing_breakdown = policy.product_details.get('pricing_breakdown') or {}
print(f"\n📊 PRICING BREAKDOWN (if available):")
if pricing_breakdown:
    print(json.dumps(pricing_breakdown, indent=2))
else:
    print("  No pricing_breakdown found in product_details")

# Check total_amount field
print(f"\n📋 OTHER AMOUNT FIELDS:")
print(f"  total_amount: {policy.total_amount}")
print(f"  product_details.total_annual_premium: {extendible_config.get('total_annual_premium')}")

# Theory: Initial payment might include levies
print(f"\n💡 THEORY:")
print(f"  If initial_amount is the BASE premium (5000)")
print(f"  And paid_amount includes levies (3642)")
print(f"  Then the user may have selected a LOWER coverage amount")
print(f"  OR there was a pricing calculation error")

# Check subcategory pricing
subcategory = policy.product_details.get('subcategory')
print(f"\n🔍 PRODUCT DETAILS:")
print(f"  Subcategory: {subcategory}")
print(f"  Category: {policy.product_details.get('category')}")
print(f"  Is Extendible: {policy.product_details.get('is_extendible')}")
print(f"  Payment Plan: {policy.product_details.get('payment_plan')}")
