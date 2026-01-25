# Simple check for extendible products
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import MotorSubcategory, ExtendiblePricing, InsuranceProvider

print("="*80)
print("EXTENDIBLE PRODUCTS CHECK")
print("="*80)

# Find Third-Party Extendible products (code contains 'EXT')
ext_subs = MotorSubcategory.objects.filter(
    subcategory_code__icontains='EXT',
    is_active=True
)

print(f"\nExtendible subcategories (code contains 'EXT'): {ext_subs.count()}")
for sub in ext_subs:
    print(f"  - {sub.subcategory_name} ({sub.subcategory_code})")

# Check ExtendiblePricing records
pricing_count = ExtendiblePricing.objects.count()
print(f"\nExtendiblePricing records: {pricing_count}")

if pricing_count == 0:
    print("\nCRITICAL: No pricing configured for extendible products!")
    print("Run: python create_extendible_pricing.py")
else:
    print("\nConfigured:")
    for p in ExtendiblePricing.objects.all()[:5]:
        print(f"  - {p.subcategory.subcategory_name} + {p.underwriter.name}")

# Check underwriters
uw_count = InsuranceProvider.objects.filter(is_active=True).count()
print(f"\nActive underwriters: {uw_count}")

print("="*80)
