import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'insurance-app'))
django.setup()

from app.models import MotorPolicy
from app.utils.product_labels import get_product_label
from django.utils import timezone
from datetime import timedelta

print("\n=== SIMULATING get_upcoming_extensions API RESPONSE ===\n")

# Get ACTIVE extendible policies
active_policies = MotorPolicy.objects.filter(status='ACTIVE').order_by('policy_number')

extensions = []
filtered_count = 0

for policy in active_policies:
    # Check if policy is extendible
    is_extendible = policy.product_details.get('is_extendible', False)
    
    if not is_extendible:
        continue
    
    # Skip policies that have already paid their balance
    has_been_extended = policy.product_details.get('has_been_extended', False)
    if has_been_extended:
        print(f"❌ FILTERED: {policy.policy_number} (already extended)")
        filtered_count += 1
        continue
    
    # Get extendible config
    extendible_config = policy.product_details.get('extendible_config') or policy.product_details.get('extendibleConfig')
    
    if not extendible_config:
        print(f"⚠️  SKIPPED: {policy.policy_number} (no extendible_config)")
        continue
    
    balance_amount = extendible_config.get('balance_amount', 0)
    initial_period_days = extendible_config.get('initial_period_days', 30)
    
    # Calculate timeline
    today = timezone.now().date()
    cover_start = policy.cover_start_date
    initial_period_end = cover_start + timedelta(days=initial_period_days)
    days_to_initial_end = (initial_period_end - today).days
    
    print(f"✅ INCLUDE: {policy.policy_number}")
    print(f"    Balance Amount: KES {balance_amount}")
    print(f"    Days to Initial End: {days_to_initial_end}")
    print(f"    Cover Start: {cover_start}")
    print()
    
    extensions.append({
        'policyNo': policy.policy_number,
        'balanceAmount': balance_amount,
        'daysRemaining': days_to_initial_end
    })

print(f"\n=== API RESPONSE SUMMARY ===")
print(f"Filtered out (already paid): {filtered_count}")
print(f"Returned in API response: {len(extensions)}")
print(f"\nPolicies that will show on Home screen:")
for ext in extensions:
    print(f"  - {ext['policyNo']}: KES {ext['balanceAmount']} ({ext['daysRemaining']} days left)")
