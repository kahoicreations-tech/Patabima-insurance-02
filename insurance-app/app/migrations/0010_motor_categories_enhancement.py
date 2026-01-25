from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0009_campaign_campaignschedule_campaigninteraction'),
    ]

    operations = [
        # Create new MotorCoverType model aligned with BaseModel (UUID PK)
        migrations.CreateModel(
            name='MotorCoverType',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('date_created', models.DateTimeField(auto_now_add=True, null=True)),
                ('date_updated', models.DateTimeField(auto_now=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('code', models.CharField(max_length=50, unique=True)),
                ('name', models.CharField(max_length=100)),
                ('cover_type', models.CharField(choices=[('THIRD_PARTY', 'Third Party'), ('THIRD_PARTY_EXT', 'Third Party Extendible'), ('COMPREHENSIVE', 'Comprehensive'), ('TOR', 'Time on Risk')], max_length=20)),
                ('description', models.TextField(blank=True, null=True)),
                ('time_period', models.CharField(blank=True, choices=[('1_WEEK', '1 Week'), ('2_WEEKS', '2 Weeks'), ('1_MONTH', '1 Month'), ('6_MONTHS', '6 Months'), ('12_MONTHS', '12 Months')], max_length=20, null=True)),
                ('has_fixed_premium', models.BooleanField(default=False)),
                ('base_premium', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('requires_sum_insured', models.BooleanField(default=False)),
                ('min_sum_insured', models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True)),
                ('max_sum_insured', models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True)),
                ('requires_tonnage', models.BooleanField(default=False)),
                ('max_tonnage', models.IntegerField(default=31)),
                ('requires_passenger_count', models.BooleanField(default=False)),
                ('requires_passenger_type', models.BooleanField(default=False)),
                ('requires_financial_interest', models.BooleanField(default=True)),
                ('requires_vehicle_identification_method', models.BooleanField(default=True)),
                ('requires_vehicle_make_model', models.BooleanField(default=True)),
                ('requires_year_of_manufacture', models.BooleanField(default=True)),
                ('requires_chassis_number', models.BooleanField(default=True)),
                ('requires_vehicle_valuation', models.BooleanField(default=False)),
                ('requires_windscreen_value', models.BooleanField(default=False)),
                ('requires_radio_value', models.BooleanField(default=False)),
                ('supports_optional_addons', models.BooleanField(default=False)),
                ('requires_kyc_documents', models.BooleanField(default=True)),
                ('allows_financed_vehicles', models.BooleanField(default=True)),
                ('requires_manual_underwriting', models.BooleanField(default=False)),
                ('sort_order', models.IntegerField(default=0)),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='cover_types', to='app.motorcategory')),
            ],
            options={
                'verbose_name': 'Motor Cover Type',
                'verbose_name_plural': 'Motor Cover Types',
                'ordering': ['category', 'sort_order', 'name'],
            },
        ),

        # Rename fields on MotorCategory to align with new model
        migrations.RenameField(
            model_name='motorcategory',
            old_name='category_name',
            new_name='name',
        ),
        migrations.RenameField(
            model_name='motorcategory',
            old_name='category_code',
            new_name='code',
        ),

        # Ensure icon field length (if exists) is limited to 10 and allow blank/null
        migrations.AlterField(
            model_name='motorcategory',
            name='icon',
            field=models.CharField(blank=True, max_length=10, null=True),
        ),

        # New business rule fields on MotorCategory
        migrations.AddField(
            model_name='motorcategory',
            name='sort_order',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='motorcategory',
            name='requires_tonnage',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='motorcategory',
            name='requires_engine_capacity',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='motorcategory',
            name='requires_passenger_count',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='motorcategory',
            name='requires_passenger_type',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='motorcategory',
            name='requires_carrying_capacity',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='motorcategory',
            name='supports_time_period_variants',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='motorcategory',
            name='min_vehicle_age',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='motorcategory',
            name='max_vehicle_age',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]