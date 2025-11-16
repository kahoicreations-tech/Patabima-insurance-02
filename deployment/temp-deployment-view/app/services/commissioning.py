from __future__ import annotations

from typing import Iterable, Tuple, Dict, Any, List

from decimal import Decimal
import json

from django.db.models import QuerySet

from ..models import AgentCommission, CommissionSettings, MotorPolicy
from ..models import CommissionRule  # type: ignore


def _extract_premium(policy: MotorPolicy) -> Decimal:
    premium_amount = Decimal('0.00')
    breakdown = getattr(policy, 'premium_breakdown', None)
    if breakdown:
        try:
            if isinstance(breakdown, str):
                breakdown = json.loads(breakdown)
        except Exception:
            breakdown = {}
        for key in ('total_premium', 'total_payable', 'total', 'totalPremium', 'totalPayable', 'total_amount', 'totalAmount'):
            if isinstance(breakdown, dict) and key in breakdown:
                try:
                    premium_amount = Decimal(str(breakdown.get(key, 0)))
                    if premium_amount > 0:
                        return premium_amount
                except Exception:
                    continue

    pay = getattr(policy, 'payment_details', None)
    if premium_amount <= 0 and pay:
        try:
            if isinstance(pay, str):
                pay = json.loads(pay)
        except Exception:
            pay = {}
        for key in ('amount', 'paid_amount', 'total', 'paidAmount'):
            if isinstance(pay, dict) and key in pay:
                try:
                    premium_amount = Decimal(str(pay.get(key, 0)))
                    if premium_amount > 0:
                        return premium_amount
                except Exception:
                    continue

    return premium_amount


def generate_commissions_for_policies(policies: Iterable[MotorPolicy] | QuerySet) -> Dict[str, Any]:
    """
    Generate AgentCommission rows for given MotorPolicy iterable.
    - Skips policies without user or premium or already commissioned.
    - Uses CommissionRule to resolve rate; falls back to global rate.

    Returns dict: {created, skipped, errors, failures: [(policy_number, reason)]}
    """
    try:
        global_rate = CommissionSettings.get_solo().default_commission_rate
    except Exception:
        global_rate = Decimal('15.00')

    created = 0
    skipped = 0
    errors = 0
    failures: List[Tuple[str, str]] = []

    # Ensure queryset
    qs = policies if isinstance(policies, QuerySet) else MotorPolicy.objects.filter(pk__in=[p.pk for p in policies])

    for policy in qs:
        try:
            # Only ACTIVE
            if getattr(policy, 'status', '').upper() != 'ACTIVE':
                skipped += 1
                continue

            # Already has a commission
            if AgentCommission.objects.filter(policy=policy).exists():
                skipped += 1
                continue

            # Agent
            if not policy.user:
                errors += 1
                failures.append((policy.policy_number, 'missing user/agent'))
                continue

            premium_amount = _extract_premium(policy)
            if premium_amount <= 0:
                errors += 1
                failures.append((policy.policy_number, 'missing/zero premium'))
                continue

            try:
                resolved_rate = CommissionRule.resolve_rate_for_policy(policy, global_rate)
            except Exception:
                resolved_rate = global_rate

            AgentCommission.objects.create(
                agent=policy.user,
                policy=policy,
                premium_amount=premium_amount,
                commission_rate=resolved_rate,
                payment_status='PENDING',
                notes=f'Auto-generated from policy {policy.policy_number}',
            )
            created += 1
        except Exception as e:
            errors += 1
            failures.append((getattr(policy, 'policy_number', 'N/A'), 'unexpected error'))

    return {
        'created': created,
        'skipped': skipped,
        'errors': errors,
        'failures': failures,
    }
