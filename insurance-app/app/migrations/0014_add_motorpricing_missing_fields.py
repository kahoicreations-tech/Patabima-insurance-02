from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0013_update_vehicle_adjustment_and_over_limit'),
    ]

    operations = [
        migrations.AddField(
            model_name='motorpricing',
            name='maximum_premium',
            field=models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='motorpricing',
            name='bracket_pricing',
            field=models.JSONField(null=True, blank=True),
        ),
    ]
