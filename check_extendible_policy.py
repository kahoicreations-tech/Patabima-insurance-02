#!/usr/bin/env python
"""Check if Third Party (Extendible) policy has correct configuration."""

import os
import sys
import django

# Add the insurance-app directory to Python path
sys.path.insert(0, os.path.dirname(__file__) + '/insurance-app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import MotorPolicy
import json

# Get the policy from screenshot
policy_number = 'POL-2025-220820'
policy = MotorPolicy.objects.filter(policy_number=policy_number).first()

if policy:
    print(f'✓ Found Policy: {policy.policy_number}')
    print(f'  Status: {policy.status}')
    print(f'  Product Type: {policy.product_details.get("subcategory") or policy.product_details.get("coverType", "UNKNOWN")}')
    print()
    
    # Check is_extendible flag
    is_extendible = policy.product_details.get('is_extendible', False)
    print(f'  is_extendible: {is_extendible}')
    
    # Check for extendible_config
    has_config = 'extendible_config' in policy.product_details or 'extendibleConfig' in policy.product_details
    print(f'  has extendible_config: {has_config}')
    
    if has_config:
        config = policy.product_details.get('extendible_config') or policy.product_details.get('extendibleConfig')
        print(f'\n  Extendible Config:')
        print(json.dumps(config, indent=4))
    
    print(f'\n  Cover Start: {policy.cover_start_date}')
    print(f'  Cover End: {policy.cover_end_date}')
    
    # Calculate if it should appear in extensions
    if policy.status == 'ACTIVE' and is_extendible and has_config:
        print(f'\n✅ This policy SHOULD appear in Extensions tab')
        
        # Calculate timeline
        from datetime import timedelta, datetime
        from django.utils import timezone
        
        today = timezone.now().date()
        config = policy.product_details.get('extendible_config') or policy.product_details.get('extendibleConfig')
        
        initial_period_days = config.get('initial_period_days', 30)
        extension_deadline_days = config.get('extension_deadline_days', 60)
        
        cover_start = policy.cover_start_date
        initial_period_end = cover_start + timedelta(days=initial_period_days)
        balance_deadline = initial_period_end + timedelta(days=extension_deadline_days)
        
        print(f'\n  Timeline:')
        print(f'    Initial Period End: {initial_period_end} ({(initial_period_end - today).days} days)')
        print(f'    Balance Deadline: {balance_deadline} ({(balance_deadline - today).days} days)')
    else:
        print(f'\n❌ This policy will NOT appear in Extensions tab')
        print(f'   Reason: status={policy.status}, is_extendible={is_extendible}, has_config={has_config}')
        
else:
    print(f'❌ Policy {policy_number} not found')
    
    # List all extendible policies
    print('\nSearching for all ACTIVE extendible policies...')
    extendible_policies = MotorPolicy.objects.filter(
        status='ACTIVE',
        product_details__is_extendible=True
    )
    
    print(f'Found {extendible_policies.count()} ACTIVE extendible policies:')
    for p in extendible_policies:
        print(f'  - {p.policy_number}: {p.product_details.get("subcategory", "UNKNOWN")}')
