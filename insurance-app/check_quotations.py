#!/usr/bin/env python
"""Check Motor3 Quotation status and recommend best approach"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import Motor3Quotation, MotorPolicy, AgentCommission
from django.db.models import Count, Q

print("=" * 60)
print("MOTOR3 QUOTATION STATUS ANALYSIS")
print("=" * 60)

# 1. Count quotations by status
print("\n1. Quotation Status Distribution:")
print("-" * 60)
status_counts = Motor3Quotation.objects.values('status').annotate(count=Count('id')).order_by('-count')
for item in status_counts:
    print(f"   {item['status']:20s}: {item['count']:3d} quotations")

total_quotations = Motor3Quotation.objects.count()
print(f"\n   {'TOTAL':20s}: {total_quotations:3d} quotations")

# 2. Check how many have policy_number (converted)
converted_count = Motor3Quotation.objects.exclude(policy_number__isnull=True).exclude(policy_number='').count()
print(f"\n2. Conversion Status:")
print("-" * 60)
print(f"   Converted to Policy: {converted_count} quotations")
print(f"   Not Converted:       {total_quotations - converted_count} quotations")

# 3. Check actual MotorPolicy records
policy_count = MotorPolicy.objects.count()
active_policy_count = MotorPolicy.objects.filter(status='ACTIVE').count()
print(f"\n3. MotorPolicy Records:")
print("-" * 60)
print(f"   Total Policies:  {policy_count}")
print(f"   Active Policies: {active_policy_count}")

# 4. Check commission records
commission_count = AgentCommission.objects.count()
pending_commission = AgentCommission.objects.filter(payment_status='PENDING').count()
paid_commission = AgentCommission.objects.filter(payment_status='PAID').count()

print(f"\n4. Commission Records:")
print("-" * 60)
print(f"   Total Commissions:   {commission_count}")
print(f"   Pending Commissions: {pending_commission}")
print(f"   Paid Commissions:    {paid_commission}")

# 5. Sample quotations for inspection
print(f"\n5. Sample Quotations (first 5):")
print("-" * 60)
for q in Motor3Quotation.objects.all()[:5]:
    policy_status = "None"
    if q.policy_number:
        try:
            policy = MotorPolicy.objects.get(policy_number=q.policy_number)
            policy_status = policy.status
        except:
            policy_status = "Not Found"
    
    print(f"   Quote: {q.quote_number:15s} | Status: {q.status:12s} | Policy: {q.policy_number or 'None':15s} | Policy Status: {policy_status}")

# 6. Recommendation
print(f"\n" + "=" * 60)
print("RECOMMENDATION")
print("=" * 60)

if total_quotations > 0 and commission_count == 0:
    print("\n🔍 SITUATION:")
    print(f"   - You have {total_quotations} quotations")
    print(f"   - {converted_count} are marked as converted")
    print(f"   - {active_policy_count} active policies exist")
    print(f"   - But 0 commission records")
    
    print("\n💡 BEST APPROACH FOR KENYA INSURANCE MARKET:")
    print("   OPTION C (Recommended): Hybrid Production Tracking")
    print("   ------------------------------------------------")
    print("   1. Show 'Production' = Total Premium from PAID/CONVERTED quotations")
    print("      (This represents actual sales/revenue generated)")
    print()
    print("   2. Show 'Commission' = Sum of AgentCommission records")
    print("      (This represents earned commissions ready for payout)")
    print()
    print("   3. Benefits:")
    print("      ✓ Agents see immediate feedback when quotations are paid")
    print("      ✓ Production value reflects actual insurance sold")
    print("      ✓ Commission value shows what's earned (when policies activate)")
    print("      ✓ Aligns with Kenya insurance practice (production ≠ commission)")
    print()
    print("   4. Implementation:")
    print("      - Calculate production from quotation premium_breakdown")
    print("      - Keep commission from backend API (zero until policies activate)")
    print("      - Add background job to convert PAID quotations → policies")
    print()

if active_policy_count > 0 and commission_count == 0:
    print("\n⚠️  ISSUE DETECTED:")
    print(f"   You have {active_policy_count} ACTIVE policies but 0 commissions!")
    print("   This means _create_commission_record() didn't run.")
    print()
    print("   FIX: Run this command to create missing commissions:")
    print("   python manage.py shell -c \"from app.services.commissioning import generate_commissions_for_policies; from app.models import MotorPolicy; print(generate_commissions_for_policies(MotorPolicy.objects.filter(status='ACTIVE')))\"")

print("\n" + "=" * 60)
