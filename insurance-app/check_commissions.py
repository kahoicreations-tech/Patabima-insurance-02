#!/usr/bin/env python
"""Check commission status"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import AgentCommission, MotorPolicy
from django.db.models import Sum
from decimal import Decimal

print("=" * 60)
print("COMMISSION ANALYSIS")
print("=" * 60)

total_commissions = AgentCommission.objects.count()
total_amount = AgentCommission.objects.aggregate(total=Sum('commission_amount'))['total'] or Decimal('0')

print(f'\nTotal Commissions: {total_commissions}')
print(f'Total Commission Amount: KES {total_amount:,.2f}')

print(f'\nBy Status:')
for status in ['PENDING', 'PAID', 'APPROVED', 'DISPUTED']:
    count = AgentCommission.objects.filter(payment_status=status).count()
    amount = AgentCommission.objects.filter(payment_status=status).aggregate(
        total=Sum('commission_amount')
    )['total'] or Decimal('0')
    if count > 0:
        print(f'  {status:10s}: {count:3d} commissions, KES {amount:,.2f}')

# Get sample commissions
print(f'\nSample Commissions (first 5):')
print('-' * 60)
for comm in AgentCommission.objects.all()[:5]:
    agent_phone = comm.agent.phonenumber if comm.agent else 'No Agent'
    policy_num = comm.policy.policy_number if comm.policy else 'No Policy'
    print(f'  Agent: {agent_phone:20s} | Policy: {policy_num:20s} | '
          f'Amount: KES {comm.commission_amount:>10,.2f} | Status: {comm.payment_status}')

# Check production value from active policies
print(f'\n' + '=' * 60)
print('PRODUCTION VALUE CALCULATION')
print('=' * 60)

active_policies = MotorPolicy.objects.filter(status='ACTIVE')
total_production = Decimal('0')
count_with_premium = 0

for policy in active_policies:
    # Extract premium from policy
    from app.services.commissioning import _extract_premium
    premium = _extract_premium(policy)
    if premium > 0:
        total_production += premium
        count_with_premium += 1

print(f'\nActive Policies: {active_policies.count()}')
print(f'Policies with Premium Data: {count_with_premium}')
print(f'Total Production Value: KES {total_production:,.2f}')
print(f'\nThis is what should show as "Production" on the My Account screen.')
