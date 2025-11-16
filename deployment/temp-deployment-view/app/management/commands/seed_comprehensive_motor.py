"""
Comprehensive seed command for motor insurance data
Creates subcategories, providers, and pricing with correct FK references
"""
from django.core.management.base import BaseCommand
from app.models import MotorCategory, MotorSubcategory, InsuranceProvider, MotorPricing


class Command(BaseCommand):
    help = 'Seeds all motor insurance data (categories, subcategories, providers, pricing)'

    def handle(self, *args, **options):
        self.stdout.write('Starting comprehensive motor data seeding...\n')
        
        # Seed Providers first (independent of other models)
        self.seed_providers()
        
        # Seed Subcategories (requires categories)
        self.seed_subcategories()
        
        # Seed Pricing (requires subcategories and providers)
        self.seed_pricing()
        
        # Summary
        self.print_summary()

    def seed_providers(self):
        """Seed insurance providers (8 providers)"""
        self.stdout.write('📋 Seeding Insurance Providers...')
        
        providers_data = [
            {
                'code': 'MADISON',
                'name': 'Madison Insurance',
                'contact_email': 'info@madisoninsurance.co.ke',
                'supported_categories': ['PRIVATE', 'COMMERCIAL', 'PSV', 'MOTORCYCLE', 'TUKTUK', 'SPECIAL'],
                'supported_payment_methods': ['mpesa', 'card'],
                'features': {'dmvic': True}
            },
            {
                'code': 'PTA',
                'name': 'PATABIMA INC',
                'contact_email': 'info@patabima.com',
                'supported_categories': ['PRIVATE', 'COMMERCIAL', 'PSV', 'MOTORCYCLE', 'TUKTUK'],
                'supported_payment_methods': ['mpesa'],
                'features': {'dmvic': True}
            },
            {
                'code': 'JUBILEE',
                'name': 'Jubilee Insurance',
                'contact_email': 'info@jubileekenya.com',
                'supported_categories': ['PRIVATE', 'COMMERCIAL', 'PSV', 'TUKTUK'],
                'supported_payment_methods': ['mpesa'],
                'features': {'dmvic': True}
            },
            {
                'code': 'UAP',
                'name': 'UAP Insurance',
                'contact_email': 'info@uap.co.ke',
                'supported_categories': ['PRIVATE', 'COMMERCIAL', 'PSV'],
                'supported_payment_methods': ['mpesa', 'card'],
                'features': {'dmvic': True}
            },
            {
                'code': 'APA',
                'name': 'APA Insurance',
                'contact_email': 'info@apainsurance.org',
                'supported_categories': ['PRIVATE', 'COMMERCIAL'],
                'supported_payment_methods': ['mpesa'],
                'features': {'dmvic': False}
            },
            {
                'code': 'BRITAM',
                'name': 'Britam Insurance',
                'contact_email': 'info@britam.com',
                'supported_categories': ['PRIVATE', 'PSV'],
                'supported_payment_methods': ['mpesa', 'card'],
                'features': {'dmvic': True}
            },
            {
                'code': 'CIC',
                'name': 'CIC Insurance',
                'contact_email': 'info@cic.co.ke',
                'supported_categories': ['PRIVATE', 'COMMERCIAL'],
                'supported_payment_methods': ['mpesa'],
                'features': {'dmvic': False}
            },
            {
                'code': 'PACIS',
                'name': 'Pacis Insurance',
                'contact_email': 'info@pacisinsurance.com',
                'supported_categories': ['PRIVATE'],
                'supported_payment_methods': ['mpesa'],
                'features': {'dmvic': False}
            },
        ]
        
        created_count = 0
        for prov_data in providers_data:
            prov, created = InsuranceProvider.objects.update_or_create(
                code=prov_data['code'],
                defaults=prov_data
            )
            if created:
                created_count += 1
                self.stdout.write(f'  ✓ Created: {prov.name}')
            else:
                self.stdout.write(f'  • Updated: {prov.name}')
        
        self.stdout.write(self.style.SUCCESS(f'Providers: {created_count} created, {len(providers_data) - created_count} updated\n'))

    def seed_subcategories(self):
        """Seed motor subcategories (63 products)"""
        self.stdout.write('📋 Seeding Motor Subcategories...')
        
        # Get categories
        try:
            private = MotorCategory.objects.get(code='PRIVATE')
            commercial = MotorCategory.objects.get(code='COMMERCIAL')
            psv = MotorCategory.objects.get(code='PSV')
            motorcycle = MotorCategory.objects.get(code='MOTORCYCLE')
            tuktuk = MotorCategory.objects.get(code='TUKTUK')
            special = MotorCategory.objects.get(code='SPECIAL')
        except MotorCategory.DoesNotExist as e:
            self.stdout.write(self.style.ERROR(f'Category not found: {e}'))
            return
        
        subcategories_data = [
            # PRIVATE (8 products)
            {'category': private, 'subcategory_code': 'PRIVATE_TOR', 'subcategory_name': 'Time on Risk', 'product_type': 'TOR', 'pricing_model': 'FIXED'},
            {'category': private, 'subcategory_code': 'PRIVATE_THIRD_PARTY', 'subcategory_name': 'Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': private, 'subcategory_code': 'PRIVATE_TP_EXT', 'subcategory_name': 'Third Party Fire & Theft', 'product_type': 'TP_EXTENSION', 'pricing_model': 'BRACKET'},
            {'category': private, 'subcategory_code': 'PRIVATE_COMPREHENSIVE', 'subcategory_name': 'Comprehensive', 'product_type': 'COMPREHENSIVE', 'pricing_model': 'BRACKET'},
            {'category': private, 'subcategory_code': 'PRIVATE_ACT_ONLY', 'subcategory_name': 'Act Only', 'product_type': 'ACT_ONLY', 'pricing_model': 'FIXED'},
            {'category': private, 'subcategory_code': 'PRIVATE_WINDSCREEN', 'subcategory_name': 'Windscreen Extension', 'product_type': 'EXTENSION', 'pricing_model': 'BRACKET'},
            {'category': private, 'subcategory_code': 'PRIVATE_FIRE_THEFT', 'subcategory_name': 'Fire & Theft Only', 'product_type': 'TP_EXTENSION', 'pricing_model': 'BRACKET'},
            {'category': private, 'subcategory_code': 'PRIVATE_PLL', 'subcategory_name': 'Passenger Legal Liability', 'product_type': 'EXTENSION', 'pricing_model': 'BRACKET'},
            
            # COMMERCIAL (15 products)
            {'category': commercial, 'subcategory_code': 'COMMERCIAL_UP_TO_3_TONS', 'subcategory_name': 'Up to 3 Tons', 'product_type': 'COMPREHENSIVE', 'pricing_model': 'TONNAGE'},
            {'category': commercial, 'subcategory_code': 'COMMERCIAL_3_TO_5_TONS', 'subcategory_name': '3-5 Tons', 'product_type': 'COMPREHENSIVE', 'pricing_model': 'TONNAGE'},
            {'category': commercial, 'subcategory_code': 'COMMERCIAL_5_TO_10_TONS', 'subcategory_name': '5-10 Tons', 'product_type': 'COMPREHENSIVE', 'pricing_model': 'TONNAGE'},
            {'category': commercial, 'subcategory_code': 'COMMERCIAL_10_TO_15_TONS', 'subcategory_name': '10-15 Tons', 'product_type': 'COMPREHENSIVE', 'pricing_model': 'TONNAGE'},
            {'category': commercial, 'subcategory_code': 'COMMERCIAL_15_TO_20_TONS', 'subcategory_name': '15-20 Tons', 'product_type': 'COMPREHENSIVE', 'pricing_model': 'TONNAGE'},
            {'category': commercial, 'subcategory_code': 'COMMERCIAL_20_TO_31_TONS', 'subcategory_name': '20-31 Tons', 'product_type': 'COMPREHENSIVE', 'pricing_model': 'TONNAGE'},
            {'category': commercial, 'subcategory_code': 'COMMERCIAL_OVER_31_TONS', 'subcategory_name': 'Over 31 Tons', 'product_type': 'COMPREHENSIVE', 'pricing_model': 'TONNAGE'},
            {'category': commercial, 'subcategory_code': 'COMMERCIAL_TP_LIGHT', 'subcategory_name': 'Third Party Light (Up to 3T)', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': commercial, 'subcategory_code': 'COMMERCIAL_TP_MEDIUM', 'subcategory_name': 'Third Party Medium (3-10T)', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': commercial, 'subcategory_code': 'COMMERCIAL_TP_HEAVY', 'subcategory_name': 'Third Party Heavy (10-20T)', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': commercial, 'subcategory_code': 'COMMERCIAL_TP_SUPER_HEAVY', 'subcategory_name': 'Third Party Super Heavy (20T+)', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': commercial, 'subcategory_code': 'COMMERCIAL_FLEET', 'subcategory_name': 'Fleet Cover', 'product_type': 'COMPREHENSIVE', 'pricing_model': 'CUSTOM'},
            {'category': commercial, 'subcategory_code': 'COMMERCIAL_FIRE_THEFT', 'subcategory_name': 'Fire & Theft', 'product_type': 'TP_EXTENSION', 'pricing_model': 'BRACKET'},
            {'category': commercial, 'subcategory_code': 'COMMERCIAL_HIRE_PURCHASE', 'subcategory_name': 'Hire Purchase', 'product_type': 'COMPREHENSIVE', 'pricing_model': 'BRACKET'},
            {'category': commercial, 'subcategory_code': 'COMMERCIAL_TRANSIT', 'subcategory_name': 'Goods in Transit', 'product_type': 'EXTENSION', 'pricing_model': 'BRACKET'},
            {'category': commercial, 'subcategory_code': 'COMMERCIAL_TOR', 'subcategory_name': 'Time on Risk', 'product_type': 'TOR', 'pricing_model': 'FIXED'},
            
            # PSV (15 products - capacity-based)
            {'category': psv, 'subcategory_code': 'PSV_UP_TO_13_PASS_TP', 'subcategory_name': 'PSV Up to 13 Passengers Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': psv, 'subcategory_code': 'PSV_14_TO_25_PASS_TP', 'subcategory_name': 'PSV 14-25 Passengers Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': psv, 'subcategory_code': 'PSV_26_TO_33_PASS_TP', 'subcategory_name': 'PSV 26-33 Passengers Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': psv, 'subcategory_code': 'PSV_34_TO_49_PASS_TP', 'subcategory_name': 'PSV 34-49 Passengers Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': psv, 'subcategory_code': 'PSV_OVER_49_PASS_TP', 'subcategory_name': 'PSV Over 49 Passengers Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': psv, 'subcategory_code': 'PSV_MATATU_1M_TP', 'subcategory_name': 'Matatu 1-Month Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': psv, 'subcategory_code': 'PSV_MATATU_6M_TP', 'subcategory_name': 'Matatu 6-Month Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': psv, 'subcategory_code': 'PSV_BUS_1M_TP', 'subcategory_name': 'Bus 1-Month Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': psv, 'subcategory_code': 'PSV_BUS_6M_TP', 'subcategory_name': 'Bus 6-Month Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': psv, 'subcategory_code': 'PSV_SCHOOL_BUS_TP', 'subcategory_name': 'School Bus Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': psv, 'subcategory_code': 'PSV_MATATU_COMP', 'subcategory_name': 'Matatu Comprehensive', 'product_type': 'COMPREHENSIVE', 'pricing_model': 'BRACKET'},
            {'category': psv, 'subcategory_code': 'PSV_BUS_COMP', 'subcategory_name': 'Bus Comprehensive', 'product_type': 'COMPREHENSIVE', 'pricing_model': 'BRACKET'},
            {'category': psv, 'subcategory_code': 'PSV_UBER_TP', 'subcategory_name': 'Uber/Bolt Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': psv, 'subcategory_code': 'PSV_UBER_COMP', 'subcategory_name': 'Uber/Bolt Comprehensive', 'product_type': 'COMPREHENSIVE', 'pricing_model': 'BRACKET'},
            {'category': psv, 'subcategory_code': 'PSV_PLL', 'subcategory_name': 'Passenger Legal Liability', 'product_type': 'EXTENSION', 'pricing_model': 'BRACKET'},
            
            # MOTORCYCLE (6 products - engine capacity)
            {'category': motorcycle, 'subcategory_code': 'MOTORCYCLE_UP_TO_250CC_TP', 'subcategory_name': 'Up to 250cc Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': motorcycle, 'subcategory_code': 'MOTORCYCLE_251_TO_500CC_TP', 'subcategory_name': '251-500cc Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': motorcycle, 'subcategory_code': 'MOTORCYCLE_OVER_500CC_TP', 'subcategory_name': 'Over 500cc Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': motorcycle, 'subcategory_code': 'MOTORCYCLE_UP_TO_250CC_COMP', 'subcategory_name': 'Up to 250cc Comprehensive', 'product_type': 'COMPREHENSIVE', 'pricing_model': 'BRACKET'},
            {'category': motorcycle, 'subcategory_code': 'MOTORCYCLE_251_TO_500CC_COMP', 'subcategory_name': '251-500cc Comprehensive', 'product_type': 'COMPREHENSIVE', 'pricing_model': 'BRACKET'},
            {'category': motorcycle, 'subcategory_code': 'MOTORCYCLE_OVER_500CC_COMP', 'subcategory_name': 'Over 500cc Comprehensive', 'product_type': 'COMPREHENSIVE', 'pricing_model': 'BRACKET'},
            
            # TUKTUK (6 products)
            {'category': tuktuk, 'subcategory_code': 'TUKTUK_UP_TO_3_PASS_TP', 'subcategory_name': 'Up to 3 Passengers Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': tuktuk, 'subcategory_code': 'TUKTUK_4_TO_6_PASS_TP', 'subcategory_name': '4-6 Passengers Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': tuktuk, 'subcategory_code': 'TUKTUK_OVER_6_PASS_TP', 'subcategory_name': 'Over 6 Passengers Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': tuktuk, 'subcategory_code': 'TUKTUK_UP_TO_500KG_TP', 'subcategory_name': 'Cargo Up to 500kg Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': tuktuk, 'subcategory_code': 'TUKTUK_500KG_TO_1T_TP', 'subcategory_name': 'Cargo 500kg-1T Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': tuktuk, 'subcategory_code': 'TUKTUK_1_TO_2T_TP', 'subcategory_name': 'Cargo 1-2T Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            
            # SPECIAL (11 products)
            {'category': special, 'subcategory_code': 'SPECIAL_AGRI_TRACTOR_TP', 'subcategory_name': 'Agricultural Tractor Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': special, 'subcategory_code': 'SPECIAL_COMM_INST_TP', 'subcategory_name': 'Commercial/Institutional Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': special, 'subcategory_code': 'SPECIAL_CONSTRUCTION_TP', 'subcategory_name': 'Construction Equipment Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': special, 'subcategory_code': 'SPECIAL_EMERGENCY_TP', 'subcategory_name': 'Emergency Vehicle Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': special, 'subcategory_code': 'SPECIAL_VINTAGE_TP', 'subcategory_name': 'Vintage/Classic Car Third Party', 'product_type': 'THIRD_PARTY', 'pricing_model': 'FIXED'},
            {'category': special, 'subcategory_code': 'SPECIAL_AGRI_TRACTOR_COMP', 'subcategory_name': 'Agricultural Tractor Comprehensive', 'product_type': 'COMPREHENSIVE', 'pricing_model': 'BRACKET'},
            {'category': special, 'subcategory_code': 'SPECIAL_COMM_INST_COMP', 'subcategory_name': 'Commercial/Institutional Comprehensive', 'product_type': 'COMPREHENSIVE', 'pricing_model': 'BRACKET'},
            {'category': special, 'subcategory_code': 'SPECIAL_CONSTRUCTION_COMP', 'subcategory_name': 'Construction Equipment Comprehensive', 'product_type': 'COMPREHENSIVE', 'pricing_model': 'BRACKET'},
            {'category': special, 'subcategory_code': 'SPECIAL_EMERGENCY_COMP', 'subcategory_name': 'Emergency Vehicle Comprehensive', 'product_type': 'COMPREHENSIVE', 'pricing_model': 'BRACKET'},
            {'category': special, 'subcategory_code': 'SPECIAL_VINTAGE_COMP', 'subcategory_name': 'Vintage/Classic Car Comprehensive', 'product_type': 'COMPREHENSIVE', 'pricing_model': 'BRACKET'},
            {'category': special, 'subcategory_code': 'SPECIAL_DRIVING_SCHOOL_COMP', 'subcategory_name': 'Driving School Comprehensive', 'product_type': 'COMPREHENSIVE', 'pricing_model': 'BRACKET'},
        ]
        
        created_count = 0
        for subcat_data in subcategories_data:
            subcat, created = MotorSubcategory.objects.update_or_create(
                subcategory_code=subcat_data['subcategory_code'],
                defaults=subcat_data
            )
            if created:
                created_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Subcategories: {created_count} created, {len(subcategories_data) - created_count} updated\n'))

    def seed_pricing(self):
        """Seed basic pricing for Third Party products (most common)"""
        self.stdout.write('📋 Seeding Basic Motor Pricing (Third Party products)...')
        
        # Sample pricing for PRIVATE_THIRD_PARTY across providers
        try:
            private_tp = MotorSubcategory.objects.get(subcategory_code='PRIVATE_THIRD_PARTY')
            madison = InsuranceProvider.objects.get(code='MADISON')
            patabima = InsuranceProvider.objects.get(code='PTA')
            jubilee = InsuranceProvider.objects.get(code='JUBILEE')
            uap = InsuranceProvider.objects.get(code='UAP')
            
            pricing_data = [
                {'subcategory': private_tp, 'underwriter': madison, 'base_premium': 2975.00, 'pricing_type': 'fixed'},
                {'subcategory': private_tp, 'underwriter': patabima, 'base_premium': 2975.00, 'pricing_type': 'fixed'},
                {'subcategory': private_tp, 'underwriter': jubilee, 'base_premium': 2975.00, 'pricing_type': 'fixed'},
                {'subcategory': private_tp, 'underwriter': uap, 'base_premium': 3500.00, 'pricing_type': 'fixed'},
            ]
            
            created_count = 0
            for price_data in pricing_data:
                price, created = MotorPricing.objects.update_or_create(
                    subcategory=price_data['subcategory'],
                    underwriter=price_data['underwriter'],
                    defaults=price_data
                )
                if created:
                    created_count += 1
            
            self.stdout.write(self.style.SUCCESS(f'Pricing: {created_count} created, {len(pricing_data) - created_count} updated\n'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding pricing: {e}\n'))

    def print_summary(self):
        """Print database summary"""
        self.stdout.write('\n📊 Final Database Summary:')
        self.stdout.write(f'  • MotorCategory: {MotorCategory.objects.count()}')
        self.stdout.write(f'  • MotorSubcategory: {MotorSubcategory.objects.count()}')
        self.stdout.write(f'  • InsuranceProvider: {InsuranceProvider.objects.count()}')
        self.stdout.write(f'  • MotorPricing: {MotorPricing.objects.count()}')
        self.stdout.write(self.style.SUCCESS('\n✅ Comprehensive seeding completed successfully!'))
