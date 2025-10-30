"""
Simple test: Check if POL-2025-560572 appears in extensions
"""

import os
import sys

# Setup Django first
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'insurance-app'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')

import django
django.setup()

from app.models import MotorPolicy
from django.utils import timezone
from datetime import timedelta

print("\n" + "="*80)
print("CHECK: Should POL-2025-560572 appear in Extensions?")
print("="*80 + "\n")

policy = MotorPolicy.objects.get(policy_number='POL-2025-560572')

print(f"✓ Policy found: {policy.policy_number}")
print(f"✓ Status: {policy.status}")
print(f"✓ Cover Start: {policy.cover_start_date}")

pd = policy.product_details or {}
is_ext = pd.get('is_extendible', False)
config = pd.get('extendible_config')

print(f"✓ is_extendible: {is_ext}")
print(f"✓ Has config: {bool(config)}")

# Check conditions
checks = {
    'Status is ACTIVE': policy.status == 'ACTIVE',
    'is_extendible flag is True': is_ext,
    'extendible_config exists': bool(config),
    'Has cover_start_date': bool(policy.cover_start_date)
}

print("\n" + "-"*80)
print("ELIGIBILITY CHECKS:")
print("-"*80)
for check, passed in checks.items():
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} - {check}")

all_passed = all(checks.values())
print("\n" + "="*80)
if all_passed:
    print("✅ POLICY SHOULD APPEAR IN UPCOMING EXTENSIONS")
    
    # Calculate timeline
    today = timezone.now().date()
    initial_days = config.get('initial_period_days', 30)
    extension_days = config.get('extension_deadline_days', 90)
    
    initial_end = policy.cover_start_date + timedelta(days=initial_days)
    balance_end = initial_end + timedelta(days=extension_days)
    
    days_to_initial = (initial_end - today).days
    days_to_balance = (balance_end - today).days
    
    print(f"\nTimeline:")
    print(f"  Today: {today}")
    print(f"  Initial Period Ends: {initial_end} ({days_to_initial} days)")
    print(f"  Balance Deadline: {balance_end} ({days_to_balance} days)")
else:
    print("❌ POLICY WILL NOT APPEAR - Failed eligibility checks")

print("="*80 + "\n")
