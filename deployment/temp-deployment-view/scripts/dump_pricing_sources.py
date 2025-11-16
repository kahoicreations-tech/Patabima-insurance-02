import os
import sys
import django

# Ensure project root is on sys.path (so 'insurance.settings' can be imported)
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)  # .../insurance-app
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import InsuranceProvider, MotorCoverType, MotorPricing, CommercialTonnagePricing

print('Underwriters (active):')
for u in InsuranceProvider.objects.filter(is_active=True):
    feat = u.features or {}
    supp = u.supported_categories or []
    pricing_keys = list((feat.get('pricing') or {}).keys())
    name = getattr(u, 'name', None) or getattr(u, 'company_name', None) or u.code
    print(f"- {u.code} {name} supported={supp} pricing_keys={pricing_keys[:8]}{' +' + str(len(pricing_keys)-8) + ' more' if len(pricing_keys) > 8 else ''}")

print('\nCounts:')
print('  MotorPricing rows             :', MotorPricing.objects.count())
print('  CommercialTonnagePricing rows :', CommercialTonnagePricing.objects.count())

print('\nSample cover types (codes):', list(MotorCoverType.objects.values_list('code', flat=True)[:10]))
