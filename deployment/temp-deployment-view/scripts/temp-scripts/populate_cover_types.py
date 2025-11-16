#!/usr/bin/env python
"""
Script to populate MotorCoverType with all the required cover types
Run this after updating the model and running migrations
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

def create_cover_types():
    """Create all the required cover types based on your specifications"""
    
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

    # Clear existing cover types (optional - comment out if you want to keep existing)
    # MotorCoverType.objects.all().delete()

    cover_types_data = [
        # PRIVATE - Third Party (4)
        {
            'category': private_cat,
            'code': 'PRIVATE_TOR',
            'name': 'TOR For Private',
            'cover_type': 'TOR',
            'description': 'Time on Risk coverage for private vehicles',
            'has_fixed_premium': True,
            'base_premium': Decimal('1000.00'),
            'sort_order': 1
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
            'requires_engine_capacity': True,
            'sort_order': 4
        },
        
        # PRIVATE - Comprehensive (1)
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

        # COMMERCIAL - Third Party (9)
        {
            'category': commercial_cat,
            'code': 'COMMERCIAL_TOR',
            'name': 'TOR For Commercial',
            'cover_type': 'TOR',
            'description': 'Time on Risk coverage for commercial vehicles',
            'has_fixed_premium': True,
            'base_premium': Decimal('1500.00'),
            'requires_tonnage': True,
            'max_tonnage': 31,
            'sort_order': 1
        },
        {
            'category': commercial_cat,
            'code': 'COMMERCIAL_OWN_GOODS_TP',
            'name': 'Own Goods Third-Party',
            'cover_type': 'THIRD_PARTY',
            'description': 'Third party coverage for own goods vehicles',
            'product_subtype': 'OWN_GOODS',
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
            'description': 'Third party coverage for general cartage vehicles',
            'product_subtype': 'GENERAL_CARTAGE',
            'has_fixed_premium': True,
            'base_premium': Decimal('6000.00'),
            'requires_tonnage': True,
            'max_tonnage': 31,
            'sort_order': 3
        },
        {
            'category': commercial_cat,
            'code': 'COMMERCIAL_TUKTUK_TP',
            'name': 'Commercial TukTuk Third-Party',
            'cover_type': 'THIRD_PARTY',
            'description': 'Third party coverage for commercial tuktuks',
            'product_subtype': 'TUKTUK',
            'has_fixed_premium': True,
            'base_premium': Decimal('3000.00'),
            'sort_order': 4
        },
        {
            'category': commercial_cat,
            'code': 'COMMERCIAL_TUKTUK_TP_EXT',
            'name': 'Commercial Tuktuk Third-Party Extendible',
            'cover_type': 'THIRD_PARTY_EXT',
            'description': 'Extendible third party coverage for commercial tuktuks',
            'product_subtype': 'TUKTUK',
            'has_fixed_premium': True,
            'base_premium': Decimal('3500.00'),
            'sort_order': 5
        },
        {
            'category': commercial_cat,
            'code': 'COMMERCIAL_OWN_GOODS_TP_EXT',
            'name': 'Own Goods Third-Party Extendible',
            'cover_type': 'THIRD_PARTY_EXT',
            'description': 'Extendible third party coverage for own goods vehicles',
            'product_subtype': 'OWN_GOODS',
            'has_fixed_premium': True,
            'base_premium': Decimal('5500.00'),
            'requires_tonnage': True,
            'max_tonnage': 31,
            'sort_order': 6
        },
        {
            'category': commercial_cat,
            'code': 'COMMERCIAL_GENERAL_CARTAGE_TP_EXT',
            'name': 'General Cartage Third-Party Extendible',
            'cover_type': 'THIRD_PARTY_EXT',
            'description': 'Extendible third party coverage for general cartage vehicles',
            'product_subtype': 'GENERAL_CARTAGE',
            'has_fixed_premium': True,
            'base_premium': Decimal('6500.00'),
            'requires_tonnage': True,
            'max_tonnage': 31,
            'sort_order': 7
        },
        {
            'category': commercial_cat,
            'code': 'COMMERCIAL_PRIME_MOVER_TP',
            'name': 'General Cartage Third-Party Prime Mover',
            'cover_type': 'THIRD_PARTY',
            'description': 'Third party coverage for prime mover vehicles',
            'product_subtype': 'PRIME_MOVER',
            'has_fixed_premium': True,
            'base_premium': Decimal('8000.00'),
            'requires_tonnage': True,
            'max_tonnage': 31,
            'sort_order': 8
        },
        {
            'category': commercial_cat,
            'code': 'COMMERCIAL_PRIME_MOVER_TP_EXT',
            'name': 'General Cartage Third-Party Extendible Prime Mover',
            'cover_type': 'THIRD_PARTY_EXT',
            'description': 'Extendible third party coverage for prime mover vehicles',
            'product_subtype': 'PRIME_MOVER',
            'has_fixed_premium': True,
            'base_premium': Decimal('8500.00'),
            'requires_tonnage': True,
            'max_tonnage': 31,
            'sort_order': 9
        },

        # COMMERCIAL - Comprehensive (3)
        {
            'category': commercial_cat,
            'code': 'COMMERCIAL_TUKTUK_COMP',
            'name': 'Commercial TukTuk Comprehensive',
            'cover_type': 'COMPREHENSIVE',
            'description': 'Comprehensive coverage for commercial tuktuks',
            'product_subtype': 'TUKTUK',
            'has_fixed_premium': False,
            'requires_sum_insured': True,
            'min_sum_insured': Decimal('100000.00'),
            'max_sum_insured': Decimal('2000000.00'),
            'requires_tonnage': True,
            'sort_order': 10
        },
        {
            'category': commercial_cat,
            'code': 'COMMERCIAL_GENERAL_CARTAGE_COMP',
            'name': 'General Cartage Comprehensive',
            'cover_type': 'COMPREHENSIVE',
            'description': 'Comprehensive coverage for general cartage vehicles',
            'product_subtype': 'GENERAL_CARTAGE',
            'has_fixed_premium': False,
            'requires_sum_insured': True,
            'min_sum_insured': Decimal('500000.00'),
            'max_sum_insured': Decimal('10000000.00'),
            'requires_tonnage': True,
            'sort_order': 11
        },
        {
            'category': commercial_cat,
            'code': 'COMMERCIAL_OWN_GOODS_COMP',
            'name': 'Own Goods Comprehensive',
            'cover_type': 'COMPREHENSIVE',
            'description': 'Comprehensive coverage for own goods vehicles',
            'product_subtype': 'OWN_GOODS',
            'has_fixed_premium': False,
            'requires_sum_insured': True,
            'min_sum_insured': Decimal('500000.00'),
            'max_sum_insured': Decimal('8000000.00'),
            'requires_tonnage': True,
            'sort_order': 12
        },

        # PSV - Third Party (10)
        {
            'category': psv_cat,
            'code': 'PSV_UBER_TP',
            'name': 'PSV Uber Third-Party',
            'cover_type': 'THIRD_PARTY',
            'description': 'Third party coverage for Uber vehicles',
            'product_subtype': 'UBER',
            'has_fixed_premium': True,
            'base_premium': Decimal('4500.00'),
            'requires_passenger_count': True,
            'sort_order': 1
        },
        {
            'category': psv_cat,
            'code': 'PSV_TUKTUK_TP',
            'name': 'PSV Tuk-Tuk Third-Party',
            'cover_type': 'THIRD_PARTY',
            'description': 'Third party coverage for PSV tuktuks',
            'product_subtype': 'TUKTUK',
            'has_fixed_premium': True,
            'base_premium': Decimal('3500.00'),
            'requires_passenger_count': True,
            'sort_order': 2
        },
        {
            'category': psv_cat,
            'code': 'PSV_TUKTUK_TP_EXT',
            'name': 'PSV Tuk-Tuk Third-Party Extendible',
            'cover_type': 'THIRD_PARTY_EXT',
            'description': 'Extendible third party coverage for PSV tuktuks',
            'product_subtype': 'TUKTUK',
            'has_fixed_premium': True,
            'base_premium': Decimal('4000.00'),
            'requires_passenger_count': True,
            'sort_order': 3
        },
        {
            'category': psv_cat,
            'code': 'PSV_MATATU_1M_TP',
            'name': '1 Month PSV Matatu Third-Party',
            'cover_type': 'THIRD_PARTY',
            'description': '1 month third party coverage for matatus',
            'product_subtype': 'MATATU',
            'time_period': '1_MONTH',
            'has_fixed_premium': True,
            'base_premium': Decimal('5000.00'),
            'requires_passenger_count': True,
            'sort_order': 4
        },
        {
            'category': psv_cat,
            'code': 'PSV_MATATU_2W_TP',
            'name': '2 Weeks PSV Matatu Third-Party',
            'cover_type': 'THIRD_PARTY',
            'description': '2 weeks third party coverage for matatus',
            'product_subtype': 'MATATU',
            'time_period': '2_WEEKS',
            'has_fixed_premium': True,
            'base_premium': Decimal('3000.00'),
            'requires_passenger_count': True,
            'sort_order': 5
        },
        {
            'category': psv_cat,
            'code': 'PSV_UBER_TP_EXT',
            'name': 'PSV Uber Third-Party Extendible',
            'cover_type': 'THIRD_PARTY_EXT',
            'description': 'Extendible third party coverage for Uber vehicles',
            'product_subtype': 'UBER',
            'has_fixed_premium': True,
            'base_premium': Decimal('5000.00'),
            'requires_passenger_count': True,
            'sort_order': 6
        },
        {
            'category': psv_cat,
            'code': 'PSV_TOUR_VAN_TP',
            'name': 'PSV Tour Van Third-Party',
            'cover_type': 'THIRD_PARTY',
            'description': 'Third party coverage for tour vans',
            'product_subtype': 'TOUR_VAN',
            'has_fixed_premium': True,
            'base_premium': Decimal('6000.00'),
            'requires_passenger_count': True,
            'sort_order': 7
        },
        {
            'category': psv_cat,
            'code': 'PSV_MATATU_1W_TP_EXT',
            'name': '1 Week PSV Matatu Third-Party Extendible',
            'cover_type': 'THIRD_PARTY_EXT',
            'description': '1 week extendible third party coverage for matatus',
            'product_subtype': 'MATATU',
            'time_period': '1_WEEK',
            'has_fixed_premium': True,
            'base_premium': Decimal('2000.00'),
            'requires_passenger_count': True,
            'sort_order': 8
        },
        {
            'category': psv_cat,
            'code': 'PSV_PLAIN_TPO',
            'name': 'PSV Plain TPO',
            'cover_type': 'PLAIN_TPO',
            'description': 'Plain third party only coverage for PSV',
            'has_fixed_premium': True,
            'base_premium': Decimal('4000.00'),
            'requires_passenger_count': True,
            'sort_order': 9
        },
        {
            'category': psv_cat,
            'code': 'PSV_TOUR_VAN_TP_EXT',
            'name': 'PSV Tour Van Third-Party Extendible',
            'cover_type': 'THIRD_PARTY_EXT',
            'description': 'Extendible third party coverage for tour vans',
            'product_subtype': 'TOUR_VAN',
            'has_fixed_premium': True,
            'base_premium': Decimal('6500.00'),
            'requires_passenger_count': True,
            'sort_order': 10
        },

        # PSV - Comprehensive (2)
        {
            'category': psv_cat,
            'code': 'PSV_UBER_COMP',
            'name': 'PSV UBER COMPREHENSIVE',
            'cover_type': 'COMPREHENSIVE',
            'description': 'Comprehensive coverage for Uber vehicles',
            'product_subtype': 'UBER',
            'has_fixed_premium': False,
            'requires_sum_insured': True,
            'min_sum_insured': Decimal('300000.00'),
            'max_sum_insured': Decimal('5000000.00'),
            'requires_passenger_count': True,
            'sort_order': 11
        },
        {
            'category': psv_cat,
            'code': 'PSV_TOUR_VAN_COMP',
            'name': 'PSV TOUR VAN COMPREHENSIVE',
            'cover_type': 'COMPREHENSIVE',
            'description': 'Comprehensive coverage for tour vans',
            'product_subtype': 'TOUR_VAN',
            'has_fixed_premium': False,
            'requires_sum_insured': True,
            'min_sum_insured': Decimal('500000.00'),
            'max_sum_insured': Decimal('8000000.00'),
            'requires_passenger_count': True,
            'sort_order': 12
        },

        # MOTORCYCLE - Third Party (3)
        {
            'category': motorcycle_cat,
            'code': 'MOTORCYCLE_PRIVATE_TP',
            'name': 'Private Motorcycle Third Party',
            'cover_type': 'THIRD_PARTY',
            'description': 'Third party coverage for private motorcycles',
            'has_fixed_premium': True,
            'base_premium': Decimal('2500.00'),
            'requires_engine_capacity': True,
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
            'requires_engine_capacity': True,
            'sort_order': 2
        },
        {
            'category': motorcycle_cat,
            'code': 'MOTORCYCLE_PSV_6M_TP',
            'name': 'PSV Motorcycle Third-Party 6 Months',
            'cover_type': 'THIRD_PARTY',
            'description': '6 months third party coverage for PSV motorcycles',
            'time_period': '6_MONTHS',
            'has_fixed_premium': True,
            'base_premium': Decimal('2000.00'),
            'requires_engine_capacity': True,
            'sort_order': 3
        },

        # MOTORCYCLE - Comprehensive (3)
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
            'requires_engine_capacity': True,
            'sort_order': 4
        },
        {
            'category': motorcycle_cat,
            'code': 'MOTORCYCLE_PSV_COMP',
            'name': 'PSV Motorcycle Comprehensive',
            'cover_type': 'COMPREHENSIVE',
            'description': 'Comprehensive coverage for PSV motorcycles',
            'has_fixed_premium': False,
            'requires_sum_insured': True,
            'min_sum_insured': Decimal('80000.00'),
            'max_sum_insured': Decimal('800000.00'),
            'requires_engine_capacity': True,
            'sort_order': 5
        },
        {
            'category': motorcycle_cat,
            'code': 'MOTORCYCLE_PSV_6M_COMP',
            'name': 'PSV Motorcycle Comprehensive 6 Month',
            'cover_type': 'COMPREHENSIVE',
            'description': '6 months comprehensive coverage for PSV motorcycles',
            'time_period': '6_MONTHS',
            'has_fixed_premium': False,
            'requires_sum_insured': True,
            'min_sum_insured': Decimal('60000.00'),
            'max_sum_insured': Decimal('600000.00'),
            'requires_engine_capacity': True,
            'sort_order': 6
        },

        # TUKTUK - Third Party (4)
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
            'code': 'TUKTUK_PSV_TP_EXT',
            'name': 'PSV Tuk-Tuk Third-Party Extendible',
            'cover_type': 'THIRD_PARTY_EXT',
            'description': 'Extendible third party coverage for PSV tuktuks',
            'has_fixed_premium': True,
            'base_premium': Decimal('4000.00'),
            'requires_passenger_count': True,
            'sort_order': 2
        },
        {
            'category': tuktuk_cat,
            'code': 'TUKTUK_COMMERCIAL_TP',
            'name': 'Commercial TukTuk Third-Party',
            'cover_type': 'THIRD_PARTY',
            'description': 'Third party coverage for commercial tuktuks',
            'has_fixed_premium': True,
            'base_premium': Decimal('3000.00'),
            'sort_order': 3
        },
        {
            'category': tuktuk_cat,
            'code': 'TUKTUK_COMMERCIAL_TP_EXT',
            'name': 'Commercial Tuktuk Third-Party Extendible',
            'cover_type': 'THIRD_PARTY_EXT',
            'description': 'Extendible third party coverage for commercial tuktuks',
            'has_fixed_premium': True,
            'base_premium': Decimal('3500.00'),
            'sort_order': 4
        },

        # TUKTUK - Comprehensive (2)
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
            'sort_order': 5
        },
        {
            'category': tuktuk_cat,
            'code': 'TUKTUK_PSV_COMP',
            'name': 'PSV Tuk-Tuk Comprehensive',
            'cover_type': 'COMPREHENSIVE',
            'description': 'Comprehensive coverage for PSV tuktuks',
            'has_fixed_premium': False,
            'requires_sum_insured': True,
            'min_sum_insured': Decimal('150000.00'),
            'max_sum_insured': Decimal('2500000.00'),
            'requires_passenger_count': True,
            'sort_order': 6
        },

        # SPECIAL CLASSES - Third Party (5)
        {
            'category': special_cat,
            'code': 'SPECIAL_AGRICULTURAL_TP',
            'name': 'Agricultural Tractor Third-Party',
            'cover_type': 'THIRD_PARTY',
            'description': 'Third party coverage for agricultural tractors',
            'product_subtype': 'AGRICULTURAL',
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
            'description': 'Third party coverage for institutional vehicles',
            'product_subtype': 'INSTITUTIONAL',
            'has_fixed_premium': True,
            'base_premium': Decimal('5500.00'),
            'requires_passenger_count': True,
            'requires_passenger_type': True,
            'sort_order': 2
        },
        {
            'category': special_cat,
            'code': 'SPECIAL_INSTITUTIONAL_TP_EXT',
            'name': 'Commercial Institutional Third-Party Extendible',
            'cover_type': 'THIRD_PARTY_EXT',
            'description': 'Extendible third party coverage for institutional vehicles',
            'product_subtype': 'INSTITUTIONAL',
            'has_fixed_premium': True,
            'base_premium': Decimal('6000.00'),
            'requires_passenger_count': True,
            'requires_passenger_type': True,
            'sort_order': 3
        },
        {
            'category': special_cat,
            'code': 'SPECIAL_KG_PLATE_TP',
            'name': 'KG Plate Third-Party',
            'cover_type': 'THIRD_PARTY',
            'description': 'Third party coverage for KG plate vehicles',
            'product_subtype': 'KG_PLATE',
            'has_fixed_premium': True,
            'base_premium': Decimal('4500.00'),
            'sort_order': 4
        },
        {
            'category': special_cat,
            'code': 'SPECIAL_DRIVING_SCHOOL_TP',
            'name': 'Driving School Third-Party',
            'cover_type': 'THIRD_PARTY',
            'description': 'Third party coverage for driving school vehicles',
            'product_subtype': 'DRIVING_SCHOOL',
            'has_fixed_premium': True,
            'base_premium': Decimal('5000.00'),
            'requires_tonnage': True,
            'max_tonnage': 31,
            'requires_passenger_count': True,
            'sort_order': 5
        },

        # SPECIAL CLASSES - Comprehensive (5)
        {
            'category': special_cat,
            'code': 'SPECIAL_AGRICULTURAL_COMP',
            'name': 'Agricultural Tractor Comprehensive',
            'cover_type': 'COMPREHENSIVE',
            'description': 'Comprehensive coverage for agricultural tractors',
            'product_subtype': 'AGRICULTURAL',
            'has_fixed_premium': False,
            'requires_sum_insured': True,
            'min_sum_insured': Decimal('200000.00'),
            'max_sum_insured': Decimal('5000000.00'),
            'sort_order': 6
        },
        {
            'category': special_cat,
            'code': 'SPECIAL_INSTITUTIONAL_COMP',
            'name': 'Commercial Institutional Comprehensive',
            'cover_type': 'COMPREHENSIVE',
            'description': 'Comprehensive coverage for institutional vehicles',
            'product_subtype': 'INSTITUTIONAL',
            'has_fixed_premium': False,
            'requires_sum_insured': True,
            'min_sum_insured': Decimal('300000.00'),
            'max_sum_insured': Decimal('8000000.00'),
            'sort_order': 7
        },
        {
            'category': special_cat,
            'code': 'SPECIAL_DRIVING_SCHOOL_COMP',
            'name': 'Driving School Comprehensive',
            'cover_type': 'COMPREHENSIVE',
            'description': 'Comprehensive coverage for driving school vehicles',
            'product_subtype': 'DRIVING_SCHOOL',
            'has_fixed_premium': False,
            'requires_sum_insured': True,
            'min_sum_insured': Decimal('250000.00'),
            'max_sum_insured': Decimal('6000000.00'),
            'sort_order': 8
        },
        {
            'category': special_cat,
            'code': 'SPECIAL_FUEL_TANKERS_COMP',
            'name': 'Fuel Tankers Comprehensive',
            'cover_type': 'COMPREHENSIVE',
            'description': 'Comprehensive coverage for fuel tankers',
            'product_subtype': 'FUEL_TANKERS',
            'has_fixed_premium': False,
            'requires_sum_insured': True,
            'min_sum_insured': Decimal('1000000.00'),
            'max_sum_insured': Decimal('20000000.00'),
            'sort_order': 9
        },
        {
            'category': special_cat,
            'code': 'SPECIAL_AMBULANCE_COMP',
            'name': 'Commercial Ambulance Comprehensive',
            'cover_type': 'COMPREHENSIVE',
            'description': 'Comprehensive coverage for commercial ambulances',
            'product_subtype': 'AMBULANCE',
            'has_fixed_premium': False,
            'requires_sum_insured': True,
            'min_sum_insured': Decimal('500000.00'),
            'max_sum_insured': Decimal('10000000.00'),
            'sort_order': 10
        },
    ]

    # Create all cover types
    created_count = 0
    updated_count = 0
    
    for cover_data in cover_types_data:
        cover_type, created = MotorCoverType.objects.get_or_create(
            code=cover_data['code'],
            defaults=cover_data
        )
        
        if created:
            created_count += 1
            print(f"✅ Created: {cover_type.name}")
        else:
            # Update existing record
            for key, value in cover_data.items():
                if key != 'code':  # Don't update the unique identifier
                    setattr(cover_type, key, value)
            cover_type.save()
            updated_count += 1
            print(f"🔄 Updated: {cover_type.name}")

    print(f"\n🎉 Cover types population completed!")
    print(f"📊 Created: {created_count} new cover types")
    print(f"🔄 Updated: {updated_count} existing cover types")
    print(f"📈 Total cover types: {MotorCoverType.objects.count()}")

if __name__ == '__main__':
    create_cover_types()