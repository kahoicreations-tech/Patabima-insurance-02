"""
Check POL-2025-834912 data structure
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
print(f"Policy: {policy.policy_number}")
print("="*80)

print("\n📦 UNDERWRITER_DETAILS:")
print(json.dumps(policy.underwriter_details, indent=2) if policy.underwriter_details else "NULL")

print("\n💵 PREMIUM_BREAKDOWN:")
print(json.dumps(policy.premium_breakdown, indent=2) if policy.premium_breakdown else "NULL")

print("\n📋 PRODUCT_DETAILS:")
if policy.product_details:
    print(f"  subcategory: {policy.product_details.get('subcategory')}")
    print(f"  is_extendible: {policy.product_details.get('is_extendible')}")
