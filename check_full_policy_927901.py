#!/usr/bin/env python
"""Check full details of POL-2025-927901."""

import os
import sys
import django
import json

# Add insurance-app to path
sys.path.insert(0, os.path.dirname(__file__) + '/insurance-app')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import MotorPolicy

try:
    policy = MotorPolicy.objects.get(policy_number='POL-2025-927901')
    print(f'✓ Found Policy: {policy.policy_number}\n')
    
    print(f'Full product_details:')
    print(json.dumps(policy.product_details, indent=2))
    
    print(f'\n\nPayment Details:')
    print(f'  Amount: {policy.payment_details.get("amount", "N/A")}')
    print(f'  Status: {policy.payment_details.get("status", "N/A")}')
    print(f'  Transaction ID: {policy.payment_details.get("transaction_id", "N/A")}')
    
except MotorPolicy.DoesNotExist:
    print(f'❌ Policy POL-2025-927901 not found')
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc()
