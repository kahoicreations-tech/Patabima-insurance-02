#!/usr/bin/env python3
"""
Populate Realistic Underwriter-Specific Pricing Data

This script creates realistic pricing differences for different underwriters:
- TOR & Third Party: Fixed rates with 10-15% variation between underwriters
- Comprehensive: Percentage-based with bracket pricing and rate variations
"""

import os
import sys
import django
from decimal import Decimal
from datetime import date, timedelta

# Add the project directory to Python path
project_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_dir)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import (
    InsuranceProvider, MotorCategory, MotorSubcategory, 
    MotorCoverType
)

def create_underwriters():
    """Create realistic Kenyan underwriters with different market positions"""
    underwriters_data = [
        {
            'company_name': 'CIC Insurance Group',
            'company_code': 'CIC',
            'rating': 4.2,
            'contact_email': 'info@cic.co.ke',
            'supported_categories': ['PRIVATE', 'COMMERCIAL', 'PSV', 'MOTORCYCLE', 'TUKTUK'],
            'market_position': 'premium'  # Higher rates, better service
        },
        {
            'company_name': 'APA Insurance',
            'company_code': 'APA',
            'rating': 4.0,
            'contact_email': 'info@apainsurance.org',
            'supported_categories': ['PRIVATE', 'COMMERCIAL', 'PSV', 'MOTORCYCLE', 'TUKTUK'],
            'market_position': 'competitive'  # Mid-range rates
        },
        {
            'company_name': 'Britam Insurance',
            'company_code': 'BRITAM',
            'rating': 4.3,
            'contact_email': 'info@britam.com',
            'supported_categories': ['PRIVATE', 'COMMERCIAL', 'PSV', 'MOTORCYCLE'],
            'market_position': 'premium'  # Higher rates, good service
        },
        {
            'company_name': 'Jubilee Insurance',
            'company_code': 'JUBILEE',
            'rating': 3.8,
            'contact_email': 'info@jubileekenya.com',
            'supported_categories': ['PRIVATE', 'COMMERCIAL', 'PSV', 'TUKTUK'],
            'market_position': 'budget'  # Lower rates, basic service
        },
        {
            'company_name': 'UAP Insurance',
            'company_code': 'UAP',
            'rating': 3.9,
            'contact_email': 'info@uap.co.ke',
            'supported_categories': ['PRIVATE', 'COMMERCIAL', 'PSV'],
            'market_position': 'competitive'  # Mid-range rates
        },
        {
            'company_name': 'Madison Insurance',
            'company_code': 'MADISON',
            'rating': 3.7,
            'contact_email': 'info@madison.co.ke',
            'supported_categories': ['PRIVATE', 'COMMERCIAL', 'MOTORCYCLE', 'TUKTUK'],
            'market_position': 'budget'  # Aggressive pricing
        }
    ]
    
    print("Creating underwriters...")
    created_underwriters = {}
    
    for data in underwriters_data:
        market_position = data.pop('market_position')
        try:
            # Try to get existing by code first
            underwriter = InsuranceProvider.objects.get(code=data['company_code'])
            # Update existing
            underwriter.name = data['company_name']
            underwriter.contact_email = data['contact_email']
            underwriter.supported_categories = data['supported_categories']
            underwriter.save()
            print(f"🔄 Updated: {underwriter.name}")
            created = False
        except InsuranceProvider.DoesNotExist:
            # Try to get by name (in case code is different)
            try:
                underwriter = InsuranceProvider.objects.get(name=data['company_name'])
                # Update the code and other fields
                underwriter.code = data['company_code']
                underwriter.contact_email = data['contact_email']
                underwriter.supported_categories = data['supported_categories']
                underwriter.save()
                print(f"🔄 Updated existing: {underwriter.name}")
                created = False
            except InsuranceProvider.DoesNotExist:
                # Create new
                underwriter = InsuranceProvider.objects.create(
                    name=data['company_name'],
                    code=data['company_code'],
                    contact_email=data['contact_email'],
                    supported_categories=data['supported_categories']
                )
                print(f"✅ Created: {underwriter.name}")
                created = True
            
        # Store with market position for pricing calculation
        created_underwriters[underwriter.code] = {
            'underwriter': underwriter,
            'market_position': market_position
        }
    
    return created_underwriters

def get_pricing_multiplier(market_position, product_type):
    """Get pricing multiplier based on underwriter market position and product type"""
    multipliers = {
        'premium': {
            'TOR': 1.15,           # 15% higher for premium service
            'THIRD_PARTY': 1.12,   # 12% higher
            'COMPREHENSIVE': 1.08   # 8% higher for comprehensive
        },
        'competitive': {
            'TOR': 1.0,            # Base rate
            'THIRD_PARTY': 1.0,
            'COMPREHENSIVE': 1.0
        },
        'budget': {
            'TOR': 0.88,           # 12% lower for competitive pricing
            'THIRD_PARTY': 0.85,   # 15% lower
            'COMPREHENSIVE': 0.92   # 8% lower
        }
    }
    return Decimal(str(multipliers.get(market_position, {}).get(product_type, 1.0)))

