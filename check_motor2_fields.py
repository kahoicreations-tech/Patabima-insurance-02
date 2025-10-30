"""
Check critical fields in Motor 2 policies - Product details analysis
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(__file__) + '/insurance-app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import MotorPolicy
import json

def check_policy_fields():
    print("\n" + "="*80)
    print("MOTOR 2 POLICY FIELDS ANALYSIS")
    print("="*80 + "\n")
    
    # Get recent policies
    policies = MotorPolicy.objects.filter(status='ACTIVE').order_by('-submitted_at')[:5]
    
    for policy in policies:
        print(f"\n{'='*80}")
        print(f"Policy: {policy.policy_number}")
        print(f"Created: {policy.submitted_at}")
        print(f"Status: {policy.status}")
        print(f"{'='*80}")
        
        # Check product_details structure
        product_details = policy.product_details
        if product_details:
            print("\n📦 PRODUCT_DETAILS:")
            print(f"  - category: {product_details.get('category', 'MISSING')}")
            print(f"  - subcategory: {product_details.get('subcategory', 'MISSING')}")
            print(f"  - coverType: {product_details.get('coverType', 'MISSING')}")
            print(f"  - coverageType: {product_details.get('coverageType', 'MISSING')}")
            print(f"  - name: {product_details.get('name', 'MISSING')}")
            print(f"  - is_extendible: {product_details.get('is_extendible', False)}")
            print(f"  - payment_plan: {product_details.get('payment_plan', 'MISSING')}")
            
            if product_details.get('is_extendible'):
                ext_config = product_details.get('extendible_config') or product_details.get('extendibleConfig')
                print(f"\n  💰 EXTENDIBLE CONFIG:")
                if ext_config:
                    print(f"     - initial_amount: {ext_config.get('initial_amount', 'MISSING')}")
                    print(f"     - balance_amount: {ext_config.get('balance_amount', 'MISSING')}")
                    print(f"     - total_annual_premium: {ext_config.get('total_annual_premium', 'MISSING')}")
                    print(f"     - initial_period_days: {ext_config.get('initial_period_days', 'MISSING')}")
                    print(f"     - extension_deadline_days: {ext_config.get('extension_deadline_days', 'MISSING')}")
                else:
                    print("     ⚠️  MISSING EXTENDIBLE CONFIG!")
        else:
            print("\n❌ NO PRODUCT_DETAILS!")
        
        # Check vehicle_details
        vehicle_details = policy.vehicle_details
        if vehicle_details:
            print("\n🚗 VEHICLE_DETAILS:")
            print(f"  - registration: {vehicle_details.get('registration', 'MISSING')}")
            print(f"  - make: {vehicle_details.get('make', 'MISSING')}")
            print(f"  - model: {vehicle_details.get('model', 'MISSING')}")
        else:
            print("\n❌ NO VEHICLE_DETAILS!")
        
        # Check client_details
        client_details = policy.client_details
        if client_details:
            print("\n👤 CLIENT_DETAILS:")
            print(f"  - fullName: {client_details.get('fullName', 'MISSING')}")
            print(f"  - email: {client_details.get('email', 'MISSING')}")
            print(f"  - phone: {client_details.get('phone', 'MISSING')}")
        else:
            print("\n❌ NO CLIENT_DETAILS!")
        
        # Check premium_breakdown
        premium_breakdown = policy.premium_breakdown
        if premium_breakdown:
            print("\n💵 PREMIUM_BREAKDOWN:")
            print(f"  - basePremium: {premium_breakdown.get('basePremium', 'MISSING')}")
            print(f"  - totalAmount: {premium_breakdown.get('totalAmount', 'MISSING')}")
        else:
            print("\n❌ NO PREMIUM_BREAKDOWN!")
        
        # Check underwriter_details
        underwriter_details = policy.underwriter_details
        if underwriter_details:
            print("\n🏢 UNDERWRITER_DETAILS:")
            print(f"  - name: {underwriter_details.get('name', 'MISSING')}")
            print(f"  - code: {underwriter_details.get('code', 'MISSING')}")
        else:
            print("\n❌ NO UNDERWRITER_DETAILS!")

if __name__ == '__main__':
    check_policy_fields()
