"""
Populate Motor 2 Underwriter Pricing for All Subcategories
===========================================================

This script creates realistic underwriter pricing data for ALL Motor 2 subcategories
across 6 categories: PRIVATE, COMMERCIAL, PSV, MOTORCYCLE, TUKTUK, SPECIAL

Run with:
    cd insurance-app
    python manage.py shell < ../scripts/populate_motor2_pricing.py

Or interactively:
    python manage.py shell
    >>> exec(open('../scripts/populate_motor2_pricing.py').read())
"""

import os
import sys
import django
from decimal import Decimal
from datetime import date, timedelta

# Setup Django - handle both direct execution and shell import
try:
    # When run from manage.py shell, Django is already setup
    from django.conf import settings
    settings.DATABASES  # Test if configured
except:
    # When run directly, need to setup
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
    
    # Add project root to path if needed
    current_dir = os.getcwd()
    if 'insurance-app' in current_dir:
        # Already in backend dir
        sys.path.insert(0, current_dir)
    else:
        # In project root
        sys.path.insert(0, os.path.join(current_dir, 'insurance-app'))
    
    django.setup()

from app.models import (
    MotorSubcategory, 
    InsuranceProvider, 
    MotorPricing,
    CommercialTonnagePricing,
    PSVPLLPricing
)

# Standard underwriters with market positioning
UNDERWRITERS = [
    {'name': 'Madison Insurance', 'code': 'MADISON', 'rating': 4.5, 'price_tier': 'LOW'},
    {'name': 'PATABIMA INC', 'code': 'PTA', 'rating': 4.7, 'price_tier': 'LOW'},
    {'name': 'Jubilee Insurance', 'code': 'JUBILEE', 'rating': 4.6, 'price_tier': 'LOW'},
    {'name': 'UAP Insurance', 'code': 'UAP', 'rating': 4.3, 'price_tier': 'MEDIUM'},
    {'name': 'APA Insurance', 'code': 'APA', 'rating': 4.4, 'price_tier': 'MEDIUM'},
    {'name': 'Britam Insurance', 'code': 'BRITAM', 'rating': 4.2, 'price_tier': 'HIGH'},
    {'name': 'CIC Insurance', 'code': 'CIC', 'rating': 4.1, 'price_tier': 'HIGH'},
]

# Price tiers (multipliers)
PRICE_TIERS = {
    'LOW': 1.0,
    'MEDIUM': 1.18,
    'HIGH': 1.32,
}

# ============================================
# PRICING TEMPLATES BY CATEGORY
# ============================================

# PRIVATE VEHICLE PRICING
PRIVATE_PRICING = {
    'PRIVATE_THIRD_PARTY': {'base': 2975},
    'PRIVATE_THIRD_PARTY_EXT': {'base': 3150},
    'PRIVATE_TOR': {'base': 450},  # Per day rate
    'PRIVATE_COMPREHENSIVE': {
        'brackets': [
            {'min': 0, 'max': 500000, 'rate': 4.0},  # 4% of sum insured
            {'min': 500001, 'max': 1000000, 'rate': 3.5},
            {'min': 1000001, 'max': 2000000, 'rate': 3.0},
            {'min': 2000001, 'max': 5000000, 'rate': 2.8},
            {'min': 5000001, 'max': 10000000, 'rate': 2.5},
        ]
    },
}

# COMMERCIAL TONNAGE PRICING (Own Goods)
COMMERCIAL_OWN_GOODS_TONNAGE = [
    {'tonnage_from': 0.0, 'tonnage_to': 3.0, 'description': 'Upto 3 Tons', 'base': 7500},
    {'tonnage_from': 3.5, 'tonnage_to': 5.0, 'description': '3.5 to 5 Tons', 'base': 9200},
    {'tonnage_from': 5.5, 'tonnage_to': 8.0, 'description': '5.5 to 8 Tons', 'base': 11500},
    {'tonnage_from': 8.5, 'tonnage_to': 12.0, 'description': '8.5 to 12 Tons', 'base': 14500},
    {'tonnage_from': 12.5, 'tonnage_to': 16.0, 'description': '12.5 to 16 Tons', 'base': 18000},
    {'tonnage_from': 16.5, 'tonnage_to': 20.0, 'description': '16.5 to 20 Tons', 'base': 22000},
    {'tonnage_from': 20.5, 'tonnage_to': 30.0, 'description': 'Over 20 Tons', 'base': 28000},
]

