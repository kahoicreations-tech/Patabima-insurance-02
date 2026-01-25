from django.db import migrations

ALLOWED = {
    'PRIVATE': [
        'PRIVATE_TOR',
        'PRIVATE_THIRD_PARTY',
        'PRIVATE_THIRD_PARTY_EXT',
        'PRIVATE_MOTORCYCLE_TP',
        'PRIVATE_COMPREHENSIVE',
    ],
    'COMMERCIAL': [
        'COMMERCIAL_TOR',
        'COMMERCIAL_OWN_GOODS_TP',
        'COMMERCIAL_OWN_GOODS_TP_EXT',
        'COMMERCIAL_GENERAL_CARTAGE_TP',
        'COMMERCIAL_GENERAL_CARTAGE_TP_EXT',
        'COMMERCIAL_GENERAL_CARTAGE_TP_PM',
        'COMMERCIAL_GENERAL_CARTAGE_TP_EXT_PM',
        'COMMERCIAL_GENERAL_CARTAGE_COMP',
        'COMMERCIAL_OWN_GOODS_COMP',
    ],
    'PSV': [
        'PSV_UBER_TP',
        'PSV_TUKTUK_TP',
        'PSV_TUKTUK_TP_EXT',
        'PSV_MATATU_1M_TP',
        'PSV_MATATU_2WKS_TP',
        'PSV_UBER_TP_EXT',
        'PSV_TOUR_VAN_TP',
        'PSV_MATATU_1WK_TP_EXT',
        'PSV_PLAIN_TPO',
        'PSV_TOUR_VAN_TP_EXT',
        'PSV_UBER_COMP',
        'PSV_TOUR_VAN_COMP',
    ],
    'MOTORCYCLE': [
        'MOTORCYCLE_PRIVATE_TP',
        'MOTORCYCLE_PSV_TP',
        'MOTORCYCLE_PSV_TP_6M',
        'MOTORCYCLE_PRIVATE_COMP',
        'MOTORCYCLE_PSV_COMP',
        'MOTORCYCLE_PSV_COMP_6M',
    ],
    'TUKTUK': [
        'TUKTUK_PSV_TP',
        'TUKTUK_PSV_TP_EXT',
        'TUKTUK_COMMERCIAL_TP',
        'TUKTUK_COMMERCIAL_TP_EXT',
        'TUKTUK_COMMERCIAL_COMP',
        'TUKTUK_PSV_COMP',
    ],
    'SPECIAL': [
        'SPECIAL_AGRICULTURAL_TP',
        'SPECIAL_INSTITUTIONAL_TP',
        'SPECIAL_INSTITUTIONAL_TP_EXT',
        'SPECIAL_KG_PLATE_TP',
        'SPECIAL_DRIVING_SCHOOL_TP',
        'SPECIAL_AGRICULTURAL_COMP',
        'SPECIAL_INSTITUTIONAL_COMP',
        'SPECIAL_DRIVING_SCHOOL_COMP',
        'SPECIAL_FUEL_TANKER_COMP',
        'SPECIAL_AMBULANCE_COMP',
    ],
}

# Third Party group gets priority 1-4; Comprehensive 5+
PRIORITY = {
    'THIRD_PARTY': 1,
    'THIRD_PARTY_EXT': 2,
    'PLAIN_TPO': 3,
    'ACT_ONLY': 3,
    'TOR': 4,
    'COMPREHENSIVE': 5,
}


def forwards(apps, schema_editor):
    MotorCategory = apps.get_model('app', 'MotorCategory')
    MotorSubcategory = apps.get_model('app', 'MotorSubcategory')
    MotorCoverType = apps.get_model('app', 'MotorCoverType')

    for cat_code, codes in ALLOWED.items():
        try:
            cat = MotorCategory.objects.get(code=cat_code)
        except MotorCategory.DoesNotExist:
            continue
        for idx, code in enumerate(codes, start=1):
            try:
                sub = MotorSubcategory.objects.get(category=cat, subcategory_code=code)
            except MotorSubcategory.DoesNotExist:
                continue
            cover = MotorCoverType.objects.filter(code=code).first()
            label = (cover.name if cover and cover.name else sub.subcategory_name)
            # Calculate a stable sort order: priority bucket * 100 + local index
            cover_type = (cover.cover_type if cover else sub.product_type) or ''
            pri = PRIORITY.get(str(cover_type).upper(), 99)
            sort_value = pri * 100 + idx
            sub.show_in_public = True
            sub.public_sort_order = sort_value
            sub.public_label = label
            sub.save(update_fields=['show_in_public','public_sort_order','public_label'])


def backwards(apps, schema_editor):
    MotorSubcategory = apps.get_model('app', 'MotorSubcategory')
    MotorSubcategory.objects.update(show_in_public=False, public_sort_order=0)


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0024_public_flags_motor_subcategory'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards)
    ]
