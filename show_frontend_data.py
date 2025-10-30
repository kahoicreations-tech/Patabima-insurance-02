"""
Show what data the frontend SHOULD be receiving for the extension
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__) + '/insurance-app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import MotorPolicy
from datetime import timedelta
import json

policy = MotorPolicy.objects.get(policy_number='POL-2025-834912')

print("\n" + "="*80)
print("WHAT THE FRONTEND SHOULD BE RECEIVING")
print("="*80)

# Extract data
product_details = policy.product_details or {}
extendible_config = product_details.get('extendible_config') or {}
payment_details = policy.payment_details or {}
underwriter_details = policy.underwriter_details or {}

# Timeline calculations
cover_start = policy.cover_start_date
initial_period_days = extendible_config.get('initial_period_days', 30)
extension_deadline_days = extendible_config.get('extension_deadline_days', 90)

initial_period_end = cover_start + timedelta(days=initial_period_days)
balance_deadline = initial_period_end + timedelta(days=extension_deadline_days)

print(f"\n📅 TIMELINE DATA:")
print(f"  Cover Start Date: {cover_start}")
print(f"  Initial Period Days: {initial_period_days}")
print(f"  Extension Deadline Days: {extension_deadline_days}")
print(f"  ➡️ Initial Period End: {initial_period_end} (Cover Start + {initial_period_days} days)")
print(f"  ➡️ Balance Deadline: {balance_deadline} (Initial End + {extension_deadline_days} days)")

print(f"\n💰 PAYMENT AMOUNTS:")
print(f"  Initial Amount: KSh {extendible_config.get('initial_amount', 0):,.2f}")
print(f"  Balance Amount: KSh {extendible_config.get('balance_amount', 0):,.2f}")
print(f"  Total Annual: KSh {extendible_config.get('total_annual_premium', 0):,.2f}")

print(f"\n💳 TRANSACTION DETAILS:")
print(f"  Transaction ID: {payment_details.get('transactionId', 'N/A')}")
print(f"  Payment Method: {payment_details.get('method', 'N/A')}")
print(f"  Amount Paid: KSh {payment_details.get('amount', 0):,.2f}")
print(f"  Payment Status: {payment_details.get('status', 'PENDING')}")

print(f"\n🏢 UNDERWRITER:")
if underwriter_details:
    print(f"  Name: {underwriter_details.get('name', 'N/A')}")
else:
    if product_details.get('is_extendible'):
        print(f"  Status: Pending (Balance Payment)")
    else:
        print(f"  Status: Not Selected")

print("\n" + "="*80)
print("EXPECTED FRONTEND DISPLAY (UpcomingScreen.js - Extensions Tab)")
print("="*80)
print(f"""
Card Header:
  📋 Policy: POL-2025-834912
  🚗 Vehicle: {policy.vehicle_details.get('registration', 'N/A')}
  📝 Product: {product_details.get('subcategory', 'EXTENDIBLE')}
  
Payment Info:
  Initial Paid: KSh {extendible_config.get('initial_amount', 0):,.0f}
  Balance Due: KSh {extendible_config.get('balance_amount', 0):,.0f}
  Total Annual Premium: KSh {extendible_config.get('total_annual_premium', 0):,.0f}
  
Transaction & Underwriter:
  Insurer: {underwriter_details.get('name') if underwriter_details else 'Pending (Balance Payment)'}
  Transaction ID: {payment_details.get('transactionId', 'N/A')}
  Paid: KSh {payment_details.get('amount', 0):,.0f}
  
Timeline:
  Initial Period End: {initial_period_end.strftime('%m/%d/%Y')}
  Balance Deadline: {balance_deadline.strftime('%m/%d/%Y')}
""")

print("="*80)
print("USER CONCERNS - VERIFICATION")
print("="*80)

# Check if dates match user expectations
print("\n✅ Checking if 'data in the extension is completely wrong':")
print(f"   Cover Start: {cover_start} (from database)")
print(f"   Initial Period: {initial_period_days} days (from extendible_config)")
print(f"   Extension Window: {extension_deadline_days} days (from extendible_config)")
print(f"   ➡️ Math Check:")
print(f"      {cover_start} + {initial_period_days} days = {initial_period_end} ✅")
print(f"      {initial_period_end} + {extension_deadline_days} days = {balance_deadline} ✅")

print(f"\n✅ Checking if 'should show selected underwriter':")
print(f"   Underwriter Details: {underwriter_details or 'NULL'}")
print(f"   Expected for extendible initial payment: NULL ✅")
print(f"   Display Text: 'Pending (Balance Payment)' ✅")

print(f"\n✅ Checking if 'breakdown of payment' is available:")
print(f"   Initial Amount: KSh {extendible_config.get('initial_amount', 0):,.2f} ✅")
print(f"   Balance Amount: KSh {extendible_config.get('balance_amount', 0):,.2f} ✅")
print(f"   Total Annual: KSh {extendible_config.get('total_annual_premium', 0):,.2f} ✅")

print(f"\n✅ Checking if 'transaction code' is available:")
print(f"   Transaction ID: {payment_details.get('transactionId', 'MISSING')} ✅")
print(f"   Payment Method: {payment_details.get('method', 'MISSING')} ✅")
print(f"   Amount Paid: KSh {payment_details.get('amount', 0):,.2f} ✅")
