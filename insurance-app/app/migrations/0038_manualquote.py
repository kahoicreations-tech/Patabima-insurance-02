# Generated manually for ManualQuote model

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ('app', '0037_remove_multiline_insurance'),
    ]

    operations = [
        migrations.CreateModel(
            name='ManualQuote',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('date_created', models.DateTimeField(auto_now_add=True, blank=True, null=True)),
                ('date_updated', models.DateTimeField(auto_now=True, blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('reference', models.CharField(db_index=True, max_length=40, unique=True)),
                ('line_key', models.CharField(db_index=True, max_length=40)),
                ('payload', models.JSONField()),
                ('preferred_underwriters', models.JSONField(blank=True, default=list)),
                ('status', models.CharField(choices=[('PENDING_ADMIN_REVIEW', 'Pending Admin Review'), ('IN_PROGRESS', 'In Progress'), ('COMPLETED', 'Completed'), ('REJECTED', 'Rejected')], db_index=True, default='PENDING_ADMIN_REVIEW', max_length=30)),
                ('computed_premium', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ('levies_breakdown', models.JSONField(blank=True, null=True)),
                ('admin_notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('agent', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='manual_quotes', to='app.user')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]