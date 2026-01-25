from django.core.management.base import BaseCommand
from decimal import Decimal
from app.models import (
    Underwriter,
    MotorCategory,
    MotorSubcategory,
    MotorPricing,
    CommercialTonnagePricing,
    PSVPLLPricing,
    VehicleAdjustmentFactor,
    AdditionalFieldPricing,
)
from datetime import date

class Command(BaseCommand):
    help = 'Seed sample pricing data (comprehensive brackets, commercial tonnage, PSV PLL)'

    def handle(self, *args, **options):
    apa = Underwriter.objects.get(company_code='APA')
    jub = Underwriter.objects.get(company_code='JUB')

        # Private comprehensive brackets (2 samples per underwriter)
        self._seed_comprehensive_brackets(apa, 'PRIVATE_COMPREHENSIVE', [
            (0, 1000000, Decimal('0.035'), Decimal('0.040'), Decimal('15000')),
            (1000001, 3000000, Decimal('0.030'), Decimal('0.035'), Decimal('20000')),
        ])
        self._seed_comprehensive_brackets(jub, 'PRIVATE_COMPREHENSIVE', [
            (0, 1000000, Decimal('0.0375'), Decimal('0.0425'), Decimal('16000')),
            (1000001, 3000000, Decimal('0.0325'), Decimal('0.0375'), Decimal('21000')),
        ])

        # Commercial tonnage pricing (APA)
        self._seed_tonnage(apa, 'COMM_TONNAGE', [
            (Decimal('0'), Decimal('3.0'), 'Upto 3 Tons', Decimal('4500')),
            (Decimal('3.5'), Decimal('8.0'), '3.5 to 8 Tons', Decimal('5500')),
            (Decimal('8.5'), Decimal('12.0'), '8.5 to 12 Tons', Decimal('6500')),
            (Decimal('12.5'), Decimal('15.0'), '12.5 to 15 Tons', Decimal('7500')),
            (Decimal('15.5'), Decimal('20.0'), '15.5 to 20 Tons', Decimal('10000')),
            (Decimal('20.5'), None, 'Over 20 Tons', Decimal('15000')),
        ])

        # Commercial tonnage pricing (JUB)
        self._seed_tonnage(jub, 'COMM_TONNAGE', [
            (Decimal('0'), Decimal('3.0'), 'Upto 3 Tons', Decimal('4700')),
            (Decimal('3.5'), Decimal('8.0'), '3.5 to 8 Tons', Decimal('5700')),
            (Decimal('8.5'), Decimal('12.0'), '8.5 to 12 Tons', Decimal('6700')),
            (Decimal('12.5'), Decimal('15.0'), '12.5 to 15 Tons', Decimal('7700')),
            (Decimal('15.5'), Decimal('20.0'), '15.5 to 20 Tons', Decimal('10200')),
            (Decimal('20.5'), None, 'Over 20 Tons', Decimal('15500')),
        ])

        # PSV PLL
        PSVPLLPricing.objects.update_or_create(
            underwriter=apa, subcategory=MotorSubcategory.objects.filter(category__category_code='PSV').first(),
            pll_amount=Decimal('500'), defaults={'rate_per_person': Decimal('500'), 'is_active': True}
        )
        PSVPLLPricing.objects.update_or_create(
            underwriter=apa, subcategory=MotorSubcategory.objects.filter(category__category_code='PSV').first(),
            pll_amount=Decimal('250'), defaults={'rate_per_person': Decimal('250'), 'is_active': True}
        )

        # TOR and Third-Party fixed pricing examples (APA)
        self._seed_fixed_pricing(apa, {
            'PRIVATE_TOR': Decimal('650'),
            'PRIVATE_TP': Decimal('5000'),
            'COMM_TOR': Decimal('850'),
            'PRIME_MOVER': Decimal('10000'),
            'OWN_GOODS_TP': Decimal('6000'),
            'GENERAL_CARTAGE_TP': Decimal('7000'),
        })

        # TOR and Third-Party fixed pricing examples (JUB)
        self._seed_fixed_pricing(jub, {
            'PRIVATE_TOR': Decimal('700'),
            'PRIVATE_TP': Decimal('5200'),
            'COMM_TOR': Decimal('900'),
            'PRIME_MOVER': Decimal('10500'),
            'OWN_GOODS_TP': Decimal('6200'),
            'GENERAL_CARTAGE_TP': Decimal('7200'),
        })

        # Adjustment factors (vehicle age) for Private
        self._seed_adjustment_factors()

        # Additional field pricing: tonnage adjustments and PSV passenger capacity
        self._seed_additional_field_pricing()
        # Generic coverage for all subcategories
        self._seed_generic_fixed_and_tp([apa, jub])
        self._seed_generic_comprehensive_defaults([apa, jub])

        self.stdout.write(self.style.SUCCESS('Seeded sample comprehensive, tonnage, TP/TOR, PLL, adjustment factors, and generic coverage for all subcategories.'))

    def _seed_comprehensive_brackets(self, underwriter, sub_code, brackets):
        comp = MotorSubcategory.objects.get(subcategory_code=sub_code)
        for lo, hi, rmin, rmax, minprem in brackets:
            # Store as bracket_pricing JSON on the latest MotorPricing row
            mp, _ = MotorPricing.objects.update_or_create(
                underwriter=underwriter, subcategory=comp,
                defaults={
                    'base_premium': Decimal('0'), 'minimum_premium': minprem,
                }
            )
            brackets = mp.bracket_pricing or []
            brackets.append({
                'sum_insured_min': lo, 'sum_insured_max': hi,
                'base_rate_min': str(rmin), 'base_rate_max': str(rmax),
                'minimum_premium': str(minprem),
                'excess_protector_rate': '0.0025', 'excess_protector_minimum': '3000',
                'pvt_rate': '0.0025', 'pvt_minimum': '2500',
                'windscreen_percentage': '0.10', 'radio_percentage': '0.10',
            })
            mp.bracket_pricing = brackets
            mp.save()

    def _seed_tonnage(self, underwriter, sub_code, tonnage):
        subs = MotorSubcategory.objects.filter(subcategory_code=sub_code)
        for comm in subs:
            for tmin, tmax, desc, premium in tonnage:
                CommercialTonnagePricing.objects.update_or_create(
                    underwriter=underwriter, subcategory=comm, tonnage_from=tmin, tonnage_description=desc,
                    defaults={'tonnage_to': tmax or tmin, 'base_premium': premium, 'is_over_limit': tmax is None}
                )

    def _seed_fixed_pricing(self, underwriter, mapping):
        for sub_code, premium in mapping.items():
            subs = MotorSubcategory.objects.filter(subcategory_code=sub_code)
            for sub in subs:
                MotorPricing.objects.update_or_create(
                    underwriter=underwriter, subcategory=sub,
                    defaults={'base_premium': premium}
                )

    def _seed_adjustment_factors(self):
        private_cat = MotorCategory.objects.get(category_code='PRIVATE')
        age_bands = [
            (0, 3, Decimal('1.00')),
            (4, 7, Decimal('1.10')),
            (8, 12, Decimal('1.25')),
            (13, 30, Decimal('1.50')),
        ]
        for lo, hi, mult in age_bands:
                VehicleAdjustmentFactor.objects.update_or_create(
                    factor_type='vehicle_age', factor_key=f'{lo}-{hi}',
                    defaults={'description': 'Vehicle age band', 'factor_value': mult}
                )

    def _seed_additional_field_pricing(self):
        # Commercial TOR tonnage adjustments
        mapping = [
            (0, 5, Decimal('0')),
            (6, 10, Decimal('2000')),
            (11, 15, Decimal('4000')),
            (16, 31, Decimal('7000')),
        ]
        try:
            sub = MotorSubcategory.objects.get(subcategory_code='COMM_TOR')
        except MotorSubcategory.DoesNotExist:
            sub = None
        if sub:
            for lo, hi, adj in mapping:
                AdditionalFieldPricing.objects.update_or_create(
                    subcategory=sub, field_code='tonnage', effective_from=date(2024, 1, 1),
                    defaults={'pricing_data': {'min': lo, 'max': hi, 'adjustment': str(adj), 'type': 'fixed'}},
                )

        # PSV passenger capacity
        psv_codes = ['PSV_UBER_TP', 'PSV_TUKTUK_TP', 'PSV_MATATU_TP_1M']
        passenger_bands = [
            (1, 7, Decimal('0')),
            (8, 14, Decimal('1500')),
            (15, 25, Decimal('3000')),
            (26, 50, Decimal('5000')),
        ]
        for code in psv_codes:
            # Scope to PSV category to avoid duplicate codes across categories (e.g., PSV_TUKTUK_TP)
            sub = (
                MotorSubcategory.objects
                .filter(subcategory_code=code, category__category_code='PSV')
                .first()
            )
            if not sub:
                continue
            for lo, hi, adj in passenger_bands:
                AdditionalFieldPricing.objects.update_or_create(
                    subcategory=sub, field_code='passenger_capacity', effective_from=date(2024, 1, 1),
                    defaults={'pricing_data': {'min': lo, 'max': hi, 'adjustment': str(adj), 'type': 'fixed'}},
                )

    def _seed_generic_fixed_and_tp(self, underwriters):
        # Seed a reasonable default for all third_party and fixed products that lack pricing
        defaults = {
            'fixed': Decimal('800'),
            'third_party': Decimal('5500'),
        }
        for und in underwriters:
            for ptype, premium in defaults.items():
                subs = MotorSubcategory.objects.filter(product_type=ptype)
                for sub in subs:
                    MotorPricing.objects.get_or_create(
                        underwriter=und, subcategory=sub,
                        defaults={'base_premium': premium}
                    )

    def _seed_generic_comprehensive_defaults(self, underwriters):
        # Provide a default two-bracket scheme where none exists
        default_brackets = [
            (0, 1000000, Decimal('0.035'), Decimal('0.040'), Decimal('15000')),
            (1000001, 3000000, Decimal('0.030'), Decimal('0.035'), Decimal('20000')),
        ]
        for und in underwriters:
            comps = MotorSubcategory.objects.filter(product_type='comprehensive')
            for sub in comps:
                has_pricing = MotorPricing.objects.filter(underwriter=und, subcategory=sub).exists()
                if has_pricing:
                    continue
                for lo, hi, rmin, rmax, minprem in default_brackets:
                    MotorPricing.objects.update_or_create(
                        underwriter=und, subcategory=sub, sum_insured_min=lo,
                        defaults={
                            'sum_insured_max': hi,
                            'base_rate_min': rmin,
                            'base_rate_max': rmax,
                            'minimum_premium': minprem,
                            'excess_protector_rate': Decimal('0.0025'),
                            'excess_protector_minimum': Decimal('3000'),
                            'pvt_rate': Decimal('0.0025'),
                            'pvt_minimum': Decimal('2500'),
                            'windscreen_limit': Decimal('30000'),
                            'windscreen_percentage': Decimal('0.1'),
                            'radio_limit': Decimal('30000'),
                            'radio_percentage': Decimal('0.1'),
                        }
                    )
