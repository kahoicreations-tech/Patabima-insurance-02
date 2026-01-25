from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0011_merge_20250928_1324'),
    ]

    operations = [
        migrations.AddField(
            model_name='motorsubcategory',
            name='is_complex',
            field=models.BooleanField(default=False),
        ),
    ]
