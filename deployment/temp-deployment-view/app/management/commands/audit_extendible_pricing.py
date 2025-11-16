from django.core.management.base import BaseCommand
from app.models import InsuranceProvider


REQUIRED_EXT_KEYS = [
    'initial_amount',
    'balance_amount',
    'total_annual_premium',
    'initial_period_days',
    'extension_deadline_days',
    'grace_period_days',
]


class Command(BaseCommand):
    help = (
        'Audit InsuranceProvider.features.pricing for EXT products to ensure extendible_config is present ' 
        'and contains required keys. Prints a summary of providers/products missing config.'
    )

    def handle(self, *args, **options):
        total_providers = 0
        total_ext_products = 0
        ok_count = 0
        missing_count = 0

        for provider in InsuranceProvider.objects.all():
            total_providers += 1
            features = provider.features or {}
            pricing = features.get('pricing') or {}
            # Collect candidate EXT products (keys with 'EXT' in code)
            for code, cfg in pricing.items():
                try:
                    code_str = str(code)
                except Exception:
                    continue
                if 'EXT' not in code_str.upper():
                    continue
                total_ext_products += 1
                ext_cfg = {}
                if isinstance(cfg, dict):
                    ext_cfg = cfg.get('extendible_config') or cfg.get('extendibleConfig') or {}

                missing_keys = [k for k in REQUIRED_EXT_KEYS if k not in ext_cfg]
                if missing_keys:
                    missing_count += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f"[MISSING] Provider={provider.code} Product={code_str} missing: {', '.join(missing_keys)}"
                        )
                    )
                else:
                    ok_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"[OK] Provider={provider.code} Product={code_str} extendible_config present"
                        )
                    )

        self.stdout.write('\nSummary:')
        self.stdout.write(f"  Providers scanned: {total_providers}")
        self.stdout.write(f"  EXT products found: {total_ext_products}")
        self.stdout.write(self.style.SUCCESS(f"  OK: {ok_count}"))
        self.stdout.write(self.style.WARNING(f"  Missing: {missing_count}"))

        if missing_count > 0:
            self.stdout.write(self.style.WARNING('\nAction: Update features.pricing in admin for the above products to include extendible_config.'))
        else:
            self.stdout.write(self.style.SUCCESS('\nAll EXT products have extendible_config configured.'))
