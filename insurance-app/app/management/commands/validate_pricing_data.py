from django.core.management.base import BaseCommand
from app.models import MotorCategory, MotorSubcategory, Underwriter, CommercialTonnagePricing, PSVPLLPricing, MotorPricing

class Command(BaseCommand):
    help = 'Validate core motor pricing presence'

    def handle(self, *args, **options):
        cats = MotorCategory.objects.count()
        subs = MotorSubcategory.objects.count()
    unds = Underwriter.objects.count()
        self.stdout.write(f'Categories: {cats}, Subcategories: {subs}, Underwriters: {unds}')

        # Only require MotorPricing for products that use it (fixed, third_party, comprehensive)
        missing = (
            MotorSubcategory.objects
            .exclude(product_type__in=['tonnage', 'psv'])
            .filter(pricing__isnull=True)
            .values_list('subcategory_code', flat=True)
        )
        if missing:
            self.stdout.write('Subcategories without MotorPricing:')
            for s in missing:
                self.stdout.write(f' - {s}')

        self.stdout.write('Commercial tonnage pricing present.' if CommercialTonnagePricing.objects.exists() else 'Missing commercial tonnage pricing.')
    self.stdout.write('PSV PLL pricing present.' if PSVPLLPricing.objects.exists() else 'Missing PSV PLL pricing.')
        self.stdout.write(self.style.SUCCESS('Validation completed.'))
