# Generated migration for AgentCommission and AgentPerformance models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0041_domesticpackagemanualquoteproxy_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='AgentCommission',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('date_created', models.DateTimeField(auto_now_add=True, null=True)),
                ('date_updated', models.DateTimeField(auto_now=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('premium_amount', models.DecimalField(decimal_places=2, help_text='Total premium from the paid policy', max_digits=12)),
                ('commission_rate', models.DecimalField(decimal_places=2, help_text='Commission percentage (e.g., 15.00 for 15%)', max_digits=5)),
                ('commission_amount', models.DecimalField(decimal_places=2, help_text='Calculated commission amount', max_digits=12)),
                ('payment_status', models.CharField(choices=[('PENDING', 'Pending'), ('APPROVED', 'Approved'), ('PAID', 'Paid'), ('DISPUTED', 'Disputed')], db_index=True, default='PENDING', max_length=20)),
                ('payment_date', models.DateField(blank=True, null=True)),
                ('payment_reference', models.CharField(blank=True, max_length=100)),
                ('notes', models.TextField(blank=True)),
                ('agent', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='commissions', to=settings.AUTH_USER_MODEL)),
                ('policy', models.ForeignKey(blank=True, help_text='Motor policy associated with this commission', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='commissions', to='app.motorpolicy')),
            ],
            options={
                'verbose_name': 'Agent Commission',
                'verbose_name_plural': 'Agent Commissions',
                'ordering': ['-date_created'],
                'indexes': [
                    models.Index(fields=['agent', '-date_created'], name='app_agentco_agent_i_idx'),
                    models.Index(fields=['payment_status', '-date_created'], name='app_agentco_payment_idx'),
                ],
            },
        ),
        migrations.CreateModel(
            name='AgentPerformance',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('date_created', models.DateTimeField(auto_now_add=True, null=True)),
                ('date_updated', models.DateTimeField(auto_now=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('period', models.CharField(db_index=True, help_text="e.g., '2025-Q1', '2025-01', '2025'", max_length=20)),
                ('period_start', models.DateField()),
                ('period_end', models.DateField()),
                ('target_policies', models.IntegerField(default=0, help_text='Target number of paid policies')),
                ('target_premium', models.DecimalField(decimal_places=2, help_text='Target total premium (paid policies)', max_digits=12)),
                ('achieved_policies', models.IntegerField(default=0)),
                ('achieved_premium', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('achievement_percentage', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('agent', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='performance_records', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Agent Performance',
                'verbose_name_plural': 'Agent Performance Records',
                'ordering': ['-period_start'],
                'unique_together': {('agent', 'period')},
                'indexes': [
                    models.Index(fields=['agent', '-period_start'], name='app_agentpe_agent_i_idx'),
                    models.Index(fields=['period'], name='app_agentpe_period_idx'),
                ],
            },
        ),
    ]
