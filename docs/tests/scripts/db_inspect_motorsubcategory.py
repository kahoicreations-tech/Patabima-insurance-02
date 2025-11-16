import os
import json
from dotenv import load_dotenv
import psycopg

# Load env from insurance-app/.env
BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)
ENV_PATH = os.path.join(ROOT, 'insurance-app', '.env')
if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH)

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise RuntimeError('DATABASE_URL not found in environment. Expected in insurance-app/.env')

QUERY_COLS = """
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='app_motorsubcategory'
ORDER BY ordinal_position
"""
QUERY_ROWS = """
SELECT * FROM app_motorsubcategory LIMIT 20
"""

print(f"Connecting to {DATABASE_URL}")

with psycopg.connect(DATABASE_URL) as conn:
    with conn.cursor() as cur:
        cur.execute(QUERY_COLS)
        cols = cur.fetchall()
        print('COLUMNS::'+json.dumps(cols))
        cur.execute(QUERY_ROWS)
        rows = cur.fetchall()
        names=[d.name for d in cur.description]
        print('ROWS::'+json.dumps([dict(zip(names,r)) for r in rows], default=str))
