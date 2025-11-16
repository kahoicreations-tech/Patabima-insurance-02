from decimal import Decimal
from dataclasses import dataclass
from typing import Optional, Dict, Any, List
from django.db.models import Q
from django.utils import timezone
from app.models import (
    InsuranceProvider,
    MotorSubcategory,
    MotorPricing,
    CommercialTonnagePricing,
    PSVPLLPricing,
)


@dataclass
class PricingInput:
    subcategory_code: str
    underwriter_code: Optional[str] = None
    sum_insured: Optional[Decimal] = None
    tonnage: Optional[Decimal] = None
    passenger_count: Optional[int] = None
    vehicle_age: Optional[int] = None
    add_ons: Optional[Dict[str, Any]] = None


class MotorPricingEngine:
    def calculate_premium(self, data: PricingInput) -> Dict[str, Any]:
        sub = MotorSubcategory.objects.select_related('category').get(subcategory_code=data.subcategory_code)
        provider = None
        if data.underwriter_code:
            try:
                provider = InsuranceProvider.objects.get(code=data.underwriter_code)
            except InsuranceProvider.DoesNotExist:
                provider = None

        # Prefer pricing_model to drive the calculation method; fall back to product_type
        calc_type = getattr(sub, 'pricing_model', None) or getattr(sub, 'product_type', None)

        if calc_type in ('FIXED', 'TOR', 'THIRD_PARTY', 'THIRD_PARTY_EXT'):
            base = self._calculate_fixed_or_third_party(sub, provider)
        elif calc_type in ('BRACKET', 'COMPREHENSIVE'):
            if data.sum_insured is None:
                raise ValueError('sum_insured is required for comprehensive products')
            base = self._calculate_comprehensive_premium(sub, data.sum_insured, provider, data.add_ons or {})
        elif calc_type in ('TONNAGE',):
            if data.tonnage is None:
                raise ValueError('tonnage is required for commercial tonnage products')
            base = self._calculate_commercial_tonnage_premium(sub, data.tonnage, provider)
        elif calc_type in ('PASSENGER', 'PSV'):
            if data.passenger_count is None:
                raise ValueError('passenger_count is required for PSV products')
            base = self._calculate_psv_pll(sub, data.passenger_count, provider)
        else:
            raise ValueError(f'Unsupported product/pricing model: {calc_type}')

        # Apply mandatory levies on base premium (including add-ons already absorbed in base)
        levies = self._apply_mandatory_levies(base)
        total = base + levies['insurance_training_levy'] + levies['pcf_levy'] + levies['stamp_duty']
        return {
            'calculation_type': calc_type,
            'base_premium': self._q2(base),
            'mandatory_levies': {
                'insurance_training_levy': self._q2(levies['insurance_training_levy']),
                'pcf_levy': self._q2(levies['pcf_levy']),
                'stamp_duty': self._q2(levies['stamp_duty']),
            },
            'total_premium': self._q2(total),
            'subcategory': sub.subcategory_code,
            'underwriter': provider.code if provider else None,
        }

    def _calculate_fixed_or_third_party(self, sub: MotorSubcategory, provider: Optional[InsuranceProvider]) -> Decimal:
        qs = MotorPricing.objects.filter(subcategory=sub, is_active=True)
        if provider:
            qs = qs.filter(underwriter=provider)
        # Use latest effective rate
        mp = qs.order_by('-effective_from').first()
        if not mp:
            raise ValueError('No fixed pricing configured for this subcategory')
        return mp.base_premium

    def _calculate_third_party_premium(self, sub: MotorSubcategory, provider: Optional[InsuranceProvider]) -> Decimal:
        # Kept for compatibility if needed separately
        return self._calculate_fixed_or_third_party(sub, provider)

    def _calculate_comprehensive_premium(self, sub: MotorSubcategory, sum_insured: Decimal, provider: Optional[InsuranceProvider], add_ons: Dict[str, Any]) -> Decimal:
        qs = MotorPricing.objects.filter(subcategory=sub, is_active=True)
        if provider:
            qs = qs.filter(underwriter=provider)
        mp = qs.order_by('-effective_from').first()
        if not mp:
            raise ValueError('No comprehensive pricing configured')

        # Expect bracket_pricing as a list of dicts with keys like sum_insured_min, sum_insured_max, base_rate_min/base_rate_max or rate
        brackets: List[Dict[str, Any]] = mp.bracket_pricing or []
        if not isinstance(brackets, list) or not brackets:
            raise ValueError('Bracket pricing is not configured properly')

        # Choose the bracket with the highest lower bound <= sum_insured
        chosen = None
        for b in sorted(brackets, key=lambda x: Decimal(str(x.get('sum_insured_min', '0')))):
            min_v = Decimal(str(b.get('sum_insured_min', '0')))
            max_v = b.get('sum_insured_max')
            if max_v is not None:
                max_v = Decimal(str(max_v))
            if max_v is None:
                if sum_insured >= min_v:
                    chosen = b
            else:
                if min_v <= sum_insured <= max_v:
                    chosen = b
        if not chosen:
            raise ValueError('No comprehensive bracket matches sum_insured')

        rate = chosen.get('base_rate_min') or chosen.get('base_rate_max') or chosen.get('rate') or Decimal('0')
        rate = Decimal(str(rate))
        premium = (sum_insured * rate).quantize(Decimal('0.01'))
        min_prem = chosen.get('minimum_premium')
        if min_prem is not None:
            min_prem = Decimal(str(min_prem))
            if premium < min_prem:
                premium = min_prem

        # Add-ons from chosen bracket
        ep = Decimal('0.00')
        if add_ons.get('excess_protector') and chosen.get('excess_protector_rate'):
            epr = Decimal(str(chosen.get('excess_protector_rate')))
            ep = (sum_insured * epr).quantize(Decimal('0.01'))
            ep_min = chosen.get('excess_protector_minimum')
            if ep_min is not None:
                ep_min = Decimal(str(ep_min))
                if ep < ep_min:
                    ep = ep_min

        pvt = Decimal('0.00')
        if add_ons.get('pvt') and chosen.get('pvt_rate'):
            pvtr = Decimal(str(chosen.get('pvt_rate')))
            pvt = (sum_insured * pvtr).quantize(Decimal('0.01'))
            pvt_min = chosen.get('pvt_minimum')
            if pvt_min is not None:
                pvt_min = Decimal(str(pvt_min))
                if pvt < pvt_min:
                    pvt = pvt_min

        # Windscreen/Radio charged as percentage of limits if provided
        ws = Decimal('0.00')
        ws_val = Decimal(str(add_ons.get('windscreen_value', '0')))
        if ws_val and chosen.get('windscreen_percentage'):
            wsp = Decimal(str(chosen.get('windscreen_percentage')))
            ws = (ws_val * wsp).quantize(Decimal('0.01'))

        rd = Decimal('0.00')
        rd_val = Decimal(str(add_ons.get('radio_value', '0')))
        if rd_val and chosen.get('radio_percentage'):
            rdp = Decimal(str(chosen.get('radio_percentage')))
            rd = (rd_val * rdp).quantize(Decimal('0.01'))

        return premium + ep + pvt + ws + rd

    def _calculate_commercial_tonnage_premium(self, sub: MotorSubcategory, tonnage: Decimal, provider: Optional[InsuranceProvider]) -> Decimal:
        qs = CommercialTonnagePricing.objects.filter(subcategory=sub, is_active=True)
        if provider:
            qs = qs.filter(underwriter=provider)
        rows = list(qs.order_by('tonnage_from'))
        choice = None
        for r in rows:
            # Over-limit entries
            if getattr(r, 'is_over_limit', False) and tonnage >= r.tonnage_from:
                choice = r
                break
            # Inclusive range
            if r.tonnage_from <= tonnage <= r.tonnage_to:
                choice = r
                break
        if not choice:
            raise ValueError('No tonnage bracket matches the provided tonnage')
        return choice.base_premium

    def _calculate_psv_pll(self, sub: MotorSubcategory, passenger_count: int, provider: Optional[InsuranceProvider]) -> Decimal:
        qs = PSVPLLPricing.objects.filter(subcategory=sub, is_active=True)
        if provider:
            qs = qs.filter(underwriter=provider)
        rate_obj = qs.order_by('-effective_from', '-pll_amount').first()
        if not rate_obj:
            raise ValueError('No PSV PLL rate configured')
        return (Decimal(passenger_count) * rate_obj.rate_per_person).quantize(Decimal('0.01'))

    def _apply_mandatory_levies(self, base_premium: Decimal) -> Dict[str, Decimal]:
        itl = (base_premium * Decimal('0.0025')).quantize(Decimal('0.01'))
        pcf = (base_premium * Decimal('0.0025')).quantize(Decimal('0.01'))
        sd = Decimal('40.00')
        return {
            'insurance_training_levy': itl,
            'pcf_levy': pcf,
            'stamp_duty': sd,
        }

    def _q2(self, v: Decimal) -> str:
        return f"{v:.2f}"
