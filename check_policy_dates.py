"""
Deep check of POL-2025-834912 - Focus on dates and payment
"""
import os
import sys
import django
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__) + '/insurance-app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import MotorPolicy
import json

policy = MotorPolicy.objects.get(policy_number='POL-2025-834912')

print("\n" + "="*80)
print(f"Policy: {policy.policy_number}")
print("="*80)

print("\n📅 DATE FIELDS:")
print(f"  submitted_at: {policy.submitted_at}")
print(f"  cover_start_date: {policy.cover_start_date}")
print(f"  cover_end_date: {policy.cover_end_date}")
print(f"  approved_at: {policy.approved_at}")

# Calculate what the dates SHOULD be
if policy.cover_start_date:
    start = policy.cover_start_date
    print(f"\n🔍 CALCULATED TIMELINE (should be):")
    print(f"  Cover Start: {start}")
    
    ext_config = policy.product_details.get('extendible_config', {})
    initial_days = ext_config.get('initial_period_days', 30)
    extension_days = ext_config.get('extension_deadline_days', 90)
    
    initial_end = start + timedelta(days=initial_days)
    balance_deadline = initial_end + timedelta(days=extension_days)
    
    print(f"  Initial Period End: {initial_end} (start + {initial_days} days)")
    print(f"  Balance Deadline: {balance_deadline} (initial_end + {extension_days} days)")
    print(f"  Cover End: {policy.cover_end_date}")

print("\n💰 EXTENDIBLE CONFIG:")
ext_config = policy.product_details.get('extendible_config', {})
for key, value in ext_config.items():
    print(f"  {key}: {value}")

print("\n💳 PAYMENT DETAILS (full):")
print(json.dumps(policy.payment_details, indent=2))

print("\n🏢 UNDERWRITER DETAILS (full):")
print(json.dumps(policy.underwriter_details, indent=2) if policy.underwriter_details else "NULL")

# Check if underwriter might be in product_details or vehicle_details
print("\n🔍 SEARCHING FOR UNDERWRITER IN OTHER FIELDS:")
if policy.product_details:
    for key in policy.product_details.keys():
        if 'underwriter' in key.lower() or 'insurer' in key.lower():
            print(f"  product_details.{key}: {policy.product_details[key]}")

if policy.vehicle_details:
    for key in policy.vehicle_details.keys():
        if 'underwriter' in key.lower() or 'insurer' in key.lower():
            print(f"  vehicle_details.{key}: {policy.vehicle_details[key]}")
