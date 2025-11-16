from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('app', '0033_productline_productconfiguration_genericquote_and_more'),
    ]

    # Previously dropped legacy tables via raw SQL here, which caused later
    # Django migrations to fail when trying to alter/delete them. We now
    # no-op this migration to keep the graph intact and let 0039+ perform
    # model deletions cleanly.
    operations = []