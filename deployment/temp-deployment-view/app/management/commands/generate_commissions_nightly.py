from django.core.management.base import BaseCommand

from ...models import MotorPolicy
from ...services.commissioning import generate_commissions_for_policies


class Command(BaseCommand):
    help = 'Generate commissions for ACTIVE Motor policies without existing commissions.'

    def handle(self, *args, **options):
        qs = MotorPolicy.objects.filter(status='ACTIVE', commissions__isnull=True)
        result = generate_commissions_for_policies(qs)
        created = result['created']
        skipped = result['skipped']
        errors = result['errors']
        self.stdout.write(self.style.SUCCESS(f"Created: {created}, Skipped: {skipped}, Errors: {errors}"))