"""
AWS Lambda: Textract Processor Skeleton

Reads SQS messages with { jobId, objectKey, docType, callbackUrl } and:
 - Runs Textract (sync for small files)
 - Writes raw JSON to s3://{bucket}/results/{jobId}.json
 - Normalizes to { fields, confidence }
 - Calls callback URL with optional HMAC header X-PB-Signature
"""
import os
import json
import hmac
import hashlib
import boto3
import botocore
import urllib.request

s3 = boto3.client('s3')
textract = boto3.client('textract')


def normalize(resp: dict, doc_type: str) -> dict:
    # Minimal normalization stub – customize per doc_type
    fields = {}
    confidence = None
    try:
        for block in resp.get('Blocks', []):
            if block.get('BlockType') == 'KEY_VALUE_SET' and block.get('EntityTypes') == ['KEY']:
                key_text = _text_for(block, resp)
                val_block_id = _find_value_id(block)
                val_text = _text_by_id(val_block_id, resp) if val_block_id else None
                if key_text:
                    fields[key_text] = val_text or ''
    except Exception:
        pass
    return { 'fields': fields, 'confidence': confidence }


def _find_value_id(key_block: dict):
    for rel in key_block.get('Relationships', []) or []:
        if rel.get('Type') == 'VALUE' and rel.get('Ids'):
            return rel['Ids'][0]
    return None


def _text_for(block: dict, resp: dict) -> str:
    text = []
    for rel in block.get('Relationships', []) or []:
        if rel.get('Type') == 'CHILD':
            for cid in rel.get('Ids', []):
                child = _block_by_id(cid, resp)
                if child and child.get('BlockType') == 'WORD':
                    text.append(child.get('Text', ''))
    return ' '.join(text).strip()


def _text_by_id(block_id: str, resp: dict) -> str:
    b = _block_by_id(block_id, resp)
    return _text_for(b, resp) if b else ''


def _block_by_id(block_id: str, resp: dict):
    for b in resp.get('Blocks', []) or []:
        if b.get('Id') == block_id:
            return b
    return None


def _post_callback(url: str, payload: dict, secret: str | None):
    body = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=body, method='POST')
    req.add_header('Content-Type', 'application/json')
    if secret:
        sig = hmac.new(secret.encode('utf-8'), body, hashlib.sha256).hexdigest()
        req.add_header('X-PB-Signature', sig)
    with urllib.request.urlopen(req, timeout=10) as r:  # nosec - controlled URL
        r.read()


def handler(event, context):
    bucket = os.environ.get('S3_BUCKET')
    features = os.environ.get('TEXTRACT_FEATURES', 'FORMS,TABLES').split(',')
    cb_secret = os.environ.get('CALLBACK_SECRET')

    for record in event.get('Records', []):
        msg = json.loads(record['body'])
        job_id = msg['jobId']
        key = msg['objectKey']
        doc_type = msg.get('docType', 'generic')
        callback_url = msg.get('callbackUrl')

        try:
            resp = textract.analyze_document(
                Document={'S3Object': {'Bucket': bucket, 'Name': key}},
                FeatureTypes=[f.strip().upper() for f in features if f.strip()],
            )

            # Store raw Textract response
            s3.put_object(Bucket=bucket, Key=f"results/{job_id}.json", Body=json.dumps(resp))

            normalized = normalize(resp, doc_type)
            if callback_url:
                _post_callback(callback_url, { 'jobId': job_id, 'result': normalized }, cb_secret)
        except botocore.exceptions.ClientError as e:
            code = (e.response.get('Error') or {}).get('Code')
            msg_text = (e.response.get('Error') or {}).get('Message') or str(e)

            permanent = code in {
                'UnsupportedDocumentException',
                'BadDocumentException',
                'InvalidS3ObjectException',
                'DocumentTooLargeException',
            }

            # Always write a result marker so Django polling can stop.
            err_payload = {
                'error': {
                    'code': code or 'TextractClientError',
                    'message': msg_text,
                },
                'jobId': job_id,
                'objectKey': key,
                'docType': doc_type,
            }
            s3.put_object(Bucket=bucket, Key=f"results/{job_id}.json", Body=json.dumps(err_payload))

            if callback_url:
                try:
                    _post_callback(callback_url, { 'jobId': job_id, 'result': { 'error': err_payload['error'] } }, cb_secret)
                except Exception:
                    pass

            if permanent:
                # Do not raise: avoids useless retries/DLQ spam for permanent document issues.
                continue
            raise
