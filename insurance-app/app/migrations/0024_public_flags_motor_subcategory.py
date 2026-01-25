from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0023_seed_other_motor_subcategories'),
    ]

    operations = [
        migrations.AddField(
            model_name='motorsubcategory',
            name='show_in_public',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='motorsubcategory',
            name='public_sort_order',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='motorsubcategory',
            name='public_label',
            field=models.CharField(blank=True, max_length=120, null=True),
        ),
        migrations.AlterField(
            model_name='motorcovertype',
            name='description',
            field=models.TextField(blank=True, null=True),
        ),
    ]
