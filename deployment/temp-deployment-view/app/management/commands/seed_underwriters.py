from django.core.management.base import BaseCommand
from app.models import Underwriter

DEFAULTS = [
    {
    'company_name': 'APA Insurance',
    'company_code': 'APA',
        'supported_categories': ['PRIVATE', 'COMMERCIAL', 'PSV', 'MOTORCYCLE', 'TUKTUK', 'SPECIAL'],
    'is_active': True,
    },
    {
    'company_name': 'Jubilee Insurance',
    'company_code': 'JUB',
        'supported_categories': ['PRIVATE', 'COMMERCIAL'],
    'is_active': True,
    }
]

class Command(BaseCommand):
    help = 'Seed Insurance Providers'

    def handle(self, *args, **options):
        created = 0
        for p in DEFAULTS:
            obj, was_created = Underwriter.objects.update_or_create(
                company_code=p['company_code'], defaults=p
            )
            created += int(was_created)
        self.stdout.write(self.style.SUCCESS(f'Seeded/updated {len(DEFAULTS)} underwriters ({created} created).'))