# COMMERCIAL GENERAL CARTAGE (15% higher than Own Goods)
COMMERCIAL_GENERAL_CARTAGE_TONNAGE = [
    {**entry, 'base': int(entry['base'] * 1.15)} 
    for entry in COMMERCIAL_OWN_GOODS_TONNAGE
]

# PSV PASSENGER PRICING (includes PLL - Passenger Legal Liability)
PSV_PASSENGER_PRICING = [
    {'capacity_from': 1, 'capacity_to': 7, 'description': 'Upto 7 Seats', 'base_tp': 8500, 'pll_rate': 150},
    {'capacity_from': 8, 'capacity_to': 14, 'description': '8-14 Seats', 'base_tp': 12500, 'pll_rate': 200},
    {'capacity_from': 15, 'capacity_to': 25, 'description': '15-25 Seats', 'base_tp': 18000, 'pll_rate': 250},
    {'capacity_from': 26, 'capacity_to': 36, 'description': '26-36 Seats', 'base_tp': 25000, 'pll_rate': 300},
    {'capacity_from': 37, 'capacity_to': 49, 'description': '37-49 Seats', 'base_tp': 32000, 'pll_rate': 350},
    {'capacity_from': 50, 'capacity_to': 100, 'description': '50+ Seats', 'base_tp': 45000, 'pll_rate': 400},
]

# MOTORCYCLE PRICING (Engine CC)
MOTORCYCLE_PRICING = {
    'MOTORCYCLE_THIRD_PARTY': {'base': 1850},
    'MOTORCYCLE_THIRD_PARTY_EXT': {'base': 2100},
    'MOTORCYCLE_TOR': {'base': 320},
    'MOTORCYCLE_COMPREHENSIVE': {
        'brackets': [
            {'min': 0, 'max': 150000, 'rate': 5.5},
            {'min': 150001, 'max': 400000, 'rate': 5.0},
            {'min': 400001, 'max': 1000000, 'rate': 4.5},
        ]
    },
}

# TUKTUK PRICING
TUKTUK_PRICING = {
    'TUKTUK_THIRD_PARTY': {'base': 3200},
    'TUKTUK_THIRD_PARTY_EXT': {'base': 3450},
    'TUKTUK_TOR': {'base': 520},
    'TUKTUK_COMPREHENSIVE': {
        'brackets': [
            {'min': 0, 'max': 300000, 'rate': 5.0},
            {'min': 300001, 'max': 600000, 'rate': 4.5},
        ]
    },
}

# SPECIAL CLASSES (Fixed pricing for unique vehicles)
SPECIAL_PRICING = {
    'SPECIAL_AMBULANCE_TP': {'base': 15000},
    'SPECIAL_TRACTOR_TP': {'base': 12000},
    'SPECIAL_TRAILER_TP': {'base': 8500},
    'SPECIAL_INSTITUTIONAL_TP': {'base': 9500},
}


def get_or_create_underwriters():
    """Create or retrieve all underwriters"""
    created_underwriters = []
    
    for uw_data in UNDERWRITERS:
        underwriter, created = InsuranceProvider.objects.get_or_create(
            code=uw_data['code'],
            defaults={
                'name': uw_data['name'],
                'supported_categories': ['MOTOR'],
                'display_mode': 'GROSS',
            }
        )
        if created:
            print(f"✓ Created underwriter: {underwriter.name}")
        else:
            print(f"  Found existing underwriter: {underwriter.name}")
        
        created_underwriters.append({
            'obj': underwriter,
            'price_tier': uw_data['price_tier']
        })
    
    return created_underwriters


def apply_tier_pricing(base_price, tier):
    """Apply tier multiplier to base price"""
    multiplier = PRICE_TIERS[tier]
    return Decimal(str(int(base_price * multiplier)))


