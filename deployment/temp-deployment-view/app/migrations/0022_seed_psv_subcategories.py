from django.db import migrations


def seed_psv_subcategories(apps, schema_editor):
    MotorCategory = apps.get_model('app', 'MotorCategory')
    MotorSubcategory = apps.get_model('app', 'MotorSubcategory')

    try:
        psv = MotorCategory.objects.get(code='PSV')
    except MotorCategory.DoesNotExist:
        # Category not present; nothing to seed
        return

    items = [
        # Third Party – PSV (10)
        {
            'code': 'PSV_UBER_TP',
            'name': 'PSV Uber Third-Party',
            'product_type': 'THIRD_PARTY',
        },
        {
            'code': 'PSV_TUKTUK_TP',
            'name': 'PSV Tuk-Tuk Third-Party',
            'product_type': 'THIRD_PARTY',
        },
        {
            'code': 'PSV_TUKTUK_TP_EXT',
            'name': 'PSV Tuk-Tuk Third-Party Extendible',
            'product_type': 'THIRD_PARTY_EXT',
        },
        {
            'code': 'PSV_MATATU_1M_TP',
            'name': '1 Month PSV Matatu Third-Party',
            'product_type': 'THIRD_PARTY',
        },
        {
            'code': 'PSV_MATATU_2WKS_TP',
            'name': '2 Weeks PSV Matatu Third-Party',
            'product_type': 'THIRD_PARTY',
        },
        {
            'code': 'PSV_UBER_TP_EXT',
            'name': 'PSV Uber Third-Party Extendible',
            'product_type': 'THIRD_PARTY_EXT',
        },
        {
            'code': 'PSV_TOUR_VAN_TP',
            'name': 'PSV Tour Van Third-Party',
            'product_type': 'THIRD_PARTY',
        },
        {
            'code': 'PSV_MATATU_1WK_TP_EXT',
            'name': '1 Week PSV Matatu Third-Party Extendible',
            'product_type': 'THIRD_PARTY_EXT',
        },
        {
            'code': 'PSV_PLAIN_TPO',
            'name': 'PSV Plain TPO',
            'product_type': 'THIRD_PARTY',
        },
        {
            'code': 'PSV_TOUR_VAN_TP_EXT',
            'name': 'PSV Tour Van Third-Party Extendible',
            'product_type': 'THIRD_PARTY_EXT',
        },
        # Comprehensive (2)
        {
            'code': 'PSV_UBER_COMP',
            'name': 'PSV Uber Comprehensive',
            'product_type': 'COMPREHENSIVE',
        },
        {
            'code': 'PSV_TOUR_VAN_COMP',
            'name': 'PSV Tour Van Comprehensive',
            'product_type': 'COMPREHENSIVE',
        },
    ]

    # Use passenger-based pricing model for PSV; keep JSON fields simple defaults
    for idx, it in enumerate(items, start=1):
        sub, created = MotorSubcategory.objects.get_or_create(
            category=psv,
            subcategory_code=it['code'],
            defaults={
                'subcategory_name': it['name'],
                'product_type': it['product_type'],
                'pricing_model': 'PASSENGER',
                'is_complex': False,
                'additional_fields': ['passenger_count'],
                'pricing_requirements': {'requires_passenger_count': True},
                'is_active': True,
            }
        )
        if not created:
            # Ensure friendly name and flags are updated for existing rows
            updated = False
            if sub.subcategory_name != it['name']:
                sub.subcategory_name = it['name']
                updated = True
            if sub.product_type != it['product_type']:
                sub.product_type = it['product_type']
                updated = True
            if sub.pricing_model != 'PASSENGER':
                sub.pricing_model = 'PASSENGER'
                updated = True
            if not sub.is_active:
                sub.is_active = True
                updated = True
            if updated:
                sub.save(update_fields=['subcategory_name', 'product_type', 'pricing_model', 'is_active'])


def unseed_psv_subcategories(apps, schema_editor):
    # Non-destructive: do not delete rows on reverse; keep data.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0021_default_is_extendible_false'),
    ]

    operations = [
        migrations.RunPython(seed_psv_subcategories, unseed_psv_subcategories),
    ]
