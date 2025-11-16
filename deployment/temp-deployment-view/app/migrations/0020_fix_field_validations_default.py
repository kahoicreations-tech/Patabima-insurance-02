from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0019_add_cover_type_ref_column"),
    ]

    operations = [
        migrations.RunSQL(
            sql=r'''
DO $$
BEGIN
    -- Ensure field_validations column has a default '{}'::jsonb so inserts without this column succeed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='app_motorsubcategory' AND column_name='field_validations'
    ) THEN
        -- Backfill any NULLs to '{}'
        UPDATE public.app_motorsubcategory SET field_validations = '{}'::jsonb WHERE field_validations IS NULL;
        -- Set default to '{}'
        ALTER TABLE public.app_motorsubcategory ALTER COLUMN field_validations SET DEFAULT '{}'::jsonb;
    END IF;
END $$;
            ''',
            reverse_sql=r'''
DO $$
BEGIN
    -- Remove default if desired (keep data intact)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='app_motorsubcategory' AND column_name='field_validations'
    ) THEN
        ALTER TABLE public.app_motorsubcategory ALTER COLUMN field_validations DROP DEFAULT;
    END IF;
END $$;
            ''',
        ),
    ]
