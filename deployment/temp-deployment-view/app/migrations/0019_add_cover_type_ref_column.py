from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0018_insuranceprovider_code_unique_ci"),
    ]

    operations = [
        migrations.RunSQL(
            sql=r'''
DO $$
BEGIN
    -- Add column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'app_motorsubcategory' AND column_name = 'cover_type_ref_id'
    ) THEN
        ALTER TABLE public.app_motorsubcategory ADD COLUMN cover_type_ref_id uuid NULL;
    END IF;

    -- Add foreign key constraint if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.table_schema = 'public' AND tc.table_name = 'app_motorsubcategory' AND tc.constraint_type = 'FOREIGN KEY'
          AND tc.constraint_name = 'app_motorsubcategory_cover_type_ref_id_fk'
    ) THEN
        ALTER TABLE public.app_motorsubcategory
          ADD CONSTRAINT app_motorsubcategory_cover_type_ref_id_fk
          FOREIGN KEY (cover_type_ref_id)
          REFERENCES public.app_motorcovertype (id)
          ON DELETE SET NULL;
    END IF;

    -- Add index if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'idx_motorsubcategory_cover_type_ref_id'
          AND n.nspname = 'public'
    ) THEN
        CREATE INDEX idx_motorsubcategory_cover_type_ref_id ON public.app_motorsubcategory (cover_type_ref_id);
    END IF;
END $$;
            ''',
            reverse_sql=r'''
DO $$
BEGIN
    -- Drop index if exists
    IF EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'idx_motorsubcategory_cover_type_ref_id'
          AND n.nspname = 'public'
    ) THEN
        DROP INDEX public.idx_motorsubcategory_cover_type_ref_id;
    END IF;

    -- Drop foreign key if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.table_schema = 'public' AND tc.table_name = 'app_motorsubcategory' AND tc.constraint_type = 'FOREIGN KEY'
          AND tc.constraint_name = 'app_motorsubcategory_cover_type_ref_id_fk'
    ) THEN
        ALTER TABLE public.app_motorsubcategory
          DROP CONSTRAINT app_motorsubcategory_cover_type_ref_id_fk;
    END IF;

    -- Drop column if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'app_motorsubcategory' AND column_name = 'cover_type_ref_id'
    ) THEN
        ALTER TABLE public.app_motorsubcategory DROP COLUMN cover_type_ref_id;
    END IF;
END $$;
            ''',
        ),
    ]
