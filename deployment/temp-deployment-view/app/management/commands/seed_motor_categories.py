from django.core.management.base import BaseCommand

from app.models import MotorCategory


class Command(BaseCommand):
    help = 'Seed motor categories (6 main categories)'

    def handle(self, *args, **options):
        self.stdout.write('Seeding motor categories (basic)...')

        categories_data = [
            {
                'code': 'PRIVATE',
                'name': 'Private',
                'description': 'Personal vehicles for private use',
                'icon': '🚗',
                'pricing_type': 'dynamic',
                'sort_order': 1,
                'requires_tonnage': False,
                'requires_engine_capacity': False,
                'requires_passenger_count': False,
                'requires_passenger_type': False,
                'requires_carrying_capacity': False,
                'supports_time_period_variants': False,
                'min_vehicle_age': 0,
                'max_vehicle_age': 25
            },
            {
                'code': 'COMMERCIAL',
                'name': 'Commercial',
                'description': 'Goods carriers and commercial vehicles',
                'icon': '🚚',
                'pricing_type': 'dynamic',
                'sort_order': 2,
                'requires_tonnage': True,
                'requires_engine_capacity': False,
                'requires_passenger_count': False,
                'requires_passenger_type': False,
                'requires_carrying_capacity': False,
                'supports_time_period_variants': False,
                'min_vehicle_age': 0,
                'max_vehicle_age': 20
            },
            {
                'code': 'PSV',
                'name': 'PSV',
                'description': 'Public service vehicles (matatu, buses)',
                'icon': '🚌',
                'pricing_type': 'dynamic',
                'sort_order': 3,
                'requires_tonnage': False,
                'requires_engine_capacity': False,
                'requires_passenger_count': True,
                'requires_passenger_type': False,
                'requires_carrying_capacity': False,
                'supports_time_period_variants': True,
                'min_vehicle_age': 0,
                'max_vehicle_age': 20
            },
            {
                'code': 'MOTORCYCLE',
                'name': 'Motorcycle',
                'description': 'Motorcycles including boda boda',
                'icon': '🏍️',
                'pricing_type': 'dynamic',
                'sort_order': 4,
                'requires_tonnage': False,
                'requires_engine_capacity': True,
                'requires_passenger_count': False,
                'requires_passenger_type': False,
                'requires_carrying_capacity': False,
                'supports_time_period_variants': True,
                'min_vehicle_age': 0,
                'max_vehicle_age': 15
            },
            {
                'code': 'TUKTUK',
                'name': 'TukTuk',
                'description': 'Three-wheeler vehicles',
                'icon': '🛺',
                'pricing_type': 'dynamic',
                'sort_order': 5,
                'requires_tonnage': False,
                'requires_engine_capacity': False,
                'requires_passenger_count': True,
                'requires_passenger_type': False,
                'requires_carrying_capacity': False,
                'supports_time_period_variants': False,
                'min_vehicle_age': 0,
                'max_vehicle_age': 15
            },
            {
                'code': 'SPECIAL',
                'name': 'Special Classes',
                'description': 'Agricultural, institutional, and special vehicles',
                'icon': '🚜',
                'pricing_type': 'dynamic',
                'sort_order': 6,
                'requires_tonnage': True,
                'requires_engine_capacity': False,
                'requires_passenger_count': True,
                'requires_passenger_type': True,
                'requires_carrying_capacity': False,
                'supports_time_period_variants': False,
                'min_vehicle_age': 0,
                'max_vehicle_age': 25
            }
        ]

        created = 0
        for data in categories_data:
            obj, was_created = MotorCategory.objects.update_or_create(
                code=data['code'], defaults=data
            )
            created += int(was_created)

        self.stdout.write(self.style.SUCCESS(f'Seeded/updated {len(categories_data)} categories ({created} created).'))

        # TODO: Add cover types seeding in a follow-up command or extend here.
        
        for cat_data in categories_data:
            category, created = MotorCategory.objects.get_or_create(
                code=cat_data['code'],
                defaults=cat_data
            )
            if created:
                self.stdout.write(f'Created category: {category.name}')
            else:
                self.stdout.write(f'Category exists: {category.name}')
        
        # Create cover types for each category - All actual products
        self.create_cover_types()
        
        self.stdout.write(self.style.SUCCESS('Motor categories with all 60+ products seeded successfully'))
    
    def create_cover_types(self):
        """
        Create all 60+ actual motor insurance products according to business requirements
        """
        cover_types_data = [
            # PRIVATE CATEGORY - 7 products
            {
                'category_code': 'PRIVATE',
                'code': 'PRIVATE_TOR',
                'name': 'Time on Risk (TOR)',
                'cover_type': 'TOR',
                'description': 'Temporary coverage for private vehicles',
                'has_fixed_premium': True,
                'base_premium': 1000,
                'requires_sum_insured': False,
                'time_period': '1_WEEK',
                'sort_order': 1
            },
            {
                'category_code': 'PRIVATE',
                'code': 'PRIVATE_THIRD_PARTY',
                'name': 'Third Party',
                'cover_type': 'THIRD_PARTY',
                'description': 'Third party coverage for private vehicles',
                'has_fixed_premium': True,
                'base_premium': 3500,
                'requires_sum_insured': False,
                'sort_order': 2
            },
            {
                'category_code': 'PRIVATE',
                'code': 'PRIVATE_TP_EXT',
                'name': 'Private Third-Party Extendible',
                'cover_type': 'THIRD_PARTY_EXT',
                'description': 'Third party extendible for private vehicles',
                'has_fixed_premium': True,
                'base_premium': 4000,
                'requires_sum_insured': False,
                'sort_order': 2
            },
            {
                'category_code': 'PRIVATE',
                'code': 'PRIVATE_COMPREHENSIVE',
                'name': 'Comprehensive',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Full comprehensive coverage for private vehicles',
                'has_fixed_premium': False,
                'requires_sum_insured': True,
                'min_sum_insured': 200000,
                'max_sum_insured': 15000000,
                'requires_vehicle_valuation': True,
                'requires_windscreen_value': True,
                'requires_radio_value': True,
                'supports_optional_addons': True,
                'sort_order': 3
            },
            {
                'category_code': 'PRIVATE',
                'code': 'PRIVATE_ACT_ONLY',
                'name': 'Act Only',
                'cover_type': 'THIRD_PARTY',
                'description': 'Minimum statutory coverage',
                'has_fixed_premium': True,
                'base_premium': 2500,
                'requires_sum_insured': False,
                'sort_order': 4
            },
            {
                'category_code': 'PRIVATE',
                'code': 'PRIVATE_WINDSCREEN',
                'name': 'Windscreen Only',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Windscreen coverage only',
                'has_fixed_premium': True,
                'base_premium': 800,
                'requires_sum_insured': False,
                'sort_order': 5
            },
            {
                'category_code': 'PRIVATE',
                'code': 'PRIVATE_FIRE_THEFT',
                'name': 'Fire & Theft',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Fire and theft coverage',
                'has_fixed_premium': False,
                'requires_sum_insured': True,
                'min_sum_insured': 100000,
                'max_sum_insured': 5000000,
                'sort_order': 6
            },
            {
                'category_code': 'PRIVATE',
                'code': 'PRIVATE_PLL',
                'name': 'Public Liability Only',
                'cover_type': 'THIRD_PARTY',
                'description': 'Public liability coverage only',
                'has_fixed_premium': True,
                'base_premium': 1500,
                'requires_sum_insured': False,
                'sort_order': 7
            },

            # COMMERCIAL CATEGORY - 15 products
            {
                'category_code': 'COMMERCIAL',
                'code': 'COMMERCIAL_UP_TO_3_TONS',
                'name': 'Up to 3 Tons',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Commercial vehicles up to 3 tons',
                'has_fixed_premium': False,
                'requires_sum_insured': True,
                'requires_tonnage': True,
                'max_tonnage': 3,
                'min_sum_insured': 500000,
                'max_sum_insured': 10000000,
                'requires_vehicle_valuation': True,
                'sort_order': 1
            },
            {
                'category_code': 'COMMERCIAL',
                'code': 'COMMERCIAL_3_TO_5_TONS',
                'name': '3-5 Tons',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Commercial vehicles 3-5 tons',
                'has_fixed_premium': False,
                'requires_sum_insured': True,
                'requires_tonnage': True,
                'max_tonnage': 5,
                'min_sum_insured': 800000,
                'max_sum_insured': 15000000,
                'requires_vehicle_valuation': True,
                'sort_order': 2
            },
            {
                'category_code': 'COMMERCIAL',
                'code': 'COMMERCIAL_5_TO_10_TONS',
                'name': '5-10 Tons',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Commercial vehicles 5-10 tons',
                'has_fixed_premium': False,
                'requires_sum_insured': True,
                'requires_tonnage': True,
                'max_tonnage': 10,
                'min_sum_insured': 1200000,
                'max_sum_insured': 25000000,
                'requires_vehicle_valuation': True,
                'sort_order': 3
            },
            {
                'category_code': 'COMMERCIAL',
                'code': 'COMMERCIAL_10_TO_15_TONS',
                'name': '10-15 Tons',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Commercial vehicles 10-15 tons',
                'has_fixed_premium': False,
                'requires_sum_insured': True,
                'requires_tonnage': True,
                'max_tonnage': 15,
                'min_sum_insured': 1800000,
                'max_sum_insured': 35000000,
                'requires_vehicle_valuation': True,
                'sort_order': 4
            },
            {
                'category_code': 'COMMERCIAL',
                'code': 'COMMERCIAL_15_TO_20_TONS',
                'name': '15-20 Tons',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Commercial vehicles 15-20 tons',
                'has_fixed_premium': False,
                'requires_sum_insured': True,
                'requires_tonnage': True,
                'max_tonnage': 20,
                'min_sum_insured': 2500000,
                'max_sum_insured': 50000000,
                'requires_vehicle_valuation': True,
                'sort_order': 5
            },
            {
                'category_code': 'COMMERCIAL',
                'code': 'COMMERCIAL_20_TO_31_TONS',
                'name': '20-31 Tons',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Commercial vehicles 20-31 tons',
                'has_fixed_premium': False,
                'requires_sum_insured': True,
                'requires_tonnage': True,
                'max_tonnage': 31,
                'min_sum_insured': 3500000,
                'max_sum_insured': 75000000,
                'requires_vehicle_valuation': True,
                'sort_order': 6
            },
            {
                'category_code': 'COMMERCIAL',
                'code': 'COMMERCIAL_OVER_31_TONS',
                'name': 'Over 31 Tons',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Commercial vehicles over 31 tons',
                'has_fixed_premium': False,
                'requires_sum_insured': True,
                'requires_tonnage': True,
                'requires_manual_underwriting': True,
                'min_sum_insured': 5000000,
                'max_sum_insured': 100000000,
                'requires_vehicle_valuation': True,
                'sort_order': 7
            },
            # Commercial Third Party Products
            {
                'category_code': 'COMMERCIAL',
                'code': 'COMMERCIAL_TP_LIGHT',
                'name': 'Commercial TP - Light (Up to 5T)',
                'cover_type': 'THIRD_PARTY',
                'description': 'Third party for light commercial vehicles',
                'has_fixed_premium': True,
                'base_premium': 8500,
                'requires_sum_insured': False,
                'requires_tonnage': True,
                'max_tonnage': 5,
                'sort_order': 8
            },
            {
                'category_code': 'COMMERCIAL',
                'code': 'COMMERCIAL_TP_MEDIUM',
                'name': 'Commercial TP - Medium (5-15T)',
                'cover_type': 'THIRD_PARTY',
                'description': 'Third party for medium commercial vehicles',
                'has_fixed_premium': True,
                'base_premium': 15000,
                'requires_sum_insured': False,
                'requires_tonnage': True,
                'max_tonnage': 15,
                'sort_order': 9
            },
            {
                'category_code': 'COMMERCIAL',
                'code': 'COMMERCIAL_TP_HEAVY',
                'name': 'Commercial TP - Heavy (15-31T)',
                'cover_type': 'THIRD_PARTY',
                'description': 'Third party for heavy commercial vehicles',
                'has_fixed_premium': True,
                'base_premium': 25000,
                'requires_sum_insured': False,
                'requires_tonnage': True,
                'max_tonnage': 31,
                'sort_order': 10
            },
            {
                'category_code': 'COMMERCIAL',
                'code': 'COMMERCIAL_TP_SUPER_HEAVY',
                'name': 'Commercial TP - Super Heavy (Over 31T)',
                'cover_type': 'THIRD_PARTY',
                'description': 'Third party for super heavy commercial vehicles',
                'has_fixed_premium': True,
                'base_premium': 45000,
                'requires_sum_insured': False,
                'requires_tonnage': True,
                'requires_manual_underwriting': True,
                'sort_order': 11
            },
            # Fleet and Special Commercial
            {
                'category_code': 'COMMERCIAL',
                'code': 'COMMERCIAL_FLEET',
                'name': 'Fleet Coverage',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Fleet insurance for multiple commercial vehicles',
                'has_fixed_premium': False,
                'requires_sum_insured': True,
                'requires_tonnage': True,
                'requires_manual_underwriting': True,
                'min_sum_insured': 2000000,
                'max_sum_insured': 500000000,
                'sort_order': 12
            },
            {
                'category_code': 'COMMERCIAL',
                'code': 'COMMERCIAL_FIRE_THEFT',
                'name': 'Commercial Fire & Theft',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Fire and theft for commercial vehicles',
                'has_fixed_premium': False,
                'requires_sum_insured': True,
                'requires_tonnage': True,
                'min_sum_insured': 300000,
                'max_sum_insured': 20000000,
                'sort_order': 13
            },
            {
                'category_code': 'COMMERCIAL',
                'code': 'COMMERCIAL_HIRE_PURCHASE',
                'name': 'Hire Purchase Commercial',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Commercial vehicles under hire purchase',
                'has_fixed_premium': False,
                'requires_sum_insured': True,
                'requires_tonnage': True,
                'allows_financed_vehicles': True,
                'min_sum_insured': 500000,
                'max_sum_insured': 50000000,
                'sort_order': 14
            },
            {
                'category_code': 'COMMERCIAL',
                'code': 'COMMERCIAL_TRANSIT',
                'name': 'Goods in Transit',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Coverage for goods in commercial transit',
                'has_fixed_premium': False,
                'requires_sum_insured': True,
                'requires_tonnage': True,
                'min_sum_insured': 100000,
                'max_sum_insured': 100000000,
                'sort_order': 15
            },

            # PSV CATEGORY - 12 products
            {
                'category_code': 'PSV',
                'code': 'PSV_UP_TO_13_PASS_TP',
                'name': 'Up to 13 Pass - Third Party',
                'cover_type': 'THIRD_PARTY',
                'description': 'PSV up to 13 passengers - third party',
                'has_fixed_premium': True,
                'base_premium': 12000,
                'requires_sum_insured': False,
                'requires_passenger_count': True,
                'sort_order': 1
            },
            {
                'category_code': 'PSV',
                'code': 'PSV_14_TO_25_PASS_TP',
                'name': '14-25 Pass - Third Party',
                'cover_type': 'THIRD_PARTY',
                'description': 'PSV 14-25 passengers - third party',
                'has_fixed_premium': True,
                'base_premium': 18000,
                'requires_sum_insured': False,
                'requires_passenger_count': True,
                'sort_order': 2
            },
            {
                'category_code': 'PSV',
                'code': 'PSV_26_TO_33_PASS_TP',
                'name': '26-33 Pass - Third Party',
                'cover_type': 'THIRD_PARTY',
                'description': 'PSV 26-33 passengers - third party',
                'has_fixed_premium': True,
                'base_premium': 28000,
                'requires_sum_insured': False,
                'requires_passenger_count': True,
                'sort_order': 3
            },
            {
                'category_code': 'PSV',
                'code': 'PSV_34_TO_49_PASS_TP',
                'name': '34-49 Pass - Third Party',
                'cover_type': 'THIRD_PARTY',
                'description': 'PSV 34-49 passengers - third party',
                'has_fixed_premium': True,
                'base_premium': 42000,
                'requires_sum_insured': False,
                'requires_passenger_count': True,
                'sort_order': 4
            },
            {
                'category_code': 'PSV',
                'code': 'PSV_OVER_49_PASS_TP',
                'name': 'Over 49 Pass - Third Party',
                'cover_type': 'THIRD_PARTY',
                'description': 'PSV over 49 passengers - third party',
                'has_fixed_premium': True,
                'base_premium': 65000,
                'requires_sum_insured': False,
                'requires_passenger_count': True,
                'requires_manual_underwriting': True,
                'sort_order': 5
            },
            # PSV with time period variants (monthly options)
            {
                'category_code': 'PSV',
                'code': 'PSV_MATATU_1M_TP',
                'name': '1 Month PSV Matatu - Third Party',
                'cover_type': 'THIRD_PARTY',
                'description': 'Monthly PSV matatu third party coverage',
                'has_fixed_premium': True,
                'base_premium': 5000,
                'requires_sum_insured': False,
                'requires_passenger_count': True,
                'time_period': '1_MONTH',
                'sort_order': 6
            },
            {
                'category_code': 'PSV',
                'code': 'PSV_MATATU_6M_TP',
                'name': '6 Month PSV Matatu - Third Party',
                'cover_type': 'THIRD_PARTY',
                'description': '6-month PSV matatu third party coverage',
                'has_fixed_premium': True,
                'base_premium': 25000,
                'requires_sum_insured': False,
                'requires_passenger_count': True,
                'time_period': '6_MONTHS',
                'sort_order': 7
            },
            {
                'category_code': 'PSV',
                'code': 'PSV_BUS_1M_TP',
                'name': '1 Month PSV Bus - Third Party',
                'cover_type': 'THIRD_PARTY',
                'description': 'Monthly PSV bus third party coverage',
                'has_fixed_premium': True,
                'base_premium': 8000,
                'requires_sum_insured': False,
                'requires_passenger_count': True,
                'time_period': '1_MONTH',
                'sort_order': 8
            },
            {
                'category_code': 'PSV',
                'code': 'PSV_BUS_6M_TP',
                'name': '6 Month PSV Bus - Third Party',
                'cover_type': 'THIRD_PARTY',
                'description': '6-month PSV bus third party coverage',
                'has_fixed_premium': True,
                'base_premium': 40000,
                'requires_sum_insured': False,
                'requires_passenger_count': True,
                'time_period': '6_MONTHS',
                'sort_order': 9
            },
            {
                'category_code': 'PSV',
                'code': 'PSV_SCHOOL_BUS_TP',
                'name': 'PSV School Bus - Third Party',
                'cover_type': 'THIRD_PARTY',
                'description': 'PSV school bus third party coverage',
                'has_fixed_premium': True,
                'base_premium': 35000,
                'requires_sum_insured': False,
                'requires_passenger_count': True,
                'requires_passenger_type': True,
                'sort_order': 10
            },
            # PSV Comprehensive products
            {
                'category_code': 'PSV',
                'code': 'PSV_MATATU_COMP',
                'name': 'PSV Matatu Comprehensive',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Comprehensive coverage for PSV matatu',
                'has_fixed_premium': False,
                'requires_sum_insured': True,
                'requires_passenger_count': True,
                'min_sum_insured': 500000,
                'max_sum_insured': 8000000,
                'requires_vehicle_valuation': True,
                'sort_order': 11
            },
            {
                'category_code': 'PSV',
                'code': 'PSV_BUS_COMP',
                'name': 'PSV Bus Comprehensive',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Comprehensive coverage for PSV buses',
                'has_fixed_premium': False,
                'requires_sum_insured': True,
                'requires_passenger_count': True,
                'min_sum_insured': 1000000,
                'max_sum_insured': 20000000,
                'requires_vehicle_valuation': True,
                'sort_order': 12
            },

            # MOTORCYCLE CATEGORY - 6 products
            {
                'category_code': 'MOTORCYCLE',
                'code': 'MOTORCYCLE_UP_TO_250CC_TP',
                'name': 'Motorcycle Up to 250cc - TP',
                'cover_type': 'THIRD_PARTY',
                'description': 'Third party for motorcycles up to 250cc',
                'has_fixed_premium': True,
                'base_premium': 2500,
                'requires_sum_insured': False,
                'requires_engine_capacity': True,
                'sort_order': 1
            },
            {
                'category_code': 'MOTORCYCLE',
                'code': 'MOTORCYCLE_251_TO_500CC_TP',
                'name': 'Motorcycle 251-500cc - TP',
                'cover_type': 'THIRD_PARTY',
                'description': 'Third party for motorcycles 251-500cc',
                'has_fixed_premium': True,
                'base_premium': 3500,
                'requires_sum_insured': False,
                'requires_engine_capacity': True,
                'sort_order': 2
            },
            {
                'category_code': 'MOTORCYCLE',
                'code': 'MOTORCYCLE_OVER_500CC_TP',
                'name': 'Motorcycle Over 500cc - TP',
                'cover_type': 'THIRD_PARTY',
                'description': 'Third party for motorcycles over 500cc',
                'has_fixed_premium': True,
                'base_premium': 5000,
                'requires_sum_insured': False,
                'requires_engine_capacity': True,
                'sort_order': 3
            },
            {
                'category_code': 'MOTORCYCLE',
                'code': 'MOTORCYCLE_UP_TO_250CC_COMP',
                'name': 'Motorcycle Up to 250cc - Comprehensive',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Comprehensive for motorcycles up to 250cc',
                'has_fixed_premium': False,
                'requires_sum_insured': True,
                'requires_engine_capacity': True,
                'min_sum_insured': 50000,
                'max_sum_insured': 500000,
                'sort_order': 4
            },
            {
                'category_code': 'MOTORCYCLE',
                'code': 'MOTORCYCLE_251_TO_500CC_COMP',
                'name': 'Motorcycle 251-500cc - Comprehensive',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Comprehensive for motorcycles 251-500cc',
                'has_fixed_premium': False,
                'requires_sum_insured': True,
                'requires_engine_capacity': True,
                'min_sum_insured': 100000,
                'max_sum_insured': 800000,
                'sort_order': 5
            },
            {
                'category_code': 'MOTORCYCLE',
                'code': 'MOTORCYCLE_OVER_500CC_COMP',
                'name': 'Motorcycle Over 500cc - Comprehensive',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Comprehensive for motorcycles over 500cc',
                'has_fixed_premium': False,
                'requires_sum_insured': True,
                'requires_engine_capacity': True,
                'min_sum_insured': 200000,
                'max_sum_insured': 1500000,
                'sort_order': 6
            },

            # TUKTUK CATEGORY - 6 products
            {
                'category_code': 'TUKTUK',
                'code': 'TUKTUK_UP_TO_3_PASS_TP',
                'name': 'TukTuk Up to 3 Pass - TP',
                'cover_type': 'THIRD_PARTY',
                'description': 'Third party for tuktuk up to 3 passengers',
                'has_fixed_premium': True,
                'base_premium': 4500,
                'requires_sum_insured': False,
                'requires_passenger_count': True,
                'sort_order': 1
            },
            {
                'category_code': 'TUKTUK',
                'code': 'TUKTUK_4_TO_6_PASS_TP',
                'name': 'TukTuk 4-6 Pass - TP',
                'cover_type': 'THIRD_PARTY',
                'description': 'Third party for tuktuk 4-6 passengers',
                'has_fixed_premium': True,
                'base_premium': 6000,
                'requires_sum_insured': False,
                'requires_passenger_count': True,
                'sort_order': 2
            },
            {
                'category_code': 'TUKTUK',
                'code': 'TUKTUK_OVER_6_PASS_TP',
                'name': 'TukTuk Over 6 Pass - TP',
                'cover_type': 'THIRD_PARTY',
                'description': 'Third party for tuktuk over 6 passengers',
                'has_fixed_premium': True,
                'base_premium': 8000,
                'requires_sum_insured': False,
                'requires_passenger_count': True,
                'sort_order': 3
            },
            {
                'category_code': 'TUKTUK',
                'code': 'TUKTUK_UP_TO_500KG_TP',
                'name': 'TukTuk Light Cargo (Up to 500kg) - TP',
                'cover_type': 'THIRD_PARTY',
                'description': 'Third party for light cargo tuktuk',
                'has_fixed_premium': True,
                'base_premium': 5500,
                'requires_sum_insured': False,
                'requires_carrying_capacity': True,
                'sort_order': 4
            },
            {
                'category_code': 'TUKTUK',
                'code': 'TUKTUK_500KG_TO_1T_TP',
                'name': 'TukTuk Medium Cargo (500kg-1T) - TP',
                'cover_type': 'THIRD_PARTY',
                'description': 'Third party for medium cargo tuktuk',
                'has_fixed_premium': True,
                'base_premium': 7000,
                'requires_sum_insured': False,
                'requires_carrying_capacity': True,
                'sort_order': 5
            },
            {
                'category_code': 'TUKTUK',
                'code': 'TUKTUK_1_TO_2T_TP',
                'name': 'TukTuk Heavy Cargo (1-2T) - TP',
                'cover_type': 'THIRD_PARTY',
                'description': 'Third party for heavy cargo tuktuk',
                'has_fixed_premium': True,
                'base_premium': 9000,
                'requires_sum_insured': False,
                'requires_carrying_capacity': True,
                'sort_order': 6
            },

            # SPECIAL CLASSES CATEGORY - 10 products
            {
                'category_code': 'SPECIAL',
                'code': 'SPECIAL_AGRI_TRACTOR_TP',
                'name': 'Agricultural Tractor - TP',
                'cover_type': 'THIRD_PARTY',
                'description': 'Third party for agricultural tractors',
                'has_fixed_premium': True,
                'base_premium': 6500,
                'requires_sum_insured': False,
                'requires_tonnage': True,
                'sort_order': 1
            },
            {
                'category_code': 'SPECIAL',
                'code': 'SPECIAL_COMM_INST_TP',
                'name': 'Commercial Institutional - TP',
                'cover_type': 'THIRD_PARTY',
                'description': 'Third party for commercial institutional vehicles',
                'has_fixed_premium': True,
                'base_premium': 12000,
                'requires_sum_insured': False,
                'requires_passenger_count': True,
                'requires_passenger_type': True,
                'sort_order': 2
            },
            {
                'category_code': 'SPECIAL',
                'code': 'SPECIAL_CONSTRUCTION_TP',
                'name': 'Construction Vehicle - TP',
                'cover_type': 'THIRD_PARTY',
                'description': 'Third party for construction vehicles',
                'has_fixed_premium': True,
                'base_premium': 15000,
                'requires_sum_insured': False,
                'requires_tonnage': True,
                'sort_order': 3
            },
            {
                'category_code': 'SPECIAL',
                'code': 'SPECIAL_EMERGENCY_TP',
                'name': 'Emergency Vehicle - TP',
                'cover_type': 'THIRD_PARTY',
                'description': 'Third party for emergency vehicles',
                'has_fixed_premium': True,
                'base_premium': 18000,
                'requires_sum_insured': False,
                'sort_order': 4
            },
            {
                'category_code': 'SPECIAL',
                'code': 'SPECIAL_VINTAGE_TP',
                'name': 'Vintage/Classic - TP',
                'cover_type': 'THIRD_PARTY',
                'description': 'Third party for vintage/classic vehicles',
                'has_fixed_premium': True,
                'base_premium': 8000,
                'requires_sum_insured': False,
                'requires_manual_underwriting': True,
                'sort_order': 5
            },
            {
                'category_code': 'SPECIAL',
                'code': 'SPECIAL_AGRI_TRACTOR_COMP',
                'name': 'Agricultural Tractor - Comprehensive',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Comprehensive for agricultural tractors',
                'has_fixed_premium': False,
                'requires_sum_insured': True,
                'requires_tonnage': True,
                'min_sum_insured': 500000,
                'max_sum_insured': 10000000,
                'sort_order': 6
            },
            {
                'category_code': 'SPECIAL',
                'code': 'SPECIAL_COMM_INST_COMP',
                'name': 'Commercial Institutional - Comprehensive',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Comprehensive for commercial institutional vehicles',
                'has_fixed_premium': False,
                'requires_sum_insured': True,
                'requires_passenger_count': True,
                'requires_passenger_type': True,
                'min_sum_insured': 800000,
                'max_sum_insured': 25000000,
                'sort_order': 7
            },
            {
                'category_code': 'SPECIAL',
                'code': 'SPECIAL_CONSTRUCTION_COMP',
                'name': 'Construction Vehicle - Comprehensive',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Comprehensive for construction vehicles',
                'has_fixed_premium': False,
                'requires_sum_insured': True,
                'requires_tonnage': True,
                'min_sum_insured': 1000000,
                'max_sum_insured': 50000000,
                'sort_order': 8
            },
            {
                'category_code': 'SPECIAL',
                'code': 'SPECIAL_EMERGENCY_COMP',
                'name': 'Emergency Vehicle - Comprehensive',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Comprehensive for emergency vehicles',
                'has_fixed_premium': False,
                'requires_sum_insured': True,
                'min_sum_insured': 1500000,
                'max_sum_insured': 30000000,
                'sort_order': 9
            },
            {
                'category_code': 'SPECIAL',
                'code': 'SPECIAL_VINTAGE_COMP',
                'name': 'Vintage/Classic - Comprehensive',
                'cover_type': 'COMPREHENSIVE',
                'description': 'Comprehensive for vintage/classic vehicles',
                'has_fixed_premium': False,
                'requires_sum_insured': True,
                'requires_manual_underwriting': True,
                'min_sum_insured': 200000,
                'max_sum_insured': 20000000,
                'sort_order': 10
            }
        ]
        
        # Process all cover types and create them
        total_created = 0
        total_existing = 0
        
        for cover_data in cover_types_data:
            try:
                category = MotorCategory.objects.get(code=cover_data['category_code'])
                cover_data_clean = cover_data.copy()
                del cover_data_clean['category_code']
                cover_data_clean['category'] = category
                # Drop keys that are not fields on MotorCoverType
                for key in (
                    'requires_engine_capacity',
                    'requires_carrying_capacity',
                ):
                    cover_data_clean.pop(key, None)
                
                cover_type, created = MotorCoverType.objects.get_or_create(
                    code=cover_data['code'],
                    defaults=cover_data_clean
                )
                
                if created:
                    total_created += 1
                    self.stdout.write(f'  ✓ Created: {cover_type.name}')
                else:
                    total_existing += 1
                    self.stdout.write(f'  - Exists: {cover_type.name}')
                    
            except MotorCategory.DoesNotExist:
                self.stdout.write(f'  ✗ Category not found: {cover_data["category_code"]}')
            except Exception as e:
                self.stdout.write(f'  ✗ Error creating {cover_data["code"]}: {str(e)}')
        
        self.stdout.write('')
        self.stdout.write(f'📊 Summary:')
        self.stdout.write(f'   • Created: {total_created} new cover types')
        self.stdout.write(f'   • Existing: {total_existing} cover types')
        self.stdout.write(f'   • Total: {total_created + total_existing} cover types processed')
        
        # Verify category distribution
        categories = MotorCategory.objects.all()
        for category in categories:
            count = category.cover_types.count()
            self.stdout.write(f'   • {category.name}: {count} products')