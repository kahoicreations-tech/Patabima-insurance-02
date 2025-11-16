import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0044_commissionsettings_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='CommissionRule',
            fields=[
                ('id', models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4, serialize=False)),
                ('date_created', models.DateTimeField(auto_now_add=True, null=True, blank=True)),
                ('date_updated', models.DateTimeField(auto_now=True, null=True, blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('name', models.CharField(max_length=100, blank=True)),
                ('rate', models.DecimalField(max_digits=5, decimal_places=2, help_text='Percentage value, e.g. 12.50 for 12.5%')),
                ('priority', models.IntegerField(default=100, help_text='Lower number has higher priority')),
                ('line_key', models.CharField(max_length=50, null=True, blank=True, help_text='For non-motor lines e.g., MEDICAL, TRAVEL')),
                ('effective_start', models.DateField(null=True, blank=True)),
                ('effective_end', models.DateField(null=True, blank=True)),
                ('subcategory', models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, to='app.motorsubcategory', null=True, blank=True)),
                ('underwriter', models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, to='app.insuranceprovider', null=True, blank=True)),
            ],
            options={
                'verbose_name': 'Commission Rule',
                'verbose_name_plural': 'Commission Rules',
                'ordering': ['priority', '-date_created'],
            },
        ),
        migrations.AddIndex(
            model_name='commissionrule',
            index=models.Index(fields=['priority'], name='app_commrule_prio_idx'),
        ),
        migrations.AddIndex(
            model_name='commissionrule',
            index=models.Index(fields=['is_active'], name='app_commrule_active_idx'),
        ),
        migrations.AddIndex(
            model_name='commissionrule',
            index=models.Index(fields=['line_key'], name='app_commrule_linekey_idx'),
        ),
    ]
