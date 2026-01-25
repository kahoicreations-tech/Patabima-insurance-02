import os, sys, json
import django

# Ensure project root on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import InsuranceProvider, MotorPricing, MotorSubcategory


def distinct_providers_for_subcategory(code: str):
    sub = MotorSubcategory.objects.filter(subcategory_code=code).first()
    if not sub:
        return {
            'subcategory': code,
            'exists': False,
            'provider_count': 0,
            'provider_codes': [],
        }
    qs = MotorPricing.objects.filter(subcategory=sub).values_list('underwriter__code', flat=True).distinct()
    codes = sorted([c for c in qs if c])
    return {
        'subcategory': code,
        'exists': True,
        'provider_count': len(codes),
        'provider_codes': codes,
    }


def main():
    providers = list(InsuranceProvider.objects.order_by('code').values('id','code','name','is_active'))
    total = len(providers)

    # Representative Motor2 subcategories
    checks = [
        'PRIVATE_THIRD_PARTY',
        'PRIVATE_TOR',
        'PRIVATE_COMPREHENSIVE',
        'COMMERCIAL_OWN_GOODS_TP',
        'COMMERCIAL_TOR',
    ]
    per_sub = [distinct_providers_for_subcategory(c) for c in checks]

    # Who has zero pricing across all subcategories?
    priced_codes = set(MotorPricing.objects.values_list('underwriter__code', flat=True).distinct())
    all_codes = set([p['code'] for p in providers if p['code']])
    zero_pricing = sorted(list(all_codes - priced_codes))

    # Inactive providers
    inactive = [p['code'] for p in providers if not p.get('is_active')]

    out = {
        'providers_total': total,
        'provider_codes': [p['code'] for p in providers],
        'inactive_provider_codes': inactive,
        'providers_with_zero_pricing': zero_pricing,
        'per_subcategory_pricing': per_sub,
    }
    print(json.dumps(out))


if __name__ == '__main__':
    main()
