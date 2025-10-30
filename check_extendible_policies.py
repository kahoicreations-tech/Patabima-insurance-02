"""
Quick diagnostic script to check extendible policy configuration.
Run this to see what policies exist and their extendible status.
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
print("EXTENDIBLE POLICY DIAGNOSTIC")
print("="*80 + "\n")

# Get all ACTIVE policies
active_policies = MotorPolicy.objects.filter(status='ACTIVE').order_by('-date_created')

print(f"Found {active_policies.count()} ACTIVE policies\n")

for policy in active_policies:
    print(f"\nPolicy: {policy.policy_number}")
    print(f"Status: {policy.status}")
    print(f"Cover Start: {policy.cover_start_date}")
    print(f"Cover End: {policy.cover_end_date}")
    
    # Check product details
    pd = policy.product_details or {}
    
    subcategory = pd.get('subcategory') or pd.get('subcategory_code')
    is_extendible = pd.get('is_extendible', False)
    
    print(f"Subcategory: {subcategory}")
    print(f"is_extendible flag: {is_extendible}")
    
    # Check for extendible config
    ext_config = pd.get('extendible_config') or pd.get('extendibleConfig')
    
    if ext_config:
        print(f"✅ HAS extendible_config:")
        print(f"   - Initial Period: {ext_config.get('initial_period_days')} days")
        print(f"   - Extension Deadline: {ext_config.get('extension_deadline_days')} days")
        print(f"   - Initial Amount: KES {ext_config.get('initial_amount')}")
        print(f"   - Balance Amount: KES {ext_config.get('balance_amount')}")
    else:
        print(f"❌ NO extendible_config found")
    
    # Check payment plan
    payment_plan = pd.get('payment_plan')
    if payment_plan:
        print(f"Payment Plan: {payment_plan}")
    
    print("-" * 80)

print("\n" + "="*80)
print("EXTENDIBLE SUBCATEGORIES IN DATABASE")
print("="*80 + "\n")

from app.models import MotorSubcategory

ext_subcats = MotorSubcategory.objects.filter(subcategory_code__icontains='EXT')
print(f"Found {ext_subcats.count()} extendible subcategories:\n")

for subcat in ext_subcats:
    print(f"- {subcat.subcategory_code}: {subcat.subcategory_name}")

print("\n" + "="*80)
print("EXTENDIBLE PRICING CONFIGURATIONS")
print("="*80 + "\n")

from app.models import ExtendiblePricing

ext_pricings = ExtendiblePricing.objects.all()
print(f"Found {ext_pricings.count()} extendible pricing configurations:\n")

for ep in ext_pricings:
    print(f"\n{ep.subcategory.subcategory_code} - {ep.subcategory.subcategory_name}")
    print(f"  Underwriter: {ep.underwriter.name if ep.underwriter else 'N/A'}")
    print(f"  Initial Period: {ep.initial_period_days} days")
    print(f"  Extension Deadline: {ep.extension_deadline_days} days")
    print(f"  Initial Amount: KES {ep.initial_amount}")
    print(f"  Balance Amount: KES {ep.balance_amount}")
    print(f"  Total Premium: KES {ep.total_annual_premium}")

print("\n" + "="*80)
