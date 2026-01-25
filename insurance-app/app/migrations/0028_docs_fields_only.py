from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        # Make this additive migration apply after 0026 to avoid unrelated 0027 conflicts
        ('app', '0026_remove_cover_type_field_final'),
    ]

    operations = [
        migrations.AddField(
            model_name='documentupload',
            name='agent_id',
            field=models.CharField(max_length=100, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='documentupload',
            name='document_id',
            field=models.CharField(max_length=100, unique=True, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='documentupload',
            name='environment',
            field=models.CharField(max_length=20, default='development', choices=[('development', 'Development'), ('staging', 'Staging'), ('production', 'Production')]),
        ),
        migrations.AddField(
            model_name='documentupload',
            name='file_size',
            field=models.BigIntegerField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='documentupload',
            name='metadata',
            field=models.JSONField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='documentupload',
            name='mime_type',
            field=models.CharField(max_length=100, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='documentupload',
            name='policy_id',
            field=models.CharField(max_length=100, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='documentupload',
            name='upload_method',
            field=models.CharField(max_length=20, default='Django', choices=[('Django', 'Django Backend'), ('S3', 'AWS S3')]),
        ),
    ]