def populate_fixed_pricing(subcategory, underwriters, base_price):
    """Populate FIXED pricing model (Third Party, TOR)"""
    effective_from = date.today()
    
    for uw_data in underwriters:
        underwriter = uw_data['obj']
        tier = uw_data['price_tier']
        
        # Apply tier pricing
        tiered_price = apply_tier_pricing(base_price, tier)
        
        # Create or update pricing
        pricing, created = MotorPricing.objects.get_or_create(
            subcategory=subcategory,
            underwriter=underwriter,
            effective_from=effective_from,
            defaults={
                'base_premium': tiered_price,
                'minimum_premium': tiered_price,
                'maximum_premium': tiered_price,
                'is_active': True,
            }
        )
        
        if not created:
            # Update existing
            pricing.base_premium = tiered_price
            pricing.minimum_premium = tiered_price
            pricing.maximum_premium = tiered_price
            pricing.save()
        
        action = "Created" if created else "Updated"
        print(f"    {action} {underwriter.code}: KSh {tiered_price:,}")


def populate_bracket_pricing(subcategory, underwriters, brackets):
    """Populate BRACKET pricing model (Comprehensive)"""
    effective_from = date.today()
    
    for uw_data in underwriters:
        underwriter = uw_data['obj']
        tier = uw_data['price_tier']
        
        # Calculate sample premium (using mid-range value)
        sample_sum_insured = 1000000
        sample_bracket = next((b for b in brackets if b['min'] <= sample_sum_insured <= b['max']), brackets[0])
        base_premium = int(sample_sum_insured * (sample_bracket['rate'] / 100))
        tiered_price = apply_tier_pricing(base_premium, tier)
        
        # Store brackets with tier adjustment
        tiered_brackets = [
            {
                'min_sum_insured': b['min'],
                'max_sum_insured': b['max'],
                'rate_percentage': b['rate'] * PRICE_TIERS[tier],
            }
            for b in brackets
        ]
        
        pricing, created = MotorPricing.objects.get_or_create(
            subcategory=subcategory,
            underwriter=underwriter,
            effective_from=effective_from,
            defaults={
                'base_premium': tiered_price,
                'bracket_pricing': tiered_brackets,
                'is_active': True,
            }
        )
        
        if not created:
            pricing.base_premium = tiered_price
            pricing.bracket_pricing = tiered_brackets
            pricing.save()
        
        action = "Created" if created else "Updated"
        print(f"    {action} {underwriter.code}: Bracket pricing (sample: KSh {tiered_price:,})")


def populate_tonnage_pricing(subcategory, underwriters, tonnage_scales):
    """Populate TONNAGE pricing model (Commercial)"""
    effective_from = date.today()
    
    for uw_data in underwriters:
        underwriter = uw_data['obj']
        tier = uw_data['price_tier']
        
        for scale in tonnage_scales:
            tiered_price = apply_tier_pricing(scale['base'], tier)
            
            # Fleet discount percentage varies by tonnage (larger fleets get better discounts)
            # Lower tonnage: 5%, mid-range: 7.5%, high tonnage: 10%
            if scale['tonnage_from'] <= 5.0:
                fleet_discount = Decimal('5.0')
            elif scale['tonnage_from'] <= 12.0:
                fleet_discount = Decimal('7.5')
            else:
                fleet_discount = Decimal('10.0')
            
            # Check if model has fleet_discount_percentage field
            try:
                tonnage_pricing, created = CommercialTonnagePricing.objects.get_or_create(
                    subcategory=subcategory,
                    underwriter=underwriter,
                    tonnage_from=Decimal(str(scale['tonnage_from'])),
                    tonnage_to=Decimal(str(scale['tonnage_to'])) if scale['tonnage_to'] else None,
                    effective_from=effective_from,
                    defaults={
                        'tonnage_description': scale['description'],
                        'base_premium': tiered_price,
                        'fleet_discount_percentage': fleet_discount,
                        'is_over_limit': scale.get('is_over_limit', False),
                        'is_prime_mover': scale.get('is_prime_mover', False),
                        'is_active': True,
                    }
                )
            except TypeError:
                # Model doesn't have fleet_discount_percentage field
                tonnage_pricing, created = CommercialTonnagePricing.objects.get_or_create(
                    subcategory=subcategory,
                    underwriter=underwriter,
                    tonnage_from=Decimal(str(scale['tonnage_from'])),
                    tonnage_to=Decimal(str(scale['tonnage_to'])) if scale['tonnage_to'] else None,
                    effective_from=effective_from,
                    defaults={
                        'tonnage_description': scale['description'],
                        'base_premium': tiered_price,
                        'is_active': True,
                    }
                )
            
            if not created:
                tonnage_pricing.base_premium = tiered_price
                try:
                    tonnage_pricing.fleet_discount_percentage = fleet_discount
                except AttributeError:
                    pass  # Field doesn't exist
                tonnage_pricing.save()
        
        action = "Created" if created else "Updated"
        print(f"    {action} {underwriter.code}: {len(tonnage_scales)} tonnage brackets")


