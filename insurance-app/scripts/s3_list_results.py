import os
from pathlib import Path
import boto3

# Load .env

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
        k = k.strip(); v = v.strip()
        if k and (k not in os.environ):
            os.environ[k] = v

here = Path(__file__).resolve()
for cand in [here.parent.parent / '.env', here.parent.parent.parent / '.env']:
    load_dotenv(str(cand))

bucket = os.environ.get('RESULTS_S3_BUCKET') or os.environ.get('S3_BUCKET')
prefix = os.environ.get('RESULTS_S3_PREFIX') or 'textract-results/'
region = os.environ.get('AWS_REGION', 'us-east-1')

if not bucket:
    raise SystemExit('S3 bucket not configured in .env')

s3 = boto3.client('s3', region_name=region)

try:
    resp = s3.list_objects_v2(Bucket=bucket, Prefix=prefix, MaxKeys=5)
    count = resp.get('KeyCount', 0)
    print(f"Listed {count} objects under s3://{bucket}/{prefix}")
    for obj in (resp.get('Contents') or [])[:5]:
        print('-', obj['Key'])
except Exception as e:
    print('S3 list failed:', e)
