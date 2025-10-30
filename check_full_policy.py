"""
Check all fields in POL-2025-834912
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

print("\n📋 ALL FIELDS:")
print(f"  policy_number: {policy.policy_number}")
print(f"  status: {policy.status}")
print(f"  cover_start_date: {policy.cover_start_date}")
print(f"  cover_end_date: {policy.cover_end_date}")

print("\n📦 PRODUCT_DETAILS (full):")
print(json.dumps(policy.product_details, indent=2) if policy.product_details else "NULL")

print("\n🚗 VEHICLE_DETAILS (full):")
print(json.dumps(policy.vehicle_details, indent=2) if policy.vehicle_details else "NULL")

print("\n👤 CLIENT_DETAILS (full):")
print(json.dumps(policy.client_details, indent=2) if policy.client_details else "NULL")

print("\n💳 PAYMENT_DETAILS (full):")
print(json.dumps(policy.payment_details, indent=2) if policy.payment_details else "NULL")

print("\n📄 DOCUMENTS:")
print(json.dumps(policy.documents, indent=2) if policy.documents else "NULL")

print("\n🏢 UNDERWRITER_DETAILS:")
print(json.dumps(policy.underwriter_details, indent=2) if policy.underwriter_details else "NULL")

print("\n💵 PREMIUM_BREAKDOWN:")
print(json.dumps(policy.premium_breakdown, indent=2) if policy.premium_breakdown else "NULL")
