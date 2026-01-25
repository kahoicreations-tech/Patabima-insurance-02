#!/usr/bin/env python
"""
Simple cover types population script using existing model fields only
"""

import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import MotorCategory, MotorCoverType
from decimal import Decimal

def create_basic_cover_types():
    """Create cover types using only existing model fields"""
    
    # Get or create categories
    private_cat, _ = MotorCategory.objects.get_or_create(
        code='PRIVATE',
        defaults={'name': 'Private', 'description': 'Personal vehicles for private use'}
    )
    
    commercial_cat, _ = MotorCategory.objects.get_or_create(
        code='COMMERCIAL', 
        defaults={'name': 'Commercial', 'description': 'Goods carriers and commercial vehicles'}
    )
    
    psv_cat, _ = MotorCategory.objects.get_or_create(
        code='PSV',
        defaults={'name': 'PSV', 'description': 'Public service vehicles'}
    )
    
    motorcycle_cat, _ = MotorCategory.objects.get_or_create(
        code='MOTORCYCLE',
        defaults={'name': 'Motorcycle', 'description': 'Motorcycles including boda boda'}
    )
    
    tuktuk_cat, _ = MotorCategory.objects.get_or_create(
        code='TUKTUK',
        defaults={'name': 'TukTuk', 'description': 'Three-wheeler vehicles'}
    )
    
    special_cat, _ = MotorCategory.objects.get_or_create(
        code='SPECIAL',
        defaults={'name': 'Special Classes', 'description': 'Agricultural, institutional, and special vehicles'}
    )

    # Clear existing cover types for fresh start
    print("Clearing existing cover types...")
    MotorCoverType.objects.all().delete()

    cover_types_data = [
        # PRIVATE - Third Party
        {
            'category': private_cat,
            'code': 'PRIVATE_TOR',
            'name': 'TOR For Private',
            'cover_type': 'TOR',
            'description': 'Time on Risk coverage for private vehicles',
            'has_fixed_premium': True,
            'base_premium': Decimal('1500.00'),  # Updated to match backend calculation
            'sort_order': 1,
            # TOR is third-party insurance - requires make/model for identification but not sum_insured
            'requires_sum_insured': False,
            'requires_vehicle_make_model': True,
            'requires_year_of_manufacture': True,
            'requires_chassis_number': False,
            'requires_financial_interest': False,
            'requires_vehicle_identification_method': False,
        },
        {
            'category': private_cat,
            'code': 'PRIVATE_THIRD_PARTY',
            'name': 'Private Third-Party',
            'cover_type': 'THIRD_PARTY',
            'description': 'Third party coverage for private vehicles',
            'has_fixed_premium': True,
            'base_premium': Decimal('3500.00'),
            'sort_order': 2
        },
        {
            'category': private_cat,
            'code': 'PRIVATE_THIRD_PARTY_EXT',
            'name': 'Private Third-Party Extendible',
            'cover_type': 'THIRD_PARTY_EXT',
            'description': 'Extendible third party coverage for private vehicles',
            'has_fixed_premium': True,
            'base_premium': Decimal('4000.00'),
            'sort_order': 3
        },
        {
            'category': private_cat,
            'code': 'PRIVATE_MOTORCYCLE_TP',
            'name': 'Private Motorcycle Third-Party',
            'cover_type': 'THIRD_PARTY',
            'description': 'Third party coverage for private motorcycles',
            'has_fixed_premium': True,
            'base_premium': Decimal('2500.00'),
            'sort_order': 4
        },
        
        # PRIVATE - Comprehensive
        {
            'category': private_cat,
            'code': 'PRIVATE_COMPREHENSIVE',
            'name': 'Private Comprehensive',
            'cover_type': 'COMPREHENSIVE',
            'description': 'Full comprehensive coverage for private vehicles',
            'has_fixed_premium': False,
            'requires_sum_insured': True,
            'min_sum_insured': Decimal('200000.00'),
            'max_sum_insured': Decimal('15000000.00'),
            'requires_vehicle_valuation': True,
            'requires_windscreen_value': True,
            'requires_radio_value': True,
            'supports_optional_addons': True,
            'sort_order': 5
        },

        # COMMERCIAL - Third Party
        {
            'category': commercial_cat,
            'code': 'COMMERCIAL_TOR',
            'name': 'TOR For Commercial',
            'cover_type': 'TOR',
            'description': 'Time on Risk coverage for commercial vehicles (field tonnage up to 31)',
            'has_fixed_premium': True,
            'base_premium': Decimal('2000.00'),  # Updated to match backend calculation
            'requires_tonnage': True,  # Commercial TOR still needs tonnage for rate determination
            'max_tonnage': 31,
            'sort_order': 1,
            # TOR is third-party insurance - requires make/model for identification but not sum_insured
            'requires_sum_insured': False,
            'requires_vehicle_make_model': True,
            'requires_year_of_manufacture': True,
            'requires_chassis_number': False,
            'requires_financial_interest': False,
            'requires_vehicle_identification_method': False,
        },
        {
            'category': commercial_cat,
            'code': 'COMMERCIAL_OWN_GOODS_TP',
            'name': 'Own Goods Third-Party',
            'cover_type': 'THIRD_PARTY',
            'description': 'Third party coverage for own goods vehicles (field tonnage up to 31)',
            'has_fixed_premium': True,
            'base_premium': Decimal('5000.00'),
            'requires_tonnage': True,
            'max_tonnage': 31,
            'sort_order': 2
        },
        {
            'category': commercial_cat,
            'code': 'COMMERCIAL_GENERAL_CARTAGE_TP',
            'name': 'General Cartage Third-Party',
            'cover_type': 'THIRD_PARTY',
            'description': 'Third party coverage for general cartage vehicles (field tonnage up to 31)',
            'has_fixed_premium': True,
            'base_premium': Decimal('6000.00'),
            'requires_tonnage': True,
            'max_tonnage': 31,
            'sort_order': 3
        },

        # COMMERCIAL - Comprehensive
        {
            'category': commercial_cat,
            'code': 'COMMERCIAL_OWN_GOODS_COMP',
            'name': 'Own Goods Comprehensive',
            'cover_type': 'COMPREHENSIVE',
            'description': 'Comprehensive coverage for own goods vehicles (field tonnage)',
            'has_fixed_premium': False,
            'requires_sum_insured': True,
            'min_sum_insured': Decimal('500000.00'),
            'max_sum_insured': Decimal('8000000.00'),
            'requires_tonnage': True,
            'sort_order': 4
        },

        # PSV - Third Party
        {
            'category': psv_cat,
            'code': 'PSV_UBER_TP',
            'name': 'PSV Uber Third-Party',
            'cover_type': 'THIRD_PARTY',
            'description': 'Third party coverage for Uber vehicles (Number of passengers)',
            'has_fixed_premium': True,
            'base_premium': Decimal('4500.00'),
            'requires_passenger_count': True,
            'sort_order': 1
        },
        {
            'category': psv_cat,
            'code': 'PSV_MATATU_1M_TP',
            'name': '1 Month PSV Matatu Third-Party',
            'cover_type': 'THIRD_PARTY',
            'description': '1 month third party coverage for matatus (Number of passengers)',
            'time_period': '1_MONTH',
            'has_fixed_premium': True,
            'base_premium': Decimal('5000.00'),
            'requires_passenger_count': True,
            'sort_order': 2
        },

        # PSV - Comprehensive
        {
            'category': psv_cat,
            'code': 'PSV_UBER_COMP',
            'name': 'PSV UBER COMPREHENSIVE',
            'cover_type': 'COMPREHENSIVE',
            'description': 'Comprehensive coverage for Uber vehicles (Number of passengers)',
            'has_fixed_premium': False,
            'requires_sum_insured': True,
            'min_sum_insured': Decimal('300000.00'),
            'max_sum_insured': Decimal('5000000.00'),
            'requires_passenger_count': True,
            'sort_order': 3
        },

        # MOTORCYCLE - Third Party
        {
            'category': motorcycle_cat,
            'code': 'MOTORCYCLE_PRIVATE_TP',
            'name': 'Private Motorcycle Third Party',
            'cover_type': 'THIRD_PARTY',
            'description': 'Third party coverage for private motorcycles',
            'has_fixed_premium': True,
            'base_premium': Decimal('2500.00'),
            'sort_order': 1
        },
        {
            'category': motorcycle_cat,
            'code': 'MOTORCYCLE_PSV_TP',
            'name': 'PSV Motorcycle Third Party',
            'cover_type': 'THIRD_PARTY',
            'description': 'Third party coverage for PSV motorcycles',
            'has_fixed_premium': True,
            'base_premium': Decimal('3000.00'),
            'sort_order': 2
        },

        # MOTORCYCLE - Comprehensive
        {
            'category': motorcycle_cat,
            'code': 'MOTORCYCLE_PRIVATE_COMP',
            'name': 'Private Motorcycle Comprehensive',
            'cover_type': 'COMPREHENSIVE',
            'description': 'Comprehensive coverage for private motorcycles',
            'has_fixed_premium': False,
            'requires_sum_insured': True,
            'min_sum_insured': Decimal('50000.00'),
            'max_sum_insured': Decimal('500000.00'),
            'sort_order': 3
        },

        # TUKTUK - Third Party
        {
            'category': tuktuk_cat,
            'code': 'TUKTUK_PSV_TP',
            'name': 'PSV Tuk-Tuk Third-Party',
            'cover_type': 'THIRD_PARTY',
            'description': 'Third party coverage for PSV tuktuks',
            'has_fixed_premium': True,
            'base_premium': Decimal('3500.00'),
            'requires_passenger_count': True,
            'sort_order': 1
        },
        {
            'category': tuktuk_cat,
            'code': 'TUKTUK_COMMERCIAL_TP',
            'name': 'Commercial TukTuk Third-Party',
            'cover_type': 'THIRD_PARTY',
            'description': 'Third party coverage for commercial tuktuks',
            'has_fixed_premium': True,
            'base_premium': Decimal('3000.00'),
            'sort_order': 2
        },

        # TUKTUK - Comprehensive
        {
            'category': tuktuk_cat,
            'code': 'TUKTUK_COMMERCIAL_COMP',
            'name': 'Commercial TukTuk Comprehensive',
            'cover_type': 'COMPREHENSIVE',
            'description': 'Comprehensive coverage for commercial tuktuks',
            'has_fixed_premium': False,
            'requires_sum_insured': True,
            'min_sum_insured': Decimal('100000.00'),
            'max_sum_insured': Decimal('2000000.00'),
            'sort_order': 3
        },

        # SPECIAL CLASSES - Third Party
        {
            'category': special_cat,
            'code': 'SPECIAL_AGRICULTURAL_TP',
            'name': 'Agricultural Tractor Third-Party',
            'cover_type': 'THIRD_PARTY',
            'description': 'Third party coverage for agricultural tractors (field tonnage up to 31)',
            'has_fixed_premium': True,
            'base_premium': Decimal('4000.00'),
            'requires_tonnage': True,
            'max_tonnage': 31,
            'sort_order': 1
        },
        {
            'category': special_cat,
            'code': 'SPECIAL_INSTITUTIONAL_TP',
            'name': 'Commercial Institutional Third-Party',
            'cover_type': 'THIRD_PARTY',
            'description': 'Third party coverage for institutional vehicles (Number of passengers, Passenger type)',
            'has_fixed_premium': True,
            'base_premium': Decimal('5500.00'),
            'requires_passenger_count': True,
            'requires_passenger_type': True,
            'sort_order': 2
        },

        # SPECIAL CLASSES - Comprehensive
        {
            'category': special_cat,
            'code': 'SPECIAL_AGRICULTURAL_COMP',
            'name': 'Agricultural Tractor Comprehensive',
            'cover_type': 'COMPREHENSIVE',
            'description': 'Comprehensive coverage for agricultural tractors',
            'has_fixed_premium': False,
            'requires_sum_insured': True,
            'min_sum_insured': Decimal('200000.00'),
            'max_sum_insured': Decimal('5000000.00'),
            'sort_order': 3
        },
        {
            'category': special_cat,
            'code': 'SPECIAL_AMBULANCE_COMP',
            'name': 'Commercial Ambulance Comprehensive',
            'cover_type': 'COMPREHENSIVE',
            'description': 'Comprehensive coverage for commercial ambulances',
            'has_fixed_premium': False,
            'requires_sum_insured': True,
            'min_sum_insured': Decimal('500000.00'),
            'max_sum_insured': Decimal('10000000.00'),
            'sort_order': 4
        },
    ]

    # Create all cover types
    created_count = 0
    
    for cover_data in cover_types_data:
        try:
            cover_type = MotorCoverType.objects.create(**cover_data)
            created_count += 1
            print(f"✅ Created: {cover_type.name}")
        except Exception as e:
            print(f"❌ Failed to create {cover_data['name']}: {e}")

    print(f"\n🎉 Cover types population completed!")
    print(f"📊 Created: {created_count} new cover types")
    print(f"📈 Total cover types: {MotorCoverType.objects.count()}")

if __name__ == '__main__':
    create_basic_cover_types()