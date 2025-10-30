"""
Test Extendible Products API Integration
"""
import requests
import json

BASE_URL = "http://localhost:8000"

print("\n" + "="*80)
print("TESTING EXTENDIBLE PRODUCTS API")
print("="*80 + "\n")

# Test 1: Compare Pricing for Extendible Product
print("Test 1: Compare Pricing for PRIVATE_THIRD_PARTY_EXT")
print("-" * 80)

payload = {
    "category_code": "PRIVATE",
    "subcategory_code": "PRIVATE_THIRD_PARTY_EXT",
    "cover_start_date": "2025-10-30"
}

try:
    response = requests.post(
        f"{BASE_URL}/api/v1/public_app/insurance/compare_motor_pricing",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        comparisons = data.get('comparisons', [])
        
        print(f"✅ Success! Found {len(comparisons)} underwriters\n")
        
        # Check first underwriter for extendible config
        if comparisons:
            first = comparisons[0]['result']
            underwriter = first.get('underwriter_name')
            
            print(f"Checking {underwriter}:")
            print(f"  - is_extendible: {first.get('is_extendible', 'NOT FOUND')}")
            print(f"  - payment_plan: {first.get('payment_plan', 'NOT FOUND')}")
            
            ext_config = first.get('extendible_config')
            if ext_config:
                print(f"  ✅ extendible_config found:")
                print(f"     - initial_amount: KSh {ext_config.get('initial_amount', 0):,.0f}")
                print(f"     - balance_amount: KSh {ext_config.get('balance_amount', 0):,.0f}")
                print(f"     - total_annual_premium: KSh {ext_config.get('total_annual_premium', 0):,.0f}")
                print(f"     - initial_period_days: {ext_config.get('initial_period_days')} days")
                print(f"     - extension_deadline_days: {ext_config.get('extension_deadline_days')} days")
            else:
                print(f"  ❌ extendible_config NOT FOUND")
                print(f"\nFull response:")
                print(json.dumps(first, indent=2))
    else:
        print(f"❌ Failed: {response.text}")
        
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "="*80)
print("Test 2: Verify Extendible Config in features.pricing (Source of Truth)")
print("-" * 80)

# Use Django ORM to check features.pricing
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import InsuranceProvider

try:
    sub_key = 'PRIVATE_THIRD_PARTY_EXT'
    providers = InsuranceProvider.objects.filter(is_active=True)
    total_with_config = 0
    details = []
    for p in providers:
        feat = p.features or {}
        pricing = (feat.get('pricing') or {}) if isinstance(feat, dict) else {}
        cfg = pricing.get(sub_key)
        if not isinstance(cfg, dict):
            # case-insensitive
            for k, v in pricing.items():
                if str(k).upper() == sub_key and isinstance(v, dict):
                    cfg = v
                    break
        ext = (cfg or {}).get('extendible_config') if isinstance(cfg, dict) else None
        if isinstance(ext, dict):
            total_with_config += 1
            details.append((p.name, ext.get('initial_amount'), ext.get('balance_amount'), ext.get('total_annual_premium')))

    print(f"Underwriters with extendible_config in features.pricing for {sub_key}: {total_with_config}")
    for name, ini, bal, tot in details[:3]:
        print(f"  {name}: initial={ini}, balance={bal}, total={tot}")

except Exception as e:
    print(f"❌ features.pricing check failed: {e}")

print("\n" + "="*80)
print("TESTS COMPLETE")
print("="*80 + "\n")
