from django.db import migrations


def upsert_subcategory(MotorSubcategory, category, code, name, product_type, pricing_model, additional_fields=None, requirements=None):
    if additional_fields is None:
        additional_fields = []
    if requirements is None:
        requirements = {}
    sub, created = MotorSubcategory.objects.get_or_create(
        category=category,
        subcategory_code=code,
        defaults={
            'subcategory_name': name,
            'product_type': product_type,
            'pricing_model': pricing_model,
            'is_complex': False,
            'additional_fields': additional_fields,
            'pricing_requirements': requirements,
            'is_active': True,
        },
    )
    if not created:
        updated = False
        if sub.subcategory_name != name:
            sub.subcategory_name = name
            updated = True
        if sub.product_type != product_type:
            sub.product_type = product_type
            updated = True
        if sub.pricing_model != pricing_model:
            sub.pricing_model = pricing_model
            updated = True
        if not sub.is_active:
            sub.is_active = True
            updated = True
        if updated:
            sub.save(update_fields=['subcategory_name', 'product_type', 'pricing_model', 'is_active'])


def seed_other_subcategories(apps, schema_editor):
    MotorCategory = apps.get_model('app', 'MotorCategory')
    MotorSubcategory = apps.get_model('app', 'MotorSubcategory')

    # COMMERCIAL
    try:
        comm = MotorCategory.objects.get(code='COMMERCIAL')
        tonnage_fields = ['tonnage']
        tonnage_req = {'requires_tonnage': True, 'max_tonnage': 31}
        upsert_subcategory(MotorSubcategory, comm, 'COMMERCIAL_TOR', 'TOR For Commercial', 'TOR', 'TONNAGE', tonnage_fields, tonnage_req)
        upsert_subcategory(MotorSubcategory, comm, 'COMMERCIAL_OWN_GOODS_TP', 'Own Goods Third-Party', 'THIRD_PARTY', 'TONNAGE', tonnage_fields, tonnage_req)
        upsert_subcategory(MotorSubcategory, comm, 'COMMERCIAL_OWN_GOODS_TP_EXT', 'Own Goods Third-Party Extendible', 'THIRD_PARTY_EXT', 'TONNAGE', tonnage_fields, tonnage_req)
        upsert_subcategory(MotorSubcategory, comm, 'COMMERCIAL_GENERAL_CARTAGE_TP', 'General Cartage Third-Party', 'THIRD_PARTY', 'TONNAGE', tonnage_fields, tonnage_req)
        upsert_subcategory(MotorSubcategory, comm, 'COMMERCIAL_GENERAL_CARTAGE_TP_EXT', 'General Cartage Third-Party Extendible', 'THIRD_PARTY_EXT', 'TONNAGE', tonnage_fields, tonnage_req)
        upsert_subcategory(MotorSubcategory, comm, 'COMMERCIAL_GENERAL_CARTAGE_TP_PM', 'General Cartage Third-Party Prime Mover', 'THIRD_PARTY', 'TONNAGE', tonnage_fields, tonnage_req)
        upsert_subcategory(MotorSubcategory, comm, 'COMMERCIAL_GENERAL_CARTAGE_TP_EXT_PM', 'General Cartage Third-Party Extendible Prime Mover', 'THIRD_PARTY_EXT', 'TONNAGE', tonnage_fields, tonnage_req)
        upsert_subcategory(MotorSubcategory, comm, 'COMMERCIAL_GENERAL_CARTAGE_COMP', 'General Cartage Comprehensive', 'COMPREHENSIVE', 'TONNAGE', tonnage_fields, tonnage_req)
        upsert_subcategory(MotorSubcategory, comm, 'COMMERCIAL_OWN_GOODS_COMP', 'Own Goods Comprehensive', 'COMPREHENSIVE', 'TONNAGE', tonnage_fields, tonnage_req)
    except MotorCategory.DoesNotExist:
        pass

    # MOTORCYCLE
    try:
        mc = MotorCategory.objects.get(code='MOTORCYCLE')
        engine_fields = ['engine_capacity']
        engine_req = {'requires_engine_capacity': True}
        upsert_subcategory(MotorSubcategory, mc, 'MOTORCYCLE_PRIVATE_TP', 'Private motorcycle third party', 'THIRD_PARTY', 'ENGINE_CC', engine_fields, engine_req)
        upsert_subcategory(MotorSubcategory, mc, 'MOTORCYCLE_PSV_TP', 'PSV motorcycle third party', 'THIRD_PARTY', 'ENGINE_CC', engine_fields, engine_req)
        upsert_subcategory(MotorSubcategory, mc, 'MOTORCYCLE_PSV_TP_6M', 'PSV motorcycle third-party 6 months', 'THIRD_PARTY', 'ENGINE_CC', engine_fields, engine_req)
        upsert_subcategory(MotorSubcategory, mc, 'MOTORCYCLE_PRIVATE_COMP', 'Private Motorcycle comprehensive', 'COMPREHENSIVE', 'ENGINE_CC', engine_fields, engine_req)
        upsert_subcategory(MotorSubcategory, mc, 'MOTORCYCLE_PSV_COMP', 'PSV Motorcycle comprehensive', 'COMPREHENSIVE', 'ENGINE_CC', engine_fields, engine_req)
        upsert_subcategory(MotorSubcategory, mc, 'MOTORCYCLE_PSV_COMP_6M', 'PSV motorcycle comprehensive 6 months', 'COMPREHENSIVE', 'ENGINE_CC', engine_fields, engine_req)
    except MotorCategory.DoesNotExist:
        pass

    # TUKTUK
    try:
        tk = MotorCategory.objects.get(code='TUKTUK')
        # PSV tuk-tuk: passenger-based
        passenger_fields = ['passenger_count']
        passenger_req = {'requires_passenger_count': True}
        upsert_subcategory(MotorSubcategory, tk, 'TUKTUK_PSV_TP', 'PSV Tuk-Tuk Third-Party', 'THIRD_PARTY', 'PASSENGER', passenger_fields, passenger_req)
        upsert_subcategory(MotorSubcategory, tk, 'TUKTUK_PSV_TP_EXT', 'PSV Tuk-Tuk Third-Party Extendible', 'THIRD_PARTY_EXT', 'PASSENGER', passenger_fields, passenger_req)
        # Commercial tuk-tuk: treat as fixed for now
        upsert_subcategory(MotorSubcategory, tk, 'TUKTUK_COMMERCIAL_TP', 'Commercial TukTuk Third-Party', 'THIRD_PARTY', 'FIXED')
        upsert_subcategory(MotorSubcategory, tk, 'TUKTUK_COMMERCIAL_TP_EXT', 'Commercial TukTuk Third-Party Extendible', 'THIRD_PARTY_EXT', 'FIXED')
        upsert_subcategory(MotorSubcategory, tk, 'TUKTUK_COMMERCIAL_COMP', 'Commercial TukTuk Comprehensive', 'COMPREHENSIVE', 'FIXED')
        upsert_subcategory(MotorSubcategory, tk, 'TUKTUK_PSV_COMP', 'PSV Tuk-Tuk Comprehensive', 'COMPREHENSIVE', 'PASSENGER', passenger_fields, passenger_req)
    except MotorCategory.DoesNotExist:
        pass

    # SPECIAL
    try:
        sp = MotorCategory.objects.get(code='SPECIAL')
        tonnage_fields = ['tonnage']
        tonnage_req = {'requires_tonnage': True, 'max_tonnage': 31}
        passenger_fields = ['passenger_count']
        passenger_req = {'requires_passenger_count': True}
        passenger_type_fields = ['passenger_count', 'passenger_type']
        passenger_type_req = {'requires_passenger_count': True, 'requires_passenger_type': True}
        upsert_subcategory(MotorSubcategory, sp, 'SPECIAL_AGRICULTURAL_TP', 'Agricultural Tractor Third-Party', 'THIRD_PARTY', 'TONNAGE', tonnage_fields, tonnage_req)
        upsert_subcategory(MotorSubcategory, sp, 'SPECIAL_INSTITUTIONAL_TP', 'Commercial Institutional Third-Party', 'THIRD_PARTY', 'PASSENGER', passenger_type_fields, passenger_type_req)
        upsert_subcategory(MotorSubcategory, sp, 'SPECIAL_INSTITUTIONAL_TP_EXT', 'Commercial Institutional Third-Party Extendible', 'THIRD_PARTY_EXT', 'PASSENGER', passenger_type_fields, passenger_type_req)
        upsert_subcategory(MotorSubcategory, sp, 'SPECIAL_KG_PLATE_TP', 'KG Plate Third-Party', 'THIRD_PARTY', 'FIXED')
        upsert_subcategory(MotorSubcategory, sp, 'SPECIAL_DRIVING_SCHOOL_TP', 'Driving School Third-Party', 'THIRD_PARTY', 'TONNAGE', tonnage_fields + ['passenger_count'], {'requires_tonnage': True, 'requires_passenger_count': True})
        upsert_subcategory(MotorSubcategory, sp, 'SPECIAL_AGRICULTURAL_COMP', 'Agricultural Tractor Comprehensive', 'COMPREHENSIVE', 'TONNAGE', tonnage_fields, tonnage_req)
        upsert_subcategory(MotorSubcategory, sp, 'SPECIAL_INSTITUTIONAL_COMP', 'Commercial Institutional Comprehensive', 'COMPREHENSIVE', 'PASSENGER', passenger_type_fields, passenger_type_req)
        upsert_subcategory(MotorSubcategory, sp, 'SPECIAL_DRIVING_SCHOOL_COMP', 'Driving School Comprehensive', 'COMPREHENSIVE', 'TONNAGE', tonnage_fields + ['passenger_count'], {'requires_tonnage': True, 'requires_passenger_count': True})
        upsert_subcategory(MotorSubcategory, sp, 'SPECIAL_FUEL_TANKER_COMP', 'Fuel Tankers Comprehensive', 'COMPREHENSIVE', 'TONNAGE', tonnage_fields, tonnage_req)
        upsert_subcategory(MotorSubcategory, sp, 'SPECIAL_AMBULANCE_COMP', 'Commercial Ambulance Comprehensive', 'COMPREHENSIVE', 'FIXED')
    except MotorCategory.DoesNotExist:
        pass


def unseed_other_subcategories(apps, schema_editor):
    # Non-destructive rollback
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0022_seed_psv_subcategories'),
    ]

    operations = [
        migrations.RunPython(seed_other_subcategories, unseed_other_subcategories),
    ]
