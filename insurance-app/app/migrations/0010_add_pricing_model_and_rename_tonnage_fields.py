from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0009_campaign_campaignschedule_campaigninteraction'),
    ]

    operations = [
        # Add missing pricing_model to MotorSubcategory with a safe default, then drop default
        migrations.AddField(
            model_name='motorsubcategory',
            name='pricing_model',
            field=models.CharField(max_length=20, choices=[('FIXED', 'Fixed Amount'), ('BRACKET', 'Bracket Based'), ('TONNAGE', 'Tonnage Based'), ('PASSENGER', 'Passenger Based'), ('ENGINE_CC', 'Engine CC Based')], default='FIXED'),
            preserve_default=False,
        ),

        # Rename existing columns to align with current model fields on CommercialTonnagePricing
        migrations.RenameField(
            model_name='commercialtonnagepricing',
            old_name='tonnage_min',
            new_name='tonnage_from',
        ),
        migrations.RenameField(
            model_name='commercialtonnagepricing',
            old_name='tonnage_max',
            new_name='tonnage_to',
        ),

        # Adjust field types/precision to match models.py
        migrations.AlterField(
            model_name='commercialtonnagepricing',
            name='tonnage_from',
            field=models.DecimalField(max_digits=5, decimal_places=1),
        ),
        migrations.AlterField(
            model_name='commercialtonnagepricing',
            name='tonnage_to',
            field=models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True),
        ),
    ]
