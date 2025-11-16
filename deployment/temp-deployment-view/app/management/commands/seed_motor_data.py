from django.core.management.base import BaseCommand
from app.models import MotorCategory, MotorSubcategory, InsuranceProvider, MotorPricing


class Command(BaseCommand):
    help = 'Seeds motor categories, subcategories, providers and pricing'

    def handle(self, *args, **options):
        # Seed Categories
        categories_data = [
            {
                'code': 'PRIVATE',
                'name': 'Private',
                'description': 'Personal vehicles for private use',
                'icon': '🚗',
                'pricing_type': 'dynamic',
                'sort_order': 1,
            },
            {
                'code': 'COMMERCIAL',
                'name': 'Commercial',
                'description': 'Commercial vehicles for business use',
                'icon': '🚚',
                'pricing_type': 'dynamic',
                'sort_order': 2,
            },
            {
                'code': 'PSV',
                'name': 'PSV',
                'description': 'Public Service Vehicles',
                'icon': '🚌',
                'pricing_type': 'dynamic',
                'sort_order': 3,
            },
            {
                'code': 'MOTORCYCLE',
                'name': 'Motorcycle',
                'description': 'Motorcycles and bikes',
                'icon': '🏍️',
                'pricing_type': 'dynamic',
                'sort_order': 4,
            },
            {
                'code': 'TUKTUK',
                'name': 'TukTuk',
                'description': 'Three-wheeled vehicles',
                'icon': '🛺',
                'pricing_type': 'dynamic',
                'sort_order': 5,
            },
            {
                'code': 'SPECIAL',
                'name': 'Special Classes',
                'description': 'Agricultural, institutional and other special vehicles',
                'icon': '🚜',
                'pricing_type': 'dynamic',
                'sort_order': 6,
            },
        ]

        created_count = 0
        for cat_data in categories_data:
            cat, created = MotorCategory.objects.update_or_create(
                code=cat_data['code'],
                defaults=cat_data
            )
            if created:
                created_count += 1
                self.stdout.write(f'  ✓ Created category: {cat.name}')
            else:
                self.stdout.write(f'  • Updated category: {cat.name}')

        self.stdout.write(self.style.SUCCESS(f'\nCategories: {created_count} created, {len(categories_data) - created_count} updated'))

        # Get counts from local database to verify
        total_categories = MotorCategory.objects.count()
        total_subcategories = MotorSubcategory.objects.count()
        total_providers = InsuranceProvider.objects.count()
        total_pricing = MotorPricing.objects.count()

        self.stdout.write(f'\n📊 Database Summary:')
        self.stdout.write(f'  • MotorCategory: {total_categories}')
        self.stdout.write(f'  • MotorSubcategory: {total_subcategories}')
        self.stdout.write(f'  • InsuranceProvider: {total_providers}')
        self.stdout.write(f'  • MotorPricing: {total_pricing}')

        self.stdout.write(self.style.SUCCESS('\n✅ Seed completed successfully'))
