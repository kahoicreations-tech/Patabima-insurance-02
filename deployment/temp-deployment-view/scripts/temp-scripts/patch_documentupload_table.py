import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
import django
django.setup()

from django.db import connection


DDL = [
    "ALTER TABLE IF EXISTS app_documentupload ADD COLUMN IF NOT EXISTS document_id varchar(100) UNIQUE NULL",
    "ALTER TABLE IF EXISTS app_documentupload ADD COLUMN IF NOT EXISTS agent_id varchar(100) NULL",
    "ALTER TABLE IF EXISTS app_documentupload ADD COLUMN IF NOT EXISTS policy_id varchar(100) NULL",
    "ALTER TABLE IF EXISTS app_documentupload ADD COLUMN IF NOT EXISTS file_size bigint NULL",
    "ALTER TABLE IF EXISTS app_documentupload ADD COLUMN IF NOT EXISTS mime_type varchar(100) NULL",
    "ALTER TABLE IF EXISTS app_documentupload ADD COLUMN IF NOT EXISTS upload_method varchar(20) NULL",
    "ALTER TABLE IF EXISTS app_documentupload ADD COLUMN IF NOT EXISTS environment varchar(20) NULL",
    "ALTER TABLE IF EXISTS app_documentupload ADD COLUMN IF NOT EXISTS metadata jsonb NULL",
]


def run():
    with connection.cursor() as cur:
        for sql in DDL:
            cur.execute(sql)
    print('Patched app_documentupload table.')


if __name__ == '__main__':
    run()
