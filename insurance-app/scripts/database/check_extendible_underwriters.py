"""
Check which underwriters have extendible pricing configured
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import InsuranceProvider

print("\n" + "="*80)
print("UNDERWRITERS WITH EXTENDIBLE PRICING CONFIGURATION")
print("="*80)

underwriters = InsuranceProvider.objects.filter(is_active=True)

for u in underwriters:
    print(f"\n{u.name} ({u.code}):")
    print(f"  Supported categories: {u.supported_categories}")
    
    if not u.features:
        print(f"  ❌ No features configured")
        continue
    
    pricing = u.features.get('pricing', {})
    if not pricing:
        print(f"  ❌ No pricing in features")
        continue
    
    print(f"  ✅ Has pricing for {len(pricing)} products:")
    
    # Check for extendible products
    extendible_products = []
    for product_code, product_config in pricing.items():
        if isinstance(product_config, dict):
            # Check if product has extendible_config
            if 'extendible_config' in product_config:
                extendible_products.append(product_code)
                ext_cfg = product_config['extendible_config']
                print(f"    🔵 {product_code}: EXTENDIBLE")
                print(f"       Initial: {ext_cfg.get('initial_amount')}, Balance: {ext_cfg.get('balance_amount')}")
    
    if not extendible_products:
        print(f"    ⚪ No extendible products configured")
    else:
        print(f"  📊 Total extendible products: {len(extendible_products)}")

print("\n" + "="*80)
print("SUMMARY")
print("="*80)

# Find which underwriters support PRIVATE_THIRD_PARTY_EXTENDED
print("\nUnderwriters with PRIVATE_THIRD_PARTY_EXTENDED:")
for u in underwriters:
    if u.features and u.features.get('pricing', {}).get('PRIVATE_THIRD_PARTY_EXTENDED'):
        config = u.features['pricing']['PRIVATE_THIRD_PARTY_EXTENDED']
        has_extendible = 'extendible_config' in config
        print(f"  ✅ {u.name} - {'EXTENDIBLE' if has_extendible else 'STANDARD'}")
