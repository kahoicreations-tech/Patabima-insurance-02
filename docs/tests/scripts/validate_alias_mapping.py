"""
Quick validator to ensure backend compares pricing using alias-tolerant subcategory keys.

It creates a temporary InsuranceProvider whose features.pricing uses alias keys
like PRIVATE_TP, PRIVATE_COMP, and PRIVATE_TP_EXT, then calls compare_pricing
with canonical keys (PRIVATE_THIRD_PARTY, PRIVATE_COMPREHENSIVE, PRIVATE_THIRD_PARTY_EXT)
to verify the lookup succeeds.
"""
import os
import sys
import json
import django

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(PROJECT_ROOT, 'insurance-app'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from django.test import RequestFactory
from django.utils import timezone
from app.models import InsuranceProvider
from app.views.motor_flow import compare_pricing


def run_case(title: str, pricing_key: str, request_code: str):
    # Create provider with pricing only under the alias key
    provider = InsuranceProvider.objects.create(
        name=f"Alias Test - {title}",
        code=f"ALIAS_{title[:3].upper()}",
        supported_categories=["PRIVATE"],
        features={
            'pricing': {
                pricing_key: {
                    'pricing_type': 'fixed',
                    'base_premium': 5000,
                    # Add extendible config only for EXT case
                    **({
                        'extendible_config': {
                            'initial_amount': 3000,
                            'balance_amount': 2000,
                            'total_annual_premium': 5000,
                            'initial_period_days': 30,
                            'extension_deadline_days': 30,
                            'grace_period_days': 7,
                            'penalty_for_late_extension': 0,
                            'allow_partial_extension': False,
                        }
                    } if pricing_key.endswith('_EXT') else {})
                }
            }
        }
    )

    try:
        # Build request with canonical code
        factory = RequestFactory()
        payload = {
            'category_code': 'PRIVATE',
            'subcategory_code': request_code,
            'cover_start_date': timezone.now().date().strftime('%Y-%m-%d'),
        }
        request = factory.post(
            '/api/v1/public_app/insurance/compare_motor_pricing/',
            data=payload,
            content_type='application/json'
        )

        response = compare_pricing(request)
        print(f"\n=== {title} ===")
        print(f"Alias key in admin: {pricing_key}")
        print(f"Requested code:     {request_code}")
        print(f"HTTP {response.status_code}")

        if response.status_code != 200:
            print("Response:", getattr(response, 'data', None))
            return False

        data = response.data
        comps = data.get('comparisons', [])
        # Find our provider by code
        hit = next((c for c in comps if c['result'].get('underwriter_code') == provider.code), None)
        if not hit:
            print("❌ Provider not found in comparisons (alias lookup may have failed)")
            print(json.dumps(data, indent=2))
            return False

        result = hit['result']
        print("✅ Found provider. Total premium:", result.get('total_premium'))
        if request_code.endswith('_EXT'):
            ext = result.get('extendible_config')
            if not isinstance(ext, dict):
                print("❌ Missing extendible_config on EXT product")
                return False
            print("   Extendible initial/balance/total:", ext.get('initial_amount'), ext.get('balance_amount'), ext.get('total_annual_premium'))
        return True
    finally:
        provider.delete()


def main():
    ok = True
    ok &= run_case("TP alias -> THIRD_PARTY", "PRIVATE_TP", "PRIVATE_THIRD_PARTY")
    ok &= run_case("COMP alias -> COMPREHENSIVE", "PRIVATE_COMP", "PRIVATE_COMPREHENSIVE")
    ok &= run_case("TP_EXT alias -> THIRD_PARTY_EXT", "PRIVATE_TP_EXT", "PRIVATE_THIRD_PARTY_EXT")
    print("\nOverall:", "✅ PASS" if ok else "❌ FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
