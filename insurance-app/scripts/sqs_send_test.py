import os
import json
import uuid
import boto3
from pathlib import Path

# Load .env similar to print_docs_env

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
        if k and (k not in os.environ):
            os.environ[k] = v

here = Path(__file__).resolve()
for cand in [here.parent.parent / '.env', here.parent.parent.parent / '.env']:
    load_dotenv(str(cand))

queue_url = os.environ.get('SQS_QUEUE_URL')
region = os.environ.get('AWS_REGION', 'us-east-1')

if not queue_url:
    raise SystemExit("SQS_QUEUE_URL is not set. Please add it to your .env and reload the server.")

sqs = boto3.client('sqs', region_name=region)

job_id = str(uuid.uuid4())
message = {
    'jobId': job_id,
    'objectKey': 'uploads/dev/test/manual-test.png',
    'docType': 'generic',
    'callbackUrl': 'http://localhost:8000/api/v1/public_app/docs/callback'
}

resp = sqs.send_message(QueueUrl=queue_url, MessageBody=json.dumps(message))
print("Sent messageId:", resp.get('MessageId'))
print("JobId:", job_id)
