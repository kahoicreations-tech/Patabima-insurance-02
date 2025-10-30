#!/usr/bin/env python
"""Fix POL-2025-927901 extendible_config with correct premium amount."""

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
    
    # Get total premium from payment_details
    total_premium = policy.payment_details.get('amount', 0)
    print(f'  Total Premium from payment: KSh {total_premium:,.2f}')
    
    # Calculate extendible amounts (50-50 split for Third Party Extendible)
    initial_amount = total_premium / 2
    balance_amount = total_premium / 2
    
    # Create proper extendible_config
    extendible_config = {
        'initial_period_days': 30,
        'extension_deadline_days': 60,
        'initial_amount': initial_amount,
        'balance_amount': balance_amount,
        'total_annual_premium': total_premium
    }
    
    # Update product_details
    policy.product_details['extendible_config'] = extendible_config
    
    # Update premium_breakdown
    if 'premium_breakdown' not in policy.product_details:
        policy.product_details['premium_breakdown'] = {}
    
    policy.product_details['premium_breakdown'].update({
        'totalAmount': total_premium,
        'extendible_config': extendible_config
    })
    
    # Save
    policy.save()
    
    print(f'\n✅ SUCCESS! Updated extendible_config:')
    print(f'  Initial Period: 30 days')
    print(f'  Extension Deadline: 60 days')
    print(f'  Initial Amount: KSh {initial_amount:,.2f}')
    print(f'  Balance Amount: KSh {balance_amount:,.2f}')
    print(f'  Total Annual Premium: KSh {total_premium:,.2f}')
    print(f'\n✓ Policy will now appear in Extensions tab with correct amounts')
    
except MotorPolicy.DoesNotExist:
    print(f'❌ Policy POL-2025-927901 not found')
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc()
