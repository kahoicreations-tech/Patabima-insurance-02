"""
Find where the KSh 20,000 extendible config came from
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__) + '/insurance-app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import InsuranceProvider
import json

print("\n" + "="*80)
print("SEARCHING FOR KSh 20,000 TOTAL ANNUAL PREMIUM CONFIG")
print("="*80 + "\n")

providers = InsuranceProvider.objects.filter(is_active=True)

found = False
for provider in providers:
    if provider.features and 'pricing' in provider.features:
        pricing = provider.features['pricing']
        
        for product_code, product_pricing in pricing.items():
            if 'extendible_config' in product_pricing:
                config = product_pricing['extendible_config']
                total = config.get('total_annual_premium', 0)
                
                if total == 20000:
                    found = True
                    print(f"\n✅ FOUND: {provider.name} ({provider.code})")
                    print(f"   Product: {product_code}")
                    print(f"   Initial Amount: KSh {config.get('initial_amount')}")
                    print(f"   Balance Amount: KSh {config.get('balance_amount')}")
                    print(f"   Total Annual Premium: KSh {config.get('total_annual_premium')}")
                    print(f"   Initial Period: {config.get('initial_period_days')} days")
                    print(f"   Extension Deadline: {config.get('extension_deadline_days')} days")
                    print(f"\n   Full Config:")
                    print(json.dumps(config, indent=4))

if not found:
    print("\n❌ NO PROVIDER HAS EXTENDIBLE CONFIG WITH KSh 20,000 TOTAL!")
    print("\nThis config in the database is INVALID - it doesn't match any underwriter!")
    print("\nPolicy POL-2025-834912 has incorrect extendible_config that doesn't exist in any underwriter.")