def create_underwriter_features_data(underwriters):
    """Add pricing features to underwriters for different calculation logic"""
    
    print("Adding pricing features to underwriters...")
    
    # Get all cover types for pricing reference
    cover_types = MotorCoverType.objects.all()
    
    for code, data in underwriters.items():
        underwriter = data['underwriter']
        market_position = data['market_position']
        
        # Create pricing features for each product the underwriter supports
        pricing_features = {}
        
        for cover_type in cover_types:
            # Check if underwriter supports this category
            if cover_type.category.code not in underwriter.supported_categories:
                continue
                
            # Calculate underwriter-specific multipliers
            product_type = cover_type.cover_type
            multiplier = get_pricing_multiplier(market_position, product_type)
            
            # Base premiums for this underwriter
            base_premiums = {
                'PRIVATE_TOR': float(Decimal('1500.00') * multiplier),
                'PRIVATE_THIRD_PARTY': float(Decimal('3500.00') * multiplier),
                'PRIVATE_THIRD_PARTY_EXT': float(Decimal('4500.00') * multiplier),
                'PRIVATE_MOTORCYCLE_TP': float(Decimal('2800.00') * multiplier),
                'PRIVATE_COMPREHENSIVE': float(Decimal('0.030') * multiplier),  # Rate for comprehensive
                
                'COMMERCIAL_TOR': float(Decimal('2000.00') * multiplier),
                'COMMERCIAL_OWN_GOODS_TP': float(Decimal('4500.00') * multiplier),
                'COMMERCIAL_GENERAL_CARTAGE_TP': float(Decimal('5200.00') * multiplier),
                'COMMERCIAL_OWN_GOODS_COMP': float(Decimal('0.035') * multiplier),  # Rate for comprehensive
                
                'PSV_UBER_TP': float(Decimal('5500.00') * multiplier),
                'PSV_MATATU_TP_1M': float(Decimal('4800.00') * multiplier),
                'PSV_UBER_COMP': float(Decimal('0.038') * multiplier),  # Rate for comprehensive
                
                'PRIVATE_MOTORCYCLE_TP': float(Decimal('2800.00') * multiplier),
                'PSV_MOTORCYCLE_TP': float(Decimal('3200.00') * multiplier),
                'PRIVATE_MOTORCYCLE_COMP': float(Decimal('0.025') * multiplier),  # Rate for comprehensive
                
                'PSV_TUKTUK_TP': float(Decimal('3800.00') * multiplier),
                'COMMERCIAL_TUKTUK_TP': float(Decimal('4200.00') * multiplier),
                'COMMERCIAL_TUKTUK_COMP': float(Decimal('0.028') * multiplier),  # Rate for comprehensive
                
                'AGRICULTURAL_TRACTOR_TP': float(Decimal('6500.00') * multiplier),
                'COMMERCIAL_INSTITUTIONAL_TP': float(Decimal('7200.00') * multiplier),
                'AGRICULTURAL_TRACTOR_COMP': float(Decimal('0.040') * multiplier),  # Rate for comprehensive
                'COMMERCIAL_AMBULANCE_COMP': float(Decimal('0.045') * multiplier),  # Rate for comprehensive
            }
            
            # Store pricing info in features
            if cover_type.cover_type in ['TOR', 'THIRD_PARTY', 'THIRD_PARTY_EXT']:
                pricing_features[cover_type.code] = {
                    'pricing_type': 'fixed',
                    'base_premium': base_premiums.get(cover_type.code, 3500.0)
                }
            elif cover_type.cover_type == 'COMPREHENSIVE':
                pricing_features[cover_type.code] = {
                    'pricing_type': 'percentage',
                    'rate': base_premiums.get(cover_type.code, 0.030),
                    'min_premium': 15000.0 * float(multiplier)
                }
        
        # Update underwriter features
        current_features = underwriter.features or {}
        current_features['pricing'] = pricing_features
        current_features['market_position'] = market_position
        
        underwriter.features = current_features
        underwriter.save()
        
        print(f"  {underwriter.name}: {len(pricing_features)} product pricing rates ({market_position})")
    
    return len(underwriters)

def main():
    print("🚀 Starting Underwriter Pricing Data Population\n")
    
    # Step 1: Create underwriters
    underwriters = create_underwriters()
    print(f"✅ Created/Updated {len(underwriters)} underwriters\n")
    
    # Step 2: Create underwriter pricing features
    pricing_count = create_underwriter_features_data(underwriters)
    print(f"\n✅ Updated {pricing_count} underwriters with pricing features")
    
    # Step 3: Display summary
    print("\n" + "="*60)
    print("📊 UNDERWRITER PRICING SUMMARY")
    print("="*60)
    
    for code, data in underwriters.items():
        underwriter = data['underwriter']
        market_position = data['market_position']
        pricing_features = underwriter.features.get('pricing', {}) if underwriter.features else {}
        
        print(f"{underwriter.name} ({code}):")
        print(f"  Market Position: {market_position.title()}")
        print(f"  Products: {len(pricing_features)}")
        print(f"  Categories: {', '.join(underwriter.supported_categories)}")
        print()
    
    print("🎉 Underwriter pricing data population completed!")
    print("\n💡 Now you can test underwriter comparison with realistic pricing differences!")

if __name__ == '__main__':
    main()