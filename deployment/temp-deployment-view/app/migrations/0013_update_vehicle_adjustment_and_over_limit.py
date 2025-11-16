from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0012_add_is_complex_to_motorsubcategory'),
    ]

    operations = [
        # ==== CommercialTonnagePricing field rename for boolean flag ====
        migrations.RenameField(
            model_name='commercialtonnagepricing',
            old_name='is_fleet_pricing',
            new_name='is_over_limit',
        ),

        # ==== VehicleAdjustmentFactor: introduce new fields as nullable first ====
        migrations.AddField(
            model_name='vehicleadjustmentfactor',
            name='factor_type',
            field=models.CharField(max_length=50, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='vehicleadjustmentfactor',
            name='factor_key',
            field=models.CharField(max_length=50, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='vehicleadjustmentfactor',
            name='factor_value',
            field=models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='vehicleadjustmentfactor',
            name='description',
            field=models.CharField(max_length=200),
        ),

        # Populate new fields from legacy columns before enforcing constraints
        migrations.RunPython(
            code=lambda apps, schema_editor: _populate_vehicle_adjustment_fields(apps, schema_editor),
            reverse_code=lambda apps, schema_editor: None,
        ),

        # Now make new fields non-nullable with sane defaults for any missed rows
        migrations.AlterField(
            model_name='vehicleadjustmentfactor',
            name='factor_type',
            field=models.CharField(max_length=50),
        ),
        migrations.AlterField(
            model_name='vehicleadjustmentfactor',
            name='factor_key',
            field=models.CharField(max_length=50),
        ),
        migrations.AlterField(
            model_name='vehicleadjustmentfactor',
            name='factor_value',
            field=models.DecimalField(max_digits=5, decimal_places=4),
        ),

        # Enforce uniqueness on the new natural key
        migrations.AlterUniqueTogether(
            name='vehicleadjustmentfactor',
            unique_together={('factor_type', 'factor_key')},
        ),

        # Finally, drop legacy fields
        migrations.RemoveField(
            model_name='vehicleadjustmentfactor',
            name='factor_code',
        ),
        migrations.RemoveField(
            model_name='vehicleadjustmentfactor',
            name='factor_data',
        ),
    ]

def _populate_vehicle_adjustment_fields(apps, schema_editor):
    VAF = apps.get_model('app', 'VehicleAdjustmentFactor')
    # Introspect existing rows and fill new fields based on legacy columns
    # factor_code was unique; use it as factor_key to avoid duplicates
    # factor_data may contain a 'value' we can adopt, otherwise default to 1.0000
    using = schema_editor.connection.alias
    for row in VAF.objects.using(using).all():
        # Access legacy attrs if present; migrations state still has them at this point
        factor_code = getattr(row, 'factor_code', None)
        factor_data = getattr(row, 'factor_data', {}) or {}
        # Assign
        row.factor_type = 'legacy'
        row.factor_key = str(factor_code) if factor_code is not None else f"LEGACY-{row.pk}"
        try:
            val = factor_data.get('value', None)
            row.factor_value = Decimal(str(val)) if val is not None else Decimal('1.0000')
        except Exception:
            row.factor_value = Decimal('1.0000')
        row.save(update_fields=['factor_type', 'factor_key', 'factor_value'])
