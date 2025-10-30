#!/usr/bin/env python3
"""
Verify if extension payment was processed for policy POL-2025-461651
"""
import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(__file__) + '/insurance-app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import MotorPolicy
import json

policy_number = 'POL-2025-461651'

try:
    policy = MotorPolicy.objects.get(policy_number=policy_number)
    
    print(f"\n{'='*80}")
    print(f"POLICY: {policy_number}")
    print(f"{'='*80}")
    
    print(f"\nBasic Info:")
    print(f"  Status: {policy.status}")
    print(f"  Cover Start: {policy.cover_start_date}")
    print(f"  Cover End: {policy.cover_end_date}")
    
    product_details = policy.product_details or {}
    extendible_config = product_details.get('extendible_config', {})
    
    print(f"\nExtendible Config:")
    print(f"  Is Extendible: {product_details.get('is_extendible', False)}")
    print(f"  Has Been Extended: {product_details.get('has_been_extended', False)}")
    print(f"  Initial Amount: KES {extendible_config.get('initial_amount', 'N/A')}")
    print(f"  Balance Amount: KES {extendible_config.get('balance_amount', 'N/A')}")
    print(f"  Total Annual: KES {extendible_config.get('total_annual_premium', 'N/A')}")
    
    extension_history = product_details.get('extension_history', [])
    print(f"\nExtension History ({len(extension_history)} records):")
    for i, ext in enumerate(extension_history, 1):
        print(f"  [{i}] Extended on: {ext.get('extended_on')}")
        print(f"      Amount Paid: KES {ext.get('amount_paid')}")
        print(f"      Payment Method: {ext.get('payment_method')}")
        print(f"      Transaction ID: {ext.get('transaction_id')}")
        print(f"      Old Expiry: {ext.get('old_expiry')}")
        print(f"      New Expiry: {ext.get('new_expiry')}")
    
    payment_details = policy.payment_details or {}
    extension_payment = payment_details.get('extension_payment')
    
    print(f"\nExtension Payment Details:")
    if extension_payment:
        print(f"  Amount: KES {extension_payment.get('amount')}")
        print(f"  Status: {extension_payment.get('status')}")
        print(f"  Method: {extension_payment.get('method')}")
        print(f"  Transaction ID: {extension_payment.get('transactionId')}")
        print(f"\n  Breakdown:")
        breakdown = extension_payment.get('breakdown', {})
        print(f"    Base Amount: KES {breakdown.get('base_amount')}")
        print(f"    Late Fee: KES {breakdown.get('late_fee')}")
        print(f"    ITL (0.25%): KES {breakdown.get('itl')}")
        print(f"    PCF (0.25%): KES {breakdown.get('pcf')}")
        print(f"    Stamp Duty: KES {breakdown.get('stamp_duty')}")
    else:
        print("  No extension payment recorded")
    
    print(f"\n{'='*80}")
    print("CONCLUSION:")
    if product_details.get('has_been_extended') and extension_history:
        print("✅ Payment HAS been processed successfully")
        print(f"✅ Policy extended to: {policy.cover_end_date}")
    else:
        print("❌ Payment NOT processed or extension not recorded")
    print(f"{'='*80}\n")

except MotorPolicy.DoesNotExist:
    print(f"\n❌ Policy {policy_number} not found in database\n")
except Exception as e:
    print(f"\n❌ Error: {e}\n")
    import traceback
    traceback.print_exc()