def populate_passenger_pricing(subcategory, underwriters, passenger_scales):
    """Populate PASSENGER pricing model (PSV)"""
    effective_from = date.today()
    
    for uw_data in underwriters:
        underwriter = uw_data['obj']
        tier = uw_data['price_tier']
        
        # Create base pricing record for the subcategory
        sample_scale = passenger_scales[0]
        tiered_base = apply_tier_pricing(sample_scale['base_tp'], tier)
        
        base_pricing, created = MotorPricing.objects.get_or_create(
            subcategory=subcategory,
            underwriter=underwriter,
            effective_from=effective_from,
            defaults={
                'base_premium': tiered_base,
                'minimum_premium': tiered_base,
                'is_active': True,
                'pricing_factors': {
                    'capacity_scales': [
                        {
                            'capacity_from': scale['capacity_from'],
                            'capacity_to': scale['capacity_to'],
                            'description': scale['description'],
                            'base_premium': int(apply_tier_pricing(scale['base_tp'], tier)),
                            'pll_rate': int(apply_tier_pricing(scale['pll_rate'], tier)),
                        }
                        for scale in passenger_scales
                    ]
                }
            }
        )
        
        if not created:
            base_pricing.base_premium = tiered_base
            base_pricing.pricing_factors = {
                'capacity_scales': [
                    {
                        'capacity_from': scale['capacity_from'],
                        'capacity_to': scale['capacity_to'],
                        'description': scale['description'],
                        'base_premium': int(apply_tier_pricing(scale['base_tp'], tier)),
                        'pll_rate': int(apply_tier_pricing(scale['pll_rate'], tier)),
                    }
                    for scale in passenger_scales
                ]
            }
            base_pricing.save()
        
        # Create PLL pricing records (standard PLL amounts: 500 and 250)
        for pll_amount in [500, 250]:
            tiered_pll_rate = apply_tier_pricing(150 if pll_amount == 500 else 100, tier)
            
            pll_pricing, pll_created = PSVPLLPricing.objects.get_or_create(
                subcategory=subcategory,
                underwriter=underwriter,
                pll_amount=Decimal(str(pll_amount)),
                effective_from=effective_from,
                defaults={
                    'rate_per_person': tiered_pll_rate,
                    'is_commercial_institutional': False,
                    'is_active': True,
                }
            )
            
            if not pll_created:
                pll_pricing.rate_per_person = tiered_pll_rate
                pll_pricing.save()
        
        action = "Created" if created else "Updated"
        print(f"    {action} {underwriter.code}: {len(passenger_scales)} capacity scales + PLL")


