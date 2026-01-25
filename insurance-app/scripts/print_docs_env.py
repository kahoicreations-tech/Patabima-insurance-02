import os
from pathlib import Path

# Load .env manually so this script reflects local configuration
def load_dotenv(path: str):
    p = Path(path)
    if not p.exists():
        return
    for line in p.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if '=' not in line:
            continue
        k, v = line.split('=', 1)
        k = k.strip()
        v = v.strip()
        # do not overwrite already-set env
        if k and (k not in os.environ):
            os.environ[k] = v

# Try load from insurance-app/.env or sibling .env
here = Path(__file__).resolve()
dot_env_candidates = [
    here.parent.parent / '.env',  # insurance-app/.env
    here.parent.parent.parent / '.env',  # repo root .env
]
for cand in dot_env_candidates:
    load_dotenv(str(cand))

keys = [
    'DOCS_MOCK_AWS',
    'SQS_QUEUE_URL',
    'AWS_REGION',
    'S3_BUCKET',
    'S3_PREFIX',
    'DJANGO_API_URL',
]
for k in keys:
    default_map = {
        'DOCS_MOCK_AWS': '0',
    }
    v = os.environ.get(k, default_map.get(k))
    if v and k == 'SQS_QUEUE_URL':
        # mask account id
        try:
            parts = v.split('/')
            if len(parts) >= 4:
                parts[3] = '************'
                v = '/'.join(parts)
        except Exception:
            pass
    print(f"{k}={v}")
