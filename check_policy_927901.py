import os
import sys
import django

# Add insurance-app to path
sys.path.insert(0, os.path.dirname(__file__) + '/insurance-app')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import MotorPolicy

try:
    policy = MotorPolicy.objects.get(policy_number='POL-2025-927901')
    print(f'✓ Found Policy: {policy.policy_number}')
    print(f'  Status: {policy.status}')
    print(f'  Product: {policy.product_details.get("subcategory", "N/A")}')
    print(f'  is_extendible: {policy.product_details.get("is_extendible", False)}')
    
    # Check extendible_config
    ext_config = policy.product_details.get('extendible_config')
    print(f'  has extendible_config: {ext_config is not None}')
    
    if ext_config:
        print(f'  extendible_config: {ext_config}')
    else:
        print(f'\n❌ ISSUE: Policy is missing extendible_config')
        print(f'  This is why it does NOT appear in Extensions tab')
        print(f'  Backend endpoint requires: status=ACTIVE + is_extendible=True + extendible_config exists')
        
    # Check premium breakdown
    premium = policy.product_details.get('premium_breakdown', {})
    print(f'\n  Premium breakdown keys: {list(premium.keys())}')
    
    # Check payment plan
    print(f'\n  Payment plan: {policy.product_details.get("payment_plan", "N/A")}')
    
except MotorPolicy.DoesNotExist:
    print(f'❌ Policy POL-2025-927901 not found')
except Exception as e:
    print(f'❌ Error: {e}')
