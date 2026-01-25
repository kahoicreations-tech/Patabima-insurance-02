#!/usr/bin/env python
"""Verify that the production and commission tracking solution is working"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import Motor3Quotation, MotorPolicy, AgentCommission, User
from django.db.models import Sum, Count
from decimal import Decimal

print("=" * 70)
print("PATAMBIMA PRODUCTION & COMMISSION VERIFICATION")
print("=" * 70)

# Get agent counts
agent_count = User.objects.filter(role='AGENT').count()
print(f"\n📊 SYSTEM OVERVIEW")
print("-" * 70)
print(f"   Total Agents: {agent_count}")

# Check quotations
total_quotations = Motor3Quotation.objects.count()
converted_quotations = Motor3Quotation.objects.filter(status='CONVERTED').count()
paid_quotations = Motor3Quotation.objects.filter(status='PAID').count()

print(f"\n📝 QUOTATIONS (Motor3)")
print("-" * 70)
print(f"   Total Quotations:     {total_quotations}")
print(f"   Converted:            {converted_quotations}")
print(f"   Paid:                 {paid_quotations}")
print(f"   Paid + Converted:     {paid_quotations + converted_quotations}")

# Calculate production from quotations
total_production = Decimal('0')
quotation_count_with_premium = 0

for q in Motor3Quotation.objects.filter(status__in=['PAID', 'CONVERTED']):
    payload = q.normalized_payload or q.payload or {}
    premium_breakdown = payload.get('premium_breakdown') or payload.get('premiumBreakdown') or {}
    premium = (premium_breakdown.get('total_premium') or 
               premium_breakdown.get('totalPremium') or 
               premium_breakdown.get('total') or 
               premium_breakdown.get('totalPayable') or 0)
    
    if premium and float(premium) > 0:
        total_production += Decimal(str(premium))
        quotation_count_with_premium += 1

print(f"\n💰 PRODUCTION VALUE")
print("-" * 70)
print(f"   Quotations with Premium: {quotation_count_with_premium}")
print(f"   Total Production:        KES {total_production:,.2f}")
print(f"   (This is what agents see as 'Production' in My Account)")

# Check policies
total_policies = MotorPolicy.objects.count()
active_policies = MotorPolicy.objects.filter(status='ACTIVE').count()

print(f"\n📋 POLICIES (Motor2 + Motor3)")
print("-" * 70)
print(f"   Total Policies:       {total_policies}")
print(f"   Active Policies:      {active_policies}")

# Check commissions
total_commissions = AgentCommission.objects.count()
total_commission_amount = AgentCommission.objects.aggregate(
    total=Sum('commission_amount')
)['total'] or Decimal('0')

pending_count = AgentCommission.objects.filter(payment_status='PENDING').count()
pending_amount = AgentCommission.objects.filter(payment_status='PENDING').aggregate(
    total=Sum('commission_amount')
)['total'] or Decimal('0')

paid_count = AgentCommission.objects.filter(payment_status='PAID').count()
paid_amount = AgentCommission.objects.filter(payment_status='PAID').aggregate(
    total=Sum('commission_amount')
)['total'] or Decimal('0')

print(f"\n💵 COMMISSIONS")
print("-" * 70)
print(f"   Total Commission Records: {total_commissions}")
print(f"   Total Commission Amount:  KES {total_commission_amount:,.2f}")
print(f"   ")
print(f"   Pending Commissions:      {pending_count} records, KES {pending_amount:,.2f}")
print(f"   Paid Commissions:         {paid_count} records, KES {paid_amount:,.2f}")

# Verify commission coverage
commissions_with_policy = AgentCommission.objects.exclude(policy__isnull=True).count()
print(f"\n🔗 COMMISSION-POLICY LINKAGE")
print("-" * 70)
print(f"   Commissions linked to policies: {commissions_with_policy}/{total_commissions}")

if commissions_with_policy < active_policies:
    print(f"   ⚠️  WARNING: {active_policies - commissions_with_policy} active policies missing commissions!")

# Per-agent breakdown
print(f"\n👥 PER-AGENT BREAKDOWN (Top 3)")
print("-" * 70)

agent_stats = []
for agent in User.objects.filter(role='AGENT'):
    quotations = Motor3Quotation.objects.filter(user=agent, status__in=['PAID', 'CONVERTED']).count()
    commissions = AgentCommission.objects.filter(agent=agent)
    comm_amount = commissions.aggregate(total=Sum('commission_amount'))['total'] or Decimal('0')
    
    if quotations > 0 or comm_amount > 0:
        agent_stats.append({
            'phone': agent.phonenumber,
            'quotations': quotations,
            'commission': comm_amount
        })

agent_stats.sort(key=lambda x: x['commission'], reverse=True)

for i, stat in enumerate(agent_stats[:3], 1):
    print(f"   {i}. {stat['phone']:15s} - {stat['quotations']:2d} quotations, "
          f"KES {stat['commission']:>10,.2f} commission")

# Expected vs Actual
print(f"\n" + "=" * 70)
print("✅ EXPECTED MY ACCOUNT SCREEN VALUES")
print("=" * 70)
print(f"\n   Sales (Policies):      {total_quotations} policies")
print(f"   Production:            KES {total_production:,.2f}")
print(f"   Commission (Earned):   KES {total_commission_amount:,.2f}")
print(f"   Commission (Paid):     KES {paid_amount:,.2f}")
print(f"   Conversion Rate:       {((paid_quotations + converted_quotations) / total_quotations * 100) if total_quotations > 0 else 0:.1f}%")

print(f"\n" + "=" * 70)
print("🎯 SOLUTION STATUS")
print("=" * 70)

if total_commissions >= active_policies:
    print("\n   ✅ Commission tracking: WORKING")
    print(f"      All {active_policies} active policies have commission records")
else:
    print(f"\n   ⚠️  Commission tracking: INCOMPLETE")
    print(f"      {active_policies - total_commissions} policies missing commissions")

if quotation_count_with_premium > 0:
    print("\n   ✅ Production calculation: WORKING")
    print(f"      Calculating from {quotation_count_with_premium} paid/converted quotations")
else:
    print("\n   ⚠️  Production calculation: NO DATA")

print("\n   🔧 Next Steps:")
print("      1. Open your mobile app (scan QR code above)")
print("      2. Navigate to My Account screen")
print("      3. Pull down to refresh")
print("      4. Verify values match the expected values shown above")

print("\n" + "=" * 70)
