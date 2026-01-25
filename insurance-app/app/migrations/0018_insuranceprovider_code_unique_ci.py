from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("app", "0017_cleanup_motorpricing_legacy_columns"),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                "CREATE UNIQUE INDEX IF NOT EXISTS app_insuranceprovider_code_ci_uniq "
                "ON app_insuranceprovider (LOWER(code));"
            ),
            reverse_sql=(
                "DROP INDEX IF EXISTS app_insuranceprovider_code_ci_uniq;"
            ),
        ),
    ]
