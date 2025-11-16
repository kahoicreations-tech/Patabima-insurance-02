#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.admin import PRICING_BUILDER_ENABLED, InsuranceProviderAdmin, MotorPricingAdmin
from app.models import InsuranceProvider, MotorPricing

print("=== PRICING BUILDER FEATURE FLAG STATUS ===")
print(f"PRICING_BUILDER_ENABLED: {PRICING_BUILDER_ENABLED}")
print(f"Environment variable: {os.environ.get('PRICING_BUILDER_ENABLED', 'Not set')}")

print("\n=== INSURANCE PROVIDER ADMIN ACTIONS ===")
provider_admin = InsuranceProviderAdmin(InsuranceProvider, None)
print(f"Available actions: {provider_admin.actions}")

print("\n=== MOTOR PRICING ADMIN ACTIONS ===")
pricing_admin = MotorPricingAdmin(MotorPricing, None)
print(f"Available actions: {pricing_admin.actions}")

print("\n=== EXPECTED BEHAVIOR ===")
if PRICING_BUILDER_ENABLED:
    print("✓ Pricing builder is ENABLED")
    print("✓ InsuranceProvider should have: ['materialize_pricing_from_features']")
    print("✓ MotorPricing should have: ['activate_selected', 'deactivate_selected', 'clone_pricing_to_underwriter', 'bulk_update_rates_by_percentage']")
else:
    print("✓ Pricing builder is DISABLED (as requested)")
    print("✓ InsuranceProvider should have: [] (empty)")
    print("✓ MotorPricing should have: ['activate_selected', 'deactivate_selected'] (only safe actions)")