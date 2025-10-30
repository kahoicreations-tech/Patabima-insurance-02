import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'insurance-app'))
django.setup()

from app.models import MotorPolicy
from django.utils import timezone

print("\n=== CHECKING EXTENDIBLE POLICIES FILTERING ===\n")

# Get all ACTIVE extendible policies
active_policies = MotorPolicy.objects.filter(status='ACTIVE').order_by('policy_number')

print(f"Total ACTIVE policies: {active_policies.count()}\n")

extendible_count = 0
already_paid_count = 0
should_show_count = 0

for policy in active_policies:
    is_extendible = policy.product_details.get('is_extendible', False)
    
    if is_extendible:
        extendible_count += 1
        has_been_extended = policy.product_details.get('has_been_extended', False)
        
        status_emoji = "✅ PAID" if has_been_extended else "❌ UNPAID"
        filter_status = "FILTERED OUT" if has_been_extended else "SHOW IN LIST"
        
        print(f"{status_emoji} {policy.policy_number}")
        print(f"    is_extendible: {is_extendible}")
        print(f"    has_been_extended: {has_been_extended}")
        print(f"    Filter Status: {filter_status}")
        
        # Check if policy has extendible config
        extendible_config = policy.product_details.get('extendible_config') or policy.product_details.get('extendibleConfig')
        if extendible_config:
            balance_amount = extendible_config.get('balance_amount', 0)
            print(f"    balance_amount: KES {balance_amount}")
        
        print()
        
        if has_been_extended:
            already_paid_count += 1
        else:
            should_show_count += 1

print(f"\n=== SUMMARY ===")
print(f"Total ACTIVE policies: {active_policies.count()}")
print(f"Extendible policies: {extendible_count}")
print(f"Already paid (should be filtered): {already_paid_count}")
print(f"Unpaid (should show in list): {should_show_count}")
print(f"\n✅ Expected API to return: {should_show_count} policies")
