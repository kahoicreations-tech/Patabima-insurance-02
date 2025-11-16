from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0020_fix_field_validations_default"),
    ]

    operations = [
        migrations.RunSQL(
            sql=r'''
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='app_motorsubcategory' AND column_name='is_extendible'
    ) THEN
        UPDATE public.app_motorsubcategory SET is_extendible = FALSE WHERE is_extendible IS NULL;
        ALTER TABLE public.app_motorsubcategory ALTER COLUMN is_extendible SET DEFAULT FALSE;
    END IF;
END $$;
            ''',
            reverse_sql=r'''
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='app_motorsubcategory' AND column_name='is_extendible'
    ) THEN
        ALTER TABLE public.app_motorsubcategory ALTER COLUMN is_extendible DROP DEFAULT;
    END IF;
END $$;
            ''',
        ),
    ]
