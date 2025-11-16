"""
Script to create ExtendiblePricing records for PataBima Motor Insurance

This script creates ExtendiblePricing configuration for all extendible products
across all active underwriters.

Usage:
    python manage.py shell < create_extendible_pricing.py
    
    OR in Django shell:
    
    exec(open('create_extendible_pricing.py').read())
"""

from app.models import ExtendiblePricing, MotorSubcategory, InsuranceProvider
from django.db import transaction

print("\n" + "="*80)
print("EXTENDIBLE PRICING CONFIGURATION SCRIPT")
print("="*80 + "\n")

# Get all extendible subcategories (Third-Party products with 'EXT' suffix)
print("Searching for Third-Party Extendible products (subcategory_code contains 'EXT')...")
extendible_subs = MotorSubcategory.objects.filter(
    subcategory_code__icontains='EXT',
    is_active=True
).select_related('category')

print(f"Found {extendible_subs.count()} extendible subcategories:\n")
for sub in extendible_subs:
    print(f"  - {sub.category.name} > {sub.subcategory_name} ({sub.subcategory_code})")

# Get all active underwriters
underwriters = InsuranceProvider.objects.filter(is_active=True)

print(f"\nFound {underwriters.count()} active underwriters:\n")
for uw in underwriters:
    print(f"  - {uw.name} ({uw.code})")

print("\n" + "-"*80)
print("Creating ExtendiblePricing records...")
print("-"*80 + "\n")

# Pricing templates by category (adjust these as needed)
PRICING_TEMPLATES = {
    'PRIVATE': {
        'initial_period_days': 30,
        'initial_amount': 5000.00,
        'balance_amount': 15000.00,
        'total_annual_premium': 20000.00,
        'extension_deadline_days': 90,
        'grace_period_days': 7,
        'penalty_for_late_extension': 5.00,  # 5%
        'allow_partial_extension': True,
    },
    'COMMERCIAL': {
        'initial_period_days': 30,
        'initial_amount': 8000.00,
        'balance_amount': 24000.00,
        'total_annual_premium': 32000.00,
        'extension_deadline_days': 90,
        'grace_period_days': 7,
        'penalty_for_late_extension': 5.00,
        'allow_partial_extension': True,
    },
    'PSV': {
        'initial_period_days': 30,
        'initial_amount': 6000.00,
        'balance_amount': 18000.00,
        'total_annual_premium': 24000.00,
        'extension_deadline_days': 60,  # Shorter grace for PSV
        'grace_period_days': 7,
        'penalty_for_late_extension': 7.00,  # Higher penalty 7%
        'allow_partial_extension': True,
    },
    'MOTORCYCLE': {
        'initial_period_days': 30,
        'initial_amount': 3000.00,
        'balance_amount': 9000.00,
        'total_annual_premium': 12000.00,
        'extension_deadline_days': 90,
        'grace_period_days': 7,
        'penalty_for_late_extension': 5.00,
        'allow_partial_extension': True,
    },
    'TUKTUK': {
        'initial_period_days': 30,
        'initial_amount': 4000.00,
        'balance_amount': 12000.00,
        'total_annual_premium': 16000.00,
        'extension_deadline_days': 90,
        'grace_period_days': 7,
        'penalty_for_late_extension': 5.00,
        'allow_partial_extension': True,
    },
}

created_count = 0
updated_count = 0
skipped_count = 0
errors = []

with transaction.atomic():
    for sub in extendible_subs:
        # Determine pricing template based on category
        category_code = sub.category.code.upper()
        template = PRICING_TEMPLATES.get(category_code, PRICING_TEMPLATES['PRIVATE'])
        
        for uw in underwriters:
            try:
                # Check if record already exists
                existing = ExtendiblePricing.objects.filter(
                    subcategory=sub,
                    underwriter=uw
                ).first()
                
                if existing:
                    print(f"⚠️  SKIP: {sub.subcategory_name} + {uw.name} (already exists)")
                    skipped_count += 1
                    continue
                
                # Create new ExtendiblePricing record
                ext_pricing = ExtendiblePricing.objects.create(
                    subcategory=sub,
                    underwriter=uw,
                    initial_period_days=template['initial_period_days'],
                    initial_amount=template['initial_amount'],
                    balance_amount=template['balance_amount'],
                    total_annual_premium=template['total_annual_premium'],
                    extension_deadline_days=template['extension_deadline_days'],
                    grace_period_days=template['grace_period_days'],
                    penalty_for_late_extension=template['penalty_for_late_extension'],
                    allow_partial_extension=template['allow_partial_extension'],
                    is_active=True,
                )
                
                print(f"✅ CREATED: {sub.subcategory_name} + {uw.name}")
                print(f"   Initial: KSh {template['initial_amount']:,.2f} ({template['initial_period_days']} days)")
                print(f"   Balance: KSh {template['balance_amount']:,.2f} (due in {template['extension_deadline_days']} days)")
                print(f"   Total: KSh {template['total_annual_premium']:,.2f}")
                print()
                
                created_count += 1
                
            except Exception as e:
                error_msg = f"ERROR: {sub.subcategory_name} + {uw.name}: {str(e)}"
                errors.append(error_msg)
                print(f"❌ {error_msg}")

print("\n" + "="*80)
print("SUMMARY")
print("="*80)
print(f"\n✅ Created: {created_count} ExtendiblePricing records")
print(f"⚠️  Skipped: {skipped_count} (already exist)")
print(f"❌ Errors: {len(errors)}")

if errors:
    print("\nErrors encountered:")
    for error in errors:
        print(f"  - {error}")

print("\n" + "="*80)
print("VERIFICATION")
print("="*80)

total_ext_pricing = ExtendiblePricing.objects.count()
print(f"\nTotal ExtendiblePricing records in database: {total_ext_pricing}")

print("\nBreakdown by category:")
for category_code in PRICING_TEMPLATES.keys():
    count = ExtendiblePricing.objects.filter(
        subcategory__category__code__iexact=category_code
    ).count()
    print(f"  - {category_code}: {count} records")

print("\n" + "="*80)
print("NEXT STEPS")
print("="*80)
print("""
1. Review the created records in Django admin:
   http://localhost:8000/admin/app/extendiblepricing/

2. Adjust pricing amounts for specific products:
   - Edit individual records in admin panel
   - Or update PRICING_TEMPLATES and re-run this script

3. Test extendible flow end-to-end:
   - Create quote for extendible product
   - Verify payment plan UI shows
   - Submit policy with installments
   - Check policy created with correct amounts

4. Test extension flow:
   - Create test policy with extendible product
   - Set expiry date to past
   - Check Upcoming Extensions screen
   - Process balance payment
   - Verify policy extended

""")
print("="*80 + "\n")
