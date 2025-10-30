#!/usr/bin/env python
"""Test what the Extensions endpoint will return for extendible policies."""

import os
import sys
import django
from datetime import datetime, timedelta

# Add insurance-app to path
sys.path.insert(0, os.path.dirname(__file__) + '/insurance-app')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import MotorPolicy

print('=' * 80)
print('TESTING EXTENSIONS ENDPOINT CRITERIA')
print('=' * 80)

# Get all active extendible policies
extendible_policies = MotorPolicy.objects.filter(
    status='ACTIVE',
    product_details__is_extendible=True,
    product_details__extendible_config__isnull=False
)

print(f'\nFound {extendible_policies.count()} active extendible policies with extendible_config\n')

for policy in extendible_policies:
    print(f'Policy: {policy.policy_number}')
    print(f'  Status: {policy.status}')
    print(f'  Product: {policy.product_details.get("subcategory")}')
    print(f'  Vehicle: {policy.vehicle_details.get("registration")}')
    
    ext_config = policy.product_details.get('extendible_config', {})
    print(f'  Extendible Config:')
    print(f'    - Initial Period: {ext_config.get("initial_period_days")} days')
    print(f'    - Extension Deadline: {ext_config.get("extension_deadline_days")} days')
    print(f'    - Initial Amount: KSh {ext_config.get("initial_amount"):,.2f}')
    print(f'    - Balance Amount: KSh {ext_config.get("balance_amount"):,.2f}')
    print(f'    - Total Premium: KSh {ext_config.get("total_annual_premium"):,.2f}')
    
    # Calculate timeline
    cover_start = policy.cover_start_date
    initial_period_days = ext_config.get('initial_period_days', 30)
    extension_deadline_days = ext_config.get('extension_deadline_days', 60)
    
    initial_end = cover_start + timedelta(days=initial_period_days)
    balance_deadline = cover_start + timedelta(days=initial_period_days + extension_deadline_days)
    
    today = datetime.now().date()
    days_to_initial = (initial_end - today).days
    days_to_balance = (balance_deadline - today).days
    
    print(f'  Timeline:')
    print(f'    - Cover Start: {cover_start}')
    print(f'    - Initial Period End: {initial_end} ({days_to_initial} days from now)')
    print(f'    - Balance Deadline: {balance_deadline} ({days_to_balance} days from now)')
    
    print(f'  ✅ WILL APPEAR IN EXTENSIONS TAB')
    print()

if extendible_policies.count() == 0:
    print('❌ No policies match the Extensions endpoint criteria!')
    print('   Criteria: status=ACTIVE AND is_extendible=True AND extendible_config IS NOT NULL')
