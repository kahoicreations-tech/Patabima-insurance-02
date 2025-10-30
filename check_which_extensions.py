"""
Check which policies should appear in extensions
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(__file__) + '/insurance-app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import MotorPolicy
from datetime import date

def check_extensions():
    print("\n" + "="*80)
    print("ACTIVE EXTENDIBLE POLICIES CHECK")
    print("="*80 + "\n")
    
    # Get ACTIVE policies
    active_policies = MotorPolicy.objects.filter(status='ACTIVE').order_by('-submitted_at')
    
    print(f"Total ACTIVE policies: {active_policies.count()}\n")
    
    for policy in active_policies:
        is_extendible = policy.product_details.get('is_extendible', False) if policy.product_details else False
        has_config = bool(policy.product_details.get('extendible_config') or policy.product_details.get('extendibleConfig')) if policy.product_details else False
        
        print(f"Policy: {policy.policy_number}")
        print(f"  Status: {policy.status}")
        print(f"  Submitted: {policy.submitted_at}")
        print(f"  Cover Start: {policy.cover_start_date}")
        print(f"  Is Extendible: {is_extendible}")
        print(f"  Has Config: {has_config}")
        
        if policy.product_details:
            print(f"  Subcategory: {policy.product_details.get('subcategory', 'N/A')}")
            print(f"  Payment Plan: {policy.product_details.get('payment_plan', 'N/A')}")
        
        print(f"  >>> SHOULD SHOW IN EXTENSIONS: {is_extendible and has_config}")
        print()

if __name__ == '__main__':
    check_extensions()
