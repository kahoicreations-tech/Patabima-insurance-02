"""
Check Extendible Products Configuration

This script verifies:
1. Which subcategories have 'EXT' in their code (Third-Party Extendible)
2. How many ExtendiblePricing records exist
3. Which extendible products need configuration

Usage:
    python manage.py shell < check_extendible_products.py
"""

from app.models import MotorSubcategory, ExtendiblePricing, InsuranceProvider

print("\n" + "="*80)
print("EXTENDIBLE PRODUCTS CONFIGURATION CHECK")
print("="*80 + "\n")

# Find all subcategories with 'EXT' in code (Third-Party Extendible)
print("1. IDENTIFYING EXTENDIBLE PRODUCTS (Third-Party with 'EXT' suffix)")
print("-" * 80)

extendible_subcategories = MotorSubcategory.objects.filter(
    subcategory_code__icontains='EXT',
    is_active=True
).select_related('category').order_by('category__category_name', 'subcategory_name')

print(f"\nFound {extendible_subcategories.count()} extendible subcategories:\n")

for sub in extendible_subcategories:
    print(f"✅ {sub.category.category_name:15} | {sub.subcategory_name:50} | {sub.subcategory_code}")

if not extendible_subcategories.exists():
    print("⚠️  WARNING: No extendible subcategories found!")
    print("   Extendible products should have 'EXT' in their subcategory_code")
    print("   Example: PRIVATE_THIRD_PARTY_EXT, COMMERCIAL_THIRD_PARTY_EXT")

print("\n" + "="*80)
print("2. CHECKING EXTENDIBLE PRICING CONFIGURATION")
print("-" * 80)

total_pricing_records = ExtendiblePricing.objects.count()
print(f"\nTotal ExtendiblePricing records: {total_pricing_records}")

if total_pricing_records == 0:
    print("\n🔴 CRITICAL: No ExtendiblePricing records found!")
    print("   Extendible products cannot function without pricing configuration.")
else:
    print("\n✅ ExtendiblePricing records exist\n")
    
    # Show configured products
    configured = ExtendiblePricing.objects.select_related(
        'subcategory', 'underwriter'
    ).order_by('subcategory__subcategory_name', 'underwriter__name')
    
    print("Configured extendible products:")
    for config in configured:
        print(f"  ✅ {config.subcategory.subcategory_name} + {config.underwriter.name}")
        print(f"     Initial: KSh {config.initial_amount:,.2f} ({config.initial_period_days} days)")
        print(f"     Balance: KSh {config.balance_amount:,.2f} (due in {config.extension_deadline_days} days)")
        print(f"     Total: KSh {config.total_annual_premium:,.2f}")
        print()

print("\n" + "="*80)
print("3. MISSING CONFIGURATIONS")
print("-" * 80)

# Find extendible products without pricing
underwriters = InsuranceProvider.objects.filter(is_active=True)
print(f"\nActive underwriters: {underwriters.count()}")
for uw in underwriters:
    print(f"  - {uw.name} ({uw.code})")

missing_count = 0
print("\nExtendible products without pricing configuration:\n")

for sub in extendible_subcategories:
    for uw in underwriters:
        exists = ExtendiblePricing.objects.filter(
            subcategory=sub,
            underwriter=uw
        ).exists()
        
        if not exists:
            print(f"❌ {sub.subcategory_name} + {uw.name}")
            missing_count += 1

if missing_count == 0:
    print("✅ All extendible products are configured!")
else:
    print(f"\n⚠️  Found {missing_count} missing configurations")

print("\n" + "="*80)
print("4. RECOMMENDATIONS")
print("-" * 80)

if total_pricing_records == 0:
    print("""
🔴 CRITICAL ACTION REQUIRED:

No ExtendiblePricing records exist. You need to configure pricing for extendible products.

Run the configuration script:
    python manage.py shell < create_extendible_pricing.py

Or manually create records in Django admin:
    http://localhost:8000/admin/app/extendiblepricing/add/

Remember: Extendible products are ALL Third-Party products with 'EXT' suffix!
    - Private Third-Party EXT
    - Commercial Third-Party EXT
    - PSV Third-Party EXT
    - Motorcycle Third-Party EXT
    - TukTuk Third-Party EXT
""")
elif missing_count > 0:
    print(f"""
⚠️  ACTION RECOMMENDED:

{missing_count} extendible products are missing pricing configuration.

Options:
1. Run the bulk configuration script:
   python manage.py shell < create_extendible_pricing.py

2. Manually add missing configurations in admin panel:
   http://localhost:8000/admin/app/extendiblepricing/add/
""")
else:
    print("""
✅ ALL GOOD!

All extendible products have pricing configuration.

Test the extendible flow:
1. Create a quote for an extendible product (e.g., Private Third-Party EXT)
2. Select payment plan (Full or Installments)
3. Submit policy
4. Verify installment amounts are correct
""")

print("\n" + "="*80)
print("5. EXTENDIBLE PRODUCT NAMING CONVENTION")
print("-" * 80)

print("""
How to identify extendible products:

✅ CORRECT:
   - Subcategory code contains 'EXT' (case-insensitive)
   - Usually Third-Party products with extended payment plans
   - Examples:
     • PRIVATE_THIRD_PARTY_EXT
     • PRIVATE_TP_EXT
     • COMMERCIAL_THIRD_PARTY_EXT
     • PSV_THIRD_PARTY_EXT
     • MOTORCYCLE_THIRD_PARTY_EXT

❌ NOT EXTENDIBLE:
   - Regular Third-Party (without EXT)
   - TOR (Time on Risk) - separate payment model
   - Comprehensive - full upfront payment

Frontend Detection Logic:
   const isExtendible = subcategory_code.includes('EXT')

Backend Validation:
   ExtendiblePricing.objects.filter(subcategory=subcategory).exists()
""")

print("="*80 + "\n")
