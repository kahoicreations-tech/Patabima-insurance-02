#!/usr/bin/env python
"""Fix POL-2025-927901 by adding extendible_config to product_details."""

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
    print(f'  Current Status: {policy.status}')
    print(f'  Product: {policy.product_details.get("subcategory", "N/A")}')
    
    # Check if already has extendible_config
    if policy.product_details.get('extendible_config'):
        print(f'\n✓ Policy already has extendible_config')
        print(f'  Config: {policy.product_details["extendible_config"]}')
    else:
        print(f'\n⚠️  Policy missing extendible_config, adding now...')
        
        # Get premium breakdown to calculate extendible amounts
        premium_breakdown = policy.product_details.get('premium_breakdown', {})
        total_premium = premium_breakdown.get('totalAmount', 0)
        
        # For Third Party Extendible: 50% initial, 50% balance
        # 30 days initial period, 60 days grace for balance
        initial_amount = total_premium / 2
        balance_amount = total_premium / 2
        
        extendible_config = {
            'initial_period_days': 30,
            'extension_deadline_days': 60,
            'initial_amount': initial_amount,
            'balance_amount': balance_amount,
            'total_annual_premium': total_premium
        }
        
        # Add to product_details
        policy.product_details['extendible_config'] = extendible_config
        
        # Also update premium_breakdown to include extendible_config
        if 'premium_breakdown' not in policy.product_details:
            policy.product_details['premium_breakdown'] = {}
        
        policy.product_details['premium_breakdown']['extendible_config'] = extendible_config
        
        # Save the policy
        policy.save()
        
        print(f'✅ SUCCESS! Added extendible_config:')
        print(f'  Initial Period: 30 days')
        print(f'  Extension Deadline: 60 days')
        print(f'  Initial Amount: KSh {initial_amount:,.2f}')
        print(f'  Balance Amount: KSh {balance_amount:,.2f}')
        print(f'  Total Annual Premium: KSh {total_premium:,.2f}')
        print(f'\n✓ Policy will now appear in Extensions tab')
        print(f'✓ Extendible banner will show correct dates')
        
except MotorPolicy.DoesNotExist:
    print(f'❌ Policy POL-2025-927901 not found')
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc()