def populate_all_pricing():
    """Main function to populate all pricing"""
    print("=" * 70)
    print("MOTOR 2 UNDERWRITER PRICING POPULATION")
    print("=" * 70)
    print()
    
    # Step 1: Create underwriters
    print("STEP 1: Creating/Verifying Underwriters")
    print("-" * 70)
    underwriters = get_or_create_underwriters()
    print()
    
    # Step 2: Get all subcategories
    print("STEP 2: Loading All Motor Subcategories")
    print("-" * 70)
    all_subcategories = MotorSubcategory.objects.filter(is_active=True)
    print(f"Found {all_subcategories.count()} active subcategories")
    print()
    
    # Step 3: Populate pricing by category
    print("STEP 3: Populating Pricing Data")
    print("=" * 70)
    
    # PRIVATE VEHICLES
    print("\n📋 PRIVATE VEHICLES")
    print("-" * 70)
    for subcat in all_subcategories.filter(category__code='PRIVATE'):
        print(f"\n{subcat.subcategory_code} ({subcat.pricing_model})")
        
        if subcat.subcategory_code in PRIVATE_PRICING:
            pricing_data = PRIVATE_PRICING[subcat.subcategory_code]
            
            if 'base' in pricing_data:
                populate_fixed_pricing(subcat, underwriters, pricing_data['base'])
            elif 'brackets' in pricing_data:
                populate_bracket_pricing(subcat, underwriters, pricing_data['brackets'])
    
    # COMMERCIAL VEHICLES
    print("\n\n📋 COMMERCIAL VEHICLES")
    print("-" * 70)
    for subcat in all_subcategories.filter(category__code='COMMERCIAL'):
        print(f"\n{subcat.subcategory_code} ({subcat.pricing_model})")
        
        if 'OWN_GOODS' in subcat.subcategory_code:
            populate_tonnage_pricing(subcat, underwriters, COMMERCIAL_OWN_GOODS_TONNAGE)
        elif 'GENERAL_CARTAGE' in subcat.subcategory_code:
            populate_tonnage_pricing(subcat, underwriters, COMMERCIAL_GENERAL_CARTAGE_TONNAGE)
    
    # PSV VEHICLES
    print("\n\n📋 PSV VEHICLES")
    print("-" * 70)
    for subcat in all_subcategories.filter(category__code='PSV'):
        print(f"\n{subcat.subcategory_code} ({subcat.pricing_model})")
        populate_passenger_pricing(subcat, underwriters, PSV_PASSENGER_PRICING)
    
    # MOTORCYCLES
    print("\n\n📋 MOTORCYCLES")
    print("-" * 70)
    for subcat in all_subcategories.filter(category__code='MOTORCYCLE'):
        print(f"\n{subcat.subcategory_code} ({subcat.pricing_model})")
        
        if subcat.subcategory_code in MOTORCYCLE_PRICING:
            pricing_data = MOTORCYCLE_PRICING[subcat.subcategory_code]
            
            if 'base' in pricing_data:
                populate_fixed_pricing(subcat, underwriters, pricing_data['base'])
            elif 'brackets' in pricing_data:
                populate_bracket_pricing(subcat, underwriters, pricing_data['brackets'])
    
    # TUKTUK
    print("\n\n📋 TUKTUK")
    print("-" * 70)
    for subcat in all_subcategories.filter(category__code='TUKTUK'):
        print(f"\n{subcat.subcategory_code} ({subcat.pricing_model})")
        
        if subcat.subcategory_code in TUKTUK_PRICING:
            pricing_data = TUKTUK_PRICING[subcat.subcategory_code]
            
            if 'base' in pricing_data:
                populate_fixed_pricing(subcat, underwriters, pricing_data['base'])
            elif 'brackets' in pricing_data:
                populate_bracket_pricing(subcat, underwriters, pricing_data['brackets'])
    
    # SPECIAL CLASSES
    print("\n\n📋 SPECIAL CLASSES")
    print("-" * 70)
    for subcat in all_subcategories.filter(category__code='SPECIAL'):
        print(f"\n{subcat.subcategory_code} ({subcat.pricing_model})")
        
        if subcat.subcategory_code in SPECIAL_PRICING:
            pricing_data = SPECIAL_PRICING[subcat.subcategory_code]
            populate_fixed_pricing(subcat, underwriters, pricing_data['base'])
    
    # Summary
    print("\n\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    
    total_fixed = MotorPricing.objects.count()
    total_tonnage = CommercialTonnagePricing.objects.count()
    total_passenger = PSVPLLPricing.objects.count()
    
    print(f"✓ Fixed/Bracket Pricing Records: {total_fixed}")
    print(f"✓ Tonnage Pricing Records: {total_tonnage}")
    print(f"✓ Passenger Pricing Records: {total_passenger}")
    print(f"✓ Total Pricing Records: {total_fixed + total_tonnage + total_passenger}")
    print()
    print("🎉 PRICING POPULATION COMPLETE!")
    print("=" * 70)


if __name__ == '__main__':
    populate_all_pricing()
