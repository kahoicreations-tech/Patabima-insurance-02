import os
import sys
import django

# Add the insurance-app directory to the Python path
sys.path.append('/c/Users/USER/Desktop/PATABIMA/PATABIMA FRONT/PATA BIMA AGENCY - Copy/insurance-app')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance_project.settings')
django.setup()

from app.models import InsuranceProvider, MotorSubcategory
import json

print('=== CHECKING COMMERCIAL PRODUCT CONFIGURATION ===')

providers = InsuranceProvider.objects.filter(is_active=True)
for p in providers:
    print(f'\nProvider: {p.name} (Code: {p.code})')
    features = p.features or {}
    pricing = features.get('pricing', {})
    
    commercial_products = {k: v for k, v in pricing.items() if k.startswith('COMMERCIAL')}
    print(f'  Commercial Products: {len(commercial_products)}')
    
    for product_code, config in commercial_products.items():
        pricing_type = config.get('pricing_type', 'unknown')
        base_premium = config.get('base_premium', config.get('rate', 'N/A'))
        print(f'    {product_code}: {pricing_type} - KSh {base_premium}')

print('\n=== CHECKING SUBCATEGORY MAPPING ===')        
commercial_subs = MotorSubcategory.objects.filter(category__code='COMMERCIAL', is_active=True)
print(f'Active Commercial Subcategories: {commercial_subs.count()}')
for sub in commercial_subs:
    print(f'  {sub.subcategory_code}: {sub.subcategory_name} ({sub.product_type})')

print('\n=== TESTING SPECIFIC MISSING PRODUCT ===')
test_subcategory = 'COMMERCIAL_GENERAL_CARTAGE_COMP'
print(f'Looking for subcategory: {test_subcategory}')

# Check if subcategory exists
sub = MotorSubcategory.objects.filter(subcategory_code=test_subcategory).first()
if sub:
    print(f'✅ Subcategory found: {sub.subcategory_name} (Category: {sub.category.code})')
else:
    print(f'❌ Subcategory {test_subcategory} not found')

# Check which providers have this product
providers_with_product = []
for p in providers:
    features = p.features or {}
    pricing = features.get('pricing', {})
    if test_subcategory in pricing:
        providers_with_product.append(p.name)
        config = pricing[test_subcategory]
        print(f'✅ {p.name} has {test_subcategory}: {config}')

if not providers_with_product:
    print(f'❌ No providers have pricing configured for {test_subcategory}')
else:
    print(f'✅ Providers with {test_subcategory}: {providers_with_product}')